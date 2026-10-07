import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { backup, DatabaseSync } from 'node:sqlite';
import { NodeSqliteAdapter } from '../src/main/database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../src/main/database/migrations';
import { CatalogImportService, catalogImportHash, type CatalogImportSource, type CatalogImportManifest, type CatalogImportPlanRow } from '../src/main/commercial/CatalogImportService';

async function main() {
  const args = process.argv.slice(2), options: Record<string, string> = {};
  let rehearse = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--rehearse-temporary') { rehearse = true; continue; }
    if (!['--database', '--workbook', '--output'].includes(args[i]) || !args[i + 1] || args[i + 1].startsWith('--')) throw Error('Options : --database CHEMIN --workbook XLSX --output DOSSIER [--rehearse-temporary]. Aucune application réelle disponible.');
    options[args[i].slice(2)] = path.resolve(args[++i]);
  }
  if (!options.database || !options.workbook || !options.output) throw Error('Base source, classeur et dossier de rapport requis.');
  const temporary = process.env.ATOUMWEB_CATALOG_IMPORT_TEMP;
  if (!temporary) throw Error('Lancer exclusivement le script .cjs pour isoler la copie temporaire.');
  const sha = (file: string) => createHash('sha256').update(readFileSync(file)).digest('hex');
  const fingerprints = () => Object.fromEntries([options.database, options.database + '-wal', options.database + '-shm', options.workbook]
    .map(file => [file, existsSync(file) ? sha(file) : null]));
  const beforeFiles = fingerprints();
  const source: CatalogImportSource = JSON.parse(readFileSync('data/catalogue/atoumweb-catalogue-v1.json', 'utf8'));
  const manifest: CatalogImportManifest = JSON.parse(readFileSync('data/catalogue/atoumweb-reprise-v1.json', 'utf8'));
  if (sha(options.workbook) !== source.source.sha256) throw Error('Le classeur ne correspond pas à la source commerciale extraite.');
  const copyPath = path.join(temporary, 'rehearsal.sqlite');
  const original = new DatabaseSync(options.database, { readOnly: true });
  try { await backup(original, copyPath); } finally { original.close(); }
  const database = new NodeSqliteAdapter(copyPath);
  try {
    database.exec('PRAGMA foreign_keys=ON;');
    const tables = database.all<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
    const historical = tables.map(({ name }) => ({ name,
      columns: database.all<{ name: string }>(`PRAGMA table_info("${name}")`).map(r => r.name),
      rows: database.all(`SELECT * FROM "${name}" ORDER BY rowid`),
    }));
    const migrations = applyPendingMigrations(database).map(m => m.id);
    const migrationPreservation = historical.filter(t => t.name !== 'schema_migrations').every(t =>
      catalogImportHash(database.all(`SELECT ${t.columns.map(c => `"${c}"`).join(',')} FROM "${t.name}" ORDER BY rowid`)) === catalogImportHash(t.rows));
    if (!migrationPreservation) throw Error('Une migration a changé des données historiques dans la copie.');
    const importer = new CatalogImportService(database), plan = importer.simulate(source, manifest);
    const legacyDecisions = manifest.entries.filter(e => e.decision === 'distinct_v1_archive_legacy');
    const mappedCodes = new Set(manifest.entries.map(e => e.canonicalCode).filter(Boolean));
    const distinctCodes = [...new Set(legacyDecisions.flatMap(e => e.formerCandidates ?? []))].filter(code => !mappedCodes.has(code)).sort();
    let rehearsal: Record<string, unknown> | null = null;
    if (rehearse) {
      importer.apply(source, manifest, { expectedPlanSha256: plan.planSha256 });
      const preservation = historical.filter(t => !['catalog_items','schema_migrations','activity_log'].includes(t.name)).map(t => {
        const actual = database.all(`SELECT ${t.columns.map(c => `"${c}"`).join(',')} FROM "${t.name}" ORDER BY rowid`);
        // Catalogue links/versions may gain rows, but each old row must remain byte-equivalent.
        const additive = ['catalog_versions','offer_components','catalog_project_blueprints'].includes(t.name);
        const preserved = additive ? t.rows.every(old => actual.some(row => row.id === old.id && catalogImportHash(row) === catalogImportHash(old))) : catalogImportHash(actual) === catalogImportHash(t.rows);
        return { table: t.name, historicalRows: t.rows.length, preserved };
      });
      if (preservation.some(t => !t.preserved)) throw Error('Historique altéré dans la répétition temporaire.');
      const legacyPreservation = legacyDecisions.map(entry => {
        const old = historical.find(t => t.name === 'catalog_items')!.rows.find(row => row.id === entry.itemId)!;
        const after = database.get('SELECT * FROM catalog_items WHERE id=?', [entry.itemId])!;
        const metadataPreserved = Object.entries(old).filter(([key]) => !['status','archived_at','updated_at'].includes(key)).every(([key, value]) => after[key] === value);
        const versions = database.all('SELECT id FROM catalog_versions WHERE item_id=?', [entry.itemId]);
        const oldVersionIds = historical.find(t => t.name === 'catalog_versions')!.rows.filter(row => row.item_id === entry.itemId).map(row => row.id).sort();
        const versionIdsPreserved = catalogImportHash(versions.map(row => row.id).sort()) === catalogImportHash(oldVersionIds);
        return { itemId: entry.itemId, status: after.status, canonicalCode: after.canonical_code, metadataPreserved, versionIdsPreserved,
          excludedFromNewCommercialSelections: after.status === 'archived' };
      });
      const distinctCreation = distinctCodes.map(code => {
        const item = database.get<{ id: string }>('SELECT id FROM catalog_items WHERE canonical_code=?', [code]);
        const versions = item ? database.all('SELECT version_number,status FROM catalog_versions WHERE item_id=?', [item.id]) : [];
        return { code, createdDistinct: Boolean(item && !historical.find(t => t.name === 'catalog_items')!.rows.some(row => row.id === item.id)),
          oneDraftV1: versions.length === 1 && versions[0].version_number === 1 && versions[0].status === 'draft' };
      });
      if (legacyPreservation.some(row => !row.metadataPreserved || !row.versionIdsPreserved || row.canonicalCode !== null || !row.excludedFromNewCommercialSelections)
        || distinctCreation.some(row => !row.createdDistinct || !row.oneDraftV1)) throw Error('Décision AtoumWeb non respectée pour les anciennes ambiguïtés.');
      const replay = importer.simulate(source, manifest);
      const snapshot = () => catalogImportHash(database.all<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
        .map(t => ({ table: t.name, rows: database.all(`SELECT * FROM "${t.name}" ORDER BY rowid`) })));
      const beforeReplay = snapshot();
      importer.apply(source, manifest, { expectedPlanSha256: replay.planSha256 });
      const replayUnchanged = beforeReplay === snapshot();
      if (!replayUnchanged) throw Error('Le rejeu a changé la copie.');
      rehearsal = { destination: 'Copie temporaire supprimée à la fin ; jamais Validation-MSI',
        appliedCertainRows: plan.counts, replayCounts: replay.counts, replayUnchanged, preservation, legacyPreservation, distinctCreation,
        canonicalCodesCovered: database.get('SELECT COUNT(*) n FROM catalog_items WHERE canonical_code IS NOT NULL'),
        foreignKeyCheck: database.all('PRAGMA foreign_key_check'), integrityCheck: database.get('PRAGMA integrity_check'),
        catalogueItems: database.get('SELECT COUNT(*) n FROM catalog_items'), catalogueVersions: database.get('SELECT COUNT(*) n FROM catalog_versions'),
        publishedVersions: database.get("SELECT COUNT(*) n FROM catalog_versions WHERE status='published'"),
        importLedger: database.get('SELECT COUNT(*) n FROM catalog_import_entries') };
      if (replay.anomalies.length) throw Error(`Anomalies au rejeu : ${replay.anomalies.join('; ')}`);
      if (database.all('PRAGMA foreign_key_check').length || database.get('PRAGMA integrity_check')?.integrity_check !== 'ok') throw Error('Intégrité SQLite non confirmée.');
    }
    const afterFiles = fingerprints(), realFilesUnchanged = catalogImportHash(beforeFiles) === catalogImportHash(afterFiles);
    if (!realFilesUnchanged) throw Error('Empreinte des fichiers sources différente après lecture.');
    const proof = { checkedAt: new Date().toISOString(), mode: 'Simulation sur sauvegarde temporaire, source ouverte en lecture seule',
      source: source.source, beforeFiles, afterFiles, realFilesUnchanged, migrationPreservation, distinctCodes,
      migrationsOnTemporaryCopyOnly: migrations, plan, rehearsal };
    mkdirSync(options.output, { recursive: true });
    const target = (file: string) => {
      const resolved = path.join(options.output, file);
      if ([options.database, options.workbook].includes(resolved)) throw Error('Écrasement de source interdit');
      return resolved;
    };
    writeFileSync(target('simulation-catalogue-v1.json'), JSON.stringify(proof, null, 2) + '\n');
    const price = (mode: string | null, cents: number | null, basis?: string | null) => basis === 'actual_cost' ? 'Coût tiers réel' : mode === 'quote_only' ? 'Sur devis' : cents == null ? '—' : `${mode === 'starting_from' ? 'À partir de ' : ''}${(cents / 100).toFixed(2)} € (${mode})`;
    const fields = (r: CatalogImportPlanRow) => [r.canonicalCode ?? 'Historique sans AW', r.action, r.itemId ?? 'Nouveau UUID', r.oldVersionId ?? '—', r.newVersionNumber ?? '—', price(r.oldPriceMode, r.oldPriceCents), price(r.newPriceMode, r.newPriceCents, r.newPriceBasis), r.anomaly ?? '—'];
    const heading = ['AW code','Action prévue','Ancien ID','Ancienne version','Nouvelle version','Ancien tarif','Nouveau tarif','Anomalie'];
    writeFileSync(target('simulation-catalogue-v1.csv'), '\ufeff' + [heading, ...plan.rows.map(fields)].map(row => row.map(value => `"${String(value).replaceAll('"','""')}"`).join(';')).join('\r\n') + '\r\n');
    const md = (row: unknown[]) => '| ' + row.map(v => String(v).replaceAll('|','\\|').replaceAll('\n',' ')).join(' | ') + ' |';
    const lines = ['# Lot 3 — simulation de reprise du catalogue V1', '', `Date de contrôle : ${proof.checkedAt}.`, '',
      '**Aucune écriture sur Validation-MSI. Aucune publication de version ou de clause.**', '',
      `112 références cibles ; 45 anciens IDs examinés. ${plan.counts.create} créations certaines, ${plan.counts.update} reprises, ${plan.counts.keep} conservations, ${plan.counts.archive} archives réversibles.`,
      `${plan.rows.filter(row => row.canonicalCode && !row.pending && !row.anomaly).length}/112 codes AW couverts ; ${plan.counts.verify} ligne À VÉRIFIER ; ${plan.pendingMappings} arbitrage métier ; ${plan.blockedCanonicalCodes.length} code bloqué ; ${plan.anomalies.length} anomalie technique. Aucun rapprochement par nom.`, '',
      `Empreinte base réelle inchangée : ${beforeFiles[options.database]}.`, `Empreinte XLSX inchangée : ${source.source.sha256}.`,
      `Migrations appliquées uniquement à la copie : ${migrations.join(', ') || 'aucune'}.`,
      `Jeton de la simulation : ${plan.planSha256}. À recalculer avant toute application réelle.`, '',
      '## Décisions AtoumWeb validées : anciens objets conservés sans reprise directe', '',
      'Les huit anciens objets sont archivés réversiblement, sans code AW ni nouvelle version. Leurs noms, contenus, prix, compositions et relations historiques sont conservés. Aucune exception technique interne nécessaire : les références restent accessibles par leurs IDs après archivage. Les neuf génériques déjà prévus restent conservés pour leurs rôles internes/historiques.', '',
      '| Ancien ID | Action | Code AW attribué | Historique |', '| --- | --- | --- | --- |',
      ...legacyDecisions.map(e => md([e.itemId, 'Archive réversible', 'Aucun', 'Versions et relations préservées'])), '',
      '## Huit nouvelles références distinctes', '', '| Code AW | Intitulé V1 | Tarif | Unité |', '| --- | --- | --- | --- |',
      ...distinctCodes.map(code => { const record = source.records.find(r => r.canonicalCode === code)!; return md([code, record.name, price(record.version.priceMode, record.version.priceCents ?? null, record.version.priceBasis), record.version.unit ?? '—']); }), '',
      '## Tableau exhaustif', '', md(heading), md(heading.map(() => '---')), ...plan.rows.map(r => md(fields(r))), '',
      '## Preuve de répétition temporaire', '',
      rehearsal ? `Application intégrale sur copie : 91 créations, 21 reprises et 15 archives (7 déjà prévues + 8 anciennes ambiguïtés). 112/112 codes AW présents. Deuxième passage : zéro création, mise à jour, archive ou ligne verify ; 136 conservations et base temporaire strictement inchangée. Les huit anciennes entrées restent sans code AW ; leurs données hors statut/dates d'archivage, versions et relations sont préservées. Toutes les autres tables métier sont inchangées, dont les trois devis et projets. Intégrité SQLite OK et aucune violation de clé étrangère. Le détail figure dans le JSON. La copie est supprimée à la sortie.` : 'Non demandée.', '',
      '## Limites / arrêt avant écriture réelle', '',
      'Les 112 versions nouvelles/reprises restent BROUILLON. Pour les reprises, les anciennes versions publiées restent commerciales jusqu’à une publication explicite séparée. Aucun nouveau graphe de composition n’est déduit des descriptions Excel ; les compositions existantes et liens blueprint sont recopiés avec leurs IDs de versions historiques. Les blueprints composés, options achetées et clauses contractuelles sont hors périmètre.', '',
      'Les huit décisions métier sont closes. Aucun feu vert pour une écriture réelle n’a été reçu. Les migrations 53/54 et cet import complet ne sont exécutés que sur copie temporaire. Aucun commit/push/merge ni démarrage du Manager sur Validation-MSI.', ''];
    writeFileSync(target('simulation-catalogue-v1.md'), lines.join('\n'));
    console.log(JSON.stringify({ files: ['simulation-catalogue-v1.md','simulation-catalogue-v1.csv','simulation-catalogue-v1.json'].map(target),
      counts: plan.counts, pendingMappings: plan.pendingMappings, blockedCanonicalCodes: plan.blockedCanonicalCodes,
      anomalies: plan.anomalies, migrationPreservation, realFilesUnchanged, replayCounts: rehearsal?.replayCounts }, null, 2));
  } finally { database.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
