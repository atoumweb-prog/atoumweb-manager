import { describe, expect, it } from 'vitest';
import { assertShellVisualKey } from './shellVisualPreferences';
import { HEADER_PREFERENCE_KEY } from './headerPresentation';
import { NAVIGATION_PREFERENCE_KEY } from './navigationRail';
import {HOME_WIDGET_PREFERENCE_KEY} from './homeWidgetPreference';
import {REAL_TABLE_SCHEMAS} from './realTableSchemas';
import {tableViewKey} from './tableViewPreference';
import {personalViewsKey} from './personalTableViews';
describe('real shell presentation access', () => {
  it.each(Object.keys(REAL_TABLE_SCHEMAS))('accepts standard and personal presentation keys for %s only',scope=>{
    expect(()=>assertShellVisualKey(tableViewKey(scope))).not.toThrow();
    expect(()=>assertShellVisualKey(personalViewsKey(scope))).not.toThrow();
    expect(()=>assertShellVisualKey(tableViewKey(scope+'-private'))).toThrow();
  });
  it('03D accepts only the registered Client layout key',()=>{expect(()=>assertShellVisualKey('atoumweb:layout:clients:list:v1')).not.toThrow();expect(()=>assertShellVisualKey('atoumweb:layout:clients:selected:v1')).toThrow();});
  it('accepts the registered Home presentation key',()=>expect(()=>assertShellVisualKey(HOME_WIDGET_PREFERENCE_KEY)).not.toThrow());
  it.each([HEADER_PREFERENCE_KEY, NAVIGATION_PREFERENCE_KEY])('accepts only registered shell key %s', key => expect(() => assertShellVisualKey(key)).not.toThrow());
  it.each(['theme', 'selectedId', 'time_session', 'atoumweb:table-workshop:dossiers:v1', null])('refuses arbitrary setting %s', key => expect(() => assertShellVisualKey(key)).toThrow());
});
