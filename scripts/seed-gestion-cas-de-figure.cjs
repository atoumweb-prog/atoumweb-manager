'use strict';
// Cas de figure fictifs pour les écrans Gestion (R7) : Temps, Facturation, Documents.
// Les cas sont décrits dans scripts/fixtures/gestion-cas-de-figure.json.
//
//   node scripts/seed-gestion-cas-de-figure.cjs --workspace "<dossier Workspace>"            simulation sur une COPIE jetable
//   node scripts/seed-gestion-cas-de-figure.cjs --workspace "<dossier Workspace>" --apply    écrit dans la base (sauvegarde avant)
//
// Idempotent : un document, une session, une intervention déjà présents (même titre ou même créneau) ne sont jamais recréés.
// Les projets doivent exister : lancer d'abord scripts/seed-clients-fictifs.cjs et scripts/seed-projets-cas-de-figure.cjs.
// Avec --apply, les fichiers fictifs des documents sont copiés dans le dossier du client du Workspace.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), cp = require('node:child_process'), esbuild = require('esbuild');
const repo = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : null; };
const apply = args.includes('--apply');
const source = opt('workspace') ? path.resolve(opt('workspace')) : null;
if (!source) { console.error('Usage : node scripts/seed-gestion-cas-de-figure.cjs --workspace "<dossier Workspace>" [--apply]'); process.exit(2); }
const dbFile = path.join(source, 'data', 'atoumweb-manager.sqlite');
if (!fs.existsSync(dbFile)) { console.error('Base introuvable : ' + dbFile); process.exit(2); }
// Un fichier -wal ou -journal NON VIDE signale des données en attente (Manager ouvert) : on refuse. Un -wal vide et un -shm sont des résidus sans donnée (par exemple d'une lecture en lecture seule) : on continue.
for (const suffix of ['-wal', '-journal']) { const file = dbFile + suffix; if (fs.existsSync(file) && fs.statSync(file).size > 0) { console.error('Base occupée (' + suffix + ' non vide) : ferme le Manager avant de continuer.'); process.exit(2); } }
const casesFile = path.join(__dirname, 'fixtures', 'gestion-cas-de-figure.json');

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
let workspace = source;
if (!apply) {
  workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'atoumweb-seed-gestion-'));
  fs.mkdirSync(path.join(workspace, 'data'), { recursive: true });
  fs.copyFileSync(dbFile, path.join(workspace, 'data', 'atoumweb-manager.sqlite'));
  console.log('SIMULATION sur une copie jetable : ' + workspace);
} else {
  const backupDir = opt('backup-dir') ? path.resolve(opt('backup-dir')) : path.join(path.dirname(source), 'Sauvegardes-lots');
  fs.mkdirSync(backupDir, { recursive: true });
  const backup = path.join(backupDir, 'avant-cas-de-figure-gestion-' + stamp + '.sqlite');
  fs.copyFileSync(dbFile, backup);
  console.log('Sauvegarde avant écriture : ' + backup);
}
const filesDir = fs.mkdtempSync(path.join(os.tmpdir(), 'atoumweb-seed-gestion-files-'));

const seed = path.join(repo, 'outputs', 'seed-gestion-cas-de-figure-bundle.cjs');
fs.mkdirSync(path.dirname(seed), { recursive: true });
esbuild.buildSync({
  stdin: {
    resolveDir: repo, loader: 'ts', contents: `
import {DatabaseService} from './src/main/database/DatabaseService';
import {ensureWorkspace} from './src/main/workspace';
import fs from 'node:fs';
import path from 'node:path';
const root=process.argv[2],reportFile=process.argv[3],casesFile=process.argv[4],filesDir=process.argv[5];
(async()=>{
 const cases=JSON.parse(fs.readFileSync(casesFile,'utf8'));
 const workspace=ensureWorkspace(root),db=new DatabaseService(workspace);await db.initialize();
 const raw=(db as any).database;const report:any={created:[],skipped:[],missing:[]};
 const log=(p:string,kind:string,label:string)=>report.created.push({projet:p,type:kind,libelle:label});
 const skip=(p:string,kind:string,label:string)=>report.skipped.push({projet:p,type:kind,libelle:label});
 const at=(daysAgo:number,hhmm:string)=>{const [h,m]=hhmm.split(':').map(Number);const d=new Date();d.setDate(d.getDate()-daysAgo);d.setHours(h,m,0,0);return d.toISOString();};
 try{
  for(const c of cases.projects){
   const project=raw.get('SELECT id,client_account_id AS clientId FROM projects WHERE name=?',[c.projectName]);
   if(!project){report.missing.push(c.projectName);continue;}
   const pid=project.id,cid=project.clientId;
   // Documents
   for(const d of c.documents||[]){
    if(raw.get('SELECT id FROM client_documents WHERE client_account_id=? AND title=?',[cid,d.title])){skip(c.projectName,'document',d.title);continue;}
    const file=path.join(filesDir,d.file);
    fs.writeFileSync(file,d.file.endsWith('.pdf')?'%PDF-1.4\\n% Document fictif TEST : '+d.title+'\\n%%EOF\\n':'Document fictif TEST : '+d.title+'\\n');
    const retentionUntil=d.retentionInDays?new Date(Date.now()+d.retentionInDays*86400000).toISOString().slice(0,10):null;
    db.clientDocuments.importPaths(cid,[file],{category:d.category,title:d.title,retentionCode:d.retentionCode??null,retentionReason:d.retentionReason??null,retentionUntil});
    const created=raw.get('SELECT id FROM client_documents WHERE client_account_id=? AND title=?',[cid,d.title]);
    if(d.archived)db.clientDocuments.archive(created.id,true);
    log(c.projectName,'document',d.title+(d.archived?' (archivé)':''));
   }
   // Interventions terminées et facturables, puis éléments de facturation
   for(const i of c.interventions||[]){
    let row=raw.get('SELECT id FROM interventions WHERE project_id=? AND subject=?',[pid,i.subject]);
    if(!row){const created=db.operations.createIntervention({clientAccountId:cid,projectId:pid,subject:i.subject,type:i.type,status:'completed',coverageMode:i.coverageMode,billableAmountCents:i.billableAmountCents,theoreticalValueCents:i.theoreticalValueCents});row={id:created.id};log(c.projectName,'intervention',i.subject+' (terminée, '+i.coverageMode+')');}else skip(c.projectName,'intervention',i.subject);
    const before=raw.get('SELECT id FROM billing_items WHERE source_key=?',['intervention:'+row.id]);
    const item=db.billingHandoff.ensureForIntervention(row.id);
    if(item&&!before)log(c.projectName,'facturation',item.description+' ('+item.status+')');
   }
   const items:any={};
   if(c.billing?.hourPacks){
    for(const pack of raw.all('SELECT id,name FROM hour_packs WHERE project_id=? ORDER BY created_at',[pid])){
     const before=raw.get('SELECT id FROM billing_items WHERE source_key=?',['hour_pack:'+pack.id+':purchase']);
     const item=db.billingHandoff.ensureForHourPack(pack.id);if(!before)log(c.projectName,'facturation',item.description+' ('+item.status+')');
     items.pack=items.pack??item;
    }
   }
   // Facture Abby rattachée à un élément
   const inv=c.billing?.invoice;
   if(inv&&items.pack){
    const doc=raw.get('SELECT id FROM client_documents WHERE client_account_id=? AND title=?',[cid,inv.document]);
    const current=db.billingHandoff.get(items.pack.id);
    if(!doc)report.missing.push(c.projectName+' : document '+inv.document);
    else if(current.invoiceDocumentId)skip(c.projectName,'facture',inv.reference);
    else{db.billingHandoff.attachInvoice(items.pack.id,doc.id,{reference:inv.reference,invoicedAt:new Date().toISOString()});log(c.projectName,'facture rattachée',inv.reference);}
   }
   // Sessions de temps saisies à la main
   for(const s of c.sessions||[]){
    const startedAt=at(s.daysAgo,s.start),endedAt=at(s.daysAgo,s.end);
    if(raw.get('SELECT id FROM time_sessions WHERE project_id=? AND started_at=?',[pid,startedAt])){skip(c.projectName,'session',s.activity);continue;}
    db.time.addManual({projectId:pid,category:s.category,activityLabel:s.activity,billable:s.billable,startedAt,endedAt});
    log(c.projectName,'session',s.activity+' (il y a '+s.daysAgo+' j, '+(s.billable?'facturable':'non facturable')+')');
   }
  }
 }finally{db.close();}
 fs.writeFileSync(reportFile,JSON.stringify(report,null,2));
})().catch(e=>{console.error(e&&e.stack||e);process.exitCode=1;});
`,
  },
  bundle: true, platform: 'node', format: 'cjs', outfile: seed, external: ['electron'], logLevel: 'silent',
});

const reportFile = path.join(os.tmpdir(), 'seed-gestion-cas-' + stamp + '.json');
const run = cp.spawnSync(require('electron'), [seed, workspace, reportFile, casesFile, filesDir], { env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }, windowsHide: true, encoding: 'utf8' });
fs.rmSync(filesDir, { recursive: true, force: true });
if (run.status !== 0) { console.error(run.stderr || run.stdout || 'Échec du jeu de cas de figure.'); process.exit(1); }
const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
console.log(JSON.stringify({ crees: report.created.length, dejaPresents: report.skipped.length, introuvables: report.missing }, null, 2));
if (report.created.length) console.log(report.created.map((x) => '  + ' + x.projet.replace('TEST — ', '') + ' : ' + x.type + ' : ' + x.libelle).join('\n'));
if (apply && report.created.length) {
  const marker = path.join(source, 'DONNEES-FICTIVES-CAS-GESTION.json');
  fs.writeFileSync(marker, JSON.stringify({ type: 'FIXTURE_TEST', creeLe: new Date().toISOString(), note: 'Documents, interventions facturables, éléments de facturation, facture rattachée et sessions de temps fictifs créés par scripts/seed-gestion-cas-de-figure.cjs. Relancer le script est sans effet.', elements: report.created }, null, 2));
  console.log('Repère écrit : ' + marker);
}
if (!apply) fs.rmSync(workspace, { recursive: true, force: true });
