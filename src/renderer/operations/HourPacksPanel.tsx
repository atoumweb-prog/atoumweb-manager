import {useSearchTargetConfirmation,type EntityReady} from '../ui/useSearchTargetConfirmation';
import { useEffect, useMemo, useState } from 'react';
import type { CatalogItemSummary } from '../../shared/commercial';
import type { ClientSummary } from '../../shared/crm';
import {
  HOUR_PACK_STATUSES,
  type HourPack,
  type HourPackMovementType,
  type HourPackStatus,
  type Intervention,
} from '../../shared/operations';
import type { ProjectSummary } from '../../shared/projects';
import { HourPackShortfallPanel } from './HourPackShortfallPanel';
import { OperationIcon } from './OperationIcon';

const STATUS_LABELS: Record<HourPackStatus, string> = {
  active: 'Actif', exhausted: 'Épuisé', expired: 'Expiré', suspended: 'Suspendu', archived: 'Archivé',
};

const MOVEMENT_LABELS: Record<HourPackMovementType, string> = {
  initial_credit: 'Crédit initial',
  intervention_debit: 'Débit intervention',
  manual_correction: 'Correction manuelle',
  commercial_credit: 'Crédit commercial',
  reversal: 'Contre-écriture',
};

function hours(seconds: number): string {
  return `${(seconds / 3600).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} h`;
}
function money(cents: number): string {
  return `${(cents / 100).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €`;
}
function dateLabel(value?: string | null): string {
  return value ? new Date(value).toLocaleDateString('fr-FR') : '—';
}
function inferCatalogPackHours(item: CatalogItemSummary): number | null {
  const estimatedMinutes = item.currentVersion?.estimatedMinutes;
  if (estimatedMinutes != null && estimatedMinutes > 0) return estimatedMinutes / 60;
  const text = [item.name, item.currentVersion?.nature, item.currentVersion?.description].filter(Boolean).join(' ');
  const match = text.match(/(\d+(?:[.,]\d+)?)\s*h(?:eure(?:s)?)?\b/i);
  if (!match) return null;
  const value = Number(match[1].replace(',', '.'));
  return Number.isFinite(value) && value > 0 ? value : null;
}
function packNeedsAttention(pack: HourPack): boolean {
  if (pack.status !== 'active' || pack.purchasedSeconds <= 0) return false;
  return pack.balanceSeconds <= 3600 || pack.balanceSeconds / pack.purchasedSeconds <= 0.2;
}

export function HourPacksPanel({ onEntityReady, clients, projects, interventions, onMessage, onOperationsChanged, initialPackId }: {
  clients: ClientSummary[];
  projects: ProjectSummary[];
  interventions: Intervention[];
  onMessage: (message: string) => void;
  onOperationsChanged: () => Promise<void>;
  initialPackId?: string | null;
  onEntityReady?:EntityReady;
}) {
  const [packs, setPacks] = useState<HourPack[]>([]);
  const [catalogPacks, setCatalogPacks] = useState<CatalogItemSummary[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | HourPackStatus>('all');
  const [splitPercent, setSplitPercent] = useState(34);
  const [detailExpanded, setDetailExpanded] = useState(false);

  const [catalogPackId, setCatalogPackId] = useState('');
  const [clientId, setClientId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [name, setName] = useState('');
  const [hoursPurchased, setHoursPurchased] = useState('');
  const [price, setPrice] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const [movementHours, setMovementHours] = useState('');
  const [movementReason, setMovementReason] = useState('');
  const [movementMode, setMovementMode] = useState<'manual_correction' | 'commercial_credit'>('manual_correction');
  const [interventionId, setInterventionId] = useState('');
  const [reversalReason, setReversalReason] = useState('Correction du mouvement');

  async function refresh(): Promise<void> {
    try {
      const [next, catalog] = await Promise.all([
        window.atoumweb.operations.hourPacks.list(),
        window.atoumweb.catalog.list({ status: 'active' }),
      ]);
      setPacks(next);
      setCatalogPacks(
        catalog
          .filter((item) => item.type === 'offer' && Boolean(item.currentVersion) && inferCatalogPackHours(item) != null)
          .sort((a, b) => (inferCatalogPackHours(a) ?? 0) - (inferCatalogPackHours(b) ?? 0) || a.name.localeCompare(b.name, 'fr-FR')),
      );
      if (selectedId && !next.some((pack) => pack.id === selectedId)) {
        setSelectedId('');
        setDetailExpanded(false);
      }
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de charger les packs d’heures.');
    }
  }

  useEffect(() => { void refresh(); }, []);
  useEffect(() => {
    if (initialPackId) setSelectedId(initialPackId);
  }, [initialPackId]);

  const selected = packs.find((pack) => pack.id === selectedId) ?? null;
  useSearchTargetConfirmation('hour_pack',selected?.id,false,onEntityReady);

  const clientProjects = projects.filter((project) => project.clientAccountId === clientId && project.status !== 'archived');
  const activePacks = packs.filter((pack) => pack.status === 'active');
  const attentionPacks = packs.filter(packNeedsAttention);
  const totalBalanceSeconds = activePacks.reduce((sum, pack) => sum + pack.balanceSeconds, 0);
  const totalContractCents = packs.filter((pack) => pack.status !== 'archived').reduce((sum, pack) => sum + pack.contractPriceCents, 0);

  const filteredPacks = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('fr-FR');
    return packs.filter((pack) => {
      if (statusFilter !== 'all' && pack.status !== statusFilter) return false;
      if (!needle) return true;
      return [pack.clientLabel, pack.projectLabel ?? '', pack.name, STATUS_LABELS[pack.status]]
        .some((value) => value.toLocaleLowerCase('fr-FR').includes(needle));
    });
  }, [packs, query, statusFilter]);

  const eligibleInterventions = useMemo(() => {
    if (!selected) return [];
    return interventions.filter((intervention) =>
      intervention.clientAccountId === selected.clientAccountId
      && (!selected.projectId || intervention.projectId === selected.projectId)
      && ['to_validate', 'completed'].includes(intervention.status),
    );
  }, [selected, interventions]);

  function resetCreateForm(): void {
    setCatalogPackId('');
    setClientId('');
    setProjectId('');
    setName('');
    setHoursPurchased('');
    setPrice('');
    setExpiresAt('');
  }

  function applyCatalogPack(id: string): void {
    setCatalogPackId(id);
    if (!id) {
      setName('');
      setHoursPurchased('');
      setPrice('');
      return;
    }
    const item = catalogPacks.find((entry) => entry.id === id);
    if (!item) return;
    const packHours = inferCatalogPackHours(item);
    setName(item.name);
    setHoursPurchased(packHours != null ? String(packHours).replace('.', ',') : '');
    setPrice(item.currentVersion?.priceCents != null ? String(item.currentVersion.priceCents / 100).replace('.', ',') : '');
  }

  async function createPack(): Promise<void> {
    if (!clientId) return;
    setSaving(true);
    try {
      const parsedHours = Number(hoursPurchased.replace(',', '.'));
      const parsedPrice = Number(price.replace(',', '.'));
      if (!Number.isFinite(parsedHours) || parsedHours <= 0) throw new Error('Renseigne une durée de pack valide.');
      if (!Number.isFinite(parsedPrice) || parsedPrice < 0) throw new Error('Renseigne un prix contractuel valide.');
      const created = await window.atoumweb.operations.hourPacks.create({
        clientAccountId: clientId,
        projectId: projectId || null,
        name,
        purchasedSeconds: Math.round(parsedHours * 3600),
        contractPriceCents: Math.round(parsedPrice * 100),
        expiresAt: expiresAt ? `${expiresAt}T23:59:59.000Z` : null,
      });
      await refresh();
      setSelectedId(created.id);
      setDetailExpanded(false);
      setCreateOpen(false);
      resetCreateForm();
      onMessage(`Pack « ${created.name} » créé.`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de créer le pack.');
    } finally { setSaving(false); }
  }

  async function changeStatus(status: HourPackStatus): Promise<void> {
    if (!selected) return;
    try {
      const updated = await window.atoumweb.operations.hourPacks.changeStatus(selected.id, status);
      await refresh(); setSelectedId(updated.id);
    } catch (error) { onMessage(error instanceof Error ? error.message : 'Impossible de modifier le pack.'); }
  }

  async function addMovement(): Promise<void> {
    if (!selected || !movementHours.trim() || !movementReason.trim()) return;
    try {
      const seconds = Math.round(Number(movementHours.replace(',', '.')) * 3600);
      const updated = await window.atoumweb.operations.hourPacks.addMovement(selected.id, {
        type: movementMode,
        secondsDelta: movementMode === 'commercial_credit' ? Math.abs(seconds) : seconds,
        reason: movementReason,
      });
      setMovementHours(''); setMovementReason(''); await refresh(); setSelectedId(updated.id);
      onMessage('Mouvement ajouté au pack.');
    } catch (error) { onMessage(error instanceof Error ? error.message : 'Impossible d’ajouter le mouvement.'); }
  }

  async function debitIntervention(): Promise<void> {
    if (!selected || !interventionId) return;
    try {
      const updated = await window.atoumweb.operations.hourPacks.debitIntervention(selected.id, interventionId);
      await Promise.all([refresh(), onOperationsChanged()]);
      setSelectedId(updated.id); setInterventionId('');
      onMessage('Temps de l’intervention débité du pack.');
    } catch (error) { onMessage(error instanceof Error ? error.message : 'Impossible de débiter l’intervention.'); }
  }

  async function reverseMovement(movementId: string): Promise<void> {
    if (!selected || !reversalReason.trim()) return;
    try {
      const updated = await window.atoumweb.operations.hourPacks.reverseMovement(movementId, reversalReason);
      await refresh(); setSelectedId(updated.id);
      onMessage('Mouvement annulé par contre-écriture.');
    } catch (error) { onMessage(error instanceof Error ? error.message : 'Impossible d’annuler ce mouvement.'); }
  }

  async function refreshAfterShortfallDecision(): Promise<void> {
    await Promise.all([refresh(), onOperationsChanged()]);
  }

  function beginResize(): void {
    const workspace = document.querySelector<HTMLElement>('.hour-pack-workspace.with-detail');
    if (!workspace) return;
    document.body.classList.add('operation-resizing');
    const onMove = (event: PointerEvent) => {
      const rect = workspace.getBoundingClientRect();
      if (!rect.width) return;
      const ratio = ((event.clientX - rect.left) / rect.width) * 100;
      setSplitPercent(Math.max(20, Math.min(55, ratio)));
    };
    const onUp = () => {
      document.body.classList.remove('operation-resizing');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
  }

  const remainingRatio = selected?.purchasedSeconds
    ? Math.max(0, Math.min(100, (selected.balanceSeconds / selected.purchasedSeconds) * 100))
    : 0;

  return <div className="hour-packs-stack">
    <section className="hour-pack-dashboard" aria-label="Synthèse des packs d’heures">
      <div><strong>Packs actifs</strong><span>{activePacks.length}</span><small>{packs.length} pack(s) enregistré(s)</small></div>
      <div><strong>Heures restantes</strong><span>{hours(totalBalanceSeconds)}</span><small>sur les packs actifs</small></div>
      <div className={attentionPacks.length ? 'warning' : ''}><strong>À surveiller</strong><span>{attentionPacks.length}</span><small>solde ≤ 1 h ou 20 %</small></div>
      <div><strong>Valeur contractuelle</strong><span>{money(totalContractCents)}</span><small>packs non archivés</small></div>
    </section>

    <div className="module-toolbar operations-toolbar">
      <div><strong>{filteredPacks.length}</strong><span> pack(s)</span></div>
      <div className="toolbar-controls hour-pack-toolbar-controls">
        <button className="secondary-button" type="button" onClick={() => void refresh()}>↻ Actualiser</button>
        <input className="inline-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher client, projet, pack…" />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
          <option value="all">Tous les statuts</option>
          {HOUR_PACK_STATUSES.filter((status) => status !== 'archived').map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
        </select>
        <button className="primary-button" type="button" onClick={() => setCreateOpen((value) => !value)}>{createOpen ? 'Fermer' : '+ Pack'}</button>
      </div>
    </div>

    {createOpen && <section className="panel operation-create-panel hour-pack-create-panel">
      <div className="panel-title">
        <div><span className="eyebrow">Pack d’heures</span><h2>Nouveau crédit de temps</h2><p className="muted">Choisis un forfait du Catalogue pour récupérer automatiquement ses heures et son tarif, ou utilise une saisie libre.</p></div>
        <button className="close-detail" type="button" onClick={() => { setCreateOpen(false); resetCreateForm(); }}>×</button>
      </div>
      <div className="hour-pack-template-picker">
        <label>Modèle depuis Offres & Tarifs
          <select value={catalogPackId} onChange={(event) => applyCatalogPack(event.target.value)}>
            <option value="">Pack libre — saisie manuelle</option>
            {catalogPacks.map((item) => {
              const packHours = inferCatalogPackHours(item);
              const packPrice = item.currentVersion?.priceCents;
              return <option key={item.id} value={item.id}>{item.name} · {packHours != null ? `${packHours} h` : 'durée à préciser'} · {packPrice != null ? money(packPrice) : 'Sur devis'}</option>;
            })}
          </select>
        </label>
        {catalogPackId && <div className="hour-pack-template-summary"><span>Source</span><strong>Catalogue AtoumWeb</strong><small>Les valeurs restent modifiables pour adapter le contrat client.</small></div>}
      </div>
      <div className="operation-create-grid">
        <label>Client<select value={clientId} onChange={(event) => { setClientId(event.target.value); setProjectId(''); }}><option value="">Choisir…</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.displayName}</option>)}</select></label>
        <label>Projet éventuel<select value={projectId} onChange={(event) => setProjectId(event.target.value)} disabled={!clientId}><option value="">Tous / aucun projet</option>{clientProjects.map((project) => <option key={project.id} value={project.id}>{project.number} · {project.name}</option>)}</select></label>
        <label>Nom<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex. Forfait 10 h" /></label>
        <label>Heures achetées<input type="number" min="0.25" step="0.25" value={hoursPurchased.replace(',', '.')} onChange={(event) => setHoursPurchased(event.target.value)} /></label>
        <label>Prix contractuel (€)<input type="number" min="0" step="0.01" value={price.replace(',', '.')} onChange={(event) => setPrice(event.target.value)} /></label>
        <label>Expiration éventuelle<input type="date" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} /></label>
      </div>
      <div className="button-row"><button className="primary-button" type="button" disabled={saving || !clientId || !name.trim() || Number(hoursPurchased.replace(',', '.')) <= 0 || price.trim() === ''} onClick={() => void createPack()}>{saving ? 'Création…' : 'Créer le pack'}</button><button className="secondary-button" type="button" onClick={() => { setCreateOpen(false); resetCreateForm(); }}>Annuler</button></div>
    </section>}

    <div
      className={selected ? `maintenance-layout hour-pack-workspace with-detail ${detailExpanded ? 'detail-expanded' : ''}` : 'maintenance-layout hour-pack-workspace'}
      style={selected && !detailExpanded ? { gridTemplateColumns: `${splitPercent}% 8px minmax(0, 1fr)` } : undefined}
    >
      {!detailExpanded && <section className="panel operation-list-panel hour-pack-list-panel">
        {selected ? <div className="hour-pack-compact-list" role="list" aria-label="Packs d’heures">
          {filteredPacks.map((pack) => <button key={pack.id} type="button" role="listitem" className={`hour-pack-compact-item ${selected.id === pack.id ? 'selected' : ''}`} onClick={() => setSelectedId(pack.id)}>
            <span className="hour-pack-compact-heading"><strong>{pack.name}</strong><span className={`hour-pack-status status-${pack.status}`}>{STATUS_LABELS[pack.status]}</span></span>
            <span className="hour-pack-compact-client">{pack.clientLabel}</span>
            <span className="hour-pack-compact-meta"><span>{hours(pack.balanceSeconds)} restant</span><span>{money(pack.contractPriceCents)}</span></span>
            <span className="hour-pack-compact-project">{pack.projectLabel || 'Sans projet dédié'}</span>
          </button>)}
          {filteredPacks.length === 0 && <div className="empty-table">Aucun pack d’heures.</div>}
        </div> : <table className="operations-table"><thead><tr><th>Client</th><th>Pack</th><th>Acheté</th><th>Restant</th><th>Statut</th></tr></thead><tbody>{filteredPacks.map((pack) => <tr key={pack.id} onClick={() => { setSelectedId(pack.id); setDetailExpanded(false); }}><td><strong>{pack.clientLabel}</strong><small>{pack.projectLabel || 'Sans projet dédié'}</small></td><td><strong>{pack.name}</strong><small>{money(pack.contractPriceCents)}</small></td><td>{hours(pack.purchasedSeconds)}</td><td><span className={pack.balanceSeconds < 0 ? 'negative-balance' : ''}>{hours(pack.balanceSeconds)}</span></td><td><span className={`hour-pack-status status-${pack.status}`}>{STATUS_LABELS[pack.status]}</span></td></tr>)}{filteredPacks.length === 0 && <tr><td colSpan={5}><div className="empty-table">Aucun pack d’heures.</div></td></tr>}</tbody></table>}
      </section>}

      {selected && !detailExpanded && <div
        className="operation-splitter"
        role="separator"
        aria-orientation="vertical"
        aria-label="Redimensionner la liste et l’atelier du pack"
        tabIndex={0}
        onPointerDown={beginResize}
        onDoubleClick={() => setSplitPercent(34)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') setSplitPercent((value) => Math.max(20, value - 3));
          if (event.key === 'ArrowRight') setSplitPercent((value) => Math.min(55, value + 3));
        }}
      ><span /></div>}

      {selected && <aside className={`panel operation-detail-panel hour-pack-detail hour-pack-workbench ${detailExpanded ? 'expanded' : ''}`}>
        <div className="detail-panel-heading">
          <div><span className="eyebrow">Pack d’heures</span><h2>{selected.name}</h2><p className="muted">{selected.clientLabel}{selected.projectLabel ? ` · ${selected.projectLabel}` : ''}</p></div>
          <div className="intervention-workbench-heading-actions">
            <button className="operation-detail-expand" type="button" title={detailExpanded ? 'Réduire l’atelier' : 'Agrandir l’atelier'} aria-label={detailExpanded ? 'Réduire l’atelier' : 'Agrandir l’atelier'} onClick={() => setDetailExpanded((value) => !value)}><OperationIcon name={detailExpanded ? 'collapse' : 'expand'} size={18} /></button>
            <button className="close-detail" type="button" title="Fermer" aria-label="Fermer" onClick={() => { setSelectedId(''); setDetailExpanded(false); }}><OperationIcon name="close" size={18} /></button>
          </div>
        </div>

        <div className="hour-pack-workbench-badges">
          <span className={`hour-pack-status status-${selected.status}`}>{STATUS_LABELS[selected.status]}</span>
          {packNeedsAttention(selected) && <span className="operation-priority priority-high">À surveiller</span>}
          {selected.expiresAt && <span className="status-pill">Expire le {dateLabel(selected.expiresAt)}</span>}
        </div>

        <div className="hour-pack-kpi-grid">
          <div><strong>Acheté</strong><span>{hours(selected.purchasedSeconds)}</span></div>
          <div><strong>Consommé</strong><span>{hours(selected.consumedSeconds)}</span></div>
          <div className={selected.balanceSeconds < 0 ? 'warning' : ''}><strong>Restant</strong><span>{hours(selected.balanceSeconds)}</span></div>
          <div><strong>Prix contractuel</strong><span>{money(selected.contractPriceCents)}</span></div>
        </div>

        <div className="hour-pack-progress" aria-label={`Solde restant : ${Math.round(remainingRatio)} %`}>
          <div className="hour-pack-progress-heading"><strong>Solde disponible</strong><span>{Math.round(remainingRatio)} %</span></div>
          <div className="hour-pack-progress-track"><span style={{ width: `${remainingRatio}%` }} /></div>
        </div>

        <details className="intervention-workbench-section" open>
          <summary><span><strong>Pilotage du pack</strong><small>Statut, seuils et traitement d’un éventuel dépassement</small></span></summary>
          <div className="intervention-workbench-section-body">
            <label className="hour-pack-workbench-field">Statut<select value={selected.status} onChange={(event) => void changeStatus(event.target.value as HourPackStatus)}>{HOUR_PACK_STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}</select></label>
            <HourPackShortfallPanel pack={selected} packs={packs} onChanged={refreshAfterShortfallDecision} onMessage={onMessage} />
          </div>
        </details>

        <details className="intervention-workbench-section" open>
          <summary><span><strong>Débiter une intervention</strong><small>Imputer le temps réel d’une intervention terminée ou à valider</small></span></summary>
          <div className="intervention-workbench-section-body">
            <select value={interventionId} onChange={(event) => setInterventionId(event.target.value)}><option value="">Choisir une intervention…</option>{eligibleInterventions.map((intervention) => <option key={intervention.id} value={intervention.id}>{intervention.number} · {intervention.subject} · {hours(intervention.totalTimeSeconds)}</option>)}</select>
            {eligibleInterventions.length === 0 && <p className="muted">Aucune intervention compatible à débiter pour ce client et ce projet.</p>}
            <button className="primary-button" type="button" disabled={!interventionId} onClick={() => void debitIntervention()}>Débiter le temps réel</button>
          </div>
        </details>

        <details className="intervention-workbench-section">
          <summary><span><strong>Ajustement manuel</strong><small>Correction exceptionnelle ou crédit commercial</small></span></summary>
          <div className="intervention-workbench-section-body">
            <label className="hour-pack-workbench-field">Type<select value={movementMode} onChange={(event) => setMovementMode(event.target.value as typeof movementMode)}><option value="manual_correction">Correction manuelle (+ ou -)</option><option value="commercial_credit">Crédit / geste commercial</option></select></label>
            <label className="hour-pack-workbench-field">Heures<input type="number" step="0.25" value={movementHours} onChange={(event) => setMovementHours(event.target.value)} placeholder="Ex. -0,5 ou 1" /></label>
            <label className="hour-pack-workbench-field">Motif<input value={movementReason} onChange={(event) => setMovementReason(event.target.value)} placeholder="Motif obligatoire" /></label>
            <button className="secondary-button" type="button" disabled={!movementHours || !movementReason.trim()} onClick={() => void addMovement()}>Ajouter le mouvement</button>
          </div>
        </details>

        <details className="intervention-workbench-section">
          <summary><span><strong>Historique des mouvements</strong><small>{selected.movements.length} mouvement(s) enregistré(s)</small></span></summary>
          <div className="intervention-workbench-section-body hour-pack-history">
            <label className="hour-pack-workbench-field">Motif d’une éventuelle annulation<input value={reversalReason} onChange={(event) => setReversalReason(event.target.value)} placeholder="Motif d’annulation" /></label>
            {selected.movements.map((movement) => {
              const alreadyReversed = selected.movements.some((item) => item.reversalOfMovementId === movement.id);
              return <div className="hour-pack-movement" key={movement.id}><div><strong>{movement.reason}</strong><small>{dateLabel(movement.createdAt)} · {MOVEMENT_LABELS[movement.type]}</small></div><span className={movement.secondsDelta < 0 ? 'negative-balance' : ''}>{movement.secondsDelta > 0 ? '+' : ''}{hours(movement.secondsDelta)}</span>{movement.type !== 'reversal' && !alreadyReversed && <button className="text-button" type="button" disabled={!reversalReason.trim()} onClick={() => void reverseMovement(movement.id)}>Annuler</button>}</div>;
            })}
            {selected.movements.length === 0 && <p className="muted">Aucun mouvement enregistré.</p>}
          </div>
        </details>

        <div className="operation-meta intervention-workbench-meta">
          <span>Acheté le : {dateLabel(selected.purchasedAt)}</span>
          <span>Expiration : {dateLabel(selected.expiresAt)}</span>
          <span>Créé le : {dateLabel(selected.createdAt)}</span>
        </div>
      </aside>}
    </div>
  </div>;
}
