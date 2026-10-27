'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),esbuild=require('esbuild');
const repo=path.resolve(__dirname,'..'),application=path.join(repo,'out','AtoumWeb Manager-win32-x64');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const asarSHA256=hash(path.join(application,'resources','app.asar')),exeSHA256=hash(path.join(application,'atoumweb-manager.exe'));
const root=path.join('C:/DEV/03_LIVRAISONS/AtoumWeb','Manager-CRM-20261023-'+asarSHA256.slice(0,8));
if(fs.existsSync(root))throw Error('Livraison déjà présente : aucune réécriture automatique.');
fs.mkdirSync(root);fs.cpSync(application,path.join(root,'Application'),{recursive:true});
fs.mkdirSync(path.join(root,'Profil'));
const marker={artifactId:asarSHA256,onlySynthetic:true,workspace:path.join(root,'Workspace')};
fs.writeFileSync(path.join(root,'RECETTE-PILOTE.json'),JSON.stringify(marker,null,2));
const seed=path.join(repo,'outputs','crm-portable-seed.cjs');
esbuild.buildSync({stdin:{contents:`
 import {DatabaseService} from './src/main/database/DatabaseService';
 import {ensureWorkspace} from './src/main/workspace';
 import fs from 'node:fs';import path from 'node:path';
 const root=process.argv[2];
 (async()=>{const workspace=ensureWorkspace(path.join(root,'Workspace')),db=new DatabaseService(workspace);await db.initialize();
 try{
 db.setSetting('theme','noir');db.setSetting('display_density','comfort');
 const a=db.crm.createOrganization({name:'TEST — Cazor Auto Passion',industry:'Automobile',city:'Dijon',website:'https://example.test',email:'accueil@example.test'});
 const b=db.crm.createOrganization({name:'TEST — Toutes les Fleurs',industry:'Fleuriste',city:'Talant'});
 const c=db.crm.createContact({organizationId:a.id,firstName:'Camille',lastName:'TEST',jobTitle:'Gérante',email:'camille@example.test',phone:'0612345678'});
 db.crm.saveOrganizationContact(b.id,c.id,null,{jobTitle:'Responsable commerciale',archivedAt:null});
 for(const [org,stage,source] of [[a,'qualifying','website'],[b,'need_identified','referral']]){
 const p=db.crm.createProspect({organizationId:org.id,contactId:c.id,stage,source});
 db.crm.patchProspectIfUnchanged(p.id,{initialRequest:null},{initialRequest:'TEST — Améliorer la visibilité et les demandes de contact'});
 db.actions.create({ownerType:'prospect',ownerId:p.id,type:'action',title:'TEST — Préciser le besoin avec Camille',dueAt:new Date(Date.now()+86400000).toISOString()});
 db.crm.saveProspectResearchSnapshot(p.id,{checkedAt:'2026-10-01',source:'TEST — Recherche fictive antérieure',website:{presence:'present',url:'https://example.test'},services:['TEST — Services de proximité'],opportunities:[{finding:'TEST — Visibilité à approfondir',service:'TEST — Accompagnement web',priority:'medium',keep:true}]});
 }
 const newOrg=db.crm.createOrganization({name:'TEST — Nouvelle entreprise à préparer',city:'Dijon'});db.crm.createProspect({organizationId:newOrg.id,stage:'new',source:'outbound'});
 const historyOrg=db.crm.createOrganization({name:'TEST — Client et historique conservé'});const p=db.crm.createProspect({organizationId:historyOrg.id});db.actions.create({ownerType:'prospect',ownerId:p.id,type:'action',title:'TEST — Ancien échange du prospect'});db.crm.convertProspectToClient(p.id);
 const quoteOrg=db.crm.createOrganization({name:'TEST — Proposition en préparation',city:'Dijon'});const q=db.crm.createProspect({organizationId:quoteOrg.id,stage:'qualifying'});db.quotes.create({prospectId:q.id,subject:'TEST — Proposition commerciale brouillon'});
 if(db.database.all('PRAGMA foreign_key_check').length)throw Error('FK recette');if(db.database.get('PRAGMA integrity_check').integrity_check!=='ok')throw Error('Intégrité recette');
 fs.writeFileSync(path.join(root,'Workspace','RECETTE-PILOTE.json'),fs.readFileSync(path.join(root,'RECETTE-PILOTE.json')));
 console.log('Synthetic recipe created, schema 74');
 }finally{db.close();}})().catch(error=>{console.error(error);process.exitCode=1;});`,resolveDir:repo,loader:'ts'},bundle:true,platform:'node',format:'cjs',outfile:seed,external:['electron'],logLevel:'silent'});
const seeded=cp.spawnSync(path.join(root,'Application','atoumweb-manager.exe'),[seed,root],{env:{...process.env,ELECTRON_RUN_AS_NODE:'1'},windowsHide:true,encoding:'utf8'});
if(seeded.status!==0)throw Error((seeded.stdout||'')+(seeded.stderr||''));
const helper=`const fs=require('node:fs'),path=require('node:path'),{DatabaseSync}=require('node:sqlite');
const root=__dirname,workspace=path.join(root,'Workspace'),profile=path.join(root,'Profil');
const marker=JSON.parse(fs.readFileSync(path.join(root,'RECETTE-PILOTE.json'),'utf8')),own=JSON.parse(fs.readFileSync(path.join(workspace,'RECETTE-PILOTE.json'),'utf8'));
if(marker.artifactId!==${JSON.stringify(asarSHA256)}||own.artifactId!==marker.artifactId||!marker.onlySynthetic||!own.onlySynthetic)throw Error('Recette non reconnue');
for(const folder of [root,workspace,profile])if(fs.lstatSync(folder).isSymbolicLink())throw Error('Dossier redirigé refusé');
if(fs.existsSync(path.join(profile,'pending-database-restore.json')))throw Error('Restauration en attente');
if(path.resolve(marker.workspace)!==path.resolve(workspace)){const db=new DatabaseSync(path.join(workspace,'data','atoumweb-manager.sqlite'));try{if(db.prepare('SELECT id FROM schema_migrations ORDER BY id').all().map(r=>r.id).join(',')!==Array.from({length:74},(_,i)=>i+1).join(','))throw Error('Registre inattendu');
const rows=db.prepare('SELECT id,resource_root_path AS location FROM projects WHERE resource_root_path IS NOT NULL').all();db.exec('BEGIN IMMEDIATE');try{for(const row of rows){const rel=path.relative(marker.workspace,row.location);if(rel.startsWith('..')||path.isAbsolute(rel))throw Error('Chemin projet extérieur');db.prepare('UPDATE projects SET resource_root_path=? WHERE id=?').run(path.join(workspace,rel),row.id);}db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}}finally{db.close();}marker.workspace=workspace;fs.writeFileSync(path.join(root,'RECETTE-PILOTE.json'),JSON.stringify(marker,null,2));}
fs.writeFileSync(path.join(profile,'workspace.json'),JSON.stringify({workspaceRoot:workspace},null,2));`;
fs.writeFileSync(path.join(root,'preparer-profil.cjs'),helper);
const previous='C:/DEV/03_LIVRAISONS/AtoumWeb/Manager-Pilote-20261022-42b12a93';
for(const file of ['Demarrer.ps1','LANCER-LE-MANAGER.cmd'])fs.copyFileSync(path.join(previous,file),path.join(root,file));
fs.writeFileSync(path.join(root,'VERSION.json'),JSON.stringify({baseSha:cp.execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim(),branch:'codex/crm-saisie-coherente',sourceStatus:'working tree tested',exeSHA256,asarSHA256,onlySynthetic:true,installer:false,migrations:74},null,2));
fs.writeFileSync(path.join(root,'LIRE-MOI.txt'),'AtoumWeb Manager — CRM, cinq lots — 23/10/2026\r\n\r\nLancer LANCER-LE-MANAGER.cmd. Garder Application, Profil et Workspace ensemble.\r\nDonnées de recette fictives TEST, indépendantes des anciennes versions. Aucun installateur.\r\nNe pas ouvrir ce Workspace avec un ancien exécutable (schéma 74).\r\nLa version finale reste à valider ; aucune fusion main.\r\n');
const prepared=cp.spawnSync(path.join(root,'Application','atoumweb-manager.exe'),[path.join(root,'preparer-profil.cjs')],{env:{...process.env,ELECTRON_RUN_AS_NODE:'1'},windowsHide:true,encoding:'utf8'});
if(prepared.status!==0)throw Error(prepared.stderr||'Préparation profil échouée');
fs.writeFileSync(path.join(repo,'outputs','crm-portable-delivery.json'),JSON.stringify({root,exeSHA256,asarSHA256,onlySynthetic:true},null,2));
console.log(root);
