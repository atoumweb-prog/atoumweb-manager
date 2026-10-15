// Deterministic vector-to-PNG/ICO format conversion. No user workspace or app install.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'assets/brand/candidate'),prefix='atoum-brand-preview-';
if(!process.versions.electron){
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),prefix));
 try{
  require('esbuild').buildSync({entryPoints:[path.join(root,'src/shared/brandArtwork.ts')],bundle:true,platform:'node',format:'cjs',outfile:path.join(temp,'art.cjs')});
  const art=require(path.join(temp,'art.cjs'));fs.mkdirSync(out,{recursive:true});
  for(const[name,svg]of Object.entries({'symbol':art.BRAND_ICON_SVG,'primary-dark':art.BRAND_PRIMARY_SVG,'horizontal-light':art.brandWordmark(false),'horizontal-dark':art.brandWordmark(true)}))fs.writeFileSync(path.join(out,name+'.svg'),svg);
  const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
  const result=spawnSync(require('electron'),[__filename,temp],{cwd:root,env,windowsHide:true,encoding:'utf8',timeout:60000});
  process.stdout.write(result.stdout||'');process.stderr.write(result.stderr||'');if(result.error)throw result.error;if(result.status!==0)throw Error('Brand rasterization failed');
  const sizes=[16,24,32,48,64,128,256],images=sizes.map(size=>fs.readFileSync(path.join(out,'symbol-'+size+'.png')));
  const header=Buffer.alloc(6+16*sizes.length);header.writeUInt16LE(1,2);header.writeUInt16LE(sizes.length,4);let offset=header.length;
  sizes.forEach((size,index)=>{const n=6+16*index;header[n]=header[n+1]=size===256?0:size;header.writeUInt16LE(1,n+4);header.writeUInt16LE(32,n+6);header.writeUInt32LE(images[index].length,n+8);header.writeUInt32LE(offset,n+12);offset+=images[index].length;});
  fs.writeFileSync(path.join(out,'atoum-manager.ico'),Buffer.concat([header,...images]));
  console.log('Prepared 4 SVG, transparent PNG previews and 7-resolution Windows ICO. VISUAL APPROVAL PENDING.');
 }finally{
  const resolved=fs.realpathSync.native(temp),parent=fs.realpathSync.native(os.tmpdir());
  if(path.dirname(resolved).toLowerCase()!==parent.toLowerCase()||!path.basename(resolved).startsWith(prefix))throw Error('Unsafe cleanup');
  fs.rmSync(resolved,{recursive:true,force:true});
 }
}else{
 const {app,BrowserWindow}=require('electron'),temp=process.argv[2];
 if(!temp||path.dirname(path.resolve(temp)).toLowerCase()!==path.resolve(os.tmpdir()).toLowerCase()||!path.basename(temp).startsWith(prefix))throw Error('TEMP profile required');
 app.disableHardwareAcceleration();app.setPath('userData',path.join(temp,'profile'));
 app.whenReady().then(async()=>{
  const win=new BrowserWindow({show:false,webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true}});
  try{
   await win.loadURL('data:text/html;charset=utf-8,<html><body></body></html>');
   for(const[name,width,height]of [['symbol',512,512],...([16,24,32,48,64,128,256].map(n=>['symbol-'+n,n,n])),['primary-dark',512,540],['horizontal-light',1000,240],['horizontal-dark',1000,240]]){
    const svg=fs.readFileSync(path.join(out,name.startsWith('symbol')?'symbol.svg':name+'.svg'),'utf8');
    const raw=await win.webContents.executeJavaScript(`(async()=>{const img=new Image();img.src=${JSON.stringify('data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg))};await img.decode();const canvas=document.createElement('canvas');canvas.width=${width};canvas.height=${height};canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/png').split(',')[1]})()`);
    fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(raw,'base64'));
   }
  }finally{win.destroy();app.quit();}
 }).catch(e=>{console.error(e);app.exit(1);});
}
