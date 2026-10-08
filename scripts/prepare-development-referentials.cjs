// Explicit integration tool, excluded from npm test. Never runs at normal startup.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const repo=path.resolve(__dirname,'..');
if(!process.versions.electron){
 const run=spawnSync(require('electron'),[__filename,...process.argv.slice(2)],{cwd:repo,env:{...process.env,ELECTRON_RUN_AS_NODE:'1'},windowsHide:true,encoding:'utf8'});
 process.stdout.write(run.stdout||'');process.stderr.write(run.stderr||'');if(run.error)throw run.error;process.exitCode=run.status??1;
}else{
 const args=process.argv.slice(2),option=name=>args[args.indexOf(name)+1];
 if(!args.includes('--development-confirmed')||!args.includes('--workspace')||!args.includes('--output'))throw Error('--development-confirmed --workspace ABS --output ABS required');
 const workspace=path.resolve(option('--workspace')),output=path.resolve(option('--output'));
 if(path.basename(workspace)!=='Validation-MSI')throw Error('Only the explicitly authorized development workspace is supported');
 fs.mkdirSync(output,{recursive:true});const temp=fs.mkdtempSync(path.join(os.tmpdir(),'atoumweb-native-integration-'));
 try{
  const base=repo.replaceAll('\\','/');require('esbuild').buildSync({stdin:{contents:`export * from '${base}/src/main/database/NodeSqliteAdapter';export * from '${base}/src/main/database/migrations';export * from '${base}/src/main/testSupport/prepareDevelopmentReferentials';`,resolveDir:repo,loader:'ts'},bundle:true,platform:'node',format:'cjs',outfile:path.join(temp,'services.cjs'),external:['electron'],logLevel:'silent'});
  const {NodeSqliteAdapter,applyPendingMigrations,prepareDevelopmentReferentials}=require(path.join(temp,'services.cjs'));
  const db=new NodeSqliteAdapter(path.join(workspace,'data','atoumweb-manager.sqlite'));
  try{
   db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000');
   if(!args.includes('--migrations-backed-up'))throw Error('Create a coordinated SQLite backup before passing --migrations-backed-up');
   const migrations=applyPendingMigrations(db);
   const result=prepareDevelopmentReferentials(db,true);
   const replay=prepareDevelopmentReferentials(db,true);
   if(replay.changes.length||replay.importPlan.rows.some(row=>row.action!=='unchanged'))throw Error('Development preparation replay is not neutral');
   db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
   fs.writeFileSync(path.join(output,'preparation-referentiels.json'),JSON.stringify({migrations:migrations.map(m=>({id:m.id,name:m.name})),result,replay},null,2));
   process.stdout.write(JSON.stringify({migrations:migrations.map(m=>m.id),changes:result.changes.length,readyModels:result.latestModels.length,readyAssociations:result.latestAssociations.length,replayChanges:replay.changes.length,integrity:result.integrity,foreignKeys:result.foreignKeys})+'\n');
  }finally{db.close();}
 }finally{if(!path.resolve(temp).startsWith(path.resolve(os.tmpdir())+path.sep)||!path.basename(temp).startsWith('atoumweb-native-integration-'))throw Error('Unsafe temporary build');fs.rmSync(temp,{recursive:true,force:true});}
}
