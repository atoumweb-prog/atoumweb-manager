import { describe, expect, it } from 'vitest';
import { defaultTableView, readTableView, tableViewKey, writeTableView } from './tableViewPreference';
describe('table pilot preference whitelist', () => {
  const store = (raw: string | null) => ({ getItem: () => raw, setItem() {}, removeItem() {} });
  it('keeps independent view keys', () => { expect(tableViewKey('dossiers')).not.toBe(tableViewKey('autre-vue')); });
  it('defaults to all columns without a record selection', () => { expect(readTableView(store(null), 'x', [], [])).toEqual(defaultTableView()); });
  it('restores required columns and removes unknown fields and filters', () => { expect(readTableView(store('{"version":1,"visibleColumnIds":["unknown","status"],"sort":{"columnId":"missing","direction":"asc"},"status":"forged"}'), 'x', ['demo'], [])).toEqual({ version: 1, visibleColumnIds: ['identity', 'status', 'open'], sort: null, status: '', category: '' }); });
  it('preserves valid sort and fixture filters', () => { const view = { ...defaultTableView(), sort: { columnId: 'amount', direction: 'desc' as const }, status: 'demo', category: 'A' }; expect(readTableView(store(JSON.stringify(view)), 'x', ['demo'], ['A'])).toEqual(view); });
  it.each(['bad', 'null', '{"version":99}'])('rejects corrupt format %s', raw => { expect(() => readTableView(store(raw), 'x', [], [])).toThrow(); });
  it('never persists draft, free query or selected identity', () => { let raw = ''; writeTableView({ getItem: () => null, setItem: (_key, value) => { raw = value; }, removeItem() {} }, 'x', { ...defaultTableView(), selectedId: 'private', query: 'secret', draft: 'secret' } as ReturnType<typeof defaultTableView>); expect(JSON.parse(raw)).toEqual(defaultTableView()); });
});
