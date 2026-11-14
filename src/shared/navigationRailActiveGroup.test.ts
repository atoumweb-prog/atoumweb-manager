import { describe, expect, it } from 'vitest';
import { NAVIGATION_GROUPS, NAVIGATION_MODULES, isGroupExpanded } from './navigationRail';

describe('R7 : le groupe de la page ouverte est toujours visible', () => {
  it('un groupe replié s’ouvre quand la page active en fait partie', () => {
    expect(isGroupExpanded('Gestion', 'Facturation', ['Gestion'])).toBe(true);
    expect(isGroupExpanded('Gestion', 'Dépenses', ['Gestion', 'Production'])).toBe(true);
    expect(isGroupExpanded('Gestion', 'Documents & Contrats', ['Gestion'])).toBe(true);
  });

  it('un groupe replié reste replié quand la page active est ailleurs', () => {
    expect(isGroupExpanded('Gestion', 'Projets', ['Gestion'])).toBe(false);
    expect(isGroupExpanded('Gestion', 'Accueil', ['Gestion'])).toBe(false);
  });

  it('un groupe non replié est ouvert, replis absents ou vides compris', () => {
    expect(isGroupExpanded('Commercial', 'Projets', ['Gestion'])).toBe(true);
    expect(isGroupExpanded('Gestion', 'Projets', undefined)).toBe(true);
    expect(isGroupExpanded('Gestion', 'Projets', [])).toBe(true);
  });

  it('chaque entrée de chaque groupe ouvre son propre groupe quand tous sont repliés', () => {
    for (const module of NAVIGATION_MODULES) {
      for (const group of NAVIGATION_GROUPS) {
        expect(isGroupExpanded(group, module.key, [...NAVIGATION_GROUPS]), `${module.key} / ${group}`).toBe(module.group === group);
      }
    }
  });
});
