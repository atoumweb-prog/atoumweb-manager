// One explicit local validation of a frozen lot. No GitHub operation, retry or real workspace.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const repo=path.resolve(__dirname,'..');
const git=(...args)=>cp.execFileSync('git',args,{cwd:repo,encoding:'utf8'}).trim();
const sha=git('rev-parse','HEAD'),tree=git('rev-parse','HEAD^{tree}');
if(git('status','--porcelain'))throw Error('Commit local changes before producing final SHA evidence.');
const out=path.join(repo,'outputs','real-shell-'+sha.slice(0,8)+'-'+Date.now());fs.mkdirSync(out,{recursive:true});
const manifest={sha,tree,dirty:false,onlyTemp:true,steps:[]};
const steps=[
 ['typecheck',[require.resolve('typescript/bin/tsc'),'--noEmit']],
 ['vitest',['scripts/run-tests.cjs','--maxWorkers=2']],
 ['real-renderer',['scripts/check-ux-v2-lot01a-real-ui.cjs','--captures',path.join(out,'captures')]],
 ['ux01',['scripts/check-unsaved-inputs-ui.cjs','--lot-b','--lot-c','--review']],
 ['workshop02a',['scripts/check-ux-v2-lot02a-workshop.cjs']],
 ['workshop02b',['scripts/check-ux-v2-lot02b-workshop.cjs']],
 ['foundation01f',['scripts/check-ux-v2-lot01f-workshop.cjs']],
];
for(const [name,args] of steps){
 const start=Date.now();console.log('START '+name);
 const run=cp.spawnSync(process.execPath,args,{cwd:repo,encoding:'utf8',windowsHide:true,maxBuffer:32*1024*1024});
 fs.writeFileSync(path.join(out,name+'.log'),(run.stdout||'')+(run.stderr||''));
 manifest.steps.push({name,exitCode:run.status,elapsedMs:Date.now()-start,error:run.error?.message});
 fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));
 console.log('END '+name+' exit='+run.status+' duration='+((Date.now()-start)/1000).toFixed(2)+'s');
 if(run.error||run.status!==0){console.error('FAIL '+name+' : '+path.join(out,name+'.log'));process.exit(1);}
}
if(git('rev-parse','HEAD')!==sha||git('status','--porcelain'))throw Error('Candidate changed during validation.');
console.log('VALIDATION_COMPLETE '+path.join(out,'manifest.json'));
