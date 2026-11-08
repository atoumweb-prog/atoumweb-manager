'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
if(!process.versions.electron){const r=spawnSync(require('electron'),[__filename,...process.argv.slice(2)],{encoding:'utf8',windowsHide:true,env:{...process.env,ELECTRON_RUN_AS_NODE:'1'},maxBuffer:4*1024*1024});process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');process.exit(r.status??1);}
const get=key=>{const i=process.argv.indexOf(key);return i<0?null:process.argv[i+1]},file=get('--database'),output=get('--report');
if(!file||!output)throw Error('Usage: --database <existing TEMP copy.sqlite> --report <new report.json> [--apply-preview <SHA256>]');
const actual=fs.realpathSync(file),relative=path.relative(fs.realpathSync(os.tmpdir()),actual);
if(relative.startsWith('..')||path.isAbsolute(relative)||/validation-msi/i.test(actual))throw Error('Only an existing isolated TEMP database may be simulated/applied by this recipe.');
if(fs.existsSync(output))throw Error('Refusing to overwrite a review report');
const repo=path.resolve(__dirname,'..'),bundle=path.join(os.tmpdir(),'atoumweb-approved-pack-'+Date.now()+'.cjs');
require('esbuild').buildSync({stdin:{contents:['commercial/ApprovedPackService','database/NodeSqliteAdapter'].map(s=>`export * from '${repo.replace(/\\/g,'/')}/src/main/${s}';`).join('\n'),loader:'ts',resolveDir:repo},bundle:true,platform:'node',format:'cjs',outfile:bundle,external:['electron'],logLevel:'silent'});
const S=require(bundle),db=new S.NodeSqliteAdapter(actual);db.exec('PRAGMA foreign_keys=ON');
try{
 const service=new S.ApprovedPackService(db),before=service.simulate(),approved=get('--apply-preview'),after=approved?service.apply(approved):null;
 const report={database:actual,tempOnly:true,applied:!!after,before,after,integrity:db.all('PRAGMA integrity_check'),foreignKeys:db.all('PRAGMA foreign_key_check')};
 fs.mkdirSync(path.dirname(path.resolve(output)),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2));
 console.log(JSON.stringify({applied:!!after,planSha256:before.planSha256,catalogue:before.catalogue.counts,clauses:before.contracts.counts,blockers:before.blockers,integrity:report.integrity,foreignKeys:report.foreignKeys}));
}finally{db.close();fs.unlinkSync(bundle);}
