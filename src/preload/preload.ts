import { contextBridge, ipcRenderer } from 'electron';
import type { AtoumWebApi, ThemeName } from '../shared/contracts';

const api: AtoumWebApi = {
  app: {
    getBootstrap: () => ipcRenderer.invoke('app:get-bootstrap'),
  },
  settings: {
    setTheme: (theme: ThemeName) => ipcRenderer.invoke('settings:set-theme', theme),
  },
  workspace: {
    choose: () => ipcRenderer.invoke('workspace:choose'),
  },
  backups: {
    createManual: () => ipcRenderer.invoke('backups:create-manual'),
    restore: () => ipcRenderer.invoke('backups:restore'),
  },
  database: {
    health: () => ipcRenderer.invoke('database:health'),
  },
};

contextBridge.exposeInMainWorld('atoumweb', api);
