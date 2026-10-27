const fs=require('fs'),path=require('path'),cp=require('child_process');
const original=path.resolve('scripts/check-packaged-manager-smoke.cjs'),source=fs.readFileSync(original,'utf8');
const needle=" check(errors.length===0,'No renderer exceptions or console errors');";
const extra=`
 await navigate('Réglages');
 await until(()=>evaluate('!!document.querySelector(".company-quote-settings")'),'company settings mounted');
 await evaluate("document.querySelector('.company-quote-settings .primary-button').click()");
 await until(()=>evaluate("document.querySelector('.company-quote-settings canvas')?.width>0"),'packaged PDF worker renders model pages');
 check(await evaluate("document.querySelector('.company-quote-settings .pdf-pages-canvas figure').innerText.includes('Page 1 /')"),'Actual paginated settings preview in packaged app');
 `;
if(!source.includes(needle))throw Error('Packaged fixture seam changed');const generated=path.resolve('outputs/packaged-quote-settings-'+Date.now()+'.cjs');
fs.writeFileSync(generated,source.replace(needle,extra+needle));try{const r=cp.spawnSync(process.execPath,[generated,...process.argv.slice(2),'--crm-only'],{encoding:'utf8',windowsHide:true,maxBuffer:4*1024*1024});process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');process.exitCode=r.status??1;}finally{fs.rmSync(generated);}
