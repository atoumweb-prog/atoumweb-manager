import { useEffect, useMemo, useState } from 'react';
import type { ClientSummary } from '../../shared/crm';
import {
  MAINTENANCE_CHECK_STATUSES,
  MAINTENANCE_FREQUENCIES,
  MAINTENANCE_PERIOD_STATUSES,
  MAINTENANCE_SUBSCRIPTION_STATUSES,
  type Intervention,
  type MaintenanceCheckStatus,
  type MaintenanceFrequency,
  type MaintenancePeriod,
  type MaintenancePeriodStatus,
  type MaintenancePlan,
  type MaintenanceSubscription,
  type MaintenanceSubscriptionStatus,
} from '../../shared/operations';
import type { ProjectSummary } from '../../shared/projects';
import { MaintenanceOveragePanel } from './MaintenanceOveragePanel';
import { MaintenanceReportPanel } from './MaintenanceReportPanel';

const FREQUENCY_LABELS: Record<MaintenanceFrequency, string> = { monthly: 'Mensuelle', quarterly: 'Trimestrielle', yearly: 'Annuelle' };
const SUBSCRIPTION_LABELS: Record<MaintenanceSubscriptionStatus, string> = { active: 'Active', suspended: 'Suspendue', ended: 'Terminée', archived: 'Archivée' };
const PERIOD_LABELS: Record<MaintenancePeriodStatus, string> = { upcoming: 'À venir', open: 'Ouverte', to_do: 'À faire', in_progress: 'En cours', completed: 'Terminée', closed: 'Clôturée' };
const CHECK_LABELS: Record<MaintenanceCheckStatus, string> = { todo: 'À faire', done: 'Fait', not_applicable: 'Non applicable' };

function euro(cents: number): string {
  return `${(cents / 100).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €`;
}
function hours(seconds: number): string {
  const value = seconds / 3600;
  return `${value.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} h`;
}

export function MaintenancePanel({ clients, projects, onMessage, onInterventionCreated, initialSubscriptionId }: {
  clients: ClientSummary[];
  projects: ProjectSummary[];
  onMessage: (message: string) => void;
  onInterventionCreated: (intervention: Intervention) => void;
  initialSubscriptionId?: string | null;
}) {
  const [plans, setPlans] = useState<MaintenancePlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<MaintenanceSubscription[]>([]);
  const [periods, setPeriods] = useState<MaintenancePeriod[]>([]);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState('');
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [splitPercent, setSplitPercent] = useState(36);
  const [detailExpanded, setDetailExpanded] = useState(false);
  const [createSubscriptionOpen, setCreateSubscriptionOpen] = useState(false);
  const [createPlanOpen, setCreatePlanOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [clientId, setClientId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [planId, setPlanId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [contractPrice, setContractPrice] = useState('');

  const [planName, setPlanName] = useState('');
  const [planPrice, setPlanPrice] = useState('');
  const [planQuota, setPlanQuota] = useState('0');
  const [planFrequency, setPlanFrequency] = useState<MaintenanceFrequency>('monthly');

  async function refresh(): Promise<void> {
    try {
      const [nextPlans, nextSubscriptions] = await Promise.all([
        window.atoumweb.operations.maintenance.plans.list(),
        window.atoumweb.operations.maintenance.subscriptions.list(),
      ]);
      setPlans(nextPlans);
      setSubscriptions(nextSubscriptions);
      if (selectedSubscriptionId && !nextSubscriptions.some((item) => item.id === selectedSubscriptionId)) {
        setSelectedSubscriptionId('');
        setSelectedPeriodId('');
      }
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de charger la maintenance.');
    }
  }

  async function loadPeriods(subscriptionId: string): Promise<void> {
    if (!subscriptionId) { setPeriods([]); setSelectedPeriodId(''); return; }
    try {
      const next = await window.atoumweb.operations.maintenance.periods.list(subscriptionId);
      setPeriods(next);
      setSelectedPeriodId((current) => next.some((period) => period.id === current) ? current : next[0]?.id ?? '');
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de charger les périodes.');
    }
  }

  useEffect(() => { void refresh(); }, []);
  useEffect(() => { void loadPeriods(selectedSubscriptionId); }, [selectedSubscriptionId]);
  useEffect(() => {
    if (initialSubscriptionId) setSelectedSubscriptionId(initialSubscriptionId);
  }, [initialSubscriptionId]);

  useEffect(() => {
    if (!selectedSubscriptionId) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedSubscriptionId('');
        setSelectedPeriodId('');
        setDetailExpanded(false);
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedSubscriptionId]);

  const selectedSubscription = subscriptions.find((item) => item.id === selectedSubscriptionId) ?? null;
  const selectedPeriod = periods.find((item) => item.id === selectedPeriodId) ?? null;
  const clientProjects = projects.filter((project) => project.clientAccountId === clientId && project.status !== 'archived');
  const selectedPlan = plans.find((plan) => plan.id === planId) ?? null;

  useEffect(() => {
    if (selectedPlan) setContractPrice(String(selectedPlan.periodicPriceCents / 100));
  }, [selectedPlan?.id]);

  async function createSubscription(): Promise<void> {
    if (!clientId || !planId) return;
    setSaving(true);
    try {
      const created = await window.atoumweb.operations.maintenance.subscriptions.create({
        clientAccountId: clientId,
        projectId: projectId || null,
        planId,
        startDate,
        contractPriceCents: contractPrice.trim() ? Math.max(0, Math.round(Number(contractPrice.replace(',', '.')) * 100)) : null,
      });
      await refresh();
      setSelectedSubscriptionId(created.id);
      setCreateSubscriptionOpen(false);
      onMessage(`Maintenance activée pour ${created.clientLabel}.`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de créer la souscription.');
    } finally { setSaving(false); }
  }

  async function createPlan(): Promise<void> {
    setSaving(true);
    try {
      const created = await window.atoumweb.operations.maintenance.plans.create({
        name: planName,
        periodicPriceCents: Math.max(0, Math.round(Number(planPrice.replace(',', '.')) * 100)),
        frequency: planFrequency,
        includedInterventions: Math.max(0, Math.round(Number(planQuota))),
        checklistTemplateId: 'seed-maintenance-wordpress',
      });
      await refresh();
      setPlanId(created.id);
      setPlanName(''); setPlanPrice(''); setPlanQuota('0'); setCreatePlanOpen(false);
      onMessage(`Plan « ${created.name} » créé.`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de créer le plan.');
    } finally { setSaving(false); }
  }

  async function ensureCurrentPeriod(): Promise<void> {
    if (!selectedSubscription) return;
    try {
      const period = await window.atoumweb.operations.maintenance.periods.ensure(selectedSubscription.id);
      await loadPeriods(selectedSubscription.id);
      setSelectedPeriodId(period.id);
      onMessage(`Période ${period.periodStart} → ${period.periodEnd} prête.`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de générer la période.');
    }
  }

  async function changeSubscriptionStatus(status: MaintenanceSubscriptionStatus): Promise<void> {
    if (!selectedSubscription) return;
    try {
      await window.atoumweb.operations.maintenance.subscriptions.changeStatus(selectedSubscription.id, status);
      await refresh();
    } catch (error) { onMessage(error instanceof Error ? error.message : 'Impossible de modifier la souscription.'); }
  }

  async function changePeriodStatus(status: MaintenancePeriodStatus): Promise<void> {
    if (!selectedPeriod) return;
    try {
      const updated = await window.atoumweb.operations.maintenance.periods.changeStatus(selectedPeriod.id, status);
      await loadPeriods(updated.subscriptionId);
      setSelectedPeriodId(updated.id);
    } catch (error) { onMessage(error instanceof Error ? error.message : 'Impossible de modifier la période.'); }
  }

  async function changeCheck(id: string, status: MaintenanceCheckStatus): Promise<void> {
    try {
      const updated = await window.atoumweb.operations.maintenance.periods.updateCheck(id, status);
      setPeriods((current) => current.map((period) => period.id === updated.id ? updated : period));
    } catch (error) { onMessage(error instanceof Error ? error.message : 'Impossible de modifier la checklist.'); }
  }

  async function createMaintenanceIntervention(): Promise<void> {
    if (!selectedSubscription || !selectedPeriod) return;
    try {
      const intervention = await window.atoumweb.operations.interventions.create({
        clientAccountId: selectedSubscription.clientAccountId,
        projectId: selectedSubscription.projectId || null,
        maintenancePeriodId: selectedPeriod.id,
        type: 'maintenance',
        coverageMode: 'maintenance',
        subject: `Maintenance ${selectedPeriod.periodStart} → ${selectedPeriod.periodEnd}`,
        priority: 'normal',
      });
      await loadPeriods(selectedSubscription.id);
      onInterventionCreated(intervention);
      onMessage(`${intervention.number} rattachée à la période de maintenance.`);
    } catch (error) { onMessage(error instanceof Error ? error.message : 'Impossible de créer l’intervention de maintenance.'); }
  }

  const activeSubscriptions = useMemo(() => subscriptions.filter((item) => item.status !== 'archived'), [subscriptions]);
  const activeCount = activeSubscriptions.filter((item) => item.status === 'active').length;
  const suspendedCount = activeSubscriptions.filter((item) => item.status === 'suspended').length;
  const activePlansCount = plans.filter((plan) => plan.status === 'active').length;
  const contractValue = activeSubscriptions
    .filter((item) => item.status === 'active')
    .reduce((sum, item) => sum + item.contractPriceCents, 0);

  function beginResize(): void {
    const workspace = document.querySelector<HTMLElement>('.maintenance-layout.with-detail');
    if (!workspace) return;
    document.body.classList.add('operation-resizing');
    const onMove = (event: PointerEvent) => {
      const rect = workspace.getBoundingClientRect();
      if (!rect.width) return;
      const ratio = ((event.clientX - rect.left) / rect.width) * 100;
      setSplitPercent(Math.max(20, Math.min(58, ratio)));
    };
    const onUp = () => {
      document.body.classList.remove('operation-resizing');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
  }

  return <div className="maintenance-panel-stack">
    <section className="maintenance-dashboard" aria-label="Synthèse Maintenance">
      <article><span className="maintenance-dashboard-icon" aria-hidden="true">✓</span><div><strong>Maintenances actives</strong><span>{activeCount}</span><small>Contrats actuellement suivis</small></div></article>
      <article><span className="maintenance-dashboard-icon" aria-hidden="true">Ⅱ</span><div><strong>Suspendues</strong><span>{suspendedCount}</span><small>À reprendre ou à clôturer</small></div></article>
      <article><span className="maintenance-dashboard-icon" aria-hidden="true">▤</span><div><strong>Plans actifs</strong><span>{activePlansCount}</span><small>Références disponibles</small></div></article>
      <article><span className="maintenance-dashboard-icon" aria-hidden="true">€</span><div><strong>Valeur / période</strong><span>{euro(contractValue)}</span><small>Souscriptions actives</small></div></article>
    </section>
    <div className="module-toolbar operations-toolbar">
      <div><strong>{activeSubscriptions.length}</strong><span> maintenance(s)</span></div>
      <div className="toolbar-controls">
        <button className="secondary-button" type="button" onClick={() => void refresh()}>↻ Actualiser</button>
        <button className="secondary-button" type="button" onClick={() => setCreatePlanOpen((value) => !value)}>+ Plan</button>
        <button className="primary-button" type="button" onClick={() => setCreateSubscriptionOpen((value) => !value)}>+ Souscription</button>
      </div>
    </div>

    {createPlanOpen && <section className="panel operation-create-panel"><div className="panel-title"><div><span className="eyebrow">Plan de maintenance</span><h2>Nouvelle référence</h2></div></div><div className="operation-create-grid">
      <label>Nom<input value={planName} onChange={(event) => setPlanName(event.target.value)} placeholder="Maintenance WordPress…" /></label>
      <label>Prix / période (€)<input type="number" min="0" step="0.01" value={planPrice} onChange={(event) => setPlanPrice(event.target.value)} /></label>
      <label>Interventions incluses<input type="number" min="0" value={planQuota} onChange={(event) => setPlanQuota(event.target.value)} /></label>
      <label>Fréquence<select value={planFrequency} onChange={(event) => setPlanFrequency(event.target.value as MaintenanceFrequency)}>{MAINTENANCE_FREQUENCIES.map((frequency) => <option key={frequency} value={frequency}>{FREQUENCY_LABELS[frequency]}</option>)}</select></label>
    </div><div className="button-row"><button className="primary-button" disabled={saving || !planName.trim() || !planPrice} type="button" onClick={() => void createPlan()}>Créer le plan</button><button className="secondary-button" type="button" onClick={() => setCreatePlanOpen(false)}>Annuler</button></div></section>}

    {createSubscriptionOpen && <section className="panel operation-create-panel"><div className="panel-title"><div><span className="eyebrow">Maintenance client</span><h2>Nouvelle souscription</h2></div></div><div className="operation-create-grid">
      <label>Client<select value={clientId} onChange={(event) => { setClientId(event.target.value); setProjectId(''); }}><option value="">Choisir…</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.displayName}</option>)}</select></label>
      <label>Projet / site<select value={projectId} onChange={(event) => setProjectId(event.target.value)} disabled={!clientId}><option value="">Aucun projet</option>{clientProjects.map((project) => <option key={project.id} value={project.id}>{project.number} · {project.name}</option>)}</select></label>
      <label>Plan<select value={planId} onChange={(event) => setPlanId(event.target.value)}><option value="">Choisir…</option>{plans.filter((plan) => plan.status === 'active').map((plan) => <option key={plan.id} value={plan.id}>{plan.name} · {euro(plan.periodicPriceCents)}</option>)}</select></label>
      <label>Début<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
      <label>Prix contractuel / période (€)<input type="number" min="0" step="0.01" value={contractPrice} onChange={(event) => setContractPrice(event.target.value)} /></label>
    </div><div className="button-row"><button className="primary-button" disabled={saving || !clientId || !planId} type="button" onClick={() => void createSubscription()}>Créer la souscription</button><button className="secondary-button" type="button" onClick={() => setCreateSubscriptionOpen(false)}>Annuler</button></div></section>}

    <div
      className={selectedSubscription ? `maintenance-layout with-detail ${detailExpanded ? 'detail-expanded' : ''}` : 'maintenance-layout'}
      style={selectedSubscription && !detailExpanded ? { gridTemplateColumns: `${splitPercent}% 8px minmax(0, 1fr)` } : undefined}
    >
      {!detailExpanded && <section className="panel operation-list-panel maintenance-list-panel">
        {selectedSubscription ? <div className="maintenance-compact-list" role="list" aria-label="Souscriptions de maintenance">
          {activeSubscriptions.map((subscription) => <button key={subscription.id} type="button" role="listitem" className={`maintenance-compact-item ${selectedSubscriptionId === subscription.id ? 'selected' : ''}`} onClick={() => setSelectedSubscriptionId(subscription.id)}>
            <span className="maintenance-compact-heading"><strong>{subscription.clientLabel}</strong><span className={`maintenance-status status-${subscription.status}`}>{SUBSCRIPTION_LABELS[subscription.status]}</span></span>
            <span className="maintenance-compact-plan">{subscription.planName}</span>
            <span className="maintenance-compact-meta"><span>{FREQUENCY_LABELS[subscription.frequency]}</span><span>{euro(subscription.contractPriceCents)}</span></span>
            <span className="maintenance-compact-project">{subscription.projectLabel || 'Tous / sans projet'}</span>
          </button>)}
          {activeSubscriptions.length === 0 && <div className="empty-table">Aucune maintenance active.</div>}
        </div> : <table className="operations-table"><thead><tr><th>Client</th><th>Plan</th><th>Projet</th><th>Prix</th><th>Statut</th></tr></thead><tbody>{activeSubscriptions.map((subscription) => <tr key={subscription.id} className={selectedSubscriptionId === subscription.id ? 'selected-row' : ''} onClick={() => { setSelectedSubscriptionId(subscription.id); setDetailExpanded(false); }}><td><strong>{subscription.clientLabel}</strong><small>Depuis {subscription.startDate}</small></td><td><strong>{subscription.planName}</strong><small>{FREQUENCY_LABELS[subscription.frequency]} · {subscription.includedInterventions} intervention(s)</small></td><td>{subscription.projectLabel || 'Tous / sans projet'}</td><td>{euro(subscription.contractPriceCents)}</td><td>{SUBSCRIPTION_LABELS[subscription.status]}</td></tr>)}{activeSubscriptions.length === 0 && <tr><td colSpan={5}><div className="empty-table">Aucune maintenance active.</div></td></tr>}</tbody></table>}
      </section>}

      {selectedSubscription && !detailExpanded && <div className="operation-splitter" role="separator" aria-orientation="vertical" aria-label="Redimensionner la liste et la fiche maintenance" tabIndex={0} onPointerDown={beginResize} onDoubleClick={() => setSplitPercent(36)} onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') setSplitPercent((value) => Math.max(20, value - 3));
        if (event.key === 'ArrowRight') setSplitPercent((value) => Math.min(58, value + 3));
      }}><span /></div>}

      {selectedSubscription && <aside className={`panel operation-detail-panel maintenance-detail-panel ${detailExpanded ? 'expanded' : ''}`}><div className="detail-panel-heading"><div><span className="eyebrow">Maintenance</span><h2>{selectedSubscription.clientLabel}</h2><p className="muted">{selectedSubscription.planName}{selectedSubscription.projectLabel ? ` · ${selectedSubscription.projectLabel}` : ''}</p></div><div className="maintenance-detail-heading-actions"><button className="operation-detail-expand" type="button" title={detailExpanded ? 'Réduire la fiche' : 'Agrandir la fiche'} aria-label={detailExpanded ? 'Réduire la fiche' : 'Agrandir la fiche'} onClick={() => setDetailExpanded((value) => !value)}>{detailExpanded ? '↙' : '⛶'}</button><button className="close-detail" type="button" title="Fermer" onClick={() => { setSelectedSubscriptionId(''); setSelectedPeriodId(''); setDetailExpanded(false); }}>×</button></div></div>
        <div className="operation-detail-grid"><div><span>Prix contractuel</span><strong>{euro(selectedSubscription.contractPriceCents)}</strong></div><div><span>Quota</span><strong>{selectedSubscription.includedInterventions} intervention(s)</strong></div></div>
        <label>Statut<select value={selectedSubscription.status} onChange={(event) => void changeSubscriptionStatus(event.target.value as MaintenanceSubscriptionStatus)}>{MAINTENANCE_SUBSCRIPTION_STATUSES.map((status) => <option key={status} value={status}>{SUBSCRIPTION_LABELS[status]}</option>)}</select></label>
        <button className="secondary-button" type="button" disabled={selectedSubscription.status !== 'active'} onClick={() => void ensureCurrentPeriod()}>Générer / ouvrir la période actuelle</button>
        <div className="maintenance-period-list"><strong>Périodes</strong>{periods.map((period) => <button key={period.id} type="button" className={period.id === selectedPeriodId ? 'selected' : ''} onClick={() => setSelectedPeriodId(period.id)}><span>{period.periodStart} → {period.periodEnd}</span><small>{PERIOD_LABELS[period.status]} · {period.usage.interventionCount}/{period.includedInterventions || '∞'} intervention(s)</small></button>)}{periods.length === 0 && <p className="muted">Aucune période générée.</p>}</div>

        {selectedPeriod && <div className="maintenance-period-detail"><div className="maintenance-usage-grid"><div><span>Interventions</span><strong>{selectedPeriod.usage.interventionCount}{selectedPeriod.includedInterventions ? ` / ${selectedPeriod.includedInterventions}` : ''}</strong></div><div><span>Temps passé</span><strong>{hours(selectedPeriod.usage.usedSeconds)}</strong></div><div className={selectedPeriod.usage.interventionsOverQuota > 0 ? 'warning' : ''}><span>Dépassement</span><strong>{selectedPeriod.usage.interventionsOverQuota || 0}</strong></div></div>
          <MaintenanceOveragePanel period={selectedPeriod} onMessage={onMessage} />
          <label>État de la période<select value={selectedPeriod.status} onChange={(event) => void changePeriodStatus(event.target.value as MaintenancePeriodStatus)}>{MAINTENANCE_PERIOD_STATUSES.map((status) => <option key={status} value={status}>{PERIOD_LABELS[status]}</option>)}</select></label>
          <button className="primary-button" type="button" disabled={selectedPeriod.status === 'closed'} onClick={() => void createMaintenanceIntervention()}>+ Intervention de maintenance</button>
          <div className="maintenance-checklist"><strong>Checklist</strong>{selectedPeriod.checks.map((check) => <div key={check.id} className={`maintenance-check check-${check.status}`}><div><strong>{check.label}</strong>{check.description && <small>{check.description}</small>}</div><select value={check.status} disabled={selectedPeriod.status === 'closed'} onChange={(event) => void changeCheck(check.id, event.target.value as MaintenanceCheckStatus)}>{MAINTENANCE_CHECK_STATUSES.map((status) => <option key={status} value={status}>{CHECK_LABELS[status]}</option>)}</select></div>)}</div>
          <MaintenanceReportPanel periodId={selectedPeriod.id} onMessage={onMessage} />
        </div>}
      </aside>}
    </div>
  </div>;
}