import { describe, expect, it } from 'vitest';
import { HOME_WIDGET_KEYS, defaultHomeWidgets, normalizeHomeWidgets } from './homeWidgetPreference';

describe('R6 : dispositions de l’Accueil', () => {
  it('sans disposition enregistrée, les blocs de suivi sont repliés et la liste À faire maintenant ne l’est pas', () => {
    const preference = defaultHomeWidgets();
    expect(preference.collapsed).toEqual(['kpis', 'pipeline', 'time', 'actions']);
    expect(preference.collapsed).not.toContain('today');
    expect(preference.collapsed).not.toContain('watch');
    expect(preference.hidden).toEqual([]);
    expect(preference.order).toEqual([...HOME_WIDGET_KEYS]);
  });

  it('une disposition déjà enregistrée sans repli est relue à l’identique : rien n’est replié à sa place', () => {
    const stored = normalizeHomeWidgets({ version: 1, order: [...HOME_WIDGET_KEYS], hidden: [] });
    expect(stored.collapsed).toBeUndefined();
  });

  it('une disposition enregistrée avec ses propres replis les garde', () => {
    const stored = normalizeHomeWidgets({ version: 1, order: [...HOME_WIDGET_KEYS], hidden: ['time'], collapsed: ['watch'] });
    expect(stored.collapsed).toEqual(['watch']);
    expect(stored.hidden).toEqual(['time']);
  });

  it('la clé « today » reste la première et n’est jamais masquée', () => {
    const stored = normalizeHomeWidgets({ version: 1, order: ['pipeline', 'today', 'kpis'], hidden: ['today'] });
    expect(stored.order[0]).toBe('today');
  });
});
