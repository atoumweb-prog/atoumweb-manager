'use strict';
// Compare protected rows after the REAL DatabaseService startup, on owned copies only.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const repo=path.resolve(__dirname,'..'),out=path.join(repo,'outputs');
if(!process.versions.electron){
 require('esbuild').buildSync({stdin:{contents:"export * from './src/main/database/DatabaseService';export * from './src/main/database/NodeSqliteAdapter';export * from './src/main/workspace';",resolveDir:repo,loader:'ts'},bundle:true,platform:'node',format:'cjs',external:['electron'],outfile:path.join(out,'reference-startup.cjs'),logLevel:'silent'});
 const run=cp.spawnSync(require('electron'),[__filename,...process.argv.slice(2)],{cwd:repo,env:{...process.env,ELECTRON_RUN_AS_NODE:'1'},encoding:'utf8',windowsHide:true,maxBuffer:4*1024*1024});process.stdout.write(run.stdout||'');process.stderr.write(run.stderr||'');process.exit(run.status??1);
}
const {NodeSqliteAdapter,DatabaseService,ensureWorkspace}=require(path.join(out,'reference-startup.cjs'));
const sources=JSON.parse(fs.readFileSync(path.resolve(process.argv[2]),'utf8'));
(async()=>{
 const results=[];
 for(const [i,source] of sources.entries()){
  const input=path.resolve(source.copy+'.before.sqlite');assert(input.replaceAll('\\','/').includes('/outputs/'),'Input must be a prior owned backup, never an original');
  const workspace=ensureWorkspace(path.join(out,'reference-startup-'+Date.now()+'-'+i));fs.copyFileSync(input,workspace.databaseFile);
  const before=new NodeSqliteAdapter(workspace.databaseFile);
  const tables=before.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").map(r=>r.name).filter(n=>/contract|clause|time|pause|correction|hour_pack|^quotes$|^quote_lines$|^projects$|^project_nodes$|^organizations$|^contacts$|^client_accounts$|activity/.test(n));
  const columns=Object.fromEntries(tables.map(t=>[t,before.all('PRAGMA table_info("'+t+'")').map(r=>r.name)]));
  const snapshot=db=>Object.fromEntries(tables.map(t=>[t,db.all('SELECT '+columns[t].map(c=>'"'+c+'"').join(',')+' FROM "'+t+'"').map(row=>JSON.stringify(row)).sort()]));
  const expected=snapshot(before);before.close();
  const service=new DatabaseService(workspace);try{
   await service.initialize();assert.deepEqual(snapshot(service.database),expected,'Startup changed protected rows');
   assert.equal(service.database.get('PRAGMA integrity_check').integrity_check,'ok');assert.deepEqual(service.database.all('PRAGMA foreign_key_check'),[]);
   const digest=crypto.createHash('sha256').update(JSON.stringify(expected)).digest('hex');results.push({base:i,protectedTables:tables.length,rows:Object.fromEntries(tables.map(t=>[t,expected[t].length])),digest,unchanged:true,migrationCount:service.health().migrationCount});
  }finally{service.close();}
 }
 fs.writeFileSync(path.join(out,'reference-startup-result.json'),JSON.stringify({sha:cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),results},null,2));console.log('REFERENCE_STARTUP_OK '+results.length+' databases; real migrations/backups/defaults/indexes; originals unopened');
})().catch(error=>{console.error(error);process.exitCode=1;});
