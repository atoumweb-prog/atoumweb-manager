'use strict';
// Supprime TOUS les devis d'une PRÉPRODUCTION de test et ce qui en dépend (clauses de devis, documents, projets créés depuis un devis et leurs éléments).
// Ne touche ni aux clients, ni aux prospects, ni au Catalogue, ni aux clauses : décision de Carlos du 11/11/2026 (« on repart d'une base propre »).
//   Aperçu :      node scripts/preproduction/purge-test-quotes.cjs --dest <préproduction>
//   Application : node scripts/preproduction/purge-test-quotes.cjs --dest <préproduction> --apply
// Les verrous de la base qui protègent l'historique des devis acceptés sont retirés le temps du nettoyage, puis remis À L'IDENTIQUE avant la validation (accord de Carlos du 11/11/2026, base de test uniquement).
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
const bundle = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'atoumweb-quotes-')), 'svc.cjs');
require(path.join(repo, 'node_modules', 'esbuild')).buildSync({stdin: {contents: `export * from '${repo.replace(/\\/g, '/')}/src/main/database/NodeSqliteAdapter';`, resolveDir: repo, loader: 'ts'},
  bundle: true, platform: 'node', format: 'cjs', outfile: bundle, external: ['electron'], logLevel: 'silent', banner: {js: `module.paths.unshift(${JSON.stringify(path.join(repo, 'node_modules'))});`}});
const S = require(bundle);
// Tables à ne jamais supprimer : on détache seulement la référence (colonne NULL) si elle l'autorise, sinon on refuse.
const PROTECTED = /^(clients?|client_accounts?|prospects?|crm_|contacts?|catalog_|contract_clause_|company_|settings|users?)/;

(async () => {
  const db = new S.NodeSqliteAdapter(dbFile);
  try {
    db.exec('PRAGMA foreign_keys=ON');
    const tables = db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").map(t => t.name);
    const info = {}, fk = {}; // fk[parent] = [{child, from, to}]
    for (const t of tables) {
      info[t] = db.all(`PRAGMA table_info(${t})`);
      for (const f of db.all(`PRAGMA foreign_key_list(${t})`)) (fk[f.table] ||= []).push({child: t, from: f.from, to: f.to || (info[f.table]?.find(c => c.pk)?.name ?? 'id')});
    }
    const quoteIds = db.all('SELECT id FROM quotes').map(r => r.id);
    if (!quoteIds.length) { console.log(JSON.stringify({rien: 'Aucun devis.'})); return; }
    // Parcours en largeur des lignes dépendantes (rowid)
    const toDelete = new Map(); // table -> Set(rowid)
    const toDetach = new Map(); // "table.col" -> Set(rowid)
    const add = (t, rid) => { if (!toDelete.has(t)) toDelete.set(t, new Set()); toDelete.get(t).add(rid); };
    const queue = [{table: 'quotes', rids: db.all('SELECT rowid r FROM quotes').map(r => r.r)}];
    for (const q of queue) q.rids.forEach(r => add(q.table, r));
    const seenQ = new Set(['quotes']);
    while (queue.length) {
      const {table, rids} = queue.shift();
      for (const f of fk[table] || []) {
        const parentVals = db.all(`SELECT DISTINCT ${f.to} v FROM ${table} WHERE rowid IN (${rids.map(() => '?').join(',')})`, rids).map(r => r.v).filter(v => v != null);
        if (!parentVals.length) continue;
        const kids = db.all(`SELECT rowid r FROM ${f.child} WHERE ${f.from} IN (${parentVals.map(() => '?').join(',')})`, parentVals).map(r => r.r);
        if (!kids.length) continue;
        if (PROTECTED.test(f.child)) {
          const col = info[f.child].find(c => c.name === f.from);
          if (col?.notnull) throw Error(`${f.child}.${f.from} dépend d'un devis et ne peut pas être détaché (NOT NULL).`);
          const k = `${f.child}.${f.from}`; if (!toDetach.has(k)) toDetach.set(k, new Set()); kids.forEach(r => toDetach.get(k).add(r));
          continue;
        }
        const fresh = kids.filter(r => !(toDelete.get(f.child)?.has(r)));
        if (!fresh.length) continue;
        fresh.forEach(r => add(f.child, r));
        queue.push({table: f.child, rids: fresh});
      }
    }
    const delTables = [...toDelete.keys()];
    const lockTriggers = db.all(`SELECT name,sql,tbl_name FROM sqlite_master WHERE type='trigger' AND sql LIKE '%DELETE%' AND tbl_name IN (${delTables.map(() => '?').join(',')})`, delTables);
    const triggersBefore = db.get("SELECT count(*) n FROM sqlite_master WHERE type='trigger'").n;
    const resume = {verrousLevesLeTempsDuNettoyage: lockTriggers.map(t => t.name), devis: quoteIds.length, aSupprimer: Object.fromEntries([...toDelete].map(([t, s]) => [t, s.size])), aDetacher: Object.fromEntries([...toDetach].map(([k, s]) => [k, s.size]))};
    if (!apply) { console.log(JSON.stringify({apercu: true, ...resume}, null, 1)); return; }
    const backupDir = path.join(target, 'Sauvegardes-lots'); fs.mkdirSync(backupDir, {recursive: true});
    const backup = path.join(backupDir, `avant-purge-devis-${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`);
    await db.backupTo(backup);
    db.exec('PRAGMA foreign_keys=OFF'); // l'ordre de suppression est géré ici ; la cohérence est contrôlée à la fin
    db.exec('BEGIN IMMEDIATE;');
    try {
      for (const t of lockTriggers) db.exec(`DROP TRIGGER IF EXISTS "${t.name}"`);
      for (const [k, rids] of toDetach) { const [t, c] = k.split('.'); db.run(`UPDATE ${t} SET ${c}=NULL WHERE rowid IN (${[...rids].map(() => '?').join(',')})`, [...rids]); }
      for (const [t, rids] of toDelete) db.run(`DELETE FROM ${t} WHERE rowid IN (${[...rids].map(() => '?').join(',')})`, [...rids]);
      for (const t of lockTriggers) db.exec(t.sql); // remise à l'identique
      const triggersAfter = db.get("SELECT count(*) n FROM sqlite_master WHERE type='trigger'").n;
      if (triggersAfter !== triggersBefore) throw Error(`Verrous non remis à l'identique (${triggersBefore} avant, ${triggersAfter} après) : annulation.`);
      const fkErr = db.all('PRAGMA foreign_key_check');
      if (fkErr.length) throw Error('Contrainte de clé étrangère non respectée : ' + JSON.stringify(fkErr.slice(0, 3)));
      db.exec('COMMIT;');
    } catch (e) { db.exec('ROLLBACK;'); throw e; }
    const integrity = db.all('PRAGMA integrity_check');
    if (integrity[0].integrity_check !== 'ok') throw Error('Intégrité non conforme ; restaurer ' + backup);
    const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
    meta.lots = [...(meta.lots ?? []), {lot: 'purge-devis', le: new Date().toISOString(), sauvegardeAvant: backup, devisSupprimes: quoteIds.length}];
    fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2));
    console.log(JSON.stringify({applique: true, sauvegardeAvant: backup, ...resume}, null, 1));
  } catch (e) { console.error('REFUSÉ — ' + e.message); process.exitCode = 1; } finally { db.close(); }
})();
