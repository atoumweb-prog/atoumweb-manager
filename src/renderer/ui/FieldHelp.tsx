import {OperationIcon} from '../operations/OperationIcon';
import { useEffect, useId, useRef, useState } from 'react';

/**
 * UX V2 / 01B — explicit help never depends on the automatic-hover setting.
 * Kept as FieldHelp to preserve existing Prospect/Qualification call sites.
 * Presentation only: no service, persistence, or business data.
 */
const AUTO_HELP_DELAY_MS = 2_500;
type HelpSource = 'short' | 'hover' | 'explicit' | null;
const HELP_OPEN_EVENT = 'atoumweb:field-help-open';

export function FieldHelp({ text, detail }: { text: string; detail?: string }) {
  const id = useId();
  const anchorRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<number | null>(null);
  const [source, setSource] = useState<HelpSource>(null);
  const [position, setPosition] = useState({ left: 12, top: 12, maxHeight: 240 });
  const activate = (next: Exclude<HelpSource, null>) => {
    window.dispatchEvent(new CustomEvent(HELP_OPEN_EVENT, {detail: id}));
    placeDetail(next === 'short');
    setSource(next);
  };

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const placeDetail = (short = false) => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const panelWidth = Math.max(190, Math.min(320, window.innerWidth - 24));
    const rightSide = rect.right + 10;
    const left = rightSide + panelWidth <= window.innerWidth - 12
      ? rightSide
      : Math.max(12, rect.left - panelWidth - 10);
    // Keep the associated input clear. Prefer the space ABOVE its label;
    // otherwise use the space below its input, with an internal scroll area.
    const field = buttonRef.current?.closest('label')?.querySelector('input,select,textarea')?.getBoundingClientRect();
    const above = Math.max(0, rect.top - 20);
    const belowStart = Math.max(rect.bottom, field?.bottom ?? rect.bottom) + 8;
    const below = Math.max(0, window.innerHeight - belowStart - 12);
    const preferAbove = above >= (short ? 70 : 240) || above >= below;
    const maxHeight = Math.max(36, Math.min(short ? 120 : 240, preferAbove ? above : below));
    const top = preferAbove ? Math.max(12, rect.top - maxHeight - 8) : belowStart;
    setPosition({ left, top, maxHeight });
  };

  const close = (returnFocus = false) => {
    clearTimer();
    setSource(null);
    if (returnFocus) buttonRef.current?.focus();
  };

  useEffect(() => {
    const otherHelp = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== id) close();
    };
    window.addEventListener(HELP_OPEN_EVENT, otherHelp);
    return () => window.removeEventListener(HELP_OPEN_EVENT, otherHelp);
  }, [id]);

  useEffect(() => {
    const shell = anchorRef.current?.closest('.app-shell');
    if (!shell) return;
    // If automatic help is switched off while hovering, close only that
    // automatic detail. An explicitly opened help remains available.
    const observer = new MutationObserver(() => {
      if (shell.classList.contains('help-disabled')) {
        clearTimer();
        setSource(current => current === 'hover' || current === 'short' ? null : current);
      }
    });
    observer.observe(shell, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!source) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      close(source === 'explicit');
    };
    const onOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !anchorRef.current?.contains(event.target)) close();
    };
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('pointerdown', onOutside, true);
    const reposition = () => placeDetail(source === 'short');
    window.addEventListener('resize', reposition);
    document.addEventListener('scroll', reposition, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('pointerdown', onOutside, true);
      window.removeEventListener('resize', reposition);
      document.removeEventListener('scroll', reposition, true);
    };
  }, [source]);

  useEffect(() => () => clearTimer(), []);

  const startHover = () => {
    clearTimer();
    if (source === 'explicit' || anchorRef.current?.closest('.app-shell.help-disabled')) return;
    activate('short');
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      if (!anchorRef.current?.closest('.app-shell.help-disabled')) {
        activate('hover');
      }
    }, AUTO_HELP_DELAY_MS);
  };

  const endHover = () => {
    clearTimer();
    if (source === 'hover' || source === 'short') setSource(null);
  };

  return <span className="field-help-anchor" ref={anchorRef}
    onMouseEnter={startHover} onMouseLeave={endHover}>
    <button
      className="field-help"
      ref={buttonRef}
      type="button"
      aria-label={`Aide : ${text}`}
      aria-expanded={source !== null}
      aria-controls={source ? id : undefined}
      onFocus={startHover}
      onBlur={endHover}
      onClick={event => {
        // Most existing FieldHelp controls are nested in <label>.
        // Prevent activating the associated field or submitting a form.
        event.preventDefault();
        event.stopPropagation();
        clearTimer();
        if (source === 'explicit') close(true);
        else activate('explicit');
      }}
    >?</button>
    {source && <span id={id} className={source === 'short' ? 'field-help-short' : 'field-help-detail'} role={source === 'short' ? 'tooltip' : 'dialog'}
      aria-label="Détail de l’aide" style={{ left: position.left, top: position.top }}
      data-open-source={source}
      onClick={event => {
        // A help panel inside a legacy <label> must not activate its field.
        event.preventDefault();
        event.stopPropagation();
      }}>
      <span className="field-help-detail-text">{source === 'short' ? text : detail || text}</span>
      {source !== 'short' && <button type="button" className="field-help-detail-close"
        aria-label="Fermer l’aide"
        onClick={event => {
          event.preventDefault();
          event.stopPropagation();
          close(true);
        }}><OperationIcon name="close"/></button>}
    </span>}
  </span>;
}
