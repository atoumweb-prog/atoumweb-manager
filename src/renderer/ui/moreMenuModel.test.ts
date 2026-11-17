import { describe, expect, it } from 'vitest';
import { initialMenuState, nextMenuState, type MenuItem } from './moreMenuModel';

const items: MenuItem[] = [
  { id: 'identite', label: 'Identité et logo' },
  { id: 'associations', label: 'Associations', disabled: true },
  { id: 'archiver', label: 'Archiver' },
  { id: 'perdu', label: 'Classer comme perdu', danger: true },
];

const press = (state = initialMenuState(), key: string) => nextMenuState(state, { type: 'key', key }, items);

describe('menu « Plus » : modèle de clavier', () => {
  it('starts closed with no active item', () => {
    expect(initialMenuState()).toEqual({ open: false, active: -1 });
  });

  it('opens on ArrowDown, Enter or Space on the first enabled item', () => {
    for (const key of ['ArrowDown', 'Enter', ' ']) {
      expect(press(undefined, key).state).toEqual({ open: true, active: 0 });
    }
  });

  it('opens on ArrowUp on the last enabled item', () => {
    expect(press(undefined, 'ArrowUp').state).toEqual({ open: true, active: 3 });
  });

  it('skips disabled items with ArrowDown and ArrowUp, and wraps around', () => {
    let state = press(undefined, 'ArrowDown').state; // 0
    state = press(state, 'ArrowDown').state; // 2 (1 est désactivé)
    expect(state.active).toBe(2);
    state = press(state, 'ArrowDown').state; // 3
    state = press(state, 'ArrowDown').state; // 0 (retour au début)
    expect(state.active).toBe(0);
    state = press(state, 'ArrowUp').state; // 3 (retour à la fin)
    expect(state.active).toBe(3);
    state = press(state, 'ArrowUp').state; // 2
    state = press(state, 'ArrowUp').state; // 0 (saute 1)
    expect(state.active).toBe(0);
  });

  it('goes to the first and last enabled items with Home and End', () => {
    const open = press(undefined, 'ArrowDown').state;
    expect(press(open, 'End').state.active).toBe(3);
    expect(press({ open: true, active: 3 }, 'Home').state.active).toBe(0);
  });

  it('closes on Escape and asks to give the focus back to the trigger', () => {
    const result = press({ open: true, active: 2 }, 'Escape');
    expect(result.state).toEqual({ open: false, active: -1 });
    expect(result.focusTrigger).toBe(true);
  });

  it('closes on Tab without stealing the focus', () => {
    const result = press({ open: true, active: 2 }, 'Tab');
    expect(result.state.open).toBe(false);
    expect(result.focusTrigger).toBeFalsy();
  });

  it('selects the active enabled item on Enter, closes and gives the focus back', () => {
    const result = press({ open: true, active: 2 }, 'Enter');
    expect(result.select).toBe('archiver');
    expect(result.state.open).toBe(false);
    expect(result.focusTrigger).toBe(true);
  });

  it('never selects a disabled item', () => {
    const result = press({ open: true, active: 1 }, 'Enter');
    expect(result.select).toBeUndefined();
  });

  it('does not open a menu with no enabled item', () => {
    const none: MenuItem[] = [{ id: 'a', label: 'A', disabled: true }];
    expect(nextMenuState(initialMenuState(), { type: 'key', key: 'ArrowDown' }, none).state.open).toBe(false);
  });

  it('toggles on click and closes on outside click', () => {
    const opened = nextMenuState(initialMenuState(), { type: 'toggle' }, items).state;
    expect(opened.open).toBe(true);
    expect(nextMenuState(opened, { type: 'toggle' }, items).state.open).toBe(false);
    expect(nextMenuState(opened, { type: 'close' }, items).state).toEqual({ open: false, active: -1 });
  });
});
