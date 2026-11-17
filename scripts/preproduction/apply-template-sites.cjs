'use strict';
// Fiche « Site » des modèles de sites, boutiques, mariage et landing (décision de Carlos du 17/11/2026) : nouvelle version qui déclare un « Site principal »,
// liens Catalogue déplacés. Les projets déjà créés gardent leur version.
//   Aperçu :      node scripts/preproduction/apply-template-sites.cjs --dest <préproduction>
//   Application : node scripts/preproduction/apply-template-sites.cjs --dest <préproduction> --apply <planSha256>
// Sauvegarde la base avant écriture ; refuse si le Manager de cette préproduction est ouvert. Rejouable.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), {spawnSync} = require('node:child_process');
if (!process.versions.electron) {
  const r = spawnSync(require('electron'), [__filename, ...process.argv.slice(2)], {encoding: 'utf8', windowsHide: true, env: {...process.env, ELECTRON_RUN_AS_NODE: '1'}, maxBuffer: 32 * 1024 * 1024});
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
  `Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath -like '*${target.replace(/'/g, "''")}*' } | Measure-Object | Select-Object -ExpandProperty Count`], {encoding: 'utf8'}).stdout.trim();
if (apply && running !== '0') fail('La préproduction est ouverte : ferme-la avant.');
const repo = path.resolve(__dirname, '..', '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'atoumweb-sites-'));
const bundle = path.join(tmp, 'svc.cjs');
require(path.join(repo, 'node_modules', 'esbuild')).buildSync({stdin: {contents: ['src/main/database/NodeSqliteAdapter', 'src/main/projects/ProjectService', 'src/main/workspace', 'src/main/projects/ReferentialTemplateSites']
  .map(s => `export * from '${repo.replace(/\\/g, '/')}/${s}';`).join('\n'), resolveDir: repo, loader: 'ts'},
  bundle: true, platform: 'node', format: 'cjs', outfile: bundle, external: ['electron'], logLevel: 'silent', banner: {js: `module.paths.unshift(${JSON.stringify(path.join(repo, 'node_modules'))});`}});
const S = require(bundle);
const input = ['Référentiel · Boutique WooCommerce', 'Référentiel · WooCommerce Business', 'Référentiel · WooCommerce Visibilité', 'Référentiel · Vitrine Business', 'Référentiel · Vitrine Visibilité', 'Référentiel · Site de mariage', 'Référentiel · Landing Page'];
(async () => {
  const db = new S.NodeSqliteAdapter(dbFile);
  try {
    db.exec('PRAGMA foreign_keys=ON');
    const plan = S.planTemplateSites(db, input);
    const resume = {aMettreAJour: plan.templates.filter(t => t.action === 'add_site').map(t => t.modele), dejaFaits: plan.templates.filter(t => t.action === 'unchanged').length, manquants: plan.missing, planSha256: plan.planSha256};
    if (!apply) { console.log(JSON.stringify({apercu: true, ...resume}, null, 1)); return; }
    if (apply !== plan.planSha256) throw Error('Empreinte différente de l’aperçu : relancer l’aperçu.');
    const backupDir = path.join(target, 'Sauvegardes-lots'); fs.mkdirSync(backupDir, {recursive: true});
    const backup = path.join(backupDir, `avant-sites-modeles-${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`);
    await db.backupTo(backup);
    const done = S.applyTemplateSites(db, new S.ProjectService(db, S.createWorkspacePaths(path.join(tmp, 'ws'))), input, apply);
    const integrity = db.all('PRAGMA integrity_check'), fk = db.all('PRAGMA foreign_key_check');
    if (integrity[0].integrity_check !== 'ok' || fk.length) throw Error('Intégrité non conforme ; restaurer ' + backup);
    const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
    meta.lots = [...(meta.lots ?? []), {lot: 'sites-modeles', le: new Date().toISOString(), sauvegardeAvant: backup, ...done, planSha256: apply}];
    fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2));
    console.log(JSON.stringify({applique: true, sauvegardeAvant: backup, ...done}, null, 1));
  } catch (e) { console.error('REFUSÉ — ' + e.message); process.exitCode = 1; } finally { db.close(); }
})();
