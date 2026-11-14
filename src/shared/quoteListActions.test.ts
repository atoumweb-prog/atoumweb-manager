import { describe, expect, it } from 'vitest';
import type { QuoteStatus } from './commercial';
import { quoteDecisionActions } from './quoteListActions';

describe('R4 : colonne « Décision » de la liste des devis', () => {
  it.each(['sent', 'viewed'] as QuoteStatus[])('%s avec un prospect pas en négociation : une action visible, « À négocier » dans Plus', (status) => {
    expect(quoteDecisionActions({ status, hasProspect: true, negotiating: false })).toEqual({ visible: 'accept', more: ['negotiate'], badge: null });
  });

  it('avec un prospect déjà en négociation : l’action visible reste, la pastille le dit, plus de « À négocier »', () => {
    expect(quoteDecisionActions({ status: 'sent', hasProspect: true, negotiating: true })).toEqual({ visible: 'accept', more: [], badge: 'negotiating' });
  });

  it('sans prospect (devis d’un client) : seulement l’action visible', () => {
    expect(quoteDecisionActions({ status: 'viewed', hasProspect: false, negotiating: false })).toEqual({ visible: 'accept', more: [], badge: null });
  });

  it('un devis accepté affiche « Validé », rien d’autre', () => {
    expect(quoteDecisionActions({ status: 'accepted', hasProspect: true, negotiating: false })).toEqual({ visible: null, more: [], badge: 'validated' });
  });

  it.each(['draft', 'refused', 'expired', 'cancelled'] as QuoteStatus[])('%s : aucune action de décision', (status) => {
    expect(quoteDecisionActions({ status, hasProspect: true, negotiating: false })).toEqual({ visible: null, more: [], badge: null });
  });
});
