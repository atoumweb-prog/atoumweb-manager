'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const home=path.resolve(__dirname,'..'),repo=process.env.ATOUMWEB_CAPTURE_SOURCE_REPO||home;
const source=fs.readFileSync(path.join(repo,'scripts/check-ux-v2-lot01a-real-ui.cjs'),'utf8');
const seam="require('./fixtures/02c-search-scenarios.cjs')";
if(source.split(seam).length!==2)throw Error('Native seam changed');
const script=path.join(home,'outputs','prospect-density-owned-'+Date.now()+'.cjs');
fs.mkdirSync(path.dirname(script),{recursive:true});
fs.writeFileSync(script,source.replace("repo=path.resolve(__dirname,'..')",'repo='+JSON.stringify(repo)).replace(seam,'require('+JSON.stringify(path.join(home,'scripts/fixtures/prospect-density-scenarios.cjs'))+')'),{flag:'wx'});
try{const r=cp.spawnSync(process.execPath,[script,'--search-only'],{cwd:repo,env:process.env,encoding:'utf8',windowsHide:true,maxBuffer:32*1024*1024});process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');if(r.error)throw r.error;process.exitCode=r.status??1;}finally{fs.rmSync(script);}
