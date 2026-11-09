'use strict';
// Same real App/preload/IPC launcher as lot 1, with only the lot 2 scenario.
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process');
const repo = path.resolve(__dirname, '..'), out = process.env.ATOUMWEB_SITES_LOT2_OUTPUT;
if (!out || !path.isAbsolute(out) || fs.existsSync(out) || /validation-msi/i.test(out)) throw Error('Use a new absolute output directory outside user data.');
fs.mkdirSync(out, { recursive: true });
fs.mkdirSync(path.join(repo, 'outputs'), { recursive: true });
const source = fs.readFileSync(path.join(__dirname, 'check-ux-v2-lot01a-real-ui.cjs'), 'utf8');
const needle = "require('./fixtures/02c-search-scenarios.cjs')";
const scenario = process.argv.includes('--read-only') ? 'sites-pages-readonly.cjs' : 'sites-pages-lot2.cjs';
if (source.split(needle).length !== 2) throw Error('Native launcher seam changed');
const generated = path.join(repo, 'outputs', 'sites-pages-lot2-' + Date.now() + '.cjs');
fs.writeFileSync(generated, source.replace(needle, `require(path.join(repo,'scripts','fixtures','${scenario}'))`)
  .replace('Array.from({length:74}', 'Array.from({length:80}')
  .replace('app.disableHardwareAcceleration();', "app.commandLine.appendSwitch('force-device-scale-factor','1');app.disableHardwareAcceleration();"), { flag: 'wx' });
try {
  const result = cp.spawnSync(process.execPath, [generated, '--search-only'], { cwd: repo, env: process.env, windowsHide: true, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  fs.writeFileSync(path.join(out, 'execution.log'), (result.stdout || '') + (result.stderr || ''));
  process.stdout.write(result.stdout || ''); process.stderr.write(result.stderr || '');
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally { fs.unlinkSync(generated); }
