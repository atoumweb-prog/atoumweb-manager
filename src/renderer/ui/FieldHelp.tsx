import {OperationIcon} from '../operations/OperationIcon';
import { useEffect, useId, useRef, useState } from 'react';

/**
 * UX V2 / 01B — explicit help never depends on the automatic-hover setting.
 * Kept as FieldHelp to preserve existing Prospect/Qualification call sites.
 * Presentation only: no service, persistence, or business data.
 */
const AUTO_HELP_DELAY_MS = 2_500;
type HelpSource = 'hover' | 'explicit' | null;

export function FieldHelp({ text, detail }: { text: string; detail?: string }) {
  const id = useId();
  const anchorRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<number | null>(null);
  const [source, setSource] = useState<HelpSource>(null);
  const [position, setPosition] = useState({ left: 12, top: 12 });

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const placeDetail = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const panelWidth = Math.max(190, Math.min(320, window.innerWidth - 24));
    const rightSide = rect.right + 10;
    const left = rightSide + panelWidth <= window.innerWidth - 12
      ? rightSide
      : Math.max(12, rect.left - panelWidth - 10);
    // Reserve the CSS maximum height, including for long scrollable details.
    // A 120px allowance clipped the 240px panel near the viewport bottom.
    const panelHeight = Math.min(240, window.innerHeight - 24);
    const top = Math.max(12, Math.min(rect.top, window.innerHeight - panelHeight - 12));
    setPosition({ left, top });
  };

  const close = (returnFocus = false) => {
    clearTimer();
    setSource(null);
    if (returnFocus) buttonRef.current?.focus();
  };

  useEffect(() => {
    const shell = anchorRef.current?.closest('.app-shell');
    if (!shell) return;
    // If automatic help is switched off while hovering, close only that
    // automatic detail. An explicitly opened help remains available.
    const observer = new MutationObserver(() => {
      if (shell.classList.contains('help-disabled')) {
        clearTimer();
        setSource(current => current === 'hover' ? null : current);
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
    window.addEventListener('resize', placeDetail);
    document.addEventListener('scroll', placeDetail, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('pointerdown', onOutside, true);
      window.removeEventListener('resize', placeDetail);
      document.removeEventListener('scroll', placeDetail, true);
    };
  }, [source]);

  useEffect(() => () => clearTimer(), []);

  const startHover = () => {
    clearTimer();
    if (source || anchorRef.current?.closest('.app-shell.help-disabled')) return;
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      if (!anchorRef.current?.closest('.app-shell.help-disabled')) {
        placeDetail();
        setSource('hover');
      }
    }, AUTO_HELP_DELAY_MS);
  };

  const endHover = () => {
    clearTimer();
    if (source === 'hover') setSource(null);
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
      title={text}
      onClick={event => {
        // Most existing FieldHelp controls are nested in <label>.
        // Prevent activating the associated field or submitting a form.
        event.preventDefault();
        event.stopPropagation();
        clearTimer();
        if (source === 'explicit') close(true);
        else { placeDetail(); setSource('explicit'); }
      }}
    >?</button>
    {source && <span id={id} className="field-help-detail" role="dialog"
      aria-label="Détail de l’aide" style={{ left: position.left, top: position.top }}
      data-open-source={source}
      onClick={event => {
        // A help panel inside a legacy <label> must not activate its field.
        event.preventDefault();
        event.stopPropagation();
      }}>
      <span className="field-help-detail-text">{detail || text}</span>
      <button type="button" className="field-help-detail-close"
        aria-label="Fermer l’aide"
        onClick={event => {
          event.preventDefault();
          event.stopPropagation();
          close(true);
        }}><OperationIcon name="close"/></button>
    </span>}
  </span>;
}
