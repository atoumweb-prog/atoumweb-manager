export interface TableEmptyMessage { text: string; clearLabel?: string }

/**
 * Message d'un tableau sans ligne. Il ne parle de filtres que si un filtre est réellement actif :
 * avant R2, `DataTable` affichait toujours « Aucun dossier ne correspond aux filtres ».
 */
export function tableEmptyMessage(state: { filtersActive?: boolean }): TableEmptyMessage {
  return state.filtersActive
    ? { text: 'Aucun résultat pour ces filtres.', clearLabel: 'Effacer les filtres' }
    : { text: 'Rien à afficher pour l’instant.' };
}

const NEUTRAL_FILTER_VALUES = new Set(['', 'all', 'tous']);

/** Vrai si au moins une valeur de recherche ou de filtre n'est pas neutre (vide, « all », « tous »). */
export function hasActiveFilters(values: ReadonlyArray<string | null | undefined | false>): boolean {
  return values.some((value) => typeof value === 'string' && !NEUTRAL_FILTER_VALUES.has(value.trim().toLowerCase()));
}
