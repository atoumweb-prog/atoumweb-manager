/**
 * P3a (F44) : faut-il redonner le focus au champ de recherche globale quand on la ferme ?
 *
 * Oui quand personne ne l'a pris (focus nul ou sur le corps de la page) ou quand il est resté dans l'en-tête
 * (Échap, retour au déclencheur). Non quand il est déjà ailleurs : c'est la fiche ouverte par le résultat,
 * que `App.tsx` focalise dans son propre `requestAnimationFrame`. L'ordre des deux n'est pas garanti,
 * donc `closeSearch` ne doit jamais reprendre un focus posé sur la fiche.
 */
export function shouldRestoreSearchFocus(
  active: Element | null,
  header: { contains(node: Node): boolean } | null,
  body: Element | null,
): boolean {
  if (!active || active === body) return true;
  return Boolean(header && header.contains(active));
}
