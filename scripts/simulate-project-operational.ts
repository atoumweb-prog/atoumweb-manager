import { readFileSync,writeFileSync,mkdirSync,copyFileSync,existsSync } from 'node:fs';
import { resolve,join } from 'node:path';
import { createHash } from 'node:crypto';
import { NodeSqliteAdapter } from '../src/main/database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../src/main/database/migrations';
import { createWorkspacePaths } from '../src/main/workspace';
import { OperationalReferenceService } from '../src/main/projects/OperationalReferenceService';
import { projectOperationalFixture } from '../src/main/testSupport/projectOperationalFixture';
import type { OperationalReference } from '../src/shared/operational';

const args=process.argv.slice(2),arg=(name:string)=>{const i=args.indexOf(name);if(i<0||!args[i+1])throw Error(name+' requis');return resolve(args[i+1]);};
const source=arg('--database'),manifest=arg('--manifest'),workbook=arg('--workbook'),output=arg('--output');
const temporary=process.env.ATOUMWEB_OPERATIONAL_TEMP;if(!temporary)throw Error('Utiliser le lanceur isolé');
const hash=(file:string)=>createHash('sha256').update(readFileSync(file)).digest('hex');
const expectedDB='c0bda21b97924758f211d463382001d24bb5872e20e2a61c5831802a942cd1fc';
const expectedXLSX='c2c5c139d66d4d9fe9d90863f3cdacb6dad617eb4ce692e6ac31cf352eeb26cf';
if(hash(source)!==expectedDB || hash(workbook)!==expectedXLSX)throw Error('Source différente du checkpoint validé');
for(const suffix of ['-wal','-shm','-journal'])if(existsSync(source+suffix))throw Error('Source active : simulation refusée');
if(output===source || output.startsWith(resolve(__dirname,'../src')))throw Error('Destination interdite');
mkdirSync(output,{recursive:true});const copy=join(temporary,'simulation.sqlite');copyFileSync(source,copy);
if(hash(copy)!==expectedDB||hash(source)!==expectedDB)throw Error('Copie incohérente');
const db=new NodeSqliteAdapter(copy);db.exec('PRAGMA foreign_keys=ON');
const tables=()=>db.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
const logical=()=>JSON.stringify(tables().map(t=>({table:t.name,rows:db.all('SELECT * FROM "'+t.name+'"').map(r=>JSON.stringify(r)).sort()})));
const checks:{name:string;passed:boolean}[]=[],check=(name:string,ok:unknown)=>{checks.push({name,passed:!!ok});if(!ok)throw Error(name);};
try {
  check('Migrations source 1–59',db.all('SELECT id FROM schema_migrations').length===59);
  const before=tables().map(t=>({name:t.name,cols:db.all<{name:string}>('PRAGMA table_info("'+t.name+'")').map(c=>c.name),rows:db.all('SELECT * FROM "'+t.name+'"').map(r=>JSON.stringify(r)).sort()}));
  applyPendingMigrations(db);
  for(const t of before)check('Migration conserve '+t.name,JSON.stringify(db.all('SELECT '+t.cols.map(c=>'"'+c+'"').join(',')+' FROM "'+t.name+'"'+(t.name==='schema_migrations'?' WHERE id<=59':'')).map(r=>JSON.stringify(r)).sort())===JSON.stringify(t.rows));
  for(const t of ['operational_import_runs','operational_model_versions','blueprint_operational_profiles','catalog_operational_links','project_action_instances'])check(t+' initialement vide',db.all('SELECT * FROM '+t).length===0);
  const oldProjects=db.all('SELECT * FROM projects'),oldQuotes=db.all('SELECT * FROM quotes'),oldNodes=db.all('SELECT * FROM project_nodes'),oldSites=db.all('SELECT * FROM project_sites'),oldPages=db.all('SELECT * FROM project_site_pages'),oldDocuments=db.all('SELECT * FROM client_documents'),oldTime=db.all('SELECT * FROM time_sessions');
  const ref=JSON.parse(readFileSync(manifest,'utf8')) as OperationalReference;
  check('SHA du manifeste relié au XLSX',ref.source.sha256===hash(workbook));
  const service=new OperationalReferenceService(db),dry=service.simulate(ref);check('112 créations en simulation',dry.rows.length===112&&dry.rows.every(r=>r.action==='create'));
  service.importDraft(ref,dry.planHash);
  check('112 modèles brouillon',db.all("SELECT id FROM operational_model_versions WHERE status='draft'").length===112);
  const afterImport=logical();service.importDraft(ref,service.simulate(ref).planHash);check('Import rejouable sans mutation',logical()===afterImport);
  const f=projectOperationalFixture(db,createWorkspacePaths(join(temporary,'workspace')));
  const caseRows:Record<string,unknown>[]=[];
  const capture=(label:string,qId:string,expectedActions:number,expectedMinutes:number,expectedPages:number)=>{
    const p=f.prepare(qId),nodes=p.nodes.filter(n=>n.operational?.action),referenceMinutes=nodes.reduce((v,n)=>v+n.operational!.referenceMinutes!,0);
    check(label+' arithmétique',nodes.length===expectedActions&&referenceMinutes===expectedMinutes&&f.sites.listPages(p.id).length===expectedPages);
    const beforeReplay=logical();f.prepare(qId);check(label+' rejeu idempotent',logical()===beforeReplay);
    caseRows.push({label,project:p.id,quote:qId,actions:nodes.length,referenceMinutes,estimatedMinutes:p.estimatedMinutes,incomplete:p.estimationIncomplete,sites:f.sites.list(p.id).length,pages:f.sites.listPages(p.id).length,
      nodes:nodes.map(n=>({id:n.id,name:n.name,estimate:n.estimatedMinutes,initial:n.operational,checklist:n.workCard}))});return p;
  };
  capture('Vitrine seule',f.createQuote().id,21,1470,5);
  const pageQuote=f.createQuote();f.buyPages(pageQuote.id);capture('Vitrine + option Page achetée x2',pageQuote.id,29,1680,7);
  const blogQuote=f.createQuote();f.buyPages(blogQuote.id);f.quotes.addCatalogLine(blogQuote.id,f.items.get('AW-WEB-BLOG')!.versions[0].id);capture('Vitrine + 2 pages + Blog',blogQuote.id,34,1860,8);
  const nonweb=capture('Pack 4 articles SEO sans Site/Page',f.createQuote('AW-CONT-PACK4-SEO').id,4,780,0);
  const app=capture('Application : cadrage indicatif',f.createQuote('AW-APP-DEV').id,3,180,0);check('Estimation spécifique obligatoire',app.estimationIncomplete&&app.estimatedMinutes===0);
  for(const code of ['AW-TECH-PACK-3H','AW-MAINT-WP-M']){const q=f.createQuote(code),plan=f.operations.resolve(q.id,new Map());check(code+' inerte',plan.actions.length===0&&plan.excluded.length===1);caseRows.push({label:code,actions:0,excluded:plan.excluded});}
  const removalQuote=f.createQuote();const b=f.buyPages(removalQuote.id),removal=f.prepare(removalQuote.id),option=b.lines.find(l=>l.optionPurchase)!;
  const worked=removal.nodes.find(n=>n.operational?.action&&n.operational.code.endsWith('PAGE-SUP'))!;
  const t=f.time.addManual({projectId:removal.id,projectNodeId:worked.id,category:'development',startedAt:'2026-10-04T08:00:00Z',endedAt:'2026-10-04T08:30:00Z'});
  f.projects.updateProjectNode(worked.id,{name:'Nom humain',estimatedMinutes:333,status:'in_progress',sortOrder:432,workCard:{goal:'Checklist humaine',fields:[]}});
  f.quotes.removeLine(option.id);const retired=f.prepare(removalQuote.id);check('Sept autres actions vierges retirées',retired.nodes.filter(n=>n.operational?.action).length===22);
  check('Action travaillée conservée avec conflit',f.projects.commercial.scope(removal.id).conflicts.some(c=>c.entityId===worked.id));
  check('Nom/estimation/checklist humains conservés',retired.nodes.some(n=>n.id===worked.id&&n.name==='Nom humain'&&n.estimatedMinutes===333&&n.workCard?.goal==='Checklist humaine'));
  check('Temps conservé',f.time.get(t.id).durationSeconds===1800);
  caseRows.push({label:'Retrait option : vierges retirées, travaillée conservée',conflicts:f.projects.commercial.scope(removal.id).conflicts,time:f.time.get(t.id)});
  const preserved=JSON.stringify(f.projects.getProject(nonweb.id).nodes);
  const next=structuredClone(f.reference),m=next.models.find(m=>m.code.endsWith('PACK4-SEO'))!;m.actions[0].checklist+=' ; nouvelle checklist de simulation';
  f.references.importDraft(next,f.references.simulate(next).planHash);const v=db.get('SELECT id FROM operational_model_versions WHERE canonical_code=? AND version_number=2',[m.code])!;
  f.references.markReady(String(v.id));f.references.link(f.items.get('AW-CONT-PACK4-SEO')!.versions[0].id,String(v.id),null,{fixture:true,revision:2});
  f.projects.commercial.sync(nonweb.id);check('Nouvelle version ne modifie pas ancien Projet',JSON.stringify(f.projects.getProject(nonweb.id).nodes)===preserved);
  for(const [table,rows] of [['projects',oldProjects],['quotes',oldQuotes],['project_nodes',oldNodes],['project_sites',oldSites],['project_site_pages',oldPages],['client_documents',oldDocuments],['time_sessions',oldTime]] as const)
    for(const row of rows)check('Historique '+table+' '+String(row.id??row.project_node_id),JSON.stringify(db.get('SELECT * FROM '+table+' WHERE '+('id' in row?'id':'project_node_id')+'=?',[String(row.id??row.project_node_id)]))===JSON.stringify(row));
  check('112 versions catalogue V1 restent draft',db.all("SELECT v.id FROM catalog_versions v JOIN catalog_items i ON i.id=v.item_id WHERE i.canonical_code NOT LIKE 'AW-TEST%' AND v.status='draft'").length>=112);
  check('118 clauses restent draft',db.all("SELECT id FROM contract_clause_versions WHERE status='draft'").length===118);
  check('409 liens contractuels originaux conservés',db.all('SELECT * FROM catalog_contract_clause_links').length>=409);
  check('Intégrité',db.get('PRAGMA integrity_check')!.integrity_check==='ok');check('Relations',db.all('PRAGMA foreign_key_check').length===0);
  const replayBefore=logical();applyPendingMigrations(db);check('Rejeu migration sans mutation',logical()===replayBefore);
  db.exec('PRAGMA wal_checkpoint(TRUNCATE)');db.close();
  check('Validation-MSI intacte',hash(source)===expectedDB);check('XLSX intact',hash(workbook)===expectedXLSX);
  const report={date:new Date().toISOString(),sourceSHA:expectedDB,sourceXLSXSHA:expectedXLSX,manifestSHA:hash(manifest),dryRun:dry,simulationSHA:hash(copy),mode:'Copie temporaire seulement ; références et publications synthétiques AW-TEST*, 112 modèles réels importés en brouillon',
    import:{references:112,actions:432,lot8A:94,actions8A:388,lot8B:18,actions8B:44,estimationRequired8A:22},checks,cases:caseRows,
    modelVersions:JSON.parse(afterImport).find((t:{table:string})=>t.table==='operational_model_versions').rows.map((r:string)=>JSON.parse(r)),sourceUnchanged:true};
  writeFileSync(join(output,'simulation-lot8a.json'),JSON.stringify(report,null,2)+'\n');
  writeFileSync(join(output,'simulation-lot8a.md'),'# Simulation Lot 8A — préparation uniquement\n\nSource Validation-MSI : `'+expectedDB+'` (inchangée).\n\nXLSX : `'+expectedXLSX+'` (inchangé).\n\nMigration 60 uniquement sur copie temporaire. Aucun commit.\n\n112 modèles réels importés en BROUILLON ; tests commerciaux avec identités AW-TEST* uniquement.\n\n| Cas | Actions | Référence min | Estimation courante | Incomplète | Sites | Pages |\n|---|---:|---:|---:|---|---:|---:|\n'+caseRows.filter(c=>'referenceMinutes' in c).map(c=>`| ${c.label} | ${c.actions} | ${c.referenceMinutes} | ${c.estimatedMinutes} | ${c.incomplete} | ${c.sites} | ${c.pages} |`).join('\n')+'\n\n'+checks.length+' contrôles réussis. Voir JSON pour versions, provenance feuille/ligne, textes/checklists, conflits et arithmétique.\n');
  console.log(JSON.stringify({checks:checks.length,failed:0,sourceSHA:hash(source),workbookSHA:hash(workbook),output}));
}catch(e){try{db.close();}catch{}throw e;}
