'use strict';
// Jeu de données fictif : trois clients TEST (site vitrine à 699 €, e-commerce, landing page), chacun avec un devis
// finalisé, envoyé, accepté, puis transformé en projet avec un plan en phases. Même séquence que `workflow/DemoService.ts`.
//
//   node scripts/seed-clients-fictifs.cjs --workspace "<dossier Workspace>"            simulation sur une COPIE jetable
//   node scripts/seed-clients-fictifs.cjs --workspace "<dossier Workspace>" --apply    écrit dans la base (sauvegarde avant)
//
// Idempotent : une organisation « TEST — … » déjà présente n'est jamais recréée. Données uniquement fictives (libellé TEST).
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), cp = require('node:child_process'), esbuild = require('esbuild');
const repo = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : null; };
const apply = args.includes('--apply');
const source = opt('workspace') ? path.resolve(opt('workspace')) : null;
if (!source) { console.error('Usage : node scripts/seed-clients-fictifs.cjs --workspace "<dossier Workspace>" [--apply]'); process.exit(2); }
const dbFile = path.join(source, 'data', 'atoumweb-manager.sqlite');
if (!fs.existsSync(dbFile)) { console.error('Base introuvable : ' + dbFile); process.exit(2); }
for (const suffix of ['-wal', '-shm', '-journal']) if (fs.existsSync(dbFile + suffix)) { console.error('Base occupée (' + suffix + ') : ferme le Manager avant de continuer.'); process.exit(2); }

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
let workspace = source;
if (!apply) {
  workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'atoumweb-seed-clients-'));
  fs.mkdirSync(path.join(workspace, 'data'), { recursive: true });
  fs.copyFileSync(dbFile, path.join(workspace, 'data', 'atoumweb-manager.sqlite'));
  console.log('SIMULATION sur une copie jetable : ' + workspace);
} else {
  const backupDir = opt('backup-dir') ? path.resolve(opt('backup-dir')) : path.join(path.dirname(source), 'Sauvegardes-lots');
  fs.mkdirSync(backupDir, { recursive: true });
  const backup = path.join(backupDir, 'avant-clients-fictifs-' + stamp + '.sqlite');
  fs.copyFileSync(dbFile, backup);
  console.log('Sauvegarde avant écriture : ' + backup);
}

const seed = path.join(repo, 'outputs', 'seed-clients-fictifs-bundle.cjs');
fs.mkdirSync(path.dirname(seed), { recursive: true });
esbuild.buildSync({
  stdin: {
    resolveDir: repo, loader: 'ts', contents: `
import {DatabaseService} from './src/main/database/DatabaseService';
import {ensureWorkspace} from './src/main/workspace';
import {QuoteContractPreparationService} from './src/main/commercial/QuoteContractPreparationService';
import {randomUUID} from 'node:crypto';
import fs from 'node:fs';
const root=process.argv[2],reportFile=process.argv[3];
const SCENARIOS=[
 {key:'vitrine',label:'Boulangerie Lefèvre',contact:['Camille','Lefèvre'],code:'AW-WEB-VITRINE',match:/vitrine/i,priceCents:69900,subject:'TEST — Site vitrine à 699 €',
  plan:[['1. Cadrage et contenus',[['Recevoir le logo et les textes',90],['Valider l’arborescence du site',60],['Rédiger les pages principales',240]]],['2. Conception',[['Maquette de l’accueil',180],['Maquette des pages internes',240],['Retour du client sur la maquette',30]]],['3. Réalisation',[['Installer WordPress et le thème',120],['Intégrer l’accueil et les pages',240],['Formulaire de contact',60]]],['4. Mise en ligne',[['Relecture finale avec le client',60],['Mise en ligne et contrôles',90]]]]},
 {key:'ecommerce',label:'Atelier des Saveurs',contact:['Julien','Moreau'],match:/e-?commerce|boutique|woocommerce/i,priceCents:149000,subject:'TEST — Boutique en ligne',
  plan:[['1. Cadrage et catalogue',[['Recevoir les produits et photos',180],['Définir livraison et paiement',90],['Valider l’arborescence de la boutique',60]]],['2. Conception',[['Maquette de la boutique',300],['Fiche produit type',120]]],['3. Réalisation',[['Installer WooCommerce et le thème',150],['Importer le catalogue',240],['Configurer paiement et livraison',180],['Pages légales et CGV',90]]],['4. Recette et mise en ligne',[['Commandes de test',120],['Formation du client',90],['Mise en ligne et contrôles',90]]]]},
 {key:'landing',label:'Studio Horizon',contact:['Sarah','Benali'],match:/landing/i,priceCents:39000,subject:'TEST — Landing page',
  plan:[['1. Cadrage',[['Définir l’objectif et la cible',60],['Recevoir textes et visuels',90]]],['2. Conception et réalisation',[['Maquette de la page',120],['Intégration responsive',180],['Formulaire et suivi des demandes',60]]],['3. Mise en ligne',[['Relecture avec le client',45],['Mise en ligne et contrôles',60]]]]},
];
(async()=>{
 const workspace=ensureWorkspace(root),db=new DatabaseService(workspace);await db.initialize();
 const raw=(db as any).database;const report:any={created:[],skipped:[],notes:[]};
 try{
  const items=db.catalog.list({}).filter((i:any)=>i.status==='active'&&i.currentVersion);
  report.notes.push('Offres actives lues : '+items.length);
  for(const s of SCENARIOS){
   const orgName='TEST — '+s.label;
   if(raw.get('SELECT id FROM organizations WHERE name=?',[orgName])){report.skipped.push(orgName);continue;}
   const item=(s.code&&items.find((i:any)=>i.canonicalCode===s.code))||items.find((i:any)=>s.match.test(i.name+' '+(i.canonicalCode||'')));
   if(!item){report.skipped.push(orgName+' : aucune offre active ne correspond à '+s.match);continue;}
   // Modèle de projet publié, avec un vrai plan en phases (créé une fois, réutilisable).
   const tplName='TEST — Parcours '+s.key;
   let tpl=db.projects.listTemplates().find((t:any)=>t.name===tplName);
   if(!tpl){
    const t=db.projects.createTemplate({name:tplName,projectType:s.key});const vid=t.currentVersion!.id;
    for(const [lot,tasks] of s.plan as any){let v=db.projects.addTemplateNode(vid,{type:'lot',name:lot,required:true});const parent=v.nodes.find((n:any)=>n.name===lot&&!n.parentId)!;for(const [name,minutes] of tasks){v=db.projects.addTemplateNode(vid,{type:'task',name,parentId:parent.id,estimatedMinutes:minutes,required:true});}}
    db.projects.publishTemplateVersion(vid);tpl=db.projects.getTemplate(t.id);
   }
   const org=db.crm.createOrganization({name:orgName,email:'contact@example.test'});
   const contact=db.crm.createContact({organizationId:org.id,firstName:s.contact[0],lastName:s.contact[1],email:s.contact[0].toLowerCase()+'@example.test'});
   const prospect=db.crm.createProspect({organizationId:org.id,contactId:contact.id,stage:'need_identified',notes:'Données fictives TEST pour la recette.'});
   const quote=db.quotes.create({prospectId:prospect.id,subject:s.subject});
   const price=s.key==='vitrine'?s.priceCents:(item.currentVersion.priceCents??s.priceCents);
   db.quotes.addCatalogLine(quote.id,item.currentVersion.id,{proposedUnitPriceCents:price});
   const prepared=db.projects.commercial.prepare({quoteId:quote.id,templateVersionId:tpl.currentVersion!.id,targetDate:new Date(Date.now()+30*86400000).toISOString().slice(0,10)});
   raw.run('UPDATE quotes SET contract_parameters_json=NULL WHERE id=?',[quote.id]);
   db.quotes.finalize(quote.id);
   // Règle réelle du Manager : si le devis touche des données personnelles, le modèle d'accord RGPD doit être marqué « remis » avant l'envoi.
   if(db.quotes.get(quote.id).dataAgreementModel?.required)db.quotes.setDataAgreementModelHanded(quote.id,true);
   const version=db.quotes.transmissionState(quote.id);
   db.quotes.markSent(quote.id,{operationId:randomUUID(),preparationId:version.preparationId,contentHash:version.contentHash!,occurredAt:new Date().toISOString(),channel:'other',provenance:'TEST — envoi simulé, aucune transmission réelle',confirmed:true});
   new QuoteContractPreparationService(raw).recordAcceptance(quote.id,'TEST — acceptation simulée, aucun accord réel',new Date().toISOString(),'Jeu de données fictif');
   const accepted=db.quotes.accept(quote.id);
   const project=db.projects.getProject(prepared.id);
   report.created.push({scenario:s.key,organisation:orgName,offre:item.name,offreCode:item.canonicalCode,prixCents:price,devis:accepted.number,statutDevis:accepted.status,clientId:accepted.clientAccountId,projet:project.number,projetNom:project.name,statutProjet:project.status,etatCommercial:project.commercialState,avantAcceptation:prepared.commercialState,elements:project.nodes.length});
  }
 }finally{db.close();}
 fs.writeFileSync(reportFile,JSON.stringify(report,null,2));
})().catch(e=>{console.error(e&&e.stack||e);process.exitCode=1;});
`,
  },
  bundle: true, platform: 'node', format: 'cjs', outfile: seed, external: ['electron'], logLevel: 'silent',
});

const reportFile = path.join(os.tmpdir(), 'seed-clients-fictifs-' + stamp + '.json');
const run = cp.spawnSync(require('electron'), [seed, workspace, reportFile], { env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }, windowsHide: true, encoding: 'utf8' });
if (run.status !== 0) { console.error(run.stderr || run.stdout || 'Échec du jeu de données.'); process.exit(1); }
const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
console.log(JSON.stringify(report, null, 2));
if (apply && report.created.length) {
  const marker = path.join(source, 'DONNEES-FICTIVES-CLIENTS.json');
  fs.writeFileSync(marker, JSON.stringify({ type: 'FIXTURE_TEST', creeLe: new Date().toISOString(), note: 'Trois clients fictifs avec devis acceptés et projets, créés par scripts/seed-clients-fictifs.cjs. Relancer le script est sans effet.', clients: report.created }, null, 2));
  console.log('Repère écrit : ' + marker);
}
if (!apply) fs.rmSync(workspace, { recursive: true, force: true });
