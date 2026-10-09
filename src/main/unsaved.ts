import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { restoreQuitGate } from './restoreQuitGate';
import { UnsavedWindows, isUnsavedWindowState } from '../shared/unsavedWindows';
export function confirmUnsavedExit(labels: string[], pending: boolean, window?: BrowserWindow | null): boolean {
    const options = { type: 'warning' as const, title: 'Modifications non enregistrées', message: pending ? 'Un enregistrement est en cours. Attendez sa confirmation avant de quitter.' : 'Certaines modifications ne sont pas enregistrées.', detail: [...new Set(labels)].slice(0, 20).map(label => label.slice(0, 160)).join('\n'), buttons: pending ? ['Rester'] : ['Rester', 'Quitter sans enregistrer'], defaultId: 0, cancelId: 0, noLink: true };
    const choice = window ? dialog.showMessageBoxSync(window, options) : dialog.showMessageBoxSync(options);
    return !pending && choice === 1;
}
export const unsavedWindows = new UnsavedWindows((labels, pending, id) => confirmUnsavedExit(labels, pending, (id ? BrowserWindow.fromId(id) : BrowserWindow.getFocusedWindow()) ?? undefined));
export function bindUnsavedWindow(window: BrowserWindow): void {
    unsavedWindows.add(window.id);
    window.on('closed', () => unsavedWindows.remove(window.id));
    window.webContents.on('will-prevent-unload', event => {
        const state = unsavedWindows.state(window.id);
        const allowed = state && (state.labels.length || state.pending) ? unsavedWindows.approveOne(window.id) : confirmUnsavedExit(['Saisie en cours'], false, window);
        // Electron: preventing this event overrides the renderer's unload veto.
        if (allowed)
            event.preventDefault();
        else
            restoreQuitGate.cancel();
    });
}
export function approveUnsavedQuit(): boolean { const ticket = unsavedWindows.approveAll(); if (!ticket)
    return false; unsavedWindows.remember(ticket); return true; }
export function registerUnsavedConfirmationIpc() {
    ipcMain.removeAllListeners('unsaved:confirm-exit');
    ipcMain.on('unsaved:confirm-exit', (event, labels: unknown, pending: unknown) => { const window = BrowserWindow.fromWebContents(event.sender); if (!window || !Array.isArray(labels) || labels.length > 40 || labels.some(l => typeof l !== 'string')) {
        event.returnValue = false;
        return;
    } event.returnValue = confirmUnsavedExit(labels as string[], pending === true, window); });
    ipcMain.removeAllListeners('unsaved:state');
    ipcMain.on('unsaved:state', (event, state: unknown) => { const window = BrowserWindow.fromWebContents(event.sender); if (!window || event.senderFrame !== event.sender.mainFrame || !isUnsavedWindowState(state)) {
        event.returnValue = false;
        return;
    } unsavedWindows.update(window.id, state); event.returnValue = !!unsavedWindows.state(window.id); });
}
export function registerGuardedShutdown(cleanup: () => void): void {
    app.on('before-quit', event => {
        if (!approveUnsavedQuit()) {
            restoreQuitGate.cancel();
            event.preventDefault();
        }
    });
    app.on('will-quit', () => {
        try {
            // Every window has finished its unload checks. No marker exists before this.
            restoreQuitGate.commitOnQuit();
        } catch (error) {
            // Do not relaunch or silently restore after an invalid/changed source.
            const message = error instanceof Error ? error.message : String(error);
            dialog.showErrorBox('Restauration non programmée — AtoumWeb Manager',
                message + '\\nLe Manager est fermé sans restauration. Relance-le et reprogramme la demande.');
        } finally {
            cleanup();
        }
    });
}
