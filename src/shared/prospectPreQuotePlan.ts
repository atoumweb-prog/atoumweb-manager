import type { CatalogItemSummary, QuoteLineInput } from './commercial';
import type { Need } from './workflow';

/** Un besoin sélectionné est consultatif ; seul cet assemblage volontaire crée des lignes de Devis. */
export interface ProspectQuotePlan {
  lines: Array<{ catalogVersionId?: string; input: QuoteLineInput }>;
  missing: string[];
  unpriced: string[];
}

export function planProspectQuoteLines(needs: readonly Need[], catalog: readonly CatalogItemSummary[]): ProspectQuotePlan {
  const lines: ProspectQuotePlan['lines'] = [];
  const missing: string[] = [];
  const unpriced: string[] = [];
  for (const need of needs) {
    if (need.catalogItemId) {
      const item = catalog.find((candidate) => candidate.id === need.catalogItemId);
      if (!item || item.status !== 'active' || item.currentVersion?.status !== 'published') {
        missing.push(need.label || need.catalogItemId);
        continue;
      }
      const version = item.currentVersion;
      const needsPrice = version.priceCents == null && version.priceMode !== 'free';
      if (needsPrice) unpriced.push(need.label || item.name);
      lines.push({
        catalogVersionId: version.id,
        input: { label: item.name, ...(needsPrice ? { proposedUnitPriceCents: 0 } : {}) },
      });
      continue;
    }
    if (!need.otherText?.trim()) {
      missing.push(need.label || 'Besoin sans prestation');
      continue;
    }
    lines.push({ input: {
      label: need.otherText.trim(),
      catalogUnitPriceCents: 0,
      proposedUnitPriceCents: 0,
    } });
    unpriced.push(need.label || need.otherText.trim());
  }
  return { lines, missing, unpriced };
}
