import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Electron events, not the restoration's production coordinator.
const fake = vi.hoisted(() => ({
  listeners: {} as Record<string, Array<(event: { preventDefault(): void }) => void>>,
  responses: [] as number[],
  errors: [] as Array<[string, string]>,
}));
vi.mock('electron', () => ({
  app: {
    on: (name: string, handler: (event: { preventDefault(): void }) => void) => {
      (fake.listeners[name] ??= []).push(handler);
    },
  },
  BrowserWindow: { getFocusedWindow: () => null, fromId: () => null },
  dialog: {
    showMessageBoxSync: () => fake.responses.shift() ?? 0,
    showErrorBox: (title: string, message: string) => { fake.errors.push([title, message]); },
  },
  ipcMain: { on: () => undefined, removeAllListeners: () => undefined },
}));

import { bindUnsavedWindow, registerGuardedShutdown, unsavedWindows } from './unsaved';
import { restoreQuitGate } from './restoreQuitGate';

function fireApp(name: string): boolean {
  const event = { preventDefault: vi.fn() };
  for (const handler of fake.listeners[name] ?? []) handler(event);
  return event.preventDefault.mock.calls.length > 0;
}

beforeEach(() => {
  fake.listeners = {};
  fake.responses.length = 0;
  fake.errors.length = 0;
  restoreQuitGate.cancel();
});
afterEach(() => {
  restoreQuitGate.cancel();
  for (const id of [6101, 6102, 6103]) unsavedWindows.remove(id);
  fake.listeners = {};
});

describe('raccordement des gardes UX-01 au cycle de vie Electron', () => {
  it('will-quit écrit une restauration acceptée, mais jamais avant before-quit', () => {
    const persist = vi.fn(), cleanup = vi.fn();
    registerGuardedShutdown(cleanup);
    restoreQuitGate.arm(persist);
    expect(fireApp('before-quit')).toBe(false);
    expect(persist).not.toHaveBeenCalled();
    fireApp('will-quit');
    expect(persist).toHaveBeenCalledOnce();
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it('Rester sur une saisie annule le quit et son marqueur futur', () => {
    const persist = vi.fn(), cleanup = vi.fn();
    registerGuardedShutdown(cleanup);
    unsavedWindows.add(6101);
    unsavedWindows.update(6101, { epoch: 'fixture', revision: 1, labels: ['Prospection'], pending: false });
    restoreQuitGate.arm(persist);
    expect(fireApp('before-quit')).toBe(true);
    expect(restoreQuitGate.commitOnQuit()).toBe(false);
    expect(persist).not.toHaveBeenCalled();
    expect(cleanup).not.toHaveBeenCalled();
  });

  it('un enregistrement pending bloque la sortie même après accord ancien', () => {
    const persist = vi.fn(), cleanup = vi.fn();
    registerGuardedShutdown(cleanup);
    unsavedWindows.add(6102);
    unsavedWindows.update(6102, { epoch: 'fixture', revision: 1, labels: ['Devis'], pending: false });
    fake.responses.push(1);
    const approved = unsavedWindows.approveAll();
    expect(approved).not.toBeNull();
    unsavedWindows.remember(approved!);
    unsavedWindows.update(6102, { epoch: 'fixture', revision: 2, labels: ['Devis'], pending: true });
    restoreQuitGate.arm(persist);
    expect(fireApp('before-quit')).toBe(true);
    expect(restoreQuitGate.commitOnQuit()).toBe(false);
    expect(cleanup).not.toHaveBeenCalled();
  });

  it('Rester lors du will-prevent-unload d’une fenêtre détachée annule la demande', () => {
    const windowHandlers: Record<string, (event: { preventDefault(): void }) => void> = {};
    const window = {
      id: 6103,
      on: (name: string, handler: (event: { preventDefault(): void }) => void) => {
        windowHandlers[name] = handler;
      },
      webContents: { on: (name: string, handler: (event: { preventDefault(): void }) => void) => {
        windowHandlers[name] = handler;
      } },
    } as unknown as Parameters<typeof bindUnsavedWindow>[0];
    bindUnsavedWindow(window);
    unsavedWindows.update(6103, { epoch: 'detached', revision: 1, labels: ['Référence Prospect'], pending: false });
    const persist = vi.fn();
    restoreQuitGate.arm(persist);
    const unload = { preventDefault: vi.fn() };
    windowHandlers['will-prevent-unload'](unload);
    expect(unload.preventDefault).not.toHaveBeenCalled();
    expect(restoreQuitGate.commitOnQuit()).toBe(false);
    expect(persist).not.toHaveBeenCalled();
    windowHandlers.closed({ preventDefault: () => undefined });
  });

  it('une erreur de prévalidation finale est signalée sans relance implicite', () => {
    const cleanup = vi.fn();
    registerGuardedShutdown(cleanup);
    restoreQuitGate.arm(() => { throw new Error('Source changée'); });
    expect(fireApp('before-quit')).toBe(false);
    fireApp('will-quit');
    expect(fake.errors).toHaveLength(1);
    expect(fake.errors[0][1]).toContain('Source changée');
    expect(cleanup).toHaveBeenCalledOnce();
    expect(restoreQuitGate.commitOnQuit()).toBe(false);
  });
});
