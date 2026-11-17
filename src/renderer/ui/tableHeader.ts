/**
 * Largeur minimale d'une colonne pour que son en-tête garde son plus long mot entier
 * (« Destinataire », « Progression »…). 9 px par lettre (texte gras à 16 px, densité Confort ; Compact et Confort + sont vérifiés en fin de refonte), plus 40 px
 * de marges et de bouton de tri ; bornée entre 72 et 260 px.
 */
export function headerMinWidth(label: string): number {
  const longestWord = label.split(/[\s/]+/).reduce((longest, word) => Math.max(longest, word.length), 0);
  return Math.min(260, Math.max(72, longestWord * 9 + 40));
}
