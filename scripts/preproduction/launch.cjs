'use strict';
// Lanceur de préproduction isolée : profil et workspace propres à CE dossier, jamais d'autre.
// N'initialise ni ne réinitialise aucune donnée : la base doit déjà être présente.
const fs = require('node:fs'), path = require('node:path');
const {app, BrowserWindow, ipcMain, dialog} = require('electron');
const root = path.resolve(__dirname, '..');
const logs = path.join(root, 'Journaux');
fs.mkdirSync(logs, {recursive: true});
const fail = error => { fs.writeFileSync(path.join(logs, 'demarrage-erreur.txt'), (error && error.stack) || String(error)); dialog.showErrorBox('Préproduction — démarrage refusé', String(error && error.message || error)); app.exit(1); };
try {
  const meta = JSON.parse(fs.readFileSync(path.join(root, 'PREPRODUCTION.json'), 'utf8'));
  if (meta.mode !== 'PREPRODUCTION_TEST' || path.resolve(meta.root).toLowerCase() !== root.toLowerCase())
    throw Error('Ce dossier de préproduction a été déplacé ou modifié : démarrage refusé.');
  const profile = path.join(root, 'Profil'), workspace = path.join(root, 'Workspace');
  if (!fs.existsSync(path.join(workspace, 'data', 'atoumweb-manager.sqlite')))
    throw Error('Base absente dans Workspace\\data : aucune création automatique.');
  fs.mkdirSync(profile, {recursive: true});
  app.setName(meta.title); app.setAppPath(__dirname);
  app.setPath('userData', profile); app.setPath('sessionData', profile); app.setAppLogsPath(logs);
  if (!app.requestSingleInstanceLock()) { app.quit(); }
  else {
    app.on('second-instance', () => { const w = BrowserWindow.getAllWindows()[0]; if (w) { w.restore(); w.show(); w.focus(); } });
    const config = path.join(profile, 'workspace.json');
    if (fs.existsSync(config) && path.resolve(JSON.parse(fs.readFileSync(config, 'utf8')).workspaceRoot) !== workspace)
      throw Error('Le profil pointe vers un autre workspace : démarrage refusé.');
    fs.writeFileSync(config, JSON.stringify({workspaceRoot: workspace}, null, 2));
    const handle = ipcMain.handle.bind(ipcMain);
    ipcMain.handle = (channel, listener) => handle(channel, channel === 'workspace:choose' ? async () => {
      await dialog.showMessageBox({type: 'info', title: 'Préproduction isolée', message: 'Cette préproduction utilise uniquement son propre dossier Workspace.', detail: workspace});
      return {cancelled: true};
    } : listener);
    app.whenReady().then(() => require('./build/main.js')).catch(fail);
  }
} catch (error) { app.whenReady().then(() => fail(error)); }
