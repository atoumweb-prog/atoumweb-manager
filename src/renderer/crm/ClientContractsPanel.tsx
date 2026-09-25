import type { QuoteSummary } from '../../shared/commercial';
import { openEntity } from '../workflow/DossierPanel';

function money(cents: number): string {
  return `${(cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;
}

export function ClientContractsPanel({
  quotes,
  onMessage,
}: {
  quotes: QuoteSummary[];
  onMessage: (message: string) => void;
}) {
  const contracts = quotes
    .filter((quote) => quote.status === 'accepted')
    .sort((a, b) => String(b.acceptedAt ?? b.updatedAt).localeCompare(String(a.acceptedAt ?? a.updatedAt)));

  async function openPdf(quote: QuoteSummary): Promise<void> {
    try {
      await window.atoumweb.quotes.openContractDocument(quote.id);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible d’ouvrir le PDF contractuel.');
    }
  }

  return (
    <div className="tab-content-stack client-contracts-tab">
      <div className="contact-tab-heading">
        <div>
          <strong>{contracts.length} devis contractuel{contracts.length > 1 ? 's' : ''}</strong>
          <p className="muted">Un devis accepté constitue la référence contractuelle ; aucun contrat séparé n’est recréé.</p>
        </div>
      </div>

      <div className="client-contract-list">
        {contracts.map((quote) => (
          <article className="client-contract-card" key={quote.id}>
            <div className="client-contract-card-heading">
              <div>
                <span className="eyebrow">{quote.number}</span>
                <strong>{quote.subject}</strong>
                <small>
                  Accepté {quote.acceptedAt ? 'le ' + new Date(quote.acceptedAt).toLocaleDateString('fr-FR') : ''}
                  {quote.abbyReference ? ' · Abby ' + quote.abbyReference : ''}
                </small>
              </div>
              <strong>{money(quote.contractValueCents)}</strong>
            </div>

            <div className="client-contract-badges">
              <span className="status-pill">Devis accepté</span>
              {quote.contractDocumentId
                ? <span className="status-pill">PDF Abby rattaché</span>
                : <span className="muted">PDF Abby à rattacher</span>}
            </div>

            <div className="client-contract-actions">
              <button
                className="primary-button compact-button"
                type="button"
                onClick={() => openEntity({ entityType: 'quote', entityId: quote.id, title: quote.subject })}
              >
                Ouvrir le devis contractuel
              </button>
              {quote.contractDocumentId && (
                <button className="secondary-button compact-button" type="button" onClick={() => void openPdf(quote)}>
                  Ouvrir le PDF Abby
                </button>
              )}
            </div>
          </article>
        ))}
        {contracts.length === 0 && (
          <div className="empty-table">
            Aucun devis accepté pour ce client. Les futurs devis validés apparaîtront ici comme références contractuelles.
          </div>
        )}
      </div>
    </div>
  );
}