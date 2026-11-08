'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{pathToFileURL}=require('node:url'),{spawnSync}=require('node:child_process');
if(!process.versions.electron){const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;const r=spawnSync(require('electron'),[__filename,...process.argv.slice(2)],{env,encoding:'utf8',windowsHide:true,timeout:240000,maxBuffer:1024*1024});process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');process.exit(r.status??1);}
const {app,BrowserWindow}=require('electron'),root=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]),temp=fs.mkdtempSync(path.join(os.tmpdir(),'atoumweb-pdf-review-'));
if(fs.existsSync(out))throw Error('Use a new render directory');fs.mkdirSync(out,{recursive:true});app.setPath('userData',path.join(temp,'profile'));app.disableHardwareAcceleration();
const pdfjs=pathToFileURL(require.resolve('pdfjs-dist/build/pdf.mjs')).href,worker=pathToFileURL(require.resolve('pdfjs-dist/build/pdf.worker.min.mjs')).href;
fs.writeFileSync(path.join(temp,'index.html'),`<html><body><script type="module">import * as P from '${pdfjs}';P.GlobalWorkerOptions.workerSrc='${worker}';window.renderReview=async(base64)=>{const task=P.getDocument({data:Uint8Array.from(atob(base64),c=>c.charCodeAt(0)),isEvalSupported:false}),d=await task.promise;const pages=[];for(let n=1;n<=d.numPages;n++){const p=await d.getPage(n),v=p.getViewport({scale:1.15}),c=document.createElement('canvas');c.width=Math.ceil(v.width);c.height=Math.ceil(v.height);await p.render({canvasContext:c.getContext('2d'),viewport:v,background:'white'}).promise;pages.push(c.toDataURL('image/png'));c.width=c.height=0;}await task.destroy();return pages;};</script></body></html>`);
let win,failed=false;
app.whenReady().then(async()=>{
 win=new BrowserWindow({show:false,webPreferences:{sandbox:true,contextIsolation:true}});await win.loadFile(path.join(temp,'index.html'));
 for(let i=0;i<100;i++){if(await win.webContents.executeJavaScript('!!window.renderReview'))break;await new Promise(r=>setTimeout(r,50));}
 const results=[];
 for(const group of ['simulations-documents','rendu-word'])for(const name of fs.readdirSync(path.join(root,group)).filter(n=>n.endsWith('.pdf'))){
  const data=fs.readFileSync(path.join(root,group,name)).toString('base64'),pages=await win.webContents.executeJavaScript('window.renderReview('+JSON.stringify(data)+')');
  for(let i=0;i<pages.length;i++)fs.writeFileSync(path.join(out,group+'-'+name.replace('.pdf','')+'-p'+(i+1)+'.png'),Buffer.from(pages[i].split(',')[1],'base64'));
  results.push({group,file:name,pages:pages.length});
 }
 fs.writeFileSync(path.join(out,'RENDU.json'),JSON.stringify(results,null,2));console.log(JSON.stringify({documents:results.length,pages:results.reduce((n,r)=>n+r.pages,0)}));
}).catch(e=>{console.error(e.stack||e);failed=true}).finally(()=>{win?.destroy();app.exit(failed?1:0);});
