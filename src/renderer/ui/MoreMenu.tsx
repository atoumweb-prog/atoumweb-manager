import { useEffect, useRef, useState } from 'react';
import { firstEnabledIndex, initialMenuState, nextMenuState, type MenuEvent, type MenuItem, type MenuState } from './moreMenuModel';

/**
 * Bouton « Plus » : range les actions secondaires à un clic, sans rien supprimer.
 * Sémantique de menu (`aria-haspopup`, `aria-expanded`, rôles `menu` et `menuitem`), clavier complet,
 * Échap referme et rend le focus au bouton. Aucune règle métier : l'appelant reçoit l'identifiant choisi.
 * `initialOpen` sert aux tests de rendu et aux démonstrations.
 */
export function MoreMenu({ items, onSelect, label = 'Plus', initialOpen = false, align = 'end', className }: {
  items: MenuItem[];
  onSelect: (id: string) => void;
  label?: string;
  initialOpen?: boolean;
  align?: 'start' | 'end';
  className?: string;
}) {
  const [state, setState] = useState<MenuState>(() => (initialOpen ? { open: true, active: firstEnabledIndex(items) } : initialMenuState()));
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  function apply(event: MenuEvent) {
    const result = nextMenuState(state, event, items);
    setState(result.state);
    if (result.select) onSelect(result.select);
    if (result.focusTrigger) requestAnimationFrame(() => trigger.current?.focus());
  }

  useEffect(() => {
    if (state.open && state.active >= 0) refs.current[state.active]?.focus();
  }, [state.open, state.active]);

  useEffect(() => {
    if (!state.open) return undefined;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setState(initialMenuState());
    };
    document.addEventListener('pointerdown', outside, true);
    return () => document.removeEventListener('pointerdown', outside, true);
  }, [state.open]);

  return <div ref={root} className={['aw-more-menu', `aw-more-menu--align-${align}`, className].filter(Boolean).join(' ')}>
    <button
      ref={trigger}
      type="button"
      className="aw-ui-button aw-ui-button--secondary aw-more-menu-trigger"
      aria-haspopup="menu"
      aria-expanded={state.open}
      onClick={() => apply({ type: 'toggle' })}
      onKeyDown={(event) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          apply({ type: 'key', key: event.key });
        }
      }}
    >{label}</button>
    {state.open && <ul
      role="menu"
      aria-label={label}
      className="aw-more-menu-list"
      onKeyDown={(event) => {
        if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'Escape', 'Tab', 'Enter', ' '].includes(event.key)) {
          if (event.key !== 'Tab') event.preventDefault();
          apply({ type: 'key', key: event.key });
        }
      }}
    >
      {items.map((item, index) => <li role="none" key={item.id}>
        <button
          ref={(element) => { refs.current[index] = element; }}
          type="button"
          role="menuitem"
          tabIndex={-1}
          disabled={item.disabled}
          className={['aw-more-menu-item', item.danger ? 'aw-more-menu-item--danger' : ''].filter(Boolean).join(' ')}
          onClick={() => {
            setState(initialMenuState());
            onSelect(item.id);
            requestAnimationFrame(() => trigger.current?.focus());
          }}
        >{item.label}</button>
      </li>)}
    </ul>}
  </div>;
}
