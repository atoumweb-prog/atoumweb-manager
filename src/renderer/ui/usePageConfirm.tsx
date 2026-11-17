import {useCallback, useRef, useState, type ReactNode} from 'react';
import {ProspectDialog} from '../crm/ProspectDialog';
import './page-confirm.css';

/** Contenu d'une confirmation dans la boîte du Manager (F61 puis F81, décisions de Carlos du 16/11/2026). */
export interface PageConfirmRequest {
  title: string;
  /** Un texte simple garde ses retours à la ligne ; un contenu React est rendu tel quel. */
  body?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
}

/** Demande d'un texte dans la boîte du Manager (F81 : remplace `window.prompt`). */
export interface PageTextRequest extends PageConfirmRequest {
  inputLabel: string;
  initialValue?: string;
}

type Pending = {request: PageConfirmRequest; input?: {label: string}; resolve: (value: string | null) => void};

/**
 * Confirmation dans la boîte de la page au lieu de `window.confirm` / `window.prompt` : même style et même thème que
 * le reste du Manager, focus contenu, Échap et retour du focus (élément `dialog` modal).
 * `askConfirm` rend vrai si l'action est confirmée ; `askText` rend le texte saisi, ou `null` si l'on annule.
 */
export function usePageConfirm(): {
  dialog: ReactNode;
  askConfirm: (request: PageConfirmRequest) => Promise<boolean>;
  askText: (request: PageTextRequest) => Promise<string | null>;
} {
  const [pending, setPending] = useState<Pending | null>(null);
  const [value, setValue] = useState('');
  const current = useRef<Pending | null>(null);
  const open = useCallback((next: Omit<Pending, 'resolve'>, initial: string) => new Promise<string | null>(resolve => {
    current.current?.resolve(null);
    const entry = {...next, resolve};
    current.current = entry;
    setValue(initial);
    setPending(entry);
  }), []);
  const answer = (result: string | null) => { const entry = current.current; current.current = null; setPending(null); entry?.resolve(result); };
  const askConfirm = useCallback((request: PageConfirmRequest) => open({request}, '').then(result => result !== null), [open]);
  const askText = useCallback(({inputLabel, initialValue, ...request}: PageTextRequest) => open({request, input: {label: inputLabel}}, initialValue ?? ''), [open]);
  const request = pending?.request;
  const dialog = pending && request ? <ProspectDialog label={request.title} className="page-confirm-dialog" onClose={() => answer(null)}>
    <form className="inline-editor page-confirm" onSubmit={event => { event.preventDefault(); if (!pending.input || value.trim()) answer(pending.input ? value.trim() : ''); }}>
      <h2>{request.title}</h2>
      {request.body != null && request.body !== '' && <div className={`page-confirm-body${typeof request.body === 'string' ? ' is-text' : ''}`}>{typeof request.body === 'string' ? <p>{request.body}</p> : request.body}</div>}
      {pending.input && <label className="page-confirm-input">{pending.input.label}<textarea value={value} rows={3} autoFocus onChange={event => setValue(event.target.value)} /></label>}
      <div className="form-actions">
        <button type="button" className="secondary-button" onClick={() => answer(null)}>{request.cancelLabel ?? 'Annuler'}</button>
        <button type="submit" className="primary-button" disabled={!!pending.input && !value.trim()}>{request.confirmLabel}</button>
      </div>
    </form>
  </ProspectDialog> : null;
  return {dialog, askConfirm, askText};
}
