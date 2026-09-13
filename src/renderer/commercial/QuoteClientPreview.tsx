import type { QuoteDetail, QuoteLine } from '../../shared/commercial';

function money(cents: number): string {
  return `${(cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;
}

function date(value?: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-FR');
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function offerComponents(line: QuoteLine): Array<Record<string, unknown>> {
  const value = line.snapshot?.offerComponents;
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object') : [];
}

export function QuoteClientPreview({ quote, onClose }: { quote: QuoteDetail; onClose: () => void }) {
  return (
    <div className="quote-preview-overlay" role="dialog" aria-modal="true" aria-label={`Prévisualisation ${quote.number}`}>
      <div className="quote-client-preview">
        <div className="quote-client-preview-toolbar">
          <div><span className="eyebrow">Prévisualisation client</span><strong>{quote.number}</strong></div>
          <button className="secondary-button" type="button" onClick={onClose}>Fermer</button>
        </div>

        <article className="quote-document">
          <header className="quote-document-header">
            <div><span className="quote-document-brand">ATOUMWEB</span><small>À chacun son site. Parlez-nous du vôtre.</small></div>
            <div className="quote-document-meta"><strong>DEVIS</strong><span>{quote.number}</span><small>Créé le {date(quote.createdAt)}</small><small>Valable jusqu’au {date(quote.validUntil)}</small></div>
          </header>

          <section className="quote-document-recipient">
            <span>Destinataire</span>
            <strong>{quote.ownerLabel}</strong>
            <h1>{quote.subject}</h1>
            {quote.needSummary && <p>{quote.needSummary}</p>}
          </section>

          <section className="quote-document-lines">
            {quote.lines.map((line) => {
              const included = offerComponents(line).filter((component) => !component.isOptional);
              const optional = offerComponents(line).filter((component) => Boolean(component.isOptional));
              return (
                <div className="quote-document-line" key={line.id}>
                  <div className="quote-document-line-main">
                    <div>
                      <strong>{line.label}</strong>
                      {line.description && <p>{line.description}</p>}
                      {stringList(line.snapshot?.inclusions).length > 0 && <ul>{stringList(line.snapshot?.inclusions).map((item) => <li key={item}>{item}</li>)}</ul>}
                      {included.length > 0 && <div className="quote-document-offer"><span>Comprend</span><ul>{included.map((component) => <li key={String(component.serviceVersionId)}>{String(component.serviceName)}{Number(component.quantityMilli ?? 1000) !== 1000 ? ` × ${(Number(component.quantityMilli) / 1000).toLocaleString('fr-FR')}` : ''}</li>)}</ul></div>}
                      {optional.length > 0 && <div className="quote-document-options"><span>Options prévues dans l’offre</span><ul>{optional.map((component) => <li key={String(component.serviceVersionId)}>{String(component.serviceName)}</li>)}</ul></div>}
                    </div>
                    <div className="quote-document-line-price"><span>{((line.quantityMilli ?? 1000) / 1000).toLocaleString('fr-FR')} ×</span><strong>{money(line.contractLineValueCents)}</strong></div>
                  </div>
                </div>
              );
            })}
          </section>

          <section className="quote-document-total">
            <div><span>Total</span><strong>{money(quote.contractValueCents)}</strong></div>
            <div><span>Acompte à la commande ({quote.depositPercent ?? 0} %)</span><strong>{money(quote.depositCents)}</strong></div>
            <div><span>Solde</span><strong>{money(quote.balanceCents)}</strong></div>
          </section>

          <section className="quote-document-conditions">
            <h2>Conditions</h2>
            <div><span>Délai estimé</span><strong>{quote.estimatedDelay || 'À définir ensemble'}</strong></div>
            {quote.prerequisitesText && <div><span>Prérequis</span><p>{quote.prerequisitesText}</p></div>}
            {quote.specialTerms && <div><span>Conditions particulières</span><p>{quote.specialTerms}</p></div>}
          </section>

          <footer className="quote-document-footer">
            <strong>AtoumWeb</strong>
            <span>www.atoumweb.fr</span>
          </footer>
        </article>
      </div>
    </div>
  );
}
