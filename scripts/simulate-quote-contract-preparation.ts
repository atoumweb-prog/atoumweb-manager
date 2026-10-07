// Simulation only: original opened read-only, the sole writable database is a temporary SQLite backup.
import { createHash } from 'node:crypto';
import { existsSync,mkdirSync,readFileSync,writeFileSync } from 'node:fs';
import { backup,DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import assert from 'node:assert/strict';
import { NodeSqliteAdapter } from '../src/main/database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../src/main/database/migrations';
import { CrmService } from '../src/main/crm/CrmService';
import { QuoteService } from '../src/main/commercial/QuoteService';
import { QuoteContractPreparationService } from '../src/main/commercial/QuoteContractPreparationService';
import { emptyContractParameters } from '../src/shared/quoteContractPreparation';
const sha=(file:string)=>createHash('sha256').update(readFileSync(file)).digest('hex');
const ident=(s:string)=>'"'+s.replaceAll('"','""')+'"';
async function main(){
  const args=process.argv.slice(2),options:Record<string,string>={};
  for(let i=0;i<args.length;i++){if(!['--database','--workbook','--output'].includes(args[i])||!args[i+1]||args[i+1].startsWith('--'))throw Error('Options obligatoires : --database SQLITE --workbook XLSX --output DOSSIER. Aucune application réelle.');options[args[i].slice(2)]=path.resolve(args[++i]);}
  if(!options.database||!options.workbook||!options.output)throw Error('Trois chemins requis.');
  const temporary=process.env.ATOUMWEB_QUOTE_PREP_TEMP;if(!temporary)throw Error('Utilise le lanceur .cjs pour garantir l’isolation.');
  const pinDatabase='afaf9b8a7fa196a54dfd29e0fff881b099ad4b1d8bcc2e2da4dd8adc47bf31b8';
  const pinWorkbook='6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8';
  assert.equal(sha(options.database),pinDatabase,'Base différente du checkpoint Lot 4');assert.equal(sha(options.workbook),pinWorkbook,'Classeur différent du référentiel validé');
  const wal=options.database+'-wal';if(existsSync(wal)&&readFileSync(wal).length)throw Error('WAL source actif/non vide : arrêter la simulation, aucune écriture réelle.');
  const before={database:sha(options.database),workbook:sha(options.workbook)};
  const source=new DatabaseSync(options.database,{readOnly:true});
  try{await backup(source,path.join(temporary,'lot5.sqlite'));}finally{source.close();}
  const db=new NodeSqliteAdapter(path.join(temporary,'lot5.sqlite'));db.exec('PRAGMA foreign_keys=ON');
  try{
    assert.equal(db.get<{version:number}>('SELECT MAX(id) version FROM schema_migrations')?.version,55);
    const oldTables=db.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").map(r=>r.name);
    const historical=oldTables.map(table=>({table,columns:db.all<{name:string}>(`PRAGMA table_info(${ident(table)})`).map(c=>c.name),rows:db.all<Record<string,unknown>>(`SELECT * FROM ${ident(table)}`).map(r=>JSON.stringify(r)).sort()}));
    const migrationIds=applyPendingMigrations(db).map(m=>m.id);assert.deepEqual(migrationIds,[56]);
    for(const t of historical)assert.deepEqual(db.all(`SELECT ${t.columns.map(ident).join(',')} FROM ${ident(t.table)}${t.table==='schema_migrations'?' WHERE id<=55':''}`).map(r=>JSON.stringify(r)).sort(),t.rows,`Migration a modifié ${t.table}`);
    assert.deepEqual(applyPendingMigrations(db),[]);
    const crm=new CrmService(db),preparation=new QuoteContractPreparationService(db),quotes=new QuoteService(db,crm);
    const organization=crm.createOrganization({name:'SIMULATION LOT 5 — jamais dans Validation-MSI'}),prospect=crm.createProspect({organizationId:organization.id,primaryNeed:'Validation temporaire uniquement'});
    const test=quotes.create({prospectId:prospect.id,subject:'SIMULATION LOT 5 — paramètres uniquement'});
    const blockedInitial=preparation.get(test.id).issues;
    quotes.addCustomLine(test.id,{label:'Prestation test hors catalogue, sans activation V1',quantityMilli:1000,proposedUnitPriceCents:10001});
    const draftVersion=db.get<{id:string}>("SELECT v.id FROM catalog_versions v JOIN catalog_items i ON i.id=v.item_id WHERE i.canonical_code IS NOT NULL AND v.status='draft' ORDER BY i.canonical_code LIMIT 1")!;
    let catalogueRefusal='';try{quotes.addCatalogLine(test.id,draftVersion.id);throw Error('Un brouillon V1 a été vendu');}catch(e){catalogueRefusal=e instanceof Error?e.message:String(e);assert.match(catalogueRefusal,/publi|disponible/i);}
    const p=emptyContractParameters('professional');p.conclusion={...p.conclusion,channel:'on_premises',context:'Simulation locale — ne décrit aucun devis réel',purchasePurpose:'Test technique'};
    p.digital={...p.digital,kinds:['classical_service'],supply:'one_off',delivery:'Livraison du livrable test',qualificationReason:'Prestation classique uniquement pour simulation'};
    p.payment.milestones=p.payment.milestones.map(m=>({...m,event:m.label}));p.milestones=[{label:'Livraison test',date:'2027-01-01'}];p.rights.reviewed=true;p.renewal.reviewed=true;
    p.warranties=quotes.get(test.id).lines.map(l=>({lineId:l.id,kind:'not_applicable',days:null,startEvent:'',statutoryRightsUnaffected:true}));preparation.save(test.id,p);
    const blockers=preparation.get(test.id).issues.filter(i=>i.severity==='blocking');assert.equal(blockers.length,5);assert(blockers.every(i=>i.code.startsWith('ADMIN_')||i.code==='PUBLISHED_BASE_MISSING'));
    let finalizationRefusal='';try{quotes.finalize(test.id);throw Error('Finalisation incomplète autorisée');}catch(e){finalizationRefusal=e instanceof Error?e.message:String(e);assert.match(finalizationRefusal,/incomplète/);}
    assert.equal(quotes.get(test.id).finalizedAt,null);assert.equal(quotes.get(test.id).contractSnapshotJson,null);
    assert.equal(db.get<{count:number}>("SELECT COUNT(*) count FROM contract_clause_versions WHERE status='published'")?.count,0);
    for(const t of historical.filter(t=>!['number_sequences','search_documents'].includes(t.table))){const current=new Set(db.all(`SELECT ${t.columns.map(ident).join(',')} FROM ${ident(t.table)}`).map(r=>JSON.stringify(r)));assert(t.rows.every(r=>current.has(r)),`Ancien historique modifié : ${t.table}`);}
    const sequenceBefore=historical.find(t=>t.table==='number_sequences')!.rows.map(r=>JSON.parse(r) as Record<string,unknown>);
    const sequenceAfter=db.all<Record<string,unknown>>('SELECT * FROM number_sequences');assert.equal(sequenceAfter.length,sequenceBefore.length);
    for(const old of sequenceBefore){const current=sequenceAfter.find(r=>r.sequence_key===old.sequence_key&&r.sequence_year===old.sequence_year)!;assert(current);if(old.sequence_key==='quote'&&old.sequence_year===new Date().getFullYear()){assert.equal(current.current_value,Number(old.current_value)+1);}else assert.equal(JSON.stringify(current),JSON.stringify(old));}
    const oldSearch=historical.find(t=>t.table==='search_documents')!.rows;
    const searchNow=new Set(db.all('SELECT * FROM search_documents').map(r=>JSON.stringify(r)));
    const derivedChanges={quoteCounterAdvance:1,searchIndexOldRowsRefreshed:oldSearch.filter(r=>!searchNow.has(r)).length,reason:'Effets préexistants de la création CRM sur copie : compteur du devis de test et index de recherche dérivé. Aucun devis/projet/version ancien modifié.'};
    const counts={awCodes:db.get<{n:number}>('SELECT COUNT(*) n FROM catalog_items WHERE canonical_code IS NOT NULL')?.n,clauseTemplates:db.get<{n:number}>('SELECT COUNT(*) n FROM contract_clause_templates')?.n,clauseDrafts:db.get<{n:number}>("SELECT COUNT(*) n FROM contract_clause_versions WHERE status='draft'")?.n,catalogueV1Drafts:db.get<{n:number}>("SELECT COUNT(*) n FROM catalog_versions v JOIN catalog_items i ON i.id=v.item_id WHERE i.canonical_code IS NOT NULL AND v.status='draft'")?.n,clauseLinks:db.get<{n:number}>('SELECT COUNT(*) n FROM catalog_contract_clause_links')?.n,clausePublished:0};
    assert.deepEqual(counts,{awCodes:112,clauseTemplates:118,clauseDrafts:118,catalogueV1Drafts:112,clauseLinks:409,clausePublished:0});
    const oldQuotes=db.all('SELECT quote_number,status,contract_parameters_json,contract_snapshot_json FROM quotes WHERE quote_number IN (\'DEV-2026-001\',\'DEV-2026-002\',\'DEV-2026-003\') ORDER BY quote_number');assert.equal(oldQuotes.length,3);assert(oldQuotes.every(q=>q.contract_parameters_json===null));
    assert.equal(db.get<{integrity_check:string}>('PRAGMA integrity_check')?.integrity_check,'ok');assert.deepEqual(db.all('PRAGMA foreign_key_check'),[]);
    const after={database:sha(options.database),workbook:sha(options.workbook)};assert.deepEqual(after,before,'Une source réelle a changé durant la simulation');
    const report={generatedAt:new Date().toISOString(),mode:'TEMPORARY_ONLY',sourceDatabase:options.database,before,after,migrationIds,migrationReplay:[],historicalTablesPreservedAtMigration:historical.length,derivedChanges,counts,oldQuotes,newQuote:{...quotes.get(test.id),parameters:p,initialIssues:blockedInitial,currentIssues:blockers,finalizationRefusal,catalogueRefusal,clausesEligible:0,acceptanceEvidence:[],annexes:[]},integrity:'ok',foreignKeys:[],realWrites:0,publications:0};
    mkdirSync(options.output,{recursive:true});writeFileSync(path.join(options.output,'simulation-lot5.json'),JSON.stringify(report,null,2)+'\n');
    writeFileSync(path.join(options.output,'simulation-lot5.md'),`# Lot 5 — simulation sur copie uniquement\n\nDate : ${report.generatedAt}\n\nMigration 56 préparée et appliquée sur copie ; rejeu sans modification. ${historical.length} tables anciennes préservées intégralement, puis nouvelles lignes de test ; le compteur de devis avance de 1 et l’index de recherche dérivé est rafraîchi par le CRM existant, sur copie seulement.\n\n112 AW, 112 versions catalogue V1 BROUILLON, 118 clauses BROUILLON et 409 liens conservés ; aucune publication. DEV-2026-001/002/003 sans nouveaux paramètres/snapshot.\n\nNouveau devis test ${test.number} : une ligne libre 100,01 €, échéancier 30/70 (montants arrondis 30,00 €/70,01 €), canal en établissement, prestation classique ponctuelle et garantie explicitement non applicable pour cette fixture. Aucun Client créé, aucune acceptation/PDF inventée.\n\nFinalisation **refusée** : les quatre informations administratives requises restent réellement absentes et le socle contractuel publié manque. Les 118 brouillons ne constituent pas un socle publié ; aucune activation commerciale V1 dans cette simulation. Le gel positif complet est testé séparément en mémoire, avec fixtures exclusivement synthétiques.\n\nIntégrité SQLite OK ; FK vide. Empreintes réelles avant/après identiques :\n\n- Validation-MSI : ${before.database}\n- XLSX : ${before.workbook}\n\nAucune application réelle autorisée par ce script. Arrêt avant écriture Validation-MSI.\n`);
    console.log(JSON.stringify({mode:report.mode,migrationIds,historicalTables:historical.length,counts,integrity:'ok',sourceHashesUnchanged:true,output:options.output},null,2));
  }finally{db.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
