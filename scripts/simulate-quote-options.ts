// Never opens DatabaseService/Manager. Original read-only; writes solely to a temporary copy.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { NodeSqliteAdapter } from '../src/main/database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../src/main/database/migrations';
import { quoteOptionsFixture } from '../src/main/testSupport/quoteOptionsFixture';
import { ProjectService } from '../src/main/projects/ProjectService';
import { createWorkspacePaths } from '../src/main/workspace';
import type { QuoteDetail, QuoteLine } from '../src/shared/commercial';

const sha = (file: string) => createHash('sha256').update(readFileSync(file)).digest('hex');
const ident = (value: string) => '"' + value.replaceAll('"', '""') + '"';
async function main() {
  const args = process.argv.slice(2), options: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (!['--database', '--workbook', '--output'].includes(args[i]) || !args[i + 1]) throw Error('Chemins --database --workbook --output requis.');
    options[args[i].slice(2)] = path.resolve(args[++i]);
  }
  assert.ok(options.database && options.workbook && options.output);
  const temporary = process.env.ATOUMWEB_QUOTE_OPTIONS_TEMP;
  assert.ok(temporary, 'Utiliser le lanceur .cjs isolé.');
  const pin = '877192a41131737424fb03e808885c22faa3e876b798f54b7929a672e8459e71';
  const pinWorkbook = '6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8';
  assert.equal(sha(options.database), pin, 'Base différente du checkpoint Lot 5');
  assert.equal(sha(options.workbook), pinWorkbook, 'XLSX différent du référentiel validé');
  for (const suffix of ['-wal', '-shm']) {
    if (existsSync(options.database + suffix) && readFileSync(options.database + suffix).length) throw Error('WAL/SHM actif : simulation refusée.');
  }
  // Physical copy with empty WAL and pinned content: do not open SQLite on the source,
  // even read-only (SQLite WAL mode can create sidecars on a read-only connection).
  writeFileSync(path.join(temporary, 'lot6.sqlite'), readFileSync(options.database));
  assert.equal(sha(path.join(temporary, 'lot6.sqlite')), pin);
  assert.equal(sha(options.database), pin);
  const db = new NodeSqliteAdapter(path.join(temporary, 'lot6.sqlite'));
  db.exec('PRAGMA foreign_keys=ON');
  try {
    assert.equal(db.get<{n:number}>('SELECT MAX(id) n FROM schema_migrations')?.n, 56);
    const tables = db.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").map(row => row.name);
    const old = tables.map(table => ({ table, rows: db.all<Record<string,unknown>>(`SELECT * FROM ${ident(table)}`).map(row => JSON.stringify(row)).sort() }));
    const migrations = applyPendingMigrations(db).map(migration => migration.id);
    assert.deepEqual(migrations, [57]);
    for (const t of old) {
      const rows = db.all(`SELECT * FROM ${ident(t.table)}${t.table === 'schema_migrations' ? ' WHERE id<=56' : ''}`).map(row => JSON.stringify(row)).sort();
      assert.deepEqual(rows, t.rows, `Migration a modifié ${t.table}`);
    }
    assert.deepEqual(db.all('SELECT * FROM quote_option_purchases'), []);
    assert.deepEqual(applyPendingMigrations(db), []);
    const f = quoteOptionsFixture(db);
    // Synthetic blueprint links on the copy only, never an operational Project/Site/Page.
    const projects = new ProjectService(db, createWorkspacePaths(temporary));
    const templates = ['Base fixture Lot6', 'Page fixture Lot6', 'SEO fixture Lot6'].map(name => {
      const t = projects.createTemplate({ name, projectType: 'website' });
      projects.addTemplateNode(t.versions[0].id, { type: 'task', name });
      return projects.publishTemplateVersion(t.versions[0].id);
    });
    [f.offer.currentVersion!.id, f.components[1].serviceVersionId, f.components[2].serviceVersionId].forEach((id, i) => db.run(
      'INSERT INTO catalog_project_blueprints(id,catalog_version_id,template_version_id,role,sort_order,created_at) VALUES(?,?,?,?,?,?)',
      ['lot6-fixture-link-' + i, id, templates[i].id, i === 0 ? 'base' : 'addon', i, new Date().toISOString()],
    ));
    const first = f.createQuote('SIMULATION LOT 6 — disponible uniquement');
    const second = f.createQuote('SIMULATION LOT 6 — une option achetée');
    f.quotes.selectOfferOption(second.lines[0].id, f.components[1].id);
    const third = f.createQuote('SIMULATION LOT 6 — plusieurs options et quantités');
    f.quotes.selectOfferOption(third.lines[0].id, f.components[1].id, { quantityMilli: 3000, proposedUnitPriceCents: 1800, adjustmentMode: 'percent', adjustmentValue: 1000 });
    f.quotes.selectOfferOption(third.lines[0].id, f.components[2].id, { quantityMilli: 2000 });
    const reports = [first, second, third].map(initial => {
      const quote = f.quotes.get(initial.id);
      const clauses = f.terms.getQuoteBuild(quote.id).clauses.filter(clause => clause.enabled && !clause.isOrphaned);
      const sold = (line: QuoteLine) => ({
        ligne: line.label, lineId: line.id, origine: line.optionPurchase ? 'option achetée explicitement' : 'offre vendue',
        offre: f.offer.canonicalCode, offreVersion: f.offer.currentVersion!.id,
        composant: line.optionPurchase?.sourceComponentId ?? null, serviceAW: line.snapshot?.canonicalCode,
        versionVendue: line.catalogVersionId, quantite: Number(line.quantityMilli) / 1000,
        achetee: line.optionPurchase ? 'oui' : 'sans objet — offre de base',
        prixCatalogue: line.catalogUnitPriceCents, prixPropose: line.proposedUnitPriceCents,
        remise: { mode: line.adjustmentMode, value: line.adjustmentValue },
        clauses: clauses.filter(clause => clause.sourceCatalogItemIds.includes(line.catalogItemId!)
          || (!line.optionPurchase && clause.sourceCatalogItemIds.includes(f.services[0].id))).map(clause => clause.title),
        prerequis: line.snapshot?.prerequisites ?? [], provenance: line.optionPurchase ?? null,
        contributionFutureBlueprint: db.all('SELECT role,template_version_id FROM catalog_project_blueprints WHERE catalog_version_id=?', [line.catalogVersionId!]),
      });
      const available = f.components.filter(component => component.isOptional && !quote.lines.some(line => line.optionPurchase?.sourceComponentId === component.id))
        .map(component => ({ ligne: '— aucune ligne persistée', lineId: null, origine: 'disponible uniquement',
          offre: f.offer.canonicalCode, composant: component.id, serviceAW: f.services.find(s => s.id === component.serviceItemId)!.canonicalCode,
          quantite: 0, achetee: 'non', prixAjoute: 0, clauses: [], prerequis: [], contributionFutureBlueprint: [], provenance: null }));
      return { quoteId: quote.id, numero: quote.number, subject: quote.subject, totalCents: quote.contractValueCents,
        lignesPersistantes: quote.lines.length, clausesActives: clauses.map(clause => clause.title), rows: [...quote.lines.map(sold), ...available] };
    });
    assert.deepEqual(reports.map(report => report.lignesPersistantes), [1, 2, 3]);
    assert.deepEqual(reports.map(report => report.totalCents), [10000, 12000, 20860]);
    assert.deepEqual(reports.map(report => report.clausesActives.length), [1, 3, 3]);
    const original = f.quotes.get(third.id);
    assert.deepEqual(f.quotes.selectOfferOption(third.lines[0].id, f.components[1].id), original);
    const copy = f.quotes.duplicate(third.id);
    f.quotes.deselectOfferOption(copy.lines[0].id, f.components[1].id);
    assert.equal(f.quotes.get(copy.id).lines.length, 2);
    assert.deepEqual(f.quotes.get(third.id), original);
    // Every historical business row remains byte-equivalent as JSON. Derived search/counters may change on copy only.
    const historicalTables = ['quotes', 'quote_lines', 'quote_contract_clauses', 'catalog_items', 'catalog_versions', 'offer_components',
      'contract_clause_templates', 'contract_clause_versions', 'catalog_contract_clause_links', 'catalog_project_blueprints',
      'projects', 'project_nodes', 'project_sites', 'project_site_pages', 'client_documents', 'quote_document_links'];
    for (const name of historicalTables) {
      const historical = old.find(t => t.table === name)!;
      const now = new Set(db.all(`SELECT * FROM ${ident(name)}`).map(row => JSON.stringify(row)));
      for (const row of historical.rows) assert.ok(now.has(row), `Historique modifié : ${name}`);
    }
    const oldQuotes = db.all("SELECT quote_number,status,contract_parameters_json,contract_snapshot_json FROM quotes WHERE quote_number IN ('DEV-2026-001','DEV-2026-002','DEV-2026-003') ORDER BY quote_number");
    const realV1 = {
      aw: db.get<{n:number}>("SELECT COUNT(*) n FROM catalog_items WHERE canonical_code LIKE 'AW-%' AND canonical_code NOT LIKE 'AW-TEST-L6-%'")!.n,
      catalogueDraft: db.get<{n:number}>("SELECT COUNT(*) n FROM catalog_versions WHERE status='draft' AND provenance_json IS NOT NULL")!.n,
      clauseDraft: db.get<{n:number}>("SELECT COUNT(*) n FROM contract_clause_versions v JOIN contract_clause_templates t ON t.id=v.clause_id WHERE v.status='draft' AND t.code NOT LIKE 'TEST-L6-%'")!.n,
      links: db.get<{n:number}>("SELECT COUNT(*) n FROM catalog_contract_clause_links l JOIN contract_clause_templates t ON t.id=l.clause_id WHERE t.code NOT LIKE 'TEST-L6-%'")!.n,
    };
    assert.equal(realV1.catalogueDraft, 112); assert.equal(realV1.aw, 112); assert.equal(realV1.clauseDraft, 118); assert.equal(realV1.links, 409);
    assert.equal(db.get<{n:number}>("SELECT COUNT(*) n FROM contract_clause_versions v JOIN contract_clause_templates t ON t.id=v.clause_id WHERE v.status='published' AND t.code NOT LIKE 'TEST-L6-%'")!.n, 0);
    assert.equal(db.get<{integrity_check:string}>('PRAGMA integrity_check')?.integrity_check, 'ok');
    assert.deepEqual(db.all('PRAGMA foreign_key_check'), []);
    assert.equal(sha(options.database), pin); assert.equal(sha(options.workbook), pinWorkbook);
    const report = { generatedAt: new Date().toISOString(), mode: 'simulation sur copie temporaire uniquement', migrations,
      before: { database: pin, workbook: pinWorkbook }, after: { database: sha(options.database), workbook: sha(options.workbook) },
      migrationHistoricalTablesUnchanged: old.length, historicalBusinessTablesUnchanged: historicalTables, oldQuotes, realV1,
      syntheticPublicationsOnCopyOnly: { catalogue: 4, clauses: 3, blueprints: 3 }, realWrites: 0,
      reports, exactDiff: { firstToSecond: { addedPersistedLines: 1, addedCents: 2000, addedClauses: ['Fixture PAGE', 'Fixture SHARED'], newPurchaseOrigins: 1, newOperationalObjects: 0 },
        firstToThird: { addedPersistedLines: 2, addedCents: 10860, addedClauses: ['Fixture PAGE', 'Fixture SHARED'], newPurchaseOrigins: 2, quantities: [3, 2], newOperationalObjects: 0 } },
      idempotence: true, duplicatePreservesOriginal: true, integrity: 'ok', foreignKeys: [] };
    mkdirSync(options.output, { recursive: true });
    writeFileSync(path.join(options.output, 'simulation-lot6.json'), JSON.stringify(report, null, 2) + '\n');
    const table = (quote: typeof reports[number]) => `## ${quote.subject}\n\n${quote.numero} · ${quote.lignesPersistantes} lignes · ${quote.totalCents / 100} €\n\n` +
      '| Ligne | Origine | Offre | Composant | Service AW | Quantité | Achetée | Clauses | Contribution future |\n|---|---|---|---|---|---:|---|---|---|\n' +
      quote.rows.map(row => `| ${row.ligne} | ${row.origine} | ${row.offre} | ${row.composant ?? '—'} | ${row.serviceAW} | ${row.quantite} | ${row.achetee} | ${row.clauses.join(', ') || 'aucune'} | ${JSON.stringify(row.contributionFutureBlueprint)} |`).join('\n');
    writeFileSync(path.join(options.output, 'simulation-lot6.md'), `# Lot 6 — simulation uniquement\n\n${report.generatedAt}\n\nSource réelle lue comme fichier uniquement ; aucune connexion SQLite sur la source. Migration 57 seulement sur copie. Toutes les publications citées sont synthétiques et limitées à la copie supprimée en fin de simulation. Aucun Projet/Site/Page/objet opérationnel créé. Contributions présentées comme futures, sans multiplier les objets selon les quantités.\n\n${reports.map(table).join('\n\n')}\n\n## Diff exact disponible → acheté\n\n${JSON.stringify(report.exactDiff, null, 2)}\n\n## Contrôles\n\nRejeu : zéro mutation. Duplication puis retrait dans la copie : original strictement inchangé. Migration : ${old.length} tables antérieures inchangées. Historique métier : ${historicalTables.length} tables contrôlées après scénarios. SQLite : integrity_check=ok, FK vide.\n\n112 références AW, 112 versions catalogue V1 BROUILLON, 118 clauses BROUILLON, 409 liens historiques conservés. DEV-2026-001/002/003 inchangés. Les compteurs et index de recherche dérivés changent seulement sur la copie avec les fixtures.\n\nEmpreintes réelles identiques avant/après :\n\n- Base : ${pin}\n- XLSX : ${pinWorkbook}\n\nArrêt avant application réelle, aucune publication réelle.\n`);
    console.log(JSON.stringify({ output: options.output, realV1, scenarios: reports.map(r => ({ lines: r.lignesPersistantes, totalCents: r.totalCents })), integrity: 'ok', sourceUnchanged: true }, null, 2));
  } finally { db.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
