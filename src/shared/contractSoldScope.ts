/** Build a readable sold scope from the actual catalogue snapshot and negotiated line details.
 * No guessed deliverables: an identical catalogue inclusion is shown only once.
 */
export interface SoldScopeInput {
  label: string;
  quantityMilli: number;
  inclusions?: unknown;
  exclusions?: unknown;
  scope?: unknown;
  scopeExclusions?: unknown;
  /** Phrase facultative qui précise une quantité déjà comprise dans une autre offre du devis. */
  quantityNote?: string;
}
const normalise = (s: string): string => s.replace(/\s+/g, ' ').trim().toLocaleLowerCase('fr-FR');
const entries = (source: unknown): string[] =>
  Array.isArray(source)
    ? source.filter((item): item is string => typeof item === 'string').flatMap(item => item.split(/\r?\n/)).map(s => s.trim()).filter(Boolean)
    : typeof source === 'string'
      ? source.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
      : [];
const unique = (items: string[]): string[] => {
  const seen = new Set<string>();
  return items.filter(item => {
    const key = normalise(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
export function formatSoldScope(input: SoldScopeInput): string {
  const inclusions = unique(entries(input.inclusions));
  const scope = unique(entries(input.scope))
    .filter(item => !inclusions.some(inclusion => normalise(inclusion) === normalise(item)));
  const exclusions = unique(
    entries(input.scopeExclusions).length
      ? entries(input.scopeExclusions)
      : entries(input.exclusions),
  );
  return [
    `${input.label} — Quantité : ${input.quantityMilli / 1000}${input.quantityNote ? ` — ${input.quantityNote}` : ''}`,
    ...inclusions.map(item => `• Inclus : ${item}`),
    ...scope.map(item => `• Périmètre particulier convenu : ${item}`),
    ...exclusions.map(item => `• Non inclus : ${item}`),
  ].join('\n');
}
