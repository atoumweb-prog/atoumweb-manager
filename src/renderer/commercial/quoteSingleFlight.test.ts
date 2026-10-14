import { describe, expect, it, vi } from 'vitest';
import { createSingleFlightGate } from './quoteSingleFlight';

describe('06D/06E — verrou synchrone référence et PDF Abby', () => {
  it('refuse un second déclenchement avant la première réponse, sans seconde écriture', async () => {
    const gate = createSingleFlightGate();
    let finish!: () => void;
    const request = vi.fn(() => new Promise<void>(resolve => { finish = resolve; }));
    const first = gate.run(request);
    expect(gate.active).toBe(true);
    expect(await gate.run(request)).toBe(false);
    expect(request).toHaveBeenCalledTimes(1);
    finish();
    expect(await first).toBe(true);
    expect(gate.active).toBe(false);
  });

  it('libère le verrou après refus serveur et accepte une nouvelle tentative', async () => {
    const gate = createSingleFlightGate();
    const failed = vi.fn(async () => { throw new Error('PDF refusé'); });
    await expect(gate.run(failed)).rejects.toThrow('PDF refusé');
    expect(gate.active).toBe(false);
    const retry = vi.fn(async () => {});
    expect(await gate.run(retry)).toBe(true);
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('séquence les opérations différentes (référence et import) sans les lancer en parallèle', async () => {
    const gate = createSingleFlightGate();
    let finish!: () => void;
    const reference = vi.fn(() => new Promise<void>(resolve => { finish = resolve; }));
    const pdf = vi.fn(async () => {});
    const pending = gate.run(reference);
    expect(await gate.run(pdf)).toBe(false);
    expect(pdf).not.toHaveBeenCalled();
    finish();
    await pending;
    expect(await gate.run(pdf)).toBe(true);
    expect(pdf).toHaveBeenCalledTimes(1);
  });
});
