// Generate a real Manager Page Package V2 for ephemeral WordPress/Bridge validation.
// Usage: node scripts/generate-ux07g-page-package.cjs <absolute output dir>
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const esbuild = require('esbuild');
if (!process.argv[2]) throw new Error('Output directory argument required');
const temp = mkdtempSync(join(tmpdir(), 'ux07g-page-generator-'));
try {
  const filename = join(temp, 'generate.cjs');
  esbuild.buildSync({
    entryPoints: [resolve(__dirname, 'fixtures/ux07g-generate-page-package.ts')],
    outfile: filename,
    platform: 'node',
    target: 'node24',
    format: 'cjs',
    bundle: true,
    logLevel: 'error',
  });
  require(filename);
} finally {
  rmSync(temp, { recursive: true, force: true });
}
