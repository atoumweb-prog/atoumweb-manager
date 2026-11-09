'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const repo=path.resolve(__dirname,'..'),input=fs.realpathSync(process.argv[2]),output=path.resolve(process.argv[3]);
const relative=path.relative(fs.realpathSync(os.tmpdir()),input);if(relative.startsWith('..')||path.isAbsolute(relative)||fs.existsSync(output))throw Error('Existing TEMP input and new report required');
let source=fs.readFileSync(path.join(__dirname,'check-ux-v2-lot01a-real-ui.cjs'),'utf8').replace("const repo=path.resolve(__dirname,'..')",'const repo='+JSON.stringify(repo));
source=source.replace('app.disableHardwareAcceleration();',"app.commandLine.appendSwitch('force-device-scale-factor','1');app.disableHardwareAcceleration();");
const seam=source.indexOf(' app.whenReady().then');if(seam<0)throw Error('TEMP UI seam absent');
source='module.paths.unshift('+JSON.stringify(path.join(repo,'node_modules'))+');\n'+source.slice(0,seam)+`
 app.whenReady().then(async()=>{
 const workspace=S.ensureWorkspace(path.join(temp,'workspace')),{DatabaseSync,backup}=require('node:sqlite'),original=new DatabaseSync(${JSON.stringify(input)},{readOnly:true});try{await backup(original,workspace.databaseFile);}finally{original.close();}
 db=new S.DatabaseService(workspace);await db.initialize();db.setSetting('theme','noir');db.setSetting('display_density','comfort');
 const backendErrors=[],handle=ipcMain.handle.bind(ipcMain);ipcMain.handle=(channel,listener)=>handle(channel,async(...args)=>{try{return await listener(...args);}catch(e){backendErrors.push({channel,error:String(e)});throw e;}});
 const results=[],check=(ok,label)=>{assert(ok,label);results.push(label)};
 S.registerIpcHandlers(db,workspace);S.registerOperationsIpcHandlers(db);S.registerReferentialsIpcHandlers(db);S.registerBusinessBackupsIpcHandlers(db);S.registerTimeCorrectionIpcHandler(db);
 win=new BrowserWindow({show:false,width:1920,height:1080,webPreferences:{preload:path.join(temp,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false}});win.webContents.on('console-message',e=>{if(e.level==='error'||e.level===3)consoleErrors.push(e.message)});
 await win.loadFile(path.join(temp,'index.html'));await wait('document.querySelectorAll("[data-nav-module]").length===17','bootstrap');
 const report=await require(path.join(repo,'scripts/fixtures/convergence-visual-consistency.cjs'))({db,win,get,evalUI,navigate,wait,sleep,check,output:${JSON.stringify(output)}});
 check(backendErrors.length===0,'No backend error');check(consoleErrors.length===0,'No renderer error');
 fs.writeFileSync(${JSON.stringify(output)},JSON.stringify({tempOnly:true,checks:results,consoleErrors,backendErrors,...report},null,2));console.log('ACTIVATION_UI '+JSON.stringify({checks:results.length,captures:report.captures.length}));
 }).catch(e=>{console.error(e.stack||e);process.exitCode=1}).finally(()=>{if(win&&!win.isDestroyed())win.destroy();db?.close();app.quit();});
}
`;
const wrapper=path.join(repo,'outputs','activation-ui-'+Date.now()+'.cjs');fs.writeFileSync(wrapper,source);
try{const r=spawnSync(process.execPath,[wrapper],{cwd:repo,windowsHide:true,encoding:'utf8',timeout:180000,maxBuffer:4*1024*1024});process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');if(r.status!==0||!r.stdout.includes('ACTIVATION_UI '))throw Error('Isolated activation UI recipe failed');}finally{fs.unlinkSync(wrapper);}
