'use strict';
// Nettoie la FORME des listes « compris / non compris / prérequis » des offres publiées d'une préproduction de test :
// points doublés ou finaux, majuscule initiale, apostrophes droites, espaces multiples, tirets longs. Le fond n'est pas touché.
//   Aperçu :      node scripts/preproduction/clean-offer-texts.cjs --dest <préproduction>
//   Application : node scripts/preproduction/clean-offer-texts.cjs --dest <préproduction> --apply
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
  `Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath -like '*${target.replace(/'/g, "''")}*' } | Measure-Object | Select-Object -ExpandProperty Count`], {encoding: 'utf8'}).stdout.trim();
if (process.env.DBG) console.error('running=[' + running + ']');
if (running !== '0') fail('La préproduction est ouverte : ferme-la avant.');
const repo = path.resolve(__dirname, '..', '..');
const bundle = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'atoumweb-txt-')), 'svc.cjs');
require(path.join(repo, 'node_modules', 'esbuild')).buildSync({stdin: {contents: ['src/main/commercial/ApprovedPackSource', 'src/main/database/NodeSqliteAdapter'].map(s => `export * from '${repo.replace(/\\/g, '/')}/${s}';`).join('\n'), resolveDir: repo, loader: 'ts'},
  bundle: true, platform: 'node', format: 'cjs', outfile: bundle, external: ['electron'], logLevel: 'silent', banner: {js: `module.paths.unshift(${JSON.stringify(path.join(repo, 'node_modules'))});`}});
const S = require(bundle);
const clean = s => {
  let t = String(s).replace(/\s+/g, ' ').replace(/ [—–] /g, ', ').replace(/'/g, '’').trim().replace(/\.+$/, '').trim();
  t = t.replace(/\bSauvegardes (Hebdomadaires|Quotidiennes)\b/, (m, w) => 'Sauvegardes ' + w.toLowerCase()).replace('Garantie HNO/24-7', 'Garantie hors heures ouvrées et 24 h/24, 7 j/7').replace(/\bHNO\b/g, 'hors heures ouvrées');
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : '';
};
const parse = s => { try { const v = s ? JSON.parse(s) : null; return Array.isArray(v) ? v : null; } catch { return null; } };
(async () => {
  const db = new S.NodeSqliteAdapter(dbFile);
  try {
    const rows = db.all("SELECT id,json_extract(provenance_json,'$.recordKey') code,inclusions_json i,exclusions_json e,prerequisites_json p FROM catalog_versions WHERE status='published' AND json_extract(provenance_json,'$.sha256')=?", [S.APPROVED_PACK.catalogue.sha256_word]);
    const changes = [];
    for (const r of rows) for (const [col, key] of [['inclusions_json', 'i'], ['exclusions_json', 'e'], ['prerequisites_json', 'p']]) {
      const a = parse(r[key]); if (!a) continue;
      const b = a.map(clean).filter(Boolean);
      if (JSON.stringify(a) !== JSON.stringify(b)) changes.push({id: r.id, code: r.code, col, avant: a, apres: b});
    }
    const descRows = db.all("SELECT id,commercial_parameters_json d FROM catalog_versions WHERE status='published' AND json_extract(provenance_json,'$.sha256')=? AND commercial_parameters_json LIKE '%HNO%'", [S.APPROVED_PACK.catalogue.sha256_word]);
    for (const r of descRows) changes.push({id: r.id, code: 'aide', col: 'commercial_parameters_json', avant: [r.d], apres: [r.d.replace('Garantie HNO/24-7', 'Garantie hors heures ouvrées et 24 h/24, 7 j/7').replace(/HNO/g, 'hors heures ouvrées')]});
    const resume = {publiees: rows.length, champsAModifier: changes.length, offresTouchees: new Set(changes.map(c => c.code)).size};
    if (!apply) { console.log(JSON.stringify({apercu: true, ...resume, exemples: changes.slice(0, 5).map(c => ({code: c.code, col: c.col, avant: c.avant.slice(0, 3), apres: c.apres.slice(0, 3)}))}, null, 1)); return; }
    const backupDir = path.join(target, 'Sauvegardes-lots'); fs.mkdirSync(backupDir, {recursive: true});
    const backup = path.join(backupDir, `avant-nettoyage-textes-${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`);
    await db.backupTo(backup);
    for (const c of changes) db.run(`UPDATE catalog_versions SET ${c.col}=? WHERE id=?`, [c.col === 'commercial_parameters_json' ? c.apres[0] : JSON.stringify(c.apres), c.id]);
    const integrity = db.all('PRAGMA integrity_check'), fk = db.all('PRAGMA foreign_key_check');
    if (integrity[0].integrity_check !== 'ok' || fk.length) throw Error('Intégrité non conforme ; restaurer ' + backup);
    const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
    meta.lots = [...(meta.lots ?? []), {lot: 'nettoyage-textes-offres', le: new Date().toISOString(), sauvegardeAvant: backup, ...resume}];
    fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2));
    console.log(JSON.stringify({applique: true, sauvegardeAvant: backup, ...resume}, null, 1));
  } catch (e) { console.error('REFUSÉ — ' + e.message); process.exitCode = 1; } finally { db.close(); }
})();
