'use strict';

// One-shot 03B.6 validation from a clean, detached test worktree.
// Requires installed dev dependencies and Windows/Electron GUI.
// SQLite/profile are private %TEMP% fixtures owned by the native runner.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const repo=path.resolve(__dirname,'..');
const git=(...args)=>cp.execFileSync('git',args,{cwd:repo,encoding:'utf8',windowsHide:true}).trim();
if(process.argv.length!==2)throw Error('Usage: node scripts/check-ux-v2-lot03b-validate.cjs');
if(process.platform!=='win32')throw Error('03B.6 native acceptance must be run on Windows with Electron.');
if(git('status','--porcelain'))throw Error('Validation requires a clean Git worktree.');
const sha=git('rev-parse','HEAD'),tree=git('rev-parse','HEAD^{tree}');
const root=path.join(repo,'outputs','lot03b6-'+sha.slice(0,10)+'-'+Date.now());
const captures=path.join(root,'captures');
if(fs.existsSync(root))throw Error('Refusing to reuse evidence folder');
fs.mkdirSync(root,{recursive:true});
const manifest={lot:'03B.6',sha,tree,os:process.platform,startedAt:new Date().toISOString(),
  nativeRenderer:true,fixture:'owned TEMP SQLite and Electron profile',source:'actual App/preload/IPC',
  validated:false,steps:[],evidenceDirectory:root};
const persist=()=>fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify(manifest,null,2));
persist();
const steps=[
  ['typecheck',[require.resolve('typescript/bin/tsc'),'--noEmit']],
  ['vitest',['scripts/run-tests.cjs','--maxWorkers=2']],
  ['electron-03b',['scripts/check-ux-v2-lot01a-real-ui.cjs','--lot03b','--captures',captures]],
];
for(const [name,args] of steps){
  const started=Date.now();
  const run=cp.spawnSync(process.execPath,args,{cwd:repo,encoding:'utf8',windowsHide:true,
    maxBuffer:32*1024*1024,timeout:name==='electron-03b'?720000:900000});
  const log=(run.stdout||'')+(run.stderr||'');
  fs.writeFileSync(path.join(root,name+'.log'),log);
  manifest.steps.push({name,exitCode:run.status,elapsedMs:Date.now()-started,error:run.error?.message||null});
  persist();
  console.log('LOT03B6 '+name+' '+(run.status===0?'PASS':'FAIL')+' ('+Math.round((Date.now()-started)/1000)+'s)');
  if(run.error||run.status!==0){
    console.error('LOT03B6 FAILED. Read '+path.join(root,name+'.log'));
    process.exit(1);
  }
}
const pngs=fs.readdirSync(captures).filter(file=>file.endsWith('.png'));
if(pngs.length!==9)throw Error('Expected exactly 9 compositor-verified screenshots, got '+pngs.length);
if(git('rev-parse','HEAD')!==sha||git('status','--porcelain'))throw Error('Candidate changed during validation');
manifest.validated=true;manifest.completedAt=new Date().toISOString();
manifest.screenshots=pngs;persist();
console.log('LOT03B6 COMPLETE '+path.join(root,'manifest.json'));
