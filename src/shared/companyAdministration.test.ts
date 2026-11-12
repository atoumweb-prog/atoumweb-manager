import {describe, it, expect} from 'vitest';
import {ADMIN_LABELS, GDPR_QUOTE_LINE, MICRO_VAT_MENTION, adminChecklistLabel, involvesPersonalData, isMicroVatMention} from './companyAdministration';
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

describe('ligne RGPD fixe du devis', () => {
  it('concerne les sites, boutiques, hébergement, maintenance, interventions, newsletters et mariage', () => {
    for (const code of ['AW-WEB-VITRINE', 'V39-WEB-BUSINESS', 'AW-ECOM-BASE', 'V39-ECOM-VISIBILITE', 'AW-LP-BASE', 'AW-MAINT-WP-M', 'V39-HOST-LUNE', 'AW-TECH-DEPANNAGE', 'V39-NL-1-M', 'AW-MARIAGE-ESS', 'AW-DEVWP-AJUST']) {
      expect(involvesPersonalData([code]), code).toBe(true);
    }
  });
  it('ne concerne pas photo, identité visuelle, rédaction, SEO ni statistiques seuls', () => {
    for (const code of ['AW-PHOTO-PACK10', 'AW-BRAND-LOGO', 'V39-BRAND-CHARTE', 'AW-CONT-PAGE', 'AW-SEO-ESSENTIEL', 'AW-DATA-GA-SC', 'V39-STAT-ESS-M']) {
      expect(involvesPersonalData([code]), code).toBe(false);
    }
  });
  it('un seul service concerné suffit, et les lignes libres sont ignorées', () => {
    expect(involvesPersonalData([null, undefined, 'AW-PHOTO-PACK10', 'AW-MAINT-WC-A'])).toBe(true);
    expect(involvesPersonalData([null, undefined])).toBe(false);
  });
  it('la ligne fixe annonce un accord distinct et son modèle consultable avant l’acceptation', () => {
    expect(GDPR_QUOTE_LINE).toMatch(/distinct du devis/);
    expect(GDPR_QUOTE_LINE).toMatch(/avant toute opération/);
    expect(GDPR_QUOTE_LINE).toMatch(/consulté avant l’acceptation/);
    expect(GDPR_QUOTE_LINE).not.toMatch(/ — | – /);
  });
});
