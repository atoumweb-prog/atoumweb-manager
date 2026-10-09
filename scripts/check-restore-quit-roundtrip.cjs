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
            .map(file => "export * from '" + base + "/src/main/" + file + "';").join('\n'),
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
  const { app, dialog } = require('electron');
  // Never let a native fixture spawn an unattended modal confirmation.
  dialog.showMessageBoxSync = () => 0;
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
  let db;
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
      const source = await db.createBackup('manual');
      db.setSetting(key, 'after');
      const cleanup = () => { db?.close(); db = null; };
      S.registerGuardedShutdown(cleanup);
      if (stage === 'accepted-quit') {
        S.restoreQuitGate.arm(() => S.scheduleDatabaseRestore(source, workspace));
        // Real Electron lifecycle: before-quit -> will-quit -> process exit.
        report(stage, { quitRequested: true, sourceCreated: fs.existsSync(source) });
        app.quit();
      } else {
        // Pending saving ALWAYS vetoes quit, regardless of dialog answers.
        S.unsavedWindows.add(991);
        S.unsavedWindows.update(991, {
          epoch: 'temporary-renderer', revision: 1,
          labels: ['Devis — fixture'], pending: true,
        });
        S.restoreQuitGate.arm(() => S.scheduleDatabaseRestore(source, workspace));
        app.quit();
        assert(!fs.existsSync(marker(profile, temp)), 'Quit refusal left a marker');
        assert(!S.restoreQuitGate.commitOnQuit(), 'Quit refusal left a live gate');
        assert(db.getSetting(key, null) === 'after', 'Quit refusal changed open SQLite');
        report(stage, { quitRefused: true, dbOpen: true, markerAbsent: true });
        S.unsavedWindows.remove(991);
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
      assert(live.health().migrationCount === 66, 'Incorrect migration count');
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