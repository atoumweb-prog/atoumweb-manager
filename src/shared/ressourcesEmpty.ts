/**
 * Messages des écrans vides de Ressources (R8). Fonctions pures : elles disent POURQUOI l'écran est vide
 * (rien d'enregistré, tout archivé, filtres) sans introduire aucune règle métier.
 */

export function catalogEmptyText(input: { filtersActive: boolean }): string {
  return input.filtersActive
    ? 'Aucune offre ou service pour ces filtres.'
    : 'Le catalogue est vide. Crée une offre ou un service avec « + Service / Offre ».';
}

/**
 * La liste de la Bibliothèque est filtrée côté serveur : aucun total non filtré n'est disponible.
 * Le message dit donc seulement si les archivés sont exclus de la vue.
 */
export function libraryEmptyText(input: { includeArchived: boolean; filtersActive: boolean }): string {
  if (input.filtersActive) return 'Aucun composant pour ces filtres.';
  if (input.includeArchived) return 'Aucun composant dans la Bibliothèque. Ajoute-en un avec « Nouveau composant » ou importe un package.';
  return 'Aucun composant actif. Ajoute-en un avec « Nouveau composant », importe un package ou coche « Archivés » pour voir les composants archivés.';
}

export function backupsEmptyText(input: { total: number; filtersActive: boolean }): string {
  if (input.filtersActive) return 'Aucune sauvegarde pour ces filtres.';
  return 'Aucune sauvegarde déclarée. Déclare-en une avec « Déclarer une sauvegarde ».';
}

export function directoryEmptyText(input: { view: 'organizations' | 'contacts'; filtersActive: boolean }): string {
  if (input.view === 'organizations') {
    return input.filtersActive ? 'Aucune organisation pour ces filtres.' : 'Aucune organisation. Ajoute-en une avec « + Organisation ».';
  }
  return input.filtersActive ? 'Aucun contact pour ces filtres.' : 'Aucun contact. Ajoute-en un avec « + Contact ».';
}
