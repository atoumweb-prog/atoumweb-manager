import { BrowserWindow, dialog, ipcMain } from 'electron';
import { WorkspaceVisualPreferenceStore, type SettingsOwner } from '../shared/workspaceVisualPreferences';
import type { WorkspaceMutationGate } from './backups/WorkspaceMutationGate';
import { assertShellVisualKey } from '../shared/shellVisualPreferences';

/** Only presentation settings. Existing business IPC and deferred workspace switch stay unchanged. */
export function registerShellVisualPreferences(owner: SettingsOwner, gate?: WorkspaceMutationGate) {
  const store = new WorkspaceVisualPreferenceStore(owner);
  const mutate = (work:()=>void) => gate ? gate.runSynchronousMutation(work) : work();
  ipcMain.removeAllListeners('settings:shell-visual');
  ipcMain.on('settings:shell-visual', (event, op: unknown, key: unknown, raw: unknown) => {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window || event.senderFrame !== event.sender.mainFrame) throw Error('Fenêtre non autorisée.');
      if (op === 'confirm-reset') {
        event.returnValue = {ok: true, value: dialog.showMessageBoxSync(window, {
          type: 'question', title: 'Favoris de navigation', message: 'Réinitialiser uniquement les favoris ?',
          buttons: ['Annuler', 'Réinitialiser'], defaultId: 0, cancelId: 0,
        }) === 1};
        return;
      }
      assertShellVisualKey(key);
      let value: string | null = null;
      if (op === 'get') value = store.getItem(key);
      else if (op === 'set' && typeof raw === 'string') mutate(() => store.setItem(key, raw));
      else if (op === 'remove') mutate(() => store.removeItem(key));
      else throw Error('Opération de présentation invalide.');
      if (op !== 'get') for (const target of BrowserWindow.getAllWindows())
        if (!target.isDestroyed()) target.webContents.send('settings:visual-changed', key);
      event.returnValue = {ok: true, value};
    } catch (error) {
      event.returnValue = {ok: false, error: error instanceof Error ? error.message : 'Préférence refusée.'};
    }
  });
}
