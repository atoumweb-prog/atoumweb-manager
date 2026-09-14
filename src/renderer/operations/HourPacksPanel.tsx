import { useEffect, useMemo, useState } from 'react';
import type { ClientSummary } from '../../shared/crm';
import {
  HOUR_PACK_STATUSES,
  type HourPack,
  type HourPackStatus,
  type Intervention,
} from '../../shared/operations';
import type { ProjectSummary } from '../../shared/projects';
import { HourPackShortfallPanel } from './HourPackShortfallPanel';

const STATUS_LABELS: Record<HourPackStatus, string> = {
  active: 'Actif', exhausted: 'Épuisé', expired: 'Expiré', suspended: 'Suspendu', archived: 'Archivé',
};

function hours(seconds: number): string {
  return `${(seconds / 3600).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} h`;
}
function money(cents: number): string {
  return `${(cents / 100).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €`;
}
function dateLabel(value: string): string {
  return new Date(value).toLocaleDateString('fr-FR');
}

export function HourPacksPanel({ clients, projects, interventions, onMessage, onOperationsChanged, initialPackId }: {
  clients: ClientSummary[];
  projects: ProjectSummary[];
  interventions: Intervention[];
  onMessage: (message: string) => void;
  onOperationsChanged: () => Promise<void>;
  initialPackId?: string | null;
}) {
  const [packs, setPacks] = useState<HourPack[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [clientId, setClientId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [name, setName] = useState('Pack 10 h');
  const [hoursPurchased, setHoursPurchased] = useState('10');
  const [price, setPrice] = useState('0');
  const [expiresAt, setExpiresAt] = useState('');

  const [movementHours, setMovementHours] = useState('');
  const [movementReason, setMovementReason] = useState('');
  const [movementMode, setMovementMode] = useState<'manual_correction' | 'commercial_credit'>('manual_correction');
  const [interventionId, setInterventionId] = useState('');
  const [reversalReason, setReversalReason] = useState('Correction du mouvement');

  async function refresh(): Promise<void> {
    try {
      const next = await window.atoumweb.operations.hourPacks.list();
      setPacks(next);
      if (selectedId && !next.some((pack) => pack.id === selectedId)) setSelectedId('');
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de charger les packs d’heures.');
    }
  }

  useEffect(() => { void refresh(); }, []);
  useEffect(() => {
    if (initialPackId) setSelectedId(initialPackId);
  }, [initialPackId]);

  const selected = packs.find((pack) => pack.id === selectedId) ?? null;
  const clientProjects = projects.filter((project) => project.clientAccountId === clientId && project.status !== 'archived');
  const eligibleInterventions = useMemo(() => {
    if (!selected) return [];
    return interventions.filter((intervention) =>
      intervention.clientAccountId === selected.clientAccountId
      && (!selected.projectId || intervention.projectId === selected.projectId)
      && ['to_validate', 'completed'].includes(intervention.status),
    );
  }, [selected, interventions]);

  async function createPack(): Promise<void> {
    if (!clientId) return;
    setSaving(true);
    try {
      const parsedHours = Number(hoursPurchased.replace(',', '.'));
      const created = await window.atoumweb.operations.hourPacks.create({
        clientAccountId: clientId,
        projectId: projectId || null,
        name,
        purchasedSeconds: Math.max(1, Math.round(parsedHours * 3600)),
        contractPriceCents: Math.max(0, Math.round(Number(price.replace(',', '.')) * 100)),
        expiresAt: expiresAt ? `${expiresAt}T23:59:59.000Z` : null,
      });
      await refresh();
      setSelectedId(created.id);
      setCreateOpen(false);
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

  return <div className="hour-packs-stack">
    <div className="module-toolbar operations-toolbar"><div><strong>{packs.filter((pack) => pack.status !== 'archived').length}</strong><span> pack(s)</span></div><div className="toolbar-controls"><button className="secondary-button" type="button" onClick={() => void refresh()}>↻ Actualiser</button><button className="primary-button" type="button" onClick={() => setCreateOpen((value) => !value)}>+ Pack</button></div></div>

    {createOpen && <section className="panel operation-create-panel"><div className="panel-title"><div><span className="eyebrow">Pack d’heures</span><h2>Nouveau crédit de temps</h2></div></div><div className="operation-create-grid">
      <label>Client<select value={clientId} onChange={(event) => { setClientId(event.target.value); setProjectId(''); }}><option value="">Choisir…</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.displayName}</option>)}</select></label>
      <label>Projet éventuel<select value={projectId} onChange={(event) => setProjectId(event.target.value)} disabled={!clientId}><option value="">Tous / aucun projet</option>{clientProjects.map((project) => <option key={project.id} value={project.id}>{project.number} · {project.name}</option>)}</select></label>
      <label>Nom<input value={name} onChange={(event) => setName(event.target.value)} /></label>
      <label>Heures achetées<input type="number" min="0.25" step="0.25" value={hoursPurchased} onChange={(event) => setHoursPurchased(event.target.value)} /></label>
      <label>Prix contractuel (€)<input type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} /></label>
      <label>Expiration éventuelle<input type="date" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} /></label>
    </div><div className="button-row"><button className="primary-button" type="button" disabled={saving || !clientId || !name.trim() || Number(hoursPurchased) <= 0} onClick={() => void createPack()}>Créer le pack</button><button className="secondary-button" type="button" onClick={() => setCreateOpen(false)}>Annuler</button></div></section>}

    <div className={selected ? 'maintenance-layout with-detail' : 'maintenance-layout'}>
      <section className="panel operation-list-panel"><table className="operations-table"><thead><tr><th>Client</th><th>Pack</th><th>Acheté</th><th>Restant</th><th>Statut</th></tr></thead><tbody>{packs.filter((pack) => pack.status !== 'archived').map((pack) => <tr key={pack.id} className={selectedId === pack.id ? 'selected-row' : ''} onClick={() => setSelectedId(pack.id)}><td><strong>{pack.clientLabel}</strong><small>{pack.projectLabel || 'Sans projet dédié'}</small></td><td><strong>{pack.name}</strong><small>{money(pack.contractPriceCents)}</small></td><td>{hours(pack.purchasedSeconds)}</td><td><strong className={pack.balanceSeconds < 0 ? 'negative-balance' : ''}>{hours(pack.balanceSeconds)}</strong></td><td>{STATUS_LABELS[pack.status]}</td></tr>)}{packs.filter((pack) => pack.status !== 'archived').length === 0 && <tr><td colSpan={5}><div className="empty-table">Aucun pack d’heures.</div></td></tr>}</tbody></table></section>

      {selected && <aside className="panel operation-detail-panel hour-pack-detail"><div className="detail-panel-heading"><div><span className="eyebrow">Pack d’heures</span><h2>{selected.name}</h2><p className="muted">{selected.clientLabel}{selected.projectLabel ? ` · ${selected.projectLabel}` : ''}</p></div><button className="close-detail" type="button" onClick={() => setSelectedId('')}>×</button></div>
        <div className="maintenance-usage-grid"><div><span>Acheté</span><strong>{hours(selected.purchasedSeconds)}</strong></div><div><span>Consommé</span><strong>{hours(selected.consumedSeconds)}</strong></div><div className={selected.balanceSeconds < 0 ? 'warning' : ''}><span>Solde</span><strong>{hours(selected.balanceSeconds)}</strong></div></div>
        <HourPackShortfallPanel pack={selected} packs={packs} onChanged={refreshAfterShortfallDecision} onMessage={onMessage} />
        <label>Statut<select value={selected.status} onChange={(event) => void changeStatus(event.target.value as HourPackStatus)}>{HOUR_PACK_STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}</select></label>
        <div className="operation-action-box"><strong>Débiter une intervention terminée</strong><select value={interventionId} onChange={(event) => setInterventionId(event.target.value)}><option value="">Choisir…</option>{eligibleInterventions.map((intervention) => <option key={intervention.id} value={intervention.id}>{intervention.number} · {intervention.subject} · {hours(intervention.totalTimeSeconds)}</option>)}</select><button className="primary-button" type="button" disabled={!interventionId} onClick={() => void debitIntervention()}>Débiter le temps réel</button></div>
        <div className="operation-action-box subtle"><strong>Correction / crédit manuel</strong><select value={movementMode} onChange={(event) => setMovementMode(event.target.value as typeof movementMode)}><option value="manual_correction">Correction manuelle (+ ou -)</option><option value="commercial_credit">Crédit / geste commercial</option></select><input type="number" step="0.25" value={movementHours} onChange={(event) => setMovementHours(event.target.value)} placeholder="Heures, ex. -0,5 ou 1" /><input value={movementReason} onChange={(event) => setMovementReason(event.target.value)} placeholder="Motif obligatoire" /><button className="secondary-button" type="button" disabled={!movementHours || !movementReason.trim()} onClick={() => void addMovement()}>Ajouter le mouvement</button></div>
        <div className="hour-pack-history"><div className="hour-pack-history-title"><strong>Historique</strong><input value={reversalReason} onChange={(event) => setReversalReason(event.target.value)} placeholder="Motif d’annulation" /></div>{selected.movements.map((movement) => { const alreadyReversed = selected.movements.some((item) => item.reversalOfMovementId === movement.id); return <div className="hour-pack-movement" key={movement.id}><div><strong>{movement.reason}</strong><small>{dateLabel(movement.createdAt)} · {movement.type}</small></div><span className={movement.secondsDelta < 0 ? 'negative-balance' : ''}>{movement.secondsDelta > 0 ? '+' : ''}{hours(movement.secondsDelta)}</span>{movement.type !== 'reversal' && !alreadyReversed && <button className="text-button" type="button" disabled={!reversalReason.trim()} onClick={() => void reverseMovement(movement.id)}>Annuler</button>}</div>; })}</div>
      </aside>}
    </div>
  </div>;
}
