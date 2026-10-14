import { finalizeForTest, acceptForTest } from '../testSupport/quotePreparationFixture';
import {mkdtempSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {afterEach,beforeEach,describe,expect,it} from 'vitest';
import {NodeSqliteAdapter} from '../database/NodeSqliteAdapter';
import {applyPendingMigrations} from '../database/migrations';
import {CrmService} from '../crm/CrmService';
import {CatalogService} from '../commercial/CatalogService';
import {catalogMatchesQuery} from '../../shared/catalogDiscovery';
import {QuoteService} from '../commercial/QuoteService';
import {ProjectService} from '../projects/ProjectService';
import {OperationsService} from '../operations/OperationsService';
import {MaintenanceService} from '../operations/MaintenanceService';
import {HourPackService} from '../operations/HourPackService';
import {TimeService} from '../time/TimeService';
import {createWorkspacePaths} from '../workspace';
import {WorkflowService} from './WorkflowService';
import {DemoService} from './DemoService';
let db:NodeSqliteAdapter,root:string,crm:CrmService,catalog:CatalogService,quotes:QuoteService,projects:ProjectService,operations:OperationsService,workflow:WorkflowService,demo:DemoService,maintenance:MaintenanceService,hourPacks:HourPackService,time:TimeService;
const services=()=>({crm,catalog,quotes,projects,operations,workflow,maintenance,hourPacks,time});
beforeEach(()=>{root=mkdtempSync(join(tmpdir(),'atoumweb-workflow-'));db=new NodeSqliteAdapter(':memory:');db.exec('PRAGMA foreign_keys=ON;');applyPendingMigrations(db);crm=new CrmService(db);catalog=new CatalogService(db);quotes=new QuoteService(db,crm);projects=new ProjectService(db,createWorkspacePaths(root));operations=new OperationsService(db);workflow=new WorkflowService(db,crm,quotes,projects,operations);demo=new DemoService(db);demo.installTracking();maintenance=new MaintenanceService(db);hourPacks=new HourPackService(db);time=new TimeService(db);});
afterEach(()=>{db.close();const target=resolve(root);if(!target.startsWith(resolve(tmpdir())+'\\')&&!target.startsWith(resolve(tmpdir())+'/'))throw new Error('Unexpected temp path');rmSync(target,{recursive:true,force:true});});
describe('Stabilisation du parcours métier',()=>{
  it('précharge les prix validés et conserve les prix inconnus sur devis',()=>{
    expect(catalog.list()).toHaveLength(44);
    expect(catalog.getItem('atoumweb-vitrine').currentVersion?.priceCents).toBe(69900);
    expect(catalog.getItem('atoumweb-livre-blanc').currentVersion).toMatchObject({priceMode:'quote_only',priceCents:null});
    expect(catalog.getItem('atoumweb-ecommerce').currentVersion).toMatchObject({priceMode:'starting_from',priceCents:149000,defaultDepositPercent:30});
    expect(catalog.listOfferComponents('atoumweb-articles4-v1')[0].quantityMilli).toBe(4000);
  });
  it('référence plusieurs besoins vivants et les partage après conversion sans doublon',()=>{
    const org=crm.createOrganization({name:'Client réel',email:'avant@example.test'}),p=crm.createProspect({organizationId:org.id});
    workflow.saveNeed('prospect',p.id,{catalogItemId:'atoumweb-vitrine'});
    workflow.saveNeed('prospect',p.id,{catalogItemId:'atoumweb-article-seo'});
    const client=crm.convertProspectToClient(p.id);
    expect(crm.convertProspectToClient(p.id)).toMatchObject({clientId:client.clientId,createdClient:false});
    expect(workflow.needs('client',client.clientId)).toHaveLength(2);
    const need=workflow.needs('client',client.clientId)[0];
    workflow.saveNeed('client',client.clientId,{otherText:'Accompagnement'},need.id);
    expect(workflow.needs('prospect',p.id).find(n=>n.id===need.id)?.label).toBe('Accompagnement');
    workflow.removeNeed('prospect',p.id,need.id);
    expect(workflow.needs('client',client.clientId)).toHaveLength(1);
    crm.updateOrganization(org.id,{...org,email:'apres@example.test'});
    expect(workflow.identity('client',client.clientId).organization?.email).toBe('apres@example.test');
    expect(workflow.identity('prospect',p.id).organization?.email).toBe('apres@example.test');
  });
  it('R04B-09/10/12 : besoin prospect consultatif, ajout devis volontaire, aucun Projet automatique',()=>{
    const org=crm.createOrganization({name:'Prospect recherche métier'});
    const prospect=crm.createProspect({organizationId:org.id});
    const offer=catalog.getItem('atoumweb-vitrine');
    expect(offer.currentVersion?.status).toBe('published');
    workflow.saveNeed('prospect',prospect.id,{catalogItemId:offer.id});
    expect(workflow.needs('prospect',prospect.id)).toHaveLength(1);
    expect(quotes.list({prospectId:prospect.id})).toHaveLength(0);
    const beforeProjects=db.get<{n:number}>('SELECT COUNT(*) AS n FROM projects')!.n;
    expect(db.get<{n:number}>('SELECT COUNT(*) AS n FROM quote_lines')!.n).toBe(0);

    const draft=catalog.createVersion(offer.id,{
      priceMode:'fixed',priceCents:89900,
      commercialParameters:{clientNeed:'Nouvelle approche locale',keywords:'nouveau mot réservé au brouillon'},
    });
    expect(draft.status).toBe('draft');
    expect(catalogMatchesQuery(catalog.list().find(item=>item.id===offer.id)!,'nouveau mot réservé au brouillon')).toBe(false);
    expect(quotes.list({prospectId:prospect.id})).toHaveLength(0);

    const quote=quotes.create({prospectId:prospect.id,subject:'Devis choisi volontairement'});
    expect(quotes.get(quote.id).lines).toHaveLength(0);
    quotes.addCatalogLine(quote.id,offer.currentVersion!.id);
    const result=quotes.get(quote.id);
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].snapshot?.versionNumber).toBe(offer.currentVersion!.versionNumber);
    expect(workflow.needs('prospect',prospect.id)).toHaveLength(1);
    expect(db.get<{n:number}>('SELECT COUNT(*) AS n FROM projects')!.n).toBe(beforeProjects);
    expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
  });

  it('raccorde devis envoyé, acceptation et projet sans modifier les snapshots',()=>{
    const org=crm.createOrganization({name:'Boutique réelle'}),p=crm.createProspect({organizationId:org.id});
    const q=quotes.create({prospectId:p.id,subject:'Boutique'});
    quotes.addCatalogLine(q.id,'atoumweb-ecommerce-v1');
    quotes.addCatalogLine(q.id,'atoumweb-variable-simple-v1',{quantityMilli:2000});
    quotes.addCatalogLine(q.id,'atoumweb-images-v1');
    quotes.addCustomLine(q.id,{label:'Formation complémentaire',proposedUnitPriceCents:7500});
    const draft=quotes.get(q.id);
    expect(draft.specialTerms).toBeNull();
    expect(draft.lines[0].snapshot?.specialTerms).toContain('40 %');
    expect(draft.lines).toHaveLength(4);
    quotes.updateConditions(q.id,{specialTerms:'Conditions particulières validées'});
    finalizeForTest(db,quotes,q.id);
    quotes.markSent(q.id);
    expect(workflow.dashboard().some(e=>e.group==='Devis en attente de retour'&&e.target.entityId===q.id)).toBe(true);
    const accepted=acceptForTest(db,quotes,q.id);
    expect(quotes.list({clientAccountId:accepted.clientAccountId!}).map(q=>q.id)).toContain(q.id);
    expect(quotes.list({prospectId:p.id}).map(q=>q.id)).toContain(q.id);
    expect(workflow.dashboard().some(e=>e.group==='Devis en attente de retour'&&e.target.entityId===q.id)).toBe(false);
    expect(workflow.dashboard().some(e=>e.group==='Devis acceptés à démarrer'&&e.target.entityId===q.id)).toBe(true);
    const t=projects.createTemplate({name:'E-commerce',projectType:'ecommerce'});projects.publishTemplateVersion(t.currentVersion!.id);
    const project=projects.transformQuote({quoteId:q.id,templateVersionId:t.currentVersion!.id});
    expect(project.services).toHaveLength(4);
    expect(project.contractValueCents).toBe(accepted.contractValueCents);
    expect(projects.transformQuote({quoteId:q.id,templateVersionId:t.currentVersion!.id}).id).toBe(project.id);
    projects.changeProjectStatus(project.id,'waiting_client');
    expect(workflow.dashboard().some(e=>e.group==='Projets en attente Client'&&e.target.entityId===project.id)).toBe(true);
    const beforePublish=quotes.get(q.id);
    const v=catalog.createVersion('atoumweb-ecommerce',{priceMode:'fixed',priceCents:200000,specialTerms:'Nouvelles conditions'});catalog.publishVersion(v.id);
    expect(quotes.get(q.id)).toEqual(beforePublish);
    expect(projects.getProject(project.id).services).toEqual(project.services);
    expect(()=>quotes.updateConditions(q.id,{specialTerms:'Interdit'})).toThrow(/figé|copie/);
  });
  it.each(['vitrine','ecommerce','maintenance'] as const)('crée et purge le scénario %s en conservant références et vrais dossiers',async scenario=>{
    const real=crm.createOrganization({name:'Ne pas supprimer'}),client=crm.createClient({organizationId:real.id});
    const realBefore=db.get('SELECT * FROM client_accounts WHERE id=?',[client.id]);
    const refs=db.all('SELECT * FROM catalog_versions ORDER BY id');
    const result=demo.create(scenario,services());
    expect(quotes.get(result.quoteId).status).toBe('accepted');
    expect(time.summary({interventionId:result.interventionId}).totalSeconds).toBe(1800);
    const templates=db.all('SELECT * FROM project_templates');
    const backup=join(root,'before-demo-reset.sqlite');
    const reset=await demo.reset(async()=>{await db.backupTo(backup);return backup;});
    expect(existsSync(backup)).toBe(true);expect(reset.deleted).toBeGreaterThan(0);
    expect(demo.summary().total).toBe(0);
    expect(db.get('SELECT * FROM client_accounts WHERE id=?',[client.id])).toEqual(realBefore);
    expect(db.all('SELECT * FROM catalog_versions ORDER BY id')).toEqual(refs);
    expect(db.all('SELECT * FROM project_templates')).toEqual(templates);
    expect(db.get('SELECT id FROM projects WHERE id=?',[result.projectId])).toBeUndefined();
    expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
  });
  it('annule la purge quand la sauvegarde échoue',async()=>{
    demo.create('vitrine',services());const before=demo.summary();
    await expect(demo.reset(async()=>{throw Error('disque plein');})).rejects.toThrow('disque plein');
    expect(demo.summary()).toEqual(before);
  });
  it('refuse de supprimer une donnée demo référencée ensuite par un dossier réel',async()=>{
    const real=crm.createOrganization({name:'Organisation réelle'}),p=crm.createProspect({organizationId:real.id});
    const result=demo.create('vitrine',services());
    db.run('UPDATE prospects SET client_account_id=? WHERE id=?',[result.clientId,p.id]);
    const before=demo.summary();
    await expect(demo.reset(async()=>{const file=join(root,'backup.sqlite');await db.backupTo(file);return file;})).rejects.toThrow(/non demo/);
    expect(demo.summary()).toEqual(before);
    expect(db.get('SELECT id FROM prospects WHERE id=?',[p.id])).toBeDefined();
  });
  it('annule entièrement la création d’un devis si une ligne est invalide',()=>{
    const org=crm.createOrganization({name:'Client transactionnel'}),client=crm.createClient({organizationId:org.id});
    const before=quotes.list().length;
    expect(()=>quotes.createWithLines({clientAccountId:client.id,subject:'Devis atomique'},[
      {catalogVersionId:'atoumweb-vitrine-v1',input:{label:'Site vitrine'}},
      {catalogVersionId:'version-inconnue',input:{label:'Ligne invalide'}},
    ])).toThrow();
    expect(quotes.list()).toHaveLength(before);
  });
  it('marque aussi une saisie préremplie manuelle pour une purge sélective',async()=>{
    const batch=demo.beginCapture('prospect saisi manuellement');
    const org=crm.createOrganization({name:'DEMO — Saisie manuelle'});
    crm.createProspect({organizationId:org.id});
    demo.endCapture(batch);
    expect(demo.summary().total).toBeGreaterThan(0);
    await demo.reset(async()=>{const file=join(root,'manual-demo-backup.sqlite');await db.backupTo(file);return file;});
    expect(db.get('SELECT id FROM organizations WHERE id=?',[org.id])).toBeUndefined();
    expect(demo.summary().total).toBe(0);
  });
});
