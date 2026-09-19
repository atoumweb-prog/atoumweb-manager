import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'node:path';
import { DatabaseService } from './database/DatabaseService';
import { registerIpcHandlers } from './ipc';
import { registerOperationsIpcHandlers } from './operations/operationsIpc';
import { applyPendingDatabaseRestore } from './restore';
import { registerTimeCorrectionIpcHandler } from './time/timeIpc';
import { resolveWorkspace } from './workspace';

let mainWindow: BrowserWindow | null = null;
let database: DatabaseService | null = null;
const prospectReferenceWindows = new Map<string, BrowserWindow>();

function loadRendererWindow(window: BrowserWindow, query?: Record<string, string>): void {
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    const url = new URL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    Object.entries(query ?? {}).forEach(([key, value]) => url.searchParams.set(key, value));
    void window.loadURL(url.toString());
    return;
  }
  void window.loadFile(
    join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    query ? { query } : undefined,
  );
}

function openProspectReferenceWindow(prospectId: string): void {
  const id = prospectId.trim();
  if (!id) return;
  const existing = prospectReferenceWindows.get(id);
  if (existing && !existing.isDestroyed()) {
    if (existing.isMinimized()) existing.restore();
    existing.show();
    existing.focus();
    return;
  }

  const referenceWindow = new BrowserWindow({
    width: 1120,
    height: 860,
    minWidth: 760,
    minHeight: 560,
    backgroundColor: '#f6f4ee',
    title: 'Référence prospect · AtoumWeb Manager',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  prospectReferenceWindows.set(id, referenceWindow);
  referenceWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  loadRendererWindow(referenceWindow, { prospectReference: id });
  referenceWindow.on('closed', () => prospectReferenceWindows.delete(id));
}

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

  loadRendererWindow(mainWindow);

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
  ipcMain.removeHandler('app:open-prospect-reference');
  ipcMain.handle('app:open-prospect-reference', (_event, prospectId: string) => openProspectReferenceWindow(prospectId));
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
  prospectReferenceWindows.clear();
  database?.close();
  database = null;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
