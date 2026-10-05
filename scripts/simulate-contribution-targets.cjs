const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const repo=path.resolve(__dirname,'..'),temporary=fs.mkdtempSync(path.join(os.tmpdir(),'atoumweb-8a1-simulation-'));
try{
 const bundle=path.join(temporary,'simulation.cjs');require('esbuild').buildSync({entryPoints:[path.join(repo,'scripts/simulate-contribution-targets.ts')],bundle:true,platform:'node',format:'cjs',target:'node24',external:['electron'],outfile:bundle,logLevel:'silent'});
 const r=spawnSync(require('electron'),[bundle,...process.argv.slice(2)],{cwd:repo,env:{...process.env,ELECTRON_RUN_AS_NODE:'1',NODE_PATH:path.join(repo,'node_modules'),ATOUMWEB_8A1_TEMP:temporary},windowsHide:true,encoding:'utf8',timeout:60000});process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');if(r.error)throw r.error;process.exitCode=r.status??1;
}finally{
 const target=path.resolve(temporary);if(!target.startsWith(path.resolve(os.tmpdir())+path.sep)||!path.basename(target).startsWith('atoumweb-8a1-simulation-'))throw Error('Unsafe temp');fs.rmSync(target,{recursive:true,force:true,maxRetries:3,retryDelay:100});
}
