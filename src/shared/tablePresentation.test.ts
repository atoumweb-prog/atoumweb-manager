import { describe, expect, it } from 'vitest';
import { nextTableSort, normalizeTableColumns, sortTableRows } from './tablePresentation';
import { filterWorkshopRecords, TABLE_WORKSHOP_RECORDS } from './tableWorkshopFixtures';
describe('read-only table presentation', () => {
  const rows = Object.freeze([{ id: 'B', n: 100, name: 'École', date: '2026-10-02' }, { id: 'A', n: 99, name: 'Ecole', date: '2026-10-01' }, { id: 'C', n: 0, name: 'Atelier', date: null }].map(row => Object.freeze(row)));
  const columns = [{ id: 'amount', sortValue: (r: typeof rows[number]) => r.n }, { id: 'name', sortValue: (r: typeof rows[number]) => r.name }, { id: 'date', sortValue: (r: typeof rows[number]) => r.date }];
  it('keeps numeric cents numeric, with no source mutation', () => { expect(sortTableRows(rows, columns, { columnId: 'amount', direction: 'asc' }, r => r.id).map(r => r.id)).toEqual(['C', 'A', 'B']); expect(rows.map(r => r.id)).toEqual(['B', 'A', 'C']); });
  it('uses French collation and identity for equal names', () => { expect(sortTableRows(rows, columns, { columnId: 'name', direction: 'asc' }, r => r.id).map(r => r.id)).toEqual(['C', 'A', 'B']); });
  it('keeps date nulls last in both directions', () => { expect(sortTableRows(rows, columns, { columnId: 'date', direction: 'asc' }, r => r.id).map(r => r.id)).toEqual(['A', 'B', 'C']); expect(sortTableRows(rows, columns, { columnId: 'date', direction: 'desc' }, r => r.id).map(r => r.id)).toEqual(['B', 'A', 'C']); });
  it('restores source order without sorting business data', () => { expect(sortTableRows(rows, columns, null, r => r.id)).toEqual(rows); expect(sortTableRows(rows, columns, { columnId: 'unknown', direction: 'asc' }, r => r.id)).toEqual(rows); });
  it('cycles ascending, descending, default', () => { const first = nextTableSort(null, 'amount'), second = nextTableSort(first, 'amount'); expect(first?.direction).toBe('asc'); expect(second?.direction).toBe('desc'); expect(nextTableSort(second, 'amount')).toBeNull(); });
  it('always keeps required identity and open columns', () => { expect(normalizeTableColumns(['status', 'unknown'], [{ id: 'identity', required: true }, { id: 'status' }, { id: 'open', required: true }])).toEqual(['identity', 'status', 'open']); });
  it('has 120 immutable synthetic identities', () => { expect(TABLE_WORKSHOP_RECORDS).toHaveLength(120); expect(new Set(TABLE_WORKSHOP_RECORDS.map(r => r.id)).size).toBe(120); expect(Object.isFrozen(TABLE_WORKSHOP_RECORDS[0])).toBe(true); });
  it('filters conjunctively with exact counters and preserves the source', () => { const before = JSON.stringify(TABLE_WORKSHOP_RECORDS); expect(filterWorkshopRecords(' TEST-001 ', '', '').map(r => r.id)).toEqual(['TEST-001']); expect(filterWorkshopRecords('', 'En cours', 'Commerce')).toHaveLength(13); expect(filterWorkshopRecords('no-match', '', '')).toHaveLength(0); expect(JSON.stringify(TABLE_WORKSHOP_RECORDS)).toBe(before); });
});
