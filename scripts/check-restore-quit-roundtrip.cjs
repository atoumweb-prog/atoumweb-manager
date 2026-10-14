/*
 * UX-01 / UX-16. Opt-in real Electron process round-trip, only on fixtures
 * created under a new OS temp directory. This does not launch the user's Manager.
 * Node wrapper: node scripts/check-restore-quit-roundtrip.cjs
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn, spawnSync } = require('node:child_process');
const repo = path.resolve(__dirname, '..');
const PREFIX = 'atoumweb-ux01-restore-roundtrip-';
const TAG = 'UX01_RESTORE_ROUNDTRIP:';
const key = 'ux01-restore-roundtrip-fixture';
const markerName = 'pending-database-restore.json';

function assert(condition, message) {
  if (!condition) throw Error(message);
}
function rootFor(profile, temp) { return path.join(temp, profile); }
function marker(profile, temp) { return path.join(rootFor(profile, temp), 'profile', markerName); }
function workspacePath(profile, temp) { return path.join(rootFor(profile, temp), 'workspace'); }
function report(stage, details) {
  // Synchronous output survives Electron's immediate app.exit/app.quit lifecycle.
  fs.writeSync(1, TAG + JSON.stringify({ stage, ...details }) + '\n');
}

if (!process.versions.electron) {
  // No user-selected paths or shell expressions are accepted by this harness.
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), PREFIX));
  const env = { ...process.env, ATOUMWEB_UX01_RESTORE_ROUNDTRIP_ROOT: temp };
  delete env.ELECTRON_RUN_AS_NODE;
  delete env.ATOUMWEB_UNSAVED_TEMP;
  let activeChild = null;
  let interrupted = false;
  const terminate = child => {
    if (!child?.pid) return;
    // Kill ONLY the Electron fixture PID and its subprocesses, never the Manager.
    if (process.platform === 'win32') {
      spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'],
        { windowsHide: true, timeout: 10000, stdio: 'ignore' });
    } else {
      child.kill('SIGKILL');
    }
  };
  const onInterrupt = () => {
    interrupted = true;
    console.error('\n[UX01] Interrupted: stopping the temporary Electron test process.');
    terminate(activeChild);
  };
  process.on('SIGINT', onInterrupt);

  async function run(stage, electronExe) {
    if (interrupted) throw Error('Interrupted before ' + stage);
    console.log('\n[UX01] Starting Electron stage:', stage);
    let stdout = '';
    let stderr = '';
    const startedAt = Date.now();
    const result = await new Promise((resolve, reject) => {
      const child = spawn(electronExe, [__filename, '--stage=' + stage], {
        cwd: repo, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
      });
      activeChild = child;
      let settled = false;
      const timeout = setTimeout(() => {
        if (!settled) {
          console.error('[UX01] TIMEOUT in ' + stage + ': Electron process did not finish.');
          terminate(child);
          reject(Error('Timeout in Electron stage ' + stage));
          settled = true;
        }
      }, 90000);
      child.stdout.on('data', chunk => {
        const part = chunk.toString('utf8');
        stdout += part;
        process.stdout.write('[electron:' + stage + '] ' + part);
      });
      child.stderr.on('data', chunk => {
        const part = chunk.toString('utf8');
        stderr += part;
        process.stderr.write('[electron:' + stage + '] ' + part);
      });
      child.on('error', error => {
        if (!settled) { settled = true; clearTimeout(timeout); reject(error); }
      });
      // Windows subprocesses can keep inherited stdout/stderr pipes open
      // after the Electron PID has exited. Log that distinction explicitly.
      child.on('exit', (code, signal) => {
        console.log('[UX01] Electron PID exited:', stage, { code, signal });
        const drain = setTimeout(() => {
          if (settled) return;
          console.log('[UX01] Electron exited but inherited pipes stayed open; closing test streams.');
          child.stdout.destroy();
          child.stderr.destroy();
          clearTimeout(timeout);
          if (activeChild === child) activeChild = null;
          settled = true;
          resolve({ code, signal });
        }, 1500);
        drain.unref();
      });
      child.on('close', (code, signal) => {
        clearTimeout(timeout);
        if (activeChild === child) activeChild = null;
        if (!settled) { settled = true; resolve({ code, signal }); }
      });
    });
    if (interrupted) throw Error('Interrupted during ' + stage);
    if (result.code !== 0) throw Error('Electron ' + stage + ' FAILED (exit='
      + result.code + ', signal=' + result.signal + '):\n' + stdout + '\n' + stderr);
    const messages = stdout.split(/\r?\n/)
      .filter(line => line.startsWith(TAG))
      .map(line => JSON.parse(line.slice(TAG.length)));
    assert(messages.length === 1 && messages[0].stage === stage,
      'Missing stage report from ' + stage + '\n' + stdout + '\n' + stderr);
    console.log('[UX01] PASS ' + stage + ' (' + ((Date.now() - startedAt) / 1000).toFixed(1) + 's)');
    return messages[0];
  }

  async function main() {
    let checks = 0;
    try {
      console.log('[UX01] Temporary isolated SQLite/Electron round-trip. No user workspace.');
      console.log('[UX01] Bundling services for Electron...');
      const base = repo.replaceAll('\\', '/');
      const esbuild = require('esbuild');
      esbuild.buildSync({
        stdin: {
          contents: ['database/DatabaseService', 'workspace', 'restore', 'unsaved', 'restoreQuitGate']
            .map(file => "export * from '" + base + "/src/main/" + file + "';").join('\n') +
             "\nexport { MIGRATIONS as EXPECTED_MIGRATIONS } from '" + base + "/src/main/database/migrations';",
          resolveDir: repo, loader: 'ts',
        },
        bundle: true, platform: 'node', format: 'cjs',
        outfile: path.join(temp, 'services.cjs'),
        external: ['electron'], logLevel: 'silent',
      });
      const electronExe = require('electron');
      await run('accepted-quit', electronExe); checks++;
      const acceptedMarker = marker('accepted', temp);
      assert(fs.existsSync(acceptedMarker), 'Accepted quit did not write marker'); checks++;
      const request = JSON.parse(fs.readFileSync(acceptedMarker, 'utf8'));
      assert(request.state === 'pending' && request.version === 2, 'Accepted marker invalid'); checks++;
      const expectedRoot = fs.realpathSync.native(workspacePath('accepted', temp));
      const normal = v => process.platform === 'win32' ? v.toLowerCase() : v;
      assert(normal(path.resolve(request.workspaceRoot)) === normal(expectedRoot),
        'Accepted restore targets wrong workspace'); checks++;
      assert(fs.existsSync(request.sourcePath), 'Accepted source absent'); checks++;
      await run('accepted-restart', electronExe); checks++;
      assert(!fs.existsSync(acceptedMarker), 'Accepted marker replayable after restart'); checks++;
      await run('accepted-restart-again', electronExe); checks++;
      await run('refused-quit', electronExe); checks++;
      assert(!fs.existsSync(marker('refused', temp)), 'Refused quit left a restore marker'); checks++;
      await run('refused-restart', electronExe); checks++;
      assert(!fs.existsSync(marker('refused', temp)), 'Refused restore appeared on restart'); checks++;
      report('summary', { checks, failed: 0,
        limitation: 'Native Electron process with production services; not an installed packaged executable.' });
    } catch (error) {
      console.error('[UX01] FAILED:', error instanceof Error ? error.stack : error);
      process.exitCode = interrupted ? 130 : 1;
    } finally {
      if (activeChild) terminate(activeChild);
      process.removeListener('SIGINT', onInterrupt);
      // Delete ONLY our own mkdtemp fixture. Never touch Validation-MSI.
      const parent = fs.realpathSync.native(path.dirname(temp));
      const allowedParent = fs.realpathSync.native(os.tmpdir());
      if (parent !== allowedParent || !path.basename(temp).startsWith(PREFIX))
        throw Error('Unsafe fixture cleanup refused: ' + temp);
      fs.rmSync(temp, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
      console.log('[UX01] Fixture cleaned:', !fs.existsSync(temp));
    }
  }
  void main();
} else {
  const { app, dialog, BrowserWindow } = require('electron');
  // Never let a native fixture spawn an unattended modal confirmation.
  dialog.showMessageBoxSync = () => 0;
  dialog.showErrorBox = (title, message) => {
    console.error('[UX01 child] Nonmodal Electron error:', title, message);
  };
  const temp = process.env.ATOUMWEB_UX01_RESTORE_ROUNDTRIP_ROOT;
  const stageArg = process.argv.find(arg => arg.startsWith('--stage='));
  const stage = stageArg?.slice('--stage='.length);
  const allowed = ['accepted-quit', 'accepted-restart', 'accepted-restart-again', 'refused-quit', 'refused-restart'];
  if (!temp || !allowed.includes(stage)) throw Error('Only the Node wrapper may launch this recipe');
  const profile = stage.startsWith('accepted-') ? 'accepted' : 'refused';
  const dataRoot = rootFor(profile, temp);
  const profilePath = path.join(dataRoot, 'profile');
  fs.mkdirSync(profilePath, { recursive: true });
  app.disableHardwareAcceleration();
  app.setPath('userData', profilePath);
  app.on('window-all-closed', () => {});
  const S = require(path.join(temp, 'services.cjs'));
  let db, testWindow;
  let beforeQuitCount = 0, willQuitCount = 0;
  app.on('before-quit', () => {
    beforeQuitCount++;
    console.log('[UX01 child] EVENT before-quit count=' + beforeQuitCount);
  });
  app.on('will-quit', () => {
    willQuitCount++;
    console.log('[UX01 child] EVENT will-quit count=' + willQuitCount);
  });
  console.log('[UX01 child] waiting for Electron ready, stage=' + stage);
  app.whenReady().then(async () => {
    console.log('[UX01 child] Electron ready; opening TEMP workspace');
    const workspace = S.ensureWorkspace(workspacePath(profile, temp));
    if (stage === 'accepted-quit' || stage === 'refused-quit') {
      db = new S.DatabaseService(workspace);
      console.log('[UX01 child] Initializing SQLite fixture...');
      await db.initialize();
      console.log('[UX01 child] SQLite initialized');
      db.setSetting(key, 'before');
      console.log('[UX01 child] Creating isolated manual SQLite backup...');
      const rawBackup = await db.createBackup('manual');
      // The Node sqlite backup API can leave WAL/SHM sidecars around its output.
      // NEVER delete/copy around those: read through SQLite and export a clean
      // standalone snapshot with VACUUM INTO (same method as restore.test.ts).
      // Both inputs and outputs exist ONLY in our temporary workspace.
      const { DatabaseSync } = require('node:sqlite');
      const source = path.join(workspace.backupsDirectory, 'manual', 'roundtrip-standalone.sqlite');
      const backupReader = new DatabaseSync(rawBackup, { readOnly: true });
      try {
        backupReader.prepare('VACUUM INTO ?').run(source);
      } finally {
        backupReader.close();
      }
      const annexes = ['-wal', '-shm', '-journal']
        .filter(suffix => fs.existsSync(source + suffix));
      assert(annexes.length === 0, 'Standalone fixture source has SQLite sidecars: ' + annexes.join(', '));
      const validation = S.validateRestoreSource(source);
      assert(validation.migrationCount === S.EXPECTED_MIGRATIONS.length, 'Standalone fixture schema is incompatible with current migrations');
      console.log('[UX01 child] Standalone restore source ready: validated',
        validation.migrationCount, 'migrations, no SQLite sidecars');
      db.setSetting(key, 'after');
      const cleanup = () => { db?.close(); db = null; };
      S.registerGuardedShutdown(cleanup);
      // A real (hidden) Electron window makes this an actual window shutdown,
      // not a degenerate app.quit() path with no BrowserWindow ever created.
      testWindow = new BrowserWindow({
        show: false, width: 320, height: 240,
        webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
      });
      S.bindUnsavedWindow(testWindow);
      await testWindow.loadURL('data:text/html;charset=utf-8,<title>UX01 isolated quit fixture</title>');
      console.log('[UX01 child] TEMP BrowserWindow loaded; id=' + testWindow.id);
      if (stage === 'accepted-quit') {
        // Record only AFTER actual will-quit, when the production listener
        // has committed the pending restore and closed the SQLite connection.
        S.restoreQuitGate.arm(() => S.scheduleDatabaseRestore(source, workspace));
        let acceptedReported = false;
        app.once('will-quit', () => {
          try {
            assert(beforeQuitCount > 0, 'Accepted lifecycle skipped before-quit');
            assert(willQuitCount === 1, 'Accepted lifecycle did not reach will-quit exactly once');
            assert(testWindow.isDestroyed(), 'Accepted quit did not close the temporary BrowserWindow');
            assert(!db, 'Accepted lifecycle did not close SQLite');
            const pendingPath = marker(profile, temp);
            assert(fs.existsSync(pendingPath), 'Accepted lifecycle did not commit marker');
            const data = JSON.parse(fs.readFileSync(pendingPath, 'utf8'));
            assert(data.state === 'pending' && data.version === 2, 'Marker written incorrectly');
            acceptedReported = true;
            report(stage, { willQuitObserved: true, sqliteClosed: true,
              markerCommitted: true, windowClosed: testWindow.isDestroyed(),
              sourceCreated: fs.existsSync(source) });
            // Exit explicitly only AFTER Electron approved will-quit.
            // A test must not report success merely because app.quit() was called.
            app.exit(0);
          } catch (error) {
            console.error('[UX01 child] Accepted lifecycle failed:', error.stack || error);
            app.exit(1);
          }
        });
        setTimeout(() => {
          if (acceptedReported) return;
          console.error('[UX01 child] app.quit() failed to reach will-quit;',
            { beforeQuitCount, willQuitCount,
              markerExists: fs.existsSync(marker(profile, temp)),
              windowAlive: !!testWindow && !testWindow.isDestroyed() });
          app.exit(1);
        }, 12000);
        console.log('[UX01 child] Requesting accepted app.quit()...');
        app.quit();
      } else {
        // A pending save must veto an actual quit, preserving the open window.
        S.unsavedWindows.update(testWindow.id, {
          epoch: 'temporary-renderer', revision: 1,
          labels: ['Devis — fixture'], pending: true,
        });
        S.restoreQuitGate.arm(() => S.scheduleDatabaseRestore(source, workspace));
        console.log('[UX01 child] Requesting app.quit() with pending save...');
        app.quit();
        assert(beforeQuitCount > 0, 'Refused quit did not reach before-quit');
        assert(willQuitCount === 0, 'Refused quit incorrectly reached will-quit');
        assert(!testWindow.isDestroyed(), 'Refused quit unexpectedly destroyed test window');
        assert(!fs.existsSync(marker(profile, temp)), 'Quit refusal left a marker');
        assert(!S.restoreQuitGate.commitOnQuit(), 'Quit refusal left a live gate');
        assert(db.getSetting(key, null) === 'after', 'Quit refusal changed open SQLite');
        report(stage, { quitRefused: true, beforeQuitObserved: true, willQuitObserved: false,
          dbOpen: true, windowStillOpen: true, markerAbsent: true });
        S.unsavedWindows.remove(testWindow.id);
        cleanup();
        app.exit(0);
      }
      return;
    }

    console.log('[UX01 child] Checking/applying restore at new Electron launch...');
    const result = await S.applyPendingDatabaseRestore(workspace);
    if (stage === 'accepted-restart') {
      assert(result.restored === true, 'Accepted restore not executed at restart');
      assert(!!result.safetyBackupPath && fs.existsSync(result.safetyBackupPath),
        'Pre-restore safety copy missing');
      const live = new S.DatabaseService(workspace);
      await live.initialize();
      assert(live.getSetting(key, null) === 'before', 'Restored content differs from original backup');
      assert(live.health().migrationCount === S.EXPECTED_MIGRATIONS.length, 'Incorrect migration count');
      live.close();
      const { DatabaseSync } = require('node:sqlite');
      const safety = new DatabaseSync(result.safetyBackupPath, { readOnly: true });
      try {
        const rows = safety.prepare('SELECT value_json FROM settings WHERE key=?').get(key);
        assert(JSON.parse(rows.value_json) === 'after', 'Safety backup did not preserve overwritten state');
        assert(safety.prepare('PRAGMA integrity_check').get().integrity_check === 'ok', 'Safety backup corrupt');
        assert(safety.prepare('PRAGMA foreign_key_check').all().length === 0, 'Safety backup foreign keys');
      } finally { safety.close(); }
    } else if (stage === 'accepted-restart-again') {
      assert(result.restored === false, 'Accepted restore replayed at second restart');
    } else if (stage === 'refused-restart') {
      assert(result.restored === false, 'Refused restore unexpectedly executed');
      const live = new S.DatabaseService(workspace);
      await live.initialize();
      assert(live.getSetting(key, null) === 'after', 'Refused restart changed SQLite');
      live.close();
    }
    assert(!fs.existsSync(marker(profile, temp)), 'Pending marker remains at restart');
    report(stage, { restored: result.restored, expected: stage === 'accepted-restart', markerAbsent: true });
    app.exit(0);
  }).catch(error => {
    console.error(error?.stack || error);
    try { db?.close(); } finally { app.exit(1); }
  });
}