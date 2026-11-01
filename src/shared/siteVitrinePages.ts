/** Default, editable five-page structure for AtoumWeb's standard site-vitrine offer.
 * This is a proposed commercial scope for NEW draft quotes, not a migration
 * and not a change to already published Catalogue versions or accepted quotes.
 */
export const STANDARD_VITRINE_PAGES = [
  'Accueil',
  'Services / Prestations',
  'À propos',
  'Réalisations / Avis clients',
  'Contact',
] as const;

export const STANDARD_VITRINE_SCOPE =
  'Pages prévues dans le forfait vitrine (5 pages) : ' +
  STANDARD_VITRINE_PAGES.join(' ; ') +
  '. La répartition peut être adaptée avec le client avant acceptation du devis.';

export function defaultVitrineLineScope(itemId: string, canonicalCode: string | null): string | null {
  return itemId === 'atoumweb-vitrine' || canonicalCode === 'AW-WEB-VITRINE-5P'
    ? STANDARD_VITRINE_SCOPE
    : null;
}
