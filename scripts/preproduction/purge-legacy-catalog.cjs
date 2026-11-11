'use strict';
// Supprime les anciennes fiches du Catalogue qui ne font pas partie du pack approuvé V3.9.4 (décision de Carlos du 11/11/2026 : on repart d'une base propre).
// Refuse si un devis, un projet, un besoin CRM ou une vente en dépend (rien n'est alors supprimé).
//   Aperçu :      node scripts/preproduction/purge-legacy-catalog.cjs --dest <préproduction>
//   Application : node scripts/preproduction/purge-legacy-catalog.cjs --dest <préproduction> --apply
// Sauvegarde la base avant écriture ; refuse si le Manager de cette préproduction est ouvert.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), {spawnSync} = require('node:child_process');
if (!process.versions.electron) {
  const r = spawnSync(require('electron'), [__filename, ...process.argv.slice(2)], {encoding: 'utf8', windowsHide: true, env: {...process.env, ELECTRON_RUN_AS_NODE: '1'}, maxBuffer: 16 * 1024 * 1024});
  process.stdout.write(r.stdout || ''); process.stderr.write(r.stderr || ''); process.exit(r.status ?? 1);
}
const arg = k => { const i = process.argv.indexOf(k); return i < 0 ? null : process.argv[i + 1]; };
const dest = arg('--dest'), apply = process.argv.includes('--apply');
const fail = m => { console.error('REFUSÉ — ' + m); process.exit(1); };
if (!dest) fail('Usage : --dest <préproduction> [--apply]');
const target = path.resolve(dest), metaFile = path.join(target, 'PREPRODUCTION.json');
if (!fs.existsSync(metaFile) || JSON.parse(fs.readFileSync(metaFile, 'utf8')).mode !== 'PREPRODUCTION_TEST') fail('Ce dossier n’est pas une préproduction de test assemblée.');
const dbFile = path.join(target, 'Workspace', 'data', 'atoumweb-manager.sqlite');
if (/validation-msi/i.test(dbFile) || !fs.existsSync(dbFile)) fail('Base introuvable ou interdite.');
const running = spawnSync('powershell.exe', ['-NoProfile', '-Command',
  `Get-CimInstance Win32_Process -Filter "Name='electron.exe'" | Where-Object { $_.CommandLine -like '*${target.replace(/'/g, "''")}*' } | Measure-Object | Select-Object -ExpandProperty Count`], {encoding: 'utf8'}).stdout.trim();
if (running !== '0') fail('La préproduction est ouverte : ferme-la avant.');
const repo = path.resolve(__dirname, '..', '..');
const bundle = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'atoumweb-purge-')), 'svc.cjs');
require(path.join(repo, 'node_modules', 'esbuild')).buildSync({stdin: {contents: ['src/main/commercial/ApprovedPackSource', 'src/main/database/NodeSqliteAdapter'].map(s => `export * from '${repo.replace(/\\/g, '/')}/${s}';`).join('\n'), resolveDir: repo, loader: 'ts'},
  bundle: true, platform: 'node', format: 'cjs', outfile: bundle, external: ['electron'], logLevel: 'silent', banner: {js: `module.paths.unshift(${JSON.stringify(path.join(repo, 'node_modules'))});`}});
const S = require(bundle);
// Tables dont une ligne liée BLOQUE la suppression (travail réel du client)
const BLOCKING = ['quote_lines', 'project_services', 'crm_needs', 'quote_option_purchases', 'operational_sales', 'project_node_sources', 'operational_model_versions'];

(async () => {
  const db = new S.NodeSqliteAdapter(dbFile);
  try {
    db.exec('PRAGMA foreign_keys=ON');
    const sha = S.APPROVED_PACK.catalogue.sha256_word;
    const legacy = db.all('SELECT id,name FROM catalog_items WHERE id NOT IN (SELECT item_id FROM catalog_versions WHERE json_extract(provenance_json,\'$.sha256\')=?)', [sha]);
    const ids = legacy.map(l => l.id);
    if (!ids.length) { console.log(JSON.stringify({rien: 'Aucune ancienne fiche.'})); return; }
    const marks = a => a.map(() => '?').join(',');
    const verIds = db.all(`SELECT id FROM catalog_versions WHERE item_id IN (${marks(ids)})`, ids).map(r => r.id);
    // graphe des clés étrangères
    const tables = db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").map(t => t.name);
    const fk = {};
    for (const t of tables) for (const f of db.all(`PRAGMA foreign_key_list(${t})`)) (fk[f.table] ||= []).push({child: t, from: f.from});
    const targets = [...(fk.catalog_items || []).map(f => ({...f, set: ids})), ...(fk.catalog_versions || []).map(f => ({...f, set: verIds}))]
      .filter(f => f.child !== 'catalog_versions');
    const counts = {}, blocking = [];
    for (const f of targets) {
      const n = db.get(`SELECT count(*) n FROM ${f.child} WHERE ${f.from} IN (${marks(f.set)})`, f.set).n;
      if (!n) continue;
      counts[`${f.child}.${f.from}`] = n;
      if (BLOCKING.includes(f.child)) blocking.push(`${f.child}.${f.from}=${n}`);
    }
    const resume = {fichesASupprimer: legacy.map(l => l.name), versions: verIds.length, liensASupprimer: counts, bloquants: blocking};
    if (!apply) { console.log(JSON.stringify({apercu: true, ...resume}, null, 1)); return; }
    if (blocking.length) throw Error('Des devis, projets ou besoins dépendent de ces fiches : ' + blocking.join(', '));
    const backupDir = path.join(target, 'Sauvegardes-lots'); fs.mkdirSync(backupDir, {recursive: true});
    const backup = path.join(backupDir, `avant-purge-catalogue-${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`);
    await db.backupTo(backup);
    db.exec('BEGIN IMMEDIATE;');
    try {
      for (const f of targets) db.run(`DELETE FROM ${f.child} WHERE ${f.from} IN (${marks(f.set)})`, f.set);
      db.run(`DELETE FROM catalog_versions WHERE item_id IN (${marks(ids)})`, ids);
      db.run(`DELETE FROM catalog_items WHERE id IN (${marks(ids)})`, ids);
      const fkErr = db.all('PRAGMA foreign_key_check');
      if (fkErr.length) throw Error('Contrainte de clé étrangère non respectée : ' + JSON.stringify(fkErr.slice(0, 3)));
      db.exec('COMMIT;');
    } catch (e) { db.exec('ROLLBACK;'); throw e; }
    const integrity = db.all('PRAGMA integrity_check');
    if (integrity[0].integrity_check !== 'ok') throw Error('Intégrité non conforme ; restaurer ' + backup);
    const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
    meta.lots = [...(meta.lots ?? []), {lot: 'purge-catalogue', le: new Date().toISOString(), sauvegardeAvant: backup, fichesSupprimees: legacy.length}];
    fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2));
    console.log(JSON.stringify({applique: true, sauvegardeAvant: backup, fichesSupprimees: legacy.length, ...resume}, null, 1));
  } catch (e) { console.error('REFUSÉ — ' + e.message); process.exitCode = 1; } finally { db.close(); }
})();
