'use strict';
// Cas de figure fictifs pour les écrans de Ressources (R8) : Sauvegardes, Offres, Bibliothèque, Annuaire.
// Les cas sont décrits dans scripts/fixtures/ressources-cas-de-figure.json.
//
//   node scripts/seed-ressources-cas-de-figure.cjs --workspace "<dossier Workspace>"            simulation sur une COPIE jetable
//   node scripts/seed-ressources-cas-de-figure.cjs --workspace "<dossier Workspace>" --apply    écrit dans la base (sauvegarde avant)
//
// Idempotent : un élément déjà présent (même libellé) n'est jamais recréé.
// Les projets doivent exister : lancer d'abord scripts/seed-clients-fictifs.cjs et scripts/seed-projets-cas-de-figure.cjs.
// Sites n'est pas couvert : un site naît d'un import de snapshot Bridge, pas d'une écriture directe.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), cp = require('node:child_process'), esbuild = require('esbuild');
const repo = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : null; };
const apply = args.includes('--apply');
const source = opt('workspace') ? path.resolve(opt('workspace')) : null;
if (!source) { console.error('Usage : node scripts/seed-ressources-cas-de-figure.cjs --workspace "<dossier Workspace>" [--apply]'); process.exit(2); }
const dbFile = path.join(source, 'data', 'atoumweb-manager.sqlite');
if (!fs.existsSync(dbFile)) { console.error('Base introuvable : ' + dbFile); process.exit(2); }
// Un fichier -wal ou -journal NON VIDE signale des données en attente (Manager ouvert) : on refuse. Un -wal vide et un -shm sont des résidus sans donnée.
for (const suffix of ['-wal', '-journal']) { const file = dbFile + suffix; if (fs.existsSync(file) && fs.statSync(file).size > 0) { console.error('Base occupée (' + suffix + ' non vide) : ferme le Manager avant de lancer le script.'); process.exit(2); } }
const casesFile = path.join(__dirname, 'fixtures', 'ressources-cas-de-figure.json');

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
let workspace = source;
if (!apply) {
  workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'atoumweb-seed-ressources-'));
  fs.mkdirSync(path.join(workspace, 'data'), { recursive: true });
  fs.copyFileSync(dbFile, path.join(workspace, 'data', 'atoumweb-manager.sqlite'));
  console.log('SIMULATION sur une copie jetable : ' + workspace);
} else {
  const backupDir = opt('backup-dir') ? path.resolve(opt('backup-dir')) : path.join(path.dirname(source), 'Sauvegardes-lots');
  fs.mkdirSync(backupDir, { recursive: true });
  const backup = path.join(backupDir, 'avant-cas-de-figure-ressources-' + stamp + '.sqlite');
  fs.copyFileSync(dbFile, backup);
  console.log('Sauvegarde avant écriture : ' + backup);
}
// Dossier des copies locales fictives : dans le Workspace utilisé (la copie jetable en simulation).
const localDir = path.join(workspace, 'sauvegardes-fictives');

const seed = path.join(repo, 'outputs', 'seed-ressources-cas-de-figure-bundle.cjs');
fs.mkdirSync(path.dirname(seed), { recursive: true });
esbuild.buildSync({
  stdin: {
    resolveDir: repo, loader: 'ts', contents: `
import {DatabaseService} from './src/main/database/DatabaseService';
import {ensureWorkspace} from './src/main/workspace';
import fs from 'node:fs';
import path from 'node:path';
const root=process.argv[2],reportFile=process.argv[3],casesFile=process.argv[4],localDir=process.argv[5];
(async()=>{
 const cases=JSON.parse(fs.readFileSync(casesFile,'utf8'));
 const workspace=ensureWorkspace(root),db=new DatabaseService(workspace);await db.initialize();
 const raw=(db as any).database;const report:any={created:[],skipped:[],missing:[]};
 const log=(area:string,kind:string,label:string)=>report.created.push({zone:area,type:kind,libelle:label});
 const skip=(area:string,kind:string,label:string)=>report.skipped.push({zone:area,type:kind,libelle:label});
 const at=(daysAgo:number)=>{const d=new Date();d.setDate(d.getDate()-daysAgo);d.setHours(10,0,0,0);return d.toISOString();};
 try{
  // Sauvegardes déclarées
  fs.mkdirSync(localDir,{recursive:true});
  for(const b of cases.backups||[]){
   const project=raw.get('SELECT id,client_account_id AS clientId FROM projects WHERE name LIKE ?',['%'+b.projectLike+'%']);
   if(!project){report.missing.push('projet : '+b.projectLike);continue;}
   if(raw.get('SELECT id FROM backup_records WHERE project_id=? AND label=?',[project.id,b.label])){skip('Sauvegardes','sauvegarde',b.label);continue;}
   let record=db.businessBackups.create({clientAccountId:project.clientId,projectId:project.id,backupType:b.backupType,label:b.label,backupAt:at(b.daysAgo),notes:b.notes??null});
   for(const l of b.locations||[]){
    let reference=l.reference;
    if(reference==='__local_present__'){reference=path.join(localDir,'TEST-copie-locale-presente.txt');fs.writeFileSync(reference,'Copie locale fictive TEST (R8).\\n');}
    if(reference==='__local_missing__'){reference=path.join(localDir,'TEST-copie-locale-absente.txt');}
    record=db.businessBackups.addLocation(record.id,{locationType:l.locationType,label:l.label,pathOrReference:reference});
   }
   if(b.stable)db.businessBackups.markStable(record.id);
   log('Sauvegardes','sauvegarde',b.label+(b.stable?' (stable)':''));
  }
  // Offres : brouillon seul, inactif, archivé
  const category=(raw.get('SELECT category FROM catalog_items WHERE category IS NOT NULL LIMIT 1')||{}).category||null;
  for(const c of cases.catalog||[]){
   if(raw.get('SELECT id FROM catalog_items WHERE name=?',[c.name])){skip('Offres','article',c.name);continue;}
   const created=db.catalog.create({type:c.type,name:c.name,category},{priceMode:'fixed',priceCents:12000});
   const id=created.id??created.item?.id;
   if(c.state==='inactive')db.catalog.setStatus(id,'inactive');
   if(c.state==='archived')db.catalog.setStatus(id,'archived');
   log('Offres','article',c.name+' ('+c.state+')');
  }
  // Bibliothèque : à adapter, archivé, référence
  for(const l of cases.library||[]){
   if(raw.get("SELECT id FROM technical_items WHERE scope='atoumweb' AND name=?",[l.name])){skip('Bibliothèque','composant',l.name);continue;}
   const created=db.atoumWebTechnicalLibrary.create({category:l.category,name:l.name,description:'Composant fictif TEST (R8).',tags:['TEST'],reuseStatus:l.reuseStatus},{contentType:'text',contentText:'Contenu fictif TEST.',notes:'Cas de figure R8.'});
   if(l.archived)db.atoumWebTechnicalLibrary.archive(created.id);
   log('Bibliothèque','composant',l.name+(l.archived?' (archivé)':''));
  }
  // Annuaire : nom très long, champs vides, contact sans organisation
  for(const o of (cases.directory||{}).organizations||[]){
   if(raw.get('SELECT id FROM organizations WHERE name=?',[o.name])){skip('Annuaire','organisation',o.name);continue;}
   db.crm.createOrganization({name:o.name,industry:o.industry,city:o.city});
   log('Annuaire','organisation',o.name.slice(0,60));
  }
  for(const c of (cases.directory||{}).contacts||[]){
   if(raw.get('SELECT id FROM contacts WHERE first_name=? AND last_name=?',[c.firstName,c.lastName])){skip('Annuaire','contact',c.lastName);continue;}
   db.crm.createContact({firstName:c.firstName,lastName:c.lastName});
   log('Annuaire','contact',c.firstName+' '+c.lastName);
  }
 }finally{db.close();}
 fs.writeFileSync(reportFile,JSON.stringify(report,null,2));
})().catch(e=>{console.error(e&&e.stack||e);process.exitCode=1;});
`,
  },
  bundle: true, platform: 'node', format: 'cjs', outfile: seed, external: ['electron'], logLevel: 'silent',
});

const reportFile = path.join(os.tmpdir(), 'seed-ressources-cas-' + stamp + '.json');
const run = cp.spawnSync(require('electron'), [seed, workspace, reportFile, casesFile, localDir], { env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }, windowsHide: true, encoding: 'utf8' });
if (run.status !== 0) { console.error(run.stderr || run.stdout || 'Échec du jeu de cas de figure.'); process.exit(1); }
const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
console.log(JSON.stringify({ crees: report.created.length, dejaPresents: report.skipped.length, introuvables: report.missing }, null, 2));
if (report.created.length) console.log(report.created.map((x) => '  + ' + x.zone + ' : ' + x.type + ' : ' + x.libelle).join('\n'));
if (apply && report.created.length) {
  const marker = path.join(source, 'DONNEES-FICTIVES-CAS-RESSOURCES.json');
  fs.writeFileSync(marker, JSON.stringify({ type: 'FIXTURE_TEST', creeLe: new Date().toISOString(), note: 'Sauvegardes déclarées, articles de catalogue, composants de Bibliothèque et entrées d\'Annuaire fictifs créés par scripts/seed-ressources-cas-de-figure.cjs. Sites non couvert (import Bridge).', elements: report.created }, null, 2));
  console.log('Repère écrit : ' + marker);
}
if (!apply) fs.rmSync(workspace, { recursive: true, force: true });
