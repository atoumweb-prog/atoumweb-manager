import { describe, expect, it } from 'vitest';
import type { QuoteDetail } from './commercial';
import { canAccessQuoteProject } from './quoteProjectEligibility';

function quote(status: QuoteDetail['status'], lines = 1): Pick<QuoteDetail, 'status' | 'lines'> {
  return { status, lines: Array.from({ length: lines }, () => ({} as QuoteDetail['lines'][number])) };
}

describe('03B.4 — accès au Projet depuis le Devis courant', () => {
  it('ouvre le parcours sur les devis contenant des lignes et préparables', () => {
    for (const status of ['draft', 'sent', 'viewed', 'accepted'] as const) {
      expect(canAccessQuoteProject(quote(status))).toBe(true);
    }
  });

  it('interdit le lancement sans ligne, sur devis refusé, caduc ou annulé', () => {
    expect(canAccessQuoteProject(quote('draft', 0))).toBe(false);
    for (const status of ['refused', 'expired', 'cancelled'] as const) {
      expect(canAccessQuoteProject(quote(status))).toBe(false);
    }
  });
});
