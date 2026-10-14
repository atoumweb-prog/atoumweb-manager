
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { BillingItem } from '../../shared/billing';
import type { QuoteSummary } from '../../shared/commercial';
import type { ClientSummary, ProspectSummary } from '../../shared/crm';
import type { Expense } from '../../shared/expenses';
import type { Intervention } from '../../shared/operations';
import type { ProjectSummary } from '../../shared/projects';
import {
  inStatisticsRange,
  isStatisticsPipelineProspect,
  sortStatisticsClients,
  type StatisticsClientSortColumn,
  statisticsQuoteAcceptancePercent,
  statisticsSelectionRanges,
  statisticsDelta,
  statisticsPeriodRange,
  type StatisticsPeriodSelection,
  type StatisticsRange,
} from '../../shared/statistics';
import { validateAnalyticsCustomPeriod, type AnalyticsPeriodPreset } from '../../shared/analytics';
import { TIME_CATEGORIES, type TimeCategory, type TimeSession } from '../../shared/time';
import { buildStatisticsEvidence, statisticsEvidenceTotal, type StatisticsEvidenceKey, type StatisticsEvidenceRow } from '../../shared/statisticsEvidence';
import { OperationIcon, type OperationIconName } from '../operations/OperationIcon';
import { StatisticsPage as Phase7StatisticsPage } from '../analytics/StatisticsPage';
import './StatisticsPage.css';

type StatisticsTab = 'overview' | 'commercial' | 'production' | 'clients' | 'analytics';

interface StatisticsData {
  prospects: ProspectSummary[];
  clients: ClientSummary[];
  quotes: QuoteSummary[];
  projects: ProjectSummary[];
  sessions: TimeSession[];
  billing: BillingItem[];
  expenses: Expense[];
  interventions: Intervention[];
}

const CATEGORY_LABELS: Record<TimeCategory, string> = {
  production: 'Production',
  development: 'Développement',
  design: 'Design',
  meeting: 'Réunion',
  support: 'Support',
  client_correction: 'Correction client',
  internal_correction: 'Correction interne',
  research_training: 'Recherche / formation',
  administrative: 'Administratif',
  other: 'Autre',
};

const SOURCE_LABELS: Record<string, string> = {
  website: 'Site web',
  referral: 'Recommandation',
  google: 'Google',
  social: 'Réseaux sociaux',
  event: 'Événement',
  outbound: 'Prospection',
  former_client: 'Ancien client',
  other: 'Autre',
};

const PIPELINE = [
  { stages: ['qualifying', 'need_identified'], label: 'À qualifier', tone: 'purple' },
  { stages: ['quote_to_prepare', 'quote_to_send', 'quote_sent'], label: 'Devis', tone: 'green' },
  { stages: ['follow_up', 'waiting'], label: 'À relancer', tone: 'yellow' },
  { stages: ['negotiation'], label: 'Négociation', tone: 'orange' },
];

const PROJECT_STATUS_LABELS: Record<string, string> = {
  to_prepare: 'À préparer',
  in_progress: 'En cours',
  waiting_client: 'Attente client',
  blocked: 'Bloqués',
  to_validate: 'À valider',
  completed: 'Terminés',
};

function money(cents: number): string {
  return (cents / 100).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €';
}

function hours(seconds: number): string {
  const value = seconds / 3600;
  return value.toLocaleString('fr-FR', { maximumFractionDigits: value < 10 ? 1 : 0 }) + ' h';
}

function pct(value: number | null): string {
  return value === null ? '—' : value.toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' %';
}

function sum<T>(items: T[], selector: (item: T) => number): number {
  return items.reduce((total, item) => total + selector(item), 0);
}

function ranged<T>(items: T[], range: StatisticsRange, selector: (item: T) => string | null | undefined): T[] {
  return items.filter((item) => inStatisticsRange(selector(item), range));
}

function ratio(part: number, total: number): number {
  return total > 0 ? (part / total) * 100 : 0;
}

function compare(current: number, previous: number) {
  if (current === 0 && previous === 0) return { text: 'Aucune donnée sur les deux périodes', direction: 'same' as const };
  const delta = statisticsDelta(current, previous);
  if (delta === null) return { text: 'Nouveau sur la période', direction: 'new' as const };
  if (Math.abs(delta) < .05) return { text: 'Stable vs période précédente', direction: 'same' as const };
  return {
    text: (delta > 0 ? '+' : '') + delta.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' % vs période précédente',
    direction: delta > 0 ? 'up' as const : 'down' as const,
  };
}

function countLabel(value: number, singular: string, plural: string): string {
  return value + ' ' + (value === 1 ? singular : plural);
}

function openPage(page: string): void {
  window.dispatchEvent(new CustomEvent('atoumweb:open-page', { detail: page }));
}

export function StatisticsPage({ onMessage }: { onMessage: (message: string) => void }) {
  const [data, setData] = useState<StatisticsData | null>(null);
  const requestVersion = useRef(0);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<StatisticsPeriodSelection>({ preset: 'month' });
  const [customDates, setCustomDates] = useState({ from: '', to: '' });
  const [tab, setTab] = useState<StatisticsTab>('overview');
  const [clientSort, setClientSort] = useState<StatisticsClientSortColumn>('invoiced');
  const [expandedKpi, setExpandedKpi] = useState<StatisticsEvidenceKey | null>(null);

  async function load(): Promise<void> {
    const request = ++requestVersion.current;
    setLoading(true);
    try {
      const [prospects, clients, quotes, projects, sessions, billing, expenses, interventions] = await Promise.all([
        window.atoumweb.crm.prospects.list({ includeArchived: true }),
        window.atoumweb.crm.clients.list({ includeArchived: true }),
        window.atoumweb.quotes.list(),
        window.atoumweb.projects.projects.list(),
        window.atoumweb.time.list(),
        window.atoumweb.billing.list(),
        window.atoumweb.expenses.list(),
        window.atoumweb.operations.interventions.list({ includeArchived: true }),
      ]);
      if (request !== requestVersion.current) return;
      setData({ prospects, clients, quotes, projects, sessions, billing, expenses, interventions });
    } catch (error) {
      if (request === requestVersion.current) onMessage(error instanceof Error ? error.message : 'Impossible de charger les statistiques.');
    } finally {
      if (request === requestVersion.current) setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const refresh = () => void load();
    window.addEventListener('atoumweb:changed', refresh);
    window.addEventListener('atoumweb:time-changed', refresh);
    window.addEventListener('atoumweb:intervention-updated', refresh);
    return () => {
      requestVersion.current += 1;
      window.removeEventListener('atoumweb:changed', refresh);
      window.removeEventListener('atoumweb:time-changed', refresh);
      window.removeEventListener('atoumweb:intervention-updated', refresh);
    };
  }, []);

  const invalidCustomPeriod = period.preset === 'custom'
    ? (!period.from || !period.to ? 'Renseigne les deux dates pour afficher les statistiques.' : validateAnalyticsCustomPeriod(period))
    : null;
  const selectedRanges = useMemo(() => statisticsSelectionRanges(period), [period]);
  const range = selectedRanges?.current ?? statisticsPeriodRange('all');
  const previousRange = selectedRanges?.previous ?? null;


  if (loading && !data) {
    return <div className="panel statistics-loading"><OperationIcon name="chart" size={30} /><strong>Calcul des statistiques…</strong><span>Les indicateurs sont dérivés des données métier.</span></div>;
  }
  if (!data) {
    return <div className="panel statistics-loading"><OperationIcon name="alert" size={30} /><strong>Statistiques indisponibles</strong><button className="secondary-button" type="button" onClick={() => void load()}>Réessayer</button></div>;
  }

  const newProspects = ranged(data.prospects, range, (item) => item.createdAt);
  const previousProspects = previousRange ? ranged(data.prospects, previousRange, (item) => item.createdAt) : [];
  const won = ranged(data.prospects.filter((item) => item.stage === 'won'), range, (item) => item.wonAt);
  const lost = ranged(data.prospects.filter((item) => item.stage === 'lost'), range, (item) => item.lostAt);

  const quotes = ranged(data.quotes, range, (item) => item.createdAt);
  const previousQuotes = previousRange ? ranged(data.quotes, previousRange, (item) => item.createdAt) : [];
  const acceptedAll = data.quotes.filter((item) => item.status === 'accepted');
  const accepted = ranged(acceptedAll, range, (item) => item.acceptedAt);
  const previousAccepted = previousRange ? ranged(acceptedAll, previousRange, (item) => item.acceptedAt) : [];
  const refused = ranged(data.quotes.filter((item) => item.status === 'refused'), range, (item) => item.refusedAt);
  const expired = ranged(data.quotes.filter((item) => item.status === 'expired'), range, (item) => item.expiredAt);

  const projectsCreated = ranged(data.projects, range, (item) => item.createdAt);
  const previousProjects = previousRange ? ranged(data.projects, previousRange, (item) => item.createdAt) : [];
  const projectsCompleted = ranged(data.projects.filter((item) => item.status === 'completed'), range, (item) => item.completedAt);
  const sessions = ranged(data.sessions, range, (item) => item.startedAt);
  const previousSessions = previousRange ? ranged(data.sessions, previousRange, (item) => item.startedAt) : [];
  const invoices = ranged(data.billing.filter((item) => item.status === 'invoiced'), range, (item) => item.invoicedAt);
  const previousInvoices = previousRange ? ranged(data.billing.filter((item) => item.status === 'invoiced'), previousRange, (item) => item.invoicedAt) : [];
  const expenses = ranged(data.expenses.filter((item) => item.status !== 'cancelled'), range, (item) => item.expenseDate);
  const newClients = ranged(data.clients.filter((item) => item.status !== 'archived'), range, (item) => item.becameClientAt);
  const previousClients = previousRange ? ranged(data.clients.filter((item) => item.status !== 'archived'), previousRange, (item) => item.becameClientAt) : [];
  const interventionsCompleted = ranged(data.interventions.filter((item) => item.status === 'completed'), range, (item) => item.completedAt);

  const signed = sum(accepted, (item) => item.contractValueCents);
  const previousSigned = sum(previousAccepted, (item) => item.contractValueCents);
  const invoiced = sum(invoices, (item) => item.expectedAmountCents);
  const previousInvoiced = sum(previousInvoices, (item) => item.expectedAmountCents);
  const spent = sum(expenses, (item) => item.amountCents);
  const seconds = sum(sessions, (item) => item.durationSeconds);
  const previousSeconds = sum(previousSessions, (item) => item.durationSeconds);
  const billableSeconds = sum(sessions.filter((item) => item.billable), (item) => item.durationSeconds);
  const nonBillableSeconds = seconds - billableSeconds;
  const readyBilling = data.billing.filter((item) => item.status === 'ready' || item.status === 'planned');
  const readyAmount = sum(readyBilling, (item) => item.expectedAmountCents);

  const activeProspects = data.prospects.filter((item) => isStatisticsPipelineProspect(item.stage, item.archivedAt));
  const activeProjects = data.projects.filter((item) => ['to_prepare', 'in_progress', 'waiting_client', 'blocked', 'to_validate'].includes(item.status));
  const activeInterventions = data.interventions.filter((item) => ['planned', 'in_progress', 'waiting_client', 'blocked', 'to_validate'].includes(item.status));
  const acceptanceRate = statisticsQuoteAcceptancePercent(accepted.length, refused.length, expired.length);
  const conversionRate = won.length + lost.length ? ratio(won.length, won.length + lost.length) : null;
  const offeredValue = sum(accepted, (item) => Math.max(0, item.catalogValueCents - item.contractValueCents));

  const pipelineRows = PIPELINE.map((entry) => ({
    ...entry,
    count: activeProspects.filter((prospect) => entry.stages.includes(prospect.stage || 'new')).length,
  }));

  const sources = Object.entries(newProspects.reduce<Record<string, number>>((result, prospect) => {
    const key = prospect.source || 'other';
    result[key] = (result[key] || 0) + 1;
    return result;
  }, {})).map(([key, count]) => ({ label: SOURCE_LABELS[key] || key, count })).sort((a, b) => b.count - a.count);

  const categories = TIME_CATEGORIES.map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    seconds: sum(sessions.filter((item) => item.category === category), (item) => item.durationSeconds),
  })).filter((item) => item.seconds > 0).sort((a, b) => b.seconds - a.seconds);

  const projectStatuses = Object.entries(PROJECT_STATUS_LABELS).map(([status, label]) => ({
    status,
    label,
    count: data.projects.filter((project) => project.status === status).length,
  })).filter((item) => item.count > 0);

  const completedIds = new Set(projectsCompleted.map((item) => item.id));
  const completedRealSeconds = sum(data.sessions.filter((item) => item.projectId && completedIds.has(item.projectId)), (item) => item.durationSeconds);
  const completedEstimatedSeconds = sum(projectsCompleted, (item) => item.estimatedMinutes * 60);

  const clientRows = data.clients.filter((item) => item.status !== 'archived').map((client) => ({
    id: client.id,
    label: client.displayName,
    seconds: sum(sessions.filter((item) => item.clientAccountId === client.id), (item) => item.durationSeconds),
    invoiced: sum(invoices.filter((item) => item.clientAccountId === client.id), (item) => item.expectedAmountCents),
    ready: sum(readyBilling.filter((item) => item.clientAccountId === client.id), (item) => item.expectedAmountCents),
    projects: activeProjects.filter((item) => item.clientAccountId === client.id).length,
    interventions: data.interventions.filter((item) => item.clientAccountId === client.id && !['archived', 'cancelled'].includes(item.status)).length,
  })).filter((item) => item.seconds || item.invoiced || item.ready || item.projects || item.interventions);
  const rankedClientRows = sortStatisticsClients(clientRows, clientSort).slice(0, 8);

  const evidence = buildStatisticsEvidence({
    acceptedQuotes: accepted,
    invoices,
    sessions,
    newClients,
  });
  const selectedEvidence = expandedKpi ? evidence[expandedKpi] : null;

  const financial = [
    { label: 'Contractuel signé', value: signed, display: money(signed), tone: 'blue' },
    { label: 'Facturé (PDF Abby)', value: invoiced, display: money(invoiced), tone: 'green' },
    { label: 'À facturer actuellement', value: readyAmount, display: money(readyAmount), tone: 'gold' },
    { label: 'Dépenses', value: spent, display: money(spent), tone: 'red' },
  ];
  const maxFinancial = Math.max(1, ...financial.map((item) => item.value));
  const hasRecordedTime = seconds > 0;
  const billableRatio = hasRecordedTime ? ratio(billableSeconds, seconds) : 0;
  const comparison = (current: number, previous: number) => previousRange ? compare(current, previous) : undefined;
  const donutStyle = { '--statistics-donut-angle': Math.round((billableRatio / 100) * 360) + 'deg' } as CSSProperties;

  return <section className="statistics-page">
    <div className="statistics-toolbar">
      <div className="statistics-tabs">
        <Tab active={tab === 'overview'} icon="chart" label="Vue d’ensemble" onClick={() => setTab('overview')} />
        <Tab active={tab === 'commercial'} icon="user" label="Commercial" onClick={() => setTab('commercial')} />
        <Tab active={tab === 'production'} icon="folder" label="Projets & temps" onClick={() => setTab('production')} />
        <Tab active={tab === 'clients'} icon="wallet" label="Clients" onClick={() => setTab('clients')} />
        <Tab active={tab === 'analytics'} icon="chart" label="Analyse financière & rendement" onClick={() => setTab('analytics')} />
      </div>
      <div className="statistics-period">
        <span>{invalidCustomPeriod ? 'Dates à compléter' : range.label}</span>
        <label>Période
          <select aria-label="Période statistique commune" value={period.preset} onChange={(event) => {
            const value = event.target.value;
            if (value === 'all') setPeriod({ preset: 'all' });
            else if (value === 'custom') setPeriod({ preset: 'custom', ...customDates });
            else setPeriod({ preset: value as AnalyticsPeriodPreset });
          }}>
            <option value="today">Aujourd’hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="quarter">Ce trimestre</option>
            <option value="year">Cette année</option>
            <option value="previous_year">Année précédente</option>
            <option value="custom">Dates personnalisées</option>
            <option value="all">Toutes les données</option>
          </select>
        </label>
        {period.preset === 'custom' && <div className="statistics-custom-dates">
          <label>Du<input type="date" value={period.from ?? ''} onChange={(event) => {
            const from = event.target.value;
            setCustomDates((current) => ({ ...current, from }));
            setPeriod((current) => current.preset === 'custom' ? { ...current, from } : current);
          }} /></label>
          <label>Au<input type="date" value={period.to ?? ''} onChange={(event) => {
            const to = event.target.value;
            setCustomDates((current) => ({ ...current, to }));
            setPeriod((current) => current.preset === 'custom' ? { ...current, to } : current);
          }} /></label>
        </div>}
        <button className="secondary-button" type="button" onClick={() => void load()}><OperationIcon name="refresh" size={16} /> Actualiser</button>
      </div>
    </div>

    {invalidCustomPeriod && <p role="alert" className="statistics-period-warning">{invalidCustomPeriod} Aucun chiffre d'une autre période n'est présenté.</p>}
    {!invalidCustomPeriod && tab === 'analytics' && period.preset === 'all' && <p role="status" className="statistics-period-warning">La vue analytique nécessite des dates définies pour calculer les comparaisons. Les autres onglets affichent bien toutes les données ; choisis une période datée pour ouvrir les analyses détaillées.</p>}
    {!invalidCustomPeriod && tab === 'analytics' && period.preset !== 'all' && <Phase7StatisticsPage onMessage={onMessage} externalPeriod={period} hidePeriodControls />}

    {!invalidCustomPeriod && tab === 'overview' && <>
      <div className="statistics-kpis">
        <Kpi icon="wallet" label="Contractuel signé" value={money(signed)} comparison={comparison(signed, previousSigned)}
          expanded={expandedKpi === 'signed'} onInspect={() => setExpandedKpi((value) => value === 'signed' ? null : 'signed')} />
        <Kpi icon="receipt" label="Facturé suivi" value={money(invoiced)} comparison={comparison(invoiced, previousInvoiced)}
          expanded={expandedKpi === 'invoiced'} onInspect={() => setExpandedKpi((value) => value === 'invoiced' ? null : 'invoiced')} />
        <Kpi icon="clock" label="Temps travaillé" value={hours(seconds)} comparison={comparison(seconds, previousSeconds)}
          expanded={expandedKpi === 'time'} onInspect={() => setExpandedKpi((value) => value === 'time' ? null : 'time')} />
        <Kpi icon="user" label="Nouveaux clients" value={String(newClients.length)} comparison={comparison(newClients.length, previousClients.length)}
          expanded={expandedKpi === 'clients'} onInspect={() => setExpandedKpi((value) => value === 'clients' ? null : 'clients')} />
      </div>
      {expandedKpi && selectedEvidence && <StatisticsEvidencePanel kind={expandedKpi} rows={selectedEvidence} />}
      <div className="statistics-main-grid">
        <article className="panel statistics-card">
          <CardTitle eyebrow="Finances" title="Repères de la période" action="Voir facturation →" onClick={() => openPage('Facturation')} />
          <div className="statistics-bars">{financial.map((item) => <Bar key={item.label} {...item} max={maxFinancial} />)}</div>
          <p className="statistics-note">« Facturé » correspond aux factures PDF Abby suivies dans le Manager. Les encaissements bancaires ne sont pas encore suivis.</p>
        </article>
        <article className="panel statistics-card">
          <CardTitle eyebrow="Temps" title="Répartition facturable" action="Voir les temps →" onClick={() => openPage('Gestion des temps')} />
          <p className="statistics-note">Temps net regroupé par date de début de session : une session traversant deux périodes n’est pas divisée. Temps facturable ne signifie pas temps facturé.</p>
           <div className="statistics-time">
            <div className={'statistics-donut' + (hasRecordedTime ? '' : ' no-data')} style={donutStyle}><span><strong>{hasRecordedTime ? pct(billableRatio) : '0 h'}</strong><small>{hasRecordedTime ? 'facturable' : 'aucun temps'}</small></span></div>
            <div className="statistics-legend">
              <div><i className="billable" /><span>Facturable</span><strong>{hours(billableSeconds)}</strong></div>
              <div><i /><span>Non facturable</span><strong>{hours(nonBillableSeconds)}</strong></div>
              <div><OperationIcon name="piggy-broken" size={20} /><span>Dépenses</span><strong>{money(spent)}</strong></div>
            </div>
          </div>
        </article>
      </div>
      <div className="statistics-snapshots">
        <Snapshot icon="user" label="Prospects actifs" value={activeProspects.length} helper={countLabel(newProspects.length, 'contact créé', 'contacts créés') + ' sur la période'} onClick={() => openPage('Prospects')} />
        <Snapshot icon="folder" label="Projets actifs" value={activeProjects.length} helper={countLabel(projectsCompleted.length, 'projet terminé', 'projets terminés') + ' sur la période'} onClick={() => openPage('Projets')} />
        <Snapshot icon="wrench" label="Interventions actives" value={activeInterventions.length} helper={countLabel(interventionsCompleted.length, 'intervention terminée', 'interventions terminées') + ' sur la période'} onClick={() => openPage('Interventions & Maintenance')} />
        <Snapshot icon="euro" label="À facturer" value={readyBilling.length} helper={money(readyAmount) + ' à préparer'} onClick={() => openPage('Facturation')} />
      </div>
    </>}

    {!invalidCustomPeriod && tab === 'commercial' && <>
      <div className="statistics-kpis">
        <Kpi icon="user" label="Contacts créés" value={String(newProspects.length)} comparison={comparison(newProspects.length, previousProspects.length)} />
        <Kpi icon="file-text" label="Devis créés" value={String(quotes.length)} comparison={comparison(quotes.length, previousQuotes.length)} />
        <Kpi icon="check-circle" label="Taux d’acceptation" value={pct(acceptanceRate)} helper={countLabel(accepted.length, 'devis accepté', 'devis acceptés') + ' · ' + countLabel(refused.length, 'devis refusé', 'devis refusés') + ' · ' + countLabel(expired.length, 'devis expiré', 'devis expirés')} />
        <Kpi icon="chart" label="Conversion prospects" value={pct(conversionRate)} helper={countLabel(won.length, 'prospect gagné', 'prospects gagnés') + ' · ' + countLabel(lost.length, 'prospect perdu', 'prospects perdus')} />
      </div>
      <div className="statistics-main-grid">
        <article className="panel statistics-card">
          <CardTitle eyebrow="Pipeline actuel" title="Répartition commerciale" action="Ouvrir le pipeline →" onClick={() => window.dispatchEvent(new CustomEvent('atoumweb:open-prospects-view', { detail: 'pipeline' }))} />
          <div className="statistics-pipeline">{pipelineRows.map((item) => <div key={item.label} className={'tone-' + item.tone}><strong>{item.count}</strong><span>{item.label}</span></div>)}</div>
          <div className="statistics-mini"><span><strong>{activeProspects.length}</strong> prospects actifs (hors Annuaire)</span><span><strong>{money(signed)}</strong> signé</span><span><strong>{money(offeredValue)}</strong> écart catalogue / signé</span></div>
        </article>
        <article className="panel statistics-card">
          <CardTitle eyebrow="Origines" title="Contacts créés sur la période" />
          {sources.length ? <div className="statistics-ranking">{sources.slice(0, 7).map((item, index) => <div key={item.label}><span className="rank">{index + 1}</span><span>{item.label}</span><strong>{item.count}</strong><i style={{ width: ratio(item.count, Math.max(1, newProspects.length)) + '%' }} /></div>)}</div> : <Empty label="Aucun nouveau contact créé sur cette période." />}
        </article>
      </div>
    </>}

    {!invalidCustomPeriod && tab === 'production' && <>
      <div className="statistics-kpis">
        <Kpi icon="folder" label="Projets créés" value={String(projectsCreated.length)} comparison={comparison(projectsCreated.length, previousProjects.length)} />
        <Kpi icon="check-circle" label="Projets terminés" value={String(projectsCompleted.length)} helper={countLabel(activeProjects.length, 'projet actif', 'projets actifs')} />
        <Kpi icon="clock" label="Temps travaillé" value={hours(seconds)} comparison={comparison(seconds, previousSeconds)} />
        <Kpi icon="wrench" label="Interventions terminées" value={String(interventionsCompleted.length)} helper={countLabel(activeInterventions.length, 'intervention active', 'interventions actives')} />
      </div>
      <div className="statistics-main-grid">
        <article className="panel statistics-card">
          <CardTitle eyebrow="Temps" title="Répartition par activité" />
          {categories.length ? <div className="statistics-bars">{categories.slice(0, 7).map((item) => <Bar key={item.category} label={item.label} value={item.seconds} display={hours(item.seconds)} max={Math.max(1, categories[0].seconds)} tone="blue" />)}</div> : <Empty label="Aucun temps enregistré sur cette période." />}
        </article>
        <article className="panel statistics-card">
          <CardTitle eyebrow="Production" title="État des projets" />
          {projectStatuses.length ? <div className="statistics-statuses">{projectStatuses.map((item) => <div key={item.status}><strong>{item.count}</strong><span>{item.label}</span></div>)}</div> : <Empty label="Aucun projet." />}
          <div className="statistics-estimate"><span>Projets terminés · estimé vs réel</span><strong>{projectsCompleted.length ? hours(completedEstimatedSeconds) + ' estimées · ' + hours(completedRealSeconds) + ' réelles' : 'Aucun projet terminé'}</strong><small>{projectsCompleted.length ? 'Échantillon : n = ' + projectsCompleted.length : 'La comparaison apparaîtra dès qu’un projet sera terminé.'}</small></div>
        </article>
      </div>
    </>}

    {!invalidCustomPeriod && tab === 'clients' && <>
      <div className="statistics-kpis">
        <Kpi icon="user" label="Clients actifs" value={String(data.clients.filter((item) => item.status === 'active').length)} helper={countLabel(newClients.length, 'nouveau client', 'nouveaux clients') + ' sur la période'} />
        <Kpi icon="receipt" label="Facturé période" value={money(invoiced)} comparison={comparison(invoiced, previousInvoiced)} />
        <Kpi icon="clock" label="Temps client" value={hours(sum(sessions.filter((item) => item.clientAccountId), (item) => item.durationSeconds))} helper="Sessions rattachées aux clients, regroupées par date de début" />
        <Kpi icon="euro" label="À facturer" value={money(readyAmount)} helper={countLabel(readyBilling.length, 'élément', 'éléments') + ' actuellement'} />
      </div>
      <article className="panel statistics-card statistics-client-card">
        <CardTitle eyebrow="Clients" title="Activité client · classement par unité" />
        {rankedClientRows.length ? <div className="statistics-table-wrap"><table className="statistics-table"><thead><tr><th>Client</th><th aria-sort={clientSort === 'seconds' ? 'descending' : 'none'}><button type="button" className="link-button" onClick={() => setClientSort('seconds')}>Temps {clientSort === 'seconds' ? '↓' : '↕'}</button></th><th aria-sort={clientSort === 'invoiced' ? 'descending' : 'none'}><button type="button" className="link-button" onClick={() => setClientSort('invoiced')}>Facturé suivi {clientSort === 'invoiced' ? '↓' : '↕'}</button></th><th>À facturer</th><th>Projets actifs</th><th>Interventions</th></tr></thead><tbody>{rankedClientRows.map((row) => <tr key={row.id}><td><button className="link-button" type="button" onClick={() => window.dispatchEvent(new CustomEvent('atoumweb:navigate', { detail: { entityType: 'client', entityId: row.id, title: row.label } }))}>{row.label}</button></td><td>{hours(row.seconds)}</td><td>{money(row.invoiced)}</td><td>{money(row.ready)}</td><td>{row.projects}</td><td>{row.interventions}</td></tr>)}</tbody></table></div> : <Empty label="Aucune activité client sur cette période." />}
      </article>
    </>}
  </section>;
}

function Tab({ active, icon, label, onClick }: { active: boolean; icon: OperationIconName; label: string; onClick: () => void }) {
  return <button className={active ? 'active' : ''} type="button" onClick={onClick}><OperationIcon name={icon} size={17} />{label}</button>;
}

function Kpi({ icon, label, value, comparison, helper, onInspect, expanded }: {
  icon: OperationIconName; label: string; value: string;
  comparison?: ReturnType<typeof compare>; helper?: string; onInspect?: () => void; expanded?: boolean;
}) {
  return <article className="statistics-kpi"><span><OperationIcon name={icon} size={28} /></span><div><strong>{label}</strong><b>{value}</b>{comparison ? <small className={'trend-' + comparison.direction}>{comparison.text}</small> : <small>{helper}</small>}
    {onInspect && <button className="link-button statistics-kpi-inspect" type="button" aria-expanded={!!expanded} aria-controls="statistics-evidence-panel" onClick={onInspect}>{expanded ? 'Masquer les éléments' : 'Voir les éléments exacts'}</button>}
  </div></article>;
}

function StatisticsEvidencePanel({ kind, rows }: { kind: StatisticsEvidenceKey; rows: StatisticsEvidenceRow[] }) {
  const descriptions: Record<StatisticsEvidenceKey, { title: string; source: string; date: string }> = {
    signed: { title: 'Devis acceptés retenus', source: 'quotes · valeur contractuelle', date: 'Date d’acceptation' },
    invoiced: { title: 'Lignes de facturation suivies', source: 'billing_items · montant attendu facturé', date: 'Date facturée' },
    time: { title: 'Sessions de temps retenues', source: 'time_sessions · secondes suivies', date: 'Début de session' },
    clients: { title: 'Clients devenus clients', source: 'client_accounts · dates de conversion', date: 'Date de conversion' },
  };
  const description = descriptions[kind];
  const formatValue = (value: number): string => kind === 'signed' || kind === 'invoiced'
    ? (value / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
    : kind === 'time' ? value.toLocaleString('fr-FR') + ' s' : String(value);
  const dateValue = (date: string | null): string => {
    if (!date) return '—';
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString('fr-FR');
  };
  const firstRows = rows.slice(0, 100);
  return <section className="panel statistics-evidence-panel" id="statistics-evidence-panel" aria-label={description.title}>
    <div className="statistics-evidence-heading"><div><span className="eyebrow">Traçabilité</span><h3>{description.title}</h3></div>
      <strong>{rows.length} élément{rows.length > 1 ? 's' : ''} · total {formatValue(statisticsEvidenceTotal(rows))}</strong>
    </div>
    <p className="statistics-evidence-source">Source : {description.source}. Le détail reprend les mêmes éléments déjà filtrés pour le KPI, et ne prétend pas appliquer un filtre dans un autre module.</p>
    {rows.length === 0 ? <p className="muted">Aucun élément sur cette période.</p> : <div className="statistics-table-wrap"><table className="statistics-evidence-table">
      <thead><tr><th>Élément source</th><th>{description.date}</th><th>Valeur</th></tr></thead>
      <tbody>{firstRows.map((row) => <tr key={row.id}><td><strong>{row.label}</strong><small title={row.id}>{row.detail}</small></td><td>{dateValue(row.businessDate)}</td><td>{formatValue(row.value)}</td></tr>)}</tbody>
    </table></div>}
    {rows.length > 100 && <p className="statistics-evidence-source">Les 100 premiers éléments sont affichés sur {rows.length}, sans réduire le total calculé.</p>}
  </section>;
}

function Snapshot({ icon, label, value, helper, onClick }: { icon: OperationIconName; label: string; value: number; helper: string; onClick: () => void }) {
  return <button className="statistics-snapshot" type="button" onClick={onClick}><span><OperationIcon name={icon} size={21} /></span><div><strong>{label}</strong><b>{value}</b><small>{helper}</small></div><em>›</em></button>;
}

function CardTitle({ eyebrow, title, action, onClick }: { eyebrow: string; title: string; action?: string; onClick?: () => void }) {
  return <div className="statistics-card-title"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>{action && onClick && <button className="link-button" type="button" onClick={onClick}>{action}</button>}</div>;
}

function Bar({ label, value, display, max, tone }: { label: string; value: number; display: string; max: number; tone: string }) {
  const width = value <= 0 ? 0 : Math.max(3, (value / max) * 100);
  return <div className="statistics-bar"><div><span>{label}</span><strong>{display}</strong></div><div><i className={'tone-' + tone} style={{ width: width + '%' }} /></div></div>;
}

function Empty({ label }: { label: string }) {
  return <div className="statistics-empty"><OperationIcon name="chart" size={28} /><strong>{label}</strong><span>Les indicateurs se rempliront automatiquement avec les données du Manager.</span></div>;
}
