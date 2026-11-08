'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const repo=path.resolve(__dirname,'..'),out=path.join(repo,'outputs');fs.mkdirSync(path.join(out,'Offres-Tarifs-Lot2-Finalisation-2026-11-07'),{recursive:true});
const reviewOnly=true;
if(reviewOnly)fs.mkdirSync(path.join(out,'Offres-Tarifs-Lot2-Revue-Consolidee-2026-11-07'),{recursive:true});
let source=fs.readFileSync(path.join(__dirname,'check-ux-v2-lot01a-real-ui.cjs'),'utf8').replace("const repo=path.resolve(__dirname,'..')",'const repo='+JSON.stringify(repo));
source=source.replace("'database/DatabaseService','workspace'","'database/DatabaseService','database/catalogDraftPersistenceMigration','unsaved','workspace'");
source=source.replace('app.disableHardwareAcceleration();',"app.commandLine.appendSwitch('force-device-scale-factor','1');app.disableHardwareAcceleration();");
const seam=source.indexOf(' app.whenReady().then');if(seam<0)throw Error('TEMP harness seam absent');
source='module.paths.unshift('+JSON.stringify(path.join(repo,'node_modules'))+');\n'+source.slice(0,seam)+fs.readFileSync(path.join(__dirname,'fixtures/offres-tarifs-lot2-legacy.cjs'),'utf8');
const wrapper=path.join(out,'offres-tarifs-final-'+Date.now()+'.cjs');fs.writeFileSync(wrapper,source);
try{const r=spawnSync(process.execPath,[wrapper],{cwd:repo,windowsHide:true,encoding:'utf8',timeout:180000,maxBuffer:4*1024*1024});process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');if(r.error)throw r.error;if(r.status!==0||!r.stdout.includes('LOT2_LEGACY_RESULT '))throw Error('Native lot-2 finalization recipe did not complete');}
catch(e){console.error(e.stack||e);process.exitCode=1;}finally{fs.unlinkSync(wrapper);}
