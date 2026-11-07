'use strict';
// Reuse the real App/preload/IPC TEMP harness. No user workspace or installed app.
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const repo=path.resolve(__dirname,'..'),out=path.join(repo,'outputs');fs.mkdirSync(out,{recursive:true});
let source=fs.readFileSync(path.join(__dirname,'check-ux-v2-lot01a-real-ui.cjs'),'utf8');
source=source.replace("const repo=path.resolve(__dirname,'..')",'const repo='+JSON.stringify(repo));
source=source.replace('app.disableHardwareAcceleration();',"app.commandLine.appendSwitch('force-device-scale-factor','1');app.disableHardwareAcceleration();");
const a=source.indexOf('  if(searchOnly){'),b=source.indexOf('  if(lot08a){',a);if(a<0||b<0)throw Error('Native harness seam absent');
source=source.slice(0,a)+`  if(searchOnly){await require(${JSON.stringify(path.join(__dirname,'fixtures/offres-tarifs-lot1.cjs'))})({win,db,evalUI,get,wait,navigate,test,sleep,consoleErrors});return;}\n`+source.slice(b);
const wrapper=path.join(out,'offres-tarifs-lot1-'+Date.now()+'.cjs');fs.writeFileSync(wrapper,source);
try{const r=spawnSync(process.execPath,[wrapper,'--search-only'],{cwd:repo,windowsHide:true,encoding:'utf8',timeout:180000,maxBuffer:4*1024*1024});process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');if(r.error)throw r.error;if(r.status!==0)process.exitCode=1;}finally{fs.unlinkSync(wrapper);}
