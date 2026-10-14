/*
 * Opt-in Windows validation of the REAL packaged backups:restore IPC and
 * app.relaunch() using a throwaway, separately packaged Electron fixture.
 * This does not package, install or launch the AtoumWeb Manager executable.
 * Every database, profile and binary lives inside one new OS TEMP directory.
 * Run from repository root: node scripts/check-ux01-packaged-relaunch.cjs
 */
'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const { setTimeout: delay } = require('node:timers/promises');
const repo = path.resolve(__dirname, '..');
const prefix = 'atoumweb-ux01-packaged-';
const prefixLog = '[UX01 packaged runner]';
function assert(value, message) { if (!value) throw new Error(message); }
function readJSON(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function secureRemove(folder) {
  const actualParent = fs.realpathSync.native(path.dirname(folder));
  const expectedParent = fs.realpathSync.native(os.tmpdir());
  const normalize = s => process.platform === 'win32' ? s.toLowerCase() : s;
  assert(normalize(actualParent) === normalize(expectedParent) &&
    path.basename(folder).startsWith(prefix), 'Unsafe cleanup path: ' + folder);
  fs.rmSync(folder, { force: true, recursive: true, maxRetries: 8, retryDelay: 200 });
}
function recentEvents(folder) {
  const logfile = path.join(folder, 'events.ndjson');
  if (!fs.existsSync(logfile)) return '(no packaged process events)';
  return fs.readFileSync(logfile, 'utf8').trim().split(/\r?\n/).slice(-20).join('\n');
}
function buildApp(directory, folder) {
  const esbuild = require('esbuild');
  const input = path.join(folder, 'package-input');
  fs.mkdirSync(input);
  const files = [
    ['scripts/fixtures/ux01-packaged-main.cjs', 'main.cjs'],
    ['scripts/fixtures/ux01-packaged-preload.cjs', 'preload.cjs'],
  ];
  for (const [from, to] of files)
    fs.copyFileSync(path.join(directory, from), path.join(input, to));
  fs.writeFileSync(path.join(input, 'fixture.html'), '<!DOCTYPE html><html><body>UX01 isolated packaged fixture</body></html>');
  fs.writeFileSync(path.join(input, 'package.json'), JSON.stringify({
    name: 'atoumweb-ux01-packaged-fixture', version: '0.0.1',
    private: true, main: 'main.cjs', description: 'TEMP restore test only',
  }, null, 2));
  const base = directory.replaceAll('\\', '/');
  console.log(prefixLog, 'Bundling production backup/IPC/shutdown services from the test worktree...');
  esbuild.buildSync({
    stdin: { contents: ['database/DatabaseService', 'database/migrations', 'workspace', 'restore', 'ipc', 'unsaved', 'restoreQuitGate']
      .map(s => "export * from '" + base + '/src/main/' + s + "';").join('\n'),
      resolveDir: directory, loader: 'ts' },
    bundle: true, platform: 'node', format: 'cjs',
    outfile: path.join(input, 'services.cjs'),
    external: ['electron'], logLevel: 'silent',
  });
  assert(fs.statSync(path.join(input, 'services.cjs')).size > 10000,
    'Production bundle unexpectedly empty');
  return input;
}
function launch(binary, folder, token, scenario) {
  const env = { ...process.env, ATOUMWEB_UX01_PACKAGED_ROOT: folder,
    ATOUMWEB_UX01_PACKAGED_TOKEN: token };
  delete env.ELECTRON_RUN_AS_NODE;
  const child = spawn(binary, [], {
    env,
    cwd: folder, stdio: 'ignore', windowsHide: true,
  });
  const settled = new Promise(resolve => {
    child.once('error', error => resolve({ error: String(error) }));
    child.once('exit', (code, signal) => resolve({ code, signal }));
  });
  console.log(prefixLog, 'Started isolated', scenario, 'packaged PID', child.pid);
  return { child, settled };
}
async function waitFor(folder, target, timeoutMs, liveProcess) {
  const start = Date.now();
  let lastPrint = -1;
  while (Date.now() - start < timeoutMs) {
    const result = path.join(folder, 'result.json');
    if (fs.existsSync(result)) {
      const data = readJSON(result);
      if (!data.passed) throw Error('Packaged fixture failure: ' + data.error);
      if (target === 'result') return data;
    }
    const indicator = path.join(folder, target);
    if (target !== 'result' && fs.existsSync(indicator)) return readJSON(indicator);
    if (liveProcess && !liveProcess.child.pid) throw Error('Failed to spawn packaged process');
    const elapsed = Math.floor((Date.now() - start) / 1000);
    if (elapsed > 0 && elapsed % 5 === 0 && elapsed !== lastPrint) {
      lastPrint = elapsed;
      console.log(prefixLog, 'Awaiting', target, '(' + elapsed + 's)');
    }
    await delay(200);
  }
  throw Error('Timed out awaiting ' + target + ' after ' + timeoutMs + 'ms');
}
async function runner() {
  assert(process.platform === 'win32', 'Packaged relaunch recipe runs only on native Windows');
  assert(!process.versions.electron, 'Use Node to launch the package test, not Electron');
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  const token = crypto.randomUUID();
  let success = false;
  try {
    console.log(prefixLog, 'Working entirely inside', folder);
    const packagerModule = require('@electron/packager');
    const packager = typeof packagerModule === 'function' ? packagerModule : packagerModule.packager;
    assert(typeof packager === 'function', 'No @electron/packager function available');
    const pkgElectronVersion = require('electron/package.json').version;
    const source = buildApp(repo, folder);
    console.log(prefixLog, 'Packaging an independent fixture (not AtoumWeb Manager, not an MSI)...');
    const candidates = await packager({ dir: source, out: path.join(folder, 'release'),
      overwrite: false, asar: true, prune: false,
      platform: 'win32', arch: process.arch,
      name: 'AtoumWeb UX01 Fixture', executableName: 'atoumweb-ux01-fixture',
      electronVersion: pkgElectronVersion, quiet: true });
    assert(candidates.length === 1, 'Expected exactly one packaged fixture executable');
    const binary = path.join(candidates[0], 'atoumweb-ux01-fixture.exe');
    assert(fs.existsSync(binary), 'Packaged fixture executable not present');
    console.log(prefixLog, 'Packaged fixture ready. Version:', pkgElectronVersion);
    for (const scenario of ['accepted', 'refused']) {
      const scope = path.join(folder, scenario);
      fs.mkdirSync(scope);
      fs.writeFileSync(path.join(scope, 'fixture-guard.json'), JSON.stringify({
        token, createdBy: 'ux01-packaged-node-wrapper', scenario,
      }));
      console.log(prefixLog, 'Starting scenario', scenario);
      const initial = launch(binary, scope, token, scenario);
      if (scenario === 'accepted') {
        // Production IPC is responsible for spawning the SECOND packaged process.
        const outcome = await waitFor(scope, 'result', 90000, initial);
        assert(outcome.passed && outcome.restored && outcome.distinctPid && outcome.safetyBackup,
          'Accepted packaged relaunch evidence incomplete');
        assert(fs.existsSync(path.join(scope, 'accepted-willquit.json')),
          'Missing original packaged process will-quit audit');
        console.log(prefixLog, 'PASS actual app.relaunch(), restore, pre-restore and new packaged PID');
      } else {
        const refusal = await waitFor(scope, 'refused-beforequit.json', 60000, initial);
        assert(refusal.beforeQuit && !refusal.willQuit && refusal.windowOpen && refusal.markerAbsent,
          'Refused packaged quit evidence incomplete');
        const stopped = await Promise.race([
          initial.settled, delay(10000).then(() => ({ timeout: true })),
        ]);
        assert(!stopped.timeout && stopped.code === 0,
          'Refused fixture first process did not exit after its assertions');
        console.log(prefixLog, 'Refused packaged quit did not relaunch; verifying subsequent manual start...');
        const manual = launch(binary, scope, token, scenario);
        const outcome = await waitFor(scope, 'result', 60000, manual);
        assert(outcome.passed && outcome.restored === false && outcome.markerAbsent,
          'Refused packaged restore was unexpectedly applied');
        console.log(prefixLog, 'PASS refused quit and later launch with no unexpected restore');
      }
      // Give the fixture process time to relinquish the test executable/SQLite handles.
      await delay(1000);
      console.log(prefixLog, 'Recent packaged events:\n' + recentEvents(scope));
    }
    success = true;
    console.log(prefixLog, 'SUCCESS: independent packaged app, real IPC, app.relaunch, SQLite restore and refusal.');
  } catch (error) {
    console.error(prefixLog, 'FAILED:', error.stack || error);
    console.error(prefixLog, 'The last process events from TEMP are available for diagnosis:');
    for (const part of ['accepted', 'refused']) {
      const base = path.join(folder, part);
      if (fs.existsSync(base)) console.error('---' + part + '---\n' + recentEvents(base));
    }
    process.exitCode = 1;
  } finally {
    if (success) {
      try { secureRemove(folder); console.log(prefixLog, 'Fixture cleaned: true'); }
      catch (error) { console.error(prefixLog, 'TEMP cleanup failed:', error.message); process.exitCode = 1; }
    } else {
      // Do not recursively delete a running package or blindly kill arbitrary Windows PIDs.
      console.error(prefixLog, 'Fixture retained for diagnosis ONLY in:', folder);
      console.error(prefixLog, 'No installed Manager or actual user workspace was touched.');
    }
  }
}
void runner();
