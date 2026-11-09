'use strict';
// Lot 1 — renseigne « Mon entreprise » d'une PRÉPRODUCTION à partir d'un fichier JSON tenu HORS du dépôt.
//   node scripts/preproduction/set-company-info.cjs --dest <préproduction> --file <mon-entreprise.json>
// Champs acceptés : brandName, tagline, identity, administrative, vat, complaints.
// Sauvegarde la base avant écriture ; refuse si le Manager de cette préproduction est ouvert.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), {spawnSync} = require('node:child_process');
if (!process.versions.electron) {
  const r = spawnSync(require('electron'), [__filename, ...process.argv.slice(2)], {encoding: 'utf8', windowsHide: true, env: {...process.env, ELECTRON_RUN_AS_NODE: '1'}, maxBuffer: 16 * 1024 * 1024});
  process.stdout.write(r.stdout || ''); process.stderr.write(r.stderr || ''); process.exit(r.status ?? 1);
}
const arg = k => { const i = process.argv.indexOf(k); return i < 0 ? null : process.argv[i + 1]; };
const fail = m => { console.error('REFUSÉ — ' + m); process.exit(1); };
const dest = arg('--dest'), file = arg('--file');
if (!dest || !file) fail('Usage : --dest <préproduction> --file <mon-entreprise.json>');
const repo = path.resolve(__dirname, '..', '..'), source = path.resolve(file);
if (!path.relative(repo, source).startsWith('..')) fail('Le fichier des informations doit rester HORS du dépôt (dépôt public).');
const target = path.resolve(dest), metaFile = path.join(target, 'PREPRODUCTION.json');
if (!fs.existsSync(metaFile) || JSON.parse(fs.readFileSync(metaFile, 'utf8')).mode !== 'PREPRODUCTION_TEST') fail('Ce dossier n’est pas une préproduction assemblée.');
const dbFile = path.join(target, 'Workspace', 'data', 'atoumweb-manager.sqlite');
const running = spawnSync('powershell.exe', ['-NoProfile', '-Command',
  `Get-CimInstance Win32_Process -Filter "Name='electron.exe'" | Where-Object { $_.CommandLine -like '*${target.replace(/'/g, "''")}*' } | Measure-Object | Select-Object -ExpandProperty Count`], {encoding: 'utf8'}).stdout.trim();
if (running !== '0') fail('La préproduction est ouverte : ferme-la avant.');
const input = JSON.parse(fs.readFileSync(source, 'utf8'));

const bundle = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'atoumweb-lot1-')), 'svc.cjs');
require(path.join(repo, 'node_modules', 'esbuild')).buildSync({stdin: {contents: ['src/main/commercial/QuoteDocumentSettingsService', 'src/main/commercial/QuoteContractPreparationService', 'src/main/database/NodeSqliteAdapter'].map(s => `export * from '${repo.replace(/\\/g, '/')}/${s}';`).join('\n'), resolveDir: repo, loader: 'ts'},
  bundle: true, platform: 'node', format: 'cjs', outfile: bundle, external: ['electron'], logLevel: 'silent', banner: {js: `module.paths.unshift(${JSON.stringify(path.join(repo, 'node_modules'))});`}});
const S = require(bundle);
(async () => {
  const db = new S.NodeSqliteAdapter(dbFile);
  try {
    db.exec('PRAGMA foreign_keys=ON');
    const backupDir = path.join(target, 'Sauvegardes-lots'); fs.mkdirSync(backupDir, {recursive: true});
    const backup = path.join(backupDir, `avant-lot1-${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`);
    await db.backupTo(backup);
    const prep = new S.QuoteContractPreparationService(db), settings = new S.QuoteDocumentSettingsService(db);
    const admin = prep.administration();
    for (const key of ['identity', 'administrative', 'vat', 'complaints']) if (typeof input[key] === 'string' && input[key].trim())
      admin[key] = {state: 'filled', value: input[key].trim(), reason: ''};
    prep.saveAdministration(admin, prep.administration());
    const value = settings.get();
    if (input.brandName) value.brandName = input.brandName;
    if (typeof input.tagline === 'string') value.tagline = input.tagline;
    settings.save(value, settings.get());
    const after = prep.administration();
    console.log(JSON.stringify({applique: true, sauvegardeAvant: backup, renseignes: ['identity', 'administrative', 'vat', 'complaints'].filter(k => after[k].state === 'filled'), nomAffiche: settings.get().brandName}, null, 1));
  } catch (e) { console.error('REFUSÉ — ' + e.message); process.exitCode = 1; } finally { db.close(); }
})();
