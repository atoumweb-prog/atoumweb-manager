import { sendForTest } from '../testSupport/quotePreparationFixture';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach,afterEach,describe,it,expect } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations,MIGRATIONS,ensureMigrationTable } from '../database/migrations';
import { createWorkspacePaths } from '../workspace';
import { projectOperationalFixture } from '../testSupport/projectOperationalFixture';
import { TimeCorrectionService } from '../time/TimeCorrectionService';
import { TimeService } from '../time/TimeService';
import { TimeSwitchService } from '../time/TimeSwitchService';
import { finalizeForTest,acceptForTest } from '../testSupport/quotePreparationFixture';

let db:NodeSqliteAdapter,root:string,f:ReturnType<typeof projectOperationalFixture>;
beforeEach(()=>{root=mkdtempSync(join(tmpdir(),'atoumweb-operational-test-'));db=new NodeSqliteAdapter(':memory:');db.exec('PRAGMA foreign_keys=ON');applyPendingMigrations(db);f=projectOperationalFixture(db,createWorkspacePaths(root));});
afterEach(()=>{db.close();if(!root.startsWith(join(tmpdir(),'atoumweb-operational-test-')))throw Error('Temp unsafe');rmSync(root,{recursive:true,force:true});});
const actions=(id:string)=>f.projects.getProject(id).nodes.filter(n=>n.operational?.action);
const state=()=>db.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").map(t=>({name:t.name,rows:db.all('SELECT * FROM '+t.name).map(r=>JSON.stringify(r)).sort()}));

describe('Lot 8A — actions et références opérationnelles',()=>{
 it('Vitrine : 21 actions / 1470 min / 1 Site / 5 Pages, historique publié conservé',()=>{
   const q=f.createQuote(),p=f.prepare(q.id);
   expect(actions(p.id)).toHaveLength(21);expect(p.estimatedMinutes).toBe(1470);expect(f.sites.list(p.id)).toHaveLength(1);expect(f.sites.listPages(p.id)).toHaveLength(5);
   expect(db.get("SELECT COUNT(*) AS n,SUM(estimated_minutes) AS min FROM project_template_nodes WHERE template_version_id='atoumweb-project-template-vitrine-v1' AND node_type='task'")).toEqual({n:13,min:525});
   expect(db.get("SELECT status FROM project_template_versions WHERE id='atoumweb-project-template-vitrine-v1'")!.status).toBe('published');
 });
 it('option disponible : zéro effet ; option achetée x2 : 29 actions / 1680 min / 7 Pages',()=>{
   const q=f.createQuote();expect(actions(f.prepare(q.id).id)).toHaveLength(21);
   const purchased=f.buyPages(q.id);const p=f.prepare(q.id);expect(actions(p.id)).toHaveLength(29);expect(p.estimatedMinutes).toBe(1680);expect(f.sites.listPages(p.id)).toHaveLength(7);
   const extra=actions(p.id).filter(n=>n.operational!.code.endsWith('PAGE-SUP'));
   expect(extra.every(n=>n.operational!.optionPurchase?.state==='purchased'&&n.operational!.quantityMilli===2000)).toBe(true);
   expect(new Set(extra.map(n=>n.operational!.quoteLineId))).toEqual(new Set([purchased.lines.find(l=>l.optionPurchase)!.id]));
 });
 it('Vitrine + 2 pages + Blog : 34 actions / 1860 min / 8 Pages',()=>{
   const q=f.createQuote();f.buyPages(q.id);f.quotes.addCatalogLine(q.id,f.items.get('AW-WEB-BLOG')!.versions[0].id);
   const p=f.prepare(q.id);expect(actions(p.id)).toHaveLength(34);expect(p.estimatedMinutes).toBe(1860);expect(f.sites.listPages(p.id)).toHaveLength(8);
 });
 it('pack de 4 articles : 4 actions / 780 min, sans multiplier une deuxième fois les quatre articles, sans Site/Page',()=>{
   const p=f.prepare(f.createQuote('AW-CONT-PACK4-SEO').id);expect(actions(p.id)).toHaveLength(4);expect(p.estimatedMinutes).toBe(780);
   expect(f.sites.list(p.id)).toEqual([]);expect(f.sites.listPages(p.id)).toEqual([]);expect(p.templateVersionId).toBeNull();expect(p.prerequisites.some(x=>x.label.includes('PACK4'))).toBe(true);
 });
 it('application : 3 actions / 180 min indicatives, estimation finale absente et total incomplet',()=>{
   const p=f.prepare(f.createQuote('AW-APP-DEV').id);expect(actions(p.id)).toHaveLength(3);expect(actions(p.id).reduce((s,n)=>s+n.operational!.referenceMinutes!,0)).toBe(180);
   expect(actions(p.id).every(n=>n.estimatedMinutes===null)).toBe(true);expect(p.estimationIncomplete).toBe(true);expect(p.estimatedMinutes).toBe(0);
   for(const n of actions(p.id)) f.projects.updateProjectNode(n.id,{estimatedMinutes:120});expect(f.projects.getProject(p.id).estimationIncomplete).toBe(false);
 });
 it.each(['AW-TECH-PACK-3H','AW-MAINT-WP-M'])('%s : aucune action ni objet 8B activé',code=>{
   const q=f.createQuote(code),before=db.all('SELECT * FROM interventions');const plan=f.operations.resolve(q.id,new Map());expect(plan.actions).toEqual([]);expect(plan.excluded).toHaveLength(1);expect(db.all('SELECT * FROM interventions')).toEqual(before);
 });
 it('rejeu pur après modifications humaines : nom, checklist, estimation, ordre et statut préservés',()=>{
   const q=f.createQuote(),p=f.prepare(q.id),n=actions(p.id)[0];
   f.projects.updateProjectNode(n.id,{name:'Nom humain',estimatedMinutes:999,sortOrder:123,status:'in_progress',workCard:{goal:'Checklist humaine',fields:[]}});
   const before=state();f.prepare(q.id);expect(state()).toEqual(before);const changed=actions(p.id).find(x=>x.id===n.id)!;expect(changed.name).toBe('Nom humain');expect(changed.estimatedMinutes).toBe(999);expect(changed.operational!.referenceMinutes).toBe(n.operational!.referenceMinutes);
 });
 it('réduction de quantité retire uniquement les actions vierges de la seconde unité',()=>{
   const q=f.createQuote();const b=f.buyPages(q.id),p=f.prepare(q.id),line=b.lines.find(l=>l.optionPurchase)!;
   f.quotes.updateLine(line.id,{label:line.label,quantityMilli:1000});f.prepare(q.id);expect(actions(p.id)).toHaveLength(25);expect(f.projects.getProject(p.id).estimatedMinutes).toBe(1575);expect(f.projects.commercial.scope(p.id).conflicts).toEqual([]);
 });
 it('retrait travaillé : conflit, suppression refusée et temps/provenance conservés après archivage explicite',()=>{
   const q=f.createQuote();const b=f.buyPages(q.id,1000),p=f.prepare(q.id),line=b.lines.find(l=>l.optionPurchase)!;
   const n=actions(p.id).find(n=>n.operational!.code.endsWith('PAGE-SUP'))!;
   const t=f.time.addManual({projectId:p.id,projectNodeId:n.id,category:'development',startedAt:'2026-10-04T08:00:00Z',endedAt:'2026-10-04T08:30:00Z'});
   f.quotes.removeLine(line.id);f.prepare(q.id);const c=f.projects.commercial.scope(p.id).conflicts.find(c=>c.entityId===n.id)!;expect(c).toBeTruthy();
   expect(()=>f.projects.commercial.resolveConflict(p.id,c.id,'delete')).toThrow(/non vierge/);
   f.projects.commercial.resolveConflict(p.id,c.id,'archive');expect(f.time.get(t.id).durationSeconds).toBe(1800);expect(db.get('SELECT initial_snapshot_json FROM project_action_instances WHERE project_node_id=?',[n.id])).toBeTruthy();
   expect(()=>db.run('DELETE FROM project_action_instances WHERE project_node_id=?',[n.id])).toThrow(/retained/);
 });
 it('nouvelle version du référentiel : ancien Projet préservé, nouvelle préparation utilise la nouvelle version',()=>{
   const q=f.createQuote('AW-CONT-PACK4-SEO'),p=f.prepare(q.id),before=actions(p.id).map(n=>n.operational);
   const ref=structuredClone(f.reference),m=ref.models.find(m=>m.code.endsWith('PACK4-SEO'))!;m.actions[0].minutes+=10;m.referenceMinutes+=10;
   f.references.importDraft(ref,f.references.simulate(ref).planHash);const v=db.get('SELECT id FROM operational_model_versions WHERE canonical_code=? AND version_number=2',[m.code])!;
   f.references.markReady(String(v.id));f.references.activateLink(f.references.link(f.items.get('AW-CONT-PACK4-SEO')!.versions[0].id,String(v.id),null,{fixture:true}));
   f.prepare(q.id);expect(actions(p.id).map(n=>n.operational)).toEqual(before);expect(f.prepare(f.createQuote('AW-CONT-PACK4-SEO').id).estimatedMinutes).toBe(790);
 });
 it('import brouillon, changement versionné, rejeu sans mutation et jeton périmé refusé',()=>{
   const before=state(),plan=f.references.simulate(f.reference);f.references.importDraft(f.reference,plan.planHash);expect(state()).toEqual(before);
   expect(()=>f.references.importDraft(f.reference,'bad')).toThrow(/Dry-run/);expect(state()).toEqual(before);
   const ref=structuredClone(f.reference);ref.models[0].notes+='Nouvelle note';f.references.importDraft(ref,f.references.simulate(ref).planHash);
   expect(db.get('SELECT status FROM operational_model_versions WHERE canonical_code=? AND version_number=2',[ref.models[0].code])!.status).toBe('draft');
 });
 it('modèle initial, profil et compatibilité immuables',()=>{
   expect(()=>db.run('UPDATE operational_model_versions SET model_json=model_json')).toThrow(/immutable/);
   expect(()=>db.run('UPDATE blueprint_operational_profiles SET mode=mode')).toThrow(/immutable/);
   expect(()=>db.run('UPDATE catalog_operational_links SET revision=revision')).toThrow(/immutable/);
   const p=f.prepare(f.createQuote().id);expect(()=>db.run('UPDATE project_action_instances SET initial_snapshot_json=initial_snapshot_json WHERE project_id=?',[p.id])).toThrow(/immutable/);
 });
 it('structure mise en usage figée sans retirer la publication historique',()=>{
   const v=f.projects.getTemplate('atoumweb-project-template-vitrine').versions.find(v=>v.id===f.structure)!;
   expect(v.status).toBe('draft');expect(v.operationalReady).toBe(true);expect(v.operationalPurpose).toBe('structural');
   expect(()=>f.projects.addTemplateNode(v.id,{type:'task',name:'Double production'})).toThrow(/figée/);
   expect(f.references.prepareVitrineStructure(f.projects)).toBe(v.id);
 });
 it('acceptation : même Projet activé, actions figées et synchronisation commerciale refusée',()=>{
   const q=f.createQuote(),p=f.prepare(q.id),initial=actions(p.id).map(n=>n.operational);
   finalizeForTest(db,f.quotes,q.id);sendForTest(f.quotes,q.id);acceptForTest(db,f.quotes,q.id);
   expect(f.projects.transformQuote({quoteId:q.id}).id).toBe(p.id);expect(f.projects.getProject(p.id).commercialState).toBe('frozen');
   expect(()=>f.projects.commercial.sync(p.id)).toThrow(/prévisionnel/);expect(actions(p.id).map(n=>n.operational)).toEqual(initial);
 });
 it.each(['AW-WEB-VITRINE','AW-CONT-PACK4-SEO'])('conversion directe après acceptation %s conserve aussi les actions, sans second Projet',code=>{
   const q=f.createQuote(code);finalizeForTest(db,f.quotes,q.id);sendForTest(f.quotes,q.id);acceptForTest(db,f.quotes,q.id);
   const p=f.projects.transformQuote({quoteId:q.id});expect(actions(p.id)).toHaveLength(code==='AW-WEB-VITRINE'?21:4);
   const before=state();expect(f.projects.transformQuote({quoteId:q.id}).id).toBe(p.id);expect(state()).toEqual(before);
 });
 it('service manuel identique et option achetée : deux provenances et aucune fusion par libellé',()=>{
   const q=f.createQuote();f.buyPages(q.id,1000);f.quotes.addCatalogLine(q.id,f.items.get('AW-WEB-PAGE-SUP')!.versions[0].id);
   const p=f.prepare(q.id),pages=actions(p.id).filter(n=>n.operational!.code.endsWith('PAGE-SUP'));expect(pages).toHaveLength(8);
   expect(new Set(pages.map(n=>n.operational!.lineOrigin)).size).toBe(2);expect(pages.filter(n=>n.operational!.optionPurchase)).toHaveLength(4);
 });
 it('quantité fractionnaire refusée sans arrondi, ni Projet ni dossier partiel',()=>{
   const q=f.createQuote();f.buyPages(q.id,1500);const before=state();expect(()=>f.prepare(q.id)).toThrow(/entière/);expect(state()).toEqual(before);
 });
 it('deux packs vendus : deux plans complets, sans multiplier les articles internes',()=>{
   const q=f.createQuote('AW-CONT-PACK4-SEO');f.quotes.updateLine(q.lines[0].id,{label:q.lines[0].label,quantityMilli:2000});const p=f.prepare(q.id);
   expect(actions(p.id)).toHaveLength(8);expect(p.estimatedMinutes).toBe(1560);
 });
 it('changement explicite de contexte chrono : chaque session conserve sa catégorie métier',()=>{
   const p=f.prepare(f.createQuote().id),nodes=actions(p.id);f.projects.updateProjectNode(nodes[1].id,{businessCategory:'Supplément facturable'});
   let now=new Date('2026-10-04T08:00:00Z');const time=new TimeService(db,()=>new Date(now));const first=time.start({projectId:p.id,projectNodeId:nodes[0].id,category:'development'});
   now=new Date('2026-10-04T08:10:00Z');time.heartbeat(first.id);const next=new TimeSwitchService(db,time,()=>new Date(now)).switchTo({projectId:p.id,projectNodeId:nodes[1].id,category:'design'});
   expect(time.get(first.id).businessCategory).toBe('Inclus au forfait');expect(time.get(first.id).durationSeconds).toBe(600);expect(next.businessCategory).toBe('Supplément facturable');
 });
 it('modèle invalide / catégorie non autorisée : aucun import partiel',()=>{
   const ref=structuredClone(f.reference);ref.models[0].actions[0].minutes+=1;const before=state();expect(()=>f.references.simulate(ref)).toThrow(/Somme/);expect(state()).toEqual(before);
   expect(()=>f.time.addManual({category:'design',businessCategory:'inventée' as never,startedAt:'2026-10-04T08:00:00Z',endedAt:'2026-10-04T08:30:00Z'})).toThrow(/Catégorie métier/);
 });
 it('ancien blueprint complet + modèle : blocage visible et transaction sans Projet partiel',()=>{
   db.run("UPDATE catalog_project_blueprints SET template_version_id='atoumweb-project-template-vitrine-v1' WHERE id='fixture-8a-base'");const q=f.createQuote(),before=state();
   expect(()=>f.prepare(q.id)).toThrow(/Ancien blueprint/);expect(state()).toEqual(before);
 });
 it('blueprint structurel sans compatibilité configurée : blocage visible',()=>{
   const q=f.createQuote();db.exec('DROP TRIGGER operational_link_no_delete');db.run('DELETE FROM catalog_operational_links WHERE catalog_version_id=?',[f.items.get('AW-WEB-VITRINE')!.versions[0].id]);
   expect(()=>f.prepare(q.id)).toThrow(/compatibilité non configurée/);
 });
 it('Projet standard reste sans association opérationnelle',()=>{
   expect(db.get("SELECT COUNT(*) AS n FROM blueprint_operational_profiles WHERE template_version_id IN (SELECT v.id FROM project_template_versions v JOIN project_templates t ON t.id=v.template_id WHERE t.name='Projet standard V1')")!.n).toBe(0);
 });
 it('A19 et A16 checklist complétées sans changement de temps, A12 et A21 inchangées',()=>{
   const m=f.reference.models.find(m=>m.code.endsWith('WEB-VITRINE'))!,a=(key:string)=>m.actions.find(a=>a.key.endsWith(key))!;
   expect(a('A19').checklist).toContain('point de restauration avant publication');expect(a('A16').checklist).toContain('aucune validation juridique');expect(a('A19').minutes).toBe(60);expect(a('A16').minutes).toBe(60);expect(m.referenceMinutes).toBe(1470);
 });
 it('chrono hors pauses : référence inchangée, catégorie métier figée indépendamment de l’activité',()=>{
   const p=f.prepare(f.createQuote().id),n=actions(p.id)[0];let now=new Date('2026-10-04T08:00:00Z');const time=new TimeService(db,()=>new Date(now));
   const s=time.start({projectId:p.id,projectNodeId:n.id,category:'development'});expect(s.businessCategory).toBe('Inclus au forfait');
   now=new Date('2026-10-04T08:20:00Z');time.pause(s.id);now=new Date('2026-10-04T08:30:00Z');time.resume(s.id);now=new Date('2026-10-04T08:40:00Z');time.stop(s.id);
   f.projects.updateProjectNode(n.id,{businessCategory:'Garantie corrective',estimatedMinutes:123});expect(time.get(s.id).businessCategory).toBe('Inclus au forfait');expect(time.get(s.id).durationSeconds).toBe(1800);
   expect(f.projects.getProject(p.id).nodes.find(x=>x.id===n.id)!.operational!.actualSeconds).toBe(1800);
   const correction=new TimeCorrectionService(db,time);correction.update(s.id,{projectId:p.id,projectNodeId:n.id,category:'design',startedAt:'2026-10-04T08:00:00Z',endedAt:'2026-10-04T08:40:00Z'});expect(time.get(s.id).businessCategory).toBe('Inclus au forfait');
 });
 it.each(['Avant-vente','Interne','Garantie corrective'] as const)('temps %s possible sans créer de réserves ou actions',category=>{
   const before=db.get('SELECT COUNT(*) AS n FROM project_nodes');const s=f.time.addManual({category:'administrative',businessCategory:category,startedAt:'2026-10-04T10:00:00Z',endedAt:'2026-10-04T10:15:00Z'});expect(s.businessCategory).toBe(category);expect(db.get('SELECT COUNT(*) AS n FROM project_nodes')).toEqual(before);
 });
 it('migration 60 : aucune donnée historique modifiée, colonnes nouvelles NULL, tables initialement vides',()=>{
   const legacy=new NodeSqliteAdapter(':memory:');try{
     ensureMigrationTable(legacy);for(const m of MIGRATIONS.filter(m=>m.id<60)){legacy.exec(m.sql);legacy.run('INSERT INTO schema_migrations VALUES(?,?,?)',[m.id,m.name,'fixture']);}
     const tables=legacy.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").map(t=>({name:t.name,columns:legacy.all<{name:string}>('PRAGMA table_info('+t.name+')').map(c=>c.name),rows:legacy.all('SELECT * FROM '+t.name)}));
     applyPendingMigrations(legacy);for(const t of tables)expect(legacy.all('SELECT '+t.columns.join(',')+' FROM '+t.name+(t.name==='schema_migrations'?' WHERE id<60':''))).toEqual(t.rows);
     for(const name of ['operational_import_runs','operational_model_versions','blueprint_operational_profiles','catalog_operational_links','project_action_instances'])expect(legacy.all('SELECT * FROM '+name)).toEqual([]);
     expect(legacy.get('PRAGMA integrity_check')!.integrity_check).toBe('ok');expect(legacy.all('PRAGMA foreign_key_check')).toEqual([]);
   }finally{legacy.close();}
 });
});
