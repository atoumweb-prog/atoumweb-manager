'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const repo=path.resolve(__dirname,'..'),state=JSON.parse(fs.readFileSync(path.join(__dirname,'convergence-state.json'),'utf8'));
const sha=cp.execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim();
if(cp.execFileSync('git',['status','--porcelain'],{cwd:repo,encoding:'utf8'}).trim())throw Error('Commit the candidate before native validation');
const out=path.join(repo,'outputs','convergence-'+state.phase+'-'+sha.slice(0,8)+'-'+Date.now());fs.mkdirSync(out,{recursive:true});
const manifest={sha,phase:state.phase,onlyTemporaryFixtures:true,steps:[]};
for(const [name,args,environment={}] of state.nativeChecks){
 console.log('CONVERGENCE_START '+name);const start=Date.now();
 const expanded=args.map(arg=>arg.replaceAll('{out}',out));
 const run=cp.spawnSync(process.execPath,expanded,{cwd:repo,env:{...process.env,...environment},encoding:'utf8',windowsHide:true,maxBuffer:48*1024*1024});
 const log=(run.stdout||'')+(run.stderr||'');fs.writeFileSync(path.join(out,name+'.log'),log);
 const summaries=log.split(/\r?\n/).filter(l=>/RESULT |PASSED|Fixture cleaned|"passed":|"failed":/.test(l));
 const ux=log.split(/\r?\n/).find(l=>l.startsWith('{"checks":'));if(ux){const j=JSON.parse(ux);summaries.push(JSON.stringify({checks:j.checks,failed:j.failed}));}
 manifest.steps.push({name,args:expanded,environment,exitCode:run.status,elapsedMs:Date.now()-start,summaries});
 fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));
 console.log('CONVERGENCE_END '+name+' exit='+run.status+' seconds='+((Date.now()-start)/1000).toFixed(2));summaries.forEach(l=>console.log(l));
 if(run.status!==0||run.error){console.error(log.slice(-8000));throw run.error||Error('Native validation failed: '+name);}
}
manifest.validated=true;fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'\n## Native convergence evidence\n```json\n'+JSON.stringify(manifest,null,2)+'\n```\n');
console.log('CONVERGENCE_COMPLETE '+out);
