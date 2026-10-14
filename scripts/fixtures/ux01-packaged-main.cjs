/* Test-only entry point for an independently packaged Electron application.
 * No code path into the installed AtoumWeb Manager or a user workspace.
 */
'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { app, BrowserWindow, dialog } = require('electron');
const S = require('./services.cjs');
const ROOT_ENV = 'ATOUMWEB_UX01_PACKAGED_ROOT';
const TOKEN_ENV = 'ATOUMWEB_UX01_PACKAGED_TOKEN';
const key = 'ux01-packaged-restore-proof';
const prefix = 'atoumweb-ux01-packaged-';
const root = process.env[ROOT_ENV];
const token = process.env[TOKEN_ENV];
function assert(value, message) { if (!value) throw new Error(message); }
function readJSON(file) { return JSON.parse(fs.readFileSync(path.join(root, file), 'utf8')); }
function writeJSON(file, content) {
  const destination = path.join(root, file);
  const temporary = destination + '.' + process.pid + '.tmp';
  fs.writeFileSync(temporary, JSON.stringify(content, null, 2));
  fs.renameSync(temporary, destination);
}
function log(phase, payload = {}) {
  const record = { phase, pid: process.pid, ...payload };
  fs.appendFileSync(path.join(root, 'events.ndjson'), JSON.stringify(record) + '\n');
  console.log('[UX01 packaged]', JSON.stringify(record));
}
function terminateFailure(error) {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  try { log('failure', { error: message }); writeJSON('result.json', { passed: false, error: message }); }
  catch (writeError) { console.error('[UX01 packaged] Failed writing diagnostic', writeError); }
  console.error('[UX01 packaged] FAILED:', message);
  app.exit(1);
}
// Fail CLOSED if this fixture was launched outside a fresh TEMP root and nonce.
const resolvedTmp = fs.realpathSync.native(os.tmpdir());
assert(typeof root === 'string' && typeof token === 'string' && token.length >= 20,
  'Packaged recipe requires an isolated parent and a random nonce.');
const realRoot = fs.realpathSync.native(root);
const normalized = s => process.platform === 'win32' ? s.toLowerCase() : s;
assert(['accepted', 'refused'].includes(path.basename(realRoot)) &&
  path.basename(path.dirname(realRoot)).startsWith(prefix) &&
  normalized(path.dirname(path.dirname(realRoot))) === normalized(resolvedTmp),
  'Unsafe packaged fixture path');
const guard = readJSON('fixture-guard.json');
assert(guard.token === token && guard.createdBy === 'ux01-packaged-node-wrapper',
  'Packaged recipe guard mismatch');
assert(app.isPackaged, 'This fixture must run as a real packaged Electron application');
fs.mkdirSync(path.join(root, 'profile'), { recursive: true });
app.setPath('userData', path.join(root, 'profile'));
app.disableHardwareAcceleration();
app.on('window-all-closed', () => {});
dialog.showMessageBoxSync = () => 0;
dialog.showErrorBox = (title, details) => log('dialog-error', { title, details });
process.on('uncaughtException', terminateFailure);
process.on('unhandledRejection', terminateFailure);

async function boot() {
  const current = fs.existsSync(path.join(root, 'state.json')) ? readJSON('state.json') : { phase: 'initial' };
  const scenario = guard.scenario;
  assert(['accepted', 'refused'].includes(scenario), 'Unknown scenario');
  const workspace = S.ensureWorkspace(path.join(root, 'workspace'));
  log('boot', { scenario, isPackaged: app.isPackaged, state: current.phase });

  if (current.phase === 'awaiting-accepted-relaunch') {
    assert(scenario === 'accepted', 'Wrong accepted scenario');
    const restored = await S.applyPendingDatabaseRestore(workspace);
    assert(restored.restored === true, 'Packaged relaunch did not restore SQLite');
    assert(restored.safetyBackupPath && fs.existsSync(restored.safetyBackupPath),
      'Packaged restore did not create pre-restore safety backup');
    const live = new S.DatabaseService(workspace);
    try {
      await live.initialize();
      assert(live.getSetting(key, null) === 'before', 'Packaged restore state mismatch');
      assert(live.health().migrationCount === S.MIGRATIONS.length, 'Wrong migration count');
    } finally { live.close(); }
    const { DatabaseSync } = require('node:sqlite');
    const safety = new DatabaseSync(restored.safetyBackupPath, { readOnly: true });
    try {
      assert(JSON.parse(safety.prepare('SELECT value_json FROM settings WHERE key = ?').get(key).value_json) === 'after',
        'Safety backup did not preserve pre-restore data');
      assert(safety.prepare('PRAGMA integrity_check').get().integrity_check === 'ok', 'Safety copy damaged');
      assert(safety.prepare('PRAGMA foreign_key_check').all().length === 0, 'Safety copy FK errors');
    } finally { safety.close(); }
    assert(!fs.existsSync(path.join(root, 'profile', 'pending-database-restore.json')),
      'Pending restore marker not consumed');
    const audit = readJSON('accepted-willquit.json');
    assert(audit.willQuit && audit.markerCommitted && audit.dbClosed, 'Old package did not quit correctly');
    assert(audit.pid !== process.pid, 'App was not restarted as a new OS process');
    log('accepted-relaunch-pass', { restored: true, distinctPid: true, safetyBackup: true });
    writeJSON('result.json', { passed: true, scenario, restored: true, distinctPid: true,
      safetyBackup: true, markerAbsent: true, oldPid: audit.pid, newPid: process.pid });
    app.exit(0);
    return;
  }

  if (current.phase === 'awaiting-refused-manual-restart') {
    assert(scenario === 'refused', 'Wrong refused scenario');
    const restored = await S.applyPendingDatabaseRestore(workspace);
    assert(restored.restored === false, 'Refused restoration executed on subsequent boot');
    const live = new S.DatabaseService(workspace);
    try { await live.initialize(); assert(live.getSetting(key, null) === 'after', 'Refused quit lost changes'); }
    finally { live.close(); }
    const audit = readJSON('refused-beforequit.json');
    assert(audit.beforeQuit && !audit.willQuit && audit.windowOpen && audit.markerAbsent,
      'Refusal did not preserve the application');
    log('refused-restart-pass', { restored: false });
    writeJSON('result.json', { passed: true, scenario, restored: false, markerAbsent: true });
    app.exit(0);
    return;
  }

  assert(current.phase === 'initial', 'Unexpected packaged recipe phase');
  const live = new S.DatabaseService(workspace);
  await live.initialize();
  live.setSetting(key, 'before');
  const rawBackup = await live.createBackup('manual');
  const standalone = path.join(workspace.backupsDirectory, 'manual', 'ux01-standalone.sqlite');
  const { DatabaseSync } = require('node:sqlite');
  const reader = new DatabaseSync(rawBackup, { readOnly: true });
  try { reader.prepare('VACUUM INTO ?').run(standalone); } finally { reader.close(); }
  assert(!['-wal', '-shm', '-journal'].some(suffix => fs.existsSync(standalone + suffix)),
    'Standalone package fixture still has SQLite sidecars');
  assert(S.validateRestoreSource(standalone).migrationCount === S.MIGRATIONS.length, 'Invalid packaged fixture source');
  live.setSetting(key, 'after');

  // Directly reuse production IPC and guarded lifecycle; no fake handler.
  S.registerIpcHandlers(live, workspace);
  let dbOpen = true;
  S.registerGuardedShutdown(() => { live.close(); dbOpen = false; });
  const window = new BrowserWindow({ show: false, width: 320, height: 240,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: false,
      preload: path.join(__dirname, 'preload.cjs') } });
  S.bindUnsavedWindow(window);
  await window.loadFile(path.join(__dirname, 'fixture.html'));

  dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [standalone] });
  dialog.showMessageBox = async () => ({ response: 0, checkboxChecked: false });
  const state = scenario === 'accepted' ? 'awaiting-accepted-relaunch' : 'awaiting-refused-manual-restart';
  writeJSON('state.json', { phase: state });
  let beforeQuitCount = 0;
  let willQuitCount = 0;
  app.on('before-quit', () => { beforeQuitCount++; log('before-quit', { count: beforeQuitCount }); });
  app.on('will-quit', () => {
    willQuitCount++;
    const markerCommitted = fs.existsSync(path.join(root, 'profile', 'pending-database-restore.json'));
    log('will-quit', { count: willQuitCount, markerCommitted, dbOpen });
    if (scenario === 'accepted') writeJSON('accepted-willquit.json', {
      willQuit: willQuitCount === 1, markerCommitted, dbClosed: !dbOpen, pid: process.pid,
    });
  });

  // This uses the bundled production backups:restore handler in app.isPackaged mode.
  const request = await window.webContents.executeJavaScript('window.ux01PackagedRestore()');
  assert(request && request.restartScheduled && !request.cancelled,
    'Packaged IPC did not schedule restore and relaunch');
  log('ipc-scheduled', { scenario, restartScheduled: request.restartScheduled });
  if (scenario === 'refused') {
    // Later edit revokes the approval ticket before app.quit's 150 ms timer.
    S.unsavedWindows.update(window.id, {
      epoch: 'post-approval-edit', revision: 1, labels: ['Devis fixture'], pending: true,
    });
    await new Promise(resolve => setTimeout(resolve, 600));
    const markerAbsent = !fs.existsSync(path.join(root, 'profile', 'pending-database-restore.json'));
    const stillOpen = !window.isDestroyed();
    assert(beforeQuitCount >= 1 && willQuitCount === 0, 'Pending save did not veto packaged quit');
    assert(dbOpen && stillOpen && markerAbsent, 'Packaged quit refusal damaged live state');
    assert(!S.restoreQuitGate.commitOnQuit(), 'Refused packaged quit left scheduled restore');
    assert(live.getSetting(key, null) === 'after', 'Refused packaged quit changed SQLite');
    writeJSON('refused-beforequit.json', { beforeQuit: true, willQuit: false,
      windowOpen: stillOpen, markerAbsent });
    log('refused-quit-pass', { beforeQuitCount, willQuitCount, markerAbsent });
    app.exit(0);
    return;
  }
  // Real production timer app.quit -> will-quit -> app.relaunch automatically.
  setTimeout(() => terminateFailure(new Error('Packaged app.relaunch did not occur within 20 seconds')), 20000);
}
app.whenReady().then(boot).catch(terminateFailure);
