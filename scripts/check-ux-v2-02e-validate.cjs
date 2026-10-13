// Frozen local recipe of the independent 02E scope, never an integration of PR98.
const cp=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const repo=path.resolve(__dirname,'..'),git=(...args)=>cp.execFileSync('git',args,{cwd:repo,encoding:'utf8'}).trim();
if(git('status','--porcelain'))throw Error('Commit candidate before validation.');
const sha=git('rev-parse','HEAD'),tree=git('rev-parse','HEAD^{tree}'),out=path.join(repo,'outputs','02e-'+sha.slice(0,8)+'-'+Date.now());fs.mkdirSync(out,{recursive:true});
const manifest={sha,tree,dirty:false,onlyTemp:true,combinedCrmValidation:false,steps:[]};
const steps=[
 ['compatibility-map',['scripts/check-ux-v2-compatibility-map.cjs']],
 ['typecheck',[require.resolve('typescript/bin/tsc'),'--noEmit']],
 ['targeted',['scripts/run-tests.cjs','src/shared/searchNavigation.test.ts','src/shared/unsavedRegistry.test.ts','src/shared/draftSection.test.ts','--maxWorkers=2']],
 ['vitest',['scripts/run-tests.cjs','--maxWorkers=2']],
 ['journeys',['scripts/check-ux-v2-02e-journeys.cjs']],
 ['search-real',['scripts/check-ux-v2-lot01a-real-ui.cjs','--search-only']],
 ['home-real',['scripts/check-ux-v2-02d-home.cjs']],
 ['real-shell',['scripts/check-ux-v2-lot01a-real-ui.cjs','--captures',path.join(out,'shell-captures')]],
 ['ux01',['scripts/check-unsaved-inputs-ui.cjs','--lot-b','--lot-c','--review']],
 ['header-workshop',['scripts/check-ux-v2-lot02b-workshop.cjs']],
];
for(const [name,args] of steps){
 console.log('START '+name);const start=Date.now(),env={...process.env};if(name==='home-real')env.ATOUMWEB_UXV2_02D_CAPTURES=path.join(out,'home-captures');
 const run=cp.spawnSync(process.execPath,args,{cwd:repo,env,encoding:'utf8',windowsHide:true,maxBuffer:32*1024*1024});
 fs.writeFileSync(path.join(out,name+'.log'),(run.stdout||'')+(run.stderr||''));manifest.steps.push({name,exitCode:run.status,elapsedMs:Date.now()-start,error:run.error?.message});
 fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));console.log('END '+name+' exit='+run.status+' duration='+((Date.now()-start)/1000).toFixed(2)+'s');
 if(run.error||run.status!==0){console.error('FAIL '+path.join(out,name+'.log'));process.exit(1);}
}
if(git('status','--porcelain')||git('rev-parse','HEAD')!==sha)throw Error('Candidate changed during recipe.');
console.log('02E_VALIDATION '+out);
