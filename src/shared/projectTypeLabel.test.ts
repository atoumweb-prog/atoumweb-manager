import { describe, expect, it } from 'vitest';
import { projectTypeLabel } from './projectTypeLabel';

describe('R5a : libellé français du type de projet', () => {
  it.each([
    ['website', 'Site vitrine'], ['vitrine', 'Site vitrine'], ['ecommerce', 'Boutique en ligne'], ['landing', 'Landing page'],
    ['application', 'Application'], ['software', 'Logiciel'], ['internal', 'Projet interne AtoumWeb'],
  ])('%s → %s', (type, label) => {
    expect(projectTypeLabel(type)).toBe(label);
  });
  it('un type inconnu reste lisible (première lettre en majuscule), jamais vide', () => {
    expect(projectTypeLabel('maintenance')).toBe('Maintenance');
    expect(projectTypeLabel('')).toBe('Type non précisé');
  });
});
