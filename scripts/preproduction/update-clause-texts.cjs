'use strict';
// Applique les corrections de rédaction des clauses (corrections-cgv-relecture-v1.json) sur place, dans une PRÉPRODUCTION de test déjà validée.
//   Aperçu :      node scripts/preproduction/update-clause-texts.cjs --dest <préproduction>
//   Application : node scripts/preproduction/update-clause-texts.cjs --dest <préproduction> --apply
// Rejouable (une correction déjà en place est ignorée). Sauvegarde avant écriture ; refuse si le Manager est ouvert.
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
const bundle = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'atoumweb-cgv-')), 'svc.cjs');
require(path.join(repo, 'node_modules', 'esbuild')).buildSync({stdin: {contents: "export * from '" + repo.replace(/\\/g, '/') + "/src/main/database/NodeSqliteAdapter';", resolveDir: repo, loader: 'ts'},
  bundle: true, platform: 'node', format: 'cjs', outfile: bundle, external: ['electron'], logLevel: 'silent', banner: {js: `module.paths.unshift(${JSON.stringify(path.join(repo, 'node_modules'))});`}});
const S = require(bundle);
const {applyFix} = require('./clauseFixes.cjs');
const fixes = JSON.parse(fs.readFileSync(path.join(__dirname, 'corrections-cgv-relecture-v1.json'), 'utf8')).corrections;
(async () => {
  const db = new S.NodeSqliteAdapter(dbFile);
  try {
    const rows = db.all("SELECT v.id,t.code,v.body FROM contract_clause_templates t JOIN contract_clause_versions v ON v.id=t.current_version_id WHERE v.status='published'");
    const byCode = new Map(rows.map(r => [r.code.toUpperCase(), {id: r.id, body: r.body}]));
    const plan = new Map(), report = {aAppliquer: 0, dejaEnPlace: 0, erreurs: []};
    for (const f of fixes) {
      const cur = plan.get(f.code.toUpperCase()) ?? byCode.get(f.code.toUpperCase());
      if (!cur) { report.erreurs.push(f.code + ' : clause introuvable'); continue; }
      try { const r = applyFix(cur.body, f); plan.set(f.code.toUpperCase(), {id: cur.id, body: r.body}); if (r.applied) report.aAppliquer++; else report.dejaEnPlace++; }
      catch (e) { report.erreurs.push(f.code + ' : ' + e.message); }
    }
    if (!apply) { console.log(JSON.stringify({apercu: true, ...report, clausesTouchees: [...plan.keys()].filter(k => plan.get(k).body !== byCode.get(k).body).length}, null, 1)); return; }
    if (report.erreurs.length) throw Error(report.erreurs.join(' ; '));
    const backupDir = path.join(target, 'Sauvegardes-lots'); fs.mkdirSync(backupDir, {recursive: true});
    const backup = path.join(backupDir, `avant-relecture-cgv-${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`);
    await db.backupTo(backup);
    let n = 0;
    for (const [k, v] of plan) if (v.body !== byCode.get(k).body) { db.run('UPDATE contract_clause_versions SET body=? WHERE id=?', [v.body, v.id]); n++; }
    const integrity = db.all('PRAGMA integrity_check'), fk = db.all('PRAGMA foreign_key_check');
    if (integrity[0].integrity_check !== 'ok' || fk.length) throw Error('Intégrité non conforme ; restaurer ' + backup);
    const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
    meta.lots = [...(meta.lots ?? []), {lot: 'relecture-cgv', le: new Date().toISOString(), sauvegardeAvant: backup, clausesModifiees: n}];
    fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2));
    console.log(JSON.stringify({applique: true, sauvegardeAvant: backup, clausesModifiees: n, ...report}, null, 1));
  } catch (e) { console.error('REFUSÉ — ' + e.message); process.exitCode = 1; } finally { db.close(); }
})();
