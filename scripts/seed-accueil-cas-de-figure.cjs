'use strict';
// Cas de figure fictifs pour la liste « À faire maintenant » de l'Accueil (R6).
// Les cas sont décrits dans scripts/fixtures/accueil-cas-de-figure.json.
//
//   node scripts/seed-accueil-cas-de-figure.cjs --workspace "<dossier Workspace>"            simulation sur une COPIE jetable
//   node scripts/seed-accueil-cas-de-figure.cjs --workspace "<dossier Workspace>" --apply    écrit dans la base (sauvegarde avant)
//
// Idempotent : une organisation déjà présente (même nom) n'est jamais recréée. Données uniquement fictives (libellé TEST).
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), cp = require('node:child_process'), esbuild = require('esbuild');
const repo = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : null; };
const apply = args.includes('--apply');
const source = opt('workspace') ? path.resolve(opt('workspace')) : null;
if (!source) { console.error('Usage : node scripts/seed-accueil-cas-de-figure.cjs --workspace "<dossier Workspace>" [--apply]'); process.exit(2); }
const dbFile = path.join(source, 'data', 'atoumweb-manager.sqlite');
if (!fs.existsSync(dbFile)) { console.error('Base introuvable : ' + dbFile); process.exit(2); }
for (const suffix of ['-wal', '-shm', '-journal']) if (fs.existsSync(dbFile + suffix)) { console.error('Base occupée (' + suffix + ') : ferme le Manager avant de continuer.'); process.exit(2); }
const casesFile = path.join(__dirname, 'fixtures', 'accueil-cas-de-figure.json');

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
let workspace = source;
if (!apply) {
  workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'atoumweb-seed-accueil-'));
  fs.mkdirSync(path.join(workspace, 'data'), { recursive: true });
  fs.copyFileSync(dbFile, path.join(workspace, 'data', 'atoumweb-manager.sqlite'));
  console.log('SIMULATION sur une copie jetable : ' + workspace);
} else {
  const backupDir = opt('backup-dir') ? path.resolve(opt('backup-dir')) : path.join(path.dirname(source), 'Sauvegardes-lots');
  fs.mkdirSync(backupDir, { recursive: true });
  const backup = path.join(backupDir, 'avant-cas-de-figure-accueil-' + stamp + '.sqlite');
  fs.copyFileSync(dbFile, backup);
  console.log('Sauvegarde avant écriture : ' + backup);
}

const seed = path.join(repo, 'outputs', 'seed-accueil-cas-de-figure-bundle.cjs');
fs.mkdirSync(path.dirname(seed), { recursive: true });
esbuild.buildSync({
  stdin: {
    resolveDir: repo, loader: 'ts', contents: `
import {DatabaseService} from './src/main/database/DatabaseService';
import {ensureWorkspace} from './src/main/workspace';
import fs from 'node:fs';
const root=process.argv[2],reportFile=process.argv[3],casesFile=process.argv[4];
(async()=>{
 const cases=JSON.parse(fs.readFileSync(casesFile,'utf8'));
 const workspace=ensureWorkspace(root),db=new DatabaseService(workspace);await db.initialize();
 const raw=(db as any).database;const report:any={created:[],skipped:[]};
 const isoDaysAgo=(n:number)=>new Date(Date.now()-n*86400000).toISOString();
 try{
  for(const c of cases.prospects){
   if(raw.get('SELECT id FROM organizations WHERE name=?',[c.organisation])){report.skipped.push(c.organisation);continue;}
   const org=db.crm.createOrganization({name:c.organisation,email:'contact@example.test'});
   const contact=db.crm.createContact({organizationId:org.id,firstName:c.contact[0],lastName:c.contact[1],email:c.contact[0].toLowerCase()+'@example.test'});
   const prospect=db.crm.createProspect({organizationId:org.id,contactId:contact.id,stage:c.stage,notes:'Données fictives TEST pour la recette.'});
   report.created.push({type:'prospect',libelle:c.organisation+' ('+c.stage+')'});
   if(c.quote){db.quotes.create({prospectId:prospect.id,subject:c.quote.subject});report.created.push({type:'devis brouillon',libelle:c.quote.subject});}
   for(const a of c.actions||[]){db.actions.create({ownerType:'prospect',ownerId:prospect.id,type:'action',title:a.title,dueAt:isoDaysAgo(a.daysLate)});report.created.push({type:'action',libelle:a.title+' (en retard de '+a.daysLate+' j)'});}
  }
 }finally{db.close();}
 fs.writeFileSync(reportFile,JSON.stringify(report,null,2));
})().catch(e=>{console.error(e&&e.stack||e);process.exitCode=1;});
`,
  },
  bundle: true, platform: 'node', format: 'cjs', outfile: seed, external: ['electron'], logLevel: 'silent',
});

const reportFile = path.join(os.tmpdir(), 'seed-accueil-cas-' + stamp + '.json');
const run = cp.spawnSync(require('electron'), [seed, workspace, reportFile, casesFile], { env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }, windowsHide: true, encoding: 'utf8' });
if (run.status !== 0) { console.error(run.stderr || run.stdout || 'Échec du jeu de cas de figure.'); process.exit(1); }
const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
console.log(JSON.stringify({ crees: report.created.length, dejaPresents: report.skipped.length }, null, 2));
if (report.created.length) console.log(report.created.map((x) => '  + ' + x.type + ' : ' + x.libelle).join('\n'));
if (apply && report.created.length) {
  const marker = path.join(source, 'DONNEES-FICTIVES-CAS-ACCUEIL.json');
  fs.writeFileSync(marker, JSON.stringify({ type: 'FIXTURE_TEST', creeLe: new Date().toISOString(), note: 'Prospects, devis brouillon et actions fictifs créés par scripts/seed-accueil-cas-de-figure.cjs. Relancer le script est sans effet.', elements: report.created }, null, 2));
  console.log('Repère écrit : ' + marker);
}
if (!apply) fs.rmSync(workspace, { recursive: true, force: true });
