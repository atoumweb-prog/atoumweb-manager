// Read-only comparison of independent PR sources. No merge, checkout, execution or combined validation.
const cp=require('node:child_process'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
const repo=path.resolve(__dirname,'..'),git=(...args)=>cp.execFileSync('git',args,{cwd:repo,encoding:'utf8'}).trim();
const refs={main:'origin/main',crm:'origin/codex/ux-v2-lot03a-crm-audit',search:'origin/codex/ux-v2-02c-real-search',home:'origin/codex/ux-v2-02d-home-trust'};
const paths=['scripts/check-ux-v2-lot01a-real-ui.cjs','src/renderer/commercial/QuotesPage.tsx','src/renderer/crm/ProspectsPageV2.tsx'];
const manifest={generatedAt:new Date().toISOString(),heads:Object.fromEntries(Object.entries(refs).map(([name,ref])=>[name,git('rev-parse',ref)])),combinedValidation:false,files:[]};
for(const file of paths){
 const versions=Object.fromEntries(Object.entries(refs).map(([name,ref])=>{const text=git('show',ref+':'+file);return[name,{sha256:crypto.createHash('sha256').update(text).digest('hex'),text}];}));
 const crm=versions.crm.text,search=versions.search.text;
 const features=file.endsWith('.cjs')?{crmRecipe:crm.includes('if(lot03b)'),crmCapture9:crm.includes('capturesVerified===9'),searchRecipe:search.includes('if(searchOnly)'),searchIpcCapture:search.includes('const registered=new Map()')}:file.includes('QuotesPage')?{crmProjectGate:crm.includes('canAccessQuoteProject(detail)'),searchAcknowledgement:search.includes("useSearchTargetConfirmation('quote'"),searchErrors:search.includes("onEntityReady?.('quote'")}: {crmConversion:crm.includes("view === 'conversions'"),crmProjection:crm.includes('pipelineProjection.columns'),searchAcknowledgement:search.includes("useSearchTargetConfirmation('prospect'"),searchErrors:search.includes("onEntityReady?.('prospect'")};
 if(Object.values(features).some(value=>!value))throw Error('Source changed; compatibility review must be updated: '+file);
 manifest.files.push({path:file,hashes:Object.fromEntries(Object.entries(versions).map(([name,value])=>[name,value.sha256])),features,diffCrm:git('diff','--numstat',refs.main,refs.crm,'--',file),diffSearch:git('diff','--numstat',refs.main,refs.search,'--',file),homeReusesSearch:versions.home.sha256===versions.search.sha256});
}
const out=path.join(repo,'outputs','compatibility-02-03-'+Date.now()+'.json');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(manifest,null,2));console.log('READ_ONLY_COMPATIBILITY '+out);console.log(JSON.stringify(manifest,null,2));
