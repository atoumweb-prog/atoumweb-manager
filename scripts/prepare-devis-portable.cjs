'use strict';
// New delivery only. The previous Workspace is opened read-only and never seeded/reset.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const {DatabaseSync,backup}=require('node:sqlite');
const repo=path.resolve(__dirname,'..'),previous=path.resolve(process.argv[2]||'C:/DEV/03_LIVRAISONS/AtoumWeb/Manager-Prospection-20261023-1ddd01fb');
const application=path.join(repo,'out/AtoumWeb Manager-win32-x64');
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const asarSHA256=hash(path.join(application,'resources/app.asar')),exeSHA256=hash(path.join(application,'atoumweb-manager.exe'));
const root=path.join('C:/DEV/03_LIVRAISONS/AtoumWeb','Manager-Devis-CGV-20261023-'+asarSHA256.slice(0,8));
const sourceWorkspace=path.join(previous,'Workspace'),workspace=path.join(root,'Workspace');
const sourceFile=path.join(sourceWorkspace,'data/atoumweb-manager.sqlite');
const tables=db=>db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(r=>r.name);
const rows=(db,name)=>db.prepare('SELECT * FROM "'+name.replaceAll('"','""')+'"').all().map(r=>JSON.stringify(r)).sort();
(async()=>{
 if(fs.existsSync(root))throw Error('Livraison existante : aucune réécriture.');
 for(const dir of [previous,sourceWorkspace])if(fs.lstatSync(dir).isSymbolicLink())throw Error('Source redirigée refusée.');
 const source=new DatabaseSync(sourceFile,{readOnly:true});
 try{
  const expected=new Map(tables(source).map(t=>[t,rows(source,t)]));
  fs.mkdirSync(root);fs.cpSync(application,path.join(root,'Application'),{recursive:true});
  fs.mkdirSync(workspace);for(const entry of fs.readdirSync(sourceWorkspace,{withFileTypes:true})){
   if(['data','backups','RECETTE-PILOTE.json'].includes(entry.name))continue;
   const from=path.join(sourceWorkspace,entry.name);fs.cpSync(from,path.join(workspace,entry.name),{recursive:true,filter:p=>{if(fs.lstatSync(p).isSymbolicLink())throw Error('Fichier redirigé refusé : '+p);return true;}});
  }
  fs.mkdirSync(path.join(workspace,'data'));fs.mkdirSync(path.join(workspace,'backups'));fs.mkdirSync(path.join(root,'Profil'));
  const destination=path.join(workspace,'data/atoumweb-manager.sqlite');await backup(source,destination);
  const copy=new DatabaseSync(destination);try{
   for(const [table,previousRows] of expected){if(JSON.stringify(rows(source,table))!==JSON.stringify(previousRows))throw Error('Source modifiée pendant la copie : '+table);if(JSON.stringify(rows(copy,table))!==JSON.stringify(previousRows))throw Error('Copie différente : '+table);}
   // Rebase only the existing managed project roots, on the new copy.
   copy.exec('BEGIN IMMEDIATE');try{for(const r of copy.prepare('SELECT id,resource_root_path AS location FROM projects WHERE resource_root_path IS NOT NULL').all()){
    const rel=path.relative(sourceWorkspace,r.location);if(rel.startsWith('..')||path.isAbsolute(rel))throw Error('Chemin projet extérieur : '+r.location);
    copy.prepare('UPDATE projects SET resource_root_path=? WHERE id=?').run(path.join(workspace,rel),r.id);
   }copy.exec('COMMIT');}catch(e){copy.exec('ROLLBACK');throw e;}
   if(copy.prepare('PRAGMA integrity_check').get().integrity_check!=='ok'||copy.prepare('PRAGMA foreign_key_check').all().length)throw Error('Intégrité/FK');
   if(copy.prepare('SELECT id FROM schema_migrations ORDER BY id').all().map(r=>r.id).join(',')!==Array.from({length:74},(_,i)=>i+1).join(','))throw Error('Registre inattendu');
   const count={};for(const t of tables(copy))count[t]=copy.prepare('SELECT COUNT(*) AS n FROM "'+t+'"').get().n;
   fs.writeFileSync(path.join(root,'DONNEES-CONSERVEES.json'),JSON.stringify({source:sourceWorkspace,allPreviousRowsVerified:true,projectPathsRebased:true,counts:count,integrity:'ok',foreignKeyErrors:0,migrations:74},null,2));
  }finally{copy.close();}
 }finally{source.close();}
 const marker={artifactId:asarSHA256,onlySynthetic:true,workspace};for(const dir of [root,workspace])fs.writeFileSync(path.join(dir,'RECETTE-PILOTE.json'),JSON.stringify(marker,null,2));
 fs.writeFileSync(path.join(root,'Profil/workspace.json'),JSON.stringify({workspaceRoot:workspace},null,2));
 const oldAsar=JSON.parse(fs.readFileSync(path.join(previous,'VERSION.json'),'utf8')).asarSHA256;
 fs.writeFileSync(path.join(root,'preparer-profil.cjs'),fs.readFileSync(path.join(previous,'preparer-profil.cjs'),'utf8').replaceAll(oldAsar,asarSHA256));
 for(const file of ['Demarrer.ps1','LANCER-LE-MANAGER.cmd'])fs.copyFileSync(path.join(previous,file),path.join(root,file));
 fs.writeFileSync(path.join(root,'VERSION.json'),JSON.stringify({baseSha:cp.execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim(),branch:cp.execFileSync('git',['branch','--show-current'],{cwd:repo,encoding:'utf8'}).trim(),sourceStatus:'working tree tested; see source diff',exeSHA256,asarSHA256,onlySynthetic:true,installer:false,migrations:74,dataSource:sourceWorkspace},null,2));
 fs.writeFileSync(path.join(root,'LIRE-MOI.txt'),'AtoumWeb Manager — Devis et CGV — 23/10/2026\r\n\r\nLancer LANCER-LE-MANAGER.cmd. Garder Application, Profil et Workspace ensemble.\r\nParcours commun : Prestations et prix / Conditions et CGV / Vérifier et sortir.\r\nCopie complète des clauses, PDF du devis et Word de travail depuis les boutons.\r\nBibliothèque et dernières saisies TEST reprises du portable 1ddd01fb. Ancien portable conservé.\r\nLes informations administratives et propres au dossier restent à compléter si absentes.\r\nAucun installateur, aucun changement du Manager natif ou des anciens Workspaces.\r\n');
 fs.cpSync(path.join(repo,'outputs/quote-journey-20261023'),path.join(root,'Captures'),{recursive:true});
 const prepared=cp.spawnSync(path.join(root,'Application/atoumweb-manager.exe'),[path.join(root,'preparer-profil.cjs')],{env:{...process.env,ELECTRON_RUN_AS_NODE:'1'},windowsHide:true,encoding:'utf8'});if(prepared.status!==0)throw Error(prepared.stderr||'Préparation profil refusée');
 if(hash(path.join(root,'Application/resources/app.asar'))!==asarSHA256||hash(path.join(root,'Application/atoumweb-manager.exe'))!==exeSHA256)throw Error('Empreinte de livraison incorrecte');
 fs.writeFileSync(path.join(repo,'outputs/devis-portable-delivery.json'),JSON.stringify({root,exeSHA256,asarSHA256},null,2));console.log(root);
})().catch(e=>{console.error(e);process.exitCode=1;});
