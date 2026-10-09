import { describe, expect, it, vi } from 'vitest';
import { RestoreQuitGate } from './restoreQuitGate';

describe('restauration différée et sortie Electron', () => {
  it('ne programme la restauration qu’au vrai will-quit, une seule fois', () => {
    const gate = new RestoreQuitGate();
    const persist = vi.fn();
    const token = gate.arm(persist);
    expect(gate.isActive(token)).toBe(true);
    expect(persist).not.toHaveBeenCalled();
    expect(gate.commitOnQuit()).toBe(true);
    expect(persist).toHaveBeenCalledOnce();
    expect(gate.commitOnQuit()).toBe(false);
    expect(persist).toHaveBeenCalledOnce();
  });

  it('Rester après une nouvelle saisie empêche la restauration, même au prochain quit', () => {
    const gate = new RestoreQuitGate();
    const persist = vi.fn();
    const token = gate.arm(persist);
    gate.cancel();
    expect(gate.isActive(token)).toBe(false);
    expect(gate.commitOnQuit()).toBe(false);
    expect(persist).not.toHaveBeenCalled();
  });

  it('un ancien timer ne peut pas déclencher une nouvelle demande', () => {
    const gate = new RestoreQuitGate();
    const old = gate.arm(vi.fn());
    gate.cancel();
    const current = gate.arm(vi.fn());
    expect(gate.isActive(old)).toBe(false);
    expect(gate.isActive(current)).toBe(true);
  });

  it('un échec de validation à will-quit ne laisse pas un acte rejouable', () => {
    const gate = new RestoreQuitGate();
    const persist = vi.fn(() => { throw new Error('Sauvegarde invalide'); });
    gate.arm(persist);
    expect(() => gate.commitOnQuit()).toThrow('Sauvegarde invalide');
    expect(gate.commitOnQuit()).toBe(false);
    expect(persist).toHaveBeenCalledOnce();
  });

  it('refuse deux demandes de restauration simultanées', () => {
    const gate = new RestoreQuitGate();
    gate.arm(vi.fn());
    expect(() => gate.arm(vi.fn())).toThrow(/déjà/);
  });
});
