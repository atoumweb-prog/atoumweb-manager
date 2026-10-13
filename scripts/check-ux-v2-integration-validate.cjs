'use strict';
// One frozen combined candidate. No retries, no skips represented as passes.
const cp=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const repo=path.resolve(__dirname,'..'),git=(...args)=>cp.execFileSync('git',args,{cwd:repo,encoding:'utf8'}).trim();
if(process.argv.length>3||(process.argv[2]&&process.argv[2]!=='--native-only'))throw Error('Usage: node scripts/check-ux-v2-integration-validate.cjs [--native-only]');
if(git('status','--porcelain'))throw Error('Commit candidate before validation');
const nativeOnly=process.argv[2]==='--native-only',sha=git('rev-parse','HEAD'),tree=git('rev-parse','HEAD^{tree}');
const out=path.join(repo,'outputs','integration-'+sha.slice(0,8)+'-'+Date.now());fs.mkdirSync(out,{recursive:true});
const manifest={sha,tree,dirty:false,onlyTemp:true,combinedCrmValidation:true,notExecuted:nativeOnly?['typecheck','vitest (separate required CI steps)']:[],steps:[]};
const steps=[
 ...nativeOnly?[]:[['typecheck',[require.resolve('typescript/bin/tsc'),'--noEmit']],['vitest',['scripts/run-tests.cjs','--maxWorkers=2']]],
 ['integration',['scripts/check-ux-v2-integration-02-03.cjs']],
 ['crm',['scripts/check-ux-v2-lot01a-real-ui.cjs','--lot03b','--captures',path.join(out,'crm-captures')]],
 ['search',['scripts/check-ux-v2-lot01a-real-ui.cjs','--search-only']],
 ['home',['scripts/check-ux-v2-02d-home.cjs']],
 ['journeys',['scripts/check-ux-v2-02e-journeys.cjs']],
 ['shell',['scripts/check-ux-v2-lot01a-real-ui.cjs','--captures',path.join(out,'shell-captures')]],
 ['ux01',['scripts/check-unsaved-inputs-ui.cjs','--lot-b','--lot-c','--review']],
];
for(const [name,args] of steps){
 const start=Date.now(),env={...process.env};if(name==='home')env.ATOUMWEB_UXV2_02D_CAPTURES=path.join(out,'home-captures');
 console.log('INTEGRATION START '+name);
 const run=cp.spawnSync(process.execPath,args,{cwd:repo,env,encoding:'utf8',windowsHide:true,maxBuffer:32*1024*1024});
 const log=(run.stdout||'')+(run.stderr||'');fs.writeFileSync(path.join(out,name+'.log'),log);
 const summaries=log.split(/\r?\n/).filter(line=>/RESULT|PASSED|Fixture cleaned|Tests\s+\d+ passed|Duration/.test(line));
 manifest.steps.push({name,exitCode:run.status,elapsedMs:Date.now()-start,error:run.error?.message,summaries});
 fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));
 console.log('INTEGRATION END '+name+' exit='+run.status+' '+((Date.now()-start)/1000).toFixed(2)+'s');summaries.forEach(line=>console.log(line));
 if(run.error||run.status!==0){console.error(log.slice(-9000));process.exit(1);}
}
if(git('status','--porcelain')||git('rev-parse','HEAD')!==sha)throw Error('Candidate changed during validation');
manifest.validated=true;manifest.completedAt=new Date().toISOString();
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));
const evidence=JSON.stringify(manifest,null,2);if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'\n## Combined native evidence\n```json\n'+evidence+'\n```\n');
console.log('INTEGRATION_COMPLETE '+out);
