import {useEffect, useState} from 'react';
import type {CrmAction, ProspectSummary} from '../../shared/crm';
import type {Need} from '../../shared/workflow';
import type {CatalogItemSummary, QuoteSummary} from '../../shared/commercial';
import {catalogIsSelectable} from '../../shared/catalogDiscovery';
import {QuotesPage} from '../commercial/QuotesPage';
import {QuoteWizard} from '../commercial/QuoteWizard';
import {prospectAcceptsQuote, quoteAdvice} from '../commercial/quoteWizardModel';
import {ProspectQuotePanel} from './ProspectQuotePanel';
import {requestUnsavedExit} from '../unsaved/unsaved';

/**
 * Onglet Devis de la fiche prospect.
 * Lot 3 : un seul chemin — l'assistant de devis s'ouvre ici, prospect et besoin déjà repris.
 * La qualification est conseillée (liste « Conseillé avant d'envoyer ») et ne bloque plus rien.
 */
export function ProspectQuoteWorkspace({prospect, actions, onChanged, onComplete}: {
  prospect: ProspectSummary; actions: CrmAction[]; onChanged: (message?: string) => void; onComplete: (tab: string) => void;
}) {
  const [quotes, setQuotes] = useState<QuoteSummary[]>([]);
  const [needs, setNeeds] = useState<Need[]>([]);
  const [catalog, setCatalog] = useState<CatalogItemSummary[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [id, setId] = useState<string | null>(null);
  const [editing, setEditing] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true, sequence = 0;
    const load = async () => {
      const request = ++sequence;
      try {
        const [nextQuotes, nextNeeds, nextCatalog] = await Promise.all([
          window.atoumweb.quotes.list({prospectId: prospect.id}),
          window.atoumweb.workflow.needs('prospect', prospect.id),
          window.atoumweb.catalog.list({status: 'active'}),
        ]);
        if (!active || request !== sequence) return;
        const sorted = [...nextQuotes].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
        setQuotes(sorted); setNeeds(nextNeeds); setCatalog(nextCatalog.filter(catalogIsSelectable));
        setId(current => current && nextQuotes.some(quote => quote.id === current) ? current : sorted[0]?.id ?? null);
        setLoaded(true);
      } catch (e) { if (active) setMessage(String(e)); }
    };
    void load();
    window.addEventListener('atoumweb:changed', load);
    return () => { active = false; window.removeEventListener('atoumweb:changed', load); };
  }, [prospect.id]);

  const advice = quoteAdvice(prospect, needs.length > 0);
  const accepts = prospectAcceptsQuote(prospect);
  const showWizard = accepts && (creating || !id);
  const budget = prospect.budgetStatus === 'not_disclosed' ? 'Non communiqué'
    : prospect.budgetMinCents != null ? (prospect.budgetMinCents / 100).toLocaleString('fr-FR') + ' €' + (prospect.budgetMaxCents != null && prospect.budgetMaxCents !== prospect.budgetMinCents ? ' à ' + (prospect.budgetMaxCents / 100).toLocaleString('fr-FR') + ' €' : '')
    : 'À renseigner';
  const done = actions.filter(action => action.status === 'done');

  return <div className="prospect-quote-workspace">
    <aside className="quote-dossier-context">
      <h3>Ce que tu sais du prospect</h3>
      <dl>
        <dt>Entreprise</dt><dd>{prospect.displayName}</dd>
        <dt>Interlocuteur</dt><dd>{prospect.secondaryLabel || 'À identifier'}</dd>
        <dt>Demande initiale</dt><dd>{prospect.initialRequest || 'Non renseignée'}</dd>
        <dt>Besoin confirmé</dt><dd>{prospect.projectSummary || 'À renseigner'}</dd>
        {prospect.projectContext && <><dt>Contraintes</dt><dd>{prospect.projectContext}</dd></>}
        <dt>Budget client</dt><dd>{budget}</dd>
        <dt>Échéance</dt><dd>{prospect.targetDate || prospect.timelineNote || (prospect.timelineStatus === 'not_disclosed' ? 'Non communiquée' : 'À renseigner')}</dd>
      </dl>
      {needs.length > 0 && <><h4>Prestations envisagées</h4>{needs.map(need => <p key={need.id}>✓ {need.label}</p>)}</>}
      <h4>Échanges réalisés</h4>
      {done.slice(-4).reverse().map(action => <article key={action.id}><strong>{action.title}</strong><p>{action.completionNotes || 'Sans compte rendu détaillé.'}</p></article>)}
      {done.length === 0 && <p>Aucun échange terminé enregistré.</p>}
      {advice.length > 0
        ? <div className="quote-advice" role="status">
            <h4>Conseillé avant d’envoyer le devis</h4>
            <p>Rien d’obligatoire : tu peux faire ton devis tout de suite et compléter plus tard.</p>
            <ul>{advice.map(item => <li key={item.key}><span>{item.label}</span><button type="button" className="secondary-button" onClick={() => onComplete(item.tab)}>Compléter</button></li>)}</ul>
          </div>
        : <p role="status">Fiche prospect complète.</p>}
      <button type="button" className="secondary-button" onClick={() => onComplete('brief')}>Modifier le besoin</button>
    </aside>
    <section className="prospect-quote-editor" aria-label="Devis du prospect">
      {message && <p role="status" className="form-feedback">{message}</p>}
      {!loaded ? <p>Chargement…</p>
        : showWizard ? <>
            {id && <button type="button" className="secondary-button" onClick={() => requestUnsavedExit(() => setCreating(false), 'quote:create')}>← Revenir au devis existant</button>}
            <QuoteWizard key={prospect.id} catalog={catalog} prospects={[]} clients={[]} presetProspect={prospect} onCreated={quote => {
              setCreating(false); setId(quote.id); setEditing(true);
              const text = `Devis ${quote.number} créé. Relis les prix et les conditions, puis vérifie-le avant de l’envoyer.`;
              setMessage(text); onChanged(text);
              window.dispatchEvent(new Event('atoumweb:changed'));
            }}/>
          </>
        : !id ? <>
            <h3>Devis</h3>
            <p className="muted">{prospect.clientAccountId ? 'Ce prospect est devenu client : fais le devis depuis sa fiche client ou le module Devis.' : 'Ce dossier est clos ou archivé : aucun nouveau devis ne peut y être créé.'}</p>
          </>
        : <>
            <div className="form-actions">
              {quotes.length > 1 && <label>Devis du prospect<select value={id} onChange={e => { const next = e.target.value; requestUnsavedExit(() => { setId(next); setEditing(true); }); }}>{quotes.map(quote => <option key={quote.id} value={quote.id}>{quote.number} · {quote.subject}</option>)}</select></label>}
              {accepts && <button type="button" className="secondary-button" onClick={() => requestUnsavedExit(() => { setMessage(''); setCreating(true); })}>+ Nouveau devis</button>}
            </div>
            {editing
              ? <QuotesPage key={id} embedded initialId={id} onCloseEmbedded={() => setEditing(false)} onMessage={text => { setMessage(text); onChanged(text); window.dispatchEvent(new Event('atoumweb:changed')); }}/>
              : <><button type="button" className="primary-button" onClick={() => setEditing(true)}>Ouvrir le devis ici</button><ProspectQuotePanel prospect={prospect} onChanged={onChanged}/></>}
          </>}
    </section>
  </div>;
}
