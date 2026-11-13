/**
 * Règle de la refonte (13/11/2026) : une seule action principale (jaune) par vue ;
 * Fermer, Annuler, Retour, Réduire, Replier et Actualiser ne sont jamais des actions principales.
 * `findPrimaryMisuse` lit un fichier .tsx et renvoie les libellés fautifs (détection statique, par bouton).
 */
const SECONDARY_ACTIONS = /(?:^|[>'"`{}?:]\s*)((?:Fermer|Annuler|Retour|Réduire|Replier|Actualiser)[^'"`<{}]*)/;

/** Fin de la balise ouvrante qui commence à `from` : le `>` est cherché hors des accolades JSX. */
function endOfOpeningTag(source: string, from: number): number {
  let depth = 0;
  let quote = '';
  for (let i = from; i < source.length; i += 1) {
    const char = source[i];
    if (quote) { if (char === quote && source[i - 1] !== '\\') quote = ''; continue; }
    if (char === '"' || char === "'" || char === '`') { quote = char; continue; }
    if (char === '{') depth += 1;
    else if (char === '}') depth -= 1;
    else if (char === '>' && depth === 0) return i;
  }
  return -1;
}

export function findPrimaryMisuse(source: string): string[] {
  const found: string[] = [];
  for (const opening of source.matchAll(/<(button|AppButton)\b/g)) {
    const tagEnd = endOfOpeningTag(source, opening.index! + opening[0].length);
    if (tagEnd < 0 || source[tagEnd - 1] === '/') continue;
    const tag = source.slice(opening.index!, tagEnd);
    if (!/primary-button|variant="primary"/.test(tag)) continue;
    // Un bouton qui devient secondaire dans son état « ouvert » (classe conditionnelle) respecte la règle.
    if (/secondary-button/.test(tag)) continue;
    const close = source.indexOf(`</${opening[1]}>`, tagEnd);
    if (close < 0) continue;
    const label = SECONDARY_ACTIONS.exec(source.slice(tagEnd + 1, close).replace(/<[^>]*>/g, ''));
    if (label) found.push(label[1].trim());
  }
  return found;
}
