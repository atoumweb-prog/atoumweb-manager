import { describe, expect, it } from 'vitest';
import { hasBlockingProspectInformation, parseProspectInformation, serializeProspectInformation } from './prospectInformation';

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

  it('ne bloque que les points ouverts explicitement bloquants', () => {
    const serialized = serializeProspectInformation([
      { id: 'one', label: 'Réponse attendue', status: 'open', isBlocking: true },
      { id: 'two', label: 'Accès plus tard', status: 'later', isBlocking: false },
    ]);
    expect(hasBlockingProspectInformation(serialized)).toBe(true);
  });
});
