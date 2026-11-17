import type { CatalogTableContext } from '../../shared/catalogTableContext';

/**
 * Une seule définition de « filtre actif » du Catalogue (M3). La taille de page n'est pas un filtre ;
 * une recherche faite d'espaces non plus. Sert le bouton « Réinitialiser », le tableau et le message vide.
 */
export function catalogFiltersActive(filters: CatalogTableContext): boolean {
  return Boolean(filters.query.trim())
    || filters.type !== 'all'
    || filters.itemStatus !== 'all'
    || filters.category !== 'all'
    || filters.family !== 'all'
    || filters.versionState !== 'all'
    || filters.visibility !== 'all';
}
