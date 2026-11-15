/** Durée d'affichage d'une confirmation sans enjeu (thème, densité d'affichage). */
export const DISPLAY_NOTICE_MS = 8000;

/**
 * Délai avant fermeture automatique d'une notice, ou `null` si elle doit rester.
 * Une notice qui porte une action, ou dont l'écran n'a pas demandé d'échéance (erreurs comprises),
 * ne se ferme jamais seule.
 */
/** P6b (C1) : texte affiché d'une notice, sans le préfixe technique qu'Electron ajoute aux erreurs IPC. */
export function noticeText(message: string): string {
  return message.replace(/^Error invoking remote method ['"][^'"]+['"]:\s*/i, '').replace(/^Error:\s*/, '');
}

/** P6b (D2) : une notice ne suit pas l'utilisateur sur une autre page que celle où elle a été posée. */
export function noticeStaysOnPage(messagePage: string, activePage: string): boolean {
  return messagePage === activePage;
}

export function noticeTimeout(options: { autoDismissMs?: number; hasAction: boolean }): number | null {
  if (options.hasAction) return null;
  return options.autoDismissMs !== undefined && options.autoDismissMs > 0 ? options.autoDismissMs : null;
}
