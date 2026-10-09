import {BrowserWindow,dialog,ipcMain} from 'electron';
export function confirmUnsavedExit(labels: string[], pending: boolean, window?: BrowserWindow | null): boolean {
    const options = { type: 'warning' as const, title: 'Modifications non enregistrées', message: pending ? 'Un enregistrement est en cours. Attendez sa confirmation avant de quitter.' : 'Certaines modifications ne sont pas enregistrées.', detail: [...new Set(labels)].slice(0, 20).map(label => label.slice(0, 160)).join('\n'), buttons: pending ? ['Rester'] : ['Rester', 'Quitter sans enregistrer'], defaultId: 0, cancelId: 0, noLink: true };
    const choice = window ? dialog.showMessageBoxSync(window, options) : dialog.showMessageBoxSync(options);
    return !pending && choice === 1;
}
export function registerUnsavedConfirmationIpc(){
ipcMain.removeAllListeners('unsaved:confirm-exit');
ipcMain.on('unsaved:confirm-exit', (event, labels: unknown, pending: unknown) => { const window = BrowserWindow.fromWebContents(event.sender); if (!window || !Array.isArray(labels) || labels.length > 40 || labels.some(l => typeof l !== 'string')) {
        event.returnValue = false;
        return;
    } event.returnValue = confirmUnsavedExit(labels as string[], pending === true, window); });
}
