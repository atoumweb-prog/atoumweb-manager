/**
 * Libellés uniques des familles du pack V3.9.4 / V1.5 (décision utilisateur du 09/11/2026).
 * Clé = code de famille (`familyCode`), valeur = libellé affiché de la catégorie Catalogue.
 * Ne modifie jamais un devis, un snapshot ou une version : seul le libellé de fiche est concerné.
 */
export const APPROVED_FAMILY_LABELS: Readonly<Record<string, string>> = Object.freeze({
  WEB: 'Sites vitrines et options',
  LANDING: 'Landing pages',
  ECOM: 'E-commerce WooCommerce',
  MAINT: 'Maintenance',
  TECH: 'Interventions techniques et hébergement',
  SEO: 'Référencement (SEO)',
  CONTENU: 'Contenus et rédaction',
  IDENTITE: 'Identité visuelle',
  PHOTO: 'Photographie et retouche',
  MARIAGE: 'Sites de mariage',
  DATA: 'Données et mesure d’audience',
  DEVWP: 'Développement WordPress',
  APP: 'Applications sur mesure',
  HOST: 'Hébergement et domaines',
  GBP: 'Fiche Google Business Profile',
  STAT: 'Statistiques',
  NL: 'Newsletters',
  BRAND: 'Marque',
});

/** Libellé validé d'une famille ; une famille inconnue est une erreur, jamais un libellé inventé. */
export function approvedFamilyLabel(familyCode: string): string {
  const label = APPROVED_FAMILY_LABELS[familyCode];
  if (!label) throw new Error(`Famille ${familyCode} sans libellé validé.`);
  return label;
}
