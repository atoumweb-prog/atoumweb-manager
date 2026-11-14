import { describe, expect, it } from 'vitest';
import { SETTINGS_SECTION_ORDER, companyStatus } from './settingsSections';

const item = (label: string, state: 'missing' | 'filled' | 'verify' | 'not_applicable') => ({ label, state });

describe('R9 : ordre des sections de Réglages', () => {
  it('Mon entreprise d’abord, Recette en dernier', () => {
    expect([...SETTINGS_SECTION_ORDER]).toEqual(['company', 'appearance', 'navigation', 'data', 'diagnostic', 'recette']);
  });
});

describe('R9 : phrase d’état de Mon entreprise', () => {
  const four = (state: 'missing' | 'filled' | 'verify' | 'not_applicable') => [
    item('Nom et statut de l’entreprise', state), item('Adresse, SIRET et coordonnées', state), item('TVA', state), item('Contact pour les réclamations', state),
  ];

  it('tout est renseigné', () => {
    expect(companyStatus({ scope: 'company', items: four('filled') })).toEqual({ tone: 'ok', text: 'Les 4 informations de tes devis sont renseignées.' });
    expect(companyStatus({ scope: 'terms', items: four('filled') })).toEqual({ tone: 'ok', text: 'Les 4 informations contractuelles sont renseignées.' });
  });

  it('nomme ce qui manque, première lettre en minuscule, sigle conservé', () => {
    const items = [item('Nom et statut de l’entreprise', 'filled'), item('Adresse, SIRET et coordonnées', 'filled'), item('TVA', 'missing'), item('Contact pour les réclamations', 'missing')];
    expect(companyStatus({ scope: 'company', items })).toEqual({ tone: 'todo', text: 'Il manque : TVA, contact pour les réclamations.' });
  });

  it('une seule information manquante', () => {
    const items = [item('Médiateur de la consommation', 'missing'), item('Données personnelles', 'filled')];
    expect(companyStatus({ scope: 'terms', items }).text).toBe('Il manque : médiateur de la consommation.');
  });

  it('à vérifier, seul ou avec une information manquante', () => {
    expect(companyStatus({ scope: 'terms', items: [item('Médiateur de la consommation', 'verify'), item('Données personnelles', 'filled')] }))
      .toEqual({ tone: 'todo', text: 'À vérifier : médiateur de la consommation.' });
    expect(companyStatus({ scope: 'terms', items: [item('Médiateur de la consommation', 'verify'), item('Données personnelles', 'missing')] }).text)
      .toBe('Il manque : données personnelles. À vérifier : médiateur de la consommation.');
  });

  it('« non applicable » compte comme traitée', () => {
    expect(companyStatus({ scope: 'terms', items: four('not_applicable') }).tone).toBe('ok');
  });

  it('une seule information, et liste vide', () => {
    expect(companyStatus({ scope: 'company', items: [item('TVA', 'filled')] }).text).toBe('L’information de tes devis est renseignée.');
    expect(companyStatus({ scope: 'terms', items: [item('Données personnelles', 'filled')] }).text).toBe('L’information contractuelle est renseignée.');
    expect(companyStatus({ scope: 'company', items: [] })).toEqual({ tone: 'ok', text: 'Aucune information à renseigner.' });
  });

  it('aucun texte ne contient de tiret long', () => {
    for (const scope of ['company', 'terms'] as const) {
      for (const state of ['missing', 'filled', 'verify'] as const) {
        expect(companyStatus({ scope, items: four(state) }).text).not.toMatch(/[—–]/);
      }
    }
  });
});
