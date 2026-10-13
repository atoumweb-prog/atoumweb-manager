// Grouped local validation, frozen SHA and owned TEMP only. No network, CI dispatch or retry.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const repo=path.resolve(__dirname,'..'),git=(...args)=>cp.execFileSync('git',args,{cwd:repo,encoding:'utf8'}).trim();
if(git('status','--porcelain'))throw Error('Commit candidate before final validation.');
const sha=git('rev-parse','HEAD'),tree=git('rev-parse','HEAD^{tree}'),out=path.join(repo,'outputs','02d-'+sha.slice(0,8)+'-'+Date.now());fs.mkdirSync(out,{recursive:true});
const manifest={sha,tree,dirty:false,onlyTemp:true,steps:[]};
const steps=[
 ['typecheck',[require.resolve('typescript/bin/tsc'),'--noEmit']],
 ['targeted',['scripts/run-tests.cjs','src/shared/homeResourceLoad.test.ts','src/shared/homeWidgetPreference.test.ts','src/shared/workspaceVisualPreferences.test.ts','src/shared/shellVisualPreferences.test.ts','src/main/shellVisualPreferencesIpc.test.ts','--maxWorkers=2']],
 ['vitest',['scripts/run-tests.cjs','--maxWorkers=2']],
 ['home-real',['scripts/check-ux-v2-02d-home.cjs']],
 ['search-real',['scripts/check-ux-v2-lot01a-real-ui.cjs','--search-only']],
 ['real-shell',['scripts/check-ux-v2-lot01a-real-ui.cjs','--captures',path.join(out,'shell-captures')]],
 ['ux01',['scripts/check-unsaved-inputs-ui.cjs','--lot-b','--lot-c','--review']],
];
for(const [name,args] of steps){
 const start=Date.now();console.log('START '+name);
 const env={...process.env};if(name==='home-real')env.ATOUMWEB_UXV2_02D_CAPTURES=path.join(out,'home-captures');
 const run=cp.spawnSync(process.execPath,args,{cwd:repo,env,encoding:'utf8',windowsHide:true,maxBuffer:32*1024*1024});
 fs.writeFileSync(path.join(out,name+'.log'),(run.stdout||'')+(run.stderr||''));manifest.steps.push({name,exitCode:run.status,elapsedMs:Date.now()-start,error:run.error?.message});
 fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));console.log('END '+name+' exit='+run.status+' duration='+((Date.now()-start)/1000).toFixed(2)+'s');
 if(run.error||run.status!==0){console.error('FAIL '+path.join(out,name+'.log'));process.exit(1);}
}
if(git('status','--porcelain')||git('rev-parse','HEAD')!==sha)throw Error('Candidate changed during validation.');
console.log('02D_VALIDATION '+out);
