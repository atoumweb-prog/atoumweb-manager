'use strict';
// Exporte, en lecture seule, les données du référentiel interne depuis une base de préproduction :
// offres du pack (prix, temps, compris, non compris, aide à la vente), clauses publiées, rattachements offre → clauses.
//   node scripts/referentiel/export-data.cjs --db <fichier.sqlite> --out <dataset.json>
// La base est COPIÉE (avec son journal) avant lecture : aucune écriture, aucun verrou.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), {spawnSync} = require('node:child_process');
if (!process.versions.electron) {
  const r = spawnSync(require('electron'), [__filename, ...process.argv.slice(2)], {encoding: 'utf8', windowsHide: true, env: {...process.env, ELECTRON_RUN_AS_NODE: '1'}, maxBuffer: 64 * 1024 * 1024});
  process.stdout.write(r.stdout || ''); process.stderr.write(r.stderr || ''); process.exit(r.status ?? 1);
}
const arg = k => { const i = process.argv.indexOf(k); return i < 0 ? null : process.argv[i + 1]; };
const src = arg('--db'), out = arg('--out');
if (!src || !out) { console.error('Usage : --db <sqlite> --out <json>'); process.exit(2); }
const repo = path.resolve(__dirname, '..', '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'atoumweb-ref-'));
const dbFile = path.join(tmp, 'copie.sqlite'); fs.copyFileSync(src, dbFile);
for (const ext of ['-wal', '-shm']) if (fs.existsSync(src + ext)) fs.copyFileSync(src + ext, dbFile + ext);
const bundle = path.join(tmp, 'svc.cjs');
require(path.join(repo, 'node_modules', 'esbuild')).buildSync({stdin: {contents: ['src/main/database/NodeSqliteAdapter', 'src/main/commercial/ApprovedPackSource'].map(s => `export * from '${repo.replace(/\\/g, '/')}/${s}';`).join('\n'), resolveDir: repo, loader: 'ts'},
  bundle: true, platform: 'node', format: 'cjs', outfile: bundle, external: ['electron'], logLevel: 'silent', banner: {js: `module.paths.unshift(${JSON.stringify(path.join(repo, 'node_modules'))});`}});
const S = require(bundle);
const db = new S.NodeSqliteAdapter(dbFile);
const json = (s, d) => { try { return s ? JSON.parse(s) : d; } catch { return d; } };
const offers = db.all(`SELECT i.id item_id, json_extract(v.provenance_json,'$.recordKey') code, i.name, v.price_mode, v.price_cents, v.periodicity, v.unit,
    v.estimated_minutes, v.inclusions_json, v.exclusions_json, v.prerequisites_json, v.description, v.commercial_parameters_json cp, v.internal_advice
  FROM catalog_versions v JOIN catalog_items i ON i.id=v.item_id
  WHERE v.status='published' AND json_extract(v.provenance_json,'$.sha256')=? ORDER BY code`, [S.APPROVED_PACK.catalogue.sha256_word]).map(o => ({
  code: o.code, name: o.name, priceMode: o.price_mode, priceCents: o.price_cents, periodicity: o.periodicity, unit: o.unit, minutes: o.estimated_minutes,
  inclusions: json(o.inclusions_json, []), exclusions: json(o.exclusions_json, []), prerequisites: json(o.prerequisites_json, []), description: o.description,
  aide: json(o.cp, {}), conseil: o.internal_advice, itemId: o.item_id,
  clauses: db.all('SELECT t.code, t.title FROM catalog_contract_clause_links l JOIN contract_clause_templates t ON t.id=l.clause_id WHERE l.catalog_item_id=? ORDER BY t.code', [o.item_id]),
}));
const clauses = db.all(`SELECT t.code, t.title, t.scope, t.audience, v.body FROM contract_clause_templates t JOIN contract_clause_versions v ON v.id=t.current_version_id WHERE v.status='published' ORDER BY t.code`);
db.close();
fs.writeFileSync(out, JSON.stringify({exporteLe: new Date().toISOString(), offres: offers, clauses}, null, 1));
console.log(JSON.stringify({offres: offers.length, clauses: clauses.length, sortie: out}));
