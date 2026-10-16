'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const repo=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(__dirname,'check-ux-v2-lot01a-real-ui.cjs'),'utf8');
const seam="require('./fixtures/02c-search-scenarios.cjs')";
if(source.split(seam).length!==2)throw Error('Native harness seam changed');
const generated=path.join(repo,'outputs','client-b-owned-'+Date.now()+'.cjs');
fs.mkdirSync(path.dirname(generated),{recursive:true});
fs.writeFileSync(generated,source.replace(seam,"require(path.join(repo,'scripts','fixtures','client-b-scenarios.cjs'))"),{flag:'wx'});
try{const result=cp.spawnSync(process.execPath,[generated,'--search-only'],{cwd:repo,env:process.env,encoding:'utf8',windowsHide:true,maxBuffer:32*1024*1024});process.stdout.write(result.stdout||'');process.stderr.write(result.stderr||'');if(result.error)throw result.error;process.exitCode=result.status??1;}finally{fs.rmSync(generated);}
