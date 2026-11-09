'use strict';
// Assemble une préproduction isolée et autonome à partir :
//  - d'une préproduction existante (son Workspace : fichiers clients, documents…), lue seulement ;
//  - d'une copie de base préparée par prepare-v394-activation-copy.cjs ;
//  - du Manager compilé depuis ce dépôt (.vite) et du moteur Electron du dépôt.
// Usage :
//   node scripts/preproduction/assemble-preproduction.cjs --from <préproduction existante> --activation-copy <dossier copie prête> --dest <dossier NOUVEAU> --title "<nom>"
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), crypto = require('node:crypto'), {spawnSync} = require('node:child_process');
if (!process.versions.electron) {
  const r = spawnSync(require('electron'), [__filename, ...process.argv.slice(2)], {encoding: 'utf8', windowsHide: true, env: {...process.env, ELECTRON_RUN_AS_NODE: '1'}, maxBuffer: 16 * 1024 * 1024});
  process.stdout.write(r.stdout || ''); process.stderr.write(r.stderr || ''); process.exit(r.status ?? 1);
}
const arg = k => { const i = process.argv.indexOf(k); return i < 0 ? null : process.argv[i + 1]; };
const from = arg('--from'), copyDir = arg('--activation-copy'), dest = arg('--dest'), title = arg('--title');
if (!from || !copyDir || !dest || !title) { console.error('Usage : --from <préprod> --activation-copy <copie prête> --dest <nouveau dossier> --title <nom>'); process.exit(2); }
const repo = path.resolve(__dirname, '..', '..');
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const check = (ok, why) => { if (!ok) throw Error(why); };
const git = (...a) => spawnSync('git', ['-C', repo, ...a], {encoding: 'utf8'}).stdout.trim();

const target = path.resolve(dest);
let created = false;
try {
  check(!fs.existsSync(target), 'Le dossier de destination existe déjà.');
  const oldWorkspace = path.join(path.resolve(from), 'Workspace-TEST');
  check(fs.existsSync(path.join(oldWorkspace, 'data', 'atoumweb-manager.sqlite')), 'Workspace-TEST introuvable dans la préproduction source.');
  const report = JSON.parse(fs.readFileSync(path.join(copyDir, 'RAPPORT-ACTIVATION.json'), 'utf8'));
  const prepared = path.join(copyDir, 'atoumweb-manager.sqlite');
  check(report.status === 'PRETE' && sha(prepared) === report.output.sha256, 'Copie prête absente ou modifiée depuis son rapport.');
  // La copie n'est valable que si la base d'origine n'a pas bougé depuis la sauvegarde.
  const snapshot = JSON.parse(fs.readFileSync(report.snapshotReport, 'utf8'));
  for (const [file, expected] of Object.entries(snapshot.sourceFingerprintsBefore)) {
    const now = fs.existsSync(file) ? sha(file) : null, empty = crypto.createHash('sha256').update('').digest('hex');
    check(now === expected || (file.endsWith('-wal') && [now, expected].every(h => h === null || h === empty)), 'La préproduction source a changé depuis la sauvegarde : refaire la sauvegarde et la copie.');
  }
  const vite = path.join(repo, '.vite');
  check(fs.existsSync(path.join(vite, 'build', 'main.js')) && fs.existsSync(path.join(vite, 'renderer', 'main_window', 'index.html')), 'Manager non compilé : lancer « npx electron-forge package » avant.');
  const electronDist = path.join(repo, 'node_modules', 'electron', 'dist');
  check(fs.existsSync(path.join(electronDist, 'electron.exe')), 'Moteur Electron introuvable.');
  check(!git('status', '--porcelain', '--', 'src'), 'Le code source contient des modifications non enregistrées : commit requis avant livraison.');

  fs.mkdirSync(target, {recursive: true}); created = true;
  const workspace = path.join(target, 'Workspace');
  // 1. Workspace : fichiers de l'ancienne préproduction, SANS sa base ; puis la copie prête.
  fs.cpSync(oldWorkspace, workspace, {recursive: true, filter: src => !/atoumweb-manager\.sqlite(-wal|-shm)?$/i.test(src)});
  fs.copyFileSync(prepared, path.join(workspace, 'data', 'atoumweb-manager.sqlite'));
  // 2. Chemins de dossiers projets : planificateur EC04 existant, application explicite et vérifiée.
  const bundle = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'atoumweb-assemble-')), 'svc.cjs');
  require(path.join(repo, 'node_modules', 'esbuild')).buildSync({stdin: {contents: `export * from '${repo.replace(/\\/g, '/')}/src/main/backups/WorkspaceRelocationPlan';`, resolveDir: repo, loader: 'ts'}, bundle: true, platform: 'node', format: 'cjs', outfile: bundle, logLevel: 'silent'});
  const {planProjectResourceRelocations} = require(bundle);
  const dbFile = path.join(workspace, 'data', 'atoumweb-manager.sqlite');
  const {DatabaseSync} = require('node:sqlite');
  { const d = new DatabaseSync(dbFile); try { d.exec('PRAGMA journal_mode=DELETE'); } finally { d.close(); } }
  const plan = planProjectResourceRelocations(dbFile, oldWorkspace, workspace);
  check(plan.proposals.every(p => p.status === 'proposed'), 'Chemins de projets à revoir manuellement : ' + JSON.stringify(plan.proposals.filter(p => p.status !== 'proposed')));
  const db = new DatabaseSync(dbFile);
  const relocated = [];
  try {
    db.exec('BEGIN IMMEDIATE');
    for (const p of plan.proposals) {
      const before = db.prepare('SELECT resource_root_path FROM projects WHERE id=?').get(p.projectId).resource_root_path;
      const r = db.prepare('UPDATE projects SET resource_root_path=? WHERE id=? AND resource_root_path=?').run(p.destinationPath, p.projectId, before);
      check(Number(r.changes) === 1 && fs.existsSync(p.destinationPath), 'Dossier projet introuvable après copie : ' + p.destinationPath);
      relocated.push({projectId: p.projectId, avant: before, apres: p.destinationPath});
    }
    const stale = db.prepare('SELECT resource_root_path p FROM projects WHERE resource_root_path IS NOT NULL').all()
      .filter(r => path.resolve(String(r.p)).toLowerCase().startsWith(oldWorkspace.toLowerCase()));
    check(!stale.length, 'Un chemin pointe encore vers l’ancienne préproduction.');
    db.exec('COMMIT');
    check(db.prepare('PRAGMA integrity_check').get().integrity_check === 'ok' && db.prepare('PRAGMA foreign_key_check').all().length === 0, 'Intégrité après relocalisation non conforme.');
    db.exec('PRAGMA journal_mode=DELETE');
  } catch (e) { try { db.exec('ROLLBACK'); } catch {} throw e; } finally { db.close(); }
  // 3. Manager compilé + lanceur isolé + moteur Electron autonome.
  const runtime = path.join(target, 'Runtime');
  fs.cpSync(path.join(vite, 'build'), path.join(runtime, 'build'), {recursive: true, filter: s => !s.endsWith('.map')});
  fs.cpSync(path.join(vite, 'renderer'), path.join(runtime, 'renderer'), {recursive: true, filter: s => !s.endsWith('.map')});
  fs.copyFileSync(path.join(__dirname, 'launch.cjs'), path.join(runtime, 'launch.cjs'));
  fs.writeFileSync(path.join(runtime, 'package.json'), JSON.stringify({name: 'atoumweb-preproduction', productName: title, version: '0.1.0', main: 'launch.cjs'}, null, 1));
  fs.cpSync(electronDist, path.join(target, 'Electron'), {recursive: true});
  const head = git('rev-parse', 'HEAD'), branch = git('rev-parse', '--abbrev-ref', 'HEAD');
  fs.writeFileSync(path.join(target, 'PREPRODUCTION.json'), JSON.stringify({mode: 'PREPRODUCTION_TEST', root: target, title, branch, commit: head,
    creeLe: new Date().toISOString(), baseInitiale: {fichier: prepared, sha256: report.output.sha256, apresRelocalisation: sha(dbFile)},
    origine: path.resolve(from), cheminsProjetsRelocalises: relocated}, null, 2));
  fs.writeFileSync(path.join(target, 'OUVRIR.cmd'), '@echo off\r\nsetlocal\r\nset ELECTRON_RUN_AS_NODE=\r\nstart "" "%~dp0Electron\\electron.exe" "%~dp0Runtime\\launch.cjs"\r\nendlocal\r\n');
  console.log(JSON.stringify({dest: target, commit: head, branch, relocated: relocated.length, dbSha256: sha(dbFile)}, null, 1));
} catch (error) {
  if (created) fs.rmSync(target, {recursive: true, force: true});
  console.error('REFUSÉ — ' + error.message); process.exitCode = 1;
}
