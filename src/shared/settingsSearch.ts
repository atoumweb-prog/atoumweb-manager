/** Recherche pure et insensible aux accents dans les rubriques de réglages. */
export function settingsSectionMatches(query: string, keywords: string): boolean {
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('fr-FR');
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const inSection = normalize(keywords);
  return words.every((word) => inSection.includes(word));
}
