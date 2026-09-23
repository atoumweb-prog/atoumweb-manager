import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { BillingItem } from '../../shared/billing';
import type { CrmAction, ProspectSummary, SearchResult } from '../../shared/crm';
import type { Intervention } from '../../shared/operations';
import type { OperationsAlert, OperationsAlertsSnapshot } from '../../shared/operationsAlerts';
import type { ProjectSummary } from '../../shared/projects';
import type { TimeSummary } from '../../shared/time';
import type { DashboardEntry } from '../../shared/workflow';
import { openEntity } from '../workflow/DossierPanel';
import { OperationIcon, type OperationIconName } from '../operations/OperationIcon';
import './HomeDashboard.css';

type HomePageName = 'Prospects' | 'Devis' | 'Projets' | 'Interventions & Maintenance' | 'Gestion des temps' | 'Facturation';

interface HomeData {
  entries: DashboardEntry[];
  prospects: ProspectSummary[];
  actions: CrmAction[];
  projects: ProjectSummary[];
  interventions: Intervention[];
  time: TimeSummary;
  billing: BillingItem[];
  alerts: OperationsAlertsSnapshot;
}

interface PipelineItem {
  key: string;
  label: string;
  count: number;
  tone: string;
}

const EMPTY_TIME: TimeSummary = { totalSeconds: 0, billableSeconds: 0, nonBillableSeconds: 0, sessionCount: 0 };

function openPage(page: HomePageName): void {
  window.dispatchEvent(new CustomEvent('atoumweb:open-page', { detail: page }));
}

function openProspectPipeline(filter: 'all' | 'relaunch' | 'overdue' = 'all'): void {
  window.dispatchEvent(new CustomEvent('atoumweb:open-prospects-view', { detail: { view: 'pipeline', pipelineFilter: filter } }));
}

function money(cents: number): string {
  return `${(cents / 100).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €`;
}

function hours(seconds: number): string {
  const value = seconds / 3600;
  if (value === 0) return '0 h';
  return `${value.toLocaleString('fr-FR', { maximumFractionDigits: value < 10 ? 1 : 0 })} h`;
}

function alertTarget(alert: OperationsAlert): SearchResult | null {
  if (alert.interventionId) return { entityType: 'intervention', entityId: alert.interventionId, title: alert.title };
  if (alert.hourPackId) return { entityType: 'hour_pack', entityId: alert.hourPackId, title: alert.title };
  if (alert.maintenanceSubscriptionId) return { entityType: 'maintenance', entityId: alert.maintenanceSubscriptionId, title: alert.title };
  return null;
}

function targetIcon(target: SearchResult): OperationIconName {
  switch (target.entityType) {
    case 'prospect': return 'user';
    case 'quote': return 'file-text';
    case 'project': return 'folder';
    case 'service_request':
    case 'intervention':
    case 'maintenance':
    case 'hour_pack': return 'wrench';
    default: return 'calendar';
  }
}

export function HomeDashboard({ onMessage }: { onMessage: (message: string) => void }) {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [clockNow, setClockNow] = useState(() => new Date());

  async function load(): Promise<void> {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).toISOString();
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
    setLoadError('');
    try {
      const [entries, prospects, actions, projects, interventions, time, billing, alerts] = await Promise.all([
        window.atoumweb.workflow.dashboard(),
        window.atoumweb.crm.prospects.list(),
        window.atoumweb.crm.actions.list({ ownerType: 'prospect' }),
        window.atoumweb.projects.projects.list(),
        window.atoumweb.operations.interventions.list(),
        window.atoumweb.time.summary({ from, to }),
        window.atoumweb.billing.list(),
        window.atoumweb.operationsAlerts.get(),
      ]);
      setData({ entries, prospects, actions, projects, interventions, time, billing, alerts });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de charger l’accueil.';
      setLoadError(message);
      onMessage(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const clock = window.setInterval(() => setClockNow(new Date()), 30_000);
    return () => window.clearInterval(clock);
  }, []);

  useEffect(() => {
    void load();
    const refresh = () => void load();
    window.addEventListener('atoumweb:changed', refresh);
    window.addEventListener('atoumweb:time-changed', refresh);
    window.addEventListener('atoumweb:intervention-updated', refresh);
    return () => {
      window.removeEventListener('atoumweb:changed', refresh);
      window.removeEventListener('atoumweb:time-changed', refresh);
      window.removeEventListener('atoumweb:intervention-updated', refresh);
    };
  }, []);

  const todayEntries = useMemo(() => data?.entries.filter((entry) => entry.group === 'Aujourd’hui') ?? [], [data]);
  const activeProspects = useMemo(() => data?.prospects.filter((item) => !item.archivedAt && !item.clientAccountId && !['won', 'lost'].includes(item.stage ?? 'new')) ?? [], [data]);
  const pipelineProspects = useMemo(() => activeProspects.filter((item) => (item.stage ?? 'new') !== 'new'), [activeProspects]);
  const dueFollowUps = useMemo(() => {
    const nowTimestamp = Date.now();
    const endOfToday = new Date();
    endOfToday.setHours(24, 0, 0, 0);
    const due = new Set<string>();
    const overdue = new Set<string>();
    for (const action of data?.actions ?? []) {
      if (action.ownerType !== 'prospect' || action.type !== 'follow_up' || action.status !== 'open' || !action.dueAt) continue;
      const timestamp = new Date(action.dueAt).getTime();
      if (!Number.isFinite(timestamp) || timestamp >= endOfToday.getTime()) continue;
      due.add(action.ownerId);
      if (timestamp < nowTimestamp) overdue.add(action.ownerId);
    }
    return { due, overdue };
  }, [data?.actions]);
  const relaunchCount = pipelineProspects.filter((item) => dueFollowUps.due.has(item.id)).length;
  const overdueRelaunchCount = pipelineProspects.filter((item) => dueFollowUps.overdue.has(item.id)).length;
  const quotePrepareCount = activeProspects.filter((item) => ['quote_to_prepare', 'quote_to_send'].includes(item.stage ?? 'new')).length;
  const projectsToStart = data?.projects.filter((item) => item.status === 'to_prepare').length ?? 0;
  const interventionsInProgress = data?.interventions.filter((item) => item.status === 'in_progress').length ?? 0;

  const pipeline: PipelineItem[] = [
    { key: 'qualify', label: 'À qualifier', count: pipelineProspects.filter((item) => item.stage === 'qualifying').length, tone: 'blue' },
    { key: 'needs', label: 'Identifier les besoins', count: pipelineProspects.filter((item) => item.stage === 'need_identified').length, tone: 'purple' },
    { key: 'quote', label: 'Préparer le devis Abby', count: pipelineProspects.filter((item) => ['quote_to_prepare', 'quote_to_send'].includes(item.stage ?? 'new')).length, tone: 'yellow' },
    { key: 'reply', label: 'Attente du retour', count: pipelineProspects.filter((item) => ['quote_sent', 'follow_up', 'waiting'].includes(item.stage ?? 'new')).length, tone: 'orange' },
    { key: 'negotiation', label: 'Négociation', count: pipelineProspects.filter((item) => item.stage === 'negotiation').length, tone: 'green' },
  ];

  const pipelineTotal = pipeline.reduce((sum, item) => sum + item.count, 0);
  const time = data?.time ?? EMPTY_TIME;
  const billableRatio = time.totalSeconds > 0 ? Math.min(1, time.billableSeconds / time.totalSeconds) : 0;
  const donutStyle = { '--home-time-progress': `${Math.round(billableRatio * 360)}deg` } as CSSProperties;
  const readyBilling = data?.billing.filter((item) => item.status === 'ready') ?? [];
  const readyAmount = readyBilling.reduce((sum, item) => sum + item.expectedAmountCents, 0);
  const alerts = data?.alerts.alerts ?? [];
  const greeting = clockNow.getHours() < 18 ? 'Bonjour !' : 'Bonsoir !';
  const dateLabel = clockNow.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });


  if (loading && !data) {
    return <section className="home-dashboard home-dashboard-loading"><div className="home-loading-card"><span className="eyebrow">Accueil</span><strong>Chargement du tableau de bord…</strong></div></section>;
  }

  if (loadError && !data) {
    return <section className="home-dashboard"><div className="panel home-load-error"><span className="eyebrow">Accueil</span><h2>Chargement impossible</h2><p>{loadError}</p><button className="secondary-button" type="button" onClick={() => void load()}>Réessayer</button></div></section>;
  }

  return <section className="home-dashboard">
    <header className="home-heading">
      <div><h1>Accueil</h1><p>Vue rapide de l’activité AtoumWeb</p></div>
      <div className="home-greeting"><div><strong>{greeting}</strong><span>{dateLabel}</span></div></div>
    </header>

    <div className="home-kpi-grid">
      <HomeKpi icon="user" tone="red" label="Prospects à relancer" value={relaunchCount} helper={overdueRelaunchCount ? `${overdueRelaunchCount} en retard · à traiter dans le pipeline` : 'À traiter aujourd’hui dans le pipeline'} onClick={() => openProspectPipeline('relaunch')} />
      <HomeKpi icon="file-text" tone="blue" label="Devis à préparer" value={quotePrepareCount} helper="Dossiers prêts à chiffrer" onClick={() => openPage('Devis')} />
      <HomeKpi icon="folder" tone="green" label="Projets à démarrer" value={projectsToStart} helper="Projets encore à préparer" onClick={() => openPage('Projets')} />
      <HomeKpi icon="wrench" tone="orange" label="Interventions en cours" value={interventionsInProgress} helper="Travail actuellement ouvert" onClick={() => openPage('Interventions & Maintenance')} />
    </div>

    <div className="home-main-grid">
      <article className="home-card home-today-card">
        <div className="home-card-title"><div><OperationIcon name="calendar" size={20} /><strong>Aujourd’hui</strong><span>{todayEntries.length}</span></div><button type="button" onClick={() => openPage('Prospects')} aria-label="Ouvrir les actions">›</button></div>
        <div className="home-today-scroll">
          {todayEntries.map((entry, index) => <button className="home-today-item" type="button" key={`${entry.target.entityType}-${entry.target.entityId}-${index}`} onClick={() => openEntity(entry.target)}>
            <span className="home-today-dot" />
            <span className="home-today-icon"><OperationIcon name={targetIcon(entry.target)} size={17} /></span>
            <span className="home-today-copy"><strong>{entry.target.title}</strong><small>{entry.target.subtitle || entry.target.status || 'Action du jour'}</small></span>
            <span className="home-today-open">›</span>
          </button>)}
          {todayEntries.length === 0 && <div className="home-empty-state"><OperationIcon name="check-circle" size={30} /><strong>Rien d’urgent aujourd’hui</strong><span>Le planning du jour est à jour.</span></div>}
        </div>
      </article>

      <article className="home-card home-pipeline-card">
        <div className="home-card-title"><div><OperationIcon name="chart" size={20} /><strong>Pipeline commercial</strong></div><button type="button" onClick={() => openProspectPipeline()} aria-label="Ouvrir le pipeline commercial">›</button></div>
        <div className="home-pipeline-items">
          {pipeline.map((item) => <button type="button" key={item.key} className={`home-pipeline-item tone-${item.tone}`} onClick={() => openProspectPipeline()}>
            <strong>{item.count}</strong><span>{item.label}</span>
          </button>)}
        </div>
        <div className="home-pipeline-bar" aria-label="Répartition du pipeline">
          {pipeline.map((item) => <span key={item.key} className={`tone-${item.tone}`} style={{ flexGrow: Math.max(item.count, .3) }} />)}
        </div>
        <div className="home-pipeline-footer"><span>{pipelineTotal} prospect{pipelineTotal > 1 ? 's' : ''} dans le pipeline</span></div>
      </article>

      <article className="home-card home-time-card">
        <div className="home-card-title"><div><OperationIcon name="clock" size={20} /><strong>Temps & facturation</strong></div><button type="button" onClick={() => openPage('Gestion des temps')} aria-label="Ouvrir la gestion des temps">›</button></div>
        <div className="home-time-body">
          <button type="button" className="home-time-donut" style={donutStyle} onClick={() => openPage('Gestion des temps')}><span><strong>{hours(time.totalSeconds)}</strong><small>ce mois-ci</small></span></button>
          <div className="home-time-legend">
            <span><i className="billable" /><small>Facturable</small><strong>{hours(time.billableSeconds)}</strong></span>
            <span><i /><small>Non facturable</small><strong>{hours(time.nonBillableSeconds)}</strong></span>
          </div>
        </div>
        <button className="home-billing-row" type="button" onClick={() => openPage('Facturation')}><OperationIcon name="receipt" size={20} /><span><small>À facturer</small><strong>{money(readyAmount)}</strong></span><em>{readyBilling.length} élément{readyBilling.length > 1 ? 's' : ''}</em><b>›</b></button>
      </article>
    </div>

    <div className="home-bottom-grid">
      <article className={`home-card home-watch-card ${alerts.length ? 'has-alerts' : 'is-clear'}`}>
        <div className="home-watch-copy">
          <span className="home-watch-icon"><OperationIcon name={alerts.length ? 'alert' : 'check-circle'} size={25} /></span>
          <div><span className="eyebrow">À surveiller</span><strong>{alerts.length ? `${alerts.length} point${alerts.length > 1 ? 's' : ''} à traiter` : 'Tout est à jour'}</strong><small>{alerts[0]?.title || 'Aucun incident critique ni alerte opérationnelle.'}</small></div>
        </div>
        {alerts.length > 0 && <button className="home-watch-action" type="button" onClick={() => {
          const target = alertTarget(alerts[0]);
          if (target) openEntity(target); else openPage('Interventions & Maintenance');
        }}>Voir ›</button>}
        <div className="home-watch-sparkline" aria-hidden="true"><span /><span /><span /><span /><span /><i /></div>
      </article>

      <article className="home-card home-actions-card">
        <div className="home-card-title"><div><OperationIcon name="bolt" size={20} /><strong>Actions rapides</strong></div></div>
        <div className="home-quick-actions">
          <button className="quick-prospect" type="button" onClick={() => openPage('Prospects')}><OperationIcon name="user" size={19} />+ Prospect</button>
          <button className="quick-quote" type="button" onClick={() => openPage('Devis')}><OperationIcon name="file-text" size={19} />+ Devis</button>
          <button className="quick-project" type="button" onClick={() => openPage('Projets')}><OperationIcon name="folder" size={19} />+ Projet</button>
          <button className="quick-request" type="button" onClick={() => openPage('Interventions & Maintenance')}><OperationIcon name="wrench" size={19} />+ Demande</button>
        </div>
      </article>
    </div>
  </section>;
}

function HomeKpi({ icon, tone, label, value, helper, onClick }: { icon: OperationIconName; tone: string; label: string; value: number; helper: string; onClick: () => void }) {
  return <button type="button" className={`home-kpi-card tone-${tone}`} onClick={onClick} title={`${label} : ${value}. ${helper}`}>
    <span className="home-kpi-icon"><OperationIcon name={icon} size={28} /></span>
    <span className="home-kpi-copy"><strong title={label}>{label}</strong><b>{value}</b><small title={helper}>{helper}</small></span>
    <span className="home-kpi-open">›</span>
  </button>;
}
