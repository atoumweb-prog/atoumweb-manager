import { useEffect, useMemo, useState } from 'react';
import {
  PRICE_MODES,
  type CatalogItemDetail,
  type CatalogItemStatus,
  type CatalogItemSummary,
  type CatalogItemType,
  type CatalogVersionInput,
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
  priceMode: PriceMode;
  priceEuros: string;
  recommendedEuros: string;
  depositPercent: string;
  visiblePublic: boolean;
}

const EMPTY_DRAFT: CatalogDraft = {
  type: 'service',
  name: '',
  category: '',
  description: '',
  priceMode: 'fixed',
  priceEuros: '',
  recommendedEuros: '',
  depositPercent: '30',
  visiblePublic: false,
};

function eurosToCents(value: string): number | null {
  const cleaned = value.trim().replace(',', '.');
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error('Montant invalide.');
  return Math.round(parsed * 100);
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

  async function refresh(): Promise<void> {
    setLoading(true);
    try {
      const next = await window.atoumweb.catalog.list();
      setItems(next);
      if (selectedId) {
        const selected = next.find((item) => item.id === selectedId);
        if (selected) setDetail(await window.atoumweb.catalog.getItem(selected.id));
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
    setDetail(await window.atoumweb.catalog.getItem(id));
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
      inclusions: [],
      exclusions: [],
      prerequisites: [],
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
      priceMode: current.priceMode,
      priceEuros: current.priceCents == null ? '' : String(current.priceCents / 100),
      recommendedEuros: current.recommendedPriceCents == null ? '' : String(current.recommendedPriceCents / 100),
      depositPercent: current.defaultDepositPercent == null ? '' : String(current.defaultDepositPercent),
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
      onMessage(`Version v${version.versionNumber} créée en brouillon.`);
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
                      <td>{item.category || '—'}</td>
                      <td><strong>{item.name}</strong></td>
                      <td><span className="status-pill">{item.type === 'offer' ? 'Offre' : 'Service'}</span></td>
                      <td>{formatPrice(item)}</td>
                      <td>{item.currentVersion?.recommendedPriceCents != null ? `${(item.currentVersion.recommendedPriceCents / 100).toLocaleString('fr-FR')} €` : '—'}</td>
                      <td>{item.currentVersion ? PRICE_LABELS[item.currentVersion.priceMode] : '—'}</td>
                      <td><span className={`catalog-status catalog-${item.status}`}>{STATUS_LABELS[item.status]}</span></td>
                      <td>{item.visiblePublic ? 'Oui' : 'Non'}</td>
                      <td>{item.currentVersion ? `v${item.currentVersion.versionNumber} · ${item.currentVersion.status}` : '—'}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && <tr><td colSpan={9}><div className="empty-table">Aucune offre ou service pour ces filtres.</div></td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {detail && (
            <aside className="panel catalog-detail-panel">
              <div className="detail-panel-heading">
                <div><span className="eyebrow">{detail.type === 'offer' ? 'Offre' : 'Service'}</span><h2>{detail.name}</h2><p className="muted">{detail.category || 'Sans catégorie'}</p></div>
                <button className="close-detail" type="button" onClick={() => { setSelectedId(null); setDetail(null); setVersionMode(false); }}>×</button>
              </div>

              <div className="detail-badges">
                <span className={`catalog-status catalog-${detail.status}`}>{STATUS_LABELS[detail.status]}</span>
                <span className="status-pill">{detail.visiblePublic ? 'Visible site' : 'Interne'}</span>
                {detail.currentVersion && <span className="status-pill">v{detail.currentVersion.versionNumber} · {detail.currentVersion.status}</span>}
              </div>

              {detail.currentVersion ? (
                <div className="catalog-current-version">
                  <Summary label="Tarif actuel" value={formatPrice(detail)} />
                  <Summary label="Prix conseillé" value={detail.currentVersion.recommendedPriceCents != null ? `${(detail.currentVersion.recommendedPriceCents / 100).toLocaleString('fr-FR')} €` : '—'} />
                  <Summary label="Acompte par défaut" value={detail.currentVersion.defaultDepositPercent != null ? `${detail.currentVersion.defaultDepositPercent} %` : '—'} />
                  <Summary label="Description" value={detail.currentVersion.description || 'Non renseignée'} />
                </div>
              ) : <p className="muted">Aucune version.</p>}

              <div className="catalog-detail-actions">
                <button className="secondary-button" type="button" onClick={() => void toggleVisibility()}>{detail.visiblePublic ? 'Masquer du site' : 'Rendre visible site'}</button>
                <select value={detail.status} onChange={(e) => void updateStatus(e.target.value as CatalogItemStatus)}>
                  <option value="active">Actif</option><option value="inactive">Inactif</option><option value="archived">Archivé</option>
                </select>
                <button className="primary-button" type="button" disabled={!detail.currentVersion} onClick={prepareNewVersion}>+ Nouvelle version</button>
              </div>

              {versionMode && (
                <form className="catalog-version-editor" onSubmit={(event) => void createVersion(event)}>
                  <strong>Nouvelle version</strong>
                  <CatalogFields draft={versionDraft} onChange={setVersionDraft} />
                  <div className="inline-editor-actions"><button className="secondary-button" type="button" onClick={() => setVersionMode(false)}>Annuler</button><button className="primary-button" disabled={saving} type="submit">Créer v{(detail.versions[0]?.versionNumber ?? 0) + 1}</button></div>
                </form>
              )}

              <div className="catalog-versions">
                <strong>Historique des versions</strong>
                {detail.versions.map((version) => (
                  <div className="catalog-version-row" key={version.id}>
                    <div><strong>v{version.versionNumber}</strong><span>{version.status}</span><small>{PRICE_LABELS[version.priceMode]} · {version.priceCents != null ? `${(version.priceCents / 100).toLocaleString('fr-FR')} €` : '—'}</small></div>
                    {version.status === 'draft' && <button className="primary-button compact-button" type="button" onClick={() => void publish(version.id)}>Publier</button>}
                  </div>
                ))}
              </div>
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
      {showIdentity && <>
        <label>Type<select value={draft.type} onChange={(e) => onChange({ ...draft, type: e.target.value as CatalogItemType })}><option value="service">Service</option><option value="offer">Offre</option></select></label>
        <label>Nom<input value={draft.name} onChange={(e) => onChange({ ...draft, name: e.target.value })} placeholder="Ex. Site vitrine" /></label>
        <label>Catégorie<input value={draft.category} onChange={(e) => onChange({ ...draft, category: e.target.value })} placeholder="Ex. Création de site" /></label>
      </>}
      <label>Mode tarifaire<select value={draft.priceMode} onChange={(e) => onChange({ ...draft, priceMode: e.target.value as PriceMode })}>{PRICE_MODES.map((mode) => <option key={mode} value={mode}>{PRICE_LABELS[mode]}</option>)}</select></label>
      <label>Prix AtoumWeb (€)<input disabled={priceDisabled} inputMode="decimal" value={priceDisabled ? '' : draft.priceEuros} onChange={(e) => onChange({ ...draft, priceEuros: e.target.value })} placeholder="699" /></label>
      <label>Prix conseillé (€)<input inputMode="decimal" value={draft.recommendedEuros} onChange={(e) => onChange({ ...draft, recommendedEuros: e.target.value })} /></label>
      <label>Acompte par défaut (%)<input inputMode="numeric" value={draft.depositPercent} onChange={(e) => onChange({ ...draft, depositPercent: e.target.value })} /></label>
      <label className="catalog-description">Description<textarea value={draft.description} onChange={(e) => onChange({ ...draft, description: e.target.value })} placeholder="Description de la prestation…" /></label>
      {showIdentity && <label className="catalog-public-check"><input type="checkbox" checked={draft.visiblePublic} onChange={(e) => onChange({ ...draft, visiblePublic: e.target.checked })} /> Visible sur le site public</label>}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="summary-line"><span>{label}</span><strong>{value}</strong></div>;
}
