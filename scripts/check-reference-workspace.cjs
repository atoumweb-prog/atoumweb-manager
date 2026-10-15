'use strict';
// Opt-in: actual startup of a freshly prepared workspace, never an original database.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const repo=path.resolve(__dirname,'..'),out=path.join(repo,'outputs');
const root=path.resolve(process.argv[2]||'');
assert(root.startsWith(out+path.sep)||process.argv[3]==='--prepared-reference','Explicit opt-in required outside owned outputs');
const preparation=JSON.parse(fs.readFileSync(path.join(root,'REFERENCE-PREPARATION.json'),'utf8'));
assert(preparation.validated&&path.resolve(preparation.destination)===root,'Prepared and verified workspace required');
const bundle=path.join(out,'reference-workspace-services.cjs');
if(!process.versions.electron){
 require('esbuild').buildSync({stdin:{contents:"export * from './src/main/database/DatabaseService';export * from './src/main/database/NodeSqliteAdapter';export * from './src/main/database/migrations';export * from './src/main/workspace';",resolveDir:repo,loader:'ts'},bundle:true,platform:'node',format:'cjs',external:['electron'],outfile:bundle,logLevel:'silent'});
 const r=cp.spawnSync(require('electron'),[__filename,root],{cwd:repo,env:{...process.env,ELECTRON_RUN_AS_NODE:'1'},encoding:'utf8',windowsHide:true,maxBuffer:4*1024*1024});process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');process.exit(r.status??1);
}
const {DatabaseService,NodeSqliteAdapter,ensureWorkspace,MIGRATIONS}=require(bundle);
(async()=>{
 const workspace=ensureWorkspace(root),before=new NodeSqliteAdapter(workspace.databaseFile);
 const tables=before.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").map(r=>r.name).filter(t=>/contract|clause|time|pause|hour_pack|^projects$|^project_nodes$|^quotes$|^quote_lines$|^organizations$|^contacts$|^client_accounts$/.test(t));
 const columns=Object.fromEntries(tables.map(t=>[t,before.all('PRAGMA table_info("'+t+'")').map(r=>r.name)]));
 const snapshot=db=>Object.fromEntries(tables.map(t=>[t,db.all('SELECT '+columns[t].map(c=>'"'+c+'"').join(',')+' FROM "'+t+'"').map(r=>JSON.stringify(r)).sort()]));
 const expected=snapshot(before),sessions=before.all('SELECT * FROM time_sessions ORDER BY id'),pauses=before.all('SELECT * FROM time_session_pauses ORDER BY id');
 assert.equal(sessions.length,226);assert.equal(pauses.length,6);before.close();
 const service=new DatabaseService(workspace);
 try{
  await service.initialize();
  assert.deepEqual(snapshot(service.database),expected,'Real startup changed contract/time records');
  assert.deepEqual(service.database.all('SELECT id,name FROM schema_migrations ORDER BY id').map(r=>({...r})),MIGRATIONS.map(m=>({id:m.id,name:m.name})));
  const listed=service.time.list(),byId=new Map(listed.map(s=>[s.id,s]));
  assert.equal(listed.length,226);assert.equal(service.time.active(),null,'No implicit timer started');
  for(const session of sessions){const item=byId.get(session.id);assert(item,'Session absent from actual TimeService');assert.equal(item.projectId,session.project_id);assert.equal(item.projectNodeId,session.project_node_id);assert.equal(item.interventionId,session.intervention_id);assert.equal(item.startedAt,session.started_at);assert.equal(item.endedAt,session.ended_at);if(session.project_id)assert(item.projectLabel&&item.projectNumber,'Missing real project label');assert.deepEqual(item.pauses.map(p=>p.id).sort(),pauses.filter(p=>p.time_session_id===session.id).map(p=>p.id).sort());}
  assert.equal(service.database.get('PRAGMA integrity_check').integrity_check,'ok');assert.deepEqual(service.database.all('PRAGMA foreign_key_check'),[]);
  const documents=service.database.all('SELECT id,relative_path FROM client_documents');
  const missingDocuments=documents.filter(d=>!fs.existsSync(path.join(root,d.relative_path)));
  assert.equal(missingDocuments.length,0,'A referenced client document is missing');
  const proof={runnerSha:cp.execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim(),root,sessions:listed.length,pauses:pauses.length,distinctProjects:new Set(listed.map(s=>s.projectId).filter(Boolean)).size,totalSeconds:service.time.summary().totalSeconds,contractTypes:service.database.get('SELECT COUNT(*) AS n FROM contract_types').n,clauseVersions:service.database.get('SELECT COUNT(*) AS n FROM contract_clause_versions').n,clientDocuments:documents.length,missingDocuments:missingDocuments.length,migrationCount:MIGRATIONS.length,protectedDigest:crypto.createHash('sha256').update(JSON.stringify(expected)).digest('hex'),exactRowsPreserved:true,integrity:true,foreignKeys:true};
  fs.writeFileSync(path.join(root,'REFERENCE-FUNCTIONAL.json'),JSON.stringify(proof,null,2));console.log('REFERENCE_FUNCTIONAL_OK '+JSON.stringify(proof));
 }finally{service.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
