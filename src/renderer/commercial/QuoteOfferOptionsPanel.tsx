import { useEffect,useRef,useState } from 'react';
import type { CatalogVersion,QuoteDetail, QuoteLine, QuoteLineInput } from '../../shared/commercial';
import { QuoteLineEditor } from './QuoteLineEditor';
import './QuoteOfferOptionsPanel.css';
import {CommercialScope} from './CommercialScope';
import {useUnsavedDraft} from '../unsaved/unsaved';

function components(line: QuoteLine): Array<Record<string, unknown>> {
  const value = line.snapshot?.offerComponents;
  return Array.isArray(value) ? value.filter((c) => c && typeof c === 'object') : [];
}
const money = (value: number) => `${(value / 100).toLocaleString('fr-FR')} €`;
function OptionScope({component,bought}:{component:Record<string,unknown>;bought:QuoteLine|undefined}) {
  const [version,setVersion]=useState<CatalogVersion|null>(null);
  useEffect(()=>{let active=true;setVersion(null);if(!bought&&typeof component.serviceItemId==='string'&&typeof component.serviceVersionId==='string')void window.atoumweb.catalog.getItem(component.serviceItemId).then(item=>{if(active)setVersion(item.versions.find(v=>v.id===component.serviceVersionId)??null);}).catch(()=>{});return()=>{active=false;};},[bought?.id,component.serviceItemId,component.serviceVersionId]);
  // Always the option's saved commercial version, never the current replacement version.
  return <CommercialScope version={bought?.snapshot??version??component}/>;
}

export function QuoteOfferOptionsPanel({ quote, onSave }: {
  quote: QuoteDetail; onSave: (quote: QuoteDetail) => void;
}) {
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  useUnsavedDraft('Enregistrement des options du devis', null, {
    group: 'quote:' + quote.id + '/options', dirty: false, pending: busy,
  });
  const editable = quote.status === 'draft' && !quote.finalizedAt && !quote.contractCompiledAt
    && !quote.snapshotLockedAt && quote.contractSnapshotJson == null;
  const offers = quote.lines.filter((line) => line.snapshot?.itemType === 'offer');
  async function run(action: () => Promise<QuoteDetail>) {
    if (inFlight.current) return; // Stoppe les doubles clics avant le prochain rendu React.
    inFlight.current = true;
    setBusy(true); setError('');
    try { onSave(await action()); setEditing(null); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Option non enregistrée.'); }
    finally { inFlight.current = false; setBusy(false); }
  }
  if (!offers.length) return null;
  return <section className="quote-offer-options" aria-label="Composition et options des offres">
    <h3>Services inclus et options</h3>
    <p>Une option est achetée uniquement lorsqu’elle possède sa propre ligne de devis. Les options disponibles n’ajoutent aucun montant ni aucune clause.</p>
    {error && <p role="alert">{error}</p>}
    {offers.map((offer) => <div key={offer.id} className="quote-offer-composition">
      <h4>{offer.label} · v{String(offer.snapshot?.versionNumber ?? '—')}</h4>
      <details><summary>Intérêt client, contenu de l’offre et exclusions</summary><CommercialScope version={offer.snapshot}/></details>
      <strong>Services obligatoires inclus</strong>
      <ul>{components(offer).filter((c) => !c.isOptional).map((c, i) => <li key={String(c.componentId ?? i)}>{String(c.serviceName)} · {Number(c.quantityMilli ?? 1000) / 1000} × inclus</li>)}</ul>
      <strong>Options disponibles / achetées</strong>
      {!components(offer).some((c) => c.isOptional) && <p>Aucune option dans cette offre.</p>}
      {components(offer).filter((c) => c.isOptional).map((component, index) => {
        const id = typeof component.componentId === 'string' ? component.componentId : null;
        const bought = quote.lines.find((line) => line.optionPurchase?.sourceOfferLineId === offer.id && line.optionPurchase.sourceComponentId === id);
        const key = `${offer.id}:${id ?? index}`;
        const price = typeof component.priceCents === 'number' ? component.priceCents : null;
        const inputLine: QuoteLine = bought ?? {
          id: key, quoteId: quote.id, sortOrder: 0, source: 'catalog', label: String(component.serviceName),
          quantityMilli: Number(component.quantityMilli ?? 1000), catalogUnitPriceCents: price,
          proposedUnitPriceCents: price, adjustmentMode: 'none', catalogLineValueCents: 0,
          contractLineValueCents: 0, createdAt: '', updatedAt: '',
        };
        const save = (input: QuoteLineInput) => run(() => bought
          ? window.atoumweb.quotes.updateLine(bought.id, input)
          : window.atoumweb.quotes.selectOfferOption(offer.id, id!, input));
        return <div key={key} className="quote-offer-option" data-option-version={String(component.serviceVersionId)} data-purchased={Boolean(bought)}>
          <div><strong>{String(component.serviceName)}</strong><small>{String(component.canonicalCode||'Service inclus')} · v{String(component.serviceVersionNumber)}</small>
            <p>{bought ? `Achetée · ${Number(bought.quantityMilli) / 1000} × · ${money(bought.contractLineValueCents)}` : `Disponible · non achetée · ${price == null ? 'Sur devis' : money(price) + ' / unité'}`}</p>
            {!id && <p>Provenance optionnelle absente de cette ancienne ligne. Aucune requalification automatique.</p>}
          </div>
          <OptionScope component={component} bought={bought}/>
          {bought && <details><summary>Origine de l’option achetée</summary>
            <p>Offre : {offer.label} · v{String(offer.snapshot?.versionNumber)}. Service : {String(bought.snapshot?.canonicalCode ?? bought.label)} · v{String(bought.snapshot?.versionNumber)}.</p>
            <p>Prix catalogue : {money(bought.catalogUnitPriceCents ?? 0)}. Prix proposé : {money(bought.proposedUnitPriceCents ?? 0)}. Remise : {bought.adjustmentMode}.</p>
            {Array.isArray(bought.snapshot?.prerequisites) && bought.snapshot.prerequisites.length > 0 && <p>Prérequis : {bought.snapshot.prerequisites.join(' ; ')}</p>}
          </details>}
          {editable && id && <div className="quote-offer-option-actions">
            <button className="secondary-button" disabled={busy} onClick={() => setEditing(editing === key ? null : key)}>{bought ? 'Modifier l’option' : 'Ajouter au devis'}</button>
            {bought && <button className="secondary-button" disabled={busy} onClick={() => void run(() => window.atoumweb.quotes.deselectOfferOption(offer.id, id))}>Retirer l’option</button>}
          </div>}
          {editable && editing === key && <fieldset disabled={busy}><QuoteLineEditor key={bought?.id ?? key} line={inputLine} onSave={save} onCancel={() => setEditing(null)} /></fieldset>}
          {!editable && bought && <p>Option figée avec le devis.</p>}
        </div>;
      })}
    </div>)}
  </section>;
}
