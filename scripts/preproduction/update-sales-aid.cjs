'use strict';
// Met à jour l'AIDE À LA VENTE des références du pack déjà publiées d'une PRÉPRODUCTION de test (champs descriptifs, non contractuels).
//   Aperçu :      node scripts/preproduction/update-sales-aid.cjs --dest <préproduction>
//   Application : node scripts/preproduction/update-sales-aid.cjs --dest <préproduction> --apply
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
  `Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath -like '*${target.replace(/'/g, "''")}*' -or $_.CommandLine -like '*${target.replace(/'/g, "''")}*' -or $_.CommandLine -like '*${target.replace(/\\/g, '/').replace(/'/g, "''")}*' } | Measure-Object | Select-Object -ExpandProperty Count`], {encoding: 'utf8'}).stdout.trim();
if (running !== '0') fail('La préproduction est ouverte : ferme-la avant.');
const repo = path.resolve(__dirname, '..', '..');
const bundle = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'atoumweb-aide-')), 'svc.cjs');
require(path.join(repo, 'node_modules', 'esbuild')).buildSync({stdin: {contents: ['src/main/commercial/ApprovedPackSource', 'src/main/database/NodeSqliteAdapter'].map(s => `export * from '${repo.replace(/\\/g, '/')}/${s}';`).join('\n'), resolveDir: repo, loader: 'ts'},
  bundle: true, platform: 'node', format: 'cjs', outfile: bundle, external: ['electron'], logLevel: 'silent', banner: {js: `module.paths.unshift(${JSON.stringify(path.join(repo, 'node_modules'))});`}});
const S = require(bundle);
const read = f => JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8'));
const sales = {...read('aide-a-la-vente-v1.json'), ...read('aide-a-la-vente-v1-detaillee-suite.json'), ...read('aide-a-la-vente-v1-detaillee.json')};
(async () => {
  const db = new S.NodeSqliteAdapter(dbFile);
  try {
    const rows = db.all("SELECT id,json_extract(provenance_json,'$.recordKey') code,commercial_parameters_json cp FROM catalog_versions WHERE status='published' AND json_extract(provenance_json,'$.sha256')=?", [S.APPROVED_PACK.catalogue.sha256_word]);
    const todo = rows.filter(r => sales[r.code]), sans = rows.filter(r => !sales[r.code]).map(r => r.code);
    if (!apply) { console.log(JSON.stringify({apercu: true, publiees: rows.length, aMettreAJour: todo.length, sansAide: sans}, null, 1)); return; }
    const backupDir = path.join(target, 'Sauvegardes-lots'); fs.mkdirSync(backupDir, {recursive: true});
    const backup = path.join(backupDir, `avant-aide-vente-${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`);
    await db.backupTo(backup);
    let n = 0;
    for (const r of todo) {
      let params = {}; try { params = JSON.parse(r.cp ?? '{}') ?? {}; } catch { params = {}; }
      const {internalAdvice, ...parameters} = sales[r.code];
      db.run('UPDATE catalog_versions SET commercial_parameters_json=?, internal_advice=? WHERE id=?', [JSON.stringify({...params, ...parameters}), internalAdvice ?? null, r.id]); n++;
    }
    const integrity = db.all('PRAGMA integrity_check'), fk = db.all('PRAGMA foreign_key_check');
    if (integrity[0].integrity_check !== 'ok' || fk.length) throw Error('Intégrité non conforme ; restaurer ' + backup);
    const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
    meta.lots = [...(meta.lots ?? []), {lot: 'aide-a-la-vente', le: new Date().toISOString(), sauvegardeAvant: backup, misesAJour: n}];
    fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2));
    console.log(JSON.stringify({applique: true, sauvegardeAvant: backup, misesAJour: n, sansAide: sans}, null, 1));
  } catch (e) { console.error('REFUSÉ — ' + e.message); process.exitCode = 1; } finally { db.close(); }
})();
