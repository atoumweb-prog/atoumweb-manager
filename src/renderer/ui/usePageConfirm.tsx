import {useCallback, useRef, useState, type ReactNode} from 'react';
import {ProspectDialog} from '../crm/ProspectDialog';
import './page-confirm.css';

/** Contenu d'une confirmation dans la boîte du Manager (F61, décision de Carlos du 16/11/2026). */
export interface PageConfirmRequest {
  title: string;
  body: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
}

/**
 * Confirmation dans la boîte de la page au lieu de `window.confirm` : même style et même thème que le reste du Manager,
 * focus contenu, Échap et retour du focus (élément `dialog` modal). Rend une promesse : vrai si l'action est confirmée.
 */
export function usePageConfirm(): {dialog: ReactNode; askConfirm: (request: PageConfirmRequest) => Promise<boolean>} {
  const [request, setRequest] = useState<PageConfirmRequest | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);
  const answer = (value: boolean) => { resolver.current?.(value); resolver.current = null; setRequest(null); };
  const askConfirm = useCallback((next: PageConfirmRequest) => new Promise<boolean>(resolve => {
    resolver.current?.(false);
    resolver.current = resolve;
    setRequest(next);
  }), []);
  const dialog = request ? <ProspectDialog label={request.title} className="page-confirm-dialog" onClose={() => answer(false)}>
    <div className="inline-editor page-confirm">
      <h2>{request.title}</h2>
      <div className="page-confirm-body">{request.body}</div>
      <div className="form-actions">
        <button type="button" className="secondary-button" onClick={() => answer(false)}>{request.cancelLabel ?? 'Annuler'}</button>
        <button type="button" className="primary-button" onClick={() => answer(true)}>{request.confirmLabel}</button>
      </div>
    </div>
  </ProspectDialog> : null;
  return {dialog, askConfirm};
}
