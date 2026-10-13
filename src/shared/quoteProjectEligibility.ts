import type { QuoteDetail } from './commercial';

/**
 * 03B.4 — le Projet est préparé depuis un Devis réel, jamais depuis le
 * simple stade du Prospect. Le service conserve les contrôles métier.
 */
export function canAccessQuoteProject(quote: Pick<QuoteDetail, 'status' | 'lines'>): boolean {
  return quote.lines.length > 0
    && (quote.status === 'draft' || quote.status === 'sent'
      || quote.status === 'viewed' || quote.status === 'accepted');
}
