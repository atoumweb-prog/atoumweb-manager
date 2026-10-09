'use strict';
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('ux01PackagedRestore', () => ipcRenderer.invoke('backups:restore'));
