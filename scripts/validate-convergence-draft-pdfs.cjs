'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),esbuild=require('esbuild');
const repo=path.resolve(__dirname,'..'),campaign=process.argv[2],workspace=process.argv[3],out=process.argv[4];
if(!campaign||!workspace||!out)throw Error('Usage: node scripts/validate-convergence-draft-pdfs.cjs <campagne> <workspace-recette> <sortie>');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'atoumweb-convergence-pdf-')),entry=path.join(profile,'run.cjs');fs.mkdirSync(out,{recursive:true});
esbuild.buildSync({stdin:{contents:`
import {app} from 'electron';import fs from 'node:fs';import path from 'node:path';
import {generateQuotePdf} from './src/main/commercial/quotePdf';
import {ensureWorkspace} from './src/main/workspace';
import proposals from './docs/ux-v2/bibliotheque-humaine-118-20261025/PROPOSITIONS.json';
app.on('window-all-closed',()=>{});app.setPath('userData',${JSON.stringify(profile)});
app.whenReady().then(async()=>{const source=${JSON.stringify(campaign)},workspace=ensureWorkspace(${JSON.stringify(workspace)}),dest=${JSON.stringify(out)},rows=[];
 const byCode=new Map(proposals.clauses.map(p=>[p.code,p]));
 for(const file of fs.readdirSync(source).filter(n=>/^DEV-TEST-\\d\\d\\.json$/.test(n)).sort()){
  const raw=JSON.parse(fs.readFileSync(path.join(source,file),'utf8')),quote=raw.obtained.quote,presentation=structuredClone(raw.presentation);let replaced=0;
  for(const clause of raw.obtained.clauses.filter(c=>c.enabled&&!c.isOrphaned&&c.code)){
   const proposal=byCode.get(clause.code);if(!proposal)continue;
   for(const section of presentation.sections){
    if(section.text.includes(clause.body)){section.text=section.text.replace(clause.body,proposal.proposal);replaced++;}
    for(const article of section.articles??[])if(article.sourceVersionId===clause.sourceClauseVersionId||article.body===clause.body){article.body=proposal.proposal;article.title=proposal.proposedTitle?.trim()||article.title;replaced++;}
   }
   presentation.text=presentation.text.replace(clause.body,proposal.proposal);
  }
  const pdf=await generateQuotePdf(quote,workspace,presentation);
  const target=path.join(dest,file.replace('.json','-BROUILLONS.pdf'));fs.copyFileSync(pdf.path,target);
  rows.push({scenario:file.slice(0,-5),selectedClauses:raw.obtained.clauses.filter(c=>c.enabled&&!c.isOrphaned&&c.code).length,replacements:replaced,pdf:target});
 }
 fs.writeFileSync(path.join(dest,'ASSEMBLAGES-BROUILLONS.json'),JSON.stringify(rows,null,2));console.log(JSON.stringify(rows));
}).then(()=>app.exit(0)).catch(e=>{console.error(e);app.exit(1)});`,resolveDir:repo,loader:'ts'},bundle:true,platform:'node',format:'cjs',external:['electron'],outfile:entry,logLevel:'silent'});
const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;const result=cp.spawnSync(require('electron'),[entry],{cwd:repo,env,windowsHide:true,encoding:'utf8',maxBuffer:10*1024*1024});process.stdout.write(result.stdout||'');process.stderr.write(result.stderr||'');process.exitCode=result.status??1;
