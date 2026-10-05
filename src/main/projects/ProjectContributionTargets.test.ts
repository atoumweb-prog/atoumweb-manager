import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {beforeEach,afterEach,describe,it,expect} from 'vitest';
import {NodeSqliteAdapter} from '../database/NodeSqliteAdapter';
import {applyPendingMigrations} from '../database/migrations';
import {createWorkspacePaths} from '../workspace';
import {contributionFixture} from '../testSupport/contributionFixture';
import {finalizeForTest,acceptForTest} from '../testSupport/quotePreparationFixture';
import {ProjectContributionTargetService} from './ProjectContributionTargetService';
import {OperationalConfigurationService} from './OperationalConfigurationService';
import {TimeCorrectionService} from '../time/TimeCorrectionService';
import {TimeSwitchService} from '../time/TimeSwitchService';

let db:NodeSqliteAdapter,root:string,f:ReturnType<typeof contributionFixture>;
beforeEach(()=>{root=mkdtempSync(join(tmpdir(),'atoumweb-8a1-test-'));db=new NodeSqliteAdapter(':memory:');db.exec('PRAGMA foreign_keys=ON');applyPendingMigrations(db);f=contributionFixture(db,createWorkspacePaths(root));});
afterEach(()=>{db.close();if(!root.startsWith(join(tmpdir(),'atoumweb-8a1-test-')))throw Error('Unsafe temp');rmSync(root,{recursive:true,force:true});});
const logical=()=>JSON.stringify(db.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").map(t=>({name:t.name,rows:db.all('SELECT * FROM '+t.name).map(r=>JSON.stringify(r)).sort()})));
const actions=(id:string)=>f.projects.getProject(id).nodes.filter(n=>n.operational?.action);
const choose=(id:string,origin:string,siteIndex=0,page=false)=>{
 const scope=f.projects.commercial.scope(id),t=scope.targets!.find(t=>t.lineOrigin===origin)!,s=scope.targetChoices!.sites[siteIndex];
 return f.projects.commercial.assignTarget(id,{lineOrigin:origin,slot:t.slot,unitIndex:t.unitIndex,author:'Fixture AtoumWeb',siteId:s.id,siteOwnerOrigin:s.ownerOrigin,siteOwnerSlot:s.ownerSlot,pageNodeId:page?scope.targetChoices!.pages.find(p=>p.siteId===s.id)!.id:null});
};
describe('Lot 8A.1 — politiques explicites et destinations',()=>{
 it.each([
  ['AW-WEB-VITRINE',21,1470,5],['AW-LP-BASE',13,765,1],['AW-ECOM-BASE',20,2550,4],
  ['AW-MARIAGE-ESS',9,630,1],['AW-MARIAGE-GRAND',10,1020,1],['AW-MARIAGE-HISTOIRE',10,1380,1],
 ] as const)('%s : structure et arithmétique exactes, rejeu neutre',(code,count,min,pages)=>{
  const q=f.createQuote(code),p=f.prepare(q.id);expect(actions(p.id)).toHaveLength(count);expect(p.estimatedMinutes).toBe(min);expect(f.sites.list(p.id)).toHaveLength(1);expect(f.sites.listPages(p.id)).toHaveLength(pages);
  expect(JSON.parse(String(db.get('SELECT plan_json FROM project_commercial_scope_revisions WHERE project_id=?',[p.id])!.plan_json)).schemaVersion).toBe(2);
  const before=logical();f.prepare(q.id);expect(logical()).toBe(before);
 });
 it('Landing Site existant : choix préalable explicite, aucune création Site',()=>{
  const policy=structuredClone(f.policies.get('AW-LP-BASE')!);policy.destinationSlots[0].autoSite='never';
  f.references.link(f.items.get('AW-LP-BASE')!.versions[0].id,f.models.get('AW-LP-BASE')!,f.versions.get('AW-LP-BASE')!,{fixture:true,configuration:policy});
  const q=f.createQuote('AW-LP-BASE'),p=f.prepare(q.id);expect(f.sites.list(p.id)).toHaveLength(0);
  const manual=f.sites.create(p.id,{name:'Site existant choisi'}),t=f.projects.commercial.scope(p.id).targets![0];
  f.projects.commercial.assignTarget(p.id,{lineOrigin:t.lineOrigin,slot:t.slot,unitIndex:1,author:'Test',siteId:manual.id});
  expect(f.sites.list(p.id)).toHaveLength(1);expect(f.sites.listPages(p.id)).toHaveLength(1);expect(f.sites.listPages(p.id)[0].projectSiteId).toBe(manual.id);
 });
 it('Base pending : choix explicite de création matérialise uniquement son occurrence',()=>{
  const policy=structuredClone(f.policies.get('AW-LP-BASE')!);policy.destinationSlots[0].autoSite='never';
  f.references.link(f.items.get('AW-LP-BASE')!.versions[0].id,f.models.get('AW-LP-BASE')!,f.versions.get('AW-LP-BASE')!,{fixture:true,configuration:policy});
  const q=f.createQuote('AW-LP-BASE'),p=f.prepare(q.id),t=f.projects.commercial.scope(p.id).targets![0];
  f.projects.commercial.assignTarget(p.id,{lineOrigin:t.lineOrigin,slot:t.slot,unitIndex:1,author:'Test',createSite:true});expect(f.sites.list(p.id)).toHaveLength(1);expect(f.sites.listPages(p.id)).toHaveLength(1);
 });
 it('deux Vitrines distinctes : aucun Site, Page ni conteneur fusionné',()=>{
  const q=f.createQuote();f.add(q.id,'AW-WEB-VITRINE');const p=f.prepare(q.id);expect(actions(p.id)).toHaveLength(42);expect(p.estimatedMinutes).toBe(2940);expect(f.sites.list(p.id)).toHaveLength(2);expect(f.sites.listPages(p.id)).toHaveLength(10);expect(p.templateVersionId).toBeNull();
  const plan=JSON.parse(String(db.get('SELECT plan_json FROM project_commercial_scope_revisions WHERE project_id=?',[p.id])!.plan_json));expect(plan.bases).toHaveLength(2);
  const groups=plan.bases.map((c:{key:string})=>new Set(db.all('SELECT project_node_id FROM project_prepared_node_bindings WHERE project_id=? AND contribution_key=?',[p.id,c.key]).map(r=>r.project_node_id)));
  expect([...groups[0]].every(id=>!groups[1].has(id))).toBe(true);
 });
 it('A quantité 2 refusée sans mutation',()=>{const q=f.createQuote();f.quotes.updateLine(q.lines[0].id,{label:q.lines[0].label,quantityMilli:2000});const before=logical();expect(()=>f.prepare(q.id)).toThrow(/Quantité/);expect(logical()).toBe(before);});
 it('A sans blueprint réel ou avec liaison incompatible bloquée',()=>{const q=f.createQuote();db.run('DELETE FROM catalog_project_blueprints WHERE catalog_version_id=?',[q.lines[0].catalogVersionId!]);const before=logical();expect(()=>f.prepare(q.id)).toThrow(/structurel|structurelle/);expect(logical()).toBe(before);});
 it('Vitrine + option disponible : aucun effet ; achetée x2 + Blog : 34 / 1860 / 8 Pages',()=>{
  const q=f.createQuote(),p=f.prepare(q.id);expect(actions(p.id)).toHaveLength(21);
  const component=f.catalog.listOfferComponents(f.items.get('AW-WEB-VITRINE')!.versions[0].id)[0];f.quotes.selectOfferOption(q.lines[0].id,component.id,{quantityMilli:2000});f.add(q.id,'AW-WEB-BLOG');
  const next=f.prepare(q.id);expect(actions(p.id)).toHaveLength(34);expect(next.estimatedMinutes).toBe(1860);expect(f.sites.listPages(p.id)).toHaveLength(8);expect(actions(p.id).filter(n=>n.operational!.code.endsWith('PAGE-SUP')).every(n=>n.operational!.optionPurchase?.state==='purchased')).toBe(true);
 });
 it('Vitrine + une Page + Blog : 30 / 1755 / 7 Pages',()=>{const q=f.createQuote();f.add(q.id,'AW-WEB-PAGE-SUP');f.add(q.id,'AW-WEB-BLOG');const p=f.prepare(q.id);expect(actions(p.id)).toHaveLength(30);expect(p.estimatedMinutes).toBe(1755);expect(f.sites.listPages(p.id)).toHaveLength(7);});
 it('Blog quantité 2 refusée',()=>{const q=f.createQuote();f.add(q.id,'AW-WEB-BLOG',2000);expect(()=>f.prepare(q.id)).toThrow(/Quantité/);});
 it('Blog par deux lignes sur le même Site refusé sans mutation',()=>{const q=f.createQuote();f.add(q.id,'AW-WEB-BLOG');f.add(q.id,'AW-WEB-BLOG');const before=logical();expect(()=>f.prepare(q.id)).toThrow(/maximum 1/);expect(logical()).toBe(before);});
 it('deux bases + addon pending ; choix explicite isole la destination',()=>{
  const q=f.createQuote();f.add(q.id,'AW-WEB-VITRINE');const withAddon=f.add(q.id,'AW-WEB-PAGE-SUP'),line=withAddon.lines.at(-1)!;const p=f.prepare(q.id);
  expect(f.sites.listPages(p.id)).toHaveLength(10);expect(f.projects.commercial.scope(p.id).targets!.find(t=>t.lineOrigin===line.id)!.state).toBe('pending');
  const task=actions(p.id).find(n=>n.operational!.lineOrigin===line.id)!;expect(()=>f.time.start({projectNodeId:task.id,category:'development'})).toThrow(/cible/);
  choose(p.id,line.id,1);expect(f.sites.listPages(p.id)).toHaveLength(11);expect(f.projects.commercial.scope(p.id).targets!.find(t=>t.lineOrigin===line.id)!.selectionMode).toBe('explicit');
 });
 it('un Blog sur chacun de deux Sites : cibles explicites, pas de fusion',()=>{
  const q=f.createQuote();f.add(q.id,'AW-WEB-VITRINE');const a=f.add(q.id,'AW-WEB-BLOG').lines.at(-1)!;const b=f.add(q.id,'AW-WEB-BLOG').lines.at(-1)!;const p=f.prepare(q.id);choose(p.id,a.id,0);choose(p.id,b.id,1);expect(f.sites.listPages(p.id)).toHaveLength(12);
 });
 it.each([['AW-ECOM-PROD-SIMPLE',2580],['AW-ECOM-PROD-VAR',2595]] as const)('Woo + %s : module dans Page explicite, zéro Page ajoutée',(code,min)=>{
  const q=f.createQuote('AW-ECOM-BASE'),l=f.add(q.id,code).lines.at(-1)!,p=f.prepare(q.id);choose(p.id,l.id,0,true);
  expect(actions(p.id)).toHaveLength(23);expect(f.projects.getProject(p.id).estimatedMinutes).toBe(min);expect(f.sites.listPages(p.id)).toHaveLength(4);
  const c=JSON.parse(String(db.get('SELECT plan_json FROM project_commercial_scope_revisions WHERE project_id=? ORDER BY sequence DESC LIMIT 1',[p.id])!.plan_json)).contributions.find((c:{lineOrigin:string})=>c.lineOrigin===l.id);
  const node=db.get('SELECT n.parent_id FROM project_prepared_node_bindings b JOIN project_nodes n ON n.id=b.project_node_id WHERE b.project_id=? AND b.contribution_key=?',[p.id,c.key])!;
  expect(f.sites.listPages(p.id).some(page=>page.projectNodeId===node.parent_id)).toBe(true);
 });
 it('Landing + Section : Page parente explicite, 16 / 800 / 1 Page',()=>{const q=f.createQuote('AW-LP-BASE'),l=f.add(q.id,'AW-LP-SECTION').lines.at(-1)!,p=f.prepare(q.id);choose(p.id,l.id,0,true);expect(actions(p.id)).toHaveLength(16);expect(f.projects.getProject(p.id).estimatedMinutes).toBe(800);expect(f.sites.listPages(p.id)).toHaveLength(1);});
 it('Woo requis : Landing et Site manuel sans capacités refusés même si un Woo existe ailleurs',()=>{
  const q=f.createQuote('AW-LP-BASE');f.add(q.id,'AW-ECOM-BASE');const l=f.add(q.id,'AW-ECOM-PROD-SIMPLE').lines.at(-1)!,p=f.prepare(q.id),scope=f.projects.commercial.scope(p.id),landing=scope.targetChoices!.sites.find(s=>!s.provides.includes('woocommerce'))!,page=scope.targetChoices!.pages.find(x=>x.siteId===landing.id)!;
  expect(()=>f.projects.commercial.assignTarget(p.id,{lineOrigin:l.id,slot:'destination',unitIndex:1,author:'Test',siteId:landing.id,siteOwnerOrigin:landing.ownerOrigin,siteOwnerSlot:landing.ownerSlot,pageNodeId:page.id})).toThrow(/Capacités/);
  const manual=f.sites.create(p.id,{name:'WooCommerce'});expect(f.projects.commercial.scope(p.id).targetChoices!.sites.find(s=>s.id===manual.id)!.provides).toEqual([]);
 });
 it.each(['AW-CONT-ART-SEO','AW-CONT-PACK4-SEO','AW-BRAND-LOGO','AW-SEO-AUDIT','AW-APP-DEV'])('C %s : actions sans faux Site/Page',code=>{const q=f.createQuote(code),p=f.prepare(q.id);expect(actions(p.id).length).toBeGreaterThan(0);expect(f.sites.list(p.id)).toEqual([]);expect(f.sites.listPages(p.id)).toEqual([]);expect(f.projects.commercial.scope(p.id).targets).toEqual([]);});
 it('C liée accidentellement à un blueprint bloquée',()=>{const q=f.createQuote('AW-BRAND-LOGO');db.run('INSERT INTO catalog_project_blueprints(id,catalog_version_id,template_version_id,role,created_at) VALUES(?,?,?,\'base\',?)',['bad-c',q.lines[0].catalogVersionId!,f.versions.get('AW-WEB-VITRINE')!,'2026-10-04']);expect(()=>f.prepare(q.id)).toThrow(/association explicite|C\/D|Rôle/);});
 it('D pending : cadrage oui ; intégration, manuel, switch, statut et clôture phase bloqués',()=>{
  const q=f.createQuote('AW-DEVWP-FONCTION'),p=f.prepare(q.id),a=actions(p.id),first=a.find(n=>n.operational!.targetRequirement?.target==='none')!,dependent=a.find(n=>n.operational!.targetRequirement?.target==='site')!;
  expect(f.time.start({projectNodeId:first.id,category:'development'}).projectNodeId).toBe(first.id);
  expect(()=>new TimeSwitchService(db,f.time).switchTo({projectNodeId:dependent.id,category:'development'})).toThrow(/cible/);expect(f.time.active()!.projectNodeId).toBe(first.id);f.time.stop(f.time.active()!.id);
  expect(()=>f.time.addManual({projectNodeId:dependent.id,category:'development',startedAt:'2026-10-04T08:00:00Z',endedAt:'2026-10-04T09:00:00Z'})).toThrow(/cible/);
  expect(()=>f.projects.updateProjectNode(dependent.id,{status:'done'})).toThrow(/cible/);expect(()=>f.projects.completeProjectPhase(dependent.parentId!)).toThrow(/cible/);
 });
 it('D acceptée pending : première affectation opérationnelle historisée sans révision commerciale',()=>{
  const q=f.createQuote('AW-DEVWP-FONCTION'),p=f.prepare(q.id);finalizeForTest(db,f.quotes,q.id);f.quotes.markSent(q.id);acceptForTest(db,f.quotes,q.id);
  const before=db.all('SELECT * FROM project_commercial_scope_revisions WHERE project_id=?',[p.id]),commercial=db.all('SELECT * FROM quote_lines WHERE quote_id=?',[q.id]);
  const manual=f.sites.create(p.id,{name:'Site manuel'}),scope=f.projects.commercial.scope(p.id),t=scope.targets![0];
  f.projects.commercial.assignTarget(p.id,{lineOrigin:t.lineOrigin,slot:t.slot,unitIndex:1,author:'AtoumWeb test',siteId:manual.id});
  expect(db.all('SELECT * FROM project_commercial_scope_revisions WHERE project_id=?',[p.id])).toEqual(before);expect(db.all('SELECT * FROM quote_lines WHERE quote_id=?',[q.id])).toEqual(commercial);
  const log=JSON.parse(String(db.get("SELECT metadata_json FROM activity_log WHERE entity_id=? AND action='contribution_target_assigned'",[p.id])!.metadata_json));expect(log.author).toBe('AtoumWeb test');expect(log.old.state).toBe('pending');expect(log.new.siteId).toBe(manual.id);expect(log.policy.schemaVersion).toBe(1);expect(log.capabilities).toEqual([]);
  const a=actions(p.id).find(n=>n.operational!.targetRequirement?.target==='site')!;expect(f.time.start({projectNodeId:a.id,category:'development'}).projectNodeId).toBe(a.id);
  expect(()=>f.projects.commercial.assignTarget(p.id,{lineOrigin:t.lineOrigin,slot:t.slot,unitIndex:1,author:'Test',siteId:manual.id})).toThrow(/première affectation/);
 });
 it('B pending ne peut être acceptée sans sa destination de préparation',()=>{const q=f.createQuote('AW-WEB-PAGE-SUP');const p=f.prepare(q.id);finalizeForTest(db,f.quotes,q.id);f.quotes.markSent(q.id);expect(()=>acceptForTest(db,f.quotes,q.id)).toThrow(/Préparation incomplète/);expect(f.projects.getProject(p.id).commercialState).toBe('provisional');});
 it('cible après effet structurel utilisée : changement refusé',()=>{const q=f.createQuote();const l=f.add(q.id,'AW-WEB-PAGE-SUP').lines.at(-1)!,p=f.prepare(q.id),manual=f.sites.create(p.id,{name:'Autre'});expect(()=>f.projects.commercial.assignTarget(p.id,{lineOrigin:l.id,slot:'destination',unitIndex:1,author:'Test',siteId:manual.id})).toThrow(/réaffectation|Capacités/);});
 it('ajout seconde base après auto-choix : confirmation explicite requise',()=>{const q=f.createQuote();const l=f.add(q.id,'AW-WEB-PAGE-SUP').lines.at(-1)!,p=f.prepare(q.id);f.add(q.id,'AW-WEB-VITRINE');expect(()=>f.prepare(q.id)).toThrow(/ambiguë/);choose(p.id,l.id,0);expect(f.sites.list(p.id)).toHaveLength(2);});
 it('renommages/ajout/estimation humains et redémarrage préservés',()=>{const q=f.createQuote(),p=f.prepare(q.id),page=f.sites.listPages(p.id)[0],a=actions(p.id)[0];f.projects.updateProjectNode(page.projectNodeId,{name:'Page humaine'});f.projects.updateProjectNode(a.id,{estimatedMinutes:333});f.sites.create(p.id,{name:'Site manuel'});const before=logical();f.prepare(q.id);expect(logical()).toBe(before);expect(f.projects.getProject(p.id).nodes.find(n=>n.id===a.id)!.estimatedMinutes).toBe(333);});
 it('révision de configuration versionnée, ancien Projet épinglé',()=>{const q=f.createQuote(),p=f.prepare(q.id),i=f.items.get('AW-WEB-VITRINE')!,policy=structuredClone(f.policies.get('AW-WEB-VITRINE')!);policy.policySource='Nouvelle configuration synthétique';f.references.link(i.versions[0].id,f.models.get('AW-WEB-VITRINE')!,f.versions.get('AW-WEB-VITRINE')!,{fixture:true,configuration:policy});const before=logical();f.prepare(q.id);expect(logical()).toBe(before);expect(db.all('SELECT * FROM catalog_operational_links WHERE catalog_version_id=?',[i.versions[0].id])).toHaveLength(2);});
 it('SQL : cible inter-Projet et mutation identité refusées',()=>{const p=f.prepare(f.createQuote().id),other=f.prepare(f.createQuote().id),row=db.get('SELECT * FROM project_contribution_targets WHERE project_id=?',[p.id])!;expect(()=>db.run('UPDATE project_contribution_targets SET target_site_id=? WHERE project_id=?',[f.sites.list(other.id)[0].id,p.id])).toThrow(/relations/);expect(()=>db.run('UPDATE project_contribution_targets SET line_origin_id=? WHERE project_id=?',['other',p.id])).toThrow(/identity/);expect(row.state).toBe('active');});
 it('manifeste : dry-run, idempotence et refus du jeton périmé',()=>{
  const service=new OperationalConfigurationService(db),i=f.items.get('AW-WEB-VITRINE')!;
  const manifest={schemaVersion:1 as const,sourceSHA256:f.reference.source.sha256,decisionReference:'Fixture',entries:[{code:i.canonicalCode!,catalogVersionId:i.versions[0].id,modelVersionId:f.models.get('AW-WEB-VITRINE')!,blueprintVersionId:f.versions.get('AW-WEB-VITRINE')!,configuration:f.policies.get('AW-WEB-VITRINE')!}]};
  const dry=service.simulate(manifest);expect(dry.rows[0].action).toBe('revision');service.apply(manifest,dry.planSHA256);const before=logical();const replay=service.simulate(manifest);expect(replay.rows[0].action).toBe('unchanged');service.apply(manifest,replay.planSHA256);expect(logical()).toBe(before);expect(()=>service.apply(manifest,dry.planSHA256)).toThrow(/modifié/);
 });
 it('D sans validation de mapping impossible à associer',()=>{const code='AW-DEVWP-FONCTION',p=structuredClone(f.policies.get(code)!);delete p.actionRequirementsReview;expect(()=>f.references.link(f.items.get(code)!.versions[0].id,f.models.get(code)!,null,{configuration:p})).toThrow(/non validé/);});
 it('Page parente déplacée : intégration et reprise chrono bloquées, sans fallback',()=>{
  const q=f.createQuote('AW-LP-BASE'),l=f.add(q.id,'AW-LP-SECTION').lines.at(-1)!,p=f.prepare(q.id);choose(p.id,l.id,0,true);
  const action=actions(p.id).find(n=>n.operational!.lineOrigin===l.id)!,session=f.time.start({projectNodeId:action.id,category:'development'});f.time.pause(session.id,'other');
  const t=f.projects.commercial.scope(p.id).targets!.find(t=>t.lineOrigin===l.id)!,manual=f.sites.create(p.id,{name:'Autre Site'});f.sites.unlinkPage(t.pageNodeId!);f.sites.linkPage(manual.id,t.pageNodeId!);
  expect(()=>f.time.resume(session.id)).toThrow(/Page parente/);expect(f.projects.commercial.scope(p.id).targets!.find(t=>t.lineOrigin===l.id)!.issue).toMatch(/Page parente/);expect(()=>f.projects.updateProjectNode(action.id,{status:'done'})).toThrow(/Page parente/);
 });
 it('retrait vierge propre, retrait travaillé : temps et provenance conservés avec conflit',()=>{
  const q=f.createQuote(),l=f.add(q.id,'AW-WEB-PAGE-SUP').lines.at(-1)!,p=f.prepare(q.id);f.quotes.removeLine(l.id);f.prepare(q.id);expect(actions(p.id)).toHaveLength(21);expect(f.sites.listPages(p.id)).toHaveLength(5);
  const l2=f.add(q.id,'AW-WEB-PAGE-SUP').lines.at(-1)!;f.prepare(q.id);const a=actions(p.id).find(n=>n.operational!.lineOrigin===l2.id)!;const session=f.time.addManual({projectNodeId:a.id,category:'development',startedAt:'2026-10-04T08:00:00Z',endedAt:'2026-10-04T08:10:00Z'});
  f.quotes.removeLine(l2.id);f.prepare(q.id);expect(f.time.get(session.id).durationSeconds).toBe(600);expect(f.projects.commercial.scope(p.id).conflicts.some(c=>c.entityId===a.id)).toBe(true);expect(db.get('SELECT project_node_id FROM project_action_instances WHERE project_node_id=?',[a.id])).toBeDefined();
 });
 it('correction du temps ne peut rattacher une session à une D pending',()=>{
  const q=f.createQuote('AW-DEVWP-FONCTION'),p=f.prepare(q.id),first=actions(p.id).find(n=>n.operational!.targetRequirement?.target==='none')!,dependent=actions(p.id).find(n=>n.operational!.targetRequirement?.target==='site')!;
  const s=f.time.addManual({projectNodeId:first.id,category:'development',startedAt:'2026-10-04T08:00:00Z',endedAt:'2026-10-04T08:10:00Z'});expect(()=>new TimeCorrectionService(db,f.time).update(s.id,{projectNodeId:dependent.id,category:'development',startedAt:s.startedAt,endedAt:s.endedAt!})).toThrow(/cible/);expect(f.time.get(s.id).projectNodeId).toBe(first.id);
 });

 it('révision commerciale : origines, IDs et choix conservés sans mutation du devis source',()=>{
  const q=f.createQuote('AW-LP-BASE'),l=f.add(q.id,'AW-LP-SECTION').lines.at(-1)!,p=f.prepare(q.id);choose(p.id,l.id,0,true);
  const targets=f.projects.commercial.scope(p.id).targets!.map(t=>[t.lineOrigin,t.siteId,t.pageNodeId]);const ids=f.projects.getProject(p.id).nodes.map(n=>n.id).sort();
  const source=f.quotes.get(q.id),revision=f.quotes.duplicate(q.id,true);f.prepare(revision.id);
  expect(f.projects.commercial.scope(p.id).targets!.map(t=>[t.lineOrigin,t.siteId,t.pageNodeId])).toEqual(targets);expect(f.projects.getProject(p.id).nodes.map(n=>n.id).sort()).toEqual(ids);expect(f.quotes.get(q.id)).toEqual(source);
 });
 it('ajout seconde base actualise le principal sans réinterpréter la première',()=>{
  const q=f.createQuote(),p=f.prepare(q.id),oldIds=f.sites.listPages(p.id).map(x=>x.projectNodeId);f.add(q.id,'AW-WEB-VITRINE');f.prepare(q.id);
  expect(f.projects.getProject(p.id).templateVersionId).toBeNull();expect(oldIds.every(id=>f.sites.listPages(p.id).some(x=>x.projectNodeId===id))).toBe(true);
 });
 it('A pending : même cadrage none interdit sans sa structure obligatoire',()=>{
  const code='AW-LP-BASE',policy=structuredClone(f.policies.get(code)!);policy.destinationSlots[0].autoSite='never';for(const r of Object.values(policy.actionRequirements)){r.target='none';delete r.slot;}
  f.references.link(f.items.get(code)!.versions[0].id,f.models.get(code)!,f.versions.get(code)!,{fixture:true,configuration:policy});const p=f.prepare(f.createQuote(code).id);
  expect(()=>f.time.start({projectNodeId:actions(p.id)[0].id,category:'development'})).toThrow(/Obligation structurelle/);
 });
 it('aucun déplacement silencieux d’une base dont les Pages sont déjà produites',()=>{
  const p=f.prepare(f.createQuote('AW-LP-BASE').id),manual=f.sites.create(p.id,{name:'Autre Site'}),t=f.projects.commercial.scope(p.id).targets![0];
  const before=logical();expect(()=>f.projects.commercial.assignTarget(p.id,{lineOrigin:t.lineOrigin,slot:t.slot,unitIndex:1,siteId:manual.id,author:'Test'})).toThrow(/réaffectation/);expect(logical()).toBe(before);
 });
 it('clôture de phase et modification de son statut ne contournent pas une D pending',()=>{
  const p=f.prepare(f.createQuote('AW-DEVWP-FONCTION').id),a=actions(p.id).find(n=>n.operational!.targetRequirement?.target==='site')!,phase=a.parentId!;
  expect(()=>f.projects.completeProjectPhase(phase)).toThrow(/cible/);expect(()=>f.projects.updateProjectNode(phase,{status:'done'})).toThrow(/cible/);
 });
 it('D avec Page ou contexte : choix exact et blocage après archivage',()=>{
  for(const kind of ['page','context'] as const){
   const code='AW-CONT-INTEG-WP',policy=structuredClone(f.policies.get(code)!);policy.destinationSlots[0].kind=kind;policy.destinationSlots[0].parentPageChoice=kind==='page'?'explicit':'none';for(const r of Object.values(policy.actionRequirements))if(r.target!=='none')r.target=kind;
   f.references.link(f.items.get(code)!.versions[0].id,f.models.get(code)!,null,{fixture:true,configuration:policy});const q=f.createQuote(),line=f.add(q.id,code).lines.at(-1)!,p=f.prepare(q.id),s=f.sites.list(p.id)[0],page=f.sites.listPages(p.id)[0],a=actions(p.id).find(n=>n.operational!.lineOrigin===line.id&&n.operational!.targetRequirement?.target===kind)!;
   f.projects.commercial.assignTarget(p.id,{lineOrigin:line.id,slot:'destination',unitIndex:1,author:'Test',...(kind==='page'?{siteId:s.id,pageNodeId:page.projectNodeId}:{contextNodeId:page.projectNodeId})});
   const time=f.time.addManual({projectNodeId:a.id,category:'development',startedAt:'2026-10-04T08:00:00Z',endedAt:'2026-10-04T08:10:00Z'});
   db.run('UPDATE project_nodes SET archived_at=? WHERE id=?',['2026-10-04',page.projectNodeId]);expect(()=>f.time.start({projectNodeId:a.id,category:'development'})).toThrow(/Page parente|Contexte/);
   expect(new TimeCorrectionService(db,f.time).update(time.id,{projectNodeId:a.id,category:'development',startedAt:time.startedAt,endedAt:time.endedAt!}).durationSeconds).toBe(600);
  }
 });
 it('directement accepté : même moteur v2, C sans structure et D pending',()=>{
  for(const code of ['AW-WEB-VITRINE','AW-CONT-ART-SEO','AW-DEVWP-FONCTION']){
   const q=f.createQuote(code);finalizeForTest(db,f.quotes,q.id);f.quotes.markSent(q.id);acceptForTest(db,f.quotes,q.id);const p=f.projects.transformQuote({quoteId:q.id});
   expect(p.commercialState).toBe('frozen');expect(f.projects.transformQuote({quoteId:q.id}).id).toBe(p.id);expect(f.sites.list(p.id)).toHaveLength(code==='AW-WEB-VITRINE'?1:0);
  }
 });
 it('retrait base encore ciblée : blocage atomic sans suppression ni redirection',()=>{
  const q=f.createQuote(),l=f.add(q.id,'AW-WEB-PAGE-SUP').lines.at(-1)!,p=f.prepare(q.id);choose(p.id,l.id,0);f.quotes.removeLine(q.lines[0].id);const before=logical();expect(()=>f.prepare(q.id)).toThrow(/Occurrence|ambiguë/);expect(logical()).toBe(before);expect(f.sites.list(p.id)).toHaveLength(1);
 });
 it('ancien blueprint complet et structure sans modèle : refus explicite',()=>{
  const q=f.createQuote();db.run('UPDATE catalog_project_blueprints SET template_version_id=? WHERE catalog_version_id=?',['atoumweb-project-template-vitrine-v1',q.lines[0].catalogVersionId!]);expect(()=>f.prepare(q.id)).toThrow(/structurelle|structurel/);
  const code='AW-LP-BASE',q2=f.createQuote(code),next=f.catalog.createVersion(f.items.get(code)!.id,{priceMode:'fixed',priceCents:10000});f.catalog.publishVersion(next.id);f.quotes.removeLine(q2.lines[0].id);f.quotes.addCatalogLine(q2.id,next.id);expect(()=>f.prepare(q2.id)).toThrow(/compatibilité/);
 });
 it('configuration gouvernée ne peut être rétrogradée vers un fallback historique',()=>{
  const code='AW-LP-BASE';expect(()=>f.references.link(f.items.get(code)!.versions[0].id,f.models.get(code)!,f.versions.get(code)!,{fixture:true})).toThrow(/retrait implicite/);
 });
 it('modèle V2 : ancien Projet conserve exactement son snapshot et ses estimations',()=>{
  const code='AW-CONT-PACK4-SEO',q=f.createQuote(code),p=f.prepare(q.id),old=f.projects.getProject(p.id),ref=structuredClone(f.reference),model=ref.models.find(m=>m.code===f.items.get(code)!.canonicalCode)!;
  model.actions[0].minutes+=5;model.referenceMinutes+=5;f.references.importDraft(ref,f.references.simulate(ref).planHash);const v=db.get('SELECT id FROM operational_model_versions WHERE canonical_code=? AND version_number=2',[model.code])!;f.references.markReady(String(v.id));f.references.link(f.items.get(code)!.versions[0].id,String(v.id),null,{fixture:true,configuration:f.policies.get(code)!});
  const before=logical();f.prepare(q.id);expect(logical()).toBe(before);expect(f.projects.getProject(p.id)).toEqual(old);expect(f.prepare(f.createQuote(code).id).estimatedMinutes).toBe(785);
 });
 it('Blog explicite puis second achat auto : même Site réel, toujours un seul Blog',()=>{
  const q=f.createQuote(),line=f.add(q.id,'AW-WEB-BLOG').lines.at(-1)!,p=f.prepare(q.id);choose(p.id,line.id,0);f.add(q.id,'AW-WEB-BLOG');const before=logical();expect(()=>f.prepare(q.id)).toThrow(/maximum 1/);expect(logical()).toBe(before);
 });
 it('D pending acceptable même si une action demande sa cible dès la préparation',()=>{
  const code='AW-DEVWP-FONCTION',policy=structuredClone(f.policies.get(code)!);policy.destinationSlots[0].requiredAt='preparation';for(const r of Object.values(policy.actionRequirements))if(r.target!=='none')r.requiredAt='preparation';f.references.link(f.items.get(code)!.versions[0].id,f.models.get(code)!,null,{fixture:true,configuration:policy});
  const q=f.createQuote(code),p=f.prepare(q.id);finalizeForTest(db,f.quotes,q.id);f.quotes.markSent(q.id);acceptForTest(db,f.quotes,q.id);expect(f.projects.getProject(p.id).commercialState).toBe('frozen');expect(f.projects.commercial.scope(p.id).targets![0].state).toBe('pending');
 });
 it('prévisualisation sans écriture et jeton périmé : application refusée sans mutation',()=>{
  const q=f.createQuote(),before=logical(),preview=f.projects.commercial.preview({quoteId:q.id});expect(logical()).toBe(before);expect(preview.baseCount).toBe(1);expect(preview.operations.actions.filter(a=>a.action)).toHaveLength(21);expect(preview.destinations[0].siteOwnerOrigin).toBe(q.lines[0].id);
  f.add(q.id,'AW-WEB-PAGE-SUP');const changed=logical();expect(()=>f.projects.commercial.prepare({quoteId:q.id,previewSHA256:preview.sha256})).toThrow(/périmée/);expect(logical()).toBe(changed);
  const current=f.projects.commercial.preview({quoteId:q.id});expect(f.projects.commercial.prepare({quoteId:q.id,previewSHA256:current.sha256}).estimatedMinutes).toBe(1575);
 });
 it('produits quantité 2 : première cible utilisée ne verrouille pas la seconde unité pending',()=>{
  const q=f.createQuote('AW-ECOM-BASE'),line=f.add(q.id,'AW-ECOM-PROD-SIMPLE',2000).lines.at(-1)!,p=f.prepare(q.id),scope=f.projects.commercial.scope(p.id),s=scope.targetChoices!.sites[0],page=scope.targetChoices!.pages.find(p=>p.siteId===s.id)!;
  for(const t of scope.targets!.filter(t=>t.lineOrigin===line.id))f.projects.commercial.assignTarget(p.id,{lineOrigin:line.id,slot:t.slot,unitIndex:t.unitIndex,siteId:s.id,siteOwnerOrigin:s.ownerOrigin,siteOwnerSlot:s.ownerSlot,pageNodeId:page.id,author:'Test'});
  expect(actions(p.id)).toHaveLength(26);expect(f.sites.listPages(p.id)).toHaveLength(4);expect(f.projects.getProject(p.id).estimatedMinutes).toBe(2610);
  const before=logical();f.prepare(q.id);expect(logical()).toBe(before);f.quotes.updateLine(line.id,{label:line.label,quantityMilli:1000});f.prepare(q.id);expect(actions(p.id)).toHaveLength(23);expect(f.sites.listPages(p.id)).toHaveLength(4);
 });
});
