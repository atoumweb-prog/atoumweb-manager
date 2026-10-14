import { useEffect, useRef, useState } from 'react';
import { createSingleFlightGate } from './quoteSingleFlight';
import type { QuoteDetail } from '../../shared/commercial';
import { useUnsavedDraft } from '../unsaved/unsaved';

export function QuoteContractDocumentPanel({
  quote,
  onSave,
  onMessage,
}: {
  quote: QuoteDetail;
  onSave: (quote: QuoteDetail) => void;
  onMessage: (message: string) => void;
}) {
  const [abbyReference, setAbbyReference] = useState(quote.abbyReference ?? '');
  const [busy, setBusy] = useState(false);
  const actionGate = useRef(createSingleFlightGate());
  useUnsavedDraft('Référence et document Abby', abbyReference, {
    group: 'quote:' + quote.id + '/abby',
    dirty: abbyReference !== (quote.abbyReference ?? ''),
    pending: busy,
    discard: () => setAbbyReference(quote.abbyReference ?? ''),
  });

  useEffect(() => {
    setAbbyReference(quote.abbyReference ?? '');
  }, [quote.id, quote.abbyReference]);

  async function saveReference(): Promise<void> {
    await actionGate.current.run(async () => {
      setBusy(true);
      try {
      const next = await window.atoumweb.quotes.updateAbbyReference(quote.id, abbyReference);
      onSave(next);
      onMessage('Référence Abby enregistrée.');
      } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible d’enregistrer la référence Abby.');
      } finally {
        setBusy(false);
      }
    });
  }

  async function importDocument(): Promise<void> {
    await actionGate.current.run(async () => {
      setBusy(true);
      try {
      const next = await window.atoumweb.quotes.importContractDocument(quote.id, abbyReference);
      if (!next) return;
      setAbbyReference(next.abbyReference ?? '');
      onSave(next);
      onMessage('Devis contractuel Abby importé et rattaché au client.');
      } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible d’importer le devis contractuel Abby.');
      } finally {
        setBusy(false);
      }
    });
  }

  async function openDocument(): Promise<void> {
    try {
      await window.atoumweb.quotes.openContractDocument(quote.id);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible d’ouvrir le document contractuel.');
    }
  }

  return (
    <section className="workflow-fields quote-contract-document">
      <div className="quote-contract-document-heading">
        <div>
          <span className="eyebrow">Pièce contractuelle</span>
          <h3>Devis accepté dans Abby</h3>
          <p className="muted">Le PDF accepté/signé est conservé dans le dossier documentaire du client et reste relié à ce devis.</p>
        </div>
        {quote.contractDocumentId && <span className="status-pill">PDF rattaché</span>}
      </div>

      <label>
        Référence Abby
        <div className="quote-contract-reference">
          <input
            value={abbyReference}
            onChange={(event) => setAbbyReference(event.target.value)}
            placeholder="Ex. DEV-2026-0042 ou référence Abby"
          />
          <button className="secondary-button" type="button" disabled={busy} onClick={() => void saveReference()}>
            Enregistrer
          </button>
        </div>
      </label>

      <div className="quote-contract-document-actions">
        <button className="primary-button" type="button" disabled={busy} onClick={() => void importDocument()}>
          {quote.contractDocumentId ? 'Importer une nouvelle version PDF' : 'Importer le PDF accepté Abby'}
        </button>
        {quote.contractDocumentId && (
          <button className="secondary-button" type="button" onClick={() => void openDocument()}>
            Ouvrir le PDF
          </button>
        )}
      </div>

      {quote.contractDocumentAttachedAt && (
        <p className="muted">
          Document rattaché le {new Date(quote.contractDocumentAttachedAt).toLocaleString('fr-FR')}.
          {' '}Une nouvelle importation remplace la référence active ; les anciens documents restent conservés dans le dossier Client.
        </p>
      )}
    </section>
  );
}
