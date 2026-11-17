/**
 * Plancher de 14 px (règle du produit, décision du 09/10/2026) : compte les déclarations
 * `font-size: Npx` strictement inférieures à 14 px. Les valeurs calculées (`max()`, `clamp()`,
 * `var()`, `em`) et les propriétés personnalisées ne sont pas comptées.
 * Sert au test de budget : le nombre par fichier ne peut que baisser.
 */
export const FONT_FLOOR_PX = 14;

export function countSmallFontDeclarations(css: string): number {
  const source = css.replace(/\/\*[\s\S]*?\*\//g, '');
  let count = 0;
  for (const match of source.matchAll(/(?<![\w-])font-size\s*:\s*(\d+(?:\.\d+)?)px/gi)) {
    if (Number(match[1]) < FONT_FLOOR_PX) count += 1;
  }
  return count;
}
