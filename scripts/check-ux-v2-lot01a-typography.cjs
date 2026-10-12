/*
 * UX/UI V2 — Lot 01A (R01A-01, R01A-02, R01A-07).
 * Real Chromium computed-style smoke test using the Manager's CSS import order.
 * Only a temporary HTML page is loaded. No database, IPC, Manager window or
 * real workspace is ever opened.
 *
 * node scripts/check-ux-v2-lot01a-typography.cjs
 */
'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const repo = path.resolve(__dirname, '..');
const PREFIX = 'atoumweb-uxv2-lot01a-';
const ENV_ROOT = 'ATOUMWEB_UXV2_LOT01A_TMP';
const SUMMARY = 'UXV2_LOT01A:';
const densities = { compact: [14, 14, 36], comfort: [16, 16, 42], comfort_plus: [18, 18, 48] };
const themes = ['atoumweb', 'noir', 'blanc'];
const checkedRoles = [
  'body', '.prospect-card', '.operations-stack', '.projects-stack',
  '.catalog-stack', '.quotes-stack', '.time-page-stack', '.aw-library',
];
function assert(value, message) {
  if (!value) throw new Error(message);
}
function allowedTempDirectory(folder) {
  const canonicalParent = fs.realpathSync.native(path.dirname(folder));
  const canonicalTemp = fs.realpathSync.native(os.tmpdir());
  const normalized = value => process.platform === 'win32' ? value.toLowerCase() : value;
  return normalized(canonicalParent) === normalized(canonicalTemp)
    && path.basename(folder).startsWith(PREFIX);
}
function buildHtml(root) {
  const entry = fs.readFileSync(path.join(repo, 'src/renderer/main.tsx'), 'utf8');
  const cssImports = [...entry.matchAll(/^import '\.\/([^']+\.css)';$/gm)].map(m => m[1]);
  assert(cssImports.length >= 25, 'Expected full renderer CSS import chain');
  for (const required of ['styles.css', 'display-density.css',
    'ui-typography-consistency.css', 'ui-consistency-v2.css'])
    assert(cssImports.includes(required), 'Missing renderer style import ' + required);
  assert(cssImports.indexOf('display-density.css') < cssImports.indexOf('ui-typography-consistency.css')
    && cssImports.indexOf('ui-typography-consistency.css') < cssImports.indexOf('ui-consistency-v2.css'),
  'CSS precedence changed: update Lot 01A recipe');
  const css = cssImports.map(file => {
    assert(!file.includes('/') && !file.includes('\\'), 'Unexpected CSS import path');
    return '/* UX-01A SOURCE: ' + file + ' */\n' +
      fs.readFileSync(path.join(repo, 'src/renderer', file), 'utf8');
  }).join('\n');
  assert(!css.includes('</style'), 'Unsafe CSS content for fixture HTML');
  const styles = checkedRoles.slice(1).map((selector, i) => {
    const id = 'role' + i;
    return '<section class="' + selector.slice(1) + '" id="' + id + '">Texte de test</section>';
  }).join('\n');
  const html = '<!doctype html><html lang="fr"><head><meta charset="utf-8">'
    + '<style>' + css + '</style></head><body><main id="uxv2fixture">'
    + styles + '<button class="primary-button" id="ux01a-button">Tester</button>'
    + '<span class="muted" id="ux01a-secondary">Secondaire</span>'
    + '</main></body></html>';
  fs.writeFileSync(path.join(root, 'fixture.html'), html, 'utf8');
  return { files: cssImports.length };
}
function parseColor(s) {
  const match = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(s);
  assert(match, 'Unexpected computed color ' + s);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}
function luminance(rgb) {
  const [r, g, b] = rgb.map(c => {
    const x = c / 255;
    return x <= .04045 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4);
  });
  return .2126 * r + .7152 * g + .0722 * b;
}
function contrast(a, b) {
  const c = luminance(parseColor(a)), d = luminance(parseColor(b));
  return (Math.max(c, d) + .05) / (Math.min(c, d) + .05);
}

if (!process.versions.electron) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), PREFIX));
  const env = { ...process.env, [ENV_ROOT]: root };
  delete env.ELECTRON_RUN_AS_NODE;
  let child;
  let aborted = false;
  let watchdog;
  const terminate = () => {
    aborted = true;
    if (child?.pid) {
      if (process.platform === 'win32') {
        const { spawnSync } = require('node:child_process');
        spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'],
          { windowsHide: true, timeout: 10000, stdio: 'ignore' });
      } else child.kill('SIGKILL');
    }
  };
  process.once('SIGINT', terminate);
  (async () => {
    try {
      const { files } = buildHtml(root);
      console.log('[UXV2 01A] Isolated Electron style test; CSS files in renderer order: ' + files);
      const exe = require('electron');
      const childResult = await new Promise((resolve, reject) => {
        child = spawn(exe, [__filename], { env, cwd: repo,
          windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
        let stdout = '', stderr = '';
        watchdog = setTimeout(() => {
          terminate();
          reject(new Error('Electron CSS smoke test exceeded 60 seconds'));
        }, 60000);
        child.stdout.on('data', part => {
          stdout += part.toString('utf8');
          process.stdout.write(part);
        });
        child.stderr.on('data', part => {
          stderr += part.toString('utf8');
          process.stderr.write(part);
        });
        let done = false;
        const finish = (code, signal) => {
          if (done) return;
          done = true;
          resolve({ code, signal, stdout, stderr });
        };
        child.once('error', error => {
          if (done) return;
          done = true;
          reject(error);
        });
        // Chromium subprocesses on Windows can retain inherited pipes after
        // the main Electron PID exits. Do not misdiagnose that as a hung test.
        child.once('exit', (code, signal) => {
          const drain = setTimeout(() => {
            if (done) return;
            child.stdout.destroy();
            child.stderr.destroy();
            finish(code, signal);
          }, 1500);
          drain.unref();
        });
        child.once('close', (code, signal) => finish(code, signal));
      });
      assert(!aborted && childResult.code === 0,
        'Electron CSS fixture failed (exit=' + childResult.code + ') ' + childResult.stderr);
      const reports = childResult.stdout.split(/\r?\n/)
        .filter(line => line.startsWith(SUMMARY)).map(line => JSON.parse(line.slice(SUMMARY.length)));
      assert(reports.length === 1, 'Missing unique CSS fixture report');
      const result = reports[0];
      assert(result.combinations === 9 && result.roleChecks === 72
        && result.controlChecks === 9 && result.contrastChecks === 9,
      'Incomplete CSS verification: ' + JSON.stringify(result));
      console.log('[UXV2 01A] PASS 3 themes × 3 densities; ' + result.roleChecks
        + ' computed font checks; ' + result.controlChecks + ' control heights; '
        + result.contrastChecks + ' body contrasts.');
    } catch (error) {
      console.error('[UXV2 01A] FAILED:', error.stack || error);
      process.exitCode = 1;
    } finally {
      clearTimeout(watchdog);
      if (allowedTempDirectory(root)) {
        fs.rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 250 });
        console.log('[UXV2 01A] Fixture cleaned: ' + !fs.existsSync(root));
      } else {
        console.error('[UXV2 01A] Unexpected temp path, not deleting: ' + root);
        process.exitCode = 1;
      }
    }
  })();
} else {
  const { app, BrowserWindow } = require('electron');
  const root = process.env[ENV_ROOT];
  assert(root && fs.existsSync(root) && allowedTempDirectory(root),
    'Never run 01A Electron fixture outside a dedicated OS TEMP directory.');
  app.disableHardwareAcceleration();
  app.setPath('userData', root);
  app.on('window-all-closed', () => {});
  app.whenReady().then(async () => {
    const win = new BrowserWindow({ show: false, width: 1240, height: 860,
      webPreferences: { sandbox: true, nodeIntegration: false, contextIsolation: true } });
    await win.loadFile(path.join(root, 'fixture.html'));
    let roleChecks = 0, controlChecks = 0, contrastChecks = 0;
    for (const theme of themes) for (const [density, sizes] of Object.entries(densities)) {
      const values = await win.webContents.executeJavaScript(
        'document.documentElement.dataset.theme=' + JSON.stringify(theme) + ';' +
        'document.documentElement.dataset.density=' + JSON.stringify(density) + ';' +
        '({base:getComputedStyle(document.documentElement).getPropertyValue("--ui-font-base").trim(),' +
        'control:getComputedStyle(document.documentElement).getPropertyValue("--ui-control-height").trim(),' +
        'font: Array.from(document.querySelectorAll("body,section#role0,section#role1,section#role2,section#role3,section#role4,section#role5,section#role6")).map(n=>getComputedStyle(n).fontSize),' +
        'color:getComputedStyle(document.body).color,background:getComputedStyle(document.body).backgroundColor})',
      );
      assert(values.base === sizes[0] + 'px',
        theme + '/' + density + ' base token is ' + values.base);
      assert(values.control === sizes[2] + 'px',
        theme + '/' + density + ' control height token is ' + values.control);
      assert(values.font.length === checkedRoles.length,
        theme + '/' + density + ' missing role selectors');
      for (let i = 0; i < checkedRoles.length; i++) {
        assert(values.font[i] === sizes[1] + 'px',
          theme + '/' + density + ' ' + checkedRoles[i] + ' computed as ' + values.font[i]);
        roleChecks++;
      }
      controlChecks++;
      const ratio = contrast(values.color, values.background);
      assert(ratio >= 4.5, theme + '/' + density + ' body contrast ' + ratio.toFixed(2));
      contrastChecks++;
      console.log('[UXV2 01A] PASS', theme, density,
        'base=' + values.base, 'body=' + values.font[0],
        'contrast=' + ratio.toFixed(2));
    }
    fs.writeSync(1, SUMMARY + JSON.stringify({ combinations: 9,
      roleChecks, controlChecks, contrastChecks }) + '\n');
    app.exit(0);
  }).catch(error => {
    console.error('[UXV2 01A child] FAILED:', error.stack || error);
    app.exit(1);
  });
}
