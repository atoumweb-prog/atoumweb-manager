'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const repo=path.resolve(__dirname,'..'),wrapper=path.join(repo,'outputs','client-final-review-'+Date.now()+'.cjs');
const dir=process.argv[2]||path.join(repo,'outputs','ClientsV2-Corrections-finales-'+Date.now());
const source=fs.readFileSync(path.join(__dirname,'capture-client-gallery.cjs'),'utf8')
 .replace('scripts/fixtures/client-gallery-views.cjs','scripts/fixtures/client-review-final.cjs')
 .replace('for(const group of groups){',"for(const group of groups.filter(g=>g.name!=='records')){");
fs.writeFileSync(wrapper,source);
try{const result=spawnSync(process.execPath,[wrapper,dir,...process.argv.slice(3)],{cwd:repo,windowsHide:true,encoding:'utf8',timeout:180000,maxBuffer:1024*1024});process.stdout.write(result.stdout||'');process.stderr.write(result.stderr||'');if(result.error)throw result.error;if(result.status!==0)process.exitCode=1;}finally{fs.unlinkSync(wrapper);}
