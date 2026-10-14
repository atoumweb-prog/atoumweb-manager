'use strict';
// Opt-in smoke of the actual packaged Manager. The CLI profile and workspace are owned TEMP only.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const args=process.argv.slice(2);assert(args.length===2&&args[0]==='--exe','Usage: node scripts/check-packaged-manager-smoke.cjs --exe ABSOLUTE-EXE');
const exe=path.resolve(args[1]);assert(fs.existsSync(exe)&&path.basename(exe).toLowerCase()==='atoumweb-manager.exe','Actual packaged Manager executable required');
const repo=path.resolve(__dirname,'..'),root=fs.mkdtempSync(path.join(os.tmpdir(),'atoumweb-manager-package-smoke-')),profile=path.join(root,'profile'),workspace=path.join(root,'workspace');
fs.mkdirSync(profile);fs.mkdirSync(workspace);fs.writeFileSync(path.join(profile,'workspace.json'),JSON.stringify({workspaceRoot:workspace}));
const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
const processLog=fs.openSync(path.join(root,'process.log'),'w');
const child=cp.spawn(exe,['--user-data-dir='+profile,'--remote-debugging-port=0'],{env,windowsHide:true,stdio:['ignore',processLog,processLog]});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms)),errors=[],report={sha:cp.execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim(),exe,onlyTemporaryProfile:true,workspace,checks:0,visits:0};
const check=(ok,label)=>{assert(ok,label);report.checks++;};let socket,seq=0,pending=new Map(),closed=false;
child.on('exit',()=>{closed=true;});
async function until(fn,label){const start=Date.now();while(Date.now()-start<20000){if(await fn())return;await sleep(50);}throw Error('Packaged smoke: '+label);}
async function connect(){
 const portFile=path.join(profile,'DevToolsActivePort');await until(()=>fs.existsSync(portFile),'isolated DevTools port');
 const port=Number(fs.readFileSync(portFile,'utf8').split(/\r?\n/)[0]);check(port>0,'CDP bound to owned profile');
 let page;await until(async()=>{const pages=await (await fetch('http://127.0.0.1:'+port+'/json/list')).json();page=pages.find(p=>p.type==='page'&&p.url.startsWith('file:'));return !!page;},'packaged renderer');
 socket=new WebSocket(page.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
 socket.onmessage=message=>{const event=JSON.parse(message.data);if(event.id){const task=pending.get(event.id);if(task){pending.delete(event.id);event.error?task.reject(Error(JSON.stringify(event.error))):task.resolve(event.result);}}else if(event.method==='Runtime.exceptionThrown')errors.push(event.params.exceptionDetails.text);else if(event.method==='Runtime.consoleAPICalled'&&event.params.type==='error')errors.push(JSON.stringify(event.params.args));};
 await send('Runtime.enable');
}
function send(method,params={}){return new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
async function navigate(page){await evaluate('window.dispatchEvent(new CustomEvent("atoumweb:open-page",{detail:'+JSON.stringify(page)+'}))');await until(()=>evaluate('document.querySelector("[data-nav-module][aria-current=page]")?.getAttribute("aria-label")==='+JSON.stringify(page)),page+' selected');await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');check(await evaluate('!!document.querySelector(".aw-manager-shell")&&!document.querySelector(".renderer-fatal-shell,.fatal-screen")'),'Actual module '+page);check(await evaluate('document.querySelectorAll(".global-timer").length===1&&document.querySelector(".global-timer")===window.__packagedTimer'),'Unique mounted timer '+page);report.visits++;}
(async()=>{try{
 await connect();await until(()=>evaluate('!!window.atoumweb&&!!document.querySelector(".aw-manager-shell")'),'real Manager shell');
 const bootstrap=await evaluate('window.atoumweb.app.getBootstrap()');check(path.resolve(bootstrap.workspacePath)===path.resolve(workspace),'The actual Manager uses only the owned workspace');
 await evaluate('window.__packagedTimer=document.querySelector(".global-timer")');
 const pages=['Accueil','Prospects','Clients','Offres & Tarifs','Devis','Projets','Interventions & Maintenance','Gestion des temps','Facturation','Dépenses','Documents & Contrats','Bibliothèque AtoumWeb','Sites','Sauvegardes','Annuaire','Statistiques','Réglages'];
 for(const [theme,themeTitle] of [['atoumweb','AtoumWeb'],['noir','Noir'],['blanc','Blanc']])for(const [density,title] of [['compact','Compact'],['comfort','Confort'],['comfort_plus','Confort +']]){
  await navigate('Réglages');
  await until(()=>evaluate('!!document.querySelector(".theme-card")'),'theme controls');
  await evaluate('[...document.querySelectorAll(".theme-card")].find(e=>e.querySelector("strong")?.textContent==='+JSON.stringify(themeTitle)+').click()');
  await evaluate('[...document.querySelectorAll(".density-card")].find(e=>e.querySelector("strong")?.textContent==='+JSON.stringify(title)+').click()');
  await until(()=>evaluate('document.documentElement.dataset.theme==='+JSON.stringify(theme)+'&&document.documentElement.dataset.density==='+JSON.stringify(density)),'theme/density persisted');
  for(const page of pages)await navigate(page);
 }
 check(errors.length===0,'No renderer exceptions or console errors');
 await send('Page.close');await until(()=>closed,'clean shutdown');
 const esbuild=require('esbuild'),bundle=path.join(root,'inspection.cjs');
 esbuild.buildSync({stdin:{contents:"export * from './src/main/database/NodeSqliteAdapter';export * from './src/main/database/migrations';",resolveDir:repo,loader:'ts'},bundle:true,platform:'node',format:'cjs',outfile:bundle,logLevel:'silent'});
 const {NodeSqliteAdapter,MIGRATIONS}=require(bundle),db=new NodeSqliteAdapter(path.join(workspace,'data','atoumweb-manager.sqlite'));
 try{check(db.get('PRAGMA integrity_check').integrity_check==='ok','Packaged SQLite integrity');check(db.all('PRAGMA foreign_key_check').length===0,'Packaged FK');check(JSON.stringify(db.all('SELECT id,name FROM schema_migrations ORDER BY id'))===JSON.stringify(MIGRATIONS.map(m=>({id:m.id,name:m.name}))),'Exact packaged migration ledger');check(db.get('SELECT COUNT(*) AS n FROM time_sessions').n===0,'Navigation never starts or writes a timer');}finally{db.close();}
 report.validated=true;report.consoleErrors=errors;fs.mkdirSync(path.join(repo,'outputs'),{recursive:true});fs.writeFileSync(path.join(repo,'outputs','packaged-manager-smoke.json'),JSON.stringify(report,null,2));console.log('PACKAGED_MANAGER_SMOKE '+JSON.stringify(report));
 }catch(error){console.error(error);console.error('Owned TEMP diagnostic retained: '+root);process.exitCode=1;}
 finally{socket?.close();if(!closed)child.kill();fs.closeSync(processLog);}
})();
