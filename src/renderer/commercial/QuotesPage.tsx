import { useEffect, useMemo, useState } from 'react';
import type { CatalogItemSummary, QuoteDetail, QuoteStatus, QuoteSummary } from '../../shared/commercial';
import type { ClientSummary, ProspectSummary } from '../../shared/crm';

const STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: 'Brouillon',
  sent: 'Envoyé',
  viewed: 'Vu',
  accepted: 'Accepté',
  refused: 'Refusé',
  expired: 'Expiré',
  cancelled: 'Annulé',
};

interface WizardDraft {
  ownerKind: 'prospect' | 'client';
  ownerId: string;
  subject: string;
  needSummary: string;
  catalogVersionId: string;
  customLabel: string;
  customPriceEuros: string;
  validityDays: string;
  depositPercent: string;
  estimatedDelay: string;
}

const EMPTY_WIZARD: WizardDraft = {
  ownerKind: 'prospect',
  ownerId: '',
  subject: '',
  needSummary: '',
  catalogVersionId: '',
  customLabel: '',
  customPriceEuros: '',
  validityDays: '30',
  depositPercent: '30',
  estimatedDelay: '',
};

function eurosToCents(value: string): number | null {
  const cleaned = value.trim().replace(',', '.');
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error('Montant invalide.');
  return Math.round(parsed * 100);
}

function money(cents: number): string {
  return `${(cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;
}

export function QuotesPage({ onMessage }: { onMessage: (message: string) => void }) {
  const [quotes, setQuotes] = useState<QuoteSummary[]>([]);
  const [prospects, setProspects] = useState<ProspectSummary[]>([]);
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [catalog, setCatalog] = useState<CatalogItemSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | QuoteStatus>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<QuoteDetail | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizard, setWizard] = useState<WizardDraft>(EMPTY_WIZARD);
  const [wizardError, setWizardError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [catalogToAdd, setCatalogToAdd] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [customPrice, setCustomPrice] = useState('');

  async function refresh(): Promise<void> {
    setLoading(true);
    try {
      const [nextQuotes, nextProspects, nextClients, nextCatalog] = await Promise.all([
        window.atoumweb.quotes.list(),
        window.atoumweb.crm.prospects.list(),
        window.atoumweb.crm.clients.list(),
        window.atoumweb.catalog.list({ status: 'active' }),
      ]);
      setQuotes(nextQuotes);
      setProspects(nextProspects.filter((prospect) => !prospect.clientAccountId && prospect.stage !== 'won' && prospect.stage !== 'lost'));
      setClients(nextClients);
      setCatalog(nextCatalog.filter((item) => Boolean(item.currentVersion)));
      if (selectedId && nextQuotes.some((quote) => quote.id === selectedId)) setDetail(await window.atoumweb.quotes.get(selectedId));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('fr-FR');
    return quotes.filter((quote) => {
      if (statusFilter !== 'all' && quote.status !== statusFilter) return false;
      if (!needle) return true;
      return [quote.number, quote.subject, quote.ownerLabel].some((value) => value.toLocaleLowerCase('fr-FR').includes(needle));
    });
  }, [quotes, query, statusFilter]);

  const ownerOptions = wizard.ownerKind === 'prospect'
    ? prospects.map((prospect) => ({ id: prospect.id, label: prospect.displayName }))
    : clients.map((client) => ({ id: client.id, label: client.displayName }));

  async function openQuote(id: string): Promise<void> {
    setSelectedId(id);
    setDetail(await window.atoumweb.quotes.get(id));
  }

  function validateStep(step: number): boolean {
    setWizardError(null);
    if (step === 1 && !wizard.ownerId) { setWizardError('Choisis un Prospect ou un Client.'); return false; }
    if (step === 2 && !wizard.subject.trim()) { setWizardError('Renseigne l’objet du devis.'); return false; }
    if (step === 5) {
      const validity = Number(wizard.validityDays);
      const deposit = Number(wizard.depositPercent);
      if (!Number.isInteger(validity) || validity <= 0) { setWizardError('Validité invalide.'); return false; }
      if (!Number.isInteger(deposit) || deposit < 0 || deposit > 100) { setWizardError('Acompte invalide.'); return false; }
    }
    return true;
  }

  function nextWizard(): void {
    if (!validateStep(wizardStep)) return;
    setWizardStep((step) => Math.min(6, step + 1));
  }

  async function createQuote(): Promise<void> {
    if (!validateStep(5) || !wizard.ownerId || !wizard.subject.trim()) return;
    setSaving(true);
    setWizardError(null);
    try {
      let created = await window.atoumweb.quotes.create({
        prospectId: wizard.ownerKind === 'prospect' ? wizard.ownerId : null,
        clientAccountId: wizard.ownerKind === 'client' ? wizard.ownerId : null,
        subject: wizard.subject.trim(),
        needSummary: wizard.needSummary.trim() || null,
        validityDays: Number(wizard.validityDays),
        depositPercent: Number(wizard.depositPercent),
        estimatedDelay: wizard.estimatedDelay.trim() || null,
      });
      if (wizard.catalogVersionId) created = await window.atoumweb.quotes.addCatalogLine(created.id, wizard.catalogVersionId);
      const customCents = eurosToCents(wizard.customPriceEuros);
      if (wizard.customLabel.trim() && customCents != null) {
        created = await window.atoumweb.quotes.addCustomLine(created.id, {
          label: wizard.customLabel.trim(),
          proposedUnitPriceCents: customCents,
          catalogUnitPriceCents: customCents,
        });
      }
      setWizard(EMPTY_WIZARD);
      setWizardStep(1);
      setShowWizard(false);
      await refresh();
      await openQuote(created.id);
      onMessage(`Devis ${created.number} créé.`);
    } catch (error) {
      setWizardError(error instanceof Error ? error.message : 'Impossible de créer le devis.');
    } finally {
      setSaving(false);
    }
  }

  async function addCatalogLine(): Promise<void> {
    if (!detail || !catalogToAdd) return;
    const next = await window.atoumweb.quotes.addCatalogLine(detail.id, catalogToAdd);
    setCatalogToAdd('');
    setDetail(next);
    await refresh();
    onMessage('Prestation catalogue ajoutée au devis avec snapshot figé.');
  }

  async function addCustomLine(): Promise<void> {
    if (!detail || !customLabel.trim()) return;
    try {
      const cents = eurosToCents(customPrice);
      if (cents == null) throw new Error('Renseigne un prix.');
      const next = await window.atoumweb.quotes.addCustomLine(detail.id, {
        label: customLabel.trim(),
        proposedUnitPriceCents: cents,
        catalogUnitPriceCents: cents,
      });
      setCustomLabel('');
      setCustomPrice('');
      setDetail(next);
      await refresh();
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible d’ajouter la ligne.');
    }
  }

  async function removeLine(id: string): Promise<void> {
    if (!detail) return;
    setDetail(await window.atoumweb.quotes.removeLine(id));
    await refresh();
  }

  async function transition(action: 'sent' | 'viewed' | 'accepted' | 'refused' | 'expired' | 'duplicate'): Promise<void> {
    if (!detail) return;
    try {
      let next: QuoteDetail;
      if (action === 'sent') next = await window.atoumweb.quotes.markSent(detail.id);
      else if (action === 'viewed') next = await window.atoumweb.quotes.markViewed(detail.id);
      else if (action === 'accepted') next = await window.atoumweb.quotes.accept(detail.id);
      else if (action === 'refused') next = await window.atoumweb.quotes.refuse(detail.id);
      else if (action === 'expired') next = await window.atoumweb.quotes.expire(detail.id);
      else next = await window.atoumweb.quotes.duplicate(detail.id);
      await refresh();
      await openQuote(next.id);
      onMessage(action === 'accepted' ? 'Devis accepté : prêt à transformer en projet.' : `Devis ${next.number} mis à jour.`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Action impossible.');
    }
  }

  return (
    <div className="quotes-stack">
      <div className="module-toolbar quote-toolbar">
        <div><strong>{filtered.length}</strong><span> devis</span></div>
        <div className="toolbar-controls quote-toolbar-controls">
          <button className="secondary-button" type="button" onClick={() => void refresh()}>↻ Actualiser</button>
          <input className="inline-search" placeholder="Rechercher un devis…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | QuoteStatus)}>
            <option value="all">Tous les statuts</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <button className="primary-button" type="button" onClick={() => { setShowWizard((value) => !value); setWizardStep(1); setWizardError(null); }}>{showWizard ? 'Fermer' : '+ Nouveau devis'}</button>
        </div>
      </div>

      {showWizard && (
        <section className="panel quote-wizard">
          <div className="quote-stepper">
            {['Client / Prospect', 'Projet / besoin', 'Offre', 'Services / lignes', 'Conditions', 'Prévisualisation'].map((label, index) => (
              <button key={label} type="button" className={wizardStep === index + 1 ? 'active' : wizardStep > index + 1 ? 'done' : ''} onClick={() => index + 1 < wizardStep && setWizardStep(index + 1)}><span>{index + 1}</span>{label}</button>
            ))}
          </div>

          <div className="quote-wizard-body">
            {wizardStep === 1 && <div className="quote-step-content"><h2>À qui s’adresse le devis ?</h2><div className="quote-owner-toggle"><button type="button" className={wizard.ownerKind === 'prospect' ? 'active' : ''} onClick={() => setWizard({ ...wizard, ownerKind: 'prospect', ownerId: '' })}>Prospect</button><button type="button" className={wizard.ownerKind === 'client' ? 'active' : ''} onClick={() => setWizard({ ...wizard, ownerKind: 'client', ownerId: '' })}>Client</button></div><label>Dossier<select value={wizard.ownerId} onChange={(e) => setWizard({ ...wizard, ownerId: e.target.value })}><option value="">Choisir…</option>{ownerOptions.map((owner) => <option key={owner.id} value={owner.id}>{owner.label}</option>)}</select></label></div>}
            {wizardStep === 2 && <div className="quote-step-content"><h2>Projet / besoin</h2><label>Objet du devis<input value={wizard.subject} onChange={(e) => setWizard({ ...wizard, subject: e.target.value })} placeholder="Ex. Création du site vitrine" /></label><label>Besoin<textarea value={wizard.needSummary} onChange={(e) => setWizard({ ...wizard, needSummary: e.target.value })} /></label></div>}
            {wizardStep === 3 && <div className="quote-step-content"><h2>Offre de départ</h2><p className="muted">Optionnel : choisis une Offre ou un Service du catalogue. Le contenu et le tarif seront copiés dans le devis.</p><label>Catalogue<select value={wizard.catalogVersionId} onChange={(e) => setWizard({ ...wizard, catalogVersionId: e.target.value })}><option value="">Aucune — partir d’un devis libre</option>{catalog.map((item) => <option key={item.id} value={item.currentVersion!.id}>{item.type === 'offer' ? 'Offre' : 'Service'} · {item.name}</option>)}</select></label></div>}
            {wizardStep === 4 && <div className="quote-step-content"><h2>Services / lignes complémentaires</h2><p className="muted">Tu pourras en ajouter autant que nécessaire après création.</p><div className="quote-two-fields"><label>Ligne libre<input value={wizard.customLabel} onChange={(e) => setWizard({ ...wizard, customLabel: e.target.value })} placeholder="Ex. Option supplémentaire" /></label><label>Prix (€)<input inputMode="decimal" value={wizard.customPriceEuros} onChange={(e) => setWizard({ ...wizard, customPriceEuros: e.target.value })} /></label></div></div>}
            {wizardStep === 5 && <div className="quote-step-content"><h2>Conditions</h2><div className="quote-three-fields"><label>Validité (jours)<input inputMode="numeric" value={wizard.validityDays} onChange={(e) => setWizard({ ...wizard, validityDays: e.target.value })} /></label><label>Acompte (%)<input inputMode="numeric" value={wizard.depositPercent} onChange={(e) => setWizard({ ...wizard, depositPercent: e.target.value })} /></label><label>Délai estimé<input value={wizard.estimatedDelay} onChange={(e) => setWizard({ ...wizard, estimatedDelay: e.target.value })} placeholder="Ex. 3 à 4 semaines" /></label></div></div>}
            {wizardStep === 6 && <div className="quote-preview"><span className="eyebrow">Prévisualisation</span><h2>{wizard.subject || 'Devis sans objet'}</h2><p>{ownerOptions.find((owner) => owner.id === wizard.ownerId)?.label || 'Destinataire'}</p>{wizard.needSummary && <p className="muted">{wizard.needSummary}</p>}<div className="quote-preview-summary"><span>Catalogue</span><strong>{wizard.catalogVersionId ? catalog.find((item) => item.currentVersion?.id === wizard.catalogVersionId)?.name : 'Aucune ligne catalogue'}</strong><span>Ligne libre</span><strong>{wizard.customLabel || 'Aucune'}</strong><span>Acompte</span><strong>{wizard.depositPercent || '0'} %</strong></div></div>}
          </div>

          {wizardError && <p className="form-error">{wizardError}</p>}
          <div className="quote-wizard-actions"><button className="secondary-button" type="button" disabled={wizardStep === 1} onClick={() => setWizardStep((step) => Math.max(1, step - 1))}>← Précédent</button>{wizardStep < 6 ? <button className="primary-button" type="button" onClick={nextWizard}>Suivant →</button> : <button className="primary-button" disabled={saving} type="button" onClick={() => void createQuote()}>{saving ? 'Création…' : 'Créer le devis'}</button>}</div>
        </section>
      )}

      {loading ? <div className="panel"><p className="muted">Chargement des devis…</p></div> : (
        <div className={detail ? 'quotes-layout with-detail' : 'quotes-layout'}>
          <div className="panel quote-list-panel">
            <table className="quote-table"><thead><tr><th>Numéro</th><th>Destinataire</th><th>Objet</th><th>Statut</th><th>Valeur</th><th>Acompte</th><th>Créé le</th></tr></thead><tbody>{filtered.map((quote) => <tr key={quote.id} className={selectedId === quote.id ? 'selected-row' : ''} onClick={() => void openQuote(quote.id)}><td><strong>{quote.number}</strong></td><td>{quote.ownerLabel}</td><td>{quote.subject}</td><td><span className={`quote-status quote-${quote.status}`}>{STATUS_LABELS[quote.status]}</span></td><td>{money(quote.contractValueCents)}</td><td>{money(quote.depositCents)}</td><td>{new Date(quote.createdAt).toLocaleDateString('fr-FR')}</td></tr>)}{filtered.length === 0 && <tr><td colSpan={7}><div className="empty-table">Aucun devis.</div></td></tr>}</tbody></table>
          </div>

          {detail && <aside className="panel quote-detail-panel"><div className="detail-panel-heading"><div><span className="eyebrow">{detail.number}</span><h2>{detail.subject}</h2><p className="muted">{detail.ownerLabel}</p></div><button className="close-detail" type="button" onClick={() => { setDetail(null); setSelectedId(null); }}>×</button></div><div className="detail-badges"><span className={`quote-status quote-${detail.status}`}>{STATUS_LABELS[detail.status]}</span>{detail.projectReadyAt && <span className="status-pill">Prêt pour Projet</span>}</div><div className="quote-lines"><strong>Lignes du devis</strong>{detail.lines.map((line) => <div className="quote-line" key={line.id}><div><strong>{line.label}</strong><small>{line.source === 'catalog' ? 'Catalogue · snapshot figé' : 'Ligne libre'} · {(line.quantityMilli ?? 1000) / 1000} ×</small></div><span>{money(line.contractLineValueCents)}</span>{detail.status === 'draft' && <button type="button" onClick={() => void removeLine(line.id)}>×</button>}</div>)}{detail.lines.length === 0 && <p className="muted">Aucune ligne pour le moment.</p>}</div>{detail.status === 'draft' && <><div className="quote-add-line"><strong>Ajouter depuis le catalogue</strong><select value={catalogToAdd} onChange={(e) => setCatalogToAdd(e.target.value)}><option value="">Choisir…</option>{catalog.map((item) => <option key={item.id} value={item.currentVersion!.id}>{item.name}</option>)}</select><button className="secondary-button" type="button" onClick={() => void addCatalogLine()}>Ajouter</button></div><div className="quote-add-line"><strong>Ligne libre</strong><input value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} placeholder="Libellé" /><input inputMode="decimal" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} placeholder="Prix €" /><button className="secondary-button" type="button" onClick={() => void addCustomLine()}>Ajouter</button></div></>}
            <div className="quote-totals"><div><span>Valeur catalogue</span><strong>{money(detail.catalogValueCents)}</strong></div><div><span>Remises</span><strong>- {money(detail.discountValueCents)}</strong></div><div className="quote-total-main"><span>Total contractuel</span><strong>{money(detail.contractValueCents)}</strong></div><div><span>Acompte {detail.depositPercent ?? 0} %</span><strong>{money(detail.depositCents)}</strong></div><div><span>Solde</span><strong>{money(detail.balanceCents)}</strong></div></div>
            <div className="quote-status-actions">{detail.status === 'draft' && <button className="primary-button" type="button" onClick={() => void transition('sent')}>Marquer envoyé</button>}{detail.status === 'sent' && <><button className="secondary-button" type="button" onClick={() => void transition('viewed')}>Marquer vu</button><button className="primary-button" type="button" onClick={() => void transition('accepted')}>Accepter</button><button className="secondary-button danger-outline" type="button" onClick={() => void transition('refused')}>Refuser</button><button className="secondary-button" type="button" onClick={() => void transition('expired')}>Expirer</button></>}{detail.status === 'viewed' && <><button className="primary-button" type="button" onClick={() => void transition('accepted')}>Accepter</button><button className="secondary-button danger-outline" type="button" onClick={() => void transition('refused')}>Refuser</button><button className="secondary-button" type="button" onClick={() => void transition('expired')}>Expirer</button></>}{['refused', 'expired', 'cancelled'].includes(detail.status) && <button className="primary-button" type="button" onClick={() => void transition('duplicate')}>Dupliquer en nouveau devis</button>}</div>
          </aside>}
        </div>
      )}
    </div>
  );
}
