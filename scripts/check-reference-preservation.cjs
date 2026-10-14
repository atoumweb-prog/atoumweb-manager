'use strict';
// SQL is opened only on explicitly provided owned copies under outputs/.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const repo=path.resolve(__dirname,'..'),outputs=path.join(repo,'outputs');
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
if(!process.versions.electron){
 const esbuild=require('esbuild'),bundle=path.join(outputs,'reference-migrations.cjs');
 esbuild.buildSync({stdin:{contents:`export * from './src/main/database/NodeSqliteAdapter';export * from './src/main/database/migrations';`,resolveDir:repo,loader:'ts'},bundle:true,platform:'node',format:'cjs',outfile:bundle});
 const baseline=path.join(outputs,'migration-baseline');
 esbuild.buildSync({stdin:{contents:`export * from './src/main/database/migrations';`,resolveDir:baseline,loader:'ts'},bundle:true,platform:'node',format:'cjs',outfile:path.join(outputs,'reference-baseline.cjs')});
 const run=cp.spawnSync(require('electron'),[__filename,...process.argv.slice(2)],{cwd:repo,env:{...process.env,ELECTRON_RUN_AS_NODE:'1'},encoding:'utf8',windowsHide:true});
 process.stdout.write(run.stdout||'');process.stderr.write(run.stderr||'');process.exit(run.status??1);
}
const {NodeSqliteAdapter,MIGRATIONS,applyPendingMigrations}=require(path.join(outputs,'reference-migrations.cjs'));
const baseline=require(path.join(outputs,'reference-baseline.cjs')).MIGRATIONS;
assert.deepEqual(MIGRATIONS.filter(m=>m.id<=66),baseline,'Historical migrations 1–66 were changed');
assert.deepEqual(MIGRATIONS.map(m=>m.id),Array.from({length:70},(_,i)=>i+1));
const sources=JSON.parse(fs.readFileSync(path.resolve(process.argv[2]),'utf8')),results=[];
for(const source of sources){
 const file=path.resolve(source.copy);assert(file.startsWith(outputs+path.sep),'Only owned copies may be opened');
 const db=new NodeSqliteAdapter(file);db.exec('PRAGMA foreign_keys=ON');
 let backup,restored;
 try{
  const names=db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").map(r=>r.name);
  const tables=names.filter(n=>/contract|clause|time|pause|correction|hour_pack|^quotes$|^quote_lines$|^projects$|^project_nodes$|^organizations$|^contacts$|^client_accounts$|activity/.test(n));
  const columns=Object.fromEntries(tables.map(t=>[t,db.all('PRAGMA table_info("'+t+'")').map(r=>r.name)]));
  const snapshot=database=>Object.fromEntries(tables.map(t=>[t,database.all('SELECT '+columns[t].map(c=>'"'+c+'"').join(',')+' FROM "'+t+'"').map(r=>JSON.stringify(r)).sort()]));
  const before=snapshot(db),ledger=db.all('SELECT * FROM schema_migrations ORDER BY id');
  const backupPath=file+'.before.sqlite';db.exec("VACUUM INTO '"+backupPath.replaceAll("'","''")+"'");
  backup=new NodeSqliteAdapter(backupPath);assert.deepEqual(snapshot(backup),before);backup.close();backup=null;
  const applied=applyPendingMigrations(db);assert.deepEqual(snapshot(db),before,'Protected contract/time/dependency rows changed');
  assert.deepEqual(db.all('SELECT * FROM schema_migrations WHERE id<=? ORDER BY id',[Math.max(...ledger.map(m=>m.id))]),ledger,'Historical migration ledger rewritten');
  assert.equal(db.get('PRAGMA integrity_check').integrity_check,'ok');assert.deepEqual(db.all('PRAGMA foreign_key_check'),[]);
  assert.deepEqual(applyPendingMigrations(db),[]);assert.deepEqual(snapshot(db),before);
  const restoredPath=file+'.restored.sqlite';fs.copyFileSync(backupPath,restoredPath);restored=new NodeSqliteAdapter(restoredPath);restored.exec('PRAGMA foreign_keys=ON');
  assert.deepEqual(snapshot(restored),before);applyPendingMigrations(restored);assert.deepEqual(snapshot(restored),before);assert.deepEqual(restored.all('PRAGMA foreign_key_check'),[]);restored.close();restored=null;
  for(const attached of source.files){const copy=path.join(path.dirname(file),'files',attached.relativePath);assert.equal(hash(fs.readFileSync(copy)),attached.sha256);}
  const after=snapshot(db);
  const proof={source:source.source,copy:file,baselineMigrationCount:ledger.length,applied:applied.map(m=>({id:m.id,name:m.name})),finalMigrationCount:70,protected:tables.map(t=>({table:t,rows:before[t].length,beforeSHA256:hash(JSON.stringify(before[t])),afterSHA256:hash(JSON.stringify(after[t]))})),attachedFiles:source.files.length,backupRestored:true,integrity:true,foreignKeys:true,historicalDefinitionsUnchanged:true};
  results.push(proof);console.log(JSON.stringify({...proof,protected:proof.protected.filter(t=>t.rows>0)}));
 }finally{backup?.close();restored?.close();db.close();}
}
fs.writeFileSync(path.join(outputs,'reference-preservation-result.json'),JSON.stringify({sha:cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),results},null,2));
console.log('REFERENCE_PRESERVATION_OK '+results.length+' original databases untouched');
