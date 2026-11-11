'use strict';
// Lot 2 — publie les offres de départ et leurs CGV dans une PRÉPRODUCTION assemblée.
//   Aperçu :     node scripts/preproduction/publish-starter-offers.cjs --dest <préproduction>
//   Application : node scripts/preproduction/publish-starter-offers.cjs --dest <préproduction> --apply <planSha256>
// Sauvegarde la base avant toute écriture ; refuse si le Manager de cette préproduction est ouvert.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), {spawnSync} = require('node:child_process');
if (!process.versions.electron) {
  const r = spawnSync(require('electron'), [__filename, ...process.argv.slice(2)], {encoding: 'utf8', windowsHide: true, env: {...process.env, ELECTRON_RUN_AS_NODE: '1'}, maxBuffer: 16 * 1024 * 1024});
  process.stdout.write(r.stdout || ''); process.stderr.write(r.stderr || ''); process.exit(r.status ?? 1);
}
const arg = k => { const i = process.argv.indexOf(k); return i < 0 ? null : process.argv[i + 1]; };
const dest = arg('--dest'), apply = arg('--apply');
const fail = m => { console.error('REFUSÉ — ' + m); process.exit(1); };
if (!dest) fail('Usage : --dest <préproduction> [--apply <planSha256>]');
const target = path.resolve(dest), metaFile = path.join(target, 'PREPRODUCTION.json');
if (!fs.existsSync(metaFile) || JSON.parse(fs.readFileSync(metaFile, 'utf8')).mode !== 'PREPRODUCTION_TEST') fail('Ce dossier n’est pas une préproduction de test assemblée.');
const dbFile = path.join(target, 'Workspace', 'data', 'atoumweb-manager.sqlite');
if (/validation-msi/i.test(dbFile) || !fs.existsSync(dbFile)) fail('Base introuvable ou interdite.');
const running = spawnSync('powershell.exe', ['-NoProfile', '-Command',
  `Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath -like '*${target.replace(/'/g, "''")}*' -or $_.CommandLine -like '*${target.replace(/'/g, "''")}*' -or $_.CommandLine -like '*${target.replace(/\\/g, '/').replace(/'/g, "''")}*' } | Measure-Object | Select-Object -ExpandProperty Count`], {encoding: 'utf8'}).stdout.trim();
if (running !== '0') fail('La préproduction est ouverte : ferme-la avant.');

const repo = path.resolve(__dirname, '..', '..');
const bundle = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'atoumweb-lot2-')), 'svc.cjs');
require(path.join(repo, 'node_modules', 'esbuild')).buildSync({stdin: {contents: ['src/main/commercial/StarterOffersPublication', 'src/main/database/NodeSqliteAdapter'].map(s => `export * from '${repo.replace(/\\/g, '/')}/${s}';`).join('\n'), resolveDir: repo, loader: 'ts'},
  bundle: true, platform: 'node', format: 'cjs', outfile: bundle, external: ['electron'], logLevel: 'silent', banner: {js: `module.paths.unshift(${JSON.stringify(path.join(repo, 'node_modules'))});`}});
const S = require(bundle);

(async () => {
  const db = new S.NodeSqliteAdapter(dbFile);
  try {
    db.exec('PRAGMA foreign_keys=ON');
    const plan = S.planStarterPublication(db);
    const resume = {
      offres: plan.offers.map(o => `${o.code} → ${o.action}`),
      clauses: {aPublier: plan.clauses.filter(c => c.action === 'publier').length, dejaPubliees: plan.clauses.filter(c => c.action !== 'publier').length},
      rattachements: plan.links.length, exclues: plan.excluded, blocages: plan.blockers, planSha256: plan.planSha256,
    };
    if (!apply) { console.log(JSON.stringify({apercu: true, ...resume}, null, 1)); return; }
    if (plan.blockers.length) throw Error(plan.blockers.join(' ; '));
    const backupDir = path.join(target, 'Sauvegardes-lots'); fs.mkdirSync(backupDir, {recursive: true});
    const backup = path.join(backupDir, `avant-lot2-${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`);
    await db.backupTo(backup);
    const done = S.applyStarterPublication(db, apply);
    const integrity = db.all('PRAGMA integrity_check'), fk = db.all('PRAGMA foreign_key_check');
    if (integrity[0].integrity_check !== 'ok' || fk.length) throw Error('Intégrité non conforme après publication ; restaurer ' + backup);
    const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
    meta.lots = [...(meta.lots ?? []), {lot: 2, le: new Date().toISOString(), sauvegardeAvant: backup, ...done}];
    fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2));
    console.log(JSON.stringify({applique: true, sauvegardeAvant: backup, ...done}, null, 1));
  } catch (e) { console.error('REFUSÉ — ' + e.message); process.exitCode = 1; } finally { db.close(); }
})();
