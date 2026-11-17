const LABELS: Record<string, string> = {
  website: 'Site vitrine',
  vitrine: 'Site vitrine',
  ecommerce: 'Boutique en ligne',
  landing: 'Landing page',
  application: 'Application',
  software: 'Logiciel',
  internal: 'Projet interne AtoumWeb',
};

/** Libellé français d'un type de projet. Un type inconnu reste lisible (première lettre en majuscule), jamais vide. */
export function projectTypeLabel(type: string): string {
  const key = type.trim();
  if (!key) return 'Type non précisé';
  return LABELS[key] ?? key.charAt(0).toLocaleUpperCase('fr-FR') + key.slice(1);
}
