import { describe, expect, it } from 'vitest';
import { OPEN_OPERATIONS_PROJECT_EVENT, filterByProject } from './operationsProjectFilter';

describe('P3b F20 : filtre par projet de la page Interventions', () => {
  const items = [
    { id: 'a', projectId: 'p1' },
    { id: 'b', projectId: 'p2' },
    { id: 'c', projectId: null },
    { id: 'd' },
    { id: 'e', projectId: 'p1' },
  ];

  it('sans filtre, rend tous les éléments sans les modifier', () => {
    expect(filterByProject(items, null)).toEqual(items);
    expect(filterByProject(items, undefined)).toEqual(items);
    expect(filterByProject(items, '')).toEqual(items);
  });

  it('avec un projet, ne garde que ses éléments (ceux sans projet sont exclus)', () => {
    expect(filterByProject(items, 'p1').map(item => item.id)).toEqual(['a', 'e']);
    expect(filterByProject(items, 'p2').map(item => item.id)).toEqual(['b']);
  });

  it('un projet inconnu ou une liste vide donne une liste vide', () => {
    expect(filterByProject(items, 'inconnu')).toEqual([]);
    expect(filterByProject([], 'p1')).toEqual([]);
  });

  it('ne modifie pas la liste d’origine', () => {
    const copy = items.map(item => ({ ...item }));
    filterByProject(items, 'p1');
    expect(items).toEqual(copy);
  });

  it('l’événement de navigation a un nom stable', () => {
    expect(OPEN_OPERATIONS_PROJECT_EVENT).toBe('atoumweb:open-operations-project');
  });
});
