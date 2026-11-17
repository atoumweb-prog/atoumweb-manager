import type { QuoteStatus } from './commercial';

/**
 * Colonne « Décision » de la liste des devis (R4) : ce qui est visible dans la ligne, ce qui est rangé dans « Plus »
 * et quelle pastille s'affiche. Fonction pure : elle reprend les conditions qui existaient dans l'écran
 * (`sent` ou `viewed` = action possible ; négociation = étape du prospect), sans règle métier nouvelle.
 */
export type QuoteDecisionBadge = 'validated' | 'negotiating' | null;

export function quoteDecisionActions(input: { status: QuoteStatus; hasProspect: boolean; negotiating: boolean }): { visible: 'accept' | null; more: Array<'negotiate'>; badge: QuoteDecisionBadge } {
  const actionable = input.status === 'sent' || input.status === 'viewed';
  if (actionable) {
    return {
      visible: 'accept',
      more: input.hasProspect && !input.negotiating ? ['negotiate'] : [],
      badge: input.hasProspect && input.negotiating ? 'negotiating' : null,
    };
  }
  return { visible: null, more: [], badge: input.status === 'accepted' ? 'validated' : null };
}
