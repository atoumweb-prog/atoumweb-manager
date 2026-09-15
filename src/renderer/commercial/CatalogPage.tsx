import { useEffect, useMemo, useState } from 'react';
import {
  PRICE_MODES,
  type CatalogItemDetail,
  type CatalogItemStatus,
  type CatalogItemSummary,
  type CatalogItemType,
  type CatalogVersionInput,
  type OfferComponent,
  type PriceMode,
} from '../../shared/commercial';

const PRICE_LABELS: Record<PriceMode, string> = {
  fixed: 'Prix fixe',
  starting_from: 'À partir de',
  hourly: 'Horaire',
  monthly: 'Mensuel',
  yearly: 'Annuel',
  quote_only: 'Sur devis',
  free: 'Gratuit',
};

const STATUS_LABELS: Record<CatalogItemStatus, string> = {
  active: 'Actif',
  inactive: 'Inactif',
  archived: 'Archivé',
};

interface CatalogDraft {
  type: CatalogItemType;
  name: string;
  category: string;
  description: string;
  inclusionsText: string;
  exclusionsText: string;
  prerequisitesText: string;
  priceMode: PriceMode;
  priceEuros: string;
  recommendedEuros: string;
  depositPercent: string;
  estimatedMinutes: string;
  recommendedDelayDays: string;
  specialTerms: string;
  contractType: string;
  internalAdvice: string;
  visiblePublic: boolean;
}

const EMPTY_DRAFT: CatalogDraft = {
  type: 'service',
  name: '',
  category: '',
  description: '',
  inclusionsText: '',
  exclusionsText: '',
  prerequisitesText: '',
  priceMode: 'fixed',
  priceEuros: '',
  recommendedEuros: '',
  depositPercent: '30',
  estimatedMinutes: '',
  recommendedDelayDays: '',
  specialTerms: '',
  contractType: '',
  internalAdvice: '',
  visiblePublic: false,
};

function eurosToCents(value: string): number | null {
  const cleaned = value.trim().replace(',', '.');
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error('Montant invalide.');
  return Math.round(parsed * 100);
}

function optionalInteger(value: string, label: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) throw new Error(`${label} invalide.`);
  return parsed;
}

function splitLines(value: string): string[] {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function formatPrice(item: CatalogItemSummary): string {
  const version = item.currentVersion;
  if (!version) return 'Non tarifé';
  if (version.priceMode === 'free') return 'Gratuit';
  if (version.priceMode === 'quote_only') return 'Sur devis';
  if (version.priceCents == null) return PRICE_LABELS[version.priceMode];
  const amount = `${(version.priceCents / 100).toLocaleString('fr-FR')} €`;
  if (version.priceMode === 'starting_from') return `Dès ${amount}`;
  if (version.priceMode === 'hourly') return `${amount}/h`;
  if (version.priceMode === 'monthly') return `${amount}/mois`;
  if (version.priceMode === 'yearly') return `${amount}/an`;
  return amount;
}

export function CatalogPage({ onMessage }: { onMessage: (message: string) => void }) {
  const [items, setItems] = useState<CatalogItemSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | CatalogItemType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | CatalogItemStatus>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CatalogItemDetail | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<CatalogDraft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [versionMode, setVersionMode] = useState(false);
  const [versionDraft, setVersionDraft] = useState<CatalogDraft>(EMPTY_DRAFT);
  const [offerComponents, setOfferComponents] = useState<OfferComponent[]>([]);
  const [offerVersionId, setOfferVersionId] = useState<string | null>(null);
  const [componentServiceVersionId, setComponentServiceVersionId] = useState('');
  const [componentQuantity, setComponentQuantity] = useState('1');
  const [componentOptional, setComponentOptional] = useState(false);

  const publishedServices = useMemo(
    () => items.filter((item) => item.type === 'service' && item.status === 'active' && item.currentVersion?.status === 'published'),
    [items],
  );

  async function loadDetail(id: string): Promise<CatalogItemDetail> {
    const nextDetail = await window.atoumweb.catalog.getItem(id);
    setDetail(nextDetail);
    if (nextDetail.type === 'offer') {
      const target = nextDetail.versions.find((version) => version.status === 'draft') ?? nextDetail.currentVersion ?? null;
      setOfferVersionId(target?.id ?? null);
      setOfferComponents(target ? await window.atoumweb.catalog.listOfferComponents(target.id) : []);
    } else {
      setOfferVersionId(null);
      setOfferComponents([]);
    }
    return nextDetail;
  }

  async function refresh(): Promise<void> {
    setLoading(true);
    try {
      const next = await window.atoumweb.catalog.list();
      setItems(next);
      if (selectedId) {
        const selected = next.find((item) => item.id === selectedId);
        if (selected) await loadDetail(selected.id);
        else { setSelectedId(null); setDetail(null); }
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('fr-FR');
    return items.filter((item) => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (!needle) return true;
      return [item.name, item.category, item.currentVersion?.description]
        .filter(Boolean)
        .some((value) => value?.toLocaleLowerCase('fr-FR').includes(needle));
    });
  }, [items, query, typeFilter, statusFilter]);

  async function openItem(id: string): Promise<void> {
    setSelectedId(id);
    setVersionMode(false);
    await loadDetail(id);
  }

  function buildVersion(input: CatalogDraft): CatalogVersionInput {
    const deposit = input.depositPercent.trim() ? Number(input.depositPercent) : null;
    if (deposit != null && (!Number.isInteger(deposit) || deposit < 0 || deposit > 100)) throw new Error('Acompte invalide.');
    return {
      description: input.description.trim() || null,
      priceMode: input.priceMode,
      priceCents: input.priceMode === 'free' ? 0 : eurosToCents(input.priceEuros),
      recommendedPriceCents: eurosToCents(input.recommendedEuros),
      defaultDepositPercent: deposit,
      estimatedMinutes: optionalInteger(input.estimatedMinutes, 'Durée estimée'),
      recommendedDelayDays: optionalInteger(input.recommendedDelayDays, 'Délai recommandé'),
      specialTerms: input.specialTerms.trim() || null,
      contractType: input.contractType.trim() || null,
      internalAdvice: input.internalAdvice.trim() || null,
      inclusions: splitLines(input.inclusionsText),
      exclusions: splitLines(input.exclusionsText),
      prerequisites: splitLines(input.prerequisitesText),
    };
  }

  async function createItem(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setFormError(null);
    if (!draft.name.trim()) { setFormError('Le nom est requis.'); return; }
    setSaving(true);
    try {
      const created = await window.atoumweb.catalog.create(
        {
          type: draft.type,
          name: draft.name.trim(),
          category: draft.category.trim() || null,
          visiblePublic: draft.visiblePublic,
        },
        buildVersion(draft),
      );
      setDraft(EMPTY_DRAFT);
      setShowForm(false);
      await refresh();
      await openItem(created.id);
      onMessage(`${created.type === 'offer' ? 'Offre' : 'Service'} créé en brouillon.`);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Création impossible.');
    } finally {
      setSaving(false);
    }
  }

  function prepareNewVersion(): void {
    if (!detail?.currentVersion) return;
    const current = detail.currentVersion;
    setVersionDraft({
      type: detail.type,
      name: detail.name,
      category: detail.category ?? '',
      description: current.description ?? '',
      inclusionsText: (current.inclusions ?? []).join('\n'),
      exclusionsText: (current.exclusions ?? []).join('\n'),
      prerequisitesText: (current.prerequisites ?? []).join('\n'),
      priceMode: current.priceMode,
      priceEuros: current.priceCents == null ? '' : String(current.priceCents / 100),
      recommendedEuros: current.recommendedPriceCents == null ? '' : String(current.recommendedPriceCents / 100),
      depositPercent: current.defaultDepositPercent == null ? '' : String(current.defaultDepositPercent),
      estimatedMinutes: current.estimatedMinutes == null ? '' : String(current.estimatedMinutes),
      recommendedDelayDays: current.recommendedDelayDays == null ? '' : String(current.recommendedDelayDays),
      specialTerms: current.specialTerms ?? '',
      contractType: current.contractType ?? '',
      internalAdvice: current.internalAdvice ?? '',
      visiblePublic: detail.visiblePublic,
    });
    setVersionMode(true);
  }

  async function createVersion(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!detail) return;
    setSaving(true);
    try {
      const version = await window.atoumweb.catalog.createVersion(detail.id, buildVersion(versionDraft));
      setVersionMode(false);
      await refresh();
      await openItem(detail.id);
      onMessage(`Version v${version.versionNumber} créée en brouillon.${detail.type === 'offer' ? ' Sa composition a été recopiée.' : ''}`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de créer la version.');
    } finally {
      setSaving(false);
    }
  }

  async function publish(versionId: string): Promise<void> {
    if (!detail) return;
    const version = await window.atoumweb.catalog.publishVersion(versionId);
    await refresh();
    await openItem(detail.id);
    onMessage(`Version v${version.versionNumber} publiée. L’ancienne version reste dans l’historique.`);
  }

  async function updateStatus(status: CatalogItemStatus): Promise<void> {
    if (!detail) return;
    await window.atoumweb.catalog.setStatus(detail.id, status);
    await refresh();
    await openItem(detail.id);
    onMessage(`Statut : ${STATUS_LABELS[status]}.`);
  }

  async function toggleVisibility(): Promise<void> {
    if (!detail) return;
    await window.atoumweb.catalog.setVisiblePublic(detail.id, !detail.visiblePublic);
    await refresh();
    await openItem(detail.id);
  }

  async function addOfferComponent(): Promise<void> {
    if (!offerVersionId || !componentServiceVersionId) return;
    const quantity = Number(componentQuantity.replace(',', '.'));
    if (!Number.isFinite(quantity) || quantity <= 0) {
      onMessage('Quantité invalide.');
      return;
    }
    try {
      const next = await window.atoumweb.catalog.setOfferComponents(offerVersionId, [
        ...offerComponents.map((component) => ({
          serviceVersionId: component.serviceVersionId,
          isOptional: component.isOptional,
          quantityMilli: component.quantityMilli,
          sortOrder: component.sortOrder,
        })),
        {
          serviceVersionId: componentServiceVersionId,
          isOptional: componentOptional,
          quantityMilli: Math.round(quantity * 1000),
          sortOrder: offerComponents.length * 10,
        },
      ]);
      setOfferComponents(next);
      setComponentServiceVersionId('');
      setComponentQuantity('1');
      setComponentOptional(false);
      onMessage('Service ajouté à la composition de l’Offre.');
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de modifier la composition.');
    }
  }

  async function removeOfferComponent(componentId: string): Promise<void> {
    if (!offerVersionId) return;
    try {
      const next = await window.atoumweb.catalog.setOfferComponents(
        offerVersionId,
        offerComponents.filter((component) => component.id !== componentId).map((component, index) => ({
          serviceVersionId: component.serviceVersionId,
          isOptional: component.isOptional,
          quantityMilli: component.quantityMilli,
          sortOrder: index * 10,
        })),
      );
      setOfferComponents(next);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de modifier la composition.');
    }
  }

  const offerCompositionVersion = detail?.type === 'offer'
    ? detail.versions.find((version) => version.id === offerVersionId) ?? null
    : null;
  const offerCompositionEditable = offerCompositionVersion?.status === 'draft';

  return (
    <div className="catalog-stack">
      <div className="module-toolbar catalog-toolbar">
        <div><strong>{filtered.length}</strong><span> élément{filtered.length > 1 ? 's' : ''}</span></div>
        <div className="toolbar-controls catalog-toolbar-controls">
          <button className="secondary-button" type="button" onClick={() => void refresh()}>↻ Actualiser</button>
          <input className="inline-search" placeholder="Rechercher une offre…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as 'all' | CatalogItemType)}>
            <option value="all">Services + Offres</option><option value="service">Services</option><option value="offer">Offres</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | CatalogItemStatus)}>
            <option value="all">Tous les statuts</option><option value="active">Actifs</option><option value="inactive">Inactifs</option><option value="archived">Archivés</option>
          </select>
          <button className="primary-button" type="button" onClick={() => setShowForm((value) => !value)}>{showForm ? 'Fermer' : '+ Service / Offre'}</button>
        </div>
      </div>

      {showForm && (
        <form className="panel catalog-form" onSubmit={(event) => void createItem(event)}>
          <div className="panel-title"><div><span className="eyebrow">Catalogue</span><h2>Créer un Service ou une Offre</h2><p className="muted">La première version est créée en brouillon. Tu la publies après vérification.</p></div></div>
          <CatalogFields draft={draft} onChange={setDraft} showIdentity />
          {formError && <p className="form-error">{formError}</p>}
          <div className="form-actions"><button className="primary-button" disabled={saving} type="submit">{saving ? 'Création…' : 'Créer le brouillon'}</button></div>
        </form>
      )}

      {loading ? <div className="panel"><p className="muted">Chargement du catalogue…</p></div> : (
        <div className={detail ? 'catalog-layout with-detail' : 'catalog-layout'}>
          <div className="panel table-panel catalog-table-panel">
            <div className="catalog-table-wrap">
              <table className="catalog-table">
                <thead><tr><th>Catégorie</th><th>Nom</th><th>Type</th><th>Prix AtoumWeb</th><th>Prix conseillé</th><th>Mode</th><th>Statut</th><th>Site</th><th>Version</th></tr></thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id} className={selectedId === item.id ? 'selected-row' : ''} onClick={() => void openItem(item.id)}>
                      <td>{item.category || '—'}</td><td><strong>{item.name}</strong></td><td><span className="status-pill">{item.type === 'offer' ? 'Offre' : 'Service'}</span></td><td>{formatPrice(item)}</td><td>{item.currentVersion?.recommendedPriceCents != null ? `${(item.currentVersion.recommendedPriceCents / 100).toLocaleString('fr-FR')} €` : '—'}</td><td>{item.currentVersion ? PRICE_LABELS[item.currentVersion.priceMode] : '—'}</td><td><span className={`catalog-status catalog-${item.status}`}>{STATUS_LABELS[item.status]}</span></td><td>{item.visiblePublic ? 'Oui' : 'Non'}</td><td>{item.currentVersion ? `v${item.currentVersion.versionNumber} · ${item.currentVersion.status}` : '—'}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && <tr><td colSpan={9}><div className="empty-table">Aucune offre ou service pour ces filtres.</div></td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {detail && (
            <aside className="panel catalog-detail-panel">
              <div className="detail-panel-heading"><div><span className="eyebrow">{detail.type === 'offer' ? 'Offre' : 'Service'}</span><h2>{detail.name}</h2><p className="muted">{detail.category || 'Sans catégorie'}</p></div><button className="close-detail" type="button" onClick={() => { setSelectedId(null); setDetail(null); setVersionMode(false); }}>×</button></div>
              <div className="detail-badges"><span className={`catalog-status catalog-${detail.status}`}>{STATUS_LABELS[detail.status]}</span><span className="status-pill">{detail.visiblePublic ? 'Visible site' : 'Interne'}</span>{detail.currentVersion && <span className="status-pill">v{detail.currentVersion.versionNumber} · {detail.currentVersion.status}</span>}</div>

              {detail.currentVersion ? (
                <div className="catalog-current-version">
                  <Summary label="Tarif actuel" value={formatPrice(detail)} />
                  <Summary label="Prix conseillé" value={detail.currentVersion.recommendedPriceCents != null ? `${(detail.currentVersion.recommendedPriceCents / 100).toLocaleString('fr-FR')} €` : '—'} />
                  <Summary label="Acompte par défaut" value={detail.currentVersion.defaultDepositPercent != null ? `${detail.currentVersion.defaultDepositPercent} %` : '—'} />
                  <Summary label="Durée estimée" value={detail.currentVersion.estimatedMinutes != null ? `${detail.currentVersion.estimatedMinutes} min` : '—'} />
                  <Summary label="Délai recommandé" value={detail.currentVersion.recommendedDelayDays != null ? `${detail.currentVersion.recommendedDelayDays} jours` : '—'} />
                  <Summary label="Contrat" value={detail.currentVersion.contractType || '—'} />
                  <Summary label="Description" value={detail.currentVersion.description || 'Non renseignée'} />
                  <ListSummary label="Inclus" values={detail.currentVersion.inclusions ?? []} />
                  <ListSummary label="Exclusions" values={detail.currentVersion.exclusions ?? []} />
                  <ListSummary label="Prérequis" values={detail.currentVersion.prerequisites ?? []} />
                  {detail.currentVersion.internalAdvice && <div className="catalog-internal-note"><strong>Conseil interne AtoumWeb</strong><p>{detail.currentVersion.internalAdvice}</p></div>}
                </div>
              ) : <p className="muted">Aucune version.</p>}

              <div className="catalog-detail-actions"><button className="secondary-button" type="button" onClick={() => void toggleVisibility()}>{detail.visiblePublic ? 'Masquer du site' : 'Rendre visible site'}</button><select value={detail.status} onChange={(e) => void updateStatus(e.target.value as CatalogItemStatus)}><option value="active">Actif</option><option value="inactive">Inactif</option><option value="archived">Archivé</option></select><button className="primary-button" type="button" disabled={!detail.currentVersion} onClick={prepareNewVersion}>+ Nouvelle version</button></div>

              {versionMode && <form className="catalog-version-editor" onSubmit={(event) => void createVersion(event)}><strong>Nouvelle version</strong><CatalogFields draft={versionDraft} onChange={setVersionDraft} /><div className="inline-editor-actions"><button className="secondary-button" type="button" onClick={() => setVersionMode(false)}>Annuler</button><button className="primary-button" disabled={saving} type="submit">Créer v{(detail.versions[0]?.versionNumber ?? 0) + 1}</button></div></form>}

              {detail.type === 'offer' && offerCompositionVersion && (
                <section className="offer-composition">
                  <div className="offer-composition-heading"><div><span className="eyebrow">Composition</span><strong>Services de l’Offre · v{offerCompositionVersion.versionNumber}</strong></div><span className="status-pill">{offerCompositionVersion.status}</span></div>
                  {offerComponents.map((component) => <div className="offer-component-row" key={component.id}><div><strong>{component.serviceName}</strong><span>v{component.serviceVersionNumber} · {(component.quantityMilli / 1000).toLocaleString('fr-FR')} × · {component.isOptional ? 'Optionnel' : 'Inclus'}</span></div>{offerCompositionEditable && <button className="close-detail" type="button" onClick={() => void removeOfferComponent(component.id)}>×</button>}</div>)}
                  {offerComponents.length === 0 && <p className="muted">Aucun Service dans cette Offre.</p>}
                  {offerCompositionEditable ? (
                    <div className="offer-component-editor">
                      <select value={componentServiceVersionId} onChange={(e) => setComponentServiceVersionId(e.target.value)}><option value="">Ajouter un Service publié…</option>{publishedServices.filter((service) => !offerComponents.some((component) => component.serviceItemId === service.id)).map((service) => <option key={service.id} value={service.currentVersion!.id}>{service.name} · v{service.currentVersion!.versionNumber}</option>)}</select>
                      <input inputMode="decimal" value={componentQuantity} onChange={(e) => setComponentQuantity(e.target.value)} aria-label="Quantité" />
                      <label><input type="checkbox" checked={componentOptional} onChange={(e) => setComponentOptional(e.target.checked)} /> Optionnel</label>
                      <button className="secondary-button" type="button" onClick={() => void addOfferComponent()}>Ajouter</button>
                    </div>
                  ) : <p className="muted">Composition figée. Crée une nouvelle version pour la modifier.</p>}
                </section>
              )}

              <div className="catalog-versions"><strong>Historique des versions</strong>{detail.versions.map((version) => <div className="catalog-version-row" key={version.id}><div><strong>v{version.versionNumber}</strong><span>{version.status}</span><small>{PRICE_LABELS[version.priceMode]} · {version.priceCents != null ? `${(version.priceCents / 100).toLocaleString('fr-FR')} €` : '—'}</small></div>{version.status === 'draft' && <button className="primary-button compact-button" type="button" onClick={() => void publish(version.id)}>Publier</button>}</div>)}</div>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}

function CatalogFields({ draft, onChange, showIdentity = false }: { draft: CatalogDraft; onChange: (draft: CatalogDraft) => void; showIdentity?: boolean }) {
  const priceDisabled = draft.priceMode === 'quote_only' || draft.priceMode === 'free';
  return (
    <div className="catalog-fields">
      {showIdentity && <><label>Type<select value={draft.type} onChange={(e) => onChange({ ...draft, type: e.target.value as CatalogItemType })}><option value="service">Service</option><option value="offer">Offre</option></select></label><label>Nom<input value={draft.name} onChange={(e) => onChange({ ...draft, name: e.target.value })} placeholder="Ex. Site vitrine" /></label><label>Catégorie<input value={draft.category} onChange={(e) => onChange({ ...draft, category: e.target.value })} placeholder="Ex. Création de site" /></label></>}
      <label>Mode tarifaire<select value={draft.priceMode} onChange={(e) => onChange({ ...draft, priceMode: e.target.value as PriceMode })}>{PRICE_MODES.map((mode) => <option key={mode} value={mode}>{PRICE_LABELS[mode]}</option>)}</select></label>
      <label>Prix AtoumWeb (€)<input disabled={priceDisabled} inputMode="decimal" value={priceDisabled ? '' : draft.priceEuros} onChange={(e) => onChange({ ...draft, priceEuros: e.target.value })} placeholder="699" /></label>
      <label>Prix conseillé (€)<input inputMode="decimal" value={draft.recommendedEuros} onChange={(e) => onChange({ ...draft, recommendedEuros: e.target.value })} /></label>
      <label>Acompte par défaut (%)<input inputMode="numeric" value={draft.depositPercent} onChange={(e) => onChange({ ...draft, depositPercent: e.target.value })} /></label>
      <label>Durée estimée (min)<input inputMode="numeric" value={draft.estimatedMinutes} onChange={(e) => onChange({ ...draft, estimatedMinutes: e.target.value })} /></label>
      <label>Délai recommandé (jours)<input inputMode="numeric" value={draft.recommendedDelayDays} onChange={(e) => onChange({ ...draft, recommendedDelayDays: e.target.value })} /></label>
      <label className="catalog-description">Conditions commerciales<textarea value={draft.specialTerms} onChange={e=>onChange({...draft,specialTerms:e.target.value})}/></label><label>Type de contrat<input value={draft.contractType} onChange={(e) => onChange({ ...draft, contractType: e.target.value })} placeholder="Ex. Création de site" /></label>
      <label className="catalog-description">Description<textarea value={draft.description} onChange={(e) => onChange({ ...draft, description: e.target.value })} placeholder="Description de la prestation…" /></label>
      <label>Inclus — 1 par ligne<textarea value={draft.inclusionsText} onChange={(e) => onChange({ ...draft, inclusionsText: e.target.value })} /></label>
      <label>Exclusions — 1 par ligne<textarea value={draft.exclusionsText} onChange={(e) => onChange({ ...draft, exclusionsText: e.target.value })} /></label>
      <label>Prérequis — 1 par ligne<textarea value={draft.prerequisitesText} onChange={(e) => onChange({ ...draft, prerequisitesText: e.target.value })} /></label>
      <label className="catalog-description">Conseil interne AtoumWeb<textarea value={draft.internalAdvice} onChange={(e) => onChange({ ...draft, internalAdvice: e.target.value })} placeholder="Information interne, jamais affichée automatiquement au client." /></label>
      {showIdentity && <label className="catalog-public-check"><input type="checkbox" checked={draft.visiblePublic} onChange={(e) => onChange({ ...draft, visiblePublic: e.target.checked })} /> Visible sur le site public</label>}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="summary-line"><span>{label}</span><strong>{value}</strong></div>;
}

function ListSummary({ label, values }: { label: string; values: string[] }) {
  return <div className="catalog-list-summary"><span>{label}</span>{values.length ? <ul>{values.map((value) => <li key={value}>{value}</li>)}</ul> : <strong>—</strong>}</div>;
}
