import { noticeText } from './noticeLifetime';

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

/**
 * P6b (D1) : message d'une liste dont la source a échoué. Elle n'est jamais présentée comme vide :
 * la cause est dite sans le préfixe technique d'Electron, avec ce qu'il faut faire.
 */
export function tableErrorMessage(error: string): string {
  const cause = noticeText(error).trim().replace(/[.\s]+$/, '');
  return `La liste n’a pas pu être chargée${cause ? ` (${cause})` : ''}. Rien n’est affiché tant qu’elle n’est pas rechargée : réessaie, et si le problème continue, regarde Réglages, rubrique « Diagnostic du Manager ».`;
}

const NEUTRAL_FILTER_VALUES = new Set(['', 'all', 'tous']);

/** Vrai si au moins une valeur de recherche ou de filtre n'est pas neutre (vide, « all », « tous »). */
export function hasActiveFilters(values: ReadonlyArray<string | null | undefined | false>): boolean {
  return values.some((value) => typeof value === 'string' && !NEUTRAL_FILTER_VALUES.has(value.trim().toLowerCase()));
}
