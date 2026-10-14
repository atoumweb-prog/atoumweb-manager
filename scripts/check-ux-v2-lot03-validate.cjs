'use strict';
// One frozen combined candidate. No retries, no skips represented as passes.
const cp=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const repo=path.resolve(__dirname,'..'),git=(...args)=>cp.execFileSync('git',args,{cwd:repo,encoding:'utf8'}).trim();
if(process.argv.length>3||(process.argv[2]&&process.argv[2]!=='--native-only'))throw Error('Usage: node scripts/check-ux-v2-integration-validate.cjs [--native-only]');
if(git('status','--porcelain'))throw Error('Commit candidate before validation');
const nativeOnly=process.argv[2]==='--native-only',sha=git('rev-parse','HEAD'),tree=git('rev-parse','HEAD^{tree}');
const out=path.join(repo,'outputs','lot03-'+sha.slice(0,8)+'-'+Date.now());fs.mkdirSync(out,{recursive:true});
const manifest={sha,tree,dirty:false,onlyTemp:true,combinedCrmValidation:true,notExecuted:nativeOnly?['typecheck','vitest (separate required CI steps)']:[],steps:[]};
const steps=[
 ...nativeOnly?[]:[['typecheck',[require.resolve('typescript/bin/tsc'),'--noEmit']],['vitest',['scripts/run-tests.cjs','--maxWorkers=2']]],
 ['integration',['scripts/check-ux-v2-integration-02-03.cjs']],
 ['crm03de',['scripts/check-ux-v2-03e-directory.cjs']],
 ['crm',['scripts/check-ux-v2-lot01a-real-ui.cjs','--lot03b','--captures',path.join(out,'crm-captures')]],
 ['search',['scripts/check-ux-v2-lot01a-real-ui.cjs','--search-only']],
 ['home',['scripts/check-ux-v2-02d-home.cjs']],
 ['final-visual',['scripts/check-ux-v2-final-recipe.cjs']],
 ['journeys',['scripts/check-ux-v2-02e-journeys.cjs']],
 ['shell',['scripts/check-ux-v2-lot01a-real-ui.cjs','--captures',path.join(out,'shell-captures')]],
 ['ux01',['scripts/check-unsaved-inputs-ui.cjs','--lot-b','--lot-c','--review']],
];
for(const [name,args] of steps){
 const start=Date.now(),env={...process.env};if(name==='home')env.ATOUMWEB_UXV2_02D_CAPTURES=path.join(out,'home-captures');
 if(name==='crm03de'){env.ATOUMWEB_UXV2_03D_CAPTURES=path.join(out,'client-captures');env.ATOUMWEB_UXV2_03E_CAPTURES=path.join(out,'directory-captures');}
 if(name==='final-visual')env.ATOUMWEB_UXV2_FINAL_CAPTURES=path.join(out,'final-visual-captures');
 console.log('INTEGRATION START '+name);
 const run=cp.spawnSync(process.execPath,args,{cwd:repo,env,encoding:'utf8',windowsHide:true,maxBuffer:32*1024*1024});
 const log=(run.stdout||'')+(run.stderr||'');fs.writeFileSync(path.join(out,name+'.log'),log);
 const summaries=log.split(/\r?\n/).filter(line=>/RESULT|EVIDENCE|RESIZE_BASELINE|PASSED|Fixture cleaned|Tests\s+\d+ passed|Duration/.test(line));
 const ux=log.split(/\r?\n/).find(line=>line.startsWith('{"checks":'));if(ux){const result=JSON.parse(ux);summaries.push(JSON.stringify({checks:result.checks,failed:result.failed}));}
 manifest.steps.push({name,exitCode:run.status,elapsedMs:Date.now()-start,error:run.error?.message,summaries});
 fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));
 console.log('INTEGRATION END '+name+' exit='+run.status+' '+((Date.now()-start)/1000).toFixed(2)+'s');summaries.forEach(line=>console.log(line));
 if(run.error||run.status!==0){console.error(log.slice(-9000));process.exit(1);}
 for(const line of log.split(/\r?\n/).filter(line=>/^\w*RESULT \{/.test(line))){
  const result=JSON.parse(line.slice(line.indexOf('{')));
  if(result.consoleErrors?.length)throw Error(name+' unexpected renderer console errors: '+JSON.stringify(result.consoleErrors));
 }
}
if(git('status','--porcelain')||git('rev-parse','HEAD')!==sha)throw Error('Candidate changed during validation');
manifest.crmCaptures=['client','directory'].flatMap(name=>JSON.parse(fs.readFileSync(path.join(out,name+'-captures','frames.json'),'utf8')).captures);if(manifest.crmCaptures.length!==81||manifest.crmCaptures.some(item=>!item.compositorVerified))throw Error('81 new CRM composited frames required');
manifest.validated=true;manifest.completedAt=new Date().toISOString();
manifest.captures=['crm','home','shell'].flatMap(name=>fs.readdirSync(path.join(out,name+'-captures')).filter(file=>file.endsWith('.png')).map(file=>({name,file,sha256:require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(out,name+'-captures',file))).digest('hex')})));
if(manifest.captures.length!==81)throw Error('Expected 9 CRM + 9 Home + 63 shell compositor-verified captures');
manifest.finalVisual=JSON.parse(fs.readFileSync(path.join(out,'final-visual-captures','observations.json'),'utf8'));
if(manifest.finalVisual.captures.length!==135||new Set(manifest.finalVisual.captures.map(item=>item.scene)).size!==15)throw Error('Expected 15 populated scenes x 9 theme/density combinations');
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));
const evidence=JSON.stringify(manifest,null,2);if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'\n## Combined native evidence\n```json\n'+evidence+'\n```\n');
console.log('INTEGRATION_COMPLETE '+out);
