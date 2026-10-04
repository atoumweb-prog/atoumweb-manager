import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {beforeEach,afterEach,describe,it,expect} from 'vitest';
import {NodeSqliteAdapter} from '../database/NodeSqliteAdapter';
import {applyPendingMigrations,MIGRATIONS,ensureMigrationTable} from '../database/migrations';
import {createWorkspacePaths} from '../workspace';
import {projectCompositionFixture} from '../testSupport/projectCompositionFixture';
import {finalizeForTest,acceptForTest} from '../testSupport/quotePreparationFixture';

let db:NodeSqliteAdapter,root:string,f:ReturnType<typeof projectCompositionFixture>;
beforeEach(()=>{root=mkdtempSync(join(tmpdir(),'atoumweb-commercial-project-test-'));db=new NodeSqliteAdapter(':memory:');db.exec('PRAGMA foreign_keys=ON');applyPendingMigrations(db);f=projectCompositionFixture(db,createWorkspacePaths(root));});
afterEach(()=>{db.close();if(!root.startsWith(join(tmpdir(),'atoumweb-commercial-project-test-')))throw Error('Unsafe temp');rmSync(root,{recursive:true,force:true});});
const prepare=(id:string)=>f.projects.commercial.prepare({quoteId:id});
const pages=(id:string)=>f.sites.listPages(id);
const sync=(id:string)=>f.projects.commercial.sync(id);
const state=()=>db.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
  .map(t=>({table:t.name,rows:db.all('SELECT * FROM '+t.name).map(r=>JSON.stringify(r)).sort()}));
const pageLine=(quoteId:string,quantity=2000)=>{f.quotes.addCatalogLine(quoteId,f.services[1].currentVersion!.id,{quantityMilli:quantity});return f.quotes.get(quoteId).lines.at(-1)!;};
const blogLine=(quoteId:string)=>{f.quotes.addCatalogLine(quoteId,f.blogItem.versions[0].id);return f.quotes.get(quoteId).lines.at(-1)!;};
const send=(id:string)=>{finalizeForTest(db,f.quotes,id);return f.quotes.markSent(id);};

describe('Lot 7B — même Projet prévisionnel et révisions commerciales',()=>{
 it('Prospect : 1 Site / 5 Pages sans Client ni plan 58 figé, reprises idempotentes',()=>{
  const q=f.createQuote(),p=prepare(q.id);expect(p.commercialState).toBe('provisional');expect(p.clientAccountId).toBeNull();expect(p.prospectId).toBe(q.prospectId);
  expect(db.all('SELECT id FROM client_accounts')).toHaveLength(0);expect(p.projectType).toBe('website');expect(p.status).toBe('to_prepare');
  expect(f.sites.list(p.id)).toHaveLength(1);expect(pages(p.id)).toHaveLength(5);expect(db.all('SELECT * FROM project_blueprint_plans')).toHaveLength(0);
  const before=state();expect(prepare(q.id).id).toBe(p.id);sync(p.id);expect(state()).toEqual(before);
 });
 it('une base absente ou des bases concurrentes ne créent aucun dossier ni Projet',()=>{
  const q=f.createQuote();f.quotes.removeLine(q.lines[0].id);const before=state();expect(()=>prepare(q.id)).toThrow(/base/);expect(state()).toEqual(before);
  f.quotes.addCatalogLine(q.id,f.offer.currentVersion!.id);f.quotes.addCatalogLine(q.id,f.offer.currentVersion!.id);const second=state();expect(()=>prepare(q.id)).toThrow(/concurrents/);expect(state()).toEqual(second);
 });
 it('ajout Page x2 puis 2→1 : même Projet, différentiel sans recréer la base',()=>{
  const q=f.createQuote(),p=prepare(q.id),baseIds=pages(p.id).map(p=>p.projectNodeId);const line=pageLine(q.id);sync(p.id);
  expect(pages(p.id)).toHaveLength(7);f.quotes.updateLine(line.id,{label:line.label,quantityMilli:1000});sync(p.id);expect(pages(p.id)).toHaveLength(6);
  expect(baseIds.every(id=>pages(p.id).some(p=>p.projectNodeId===id))).toBe(true);expect(db.all('SELECT id FROM projects')).toHaveLength(1);
  expect(f.projects.commercial.scope(p.id).conflicts).toHaveLength(0);
 });
 it('quantité augmentée, unités déjà travaillées conservées',()=>{
  const q=f.createQuote(),line=pageLine(q.id,1000),p=prepare(q.id);const extra=p.nodes.find(n=>n.name==='Page supplémentaire')!;
  f.projects.updateProjectNode(extra.id,{name:'Page personnalisée'});f.quotes.updateLine(line.id,{label:line.label,quantityMilli:3000});const updated=sync(p.id);
  expect(pages(p.id)).toHaveLength(8);expect(updated.nodes.find(n=>n.id===extra.id)!.name).toBe('Page personnalisée');
 });
 it('Blog vierge retiré proprement, prérequis supprimé, aucune FK ne bloque la ligne du devis',()=>{
  const q=f.createQuote(),p=prepare(q.id),line=blogLine(q.id);sync(p.id);expect(pages(p.id)).toHaveLength(6);
  f.quotes.removeLine(line.id);const result=sync(p.id);expect(pages(p.id)).toHaveLength(5);expect(result.prerequisites.some(p=>p.label.includes('Blog'))).toBe(false);
  expect(f.projects.commercial.scope(p.id).conflicts).toHaveLength(0);expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
 });
 it('Blog renommé : conflit visible, aucune suppression ; choix conserver traçable',()=>{
  const q=f.createQuote(),line=blogLine(q.id),p=prepare(q.id),blog=p.nodes.find(n=>n.name==='Blog')!;
  f.projects.updateProjectNode(blog.id,{name:'Actualités personnalisées'});f.quotes.removeLine(line.id);sync(p.id);
  expect(pages(p.id)).toHaveLength(6);const conflict=f.projects.commercial.scope(p.id).conflicts.find(c=>c.entityId===blog.id)!;
  expect(conflict.reason).toMatch(/décision requise/);expect(()=>f.projects.commercial.resolveConflict(p.id,conflict.id,'delete')).toThrow(/non vierge/);
  f.projects.commercial.resolveConflict(p.id,conflict.id,'keep');sync(p.id);expect(f.projects.commercial.scope(p.id).conflicts).toHaveLength(0);
  expect(f.projects.getProject(p.id).nodes.find(n=>n.id===blog.id)!.name).toBe('Actualités personnalisées');
 });
 it('travail descendant, statut changé ou temps enregistré : conservation avec conflit',()=>{
  const q=f.createQuote(),line=blogLine(q.id),p=prepare(q.id),blog=p.nodes.find(n=>n.name==='Blog')!;
  const child=p.nodes.find(n=>n.parentId===blog.id)!;f.projects.updateProjectNode(child.id,{status:'in_progress'});
  db.run("INSERT INTO time_sessions(id,project_id,project_node_id,category,started_at,ended_at,created_at,updated_at) VALUES('7b-time',?,?,'production','2026-10-03','2026-10-03','2026-10-03','2026-10-03')",[p.id,child.id]);
  f.quotes.removeLine(line.id);sync(p.id);expect(f.projects.getProject(p.id).nodes.some(n=>n.id===blog.id)).toBe(true);expect(f.projects.getProject(p.id).nodes.some(n=>n.id===child.id)).toBe(true);
  expect(f.projects.commercial.scope(p.id).conflicts.map(c=>c.entityId)).toEqual(expect.arrayContaining([child.id,blog.id]));
 });
 it('renommage Page/Site, ajout manuel et déplacement restent intacts',()=>{
  const q=f.createQuote(),p=prepare(q.id),site=f.sites.list(p.id)[0],home=pages(p.id).find(p=>p.role==='home')!;
  f.projects.updateProjectNode(home.projectNodeId,{name:'Bienvenue'});f.sites.update(site.id,{name:'Mon site'});
  const manual=f.projects.addProjectNode(p.id,{type:'module',displaySubtype:'page',name:'Page manuelle'}).nodes.find(n=>n.name==='Page manuelle')!;f.sites.linkPage(site.id,manual.id);
  pageLine(q.id);const next=sync(p.id);expect(pages(p.id)).toHaveLength(8);expect(next.nodes.find(n=>n.id===home.projectNodeId)!.name).toBe('Bienvenue');expect(f.sites.get(site.id).name).toBe('Mon site');
  expect(next.nodes.some(n=>n.id===manual.id)).toBe(true);
 });
 it('options disponibles sans effet, achat explicite et retrait différentiel',()=>{
  const q=f.createQuote(),p=prepare(q.id);expect(pages(p.id)).toHaveLength(5);
  const component=f.components.find(c=>c.isOptional&&c.serviceVersionId===f.services[1].currentVersion!.id)!;
  f.quotes.selectOfferOption(q.lines[0].id,component.id,{quantityMilli:2000});sync(p.id);expect(pages(p.id)).toHaveLength(7);
  const purchase=f.quotes.get(q.id).lines.find(l=>l.optionPurchase)!;f.quotes.removeLine(purchase.id);sync(p.id);expect(pages(p.id)).toHaveLength(5);
 });
 it('révision explicite : mêmes origines, mêmes nœuds, même Projet',()=>{
  const q=f.createQuote();pageLine(q.id);const p=prepare(q.id),oldIds=pages(p.id).map(p=>p.projectNodeId);send(q.id);
  const original=f.quotes.get(q.id),copy=f.quotes.duplicate(q.id,true);expect(copy.projectId).toBe(p.id);expect(copy.status).toBe('draft');
  expect(prepare(copy.id).id).toBe(p.id);expect(pages(p.id).map(p=>p.projectNodeId).sort()).toEqual(oldIds.sort());
  expect(f.quotes.get(q.id)).toEqual(original);expect(f.projects.commercial.scope(p.id).revisions.at(-1)!.commercialRevision).toBe(2);
 });
 it('duplication indépendante ne réutilise pas implicitement le Projet',()=>{
  const q=f.createQuote(),p=prepare(q.id),copy=f.quotes.duplicate(q.id);expect(copy.projectId).toBeNull();expect(prepare(copy.id).id).not.toBe(p.id);
 });
 it('acceptation révision : même Projet/ressources, Client créé, plan 58 figé ; deuxième appel sans mutation',()=>{
  const q=f.createQuote(),p=prepare(q.id);send(q.id);const next=f.quotes.duplicate(q.id,true);pageLine(next.id);send(next.id);
  const accepted=acceptForTest(db,f.quotes,next.id),project=f.projects.getProject(p.id);expect(accepted.projectId).toBe(p.id);expect(project.commercialState).toBe('frozen');
  expect(project.acceptedQuoteId).toBe(next.id);expect(project.clientAccountId).toBe(accepted.acceptedClientAccountId);expect(project.resourceRootPath).toBe(p.resourceRootPath);expect(project.status).toBe('to_prepare');
  expect(pages(p.id)).toHaveLength(7);expect(db.all('SELECT id FROM projects')).toHaveLength(1);expect(db.all('SELECT * FROM project_services')).toHaveLength(2);
  expect(db.get('SELECT source_quote_id FROM project_blueprint_plans WHERE project_id=?',[p.id])!.source_quote_id).toBe(next.id);
  const before=state();expect(f.quotes.accept(next.id).id).toBe(next.id);expect(f.projects.transformQuote({quoteId:next.id}).id).toBe(p.id);expect(state()).toEqual(before);
  expect(()=>sync(p.id)).toThrow(/prévisionnel/);expect(()=>f.quotes.duplicate(q.id,true)).toThrow(/figé/);
 });
 it('une ancienne révision ne peut plus être acceptée et créer un deuxième Projet',()=>{
  const q=f.createQuote();prepare(q.id);send(q.id);f.quotes.duplicate(q.id,true);const before=state();expect(()=>acceptForTest(db,f.quotes,q.id)).toThrow(/ancienne révision/);
  // Explicit fixture proof may change, commercial objects must not.
  expect(db.all('SELECT id FROM projects')).toHaveLength(1);expect(f.quotes.get(q.id).status).toBe('sent');expect(before.length).toBe(state().length);
 });
 it('acceptation avec conflit : transaction rollback y compris conversion Prospect/Client',()=>{
  const q=f.createQuote(),line=blogLine(q.id),p=prepare(q.id),blog=p.nodes.find(n=>n.name==='Blog')!;f.projects.updateProjectNode(blog.id,{name:'Modifié'});
  f.quotes.removeLine(line.id);sync(p.id);send(q.id);expect(()=>acceptForTest(db,f.quotes,q.id)).toThrow(/décision requise/);
  expect(f.quotes.get(q.id).status).toBe('sent');expect(db.all('SELECT id FROM client_accounts')).toHaveLength(0);expect(f.projects.getProject(p.id).commercialState).toBe('provisional');
 });
 it('aucun objet opérationnel ni activation par changement de statut',()=>{
  const q=f.createQuote(),p=prepare(q.id);expect(()=>f.projects.changeProjectStatus(p.id,'in_progress')).toThrow(/prévisionnel/);
  for(const table of ['maintenance_subscriptions','hour_packs','interventions','billing_items'])expect(db.all('SELECT * FROM '+table)).toEqual([]);
  const client=f.crm.convertProspectToClient(q.prospectId!).clientId;
  expect(()=>db.run("INSERT INTO service_requests(id,client_account_id,project_id,source,subject,priority,status,created_at,updated_at) VALUES('forbidden',?,?,'manual','Interdit','normal','new','fixture','fixture')",[client,p.id])).toThrow(/prévisionnel/);
 });
 it('Projet historique et devis ancien ne sont jamais requalifiés/recalculés',()=>{
  const q=f.createQuote(),p=f.convert(q.id),before=state();expect(p.commercialState).toBe('legacy');expect(()=>sync(p.id)).toThrow(/prévisionnel/);
  expect(()=>prepare(q.id)).toThrow(/historique|préparer/);expect(state()).toEqual(before);
 });
 it('les révisions figées sont immuables et les historiques de lignes retirées restent dans leur snapshot',()=>{
  const q=f.createQuote(),line=pageLine(q.id),p=prepare(q.id);f.quotes.removeLine(line.id);sync(p.id);
  expect(()=>db.run('UPDATE project_commercial_scope_revisions SET scope_sha256=scope_sha256 WHERE project_id=?',[p.id])).toThrow(/immutable/);
  expect(()=>db.run('DELETE FROM project_commercial_scope_revisions WHERE project_id=?',[p.id])).toThrow(/history/);
  expect(String(db.get('SELECT lines_json FROM project_commercial_scope_revisions WHERE project_id=? ORDER BY sequence LIMIT 1',[p.id])!.lines_json)).toContain(line.id);
 });
 it('migration 59 préserve toutes les anciennes colonnes/lignes/FK et crée zéro dossier historique',()=>{
  const legacy=new NodeSqliteAdapter(':memory:');try{
    ensureMigrationTable(legacy);for(const m of MIGRATIONS.filter(m=>m.id<=58)){if(m.disableForeignKeys)legacy.exec('PRAGMA foreign_keys=OFF');legacy.exec(m.sql);legacy.run('INSERT INTO schema_migrations(id,name,applied_at) VALUES(?,?,?)',[m.id,m.name,'fixture']);}
    legacy.run("INSERT INTO projects(id,project_number,name,project_type,status,commercial_mode,created_at,updated_at) VALUES('old-project','PRO-2026-OLD','Historique','internal','in_progress','internal','fixture','fixture')");
    legacy.run("INSERT INTO project_nodes(id,project_id,node_type,name,status,created_at,updated_at) VALUES('old-node','old-project','module','Page historique','todo','fixture','fixture')");
    const tables=legacy.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .map(t=>({name:t.name,columns:legacy.all<{name:string}>(`PRAGMA table_info(${t.name})`).map(c=>c.name),rows:legacy.all('SELECT * FROM '+t.name)}));
    expect(applyPendingMigrations(legacy).map(m=>m.id)).toEqual([59,60]);
    for(const t of tables)if(t.name!=='schema_migrations')expect(legacy.all(`SELECT ${t.columns.join(',')} FROM ${t.name}`)).toEqual(t.rows);
    expect(legacy.all('SELECT * FROM commercial_project_dossiers')).toEqual([]);expect(legacy.all('SELECT * FROM project_commercial_scope_revisions')).toEqual([]);
    expect(legacy.get('PRAGMA integrity_check')).toEqual({integrity_check:'ok'});expect(legacy.all('PRAGMA foreign_key_check')).toEqual([]);
    const before=legacy.all('SELECT * FROM projects');expect(applyPendingMigrations(legacy)).toEqual([]);expect(legacy.all('SELECT * FROM projects')).toEqual(before);
  }finally{legacy.close();}
 });
 it('quantité diminuée sur une unité renommée puis réaugmentée : conflit fermé par retour au périmètre',()=>{
  const q=f.createQuote(),line=pageLine(q.id),p=prepare(q.id),extra=p.nodes.find(n=>n.name==='Page supplémentaire (2)')!;
  f.projects.updateProjectNode(extra.id,{name:'Personnalisée'});f.quotes.updateLine(line.id,{label:line.label,quantityMilli:1000});sync(p.id);
  expect(f.projects.commercial.scope(p.id).conflicts.some(c=>c.entityId===extra.id)).toBe(true);
  f.quotes.updateLine(line.id,{label:line.label,quantityMilli:2000});sync(p.id);
  expect(f.projects.commercial.scope(p.id).conflicts).toHaveLength(0);expect(pages(p.id)).toHaveLength(7);expect(f.projects.getProject(p.id).nodes.find(n=>n.id===extra.id)!.name).toBe('Personnalisée');
 });
 it('détacher puis revendre le même service : identités distinctes et travail manuel conservé',()=>{
  const q=f.createQuote(),line=blogLine(q.id),p=prepare(q.id),blog=p.nodes.find(n=>n.name==='Blog')!;
  f.projects.updateProjectNode(blog.id,{name:'À garder'});f.quotes.removeLine(line.id);sync(p.id);
  const conflict=f.projects.commercial.scope(p.id).conflicts.find(c=>c.entityId===blog.id)!;f.projects.commercial.resolveConflict(p.id,conflict.id,'detach');
  blogLine(q.id);sync(p.id);expect(pages(p.id)).toHaveLength(7);expect(f.projects.getProject(p.id).nodes.some(n=>n.id===blog.id&&n.name==='À garder')).toBe(true);
  expect(f.projects.getProject(p.id).nodes.filter(n=>n.name==='Blog')).toHaveLength(1);
 });
 it('archivage explicite conserve la ligne historique et masque la Page',()=>{
  const q=f.createQuote(),line=blogLine(q.id),p=prepare(q.id),blog=p.nodes.find(n=>n.name==='Blog')!;
  f.projects.updateProjectNode(blog.id,{name:'Archiver'});f.quotes.removeLine(line.id);sync(p.id);
  const conflict=f.projects.commercial.scope(p.id).conflicts.find(c=>c.entityId===blog.id)!;f.projects.commercial.resolveConflict(p.id,conflict.id,'archive');
  expect(db.get('SELECT archived_at FROM project_nodes WHERE id=?',[blog.id])!.archived_at).toBeTruthy();expect(f.projects.getProject(p.id).nodes.some(n=>n.id===blog.id)).toBe(false);
  expect(pages(p.id)).toHaveLength(5);
 });
 it('choix manuel de blueprint conservé lors de la synchronisation et du gel accepté',()=>{
  const q=f.createQuote(),v=f.projects.createTemplate({name:'Manuel 7B',projectType:'website'}).versions[0];
  f.projects.addTemplateNode(v.id,{type:'task',name:'Travail explicite'});f.projects.publishTemplateVersion(v.id);
  const p=f.projects.commercial.prepare({quoteId:q.id,templateVersionId:v.id});f.quotes.updateConditions(q.id,{prerequisitesText:'Prérequis manuel'});sync(p.id);send(q.id);acceptForTest(db,f.quotes,q.id);
  const plan=JSON.parse(String(db.get('SELECT plan_json FROM project_blueprint_plans WHERE project_id=?',[p.id])!.plan_json));expect(plan.base.templateVersionId).toBe(v.id);
 });
 it('révision avec option achetée : provenance persistée, quantité conservée et origine finale exacte',()=>{
  const q=f.createQuote(),component=f.components.find(c=>c.isOptional&&c.serviceVersionId===f.services[1].currentVersion!.id)!;
  f.quotes.selectOfferOption(q.lines[0].id,component.id,{quantityMilli:2000});const p=prepare(q.id),ids=pages(p.id).map(p=>p.projectNodeId);
  send(q.id);const next=f.quotes.duplicate(q.id,true);prepare(next.id);expect(pages(p.id).map(p=>p.projectNodeId).sort()).toEqual(ids.sort());
  send(next.id);acceptForTest(db,f.quotes,next.id);const option=f.quotes.get(next.id).lines.find(l=>l.optionPurchase)!;
  expect(f.projects.getProject(p.id).nodes.flatMap(n=>n.blueprintSources ?? []).some(s=>s.quoteLineId===option.id&&s.optionPurchase&&s.quantityMilli===2000)).toBe(true);
 });
 it('une acceptation échouée pendant le gel rollback contrat, Client et Projet, puis peut être rejouée',()=>{
  const q=f.createQuote(),p=prepare(q.id);send(q.id);
  db.exec("CREATE TRIGGER fail_freeze BEFORE INSERT ON project_blueprint_plans BEGIN SELECT RAISE(ABORT,'Fixture failure'); END;");
  expect(()=>acceptForTest(db,f.quotes,q.id)).toThrow(/Fixture failure/);expect(db.all('SELECT id FROM client_accounts')).toHaveLength(0);
  expect(f.quotes.get(q.id).status).toBe('sent');expect(f.projects.getProject(p.id).commercialState).toBe('provisional');
  db.exec('DROP TRIGGER fail_freeze');acceptForTest(db,f.quotes,q.id);expect(f.projects.getProject(p.id).commercialState).toBe('frozen');
 });
});
