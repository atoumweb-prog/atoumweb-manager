'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const repo=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(__dirname,'check-ux-v2-lot01a-real-ui.cjs'),'utf8');
const needle="require('./fixtures/02c-search-scenarios.cjs')";
if(source.split(needle).length!==2)throw Error('Native seam changed');
const out=path.join(repo,'outputs');fs.mkdirSync(out,{recursive:true});
const file=path.join(out,'navigation07ab-owned-'+Date.now()+'.cjs');
fs.writeFileSync(file,source.replace(needle,"require(path.join(repo,'scripts','fixtures','07ab-navigation-scenarios.cjs'))").replaceAll('02C_RESULT','NAVIGATION07AB_RESULT'),{flag:'wx'});
try{const r=cp.spawnSync(process.execPath,[file,'--search-only'],{cwd:repo,env:process.env,encoding:'utf8',windowsHide:true,maxBuffer:32*1024*1024});process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');if(r.error)throw r.error;process.exitCode=r.status??1;}finally{fs.rmSync(file);}
