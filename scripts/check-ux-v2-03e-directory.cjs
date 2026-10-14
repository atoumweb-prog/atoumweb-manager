'use strict';
// Same real Manager/TEMP harness as every combined recipe. No installed profile.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const repo=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(__dirname,'check-ux-v2-lot01a-real-ui.cjs'),'utf8');
const needle="require('./fixtures/02c-search-scenarios.cjs')";
if(source.split(needle).length!==2)throw Error('Shared native seam changed');
const out=path.join(repo,'outputs');fs.mkdirSync(out,{recursive:true});
const generated=path.join(out,'directory03e-owned-harness-'+Date.now()+'.cjs');
fs.writeFileSync(generated,source.replace(needle,"require(path.join(repo,'scripts','fixtures','03e-directory-scenarios.cjs'))").replaceAll('02C_RESULT','DIRECTORY03E_RESULT'),{flag:'wx'});
try{const run=cp.spawnSync(process.execPath,[generated,'--search-only'],{cwd:repo,env:process.env,encoding:'utf8',windowsHide:true,maxBuffer:32*1024*1024});process.stdout.write(run.stdout||'');process.stderr.write(run.stderr||'');if(run.error)throw run.error;process.exitCode=run.status??1;}finally{fs.rmSync(generated);}
