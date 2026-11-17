/**
 * Modèle du menu « Plus » : fonction pure, testée sans navigateur.
 * Le composant `MoreMenu` ne fait que relayer les événements du clavier et de la souris.
 */
export interface MenuItem {
  id: string;
  label: string;
  disabled?: boolean;
  danger?: boolean;
}

export interface MenuState {
  open: boolean;
  /** Indice de l'élément actif dans `items`, ou -1. */
  active: number;
}

export type MenuEvent = { type: 'toggle' } | { type: 'close' } | { type: 'key'; key: string };

export interface MenuResult {
  state: MenuState;
  /** Vrai quand le focus doit revenir sur le bouton « Plus ». */
  focusTrigger?: boolean;
  /** Identifiant de l'élément choisi, jamais celui d'un élément désactivé. */
  select?: string;
}

export function initialMenuState(): MenuState {
  return { open: false, active: -1 };
}

function enabledIndexes(items: MenuItem[]): number[] {
  return items.flatMap((item, index) => (item.disabled ? [] : [index]));
}

function move(items: MenuItem[], from: number, direction: 1 | -1): number {
  const enabled = enabledIndexes(items);
  if (enabled.length === 0) return -1;
  const position = enabled.indexOf(from);
  if (position < 0) return direction > 0 ? enabled[0] : enabled[enabled.length - 1];
  return enabled[(position + direction + enabled.length) % enabled.length];
}

export function firstEnabledIndex(items: MenuItem[]): number {
  return enabledIndexes(items)[0] ?? -1;
}

export function nextMenuState(state: MenuState, event: MenuEvent, items: MenuItem[]): MenuResult {
  const closed = initialMenuState();
  const enabled = enabledIndexes(items);
  if (event.type === 'close') return { state: closed };
  if (event.type === 'toggle') {
    if (state.open || enabled.length === 0) return { state: closed };
    return { state: { open: true, active: enabled[0] } };
  }
  const { key } = event;
  if (!state.open) {
    if (enabled.length === 0) return { state };
    if (key === 'ArrowDown' || key === 'Enter' || key === ' ') return { state: { open: true, active: enabled[0] } };
    if (key === 'ArrowUp') return { state: { open: true, active: enabled[enabled.length - 1] } };
    return { state };
  }
  switch (key) {
    case 'ArrowDown': return { state: { open: true, active: move(items, state.active, 1) } };
    case 'ArrowUp': return { state: { open: true, active: move(items, state.active, -1) } };
    case 'Home': return { state: { open: true, active: enabled[0] ?? -1 } };
    case 'End': return { state: { open: true, active: enabled[enabled.length - 1] ?? -1 } };
    case 'Escape': return { state: closed, focusTrigger: true };
    case 'Tab': return { state: closed };
    case 'Enter':
    case ' ': {
      const item = items[state.active];
      if (!item || item.disabled) return { state };
      return { state: closed, select: item.id, focusTrigger: true };
    }
    default: return { state };
  }
}
