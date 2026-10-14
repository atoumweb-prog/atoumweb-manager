import { describe, expect, it } from 'vitest';
import { hasBlockingProspectInformation, parseProspectInformation, patchProspectInformation, serializeProspectInformation } from './prospectInformation';

describe('prospectInformation', () => {
  it('transforme une ancienne note texte en point bloquant sans la perdre', () => {
    const items = parseProspectInformation('Combien peuvent-ils investir ?');
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ label: 'Combien peuvent-ils investir ?', status: 'open', isBlocking: true });
  });

  it('conserve les points résolus et non bloquants dans le snapshot JSON', () => {
    const serialized = serializeProspectInformation([
      { id: 'budget', label: 'Budget', status: 'resolved', isBlocking: true, answer: '1 200 €', resolvedAt: '2026-09-16T08:00:00.000Z' },
      { id: 'hosting', label: 'Accès hébergement', status: 'later', isBlocking: false, answer: null, resolvedAt: null },
    ]);
    const items = parseProspectInformation(serialized);
    expect(items).toHaveLength(2);
    expect(items[0].answer).toBe('1 200 €');
    expect(items[1]).toMatchObject({ status: 'later', isBlocking: false });
    expect(hasBlockingProspectInformation(serialized)).toBe(false);
  });

  it('03C : conserve une réponse saisie juste avant le passage en résolu, sans rerender intermédiaire', () => {
    const initial = [{ id: 'dns', label: 'Accès DNS', status: 'open' as const, isBlocking: true, answer: null, resolvedAt: null }];
    const answered = patchProspectInformation(initial, 'dns', { answer: 'Accès transmis' }, '2026-10-13T09:00:00.000Z');
    const resolved = patchProspectInformation(answered, 'dns', { status: 'resolved' }, '2026-10-13T09:00:01.000Z');
    const persisted = parseProspectInformation(serializeProspectInformation(resolved));
    expect(persisted[0]).toMatchObject({
      answer: 'Accès transmis', status: 'resolved', resolvedAt: '2026-10-13T09:00:01.000Z',
    });
    expect(hasBlockingProspectInformation(serializeProspectInformation(resolved))).toBe(false);
    expect(initial[0].answer).toBeNull();
  });

  it('03C : une nouvelle modification conserve les autres points et neutralise Later', () => {
    const initial = [
      { id: 'one', label: 'Budget', status: 'open' as const, isBlocking: true, answer: null },
      { id: 'two', label: 'Domaine', status: 'open' as const, isBlocking: true, answer: null },
    ];
    const answered = patchProspectInformation(initial, 'one', { answer: '800 €' }, '2026-10-13T09:00:00.000Z');
    const deferred = patchProspectInformation(answered, 'two', { status: 'later', isBlocking: true }, '2026-10-13T09:01:00.000Z');
    expect(deferred[0]).toMatchObject({ answer: '800 €', status: 'open', isBlocking: true });
    expect(deferred[1]).toMatchObject({ status: 'later', isBlocking: false, resolvedAt: null });
    expect(initial[1].status).toBe('open');
    const restored = patchProspectInformation(deferred, 'two', { status: 'open', isBlocking: true }, '2026-10-13T09:02:00.000Z');
    expect(restored[1].isBlocking).toBe(true);
    expect(patchProspectInformation(restored, 'unknown', { status: 'resolved' }, '2026-10-13T09:02:00.000Z'))
      .toEqual(restored);
  });

  it('ne bloque que les points ouverts explicitement bloquants', () => {
    const serialized = serializeProspectInformation([
      { id: 'one', label: 'Réponse attendue', status: 'open', isBlocking: true },
      { id: 'two', label: 'Accès plus tard', status: 'later', isBlocking: false },
    ]);
    expect(hasBlockingProspectInformation(serialized)).toBe(true);
  });
});
