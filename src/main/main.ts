import { app, BrowserWindow } from 'electron';
import { join } from 'node:path';
import { DatabaseService } from './database/DatabaseService';
import { registerIpcHandlers } from './ipc';
import { registerOperationsIpcHandlers } from './operations/operationsIpc';
import { applyPendingDatabaseRestore } from './restore';
import { registerTimeCorrectionIpcHandler } from './time/timeIpc';
import { resolveWorkspace } from './workspace';

let mainWindow: BrowserWindow | null = null;
let database: DatabaseService | null = null;

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 760,
    minHeight: 560,
    backgroundColor: '#0f1720',
    title: 'AtoumWeb Manager',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url !== mainWindow?.webContents.getURL()) {
      event.preventDefault();
    }
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    void mainWindow.loadFile(
      join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function bootstrap(): Promise<void> {
  const workspace = resolveWorkspace();
  const restoreResult = await applyPendingDatabaseRestore(workspace);
  if (restoreResult.restored) {
    console.info('Base AtoumWeb Manager restaurée', restoreResult);
  }

  database = new DatabaseService(workspace);
  await database.initialize();
  registerIpcHandlers(database, workspace);
  registerOperationsIpcHandlers(database);
  registerTimeCorrectionIpcHandler(database);
  createMainWindow();
}

app.whenReady().then(async () => {
  app.setAppUserModelId('fr.atoumweb.manager');
  await bootstrap();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
}).catch((error) => {
  console.error('Échec du démarrage AtoumWeb Manager', error);
  app.quit();
});

app.on('before-quit', () => {
  database?.close();
  database = null;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
