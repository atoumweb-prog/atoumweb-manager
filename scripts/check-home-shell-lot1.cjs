// Real App/preload/IPC harness; new owned TEMP fixture, no user workspace.
'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const repo=path.resolve(__dirname,'..'),out=process.env.ATOUMWEB_UX_LOT1_OUTPUT;
if(!out||!path.isAbsolute(out)||fs.existsSync(out)||/validation-msi/i.test(out))throw Error('Set ATOUMWEB_UX_LOT1_OUTPUT to a new absolute artifact directory.');
fs.mkdirSync(out,{recursive:true});fs.mkdirSync(path.join(repo,'outputs'),{recursive:true});
const source=fs.readFileSync(path.join(__dirname,'check-ux-v2-lot01a-real-ui.cjs'),'utf8'),needle="require('./fixtures/02c-search-scenarios.cjs')";
if(source.split(needle).length!==2)throw Error('Unexpected native harness seam');
const generated=path.join(repo,'outputs','home-shell-lot1-'+Date.now()+'.cjs');
// The source fixture's historical 74-migration assertion predates this 80-migration base.
fs.writeFileSync(generated,source.replace(needle,"require(path.join(repo,'scripts','fixtures','home-shell-lot1.cjs'))").replace('Array.from({length:74}','Array.from({length:80}'),{flag:'wx'});
try{const r=cp.spawnSync(process.execPath,[generated,'--search-only'],{cwd:repo,env:process.env,windowsHide:true,encoding:'utf8',maxBuffer:48*1024*1024});fs.writeFileSync(path.join(out,'execution.log'),(r.stdout||'')+(r.stderr||''));process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');if(r.error)throw r.error;process.exitCode=r.status??1;}finally{fs.unlinkSync(generated);}
