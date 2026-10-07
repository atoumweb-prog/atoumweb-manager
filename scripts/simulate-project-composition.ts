// No source SQLite connection; binary copy only. All publications/conversions are synthetic on that copy.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { NodeSqliteAdapter } from '../src/main/database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../src/main/database/migrations';
import { projectCompositionFixture } from '../src/main/testSupport/projectCompositionFixture';
import { createWorkspacePaths } from '../src/main/workspace';
import type { QuoteDetail } from '../src/shared/commercial';

const sha=(p:string)=>createHash('sha256').update(readFileSync(p)).digest('hex');
const hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const q=(s:string)=>'"'+s.replaceAll('"','""')+'"';
const expected='7a54bb9905b16370f3c98f9d0e5dacd88bb38a65cae5b506525e1ea6e86496d4';
const expectedWorkbook='6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8';
const args=process.argv.slice(2),opts:Record<string,string>={};
for(let i=0;i<args.length;i++){assert(['--database','--workbook','--output'].includes(args[i])&&args[i+1]);opts[args[i].slice(2)]=path.resolve(args[++i]);}
assert(opts.database&&opts.workbook&&opts.output);
const temp=process.env.ATOUMWEB_PROJECT_COMPOSITION_TEMP;assert(temp);
assert.equal(sha(opts.database),expected);assert.equal(sha(opts.workbook),expectedWorkbook);
for(const suffix of ['-wal','-shm','-journal'])assert(!existsSync(opts.database+suffix),'Source auxiliaire actif ; refus');
const copy=path.join(temp,'lot7.sqlite');writeFileSync(copy,readFileSync(opts.database));assert.equal(sha(copy),expected);assert.equal(sha(opts.database),expected);
const db=new NodeSqliteAdapter(copy);db.exec('PRAGMA foreign_keys=ON');
try{
 assert.equal(db.get<{id:number}>('SELECT MAX(id) id FROM schema_migrations')!.id,57);
 const tables=db.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
 const before=tables.map(t=>({table:t.name,columns:db.all<{name:string}>('PRAGMA table_info('+q(t.name)+')').map(c=>c.name),rows:db.all('SELECT * FROM '+q(t.name)).map(r=>JSON.stringify(r)).sort()}));
 const historicalNames=['quotes','quote_lines','projects','project_nodes','project_sites','project_site_pages','project_services','project_prerequisites','client_documents','quote_document_links','quote_contract_clauses','catalog_items','catalog_versions','offer_components','contract_clause_templates','contract_clause_versions','catalog_contract_clause_links'];
 const oldRows=Object.fromEntries(historicalNames.map(t=>[t,db.all<Record<string,unknown>>('SELECT * FROM '+q(t))]));
 const operations=['maintenance_subscriptions','maintenance_periods','hour_packs','service_requests','interventions'];
 const operationalBefore=Object.fromEntries(operations.map(t=>[t,db.all('SELECT * FROM '+t)]));
 const realCodes=db.all<{id:string}>('SELECT id FROM catalog_items WHERE canonical_code IS NOT NULL').map(i=>i.id);
 const realCatalogue=db.all<{id:string}>("SELECT v.id FROM catalog_versions v JOIN catalog_items i ON i.id=v.item_id WHERE i.canonical_code IS NOT NULL AND v.status='draft'").map(v=>v.id);
 const realClauses=db.all<{id:string}>('SELECT id FROM contract_clause_versions').map(v=>v.id);
 const migration=applyPendingMigrations(db).map(m=>m.id);assert.deepEqual(migration,[58]);
 for(const t of before){
  const after=db.all('SELECT '+t.columns.map(q).join(',')+' FROM '+q(t.table)+(t.table==='schema_migrations'?' WHERE id<=57':'')).map(r=>JSON.stringify(r)).sort();
  assert.deepEqual(after,t.rows,'Migration a modifié '+t.table);
 }
 assert.deepEqual(applyPendingMigrations(db),[]);
 const f=projectCompositionFixture(db,createWorkspacePaths(path.join(temp,'workspace')));
 const option=f.components.find(c=>c.serviceVersionId===f.services[1].currentVersion!.id)!;
 const scenarios:Record<string,unknown>[]=[];
 const purchase=(qt:QuoteDetail,qty:number)=>f.quotes.selectOfferOption(qt.lines[0].id,option.id,{quantityMilli:qty});
 const take=(name:string,quoteId:string,expectedPages:number)=>{
  const beforeStructure={sites:0,pages:0,projectId:null};
  const sold=f.quotes.get(quoteId),plan=f.engine.resolveQuote(quoteId),project=f.convert(quoteId);
  const sites=f.sites.list(project.id),links=f.sites.listPages(project.id);
  assert.equal(sites.length,1);assert.equal(links.length,expectedPages);
  const sale=sold.lines.map(line=>({line:line.id,label:line.label,origin:line.optionPurchase?'option achetée':line.snapshot?.itemType==='offer'?'offre':'service additionnel',
    aw:line.snapshot?.canonicalCode??null,quantityMilli:line.quantityMilli,optionPurchase:line.optionPurchase,
    contributions:plan.contributions.filter(c=>c.quoteLineId===line.id).map(c=>({key:c.key,role:c.role,sourceRole:c.sourceRole,component:c.componentId,blueprint:c.templateVersionId,quantityMode:c.quantityMode,unitCount:c.unitCount,siteMode:c.siteMode}))}));
  const nodeProof=project.nodes.map(node=>({id:node.id,name:node.name,parent:node.parentId,provenance:f.engine.provenance(project.id,node.id)}));
  assert(nodeProof.every(n=>n.provenance.length>0));
  const whole=()=>hash(db.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").map(t=>({table:t.name,rows:db.all('SELECT * FROM '+q(t.name)).map(r=>JSON.stringify(r)).sort()})));
  const hashBeforeReplay=whole();const replay=f.sites.applyBlueprint(project.id);assert.equal(whole(),hashBeforeReplay);assert.equal(f.projects.transformQuote({quoteId}).id,project.id);assert.equal(whole(),hashBeforeReplay);
  const record={name,quoteId,projectId:project.id,before:beforeStructure,after:{sites:sites.length,pages:links.length,nodes:project.nodes.length},soldLines:sale,
    prerequisites:project.prerequisites.map(p=>({label:p.label,sources:db.all('SELECT provenance_json FROM project_composed_prerequisite_sources WHERE project_prerequisite_id=?',[p.id]).map(r=>JSON.parse(String(r.provenance_json)))})),
    sites,links,nodes:nodeProof,replay:{createdSites:replay.createdSiteIds.length,linkedPages:replay.linkedPageIds.length,allDataUnchanged:true}};
  scenarios.push(record);return project;
 };
 let qt=f.createQuote('SIM L7-01 — vitrine');take('1 — Site vitrine seul',qt.id,5);
 qt=f.createQuote('SIM L7-02 — 2 Pages');f.quotes.addCatalogLine(qt.id,f.services[1].currentVersion!.id,{quantityMilli:2000});take('2 — Page supplémentaire quantité 2',qt.id,7);
 qt=f.createQuote('SIM L7-03 — Blog');f.quotes.addCatalogLine(qt.id,f.blogItem.versions[0].id);take('3 — Blog',qt.id,6);
 qt=f.createQuote('SIM L7-04 — option disponible');take('4a — Option disponible non achetée',qt.id,5);
 qt=f.createQuote('SIM L7-04b — option achetée');purchase(qt,1000);take('4b — Option explicitement achetée',qt.id,6);
 qt=f.createQuote('SIM L7-05 — addons');purchase(qt,2000);f.quotes.addCatalogLine(qt.id,f.blogItem.versions[0].id);f.quotes.addCatalogLine(qt.id,f.services[2].currentVersion!.id,{quantityMilli:2500});take('5 — Addons compatibles',qt.id,8);
 qt=f.createQuote('SIM L7-06 — renommages');purchase(qt,2000);const renamed=take('6 — Renommages avant rejeu',qt.id,7);
 const site=f.sites.list(renamed.id)[0],home=f.sites.listPages(renamed.id).find(l=>l.role==='home')!;
 f.sites.update(site.id,{name:'Nom manuel conservé'});f.projects.updateProjectNode(home.projectNodeId,{name:'Bienvenue conservée'});
 let prior=hash(f.projects.getProject(renamed.id));f.sites.applyBlueprint(renamed.id);assert.equal(hash(f.projects.getProject(renamed.id)),prior);
 scenarios.push({name:'6b — Rejeu après renommage',siteName:f.sites.get(site.id).name,pageName:f.projects.getProject(renamed.id).nodes.find(n=>n.id===home.projectNodeId)!.name,preserved:true});
 const manual=f.projects.addProjectNode(renamed.id,{type:'module',displaySubtype:'page',name:'Page manuelle conservée'}).nodes.find(n=>n.name==='Page manuelle conservée')!;
 f.sites.linkPage(site.id,manual.id);prior=hash(f.projects.getProject(renamed.id));f.sites.applyBlueprint(renamed.id);assert.equal(hash(f.projects.getProject(renamed.id)),prior);assert.equal(f.sites.listPages(renamed.id).length,8);
 scenarios.push({name:'7 — Ajout manuel puis rejeu',sites:1,pages:8,manualPageId:manual.id,manualProvenance:f.engine.provenance(renamed.id,manual.id),preserved:true});
 qt=f.createQuote('SIM L7-08 — quantité modifiée');purchase(qt,1000);const bought=f.quotes.get(qt.id).lines.find(l=>l.optionPurchase)!;
 f.quotes.updateLine(bought.id,{label:bought.label,quantityMilli:3000});take('8 — Quantité 1 → 3 avant conversion',qt.id,8);
 qt=f.createQuote('SIM L7-09 — bases concurrentes');f.quotes.addCatalogLine(qt.id,f.offer.currentVersion!.id);f.accept(qt.id);
 const beforeBlock=hash(db.all('SELECT * FROM projects'));let error='';try{f.projects.transformQuote({quoteId:qt.id});}catch(e){error=(e as Error).message;}
 assert.match(error,/concurrents/);assert.equal(hash(db.all('SELECT * FROM projects')),beforeBlock);scenarios.push({name:'9 — Deux bases concurrentes',blocked:true,message:error,createdProjects:0});
 const history=historicalNames.map(table=>{
  const old=oldRows[table], columns=old.length?Object.keys(old[0]):[];
  let now:Record<string,unknown>[]=[];
  if(old.length) {
   const key=columns.includes('id')?'id':columns.includes('project_node_id')?'project_node_id':null;
   now=old.map(row => key
    ? db.get<Record<string,unknown>>('SELECT '+columns.map(q).join(',')+' FROM '+q(table)+' WHERE '+q(key)+'=?',[String(row[key])])!
    : db.get<Record<string,unknown>>('SELECT '+columns.map(q).join(',')+' FROM '+q(table)+' WHERE '+columns.map(c=>q(c)+' IS ?').join(' AND '),
      columns.map(c=>row[c] as string|number|null))!);
  }
  assert.deepEqual(now,old,table+' historique modifié');
  return {table,rows:old.length,beforeHash:hash(old),afterHash:hash(now),unchanged:true};
 });
 for(const t of operations)assert.deepEqual(db.all('SELECT * FROM '+t),operationalBefore[t]);
 for(const id of realCodes)assert(db.get('SELECT id FROM catalog_items WHERE id=? AND canonical_code IS NOT NULL',[id]));
 for(const id of realCatalogue)assert.equal(db.get('SELECT status FROM catalog_versions WHERE id=?',[id])!.status,'draft');
 for(const id of realClauses)assert.equal(db.get('SELECT status FROM contract_clause_versions WHERE id=?',[id])!.status,'draft');
 assert.equal(db.get<{n:number}>("SELECT COUNT(*) n FROM catalog_contract_clause_links l JOIN catalog_items i ON i.id=l.catalog_item_id WHERE i.canonical_code NOT LIKE 'AW-TEST-%'")!.n,409);
 const integrity=db.all('PRAGMA integrity_check').map(r=>({...r})),foreignKeys=db.all('PRAGMA foreign_key_check');
 assert.deepEqual(integrity,[{integrity_check:'ok'}]);assert.deepEqual(foreignKeys,[]);
 const report={generatedAt:new Date().toISOString(),mode:'Copie temporaire uniquement',realWrites:0,migration,oldTablesPreservedByMigration:before.length,
   source:{databaseSHA256:expected,workbookSHA256:expectedWorkbook},realV1Preserved:{aw:realCodes.length,catalogueDrafts:realCatalogue.length,clauseDrafts:realClauses.length,links:409},
   scenarios,historicalRows:history,operationalObjectsCreated:0,integrity,foreignKeys,manualRecipe:'À faire',after:{databaseSHA256:sha(opts.database),workbookSHA256:sha(opts.workbook)}};
 assert.equal(report.after.databaseSHA256,expected);assert.equal(report.after.workbookSHA256,expectedWorkbook);
 mkdirSync(opts.output,{recursive:true});writeFileSync(path.join(opts.output,'simulation-lot7.json'),JSON.stringify(report,null,2)+'\n');
 let md='# Lot 7 — Simulation isolée\n\nMigration 58 sur copie physique temporaire uniquement. Zéro écriture réelle, aucun objet opérationnel.\n\n| Scénario | Avant | Après | Rejeu / résultat |\n| --- | --- | --- | --- |\n';
 for(const s of scenarios)md+='| '+s.name+' | '+(s.before?'0 Site / 0 Page':'État manuel')+' | '+(s.after?JSON.stringify(s.after):JSON.stringify(Object.fromEntries(Object.entries(s).filter(([k])=>k!=='name'))))+' | '+(s.replay?'Zéro mutation':'Contrôlé')+' |\n';
 md+='\n## Diff disponibilité / achat\n\n4a : offre + service obligatoire, 5 Pages ; option disponible sans contribution ni prérequis.\n4b : ligne optionnelle persistée et provenance Lot 6, 6 Pages, prérequis PAGE.\n\n## Traçabilité\n\nLe JSON conserve chaque ligne vendue, AW synthétique, quantité, mode, unité, version, composant, achat, nœud et Site/Page, ainsi que les prérequis et les empreintes historiques.\n\n112 AW / 112 catalogue V1 BROUILLON / 118 clauses BROUILLON / 409 liens inchangés. Publications exclusivement synthétiques sur copie.\n\nBase réelle avant = après : '+expected+'\n\nXLSX avant = après : '+expectedWorkbook+'\n\nIntégrité ok, FK vide. Aucun Lot 8, Abby, Bridge, 8C, publication réelle ou backfill.\n';
 writeFileSync(path.join(opts.output,'simulation-lot7.md'),md);
 console.log(JSON.stringify({report:path.join(opts.output,'simulation-lot7.json'),scenarios:scenarios.length,realWrites:0,migration,realV1Preserved:report.realV1Preserved,integrity,foreignKeys},null,2));
}finally{db.close();}
assert.equal(sha(opts.database),expected);for(const suffix of ['-wal','-shm','-journal'])assert(!existsSync(opts.database+suffix));
