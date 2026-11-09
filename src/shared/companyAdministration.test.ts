import {describe, it, expect} from 'vitest';
import {ADMIN_LABELS, MICRO_VAT_MENTION, adminChecklistLabel, isMicroVatMention} from './companyAdministration';
import {ADMIN_CONTRACT_KEYS} from './quoteContractPreparation';

describe('Mon entreprise — libellés et mention TVA', () => {
  it('labels every administrative key in plain French, without English technical keys', () => {
    for (const key of ADMIN_CONTRACT_KEYS) {
      expect(ADMIN_LABELS[key]).toBeTruthy();
      expect(adminChecklistLabel(key)).not.toMatch(/\b(identity|administrative|vat|complaints)\b/);
      expect(adminChecklistLabel(key)).toContain('Réglages › Mon entreprise et devis');
    }
  });
  it('recognises the micro-enterprise VAT mention exactly', () => {
    expect(MICRO_VAT_MENTION).toBe('TVA non applicable, article 293 B du CGI');
    expect(isMicroVatMention('  TVA non applicable, article 293 B du CGI ')).toBe(true);
    expect(isMicroVatMention('TVA 20 %')).toBe(false);
  });
});
