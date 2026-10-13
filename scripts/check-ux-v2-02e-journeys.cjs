// Real shell journey recipe via the existing TEMP harness, without touching PR98's shared file.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const repo=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(__dirname,'check-ux-v2-lot01a-real-ui.cjs'),'utf8');
const needle="require('./fixtures/02c-search-scenarios.cjs')";
if(source.split(needle).length!==2)throw Error('Shared harness seam changed; no recipe executed.');
const output=path.join(repo,'outputs');fs.mkdirSync(output,{recursive:true});
const generated=path.join(output,'02e-owned-harness-'+Date.now()+'.cjs');
fs.writeFileSync(generated,source.replace(needle,"require(path.join(repo,'scripts','fixtures','02e-shell-journeys.cjs'))").replaceAll('02C_RESULT','02E_RESULT'),{flag:'wx'});
try{const run=cp.spawnSync(process.execPath,[generated,'--search-only'],{cwd:repo,env:process.env,encoding:'utf8',windowsHide:true,maxBuffer:32*1024*1024});process.stdout.write(run.stdout||'');process.stderr.write(run.stderr||'');if(run.error)throw run.error;process.exitCode=run.status??1;}finally{fs.rmSync(generated);}
