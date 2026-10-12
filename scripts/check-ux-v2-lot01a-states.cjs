/* UX V2 / 01A / R01A-07: Chromium diagnostic of computed status text contrast.
 * node scripts/check-ux-v2-lot01a-states.cjs
 * Isolated TEMP HTML using all renderer CSS; never accesses user data or SQLite.
 */
'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const envKey='ATOUMWEB_UXV2_01A_STATUS_TMP',prefix='atoumweb-uxv2-status-';
const tests=[
 ['success','success-badge'],['notice','notice'],
 ['warning-priority','operation-priority priority-high'],
 ['error-priority','operation-priority priority-urgent'],
 ['critical-alert','operations-alert alert-critical'],
 ['warning-alert','operations-alert alert-warning']
];
const themes=['atoumweb','noir','blanc'];
const normalize=s=>process.platform==='win32'?s.toLowerCase():s;
const owned=p=>p&&fs.existsSync(p)&&path.basename(p).startsWith(prefix)&&normalize(fs.realpathSync.native(path.dirname(p)))===normalize(fs.realpathSync.native(os.tmpdir()));
const ensure=(yes,msg)=>{if(!yes)throw Error(msg)};
ensure(process.argv.length===2,'No options accepted: this test is TEMP-only.');
if(!process.versions.electron){
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),prefix));
 try{
  const entry=fs.readFileSync(path.join(root,'src/renderer/main.tsx'),'utf8');
  const cssFiles=[...entry.matchAll(/^import '\.\/([^']+\.css)';$/gm)].map(m=>m[1]);
  ensure(cssFiles.length===31,'Renderer CSS chain changed: revalidate the fixture');
  const css=cssFiles.map(name=>fs.readFileSync(path.join(root,'src/renderer',name),'utf8')).join('\n');
  ensure(!css.includes('</style'),'Unsafe embedded style tag');
  const elements=tests.map(([id,selector])=>{
   const tag=selector.includes('operations-alert')?'button':'span';
   return '<'+tag+' id="'+id+'" class="'+selector+'">État TEST '+id+'</'+tag+'>';
  }).join('\n');
  fs.writeFileSync(path.join(tmp,'fixture.html'),'<html lang="fr"><head><meta charset="utf-8"><style>'+
    css+'</style></head><body><main class="content-area"><div class="panel" id="probe-panel">'+
    elements+'</div></main></body></html>');
  const env={...process.env,[envKey]:tmp};delete env.ELECTRON_RUN_AS_NODE;
  const run=spawnSync(require('electron'),[__filename],{
   cwd:root,env,windowsHide:true,encoding:'utf8',timeout:75000,maxBuffer:1024*1024
  });
  process.stdout.write(run.stdout||'');process.stderr.write(run.stderr||'');
  if(run.error)throw run.error;
  ensure(run.status===0,'Status contrast diagnostics failed (exit '+run.status+')');
 }catch(e){console.error('[UXV2 STATES] FAILED',e.stack||e);process.exitCode=1;}
 finally{
  ensure(owned(tmp),'Refusing unsafe temp cleanup');
  fs.rmSync(tmp,{recursive:true,force:true,maxRetries:6,retryDelay:250});
  console.log('[UXV2 STATES] Fixture cleaned: '+!fs.existsSync(tmp));
 }
}else{
 const {app,BrowserWindow}=require('electron'),tmp=process.env[envKey];
 ensure(owned(tmp),'Native Electron requires a parent-owned TEMP fixture');
 app.disableHardwareAcceleration();app.setPath('userData',path.join(tmp,'profile'));app.on('window-all-closed',()=>{});
 const inspect=function(theme,rows){
  document.documentElement.dataset.theme=theme;
  const panel=document.getElementById('probe-panel');
  const base=getComputedStyle(panel).backgroundColor;
  const canvas=document.createElement('canvas');
  canvas.width=1;canvas.height=1;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  const px=layers=>{
   ctx.clearRect(0,0,1,1);
   for(const color of layers){ctx.fillStyle=color;ctx.fillRect(0,0,1,1);}
   return Array.from(ctx.getImageData(0,0,1,1).data).slice(0,3);
  };
  const lum=rgb=>{
   const c=rgb.map(n=>{const x=n/255;return x<=.04045?x/12.92:Math.pow((x+.055)/1.055,2.4)});
   return .2126*c[0]+.7152*c[1]+.0722*c[2];
  };
  return rows.map(([id,selector])=>{
   const el=document.getElementById(id),style=getComputedStyle(el);
   const bg=px([base,style.backgroundColor]);
   const fg=px([base,style.backgroundColor,style.color]);
   const a=lum(fg),b=lum(bg);
   return {id,selector,color:style.color,background:style.backgroundColor,
    ratio:Number(((Math.max(a,b)+.05)/(Math.min(a,b)+.05)).toFixed(2))};
  });
 };
 app.whenReady().then(async()=>{
  const win=new BrowserWindow({show:false,width:1100,height:750,
   webPreferences:{sandbox:true,nodeIntegration:false,contextIsolation:true}});
  try{
   await win.loadFile(path.join(tmp,'fixture.html'));
   const results=[];
   for(const theme of themes){
    const audit=await win.webContents.executeJavaScript('('+inspect.toString()+')('+JSON.stringify(theme)+','+JSON.stringify(tests)+')');
    ensure(audit.length===tests.length,'Expected six real status samples');
    for(const row of audit){
     results.push({theme,...row});
     console.log('[UXV2 STATES] '+theme+'/'+row.id+' '+row.ratio+':1 '+(row.ratio>=4.5?'PASS':'REVIEW'));
    }
   }
   const issues=results.filter(x=>x.ratio<4.5);
   console.log('[UXV2 STATES] REPORT '+JSON.stringify({
    measured:results.length,passed:results.length-issues.length,issues,cssChain:31,onlyTemp:true
   }));
   if(issues.length)process.exitCode=1;
  }catch(e){console.error('[UXV2 STATES] ERROR',e.stack||e);process.exitCode=1;}
  finally{win.destroy();app.exit(process.exitCode||0);}
 }).catch(e=>{console.error('[UXV2 STATES] INITIALIZATION ERROR',e.stack||e);app.exit(1)});
}
