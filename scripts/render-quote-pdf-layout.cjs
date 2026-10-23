'use strict';
// Opt-in visual recipe: always snapshot the supplied TEST Workspace into TEMP before any service call.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),esbuild=require('esbuild'),{DatabaseSync,backup}=require('node:sqlite');
const repo=path.resolve(__dirname,'..');
(async()=>{
 const source=process.argv[2];if(!source)throw Error('Pass an explicit TEST Workspace path. No default user database.');
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'atoumweb-pdf-layout-')),workspace=path.join(temp,'workspace');fs.mkdirSync(path.join(workspace,'data'),{recursive:true});
 const original=new DatabaseSync(path.join(source,'data/atoumweb-manager.sqlite'),{readOnly:true});try{await backup(original,path.join(workspace,'data/atoumweb-manager.sqlite'));}finally{original.close();}
 const out=path.join(repo,'output/pdf');fs.mkdirSync(out,{recursive:true});
 const script=path.join(temp,'render.cjs');
 esbuild.buildSync({stdin:{contents:`
 import {app} from 'electron';import fs from 'node:fs';import path from 'node:path';
 import {DatabaseService} from './src/main/database/DatabaseService';import {ensureWorkspace} from './src/main/workspace';
 import {generateQuotePdf,buildQuoteHtml} from './src/main/commercial/quotePdf';
 app.on('window-all-closed',()=>{});app.setPath('userData',${JSON.stringify(path.join(temp,'profile'))});
 app.whenReady().then(async()=>{const workspace=ensureWorkspace(${JSON.stringify(workspace)}),db=new DatabaseService(workspace);await db.initialize();try{
 const quote=db.quotes.list().find(q=>q.number==='DEV-2026-003');if(!quote)throw Error('TEST quote DEV-2026-003 absent');
 const before=db.quotes.get(quote.id);if(before.status!=='draft'||before.finalizedAt)throw Error('This recipe requires a mutable TEST draft.');
 const proposal=db.contractTerms.proposeQuoteUpdate(quote.id);const build=db.contractTerms.applyQuoteUpdate(quote.id,proposal.token);
 const q=db.quotes.get(quote.id),p=db.contractTerms.presentation(quote.id);
 if(q.contractValueCents!==before.contractValueCents||q.lines.length!==before.lines.length)throw Error('Commercial values unexpectedly changed.');
 const result=await generateQuotePdf(q,workspace,p),dest=path.join(${JSON.stringify(out)},'DEV-2026-003-mise-en-page.pdf');fs.copyFileSync(result.path,dest);
 fs.writeFileSync(path.join(${JSON.stringify(out)},'DEV-2026-003-mise-en-page.html'),buildQuoteHtml(q,p));
 // Stress recipe: a clause longer than one page must flow without losing text or detaching its title.
 const longP=structuredClone(p);longP.modules.push({code:'TEST-LONG',title:'TEST — Texte long',version:1,source:'custom'});
 longP.sections.push({id:'test-long',title:'TEST — Section longue',text:'36. TEST — Texte long\\n\\n'+Array.from({length:30},(_,i)=>'Paragraphe TEST '+(i+1)+' : '+('Contenu long à conserver pour la vérification de la mise en page. '.repeat(10))).join('\\n\\n')});
 const stress=await generateQuotePdf({...q,number:'TEST-PAGINATION'},workspace,longP);fs.copyFileSync(stress.path,path.join(${JSON.stringify(out)},'TEST-pagination-longue.pdf'));
 fs.writeFileSync(path.join(${JSON.stringify(out)},'RECETTE.json'),JSON.stringify({sourceReadOnly:${JSON.stringify(source)},onlyTemporaryMutations:true,totalCents:q.contractValueCents,clauses:build.clauses.length,addedClauses:proposal.changes.length,expectedSections:p.sections.map(s=>s.title),expectedTexts:build.clauses.filter(c=>c.enabled&&!c.isOrphaned).map(c=>({title:c.title,body:c.body})),modules:p.modules,integrity:db.database.get('PRAGMA integrity_check'),foreignKeys:db.database.all('PRAGMA foreign_key_check'),pdf:dest},null,2));
 console.log(dest);
 }finally{db.close();}}).then(()=>app.exit(0)).catch(e=>{console.error(e);app.exit(1);});`,resolveDir:repo,loader:'ts'},bundle:true,platform:'node',format:'cjs',external:['electron'],outfile:script,logLevel:'silent'});
 const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
 const result=cp.spawnSync(require('electron'),[script],{cwd:repo,env,windowsHide:true,encoding:'utf8',maxBuffer:1024*1024});process.stdout.write(result.stdout||'');process.stderr.write(result.stderr||'');if(result.status!==0)throw Error('PDF recipe failed: '+result.status);
})().catch(e=>{console.error(e);process.exitCode=1;});
