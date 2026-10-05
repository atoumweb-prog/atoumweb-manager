import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import { MIGRATIONS, applyPendingMigrations, ensureMigrationTable } from '../database/migrations';
import { CatalogImportService, catalogImportHash as hash } from './CatalogImportService';
import { ContractTermsService } from './ContractTermsService';
import { CrmService } from '../crm/CrmService';
import { QuoteService } from './QuoteService';
import { ContractLibraryImportService, contractLibraryExtractionHash, type ContractLibrarySource, type ContractLibraryManifest } from './ContractLibraryImportService';
const source: ContractLibrarySource = JSON.parse(readFileSync('data/contracts/atoumweb-contract-library-v1.json','utf8'));
const manifest: ContractLibraryManifest = JSON.parse(readFileSync('data/contracts/atoumweb-contract-library-v1-manifest.json','utf8'));
let db: NodeSqliteAdapter, importer: ContractLibraryImportService, terms: ContractTermsService;
const allState = () => db.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").map(t => ({table:t.name,rows:db.all(`SELECT * FROM "${t.name}" ORDER BY rowid`)}));
const apply = () => importer.apply(source,manifest,importer.simulate(source,manifest).planSha256);
const seal = (changed: ContractLibrarySource) => ({...manifest,extractionSha256:contractLibraryExtractionHash(changed)});
beforeEach(() => {
  db = new NodeSqliteAdapter(':memory:'); db.exec('PRAGMA foreign_keys=ON;'); applyPendingMigrations(db);
  db.run("INSERT INTO catalog_items (id,item_type,name,status,visible_public,created_at,updated_at) VALUES (?,'service','Recette historique','active',0,?,?)",['9ad1710a-2b92-4e36-a899-005a00248cb9','2026-09-14','2026-09-14']);
  db.run("INSERT INTO catalog_versions (id,item_id,version_number,status,inclusions_json,exclusions_json,prerequisites_json,price_mode,price_cents,created_at) VALUES (?,?,1,'draft','[]','[]','[]','fixed',69900,?)",['5b02381c-c76a-412d-a790-5e6de8540250','9ad1710a-2b92-4e36-a899-005a00248cb9','2026-09-14']);
  const c = new CatalogImportService(db), s = JSON.parse(readFileSync('data/catalogue/atoumweb-catalogue-v1.json','utf8')), m = JSON.parse(readFileSync('data/catalogue/atoumweb-reprise-v1.json','utf8'));
  c.apply(s,m,{expectedPlanSha256:c.simulate(s,m).planSha256});
  importer = new ContractLibraryImportService(db); terms = new ContractTermsService(db);
});
afterEach(() => {vi.restoreAllMocks();db.close();});

describe('Lot 4 — bibliothèque contractuelle V1 uniquement en brouillon', () => {
  it('fige 118 codes/textes exacts et 409 liens explicites, sans alias actif', () => {
    expect(source.records).toHaveLength(118); expect(new Set(source.records.map(r => r.code)).size).toBe(118);
    expect(source.links).toHaveLength(409); expect(new Set(source.links.map(l => `${l.awCode}:${l.clauseCode}`)).size).toBe(409);
    expect(contractLibraryExtractionHash(source)).toBe(manifest.extractionSha256);
    expect(source.records.every(r => !manifest.excludedCodes.includes(r.code))).toBe(true);
    expect(source.records.find(r => r.code === 'MARIAGE-RSVP')!.body).toContain('sans attribuer automatiquement au couple');
    expect(source.records.find(r => r.code === 'WEB-PAIEMENT-TIERS')!.body).toContain('ne détient, n’encaisse, ne conserve ni ne reverse');
  });
  it('simule sans écriture avec les répartitions et niveaux de revue exacts', () => {
    const before = allState(), plan = importer.simulate(source,manifest);
    expect(allState()).toEqual(before); expect(plan.anomalies).toEqual([]);
    expect(plan.counts).toEqual({clausesToCreate:118,versionsToCreate:118,linksToCreate:409,clausesKept:0,linksKept:0,conflicts:0});
    expect(plan.scopes).toEqual({base:19,catalog:99}); expect(plan.audiences).toEqual({all:105,professional:3,consumer:10});
    expect(plan.editorial).toEqual({modifier:42,'inchangé':52,'compléter hors clause':22,'qualification préalable':2}); expect(plan.reviews).toEqual(manifest.expected.review);
    expect(plan.rows.every(r => r.state === 'draft' && r.version === 1)).toBe(true);
  });
  it('utilise la création existante, préserve chaque texte/revue et ne publie rien indirectement', () => {
    const publish = vi.spyOn(ContractTermsService.prototype,'publishVersion'), create = vi.spyOn(ContractTermsService.prototype,'createTemplate'); apply();
    expect(create).toHaveBeenCalledTimes(118); expect(publish).not.toHaveBeenCalled();
    const templates = terms.listTemplates(); expect(templates).toHaveLength(118);
    for (const r of source.records) {
      const t = templates.find(t => t.code === r.code)!;
      expect(t).toMatchObject({title:r.title,scope:r.scope,audience:r.audience,sortOrder:r.sortOrder,currentVersionId:null});
      expect(t.versions).toHaveLength(1); expect(t.versions[0]).toMatchObject({body:r.body,status:'draft',versionNumber:1,publishedAt:null,review:r.review});
    }
    expect(db.get("SELECT COUNT(*) n FROM contract_clause_versions WHERE status='published' OR published_at IS NOT NULL")).toEqual({n:0});
    expect(db.all("SELECT * FROM activity_log WHERE action='contract_clause_version_published'")).toEqual([]);
    expect(db.all('PRAGMA foreign_key_check')).toEqual([]); expect(db.get('PRAGMA integrity_check')).toEqual({integrity_check:'ok'});
  });
  it('résout uniquement AW → code clause, garde 409 liens exacts et zéro lien BASE', () => {
    apply(); const links = db.all<{awCode:string;clauseCode:string;sortOrder:number}>('SELECT i.canonical_code awCode,t.code clauseCode,l.sort_order sortOrder FROM catalog_contract_clause_links l JOIN catalog_items i ON i.id=l.catalog_item_id JOIN contract_clause_templates t ON t.id=l.clause_id');
    const sort = (a: {awCode:string;clauseCode:string}, b: {awCode:string;clauseCode:string}) => `${a.awCode}:${a.clauseCode}`.localeCompare(`${b.awCode}:${b.clauseCode}`);
    expect(links.sort(sort)).toEqual(source.links.map(({awCode,clauseCode,sortOrder}) => ({awCode,clauseCode,sortOrder})).sort(sort));
    expect(db.get("SELECT COUNT(*) n FROM catalog_contract_clause_links l JOIN contract_clause_templates t ON t.id=l.clause_id WHERE t.scope='base'")).toEqual({n:0});
    expect(source.records.some(r => r.review.dependencies?.includes('BASE-'))).toBe(true);
  });
  it('conserve LANDING-GESTION dormante et le contrôle applicatif hors bibliothèque', () => {
    apply(); const dormant = terms.listTemplates().filter(t => t.scope === 'catalog' && !t.catalogItemIds.length);
    expect(dormant.map(t => t.code)).toEqual(['LANDING-GESTION']);
    expect(terms.listTemplates().some(t => t.code === 'CONS-RETRACTATION-EN-LIGNE')).toBe(false);
  });
  it('rejoue sans doublon ni modification de version, activité ou journal', () => {
    apply(); const before = allState(), replay = apply();
    expect(replay.counts).toEqual({clausesToCreate:0,versionsToCreate:0,linksToCreate:0,clausesKept:118,linksKept:409,conflicts:0});
    expect(allState()).toEqual(before); expect(db.get('SELECT COUNT(*) n FROM contract_library_import_runs')).toEqual({n:1});
    expect(db.get('SELECT COUNT(*) n FROM contract_library_import_entries')).toEqual({n:118});
  });
  it('refuse une extraction ou une empreinte XLSX modifiée sans nouveau référentiel validé', () => {
    for (const change of [(s:ContractLibrarySource) => {s.records[0].body += ' Modifié.';},(s:ContractLibrarySource) => {s.source.sha256='0'.repeat(64);}]) {
      const changed = structuredClone(source); change(changed); const before = allState();
      const p = importer.simulate(changed,manifest); expect(p.diagnostics.sourceAnomalies.length).toBeGreaterThan(0);
      expect(() => importer.apply(changed,manifest,p.planSha256)).toThrow(/refusé/); expect(allState()).toEqual(before);
    }
  });
  it('refuse une référence AW absente avec une erreur explicite, sans import partiel', () => {
    const id = db.get<{id:string}>("SELECT id FROM catalog_items WHERE canonical_code='AW-APP-DEV'")!.id;
    db.run('DELETE FROM catalog_import_entries WHERE item_id=?',[id]); db.run('DELETE FROM catalog_versions WHERE item_id=?',[id]); db.run('DELETE FROM catalog_items WHERE id=?',[id]);
    const before = allState(), p = importer.simulate(source,manifest); expect(p.diagnostics.missingAWCodes).toEqual(['AW-APP-DEV']);
    expect(() => importer.apply(source,manifest,p.planSha256)).toThrow(/AW-APP-DEV/); expect(allState()).toEqual(before);
  });
  it('refuse un code clause inexistant dans les liens', () => {
    const changed = structuredClone(source); changed.links[0].clauseCode='CLAUSE-ABSENTE'; const m = seal(changed), before = allState(), p = importer.simulate(changed,m);
    expect(p.diagnostics.orphanLinks.some(s => s.includes('CLAUSE-ABSENTE'))).toBe(true);
    expect(() => importer.apply(changed,m,p.planSha256)).toThrow(/CLAUSE-ABSENTE/); expect(allState()).toEqual(before);
  });
  it('refuse doublons, texte vide, audience invalide et liens BASE même avec extraction resignée', () => {
    const mutations = [
      (s:ContractLibrarySource) => {s.links[1]={...s.links[0]};},
      (s:ContractLibrarySource) => {s.records[1].code=s.records[0].code;},
      (s:ContractLibrarySource) => {s.records[0].body='';},
      (s:ContractLibrarySource) => {s.records.find(r => r.code==='PRO-RETARD')!.audience='all';},
      (s:ContractLibrarySource) => {s.links[0].clauseCode='BASE-OBJET';},
    ];
    for (const mutate of mutations) {
      const changed = structuredClone(source); mutate(changed); const m = seal(changed), before = allState(), p = importer.simulate(changed,m);
      expect(p.anomalies.length).toBeGreaterThan(0); expect(() => importer.apply(changed,m,p.planSha256)).toThrow(/refusé/); expect(allState()).toEqual(before);
    }
  });
  it('ne rapproche pas une clause déjà créée sans provenance même si son code est identique', () => {
    const r = source.records[0]; terms.createTemplate({code:r.code,title:r.title,scope:r.scope,audience:r.audience},{body:r.body});
    const before = allState(), p = importer.simulate(source,manifest); expect(p.counts.conflicts).toBe(1);
    expect(() => importer.apply(source,manifest,p.planSha256)).toThrow(/aucun rapprochement/); expect(allState()).toEqual(before);
  });
  it('refuse le rejeu après une modification humaine de texte ou de rattachement', () => {
    apply(); const first = db.get<{id:string}>('SELECT id FROM contract_clause_versions ORDER BY rowid LIMIT 1')!;
    db.run('UPDATE contract_clause_versions SET body=body||? WHERE id=?',[' Modification humaine.',first.id]);
    const before = allState(), p = importer.simulate(source,manifest); expect(p.counts.conflicts).toBe(1);
    expect(() => importer.apply(source,manifest,p.planSha256)).toThrow(/modifié/); expect(allState()).toEqual(before);
  });
  it('ne recrée pas silencieusement un lien supprimé après import', () => {
    apply(); const link = db.get<{catalog_item_id:string;clause_id:string}>('SELECT catalog_item_id,clause_id FROM catalog_contract_clause_links LIMIT 1')!;
    db.run('DELETE FROM catalog_contract_clause_links WHERE catalog_item_id=? AND clause_id=?',[link.catalog_item_id,link.clause_id]);
    const before = allState(), p = importer.simulate(source,manifest);
    expect(p.counts.conflicts).toBe(1); expect(() => importer.apply(source,manifest,p.planSha256)).toThrow(/modifié/); expect(allState()).toEqual(before);
  });
  it('ne transmet pas une revue juridique précédente à un texte humainement modifié', () => {
    apply(); const t=terms.listTemplates()[0], old=t.versions[0];
    const draft=terms.createVersion(t.id,{body:old.body+' Modification à revoir.'});
    expect(draft.status).toBe('draft'); expect(draft.review).toBeNull();
    expect(terms.getTemplate(t.id).versions.find(v=>v.id===old.id)!.review).toEqual(old.review);
    expect(terms.getTemplate(t.id).currentVersionId).toBeNull();
  });
  it('refuse un plan périmé avant toute création contractuelle', () => {
    const p = importer.simulate(source,manifest); db.run("UPDATE catalog_items SET name=name||' Renommé' WHERE canonical_code='AW-WEB-VITRINE'");
    const before = allState(); expect(() => importer.apply(source,manifest,p.planSha256)).toThrow(/périmé/); expect(allState()).toEqual(before);
  });
  it('rollback complet après échec au dernier enregistrement, y compris les liens et activités', () => {
    const last = source.records.at(-1)!.code, before = allState(); let writesBeforeFailure = 0;
    const failing: DatabaseAdapter = {exec:db.exec.bind(db),get:db.get.bind(db),all:db.all.bind(db),backupTo:db.backupTo.bind(db),close:db.close.bind(db),run(sql,params) {
      if (sql.startsWith('INSERT INTO contract_library_import_entries') && params?.[1]===last) {writesBeforeFailure=Number(db.get('SELECT COUNT(*) n FROM contract_clause_versions')!.n);throw Error('Erreur tardive volontaire');}
      return db.run(sql,params);
    }};
    const service = new ContractLibraryImportService(failing); expect(() => service.apply(source,manifest,service.simulate(source,manifest).planSha256)).toThrow(/Erreur tardive/);
    expect(writesBeforeFailure).toBe(118); expect(allState()).toEqual(before);
  });
  it('préserve les anciens devis et projets et toutes les tables catalogue déjà importées', () => {
    const crm = new CrmService(db), quotes = new QuoteService(db,crm,terms);
    const prospect = crm.createProspect({organizationId:crm.createOrganization({name:'Historique'}).id,primaryNeed:'Web'});
    for (let i=1;i<=3;i++) {const q=quotes.create({prospectId:prospect.id,subject:'Devis historique'});quotes.addCustomLine(q.id,{label:'Prestation historique',proposedUnitPriceCents:10000});db.run("UPDATE quotes SET status=?,contract_text_snapshot=NULL,contract_snapshot_json=NULL,contract_compiled_at=NULL WHERE id=?",[i===2?'sent':'accepted',q.id]);}
    db.run("INSERT INTO projects (id,project_number,name,project_type,commercial_mode,created_at,updated_at) VALUES ('historical','PRO-2026-001','Projet historique','internal','internal','2026-09-14','2026-09-14')");
    const allowed = new Set(['activity_log','contract_clause_templates','contract_clause_versions','catalog_contract_clause_links','contract_library_import_runs','contract_library_import_entries']);
    const before = allState().filter(t => !allowed.has(t.table)); apply(); expect(allState().filter(t => !allowed.has(t.table))).toEqual(before);
  });
  it('le Builder ne consomme aucun brouillon, même si un pointeur courant est corrompu', () => {
    const crm = new CrmService(db), quotes = new QuoteService(db,crm,terms), p = crm.createProspect({organizationId:crm.createOrganization({name:'Professionnel'}).id,primaryNeed:'Web'});
    const q = quotes.create({prospectId:p.id,subject:'Test brouillons'}); quotes.addCatalogLine(q.id,'atoumweb-vitrine-v1');
    const before = terms.syncQuote(q.id).compiledText; apply();
    expect(terms.syncQuote(q.id).compiledText).toBe(before); expect(terms.getQuoteBuild(q.id).clauses.some(c => c.sourceClauseId)).toBe(false);
    db.exec('UPDATE contract_clause_templates SET current_version_id=(SELECT id FROM contract_clause_versions WHERE clause_id=contract_clause_templates.id)');
    expect(terms.syncQuote(q.id).compiledText).toBe(before); expect(terms.getQuoteBuild(q.id).clauses.some(c => c.sourceClauseId)).toBe(false);
  });
  it('migration 55 additive : aucune réécriture des anciennes versions ni données', () => {
    const d = new NodeSqliteAdapter(':memory:'); ensureMigrationTable(d);
    try {
      for (const m of MIGRATIONS.filter(m => m.id<55)) {d.exec(m.sql);d.run('INSERT INTO schema_migrations (id,name,applied_at) VALUES (?,?,?)',[m.id,m.name,'2026-09-14']);}
      d.run("INSERT INTO contract_clause_templates (id,code,title,scope,status,sort_order,current_version_id,created_at,updated_at) VALUES ('old','OLD-CODE','Ancienne','base','active',0,'v-old','2026-09-14','2026-09-14')");
      d.run("INSERT INTO contract_clause_versions (id,clause_id,version_number,body,status,published_at,created_at) VALUES ('v-old','old',1,'Texte exact ancien','published','2026-09-14','2026-09-14')");
      const before = d.get('SELECT * FROM contract_clause_versions WHERE id=\'v-old\'')!;
      expect(applyPendingMigrations(d).map(m => m.id)).toEqual([55,56,57,58,59,60,61,62]);
      const after = d.get('SELECT * FROM contract_clause_versions WHERE id=\'v-old\'')!; const {review_metadata_json,...historical} = after;
      expect(historical).toEqual(before); expect(review_metadata_json).toBeNull();expect(applyPendingMigrations(d)).toEqual([]);
    } finally {d.close();}
  });
});
