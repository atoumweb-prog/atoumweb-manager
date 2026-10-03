// Always works on a temporary SQLite backup. No real-database apply command is exposed.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const repo = path.resolve(__dirname, '..');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'atoumweb-catalog-import-'));
try {
  const bundle = path.join(temporary, 'simulate.cjs');
  require('esbuild').buildSync({ entryPoints: [path.join(repo, 'scripts/simulate-catalogue-v1-import.ts')],
    bundle: true, platform: 'node', format: 'cjs', target: 'node24', outfile: bundle, logLevel: 'silent' });
  const result = spawnSync(require('electron'), [bundle, ...process.argv.slice(2)], {
    cwd: repo, env: { ...process.env, ELECTRON_RUN_AS_NODE: '1', ATOUMWEB_CATALOG_IMPORT_TEMP: temporary },
    windowsHide: true, encoding: 'utf8', timeout: 120000,
  });
  process.stdout.write(result.stdout || ''); process.stderr.write(result.stderr || '');
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  const resolved = path.resolve(temporary);
  if (!resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) || !path.basename(resolved).startsWith('atoumweb-catalog-import-')) throw Error('Chemin temporaire invalide');
  fs.rmSync(resolved, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
}
