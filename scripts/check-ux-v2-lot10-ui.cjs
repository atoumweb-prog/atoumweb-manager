'use strict';
// Adaptation non destructive du banc existant ; aucune fixture réelle ou Validation-MSI.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const repo = path.resolve(__dirname, '..');
const sourcePath = path.join(repo, 'scripts', 'check-ux-v2-lot01a-real-ui.cjs');
const source = fs.readFileSync(sourcePath, 'utf8');
const needle = "require('./fixtures/02c-search-scenarios.cjs')";
if (source.split(needle).length !== 2) throw Error('Banc de référence modifié : seam introuvable.');
const folder = path.join(repo, 'outputs');
fs.mkdirSync(folder, { recursive: true });
const fixture = path.join(folder, 'lot10-owned-harness-' + Date.now() + '.cjs');
const replacement = "require(path.join(repo,'scripts','fixtures','lot10-real-scenarios.cjs'))";
fs.writeFileSync(fixture, source.replace(needle, replacement).replaceAll('02C_RESULT', 'LOT10_RESULT'), { flag: 'wx' });
try {
  const run = cp.spawnSync(process.execPath, [fixture, '--search-only'], { cwd: repo, env: process.env, encoding: 'utf8', windowsHide: true, maxBuffer: 32 * 1024 * 1024 });
  const log = (run.stdout || '') + (run.stderr || '');
  process.stdout.write(run.stdout || '');
  process.stderr.write(run.stderr || '');
  if (run.error) throw run.error;
  if (run.status !== 0 || !/LOT10_RESULT /.test(log) || !/Fixture cleaned: true/.test(log)) throw Error('Lot 10: assertions Electron ou nettoyage TEMP non attestés.');
} finally { fs.rmSync(fixture, { force: true }); }
