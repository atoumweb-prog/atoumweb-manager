import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { backup, DatabaseSync } from 'node:sqlite';
import { NodeSqliteAdapter } from '../src/main/database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../src/main/database/migrations';
import { catalogImportHash as hash } from '../src/main/commercial/CatalogImportService';
import { ContractTermsService } from '../src/main/commercial/ContractTermsService';
import { ContractLibraryImportService, contractLibraryExtractionHash, type ContractLibrarySource, type ContractLibraryManifest } from '../src/main/commercial/ContractLibraryImportService';

async function main() {
 const args=process.argv.slice(2), options:Record<string,string>={};let rehearse=false;
 for(let i=0;i<args.length;i++) {
  if(args[i]==='--rehearse-temporary'){rehearse=true;continue;}
  if(!['--database','--workbook','--documents','--output'].includes(args[i])||!args[i+1]||args[i+1].startsWith('--'))throw Error('Options : --database SQLITE --workbook XLSX --documents DOSSIER --output DOSSIER [--rehearse-temporary]. Aucune application réelle disponible.');
  options[args[i].slice(2)]=path.resolve(args[++i]);
 }
 if(!options.database||!options.workbook||!options.documents||!options.output)throw Error('Quatre chemins requis.');
 const temporary=process.env.ATOUMWEB_CONTRACT_IMPORT_TEMP;if(!temporary)throw Error('Lancer le .cjs pour isoler la copie.');
 const sha=(file:string)=>createHash('sha256').update(readFileSync(file)).digest('hex');
 const source:ContractLibrarySource=JSON.parse(readFileSync('data/contracts/atoumweb-contract-library-v1.json','utf8'));
 const manifest:ContractLibraryManifest=JSON.parse(readFileSync('data/contracts/atoumweb-contract-library-v1-manifest.json','utf8'));
 const sourceFiles=[options.database,options.database+'-wal',options.workbook,...source.source.documents.map(d=>path.join(options.documents,d.reference))];
 const fingerprints=()=>Object.fromEntries(sourceFiles.map(file=>[file,existsSync(file)?sha(file):null]));
 const beforeFiles=fingerprints();
 if(sha(options.workbook)!==source.source.sha256||contractLibraryExtractionHash(source)!==manifest.extractionSha256)throw Error('Référentiel/extraction différent du manifeste.');
 for(const doc of source.source.documents)if(sha(path.join(options.documents,doc.reference))!==doc.sha256)throw Error(`Document vivant modifié : ${doc.reference}. Nouveau dry-run requis.`);
 const copyPath=path.join(temporary,'rehearsal.sqlite');
 const original=new DatabaseSync(options.database,{readOnly:true});
 const originalMigrations=original.prepare('SELECT id FROM schema_migrations ORDER BY id').all();
 try{await backup(original,copyPath);}finally{original.close();}
 const db=new NodeSqliteAdapter(copyPath);
 try {
  db.exec('PRAGMA foreign_keys=ON;');
  const snapshot=()=>db.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").map(t=>({table:t.name,rows:db.all(`SELECT * FROM "${t.name}" ORDER BY rowid`)}));
  const historical=snapshot().map(t=>({...t,columns:db.all<{name:string}>(`PRAGMA table_info("${t.table}")`).map(c=>c.name)}));
  const migrations=applyPendingMigrations(db).map(m=>m.id);
  if(hash(migrations)!==hash([55]))throw Error('Copie attendue au checkpoint 54 ; seule la migration 55 est autorisée dans ce dry-run.');
  const migrationPreservation=historical.filter(t=>t.table!=='schema_migrations').every(t=>hash(t.rows)===hash(db.all(`SELECT ${t.columns.map(c=>`"${c}"`).join(',')} FROM "${t.table}" ORDER BY rowid`)));
  if(!migrationPreservation)throw Error('Migration non additive sur les données historiques.');
  const service=new ContractLibraryImportService(db),plan=service.simulate(source,manifest);
  if(plan.anomalies.length||plan.counts.clausesToCreate!==118||plan.counts.versionsToCreate!==118||plan.counts.linksToCreate!==409)throw Error(`Dry-run non conforme : ${JSON.stringify(plan.diagnostics)}`);
  let rehearsal:Record<string,unknown>|null=null;
  if(rehearse) {
   service.apply(source,manifest,plan.planSha256);
   const allowed=new Set(['schema_migrations','activity_log','contract_clause_templates','contract_clause_versions','catalog_contract_clause_links']);
   const preservation=historical.filter(t=>!allowed.has(t.table)).map(t=>({table:t.table,historicalRows:t.rows.length,preserved:hash(t.rows)===hash(db.all(`SELECT ${t.columns.map(c=>`"${c}"`).join(',')} FROM "${t.table}" ORDER BY rowid`))}));
   // Even the contract tables may only gain rows; no former row may be altered.
   const oldContractRowsPreserved=historical.filter(t=>allowed.has(t.table)&&!['activity_log','schema_migrations'].includes(t.table)).every(t=>{const actual=db.all(`SELECT ${t.columns.map(c=>`"${c}"`).join(',')} FROM "${t.table}" ORDER BY rowid`);return t.rows.every(old=>actual.some(r=>hash(r)===hash(old)));});
   if(preservation.some(t=>!t.preserved)||!oldContractRowsPreserved)throw Error('Historique changé dans la copie.');
   const templates=new ContractTermsService(db).listTemplates();
   const exactTextsAndMetadata=source.records.every(r=>{const t=templates.find(t=>t.code===r.code);return t?.versions.length===1&&t.currentVersionId===null&&t.versions[0].status==='draft'&&t.versions[0].body===r.body&&hash(t.versions[0].review)===hash(r.review);});
   const actualLinks=db.all('SELECT i.canonical_code awCode,t.code clauseCode,l.sort_order sortOrder FROM catalog_contract_clause_links l JOIN catalog_items i ON i.id=l.catalog_item_id JOIN contract_clause_templates t ON t.id=l.clause_id ORDER BY awCode,clauseCode');
   const expectedLinks=source.links.map(({awCode,clauseCode,sortOrder})=>({awCode,clauseCode,sortOrder})).sort((a,b)=>a.awCode.localeCompare(b.awCode)||a.clauseCode.localeCompare(b.clauseCode));
   // SQL BINARY and localeCompare can order punctuation differently; sort both identically.
   actualLinks.sort((a,b)=>String(a.awCode).localeCompare(String(b.awCode))||String(a.clauseCode).localeCompare(String(b.clauseCode)));
   const exactLinks=hash(actualLinks)===hash(expectedLinks);
   const published=db.get<{n:number}>("SELECT COUNT(*) n FROM contract_clause_versions WHERE status='published' OR published_at IS NOT NULL")!.n;
   const baseLinks=db.get<{n:number}>("SELECT COUNT(*) n FROM catalog_contract_clause_links l JOIN contract_clause_templates t ON t.id=l.clause_id WHERE t.scope='base'")!.n;
   const dormant=templates.filter(t=>t.scope==='catalog'&&!t.catalogItemIds.length).map(t=>t.code);
   const controlExcluded=!templates.some(t=>t.code==='CONS-RETRACTATION-EN-LIGNE');
   const terms=new ContractTermsService(db);
   const historicalQuotes=db.all<{id:string;quote_number:string;status:string;contract_compiled_at:string|null}>('SELECT id,quote_number,status,contract_compiled_at FROM quotes ORDER BY quote_number').map(q=>({...q,snapshotState:terms.getQuoteBuild(q.id).snapshotState}));
   const historicalQuoteStatesPreserved=historicalQuotes.filter(q=>['DEV-2026-001','DEV-2026-002','DEV-2026-003'].includes(q.quote_number)).length===3&&historicalQuotes.every(q=>q.snapshotState==='historical_missing');
   const replay=service.simulate(source,manifest),beforeReplay=hash(snapshot());service.apply(source,manifest,replay.planSha256);const replayUnchanged=beforeReplay===hash(snapshot());
   const fk=db.all('PRAGMA foreign_key_check'),integrity=db.get('PRAGMA integrity_check');
   if(!exactTextsAndMetadata||!exactLinks||published||baseLinks||hash(dormant)!==hash(['LANDING-GESTION'])||!controlExcluded||!replayUnchanged||replay.anomalies.length||fk.length||integrity?.integrity_check!=='ok'||!historicalQuoteStatesPreserved)throw Error('Contrôle post-import sur copie non conforme.');
   rehearsal={destination:'Copie temporaire uniquement, supprimée à la sortie',counts:plan.counts,exactTextsAndMetadata,exactLinks,publishedVersions:published,baseCatalogLinks:baseLinks,dormant,controlExcluded,preservation,oldContractRowsPreserved,historicalQuotes,historicalQuoteStatesPreserved,replayCounts:replay.counts,replayUnchanged,foreignKeyCheck:fk,integrityCheck:integrity,ledgerRuns:db.get('SELECT COUNT(*) n FROM contract_library_import_runs'),ledgerEntries:db.get('SELECT COUNT(*) n FROM contract_library_import_entries')};
  }
  const afterFiles=fingerprints(),realFilesUnchanged=hash(beforeFiles)===hash(afterFiles);if(!realFilesUnchanged)throw Error('Une empreinte source a changé pendant la lecture.');
  const proof={checkedAt:new Date().toISOString(),mode:'Source SQLite ouverte en lecture seule ; migration/import uniquement sur copie',source:source.source,extractionSha256:manifest.extractionSha256,beforeFiles,afterFiles,realFilesUnchanged,originalMigrations,migrationsOnTemporaryCopyOnly:migrations,migrationPreservation,plan,rehearsal};
  mkdirSync(options.output,{recursive:true});
  const target=(name:string)=>path.join(options.output,name);
  writeFileSync(target('simulation-bibliotheque-v1.json'),JSON.stringify(proof,null,2)+'\n');
  const headers=['Code clause','Scope','Audience','Version','État','Action','Liens AW','Niveau de revue','Source XLSX','Anomalie'];
  const rows=plan.rows.map(r=>[r.code,r.scope,r.audience,r.version,r.state,r.action,r.links,r.review,r.source,r.anomaly??'Aucune']);
  writeFileSync(target('simulation-bibliotheque-v1.csv'),'\ufeff'+[headers,...rows].map(row=>row.map(v=>`"${String(v).replaceAll('"','""')}"`).join(';')).join('\r\n')+'\r\n');
  const md=(row:unknown[])=>'| '+row.map(v=>String(v).replaceAll('|','\\|').replaceAll('\n',' ')).join(' | ')+' |';
  const lines=['# Lot 4 — dry-run bibliothèque contractuelle V1','',`Contrôle : ${proof.checkedAt}.`,'','**Arrêt avant toute écriture réelle dans Validation-MSI. Aucune publication.**','',
   '## Cible et diagnostics','',`118 clauses, 118 versions initiales BROUILLON, 409 liens explicites. Scopes : 19 base / 99 catalog. Audiences : 105 all / 3 professional / 10 consumer.`,
   `Anomalies : ${plan.anomalies.length}. Aucune référence absente, aucun doublon, aucun texte vide, aucun lien BASE artificiel. LANDING-GESTION demeure seule dormante ; CONS-RETRACTATION-EN-LIGNE est exclu.`,
   `Suivi éditorial conservé : ${JSON.stringify(plan.editorial)}. Ce suivi ne constitue pas un statut de publication.`,
   `Niveaux de revue : ${JSON.stringify(plan.reviews)}. Les 16 décisions métier restent closes ; les 44 actions hors clause ne sont pas importées comme clauses/tables.`,
   '', '## Empreintes','',`XLSX : ${source.source.sha256}.`,`Extraction : ${manifest.extractionSha256}.`,`Validation-MSI avant/après, inchangée : ${beforeFiles[options.database]}.`,
   `Jeton de plan sur copie migrée : ${plan.planSha256}. À recalculer sous verrou juste avant une future application autorisée.`,
   '', '## Tableau exhaustif des 118 clauses','',md(headers),md(headers.map(()=>'---')),...rows.map(md),
   '', '## Répétition sur copie', '',rehearsal?'118 textes/revues exacts ; 409 liens exacts ; 0 publication ; 0 lien BASE ; journal 1 import / 118 entrées. Second passage : 0 création, 0 version, 0 lien supplémentaire et état logique strictement identique. SQLite integrity_check OK et foreign_key_check vide. Les données catalogue, les trois anciens devis, projets et anciennes versions restent identiques ; absence historique de contrat inchangée. Détails table par table et empreintes des 8 documents vivants dans le JSON.':'Non demandée.',
   '', '## Limites et étape suivante', '', 'Migration additive 55 préparée, exécutée uniquement sur copie. Migrations 1 à 54 inchangées. Aucune écriture réelle ni publication de clause/catalogue V1, aucun démarrage Manager, aucun Lot 5/Bridge/8C. La visibilité des brouillons est vérifiée en Chromium isolé avec IPC simulé ; la recette réelle dans Validation-MSI suivra seulement après autorisation de l’import. Aucun commit Lot 4 ni push/merge.', ''];
  writeFileSync(target('simulation-bibliotheque-v1.md'),lines.join('\n'));
  console.log(JSON.stringify({files:['simulation-bibliotheque-v1.md','simulation-bibliotheque-v1.csv','simulation-bibliotheque-v1.json'].map(target),counts:plan.counts,anomalies:plan.anomalies,realFilesUnchanged,migrationPreservation,replayCounts:rehearsal?.replayCounts},null,2));
 }finally{db.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
