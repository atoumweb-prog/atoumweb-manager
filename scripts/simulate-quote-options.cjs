const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawnSync}=require('node:child_process');
const repo=path.resolve(__dirname,'..'),temporary=fs.mkdtempSync(path.join(os.tmpdir(),'atoumweb-quote-options-'));
try{
  const bundle=path.join(temporary,'simulate.cjs');
  require('esbuild').buildSync({entryPoints:[path.join(repo,'scripts/simulate-quote-options.ts')],bundle:true,platform:'node',format:'cjs',target:'node24',external:['electron'],outfile:bundle,logLevel:'silent'});
  const result=spawnSync(require('electron'),[bundle,...process.argv.slice(2)],{cwd:repo,env:{...process.env,ELECTRON_RUN_AS_NODE:'1',NODE_PATH:path.join(repo,'node_modules'),ATOUMWEB_QUOTE_OPTIONS_TEMP:temporary},windowsHide:true,encoding:'utf8',timeout:60000});
  process.stdout.write(result.stdout||'');process.stderr.write(result.stderr||'');if(result.error)throw result.error;process.exitCode=result.status??1;
}finally{const target=path.resolve(temporary);if(!target.startsWith(path.resolve(os.tmpdir())+path.sep)||!path.basename(target).startsWith('atoumweb-quote-options-'))throw Error('Chemin temporaire invalide');fs.rmSync(target,{recursive:true,force:true,maxRetries:3,retryDelay:100});}
