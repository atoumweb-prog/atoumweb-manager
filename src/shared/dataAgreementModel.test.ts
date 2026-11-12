import { describe, expect, it } from 'vitest';
import { DATA_AGREEMENT_MODEL_NOTICE, dataAgreementModelAnnexHtml, dataAgreementModelBodyHtml, dataAgreementModelDocument } from './dataAgreementModel';

describe('modèle d’accord de protection des données joint au devis', () => {
  it('reprend le texte retenu, avec les onze articles et les fiches A et B vierges', () => {
    const html = dataAgreementModelBodyHtml();
    expect(html).toContain('Accord de protection des données');
    for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) expect(html, `article ${n}`).toMatch(new RegExp(`${n}\. `));
    expect(html).toContain('FICHE A');
    expect(html).toContain('FICHE B');
    expect(html).toContain('[domaine]');
  });
  it('précise que le modèle est pour information et non signable', () => {
    expect(dataAgreementModelBodyHtml()).toContain('MODÈLE POUR INFORMATION');
    expect(DATA_AGREEMENT_MODEL_NOTICE).toMatch(/non signable/);
    expect(DATA_AGREEMENT_MODEL_NOTICE).toMatch(/avant la première opération/);
  });
  it('préremplit seulement le client et la référence du devis, jamais le site ni la date', () => {
    const html = dataAgreementModelAnnexHtml({ clientName: 'Boulangerie Test', quoteNumber: 'DEV-2026-042' });
    expect(html).toContain('Boulangerie Test');
    expect(html).toContain('DEV-2026-042');
    expect(html).not.toContain('[Nom / raison sociale]');
    expect(html).toContain('[nom de domaine]');
    expect(html).toContain('[date]');
  });
  it('échappe le nom du client et sépare l’annexe sur une nouvelle page', () => {
    const html = dataAgreementModelAnnexHtml({ clientName: '<b>Client & Fils</b>', quoteNumber: 'DEV-1' });
    expect(html).not.toContain('<b>Client');
    expect(html).toContain('&lt;b&gt;Client &amp; Fils&lt;/b&gt;');
    expect(html).toContain('break-before:page');
  });
  it('le document autonome est un HTML complet', () => {
    expect(dataAgreementModelDocument()).toMatch(/^<!doctype html>/);
  });
});
