// Reuse the real App/IPC/TEMP harness without editing the shared harness evolving in PR98.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const repo=path.resolve(__dirname,'..'),out=path.join(repo,'outputs');fs.mkdirSync(out,{recursive:true});
const source=fs.readFileSync(path.join(__dirname,'check-ux-v2-lot01a-real-ui.cjs'),'utf8');
const needle="require('./fixtures/02c-search-scenarios.cjs')";
if(source.split(needle).length!==2)throw Error('Unexpected harness seam; refusing to run a modified recipe.');
const generated=path.join(out,'02d-owned-harness-'+Date.now()+'.cjs');
const seam="require(path.join(repo,'scripts','fixtures','02d-home-scenarios.cjs'))";
const content=source.replace(needle,seam).replaceAll('02C_RESULT','02D_RESULT');
fs.writeFileSync(generated,content,{flag:'wx'});
try{
 const run=cp.spawnSync(process.execPath,[generated,'--search-only'],{cwd:repo,env:process.env,windowsHide:true,encoding:'utf8',maxBuffer:32*1024*1024});
 process.stdout.write(run.stdout||'');process.stderr.write(run.stderr||'');
 if(run.error)throw run.error;process.exitCode=run.status??1;
}finally{fs.rmSync(generated);}
