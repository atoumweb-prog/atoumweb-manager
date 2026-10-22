// Reuse the established real App/preload/IPC harness on isolated TEMP fixtures.
'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const repo=path.resolve(__dirname,'..'),out=path.join(repo,'outputs');fs.mkdirSync(out,{recursive:true});
const source=fs.readFileSync(path.join(__dirname,'check-ux-v2-lot01a-real-ui.cjs'),'utf8'),needle="require('./fixtures/02c-search-scenarios.cjs')";
if(source.split(needle).length!==2)throw Error('Unexpected native harness seam');
const generated=path.join(out,'shell-home-harness-'+Date.now()+'.cjs');
fs.writeFileSync(generated,source.replace(needle,"require(path.join(repo,'scripts','fixtures','shell-home-scenarios.cjs'))").replaceAll('02C_RESULT','SHELL_HOME_RESULT'),{flag:'wx'});
try{const r=cp.spawnSync(process.execPath,[generated,'--search-only'],{cwd:repo,env:process.env,windowsHide:true,encoding:'utf8',maxBuffer:48*1024*1024});process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');if(r.error)throw r.error;process.exitCode=r.status??1;}finally{fs.rmSync(generated);}
