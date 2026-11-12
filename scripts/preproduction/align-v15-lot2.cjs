'use strict';
// Aligne sur le référentiel V1.5 deux écarts relevés lors du lot 2 du référentiel interne (arbitrage de Carlos, 11/11/2026) :
//   1. Suivi statistiques Premium : « 3-5 actions » devient « Jusqu’à 3 recommandations au bilan trimestriel » (V1.5 SEO-004, Manuel §5) ;
//   2. Temps de référence : SEO Essentiel 4 h, Avancé 6 h, Premium 11 h, optimisation vitesse 2 h (V1.5 SEO-006 à SEO-008, PERF-001).
//   Aperçu :      node scripts/preproduction/align-v15-lot2.cjs --dest <préproduction>
//   Application : node scripts/preproduction/align-v15-lot2.cjs --dest <préproduction> --apply
// Rejouable. Sauvegarde la base avant écriture ; refuse si le Manager de cette préproduction est ouvert.
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
  `Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath -like '*${target.replace(/'/g, "''")}*' } | Measure-Object | Select-Object -ExpandProperty Count`], {encoding: 'utf8'}).stdout.trim();
if (running !== '0') fail('La préproduction est ouverte : ferme-la avant.');
const repo = path.resolve(__dirname, '..', '..');
const bundle = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'atoumweb-v15-')), 'svc.cjs');
require(path.join(repo, 'node_modules', 'esbuild')).buildSync({stdin: {contents: ['src/main/commercial/ApprovedPackSource', 'src/main/database/NodeSqliteAdapter'].map(s => `export * from '${repo.replace(/\\/g, '/')}/${s}';`).join('\n'), resolveDir: repo, loader: 'ts'},
  bundle: true, platform: 'node', format: 'cjs', outfile: bundle, external: ['electron'], logLevel: 'silent', banner: {js: `module.paths.unshift(${JSON.stringify(path.join(repo, 'node_modules'))});`}});
const S = require(bundle);

const MINUTES = {'AW-SEO-ESSENTIEL': 240, 'AW-SEO-AVANCE': 360, 'AW-SEO-PREMIUM': 660, 'AW-SEO-PERF': 120};
const ACTIONS = {codes: ['AW-DATA-SUIVI-M', 'AW-DATA-SUIVI-A'], de: '3-5 actions', vers: 'Jusqu’à 3 recommandations au bilan trimestriel'};

(async () => {
  const db = new S.NodeSqliteAdapter(dbFile);
  try {
    const rows = db.all("SELECT id,json_extract(provenance_json,'$.recordKey') code,estimated_minutes m,inclusions_json inc FROM catalog_versions WHERE status='published' AND json_extract(provenance_json,'$.sha256')=?", [S.APPROVED_PACK.catalogue.sha256_word]);
    const plan = [];
    for (const r of rows) {
      if (MINUTES[r.code] !== undefined && r.m !== MINUTES[r.code]) plan.push({id: r.id, code: r.code, col: 'estimated_minutes', avant: r.m, apres: MINUTES[r.code]});
      if (ACTIONS.codes.includes(r.code)) {
        const a = JSON.parse(r.inc || '[]');
        if (a.includes(ACTIONS.de)) plan.push({id: r.id, code: r.code, col: 'inclusions_json', avant: a, apres: a.map(x => x === ACTIONS.de ? ACTIONS.vers : x)});
      }
    }
    if (!apply) { console.log(JSON.stringify({apercu: true, aModifier: plan.length, plan: plan.map(p => ({code: p.code, col: p.col, avant: p.avant, apres: p.apres}))}, null, 1)); return; }
    const backupDir = path.join(target, 'Sauvegardes-lots'); fs.mkdirSync(backupDir, {recursive: true});
    const backup = path.join(backupDir, `avant-alignement-v15-${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`);
    await db.backupTo(backup);
    for (const p of plan) db.run(`UPDATE catalog_versions SET ${p.col}=? WHERE id=?`, [p.col === 'inclusions_json' ? JSON.stringify(p.apres) : p.apres, p.id]);
    const integrity = db.all('PRAGMA integrity_check'), fk = db.all('PRAGMA foreign_key_check');
    if (integrity[0].integrity_check !== 'ok' || fk.length) throw Error('Intégrité non conforme ; restaurer ' + backup);
    const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
    meta.lots = [...(meta.lots ?? []), {lot: 'alignement-v15-lot2', le: new Date().toISOString(), sauvegardeAvant: backup, champsModifies: plan.length}];
    fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2));
    console.log(JSON.stringify({applique: true, sauvegardeAvant: backup, champsModifies: plan.length}, null, 1));
  } catch (e) { console.error('REFUSÉ — ' + e.message); process.exitCode = 1; } finally { db.close(); }
})();
