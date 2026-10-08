// Binary source reads only. SQLite opens exclusively the temporary copy; no Manager initialization.
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {NodeSqliteAdapter} from '../src/main/database/NodeSqliteAdapter';
import {applyPendingMigrations} from '../src/main/database/migrations';
import type {SqlValue} from '../src/main/database/DatabaseAdapter';
import {projectCompositionFixture} from '../src/main/testSupport/projectCompositionFixture';
import {createWorkspacePaths} from '../src/main/workspace';
import {finalizeForTest,acceptForTest} from '../src/main/testSupport/quotePreparationFixture';

const sha=(p:string)=>createHash('sha256').update(readFileSync(p)).digest('hex');
const hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const quoted=(s:string)=>'"'+s.replaceAll('"','""')+'"';
const expected='ca5ab5a58af53197662000e0fb9edf27762b0c93cd606e2b49ca9391dde09db5';
const expectedWorkbook='6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8';
const opts:Record<string,string>={};const args=process.argv.slice(2);
for(let i=0;i<args.length;i++){assert(['--database','--workbook','--output'].includes(args[i])&&args[i+1]);opts[args[i].slice(2)]=path.resolve(args[++i]);}
assert(opts.database&&opts.workbook&&opts.output);const temp=process.env.ATOUMWEB_PROVISIONAL_TEMP;assert(temp);
assert.equal(sha(opts.database),expected);assert.equal(sha(opts.workbook),expectedWorkbook);
for(const suffix of ['-wal','-shm','-journal'])assert(!existsSync(opts.database+suffix),'Base source occupée : refus de copie non coordonnée');
const copy=path.join(temp,'lot7b.sqlite');writeFileSync(copy,readFileSync(opts.database));assert.equal(sha(copy),expected);assert.equal(sha(opts.database),expected);
const db=new NodeSqliteAdapter(copy);db.exec('PRAGMA foreign_keys=ON');
try {
  assert.equal(db.get('SELECT MAX(id) AS n FROM schema_migrations')!.n,58);
  const before=db.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    .map(t=>({name:t.name,columns:db.all<{name:string}>('PRAGMA table_info('+quoted(t.name)+')').map(c=>c.name),rows:db.all('SELECT * FROM '+quoted(t.name))}));
  const old=(name:string)=>before.find(t=>t.name===name)!;
  const operational=['maintenance_subscriptions','maintenance_periods','hour_packs','service_requests','interventions','billing_items'];
  const migration=applyPendingMigrations(db).map(m=>m.id);assert.deepEqual(migration,[59]);
  for(const t of before){const rows=db.all('SELECT '+t.columns.map(quoted).join(',')+' FROM '+quoted(t.name)+(t.name==='schema_migrations'?' WHERE id<=58':''));assert.deepEqual(rows,t.rows,'Migration altère '+t.name);}
  const postMigration=hash(db.all('SELECT * FROM projects'));assert.deepEqual(applyPendingMigrations(db),[]);assert.equal(hash(db.all('SELECT * FROM projects')),postMigration);
  const f=projectCompositionFixture(db,createWorkspacePaths(path.join(temp,'workspace'))),observations:Record<string,unknown>[]=[];
  let quote=f.createQuote('SIM 7B — même périmètre commercial'),project=f.projects.commercial.prepare({quoteId:quote.id});
  const projectId=project.id,master=project.resourceRootPath;
  const take=(name:string,expectedPages:number)=>{
    const detail=f.projects.getProject(projectId),scope=f.projects.commercial.scope(projectId),pages=f.sites.listPages(projectId),sites=f.sites.list(projectId);
    assert.equal(pages.length,expectedPages);assert.equal(sites.length,1);assert.equal(detail.id,projectId);
    observations.push({name,projectId,quoteId:quote.id,state:detail.commercialState,clientAccountId:detail.clientAccountId,prospectId:detail.prospectId,
      sites:sites.length,pages:pages.length,scope,
      soldLines:f.quotes.get(quote.id).lines.map(l=>({id:l.id,label:l.label,aw:l.snapshot?.canonicalCode,quantityMilli:l.quantityMilli,optionPurchase:l.optionPurchase,
        origin:db.get('SELECT origin_id FROM commercial_quote_line_origins WHERE line_id=?',[l.id])?.origin_id})),
      nodes:detail.nodes.map(n=>({id:n.id,parentId:n.parentId,name:n.name,status:n.status,provenance:n.blueprintSources})),prerequisites:detail.prerequisites});
  };
  take('1 — Prospect, Vitrine : aucun Client créé',5);assert.equal(db.all('SELECT id FROM client_accounts').length,old('client_accounts').rows.length);
  f.quotes.addCatalogLine(quote.id,f.services[1].currentVersion!.id,{quantityMilli:2000});let line=f.quotes.get(quote.id).lines.at(-1)!;
  f.projects.commercial.sync(projectId);take('2 — Page supplémentaire x2, même Projet',7);
  f.quotes.updateLine(line.id,{label:line.label,quantityMilli:1000});f.projects.commercial.sync(projectId);take('3 — Quantité 2→1, suppression unité vierge',6);
  f.quotes.addCatalogLine(quote.id,f.blogItem.versions[0].id);let blog=f.quotes.get(quote.id).lines.at(-1)!;
  f.projects.commercial.sync(projectId);take('4 — Blog ajouté',7);
  f.quotes.removeLine(blog.id);f.projects.commercial.sync(projectId);take('5 — Blog vierge retiré',6);
  f.quotes.addCatalogLine(quote.id,f.blogItem.versions[0].id);blog=f.quotes.get(quote.id).lines.at(-1)!;f.projects.commercial.sync(projectId);
  const blogNode=f.projects.getProject(projectId).nodes.find(n=>n.name==='Blog')!;f.projects.updateProjectNode(blogNode.id,{name:'Actualités travaillées'});
  f.quotes.removeLine(blog.id);f.projects.commercial.sync(projectId);take('6 — Blog travaillé retiré : conflit visible, Page conservée',7);
  const conflict=f.projects.commercial.scope(projectId).conflicts.find(c=>c.entityId===blogNode.id)!;assert(conflict);
  f.projects.commercial.resolveConflict(projectId,conflict.id,'keep');
  const home=f.sites.listPages(projectId).find(p=>p.role==='home')!;f.projects.updateProjectNode(home.projectNodeId,{name:'Bienvenue manuelle'});
  const manual=f.projects.addProjectNode(projectId,{type:'module',displaySubtype:'page',name:'Page manuelle'}).nodes.find(n=>n.name==='Page manuelle')!;
  f.sites.linkPage(f.sites.list(projectId)[0].id,manual.id);f.projects.commercial.sync(projectId);take('7 — Renommage et Page manuelle préservés',8);
  const seo=f.components.find(c=>c.isOptional&&c.serviceVersionId===f.services[2].currentVersion!.id)!;
  const availableBefore=f.projects.getProject(projectId).prerequisites.map(p=>p.label);
  assert(!availableBefore.some(label=>label.includes('SEO')));
  f.quotes.selectOfferOption(quote.lines[0].id,seo.id,{quantityMilli:1000});f.projects.commercial.sync(projectId);take('8 — Option SEO achetée : prérequis, aucune Page inventée',8);
  finalizeForTest(db,f.quotes,quote.id);f.quotes.markSent(quote.id);const sentOriginal=f.quotes.get(quote.id),oldIds=f.sites.listPages(projectId).map(p=>p.projectNodeId).sort();
  quote=f.quotes.duplicate(quote.id,true);assert.equal(quote.projectId,projectId);f.projects.commercial.prepare({quoteId:quote.id});assert.deepEqual(f.sites.listPages(projectId).map(p=>p.projectNodeId).sort(),oldIds);
  assert.deepEqual(f.quotes.get(sentOriginal.id),sentOriginal);take('9 — Révision commerciale explicite, identités conservées',8);
  finalizeForTest(db,f.quotes,quote.id);f.quotes.markSent(quote.id);acceptForTest(db,f.quotes,quote.id);take('10 — Acceptation : même Projet, Client rattaché, périmètre figé',8);
  assert.equal(f.projects.getProject(projectId).resourceRootPath,master);assert.equal(f.projects.getProject(projectId).acceptedQuoteId,quote.id);
  const whole=()=>hash(db.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").map(t=>({name:t.name,rows:db.all('SELECT * FROM '+quoted(t.name)).map(r=>JSON.stringify(r)).sort()})));
  const acceptedState=whole();f.quotes.accept(quote.id);assert.equal(f.projects.transformQuote({quoteId:quote.id}).id,projectId);f.sites.applyBlueprint(projectId);assert.equal(whole(),acceptedState);
  take('11 — Seconde acceptation/conversion/rejeu : zéro mutation',8);
  const historic=['quotes','quote_lines','projects','project_nodes','project_sites','project_site_pages','project_services','project_prerequisites','client_documents','quote_contract_clauses','catalog_items','catalog_versions','offer_components','contract_clause_templates','contract_clause_versions','catalog_contract_clause_links'];
  const historical=historic.map(name=>{const t=old(name);const rows=t.rows.map(row=>db.get('SELECT '+t.columns.map(quoted).join(',')+' FROM '+quoted(name)+' WHERE '+t.columns.map(c=>quoted(c)+' IS ?').join(' AND '),t.columns.map(c=>row[c] as SqlValue))!);
    assert.deepEqual(rows,t.rows,name+' historique modifié');return {table:name,rows:t.rows.length,beforeHash:hash(t.rows),afterHash:hash(rows),unchanged:true};});
  for(const name of operational)assert.deepEqual(db.all('SELECT * FROM '+name),old(name).rows);
  assert.equal(db.get("SELECT COUNT(*) AS n FROM catalog_items WHERE canonical_code NOT LIKE 'AW-TEST-%'")!.n,112);
  assert.equal(db.get("SELECT COUNT(*) AS n FROM catalog_versions v JOIN catalog_items i ON i.id=v.item_id WHERE i.canonical_code NOT LIKE 'AW-TEST-%' AND v.status='draft'")!.n,112);
  assert.equal(db.get("SELECT COUNT(*) AS n FROM contract_clause_versions v JOIN contract_clause_templates t ON t.id=v.clause_id WHERE t.code NOT LIKE 'TEST-%' AND v.status='draft'")!.n,118);
  assert.equal(db.get("SELECT COUNT(*) AS n FROM catalog_contract_clause_links l JOIN catalog_items i ON i.id=l.catalog_item_id WHERE i.canonical_code NOT LIKE 'AW-TEST-%'")!.n,409);
  const integrity=db.all('PRAGMA integrity_check'),foreignKeys=db.all('PRAGMA foreign_key_check');assert.deepEqual(integrity.map(r=>r.integrity_check),['ok']);assert.deepEqual(foreignKeys,[]);
  const report={date:new Date().toISOString(),mode:'Copie temporaire uniquement',realWrites:0,migration,oldTablesPreservedByMigration:before.length,
    source:{databaseSHA256:expected,workbookSHA256:expectedWorkbook},observations,historical,
    availableVsPurchased:{availableSEO:{clausesActivated:false,prerequisites:availableBefore},purchasedSEO:{linePersisted:true,pageContribution:0}},
    operationalObjectsCreated:0,integrity,foreignKeys,replayUnchanged:true,realV1:{AW:112,catalogueDrafts:112,clauseDrafts:118,links:409},
    after:{databaseSHA256:sha(opts.database),workbookSHA256:sha(opts.workbook)}};
  assert.equal(report.after.databaseSHA256,expected);assert.equal(report.after.workbookSHA256,expectedWorkbook);
  mkdirSync(opts.output,{recursive:true});writeFileSync(path.join(opts.output,'simulation-lot7b.json'),JSON.stringify(report,null,2)+'\n');
  let md='# Lot 7B — Simulation sur copie\n\nAucune connexion SQLite à Validation-MSI. Migration 59 sur copie physique temporaire uniquement.\n\n| Scénario | Sites | Pages | État commercial | Conflits |\n| --- | --- | --- | --- | --- |\n';
  for(const o of observations)md+=`| ${o.name} | ${o.sites} | ${o.pages} | ${o.state} | ${(o.scope as {conflicts:unknown[]}).conflicts.length} |\n`;
  md+='\nUn seul Projet synthétique pour le fil commercial. Les identités des Pages sont préservées à la révision. Le JSON donne chaque ligne, origine stable, quantité, achat, nœud, provenance, prérequis et plan historique.\n\n112 AW / 112 versions catalogue V1 BROUILLON / 118 clauses BROUILLON / 409 liens intacts. Publications uniquement de fixtures sur copie. Aucun objet opérationnel. Intégrité OK / FK vide.\n\nSHA Validation-MSI avant = après : '+expected+'\n\nSHA XLSX avant = après : '+expectedWorkbook+'\n';
  writeFileSync(path.join(opts.output,'simulation-lot7b.md'),md);console.log(JSON.stringify({observations:observations.length,migration,integrity,foreignKeys,sourceUnchanged:true}));
} finally {db.close();assert.equal(sha(opts.database),expected);assert.equal(sha(opts.workbook),expectedWorkbook);}
