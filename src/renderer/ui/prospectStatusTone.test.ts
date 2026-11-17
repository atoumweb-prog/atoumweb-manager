import { describe, expect, it } from 'vitest';
import { prospectStatusTone } from './prospectStatusTone';

describe('R3 : ton de la pastille d’étape d’un prospect (six rôles, décidés en R2)', () => {
  it.each([
    ['prepare', 'neutral'], ['ready', 'info'], ['qualifying', 'info'], ['need_identified', 'info'],
    ['quote_to_prepare', 'warning'], ['quote_to_send', 'warning'], ['quote_sent', 'info'], ['follow_up', 'warning'],
    ['waiting', 'neutral'], ['negotiation', 'accent'], ['won', 'success'], ['lost', 'danger'],
  ])('%s → %s', (key, tone) => {
    expect(prospectStatusTone(key)).toBe(tone);
  });

  it('un client est un succès, un dossier archivé ou une clé inconnue reste neutre (le libellé est toujours affiché)', () => {
    expect(prospectStatusTone('client')).toBe('success');
    expect(prospectStatusTone('archived')).toBe('neutral');
    expect(prospectStatusTone('new')).toBe('neutral');
    expect(prospectStatusTone('inconnu')).toBe('neutral');
  });
});
