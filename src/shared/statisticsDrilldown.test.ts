import { describe, expect, it } from 'vitest';
import { createStatisticsDrilldown, isStatisticsDrilldownRoute, matchStatisticsDrilldown } from './statisticsDrilldown';
describe('navigation fidèle aux cohortes statistiques', () => {
  it('préserve la période, les IDs et la destination au clic, même si aucun élément', () => {
    const route = createStatisticsDrilldown('invoiced', ['b1', 'b2', 'b1'], 'Octobre 2026');
    expect(route).toEqual({ kind: 'invoiced', destination: 'Facturation', ids: ['b1', 'b2'], periodLabel: 'Octobre 2026' });
    expect(isStatisticsDrilldownRoute(route)).toBe(true);
    expect(createStatisticsDrilldown('signed', [], 'Toutes les données').destination).toBe('Devis');
    expect(createStatisticsDrilldown('time', ['s1'], 'Semaine').destination).toBe('Gestion des temps');
  });
  it('n’élargit pas une cohorte obsolète à tous les enregistrements et compte les absences', () => {
    const route = createStatisticsDrilldown('invoiced', ['b1', 'b2'], 'Période');
    const result = matchStatisticsDrilldown([
      { id: 'b1', status: 'invoiced', price: 200 },
      { id: 'b2', status: 'planned', price: 400 },
      { id: 'b3', status: 'invoiced', price: 900 },
    ], route, row => row.status === 'invoiced');
    expect(result.rows.map(item => item.id)).toEqual(['b1']);
    expect(result.unavailable).toBe(1);
    expect(matchStatisticsDrilldown([{ id: 'b3' }], route).rows).toEqual([]);
    expect(matchStatisticsDrilldown([{ id: 'b3' }], route).unavailable).toBe(2);
  });
  it('rejette une route mal typée ou une liste corrompue', () => {
    expect(isStatisticsDrilldownRoute({ kind: 'signed', destination: 'Facturation', ids: ['q1'], periodLabel: '' })).toBe(false);
    expect(isStatisticsDrilldownRoute({ kind: 'time', destination: 'Gestion des temps', ids: [null], periodLabel: '' })).toBe(false);
    expect(() => createStatisticsDrilldown('signed', ['', 'x'], 'Période')).toThrow(/Identifiants/);
  });
});
