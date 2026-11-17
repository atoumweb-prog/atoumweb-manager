import { describe, expect, it } from 'vitest';
import { quoteStatusTone } from './quoteStatusTone';

describe('R4 : ton de la pastille de statut d’un devis', () => {
  it.each([
    ['draft', 'neutral'], ['sent', 'info'], ['viewed', 'info'], ['accepted', 'success'],
    ['refused', 'danger'], ['expired', 'warning'], ['cancelled', 'neutral'],
  ])('%s → %s', (status, tone) => {
    expect(quoteStatusTone(status)).toBe(tone);
  });

  it('un statut inconnu reste neutre (le libellé est toujours affiché à côté)', () => {
    expect(quoteStatusTone('inconnu')).toBe('neutral');
  });
});
