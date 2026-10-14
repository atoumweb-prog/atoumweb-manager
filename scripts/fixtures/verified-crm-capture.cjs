'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
let sequence=0;
module.exports=async({win,js,test,folder,file,theme,density,scene})=>{
 if(!path.isAbsolute(folder)||/validation-msi/i.test(folder))throw Error('Isolated absolute capture folder required');
 const repo=path.resolve(__dirname,'../..'),git=(...args)=>cp.execFileSync('git',args,{cwd:repo,encoding:'utf8'}).trim();
 if(git('status','--porcelain'))throw Error('Capture final CRM evidence on a committed candidate');
 const sha=git('rev-parse','HEAD'),n=++sequence,color=[32+n*53%193,32+n*89%193,32+n*127%193];
 await js(`if(document.documentElement.dataset.theme!==${JSON.stringify(theme)}||document.documentElement.dataset.density!==${JSON.stringify(density)})throw Error('Wrong capture configuration');let e=document.getElementById('crm-verified-frame');if(!e){e=document.createElement('div');e.id='crm-verified-frame';e.setAttribute('aria-hidden','true');document.body.append(e)}e.style.cssText='position:fixed!important;right:0;bottom:0;width:40px;height:40px;pointer-events:none;z-index:2147483647;background:rgb(${color.join(',')})';`);
 let image,matched=false;
 for(let frame=0;frame<24;frame++){
  await js('await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
  await new Promise(resolve=>setTimeout(resolve,60));
  image=await win.webContents.capturePage();const size=image.getSize(),bytes=image.toBitmap(),offset=((size.height-17)*size.width+size.width-17)*4;
  const actual=[...bytes.subarray(offset,offset+3)].sort((a,b)=>a-b),expected=[...color].sort((a,b)=>a-b);
  if(expected.every((value,index)=>Math.abs(value-actual[index])<=7)){matched=true;break;}
 }
 test(matched,'CRM composited frame '+scene+'/'+theme+'/'+density);
 fs.mkdirSync(folder,{recursive:true});const target=path.join(folder,file),png=image.toPNG();fs.writeFileSync(target,png,{flag:'wx'});
 const manifestPath=path.join(folder,'frames.json'),manifest=fs.existsSync(manifestPath)?JSON.parse(fs.readFileSync(manifestPath,'utf8')):{sha,tree:git('rev-parse','HEAD^{tree}'),captures:[]};
 if(manifest.sha!==sha)throw Error('Capture candidate changed');
 manifest.captures.push({file,theme,density,scene,sha256:crypto.createHash('sha256').update(png).digest('hex'),compositorVerified:true});
 fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2));await js('document.getElementById("crm-verified-frame")?.remove()');return target;
};
