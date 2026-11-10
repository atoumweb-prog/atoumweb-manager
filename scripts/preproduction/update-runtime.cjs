'use strict';
// Met à jour SEULEMENT le Manager (Runtime) d'une préproduction existante, sans toucher
// à ses données (Workspace) ni à son profil. Manager de la préproduction fermé obligatoire.
// Usage : node scripts/preproduction/update-runtime.cjs --dest <dossier de préproduction>
const fs = require('node:fs'), path = require('node:path'), {spawnSync} = require('node:child_process');
const arg = k => { const i = process.argv.indexOf(k); return i < 0 ? null : process.argv[i + 1]; };
const dest = arg('--dest');
if (!dest) { console.error('Usage : --dest <dossier de préproduction>'); process.exit(2); }
const repo = path.resolve(__dirname, '..', '..'), target = path.resolve(dest);
const git = (...a) => spawnSync('git', ['-C', repo, ...a], {encoding: 'utf8'}).stdout.trim();
const check = (ok, why) => { if (!ok) { console.error('REFUSÉ — ' + why); process.exit(1); } };

const metaFile = path.join(target, 'PREPRODUCTION.json');
check(fs.existsSync(metaFile), 'Ce dossier n’est pas une préproduction assemblée par assemble-preproduction.cjs.');
const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
check(meta.mode === 'PREPRODUCTION_TEST', 'Préproduction invalide.');
check(!git('status', '--porcelain', '--', 'src'), 'Code source non enregistré : commit requis avant mise à jour.');
const vite = path.join(repo, '.vite');
check(fs.existsSync(path.join(vite, 'build', 'main.js')), 'Manager non compilé : lancer « npx electron-forge package » avant.');
// Manager ouvert ? Le verrou d'instance unique de Chromium vit dans le profil.
const running = spawnSync('powershell.exe', ['-NoProfile', '-Command',
  `Get-CimInstance Win32_Process -Filter "Name='electron.exe'" | Where-Object { $_.CommandLine -like '*${target.replace(/'/g, "''")}*' } | Measure-Object | Select-Object -ExpandProperty Count`], {encoding: 'utf8'}).stdout.trim();
check(running === '0', 'La préproduction est ouverte : ferme-la avant la mise à jour.');

const runtime = path.join(target, 'Runtime'), stamp = new Date().toISOString().replace(/[:.]/g, '-');
const previous = path.join(target, 'Runtime-precedents', stamp);
fs.mkdirSync(previous, {recursive: true});
for (const d of ['build', 'renderer']) if (fs.existsSync(path.join(runtime, d))) fs.renameSync(path.join(runtime, d), path.join(previous, d));
fs.cpSync(path.join(vite, 'build'), path.join(runtime, 'build'), {recursive: true, filter: s => !s.endsWith('.map')});
fs.cpSync(path.join(vite, 'renderer'), path.join(runtime, 'renderer'), {recursive: true, filter: s => !s.endsWith('.map')});
fs.copyFileSync(path.join(__dirname, 'launch.cjs'), path.join(runtime, 'launch.cjs'));
const head = git('rev-parse', 'HEAD');
meta.historique = [...(meta.historique ?? [{commit: meta.commit, le: meta.creeLe}]), {commit: head, le: new Date().toISOString(), precedentConserveDans: previous}];
meta.commit = head; meta.branch = git('rev-parse', '--abbrev-ref', 'HEAD');
fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2));
console.log(JSON.stringify({miseAJour: target, commit: head, ancienManagerConserve: previous}, null, 1));
