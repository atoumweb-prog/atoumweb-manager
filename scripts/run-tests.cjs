const { spawnSync } = require('node:child_process');
const path = require('node:path');

const electronPath = require('electron');
const vitestPath = require.resolve('vitest/vitest.mjs');

console.log(`Electron executable: ${electronPath}`);

const versionCheck = spawnSync(
  electronPath,
  ['-p', 'JSON.stringify(process.versions)'],
  {
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
    encoding: 'utf8',
  },
);

if (versionCheck.status !== 0) {
  process.stderr.write(versionCheck.stderr || 'Impossible de vérifier le runtime Electron.\n');
  process.exit(versionCheck.status || 1);
}

try {
  const versions = JSON.parse(versionCheck.stdout.trim());
  console.log(`Tests runtime: Electron ${versions.electron || 'n/a'} / Node ${versions.node}`);
} catch {
  console.log(`Tests runtime: ${versionCheck.stdout.trim()}`);
}

const result = spawnSync(
  electronPath,
  [vitestPath, 'run', ...process.argv.slice(2)],
  {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
    stdio: 'inherit',
  },
);

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
