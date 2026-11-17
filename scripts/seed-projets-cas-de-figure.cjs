'use strict';
// Cas de figure fictifs pour les onglets Prérequis et Interventions des trois projets TEST (R5b).
// Les cas sont décrits dans scripts/fixtures/projets-cas-de-figure.json.
//
//   node scripts/seed-projets-cas-de-figure.cjs --workspace "<dossier Workspace>"            simulation sur une COPIE jetable
//   node scripts/seed-projets-cas-de-figure.cjs --workspace "<dossier Workspace>" --apply    écrit dans la base (sauvegarde avant)
//
// Idempotent : un prérequis, une demande, une intervention, un plan, un pack déjà présents (même libellé) ne sont jamais recréés.
// Les projets doivent exister : lancer d'abord scripts/seed-clients-fictifs.cjs.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), cp = require('node:child_process'), esbuild = require('esbuild');
const repo = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : null; };
const apply = args.includes('--apply');
const source = opt('workspace') ? path.resolve(opt('workspace')) : null;
if (!source) { console.error('Usage : node scripts/seed-projets-cas-de-figure.cjs --workspace "<dossier Workspace>" [--apply]'); process.exit(2); }
const dbFile = path.join(source, 'data', 'atoumweb-manager.sqlite');
if (!fs.existsSync(dbFile)) { console.error('Base introuvable : ' + dbFile); process.exit(2); }
for (const suffix of ['-wal', '-shm', '-journal']) if (fs.existsSync(dbFile + suffix)) { console.error('Base occupée (' + suffix + ') : ferme le Manager avant de continuer.'); process.exit(2); }
const casesFile = path.join(__dirname, 'fixtures', 'projets-cas-de-figure.json');

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
let workspace = source;
if (!apply) {
  workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'atoumweb-seed-cas-'));
  fs.mkdirSync(path.join(workspace, 'data'), { recursive: true });
  fs.copyFileSync(dbFile, path.join(workspace, 'data', 'atoumweb-manager.sqlite'));
  console.log('SIMULATION sur une copie jetable : ' + workspace);
} else {
  const backupDir = opt('backup-dir') ? path.resolve(opt('backup-dir')) : path.join(path.dirname(source), 'Sauvegardes-lots');
  fs.mkdirSync(backupDir, { recursive: true });
  const backup = path.join(backupDir, 'avant-cas-de-figure-projets-' + stamp + '.sqlite');
  fs.copyFileSync(dbFile, backup);
  console.log('Sauvegarde avant écriture : ' + backup);
}

const seed = path.join(repo, 'outputs', 'seed-projets-cas-de-figure-bundle.cjs');
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
 const raw=(db as any).database;const report:any={created:[],skipped:[],missing:[]};
 const today=new Date().toISOString().slice(0,10);
 const inDays=(n:number)=>new Date(Date.now()+n*86400000).toISOString();
 const log=(p:string,kind:string,label:string)=>report.created.push({projet:p,type:kind,libelle:label});
 const skip=(p:string,kind:string,label:string)=>report.skipped.push({projet:p,type:kind,libelle:label});
 try{
  for(const c of cases.projects){
   const project=raw.get('SELECT id,client_account_id AS clientId FROM projects WHERE name=?',[c.projectName]);
   if(!project){report.missing.push(c.projectName);continue;}
   const pid=project.id,cid=project.clientId;
   for(const p of c.prerequisites||[]){
    if(raw.get('SELECT id FROM project_prerequisites WHERE project_id=? AND label=? AND archived_at IS NULL',[pid,p.label])){skip(c.projectName,'prerequis',p.label);continue;}
    const detail=db.projects.addPrerequisite(pid,{label:p.label,description:p.description??null,required:p.required});
    const added=detail.prerequisites.find((x:any)=>x.label===p.label)!;
    if(p.status&&p.status!=='to_request')db.projects.updatePrerequisiteStatus(added.id,p.status);
    log(c.projectName,'prerequis',p.label+' ('+p.status+')');
   }
   if(c.maintenancePlan){
    let plan=db.maintenance.listPlans(true).find((x:any)=>x.name===c.maintenancePlan.name);
    if(!plan)plan=db.maintenance.createPlan(c.maintenancePlan);
    if(c.maintenanceSubscription){
     if(raw.get('SELECT id FROM maintenance_subscriptions WHERE project_id=? AND plan_id=?',[pid,plan.id])){skip(c.projectName,'maintenance',plan.name);}
     else{db.maintenance.createSubscription({clientAccountId:cid,projectId:pid,planId:plan.id,startDate:today});log(c.projectName,'maintenance',plan.name);}
    }
   }
   if(c.hourPack){
    if(raw.get('SELECT id FROM hour_packs WHERE project_id=? AND name=?',[pid,c.hourPack.name])){skip(c.projectName,'pack',c.hourPack.name);}
    else{db.hourPacks.create({clientAccountId:cid,projectId:pid,name:c.hourPack.name,purchasedSeconds:c.hourPack.purchasedSeconds,contractPriceCents:c.hourPack.contractPriceCents});log(c.projectName,'pack',c.hourPack.name);}
   }
   for(const r of c.requests||[]){
    if(raw.get('SELECT id FROM service_requests WHERE project_id=? AND subject=?',[pid,r.subject])){skip(c.projectName,'demande',r.subject);continue;}
    const created=db.operations.createRequest({clientAccountId:cid,projectId:pid,source:r.source,subject:r.subject,description:r.description??null,priority:r.priority});
    if(r.status&&r.status!=='new')db.operations.changeRequestStatus(created.id,r.status);
    log(c.projectName,'demande',r.subject+' ('+r.status+')');
   }
   for(const i of c.interventions||[]){
    if(raw.get('SELECT id FROM interventions WHERE project_id=? AND subject=?',[pid,i.subject])){skip(c.projectName,'intervention',i.subject);continue;}
    db.operations.createIntervention({clientAccountId:cid,projectId:pid,subject:i.subject,type:i.type,status:i.status,coverageMode:i.coverageMode,priority:i.priority,scheduledAt:i.scheduledInDays?inDays(i.scheduledInDays):null});
    log(c.projectName,'intervention',i.subject+' ('+i.status+')');
   }
  }
 }finally{db.close();}
 fs.writeFileSync(reportFile,JSON.stringify(report,null,2));
})().catch(e=>{console.error(e&&e.stack||e);process.exitCode=1;});
`,
  },
  bundle: true, platform: 'node', format: 'cjs', outfile: seed, external: ['electron'], logLevel: 'silent',
});

const reportFile = path.join(os.tmpdir(), 'seed-projets-cas-' + stamp + '.json');
const run = cp.spawnSync(require('electron'), [seed, workspace, reportFile, casesFile], { env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }, windowsHide: true, encoding: 'utf8' });
if (run.status !== 0) { console.error(run.stderr || run.stdout || 'Échec du jeu de cas de figure.'); process.exit(1); }
const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
console.log(JSON.stringify({ crees: report.created.length, dejaPresents: report.skipped.length, projetsIntrouvables: report.missing }, null, 2));
if (report.created.length) console.log(report.created.map((x) => '  + ' + x.projet.replace('TEST — ', '') + ' : ' + x.type + ' : ' + x.libelle).join('\n'));
if (apply && report.created.length) {
  const marker = path.join(source, 'DONNEES-FICTIVES-CAS-DE-FIGURE.json');
  fs.writeFileSync(marker, JSON.stringify({ type: 'FIXTURE_TEST', creeLe: new Date().toISOString(), note: 'Prérequis, demandes, interventions, maintenance et pack fictifs créés par scripts/seed-projets-cas-de-figure.cjs. Relancer le script est sans effet.', elements: report.created }, null, 2));
  console.log('Repère écrit : ' + marker);
}
if (!apply) fs.rmSync(workspace, { recursive: true, force: true });
