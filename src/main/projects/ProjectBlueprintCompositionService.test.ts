import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, afterEach, describe, it, expect } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { MIGRATIONS, applyPendingMigrations, ensureMigrationTable } from '../database/migrations';
import { createWorkspacePaths } from '../workspace';
import { projectCompositionFixture } from '../testSupport/projectCompositionFixture';

let db:NodeSqliteAdapter, root:string, f:ReturnType<typeof projectCompositionFixture>;
beforeEach(()=>{root=mkdtempSync(join(tmpdir(),'atoumweb-composition-test-'));db=new NodeSqliteAdapter(':memory:');db.exec('PRAGMA foreign_keys=ON');applyPendingMigrations(db);f=projectCompositionFixture(db,createWorkspacePaths(root));});
afterEach(()=>{db.close();const checked=join(tmpdir(),root.split(/[\\/]/).at(-1)!);if(checked!==root||!root.startsWith(tmpdir()))throw Error('Temp unsafe');rmSync(root,{recursive:true,force:true});});
const state=()=>db.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").map(t=>({table:t.name,rows:db.all('SELECT * FROM '+t.name).map(r=>JSON.stringify(r)).sort()}));
const bought=(quantity=1000)=>{const q=f.createQuote();f.quotes.selectOfferOption(q.lines[0].id,f.components.find(c=>c.isOptional&&c.serviceVersionId===f.services[1].currentVersion!.id)!.id,{quantityMilli:quantity});return f.quotes.get(q.id);};

describe('Lot 7 — composition des lignes réellement vendues',()=>{
 it('vitrine seule : 1 Site / 5 Pages, aucune option ni prérequis optionnel',()=>{
  const q=f.createQuote(),p=f.convert(q.id);expect(f.sites.list(p.id)).toHaveLength(1);expect(f.sites.listPages(p.id)).toHaveLength(5);
  expect(p.prerequisites.map(p=>p.label)).toEqual(['Prérequis fixture BASE']);
  expect(f.engine.resolveQuote(q.id).contributions.every(c=>c.role==='base')).toBe(true);
 });
 it('page supplémentaire quantité 2 : 1 Site / 7 Pages et descendants distincts',()=>{
  const q=f.createQuote();f.quotes.addCatalogLine(q.id,f.services[1].currentVersion!.id,{quantityMilli:2000});
  const p=f.convert(q.id);expect(f.sites.list(p.id)).toHaveLength(1);expect(f.sites.listPages(p.id)).toHaveLength(7);
  const extra=p.nodes.filter(n=>n.sourceTemplateNodeId===f.page.nodes.find(n=>n.displaySubtype==='page')!.id);expect(extra).toHaveLength(2);
  expect(new Set(extra.map(n=>n.id)).size).toBe(2);
  for(const n of extra) {expect(p.nodes.filter(child=>child.parentId===n.id)).toHaveLength(1);expect(f.engine.provenance(p.id,n.id)[0].quantityMilli).toBe(2000);}
 });
 it('Blog contribue à Sites/Pages et à ses tâches sans détruire la base',()=>{
  const q=f.createQuote();f.quotes.addCatalogLine(q.id,f.blogItem.versions[0].id);const p=f.convert(q.id);
  expect(f.sites.list(p.id)).toHaveLength(1);expect(f.sites.listPages(p.id)).toHaveLength(6);expect(p.nodes.some(n=>n.name==='Vérifier Blog')).toBe(true);
  expect(p.prerequisites.some(p=>p.label==='Contenus éditoriaux Blog')).toBe(true);
 });
 it('une option explicitement achetée apporte sa contribution et sa provenance Lot 6',()=>{
  const q=bought(2000),p=f.convert(q.id);expect(f.sites.listPages(p.id)).toHaveLength(7);
  const option=q.lines.find(l=>l.optionPurchase)!;const node=p.nodes.find(n=>n.name==='Page supplémentaire (1)')!;
  expect(f.engine.provenance(p.id,node.id)).toContainEqual(expect.objectContaining({quoteLineId:option.id,quantityMilli:2000,optionPurchase:expect.objectContaining({state:'purchased',source_offer_line_id:q.lines[0].id})}));
 });
 it('plusieurs addons compatibles : Page x2 + Blog + SEO',()=>{
  const q=bought(2000);f.quotes.addCatalogLine(q.id,f.blogItem.versions[0].id);f.quotes.addCatalogLine(q.id,f.services[2].currentVersion!.id,{quantityMilli:2500});
  const p=f.convert(q.id);expect(f.sites.listPages(p.id)).toHaveLength(8);expect(p.nodes.filter(n=>n.name==='SEO local')).toHaveLength(1);
 });
 it('rejeu après renommage Site/Page et ajout manuel : zéro mutation',()=>{
  const q=bought(2000),p=f.convert(q.id),site=f.sites.list(p.id)[0],home=f.sites.listPages(p.id).find(l=>l.role==='home')!;
  f.sites.update(site.id,{name:'Site renommé'});f.projects.updateProjectNode(home.projectNodeId,{name:'Bienvenue'});
  const manual=f.projects.addProjectNode(p.id,{type:'module',displaySubtype:'page',name:'Page manuelle'}).nodes.find(n=>n.name==='Page manuelle')!;
  f.sites.linkPage(site.id,manual.id);const before=state();
  const result=f.sites.applyBlueprint(p.id);expect(result.createdSiteIds).toEqual([]);expect(result.linkedPageIds).toEqual([]);
  expect(state()).toEqual(before);expect(f.projects.transformQuote({quoteId:q.id}).id).toBe(p.id);expect(state()).toEqual(before);
 });
 it('quantité modifiée avant conversion : seule la quantité finale dimensionne le Projet',()=>{
  const q=bought(),line=q.lines.find(l=>l.optionPurchase)!;f.quotes.updateLine(line.id,{label:line.label,quantityMilli:3000});const p=f.convert(q.id);
  expect(f.sites.listPages(p.id)).toHaveLength(8);expect(f.engine.provenance(p.id,p.nodes.find(n=>n.name==='Page supplémentaire (3)')!.id)[0].quantityMilli).toBe(3000);
 });
 it('deux bases concurrentes bloquent avant tout Projet et même avec sélection explicite',()=>{
  const q=f.createQuote();f.quotes.addCatalogLine(q.id,f.offer.currentVersion!.id);f.accept(q.id);const before=state();
  expect(()=>f.projects.transformQuote({quoteId:q.id})).toThrow(/bases? concurrents|base concurrents/);
  expect(()=>f.projects.transformQuote({quoteId:q.id,templateVersionId:f.base.id})).toThrow(/concurrents/);expect(state()).toEqual(before);
 });
 it('remplacement manuel d’une seule base explicitement demandé : choix et origine remplacée tracés',()=>{
  const q=f.createQuote();const selected=f.projects.createTemplate({name:'Choix manuel',projectType:'website'}).versions[0];
  f.projects.addTemplateNode(selected.id,{type:'task',name:'Tâche manuelle'});f.projects.publishTemplateVersion(selected.id);f.accept(q.id);
  const p=f.projects.transformQuote({quoteId:q.id,templateVersionId:selected.id});
  const plan=JSON.parse(String(db.get('SELECT plan_json FROM project_blueprint_plans WHERE project_id=?',[p.id])!.plan_json));
  expect(plan.explicitlyReplacedBases).toHaveLength(2);expect(plan.base.sourceRole).toBe('manual');
  expect(p.nodes.map(n=>n.name)).toEqual(['Tâche manuelle']);expect(f.sites.list(p.id)).toEqual([]);
 });
 it('une quantité fractionnaire répétable est refusée sans arrondi ni création',()=>{
  const q=bought(1500);f.accept(q.id);const before=state();expect(()=>f.projects.transformQuote({quoteId:q.id})).toThrow(/quantité entière/);expect(state()).toEqual(before);
 });
 it('aucun prérequis de service retiré ne reste dans le texte global du devis',()=>{
  const q=f.createQuote();f.quotes.addCatalogLine(q.id,f.services[1].currentVersion!.id);
  const line=f.quotes.get(q.id).lines.find(l=>l.catalogVersionId===f.services[1].currentVersion!.id)!;f.quotes.removeLine(line.id);
  const p=f.convert(q.id);expect(p.prerequisites.some(p=>p.label.includes('PAGE'))).toBe(false);
 });
 it('retrait de l’option avant conversion : aucun effet ni prérequis fantôme',()=>{
  const q=bought(),option=q.lines.find(l=>l.optionPurchase)!;f.quotes.removeLine(option.id);const p=f.convert(q.id);
  expect(f.sites.listPages(p.id)).toHaveLength(5);expect(p.prerequisites.some(p=>p.label.includes('PAGE'))).toBe(false);
 });
 it('service manuel identique + option : deux provenances exactes, aucune fusion implicite par nom',()=>{
  const q=bought();f.quotes.addCatalogLine(q.id,f.services[1].currentVersion!.id);const p=f.convert(q.id);
  expect(f.sites.listPages(p.id)).toHaveLength(7);const extras=p.nodes.filter(n=>n.sourceTemplateNodeId===f.page.nodes.find(n=>n.displaySubtype==='page')!.id);
  const sources=extras.map(n=>f.engine.provenance(p.id,n.id)[0]);expect(sources.filter(s=>s.optionPurchase)).toHaveLength(1);expect(new Set(sources.map(s=>s.quoteLineId)).size).toBe(2);
 });
 it('le plan figé survit aux modifications du catalogue/template sans nouvelle contribution',()=>{
  const q=bought(2000),p=f.convert(q.id);db.run("UPDATE catalog_project_blueprints SET quantity_mode='once',site_mode='create' WHERE id='fixture-l7-page'");
  db.run("UPDATE project_template_nodes SET name='Modifié hors API' WHERE template_version_id=?",[f.page.id]);const before=state();
  f.sites.applyBlueprint(p.id);expect(state()).toEqual(before);expect(f.sites.listPages(p.id)).toHaveLength(7);
  expect(()=>db.run('UPDATE project_blueprint_plans SET plan_json=plan_json WHERE project_id=?',[p.id])).toThrow(/Frozen/);
 });
 it('préserve une Page détachée ou déplacée manuellement au rejeu',()=>{
  const q=bought(),p=f.convert(q.id),page=f.sites.listPages(p.id).find(l=>l.role==='standard')!;f.sites.unlinkPage(page.projectNodeId);
  const before=state();f.sites.applyBlueprint(p.id);expect(state()).toEqual(before);
 });
 it('une destination addon inconnue est bloquée avant conversion',()=>{
  db.run("UPDATE project_template_sites SET blueprint_key='unknown' WHERE template_version_id=?",[f.blog.id]);
  const q=f.createQuote();f.quotes.addCatalogLine(q.id,f.blogItem.versions[0].id);f.accept(q.id);const before=state();
  expect(()=>f.projects.transformQuote({quoteId:q.id})).toThrow(/Destination addon/);expect(state()).toEqual(before);
 });
 it('une base répétable produit 2 Sites distincts / 10 Pages, sans déduire depuis le nom',()=>{
  db.run("UPDATE catalog_project_blueprints SET quantity_mode='per_unit' WHERE role='base' AND id LIKE 'fixture-l7-%'");
  const q=f.createQuote();f.quotes.updateLine(q.lines[0].id,{label:q.lines[0].label,quantityMilli:2000});const p=f.convert(q.id);
  expect(f.sites.list(p.id)).toHaveLength(2);expect(f.sites.listPages(p.id)).toHaveLength(10);
 });
 it('conserve les politiques lors d’une nouvelle version catalogue',()=>{
  const v=f.catalog.createVersion(f.services[1].id,{priceMode:'fixed',priceCents:2000});
  expect(db.get("SELECT quantity_mode,site_mode FROM catalog_project_blueprints WHERE catalog_version_id=?",[v.id])).toEqual({quantity_mode:'per_unit',site_mode:'extend_base'});
 });
 it('rollback complet si un addon revendique une deuxième Accueil du même Site',()=>{
  db.run("UPDATE project_template_site_pages SET role='home',desired_path='/' WHERE template_site_id IN (SELECT id FROM project_template_sites WHERE template_version_id=?)",[f.blog.id]);
  const q=f.createQuote();f.quotes.addCatalogLine(q.id,f.blogItem.versions[0].id);f.accept(q.id);const before=state();
  expect(()=>f.projects.transformQuote({quoteId:q.id})).toThrow();expect(state()).toEqual(before);
 });
 it('migration 58 additive, tables vides, zéro backfill historique et rejeu pur',()=>{
  const legacy=new NodeSqliteAdapter(':memory:');try {
   ensureMigrationTable(legacy);for(const m of MIGRATIONS.filter(m=>m.id<=57)){legacy.exec(m.sql);legacy.run('INSERT INTO schema_migrations(id,name,applied_at) VALUES(?,?,?)',[m.id,m.name,'fixture']);}
   const tables=legacy.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").map(t=>({name:t.name,rows:legacy.all('SELECT * FROM '+t.name)}));
   expect(applyPendingMigrations(legacy).map(m=>m.id)).toEqual([58]);
   for(const t of tables) {
    if(t.name==='schema_migrations')expect(legacy.all('SELECT * FROM schema_migrations WHERE id<=57')).toEqual(t.rows);
    else if(t.name==='catalog_project_blueprints')for(const [i,row] of t.rows.entries())expect(legacy.all('SELECT * FROM '+t.name)[i]).toMatchObject(row);
    else expect(legacy.all('SELECT * FROM '+t.name)).toEqual(t.rows);
   }
   expect(legacy.all('SELECT * FROM project_blueprint_plans')).toEqual([]);expect(applyPendingMigrations(legacy)).toEqual([]);
  }finally{legacy.close();}
 });
});
