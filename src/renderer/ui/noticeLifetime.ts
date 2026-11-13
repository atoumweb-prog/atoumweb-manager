/** Durée d'affichage d'une confirmation sans enjeu (thème, densité d'affichage). */
export const DISPLAY_NOTICE_MS = 8000;

/**
 * Délai avant fermeture automatique d'une notice, ou `null` si elle doit rester.
 * Une notice qui porte une action, ou dont l'écran n'a pas demandé d'échéance (erreurs comprises),
 * ne se ferme jamais seule.
 */
export function noticeTimeout(options: { autoDismissMs?: number; hasAction: boolean }): number | null {
  if (options.hasAction) return null;
  return options.autoDismissMs !== undefined && options.autoDismissMs > 0 ? options.autoDismissMs : null;
}
