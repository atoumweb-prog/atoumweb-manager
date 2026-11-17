import { describe, expect, it } from 'vitest';
import { hasActiveFilters, tableEmptyMessage } from './tableEmpty';

describe('message de tableau vide', () => {
  it('sans filtre actif, ne parle jamais de filtres et ne propose rien à effacer', () => {
    const message = tableEmptyMessage({});
    expect(message.text).toBe('Rien à afficher pour l’instant.');
    expect(message.text).not.toMatch(/filtre/i);
    expect(message.clearLabel).toBeUndefined();
    expect(tableEmptyMessage({ filtersActive: false }).text).not.toMatch(/filtre/i);
  });

  it('avec un filtre actif, le dit et propose de l’effacer', () => {
    expect(tableEmptyMessage({ filtersActive: true })).toEqual({ text: 'Aucun résultat pour ces filtres.', clearLabel: 'Effacer les filtres' });
  });
});

describe('hasActiveFilters', () => {
  it('est faux quand toutes les valeurs sont neutres', () => {
    expect(hasActiveFilters([])).toBe(false);
    expect(hasActiveFilters(['', 'all'])).toBe(false);
    expect(hasActiveFilters(['  ', 'tous', null, undefined, false])).toBe(false);
  });

  it('est vrai dès qu’une valeur est renseignée', () => {
    expect(hasActiveFilters(['', 'draft'])).toBe(true);
    expect(hasActiveFilters(['dupont'])).toBe(true);
  });
});
