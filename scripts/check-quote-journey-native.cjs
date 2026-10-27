'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const repo=path.resolve(__dirname,'..'),out=path.join(repo,'outputs');fs.mkdirSync(out,{recursive:true});
const source=fs.readFileSync(path.join(__dirname,'check-ux-v2-lot01a-real-ui.cjs'),'utf8');
const seam="require('./fixtures/02c-search-scenarios.cjs')";
if(source.split(seam).length!==2)throw Error('Native harness seam changed');
const generated=path.join(out,'quote-journey-harness-'+Date.now()+'.cjs');
fs.writeFileSync(generated,source.replace(seam,"require(path.join(repo,'scripts','fixtures','quote-journey.cjs'))"));
try{const run=cp.spawnSync(process.execPath,[generated,'--search-only'],{cwd:repo,env:process.env,windowsHide:true,encoding:'utf8',maxBuffer:16*1024*1024});process.stdout.write(run.stdout||'');process.stderr.write(run.stderr||'');if(run.error)throw run.error;process.exitCode=run.status??1;}finally{fs.rmSync(generated);}
