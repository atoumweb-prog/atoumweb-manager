import { describe, expect, it } from 'vitest';
import { CLIENT_TABS, clientTabKey, clientHistory, readClientSections } from './clientPresentation';

describe('03D Client presentation', () => {
  it('exposes the eight distinct destinations in the approved order', () => {
    expect(CLIENT_TABS.map(([, label]) => label)).toEqual(['Résumé', 'Contacts', 'Commercial', 'Contrats', 'Projets', 'Interventions', 'Documents', 'Historique']);
    expect(new Set(CLIENT_TABS.map(([id]) => id)).size).toBe(8);
  });
  it('wraps keyboard navigation without interpreting input keys', () => {
    expect(clientTabKey('summary', 'ArrowLeft')).toBe('history');
    expect(clientTabKey('history', 'ArrowRight')).toBe('summary');
    expect(clientTabKey('commercial', 'Home')).toBe('summary');
    expect(clientTabKey('commercial', 'End')).toBe('history');
    expect(clientTabKey('contacts', 'Escape')).toBeNull();
    expect(clientTabKey('contacts', 'a')).toBeNull();
  });
  it('deduplicates identity history by event ID, never by matching text', () => {
    const first = { id: 'a', entityType: 'client', entityId: 'c', action: 'created', summary: 'Conversion', createdAt: '2026-10-13' };
    const second = { ...first, id: 'b', entityType: 'prospect', createdAt: '2026-10-14' };
    expect(clientHistory([first], [first, second]).map(event => event.id)).toEqual(['b', 'a']);
  });
  it('retains successful sections when an independent service fails', async () => {
    const result = await readClientSections({ quotes: async () => ['quote-exact'], contacts: async () => { throw Error('Contacts unavailable'); }, projects: async () => ['provisional-exact'] });
    expect(result.values).toEqual({ quotes: ['quote-exact'], projects: ['provisional-exact'] });
    expect(result.errors).toEqual({ contacts: 'Contacts unavailable' });
    expect(result.values.contacts).toBeUndefined();
  });
  it('also captures synchronous failures without cancelling sibling readers', async () => {
    const result = await readClientSections({ identity: () => { throw Error('identity refused'); }, activity: async () => [] });
    expect(result.errors.identity).toBe('identity refused');
    expect(result.values.activity).toEqual([]);
  });
});
