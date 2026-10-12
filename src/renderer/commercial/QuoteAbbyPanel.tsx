import { useId, useSyncExternalStore } from 'react';
import { commercialAbbyBlock } from '../../shared/commercialAbby';
import type { QuoteDetail } from '../../shared/commercial';
import { unsavedRegistry } from '../unsaved/unsaved';

const UNSAVED_ABBY_NOTICE = 'Enregistre ou annule les modifications en cours de ce devis avant de copier le bloc pour Abby.';

export function QuoteAbbyPanel({quote,onMessage}:{quote:QuoteDetail;onMessage:(text:string)=>void}) {
  // Reuse UX-01's existing draft/pending registry: never create a competing
  // confirmation, and do not block an unrelated quote's unsaved work.
  const group = 'quote:' + quote.id;
  const infoId = useId();
  const hasUnsavedChanges = useSyncExternalStore(
    unsavedRegistry.subscribe,
    () => unsavedRegistry.active(group).length > 0,
    () => false,
  );
  const text = commercialAbbyBlock(quote);

  async function copyForAbby(): Promise<void> {
    // Defense in depth: re-evaluate at the action boundary, independent
    // of React's last painted disabled state.
    if (unsavedRegistry.active(group).length > 0) {
      onMessage(UNSAVED_ABBY_NOTICE);
      return;
    }
    try {
      await window.atoumweb.contractTerms.copyText(text);
      onMessage('Bloc commercial copié pour Abby.');
    } catch {
      onMessage('Copie impossible ; sélectionnez le texte ci-dessous.');
    }
  }

  return <section className="panel quote-abby-panel">
    <h3>Préparer Abby</h3>
    <p>Copiez les lignes commerciales dans Abby, puis le bloc contractuel du Builder. Aucun envoi automatique. Le PDF accepté sera rattaché à ce devis.</p>
    <button
      type="button"
      className="secondary-button"
      disabled={hasUnsavedChanges}
      aria-describedby={hasUnsavedChanges ? infoId : undefined}
      onClick={() => void copyForAbby()}
    >Copier le bloc commercial pour Abby</button>
    {hasUnsavedChanges && <p id={infoId} role="status" className="muted">{UNSAVED_ABBY_NOTICE}</p>}
    <details><summary>Consulter le bloc commercial</summary>
      <textarea readOnly aria-label="Bloc commercial Abby" value={text} rows={12}/>
    </details>
  </section>;
}
