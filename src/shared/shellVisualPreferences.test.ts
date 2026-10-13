import { describe, expect, it } from 'vitest';
import { assertShellVisualKey } from './shellVisualPreferences';
import { HEADER_PREFERENCE_KEY } from './headerPresentation';
import { NAVIGATION_PREFERENCE_KEY } from './navigationRail';
describe('real shell presentation access', () => {
  it.each([HEADER_PREFERENCE_KEY, NAVIGATION_PREFERENCE_KEY])('accepts only registered shell key %s', key => expect(() => assertShellVisualKey(key)).not.toThrow());
  it.each(['theme', 'selectedId', 'time_session', 'atoumweb:table-workshop:dossiers:v1', null])('refuses arbitrary setting %s', key => expect(() => assertShellVisualKey(key)).toThrow());
});
