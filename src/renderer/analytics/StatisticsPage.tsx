import { useEffect, useMemo, useState } from 'react';
import type {
  AnalyticsCommercialSnapshot,
  AnalyticsFinancialMetric,
  AnalyticsFinancialMetricValue,
  AnalyticsFinancialSnapshot,
  AnalyticsProjectTimeSnapshot,
  AnalyticsPeriodInput,
  AnalyticsPeriodPreset,
} from '../../shared/analytics';

const PRESETS: Array<{ value: AnalyticsPeriodPreset; short: string }> = [
  { value: 'today', short: 'Jour' },
  { value: 'week', short: 'Semaine' },
  { value: 'month', short: 'Mois' },
  { value: 'quarter', short: 'Trimestre' },
  { value: 'year', short: 'Année' },
  { value: 'previous_year', short: 'N-1' },
  { value: 'custom', short: 'Dates' },
];

const PRIMARY_METRICS: AnalyticsFinancialMetric[] = [
  'commercial_signed',
  'contract_signed',
  'commercial_delivered',
  'gifted_value',
];

const FLOW_METRICS: AnalyticsFinancialMetric[] = [
  'invoiced_revenue',
  'cash_collected',
  'outstanding_revenue',
  'expenses',
];

const SOURCE_LABELS: Record<string, string> = {
  website: 'Site web',
  referral: 'Recommandation',
  google: 'Google',
  social: 'Réseaux sociaux',
  event: 'Événement',
  outbound: 'Prospection',
  former_client: 'Ancien client',
  other: 'Autre',
  not_set: 'Non renseigné',
};

const METRIC_META: Record<AnalyticsFinancialMetric, { icon: string; tone: string; kicker: string }> = {
  commercial_signed: { icon: '↗', tone: 'gold', kicker: 'Commercial' },
  contract_signed: { icon: '✓', tone: 'green', kicker: 'Contractuel' },
  commercial_delivered: { icon: '◆', tone: 'blue', kicker: 'Livraison' },
  invoiced_revenue: { icon: '€', tone: 'violet', kicker: 'Facturation' },
  cash_collected: { icon: '↓', tone: 'green', kicker: 'Trésorerie' },
  outstanding_revenue: { icon: '…', tone: 'orange', kicker: 'Encours' },
  expenses: { icon: '−', tone: 'rose', kicker: 'Charges' },
  gifted_value: { icon: '◇', tone: 'gold', kicker: 'Geste commercial' },
};

function money(cents: number): string {
  return (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}

function dateFr(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('fr-FR');
}

function deltaLabel(metric: AnalyticsFinancialMetricValue): string {
  if (!metric.available || metric.deltaCents == null) return '—';
  if (metric.previousCents === 0) {
    if (metric.currentCents === 0) return 'Stable';
    return `${metric.deltaCents > 0 ? '+' : ''}${money(metric.deltaCents)} · première base comparable`;
  }
  const percent = metric.deltaPercent == null ? '' : ` · ${metric.deltaPercent > 0 ? '+' : ''}${metric.deltaPercent.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`;
  return `${metric.deltaCents > 0 ? '+' : ''}${money(metric.deltaCents)}${percent}`;
}

function trend(metric: AnalyticsFinancialMetricValue): 'up' | 'down' | 'stable' | 'none' {
  if (!metric.available || metric.deltaCents == null) return 'none';
  if (metric.deltaCents > 0) return 'up';
  if (metric.deltaCents < 0) return 'down';
  return 'stable';
}

function trendArrow(metric: AnalyticsFinancialMetricValue): string {
  const state = trend(metric);
  if (state === 'up') return '↑';
  if (state === 'down') return '↓';
  if (state === 'stable') return '→';
  return '·';
}

function percent(value: number | null): string {
  return value == null ? '—' : `${value.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`;
}

function durationLabel(hours: number | null): string {
  if (hours == null) return '—';
  if (hours < 24) return `${hours.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} h`;
  const days = hours / 24;
  return `${days.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} j`;
}

function countComparison(current: number, previous: number): string {
  const delta = current - previous;
  if (delta === 0) return 'Stable';
  return `${delta > 0 ? '+' : ''}${delta} vs période précédente`;
}

function secondsLabel(seconds: number): string {
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  return `${(seconds / 3600).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} h`;
}

function hourlyMoney(cents: number | null): string {
  return cents == null ? '—' : `${money(cents)} / h`;
}

function normalizedPair(metric: AnalyticsFinancialMetricValue): { current: number; previous: number } {
  if (!metric.available || metric.currentCents == null || metric.previousCents == null) return { current: 0, previous: 0 };
  const max = Math.max(Math.abs(metric.currentCents), Math.abs(metric.previousCents), 1);
  return {
    current: metric.currentCents === 0 ? 0 : Math.max(7, Math.round((Math.abs(metric.currentCents) / max) * 100)),
    previous: metric.previousCents === 0 ? 0 : Math.max(7, Math.round((Math.abs(metric.previousCents) / max) * 100)),
  };
}

export function StatisticsPage({ onMessage }: { onMessage: (message: string) => void }) {
  const [period, setPeriod] = useState<AnalyticsPeriodInput>({ preset: 'month' });
  const [snapshot, setSnapshot] = useState<AnalyticsFinancialSnapshot | null>(null);
  const [commercial, setCommercial] = useState<AnalyticsCommercialSnapshot | null>(null);
  const [projectTime, setProjectTime] = useState<AnalyticsProjectTimeSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [commercialOpen, setCommercialOpen] = useState(false);
  const [projectTimeOpen, setProjectTimeOpen] = useState(false);
  const [primaryOpen, setPrimaryOpen] = useState(false);
  const [flowOpen, setFlowOpen] = useState(false);
  const [expandedMetricKey, setExpandedMetricKey] = useState<AnalyticsFinancialMetric | null>(null);

  const effectivePeriod = useMemo<AnalyticsPeriodInput>(() => {
    if (period.preset !== 'custom') return { preset: period.preset };
    return period;
  }, [period]);

  async function load(): Promise<void> {
    if (effectivePeriod.preset === 'custom' && (!effectivePeriod.from || !effectivePeriod.to)) return;
    setLoading(true);
    try {
      const [financialSnapshot, commercialSnapshot, projectTimeSnapshot] = await Promise.all([
        window.atoumweb.analytics.financialSnapshot(effectivePeriod),
        window.atoumweb.analytics.commercialSnapshot(effectivePeriod),
        window.atoumweb.analytics.projectTimeSnapshot(effectivePeriod),
      ]);
      setSnapshot(financialSnapshot);
      setCommercial(commercialSnapshot);
      setProjectTime(projectTimeSnapshot);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de calculer les statistiques.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [effectivePeriod.preset, effectivePeriod.from, effectivePeriod.to]);

  useEffect(() => {
    if (!expandedMetricKey) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpandedMetricKey(null);
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [expandedMetricKey]);

  const metricMap = useMemo(
    () => new Map(snapshot?.metrics.map((metric) => [metric.key, metric]) ?? []),
    [snapshot],
  );

  const primaryMetrics = PRIMARY_METRICS.map((key) => metricMap.get(key)).filter(Boolean) as AnalyticsFinancialMetricValue[];
  const flowMetrics = FLOW_METRICS.map((key) => metricMap.get(key)).filter(Boolean) as AnalyticsFinancialMetricValue[];
  const availableCount = snapshot?.metrics.filter((metric) => metric.available).length ?? 0;
  const signed = metricMap.get('contract_signed');
  const delivered = metricMap.get('commercial_delivered');
  const gifted = metricMap.get('gifted_value');
  const expandedMetric = expandedMetricKey ? metricMap.get(expandedMetricKey) ?? null : null;

  return <div className="phase7-statistics-page">
    <section className="phase7-statistics-hero compact">
      <div className="phase7-statistics-hero-copy">
        <div className="phase7-statistics-hero-mark" aria-hidden="true">AW</div>
        <div>
          <span className="eyebrow">Pilotage AtoumWeb · Phase 7A</span>
          <h2>Les chiffres qui racontent ton activité</h2>
          <p>Vue synthétique par défaut. Chaque bloc peut être déployé et chaque indicateur agrandi.</p>
        </div>
      </div>
      <div className="phase7-statistics-hero-side">
        <div className="phase7-statistics-hero-score">
          <strong>{availableCount}/{snapshot?.metrics.length ?? 8}</strong>
          <span>sources actives</span>
        </div>
        <button className="phase7-statistics-refresh" type="button" disabled={loading} onClick={() => void load()}>
          <span aria-hidden="true">{loading ? '…' : '↻'}</span>{loading ? 'Calcul' : 'Actualiser'}
        </button>
      </div>
    </section>

    <section className="phase7-statistics-period-panel compact">
      <div className="phase7-statistics-quick-periods" aria-label="Période statistique">
        {PRESETS.map((item) => <button
          key={item.value}
          type="button"
          className={period.preset === item.value ? 'active' : ''}
          onClick={() => setPeriod({ preset: item.value })}
        >{item.short}</button>)}
      </div>

      {period.preset === 'custom' && <div className="phase7-statistics-custom-dates">
        <label>Du<input type="date" value={period.from ?? ''} onChange={(event) => setPeriod((current) => ({ ...current, from: event.target.value }))} /></label>
        <span>→</span>
        <label>Au<input type="date" value={period.to ?? ''} onChange={(event) => setPeriod((current) => ({ ...current, to: event.target.value }))} /></label>
      </div>}

      {snapshot && <div className="phase7-statistics-period-summary">
        <div><span>Période</span><strong>{dateFr(snapshot.period.from)} → {dateFr(snapshot.period.to)}</strong></div>
        <i aria-hidden="true" />
        <div><span>Comparaison</span><strong>{dateFr(snapshot.period.comparisonFrom)} → {dateFr(snapshot.period.comparisonTo)}</strong></div>
      </div>}
    </section>

    {snapshot && <section className="phase7-statistics-overview-grid">
      <div className="phase7-statistics-glance compact">
        <div className="phase7-statistics-glance-heading">
          <span className="eyebrow">À retenir</span>
          <strong>Résumé express</strong>
        </div>
        <QuickFact icon="✓" label="Signé" value={signed?.currentCents != null ? money(signed.currentCents) : '—'} />
        <QuickFact icon="◆" label="Livré" value={delivered?.currentCents != null ? money(delivered.currentCents) : '—'} />
        <QuickFact icon="◇" label="Offert" value={gifted?.currentCents != null ? money(gifted.currentCents) : '—'} />
      </div>

      <OverviewChart metrics={primaryMetrics} />
    </section>}

    {commercial && <CommercialSection
      snapshot={commercial}
      open={commercialOpen}
      onToggle={() => setCommercialOpen((value) => !value)}
    />}

    {projectTime && <ProjectTimeSection
      snapshot={projectTime}
      open={projectTimeOpen}
      onToggle={() => setProjectTimeOpen((value) => !value)}
    />}

    <MetricSection
      id="primary"
      title="Activité & valeur"
      subtitle="Signé, livré et valeur offerte."
      metrics={primaryMetrics}
      open={primaryOpen}
      onToggle={() => setPrimaryOpen((value) => !value)}
      onExpand={setExpandedMetricKey}
    />

    <MetricSection
      id="flow"
      title="Flux financiers"
      subtitle="Facturation, encaissements et dépenses."
      metrics={flowMetrics}
      open={flowOpen}
      onToggle={() => setFlowOpen((value) => !value)}
      onExpand={setExpandedMetricKey}
      secondary
    />

    {!snapshot && <article className="panel phase7-statistics-loading"><span className="phase7-statistics-loader" /><strong>{loading ? 'Calcul des indicateurs…' : 'Choisis une période pour afficher les indicateurs.'}</strong></article>}

    {expandedMetric && <MetricDetailModal metric={expandedMetric} onClose={() => setExpandedMetricKey(null)} />}
  </div>;
}

function QuickFact({ icon, label, value }: { icon: string; label: string; value: string }) {
  return <div className="phase7-statistics-quick-fact">
    <span className="phase7-statistics-quick-icon" aria-hidden="true">{icon}</span>
    <div><small>{label}</small><strong>{value}</strong></div>
  </div>;
}

function OverviewChart({ metrics }: { metrics: AnalyticsFinancialMetricValue[] }) {
  const available = metrics.filter((metric) => metric.available && metric.currentCents != null);
  const max = Math.max(...available.flatMap((metric) => [Math.abs(metric.currentCents ?? 0), Math.abs(metric.previousCents ?? 0)]), 1);

  return <article className="phase7-statistics-overview-chart">
    <div className="phase7-statistics-chart-heading">
      <div><span className="eyebrow">Comparaison</span><strong>Actuel vs précédent</strong></div>
      <div className="phase7-statistics-chart-legend"><span><i className="current" />Actuel</span><span><i />Précédent</span></div>
    </div>
    <div className="phase7-statistics-chart-bars">
      {available.map((metric) => {
        const meta = METRIC_META[metric.key];
        const current = Math.max(3, Math.round((Math.abs(metric.currentCents ?? 0) / max) * 100));
        const previous = metric.previousCents ? Math.max(3, Math.round((Math.abs(metric.previousCents) / max) * 100)) : 0;
        return <div className={`phase7-statistics-chart-row tone-${meta.tone}`} key={metric.key}>
          <span title={metric.label}>{metric.label.replace('Valeur ', '')}</span>
          <div className="phase7-statistics-chart-track">
            <i className="previous" style={{ width: `${previous}%` }} />
            <i className="current" style={{ width: `${current}%` }} />
          </div>
          <strong>{money(metric.currentCents ?? 0)}</strong>
        </div>;
      })}
    </div>
  </article>;
}

function CommercialSection({ snapshot, open, onToggle }: {
  snapshot: AnalyticsCommercialSnapshot;
  open: boolean;
  onToggle: () => void;
}) {
  const { current, previous } = snapshot;
  const wonMax = Math.max(current.wonProspects + current.lostProspects, 1);
  const quoteMax = Math.max(current.quotesAccepted + current.quotesRefused + current.quotesExpired, 1);

  return <section className={`phase7-statistics-section phase7-statistics-commercial-section collapsible ${open ? 'open' : 'closed'}`}>
    <button className="phase7-statistics-section-toggle" type="button" onClick={onToggle} aria-expanded={open} aria-controls="phase7-statistics-section-commercial">
      <div>
        <span className="eyebrow">Commercial</span>
        <h3>Prospects & devis</h3>
        <p>Volumes bruts d’abord, pourcentages ensuite.</p>
      </div>
      <div className="phase7-statistics-section-summary commercial">
        <span className="phase7-statistics-summary-chip tone-blue"><i>+</i><b>{current.newProspects} prospect{current.newProspects > 1 ? 's' : ''}</b></span>
        <span className="phase7-statistics-summary-chip tone-green"><i>✓</i><b>{current.wonProspects} gagné{current.wonProspects > 1 ? 's' : ''}</b></span>
        <span className="phase7-statistics-summary-chip tone-gold"><i>%</i><b>{percent(current.conversionPercent)}</b></span>
        <span className="phase7-statistics-summary-chip tone-violet"><i>▤</i><b>{current.quotesAccepted}/{current.quoteDecisions} devis</b></span>
      </div>
      <span className="phase7-statistics-section-chevron" aria-hidden="true">{open ? '−' : '+'}</span>
    </button>

    {open && <div className="phase7-statistics-commercial-grid" id="phase7-statistics-section-commercial">
      <CommercialCountCard
        icon="+"
        tone="blue"
        label="Nouveaux prospects"
        current={current.newProspects}
        previous={previous.newProspects}
      />

      <article className="phase7-statistics-commercial-card tone-green">
        <div className="phase7-statistics-commercial-card-head"><span className="phase7-statistics-commercial-icon">✓</span><div><small>Prospects décidés</small><h4>Gagnés / perdus</h4></div></div>
        <div className="phase7-statistics-commercial-main"><strong>{current.wonProspects} / {current.lostProspects}</strong><span>{percent(current.conversionPercent)} de conversion · n={current.decidedProspects}</span></div>
        <div className="phase7-statistics-split-bar" aria-label="Répartition gagnés et perdus">
          <i className="won" style={{ width: `${(current.wonProspects / wonMax) * 100}%` }} />
          <i className="lost" style={{ width: `${(current.lostProspects / wonMax) * 100}%` }} />
        </div>
        <div className="phase7-statistics-commercial-legend"><span><i className="won" />Gagnés {current.wonProspects}</span><span><i className="lost" />Perdus {current.lostProspects}</span></div>
        <small className="phase7-statistics-commercial-previous">Précédente : {previous.wonProspects} gagné{previous.wonProspects > 1 ? 's' : ''}, {previous.lostProspects} perdu{previous.lostProspects > 1 ? 's' : ''} · {percent(previous.conversionPercent)}</small>
      </article>

      <CommercialCountCard
        icon="▤"
        tone="violet"
        label="Devis créés"
        current={current.quotesCreated}
        previous={previous.quotesCreated}
      />

      <article className="phase7-statistics-commercial-card tone-orange">
        <div className="phase7-statistics-commercial-card-head"><span className="phase7-statistics-commercial-icon">◎</span><div><small>Décisions devis</small><h4>Acceptés / refusés / expirés</h4></div></div>
        <div className="phase7-statistics-commercial-main"><strong>{current.quotesAccepted} / {current.quotesRefused} / {current.quotesExpired}</strong><span>{percent(current.quoteAcceptancePercent)} d’acceptation · n={current.quoteDecisions}</span></div>
        <div className="phase7-statistics-split-bar quote" aria-label="Répartition décisions devis">
          <i className="accepted" style={{ width: `${(current.quotesAccepted / quoteMax) * 100}%` }} />
          <i className="refused" style={{ width: `${(current.quotesRefused / quoteMax) * 100}%` }} />
          <i className="expired" style={{ width: `${(current.quotesExpired / quoteMax) * 100}%` }} />
        </div>
        <div className="phase7-statistics-commercial-legend three"><span><i className="accepted" />Acceptés {current.quotesAccepted}</span><span><i className="refused" />Refusés {current.quotesRefused}</span><span><i className="expired" />Expirés {current.quotesExpired}</span></div>
        <small className="phase7-statistics-commercial-previous">Précédente : {previous.quotesAccepted}/{previous.quoteDecisions} acceptés · {percent(previous.quoteAcceptancePercent)}</small>
      </article>

      <CommercialInsights snapshot={snapshot} />
    </div>}
  </section>;
}

function CommercialInsights({ snapshot }: { snapshot: AnalyticsCommercialSnapshot }) {
  const maxSource = Math.max(...snapshot.sources.map((item) => item.prospectCount), 1);
  const maxReason = Math.max(...snapshot.lostReasons.map((item) => item.count), 1);

  return <div className="phase7-statistics-commercial-insights">
    <article className="phase7-statistics-insight-card">
      <div className="phase7-statistics-insight-heading"><div><span className="eyebrow">Origines</span><h4>D’où viennent les prospects ?</h4></div><span>{snapshot.sources.reduce((sum, item) => sum + item.prospectCount, 0)} créés</span></div>
      <div className="phase7-statistics-source-list">
        {snapshot.sources.length > 0 ? snapshot.sources.map((item) => <div className="phase7-statistics-source-row" key={item.source}>
          <div><strong>{SOURCE_LABELS[item.source] ?? item.source}</strong><small>{item.prospectCount} prospect{item.prospectCount > 1 ? 's' : ''}{item.decidedCount > 0 ? ` · ${percent(item.conversionPercent)} · n=${item.decidedCount}` : ''}</small></div>
          <i><b style={{ width: `${Math.max(5, (item.prospectCount / maxSource) * 100)}%` }} /></i>
        </div>) : <p className="phase7-statistics-insight-empty">Aucune source de prospect sur la période.</p>}
      </div>
    </article>

    <article className="phase7-statistics-insight-card">
      <div className="phase7-statistics-insight-heading"><div><span className="eyebrow">Délais</span><h4>Vitesse commerciale</h4></div></div>
      <div className="phase7-statistics-delay-grid">
        <div><span>Prospect → 1er devis</span><strong>{durationLabel(snapshot.delays.prospectToQuoteHours)}</strong><small>n={snapshot.delays.prospectToQuoteSample}</small></div>
        <div><span>Devis → acceptation</span><strong>{durationLabel(snapshot.delays.quoteToAcceptanceHours)}</strong><small>n={snapshot.delays.quoteToAcceptanceSample}</small></div>
      </div>
      <div className="phase7-statistics-delay-previous">
        <span>Période précédente</span>
        <strong>{durationLabel(snapshot.previousDelays.prospectToQuoteHours)} / {durationLabel(snapshot.previousDelays.quoteToAcceptanceHours)}</strong>
      </div>
    </article>

    <article className="phase7-statistics-insight-card">
      <div className="phase7-statistics-insight-heading"><div><span className="eyebrow">Pertes</span><h4>Pourquoi les prospects sont perdus ?</h4></div><span>{snapshot.lostReasons.reduce((sum, item) => sum + item.count, 0)} perdu{snapshot.lostReasons.reduce((sum, item) => sum + item.count, 0) > 1 ? 's' : ''}</span></div>
      <div className="phase7-statistics-reason-list">
        {snapshot.lostReasons.length > 0 ? snapshot.lostReasons.slice(0, 5).map((item) => <div className="phase7-statistics-reason-row" key={item.reason}>
          <div><strong>{item.reason}</strong><span>{item.count}</span></div>
          <i><b style={{ width: `${Math.max(7, (item.count / maxReason) * 100)}%` }} /></i>
        </div>) : <p className="phase7-statistics-insight-empty">Aucun prospect perdu sur la période.</p>}
      </div>
    </article>
  </div>;
}

function CommercialCountCard({ icon, tone, label, current, previous }: {
  icon: string;
  tone: string;
  label: string;
  current: number;
  previous: number;
}) {
  const max = Math.max(current, previous, 1);
  return <article className={`phase7-statistics-commercial-card tone-${tone}`}>
    <div className="phase7-statistics-commercial-card-head"><span className="phase7-statistics-commercial-icon">{icon}</span><div><small>Volume</small><h4>{label}</h4></div></div>
    <div className="phase7-statistics-commercial-main"><strong>{current}</strong><span>{countComparison(current, previous)}</span></div>
    <div className="phase7-statistics-commercial-bars">
      <div><span>Actuel</span><i><b style={{ width: `${current === 0 ? 0 : Math.max(7, (current / max) * 100)}%` }} /></i></div>
      <div><span>Précédent</span><i><b className="previous" style={{ width: `${previous === 0 ? 0 : Math.max(7, (previous / max) * 100)}%` }} /></i></div>
    </div>
  </article>;
}

function ProjectTimeSection({ snapshot, open, onToggle }: {
  snapshot: AnalyticsProjectTimeSnapshot;
  open: boolean;
  onToggle: () => void;
}) {
  const { current, previous, economics, previousEconomics } = snapshot;
  const billablePercent = current.totalSeconds > 0 ? (current.billableSeconds / current.totalSeconds) * 100 : null;
  const estimatedGapSeconds = economics.estimateSample > 0 ? economics.estimateTrackedSeconds - economics.estimatedSeconds : null;
  const maxCategory = Math.max(...snapshot.categories.map((item) => item.seconds), 1);

  return <section className={`phase7-statistics-section phase7-statistics-project-time-section collapsible ${open ? 'open' : 'closed'}`}>
    <button className="phase7-statistics-section-toggle" type="button" onClick={onToggle} aria-expanded={open} aria-controls="phase7-statistics-section-project-time">
      <div>
        <span className="eyebrow">Projets & temps</span>
        <h3>Production & rentabilité</h3>
        <p>Temps réel, livraison et rendement sur des projets terminés.</p>
      </div>
      <div className="phase7-statistics-section-summary project-time">
        <span className="phase7-statistics-summary-chip tone-blue"><i>▣</i><b>{current.projectsCreated} créé{current.projectsCreated > 1 ? 's' : ''}</b></span>
        <span className="phase7-statistics-summary-chip tone-green"><i>✓</i><b>{current.projectsCompleted} terminé{current.projectsCompleted > 1 ? 's' : ''}</b></span>
        <span className="phase7-statistics-summary-chip tone-violet"><i>◷</i><b>{secondsLabel(current.totalSeconds)}</b></span>
        <span className="phase7-statistics-summary-chip tone-gold"><i>€</i><b>{hourlyMoney(economics.contractHourlyCents)}</b></span>
      </div>
      <span className="phase7-statistics-section-chevron" aria-hidden="true">{open ? '−' : '+'}</span>
    </button>

    {open && <div className="phase7-statistics-project-time-grid" id="phase7-statistics-section-project-time">
      <article className="phase7-statistics-project-card tone-blue">
        <div className="phase7-statistics-project-card-head"><span>▣</span><div><small>Volume</small><h4>Projets</h4></div></div>
        <div className="phase7-statistics-project-kpi-row">
          <div><span>Créés</span><strong>{current.projectsCreated}</strong><small>{countComparison(current.projectsCreated, previous.projectsCreated)}</small></div>
          <div><span>Terminés</span><strong>{current.projectsCompleted}</strong><small>{countComparison(current.projectsCompleted, previous.projectsCompleted)}</small></div>
        </div>
      </article>

      <article className="phase7-statistics-project-card tone-violet">
        <div className="phase7-statistics-project-card-head"><span>◷</span><div><small>Temps clôturé</small><h4>Temps suivi</h4></div></div>
        <div className="phase7-statistics-project-main"><strong>{secondsLabel(current.totalSeconds)}</strong><span>{current.sessionCount} session{current.sessionCount > 1 ? 's' : ''}</span></div>
        <div className="phase7-statistics-time-split"><i className="billable" style={{ width: `${billablePercent ?? 0}%` }} /><i className="nonbillable" style={{ width: `${100 - (billablePercent ?? 0)}%` }} /></div>
        <div className="phase7-statistics-commercial-legend"><span><i className="won" />Facturable {secondsLabel(current.billableSeconds)}</span><span><i className="lost" />Non facturable {secondsLabel(current.nonBillableSeconds)}</span></div>
        <small className="phase7-statistics-commercial-previous">Précédente : {secondsLabel(previous.totalSeconds)}</small>
      </article>

      <article className="phase7-statistics-project-card tone-gold">
        <div className="phase7-statistics-project-card-head"><span>€</span><div><small>Projets terminés avec temps</small><h4>Rendement horaire</h4></div></div>
        <div className="phase7-statistics-project-kpi-row">
          <div><span>Contractuel</span><strong>{hourlyMoney(economics.contractHourlyCents)}</strong></div>
          <div><span>Commercial</span><strong>{hourlyMoney(economics.commercialHourlyCents)}</strong></div>
        </div>
        <small className="phase7-statistics-commercial-previous">n={economics.completedProjectsWithTrackedTime} projet{economics.completedProjectsWithTrackedTime > 1 ? 's' : ''} avec temps suivi · précédente {hourlyMoney(previousEconomics.contractHourlyCents)}</small>
      </article>

      <article className="phase7-statistics-project-card tone-green">
        <div className="phase7-statistics-project-card-head"><span>◇</span><div><small>Prévision vs réel</small><h4>Temps estimé</h4></div></div>
        <div className="phase7-statistics-project-main"><strong>{economics.estimateSample > 0 ? secondsLabel(economics.estimatedSeconds) : '—'}</strong><span>Réel : {economics.estimateSample > 0 ? secondsLabel(economics.estimateTrackedSeconds) : '—'} · n={economics.estimateSample}</span></div>
        <div className={`phase7-statistics-estimate-gap ${estimatedGapSeconds != null && estimatedGapSeconds > 0 ? 'over' : 'under'}`}>
          {estimatedGapSeconds == null ? 'Pas assez de données' : estimatedGapSeconds === 0 ? 'Estimation respectée' : `${estimatedGapSeconds > 0 ? '+' : '−'}${secondsLabel(Math.abs(estimatedGapSeconds))} vs estimation`}
        </div>
        <small className="phase7-statistics-commercial-previous">Durée calendaire moyenne : {economics.averageCalendarDays == null ? '—' : `${economics.averageCalendarDays.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} j`} · n={economics.calendarDurationSample}</small>
      </article>

      <article className="phase7-statistics-project-insight">
        <div className="phase7-statistics-insight-heading"><div><span className="eyebrow">Répartition</span><h4>Temps par catégorie</h4></div><span>{secondsLabel(current.totalSeconds)}</span></div>
        <div className="phase7-statistics-category-list">
          {snapshot.categories.length > 0 ? snapshot.categories.slice(0, 7).map((item) => <div className="phase7-statistics-category-row" key={item.category}>
            <div><strong>{item.category.replace(/_/g, ' ')}</strong><small>{secondsLabel(item.seconds)} · {item.sessionCount} session{item.sessionCount > 1 ? 's' : ''}</small></div>
            <i><b style={{ width: `${Math.max(5, (item.seconds / maxCategory) * 100)}%` }} /></i>
          </div>) : <p className="phase7-statistics-insight-empty">Aucun temps clôturé sur la période.</p>}
        </div>
      </article>

      <article className="phase7-statistics-project-insight">
        <div className="phase7-statistics-insight-heading"><div><span className="eyebrow">Comparabilité</span><h4>Projets terminés par type</h4></div></div>
        <div className="phase7-statistics-project-type-list">
          {snapshot.projectTypes.length > 0 ? snapshot.projectTypes.map((item) => <div className="phase7-statistics-project-type-row" key={item.projectType}>
            <div><strong>{item.projectType}</strong><small>n={item.completedCount} · temps suivi sur {item.trackedProjectCount}</small></div>
            <span>{item.averageCalendarDays == null ? '—' : `${item.averageCalendarDays.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} j`}</span>
          </div>) : <p className="phase7-statistics-insight-empty">Aucun projet terminé sur la période.</p>}
        </div>
        <small className="phase7-statistics-comparability-note">Les types restent séparés : aucune moyenne globale n’est utilisée pour comparer automatiquement des projets de nature différente.</small>
      </article>
    </div>}
  </section>;
}

function MetricSection({ id, title, subtitle, metrics, open, onToggle, onExpand, secondary = false }: {
  id: string;
  title: string;
  subtitle: string;
  metrics: AnalyticsFinancialMetricValue[];
  open: boolean;
  onToggle: () => void;
  onExpand: (key: AnalyticsFinancialMetric) => void;
  secondary?: boolean;
}) {
  if (metrics.length === 0) return null;

  return <section className={`phase7-statistics-section collapsible ${secondary ? 'secondary' : ''} ${open ? 'open' : 'closed'}`}>
    <button className="phase7-statistics-section-toggle" type="button" onClick={onToggle} aria-expanded={open} aria-controls={`phase7-statistics-section-${id}`}>
      <div>
        <span className="eyebrow">{secondary ? 'Suivi' : 'Performance'}</span>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
      <div className="phase7-statistics-section-summary">
        {metrics.map((metric) => <MetricSummaryChip metric={metric} key={metric.key} />)}
      </div>
      <span className="phase7-statistics-section-chevron" aria-hidden="true">{open ? '−' : '+'}</span>
    </button>

    {open && <div className="phase7-statistics-metrics-grid compact" id={`phase7-statistics-section-${id}`}>
      {metrics.map((metric) => <MetricCard metric={metric} key={metric.key} onExpand={() => onExpand(metric.key)} />)}
    </div>}
  </section>;
}

function MetricSummaryChip({ metric }: { metric: AnalyticsFinancialMetricValue }) {
  const meta = METRIC_META[metric.key];
  return <span className={`phase7-statistics-summary-chip tone-${meta.tone} ${metric.available ? '' : 'unavailable'}`} title={metric.label}>
    <i aria-hidden="true">{meta.icon}</i>
    <b>{metric.available && metric.currentCents != null ? money(metric.currentCents) : 'Phase 5'}</b>
  </span>;
}

function MetricCard({ metric, onExpand }: { metric: AnalyticsFinancialMetricValue; onExpand: () => void }) {
  const meta = METRIC_META[metric.key];
  const state = trend(metric);
  const pair = normalizedPair(metric);

  return <article className={`phase7-statistics-metric-card compact tone-${meta.tone} ${metric.available ? '' : 'unavailable'}`}>
    <div className="phase7-statistics-metric-top">
      <span className="phase7-statistics-metric-icon" aria-hidden="true">{meta.icon}</span>
      <div className="phase7-statistics-metric-title">
        <small>{meta.kicker}</small>
        <h4>{metric.label}</h4>
      </div>
      <button className="phase7-statistics-expand-button" type="button" onClick={onExpand} title="Agrandir le module" aria-label={`Agrandir ${metric.label}`}>⤢</button>
    </div>

    {metric.available && metric.currentCents != null
      ? <div className="phase7-statistics-card-compact-body">
          <div className="phase7-statistics-value-row compact">
            <strong>{money(metric.currentCents)}</strong>
            <span className={`phase7-statistics-trend ${state}`}><b>{trendArrow(metric)}</b>{deltaLabel(metric)}</span>
          </div>
          <MiniBars current={pair.current} previous={pair.previous} tone={meta.tone} />
        </div>
      : <div className="phase7-statistics-unavailable-compact">
          <strong>En attente de connexion</strong>
          <span>Phase 5 différée</span>
        </div>}

    <button className="phase7-statistics-card-detail-button" type="button" onClick={onExpand}>
      <span>{metric.available ? 'Voir le détail' : 'Voir ce qui manque'}</span><b aria-hidden="true">→</b>
    </button>
  </article>;
}

function MiniBars({ current, previous, tone }: { current: number; previous: number; tone: string }) {
  return <div className={`phase7-statistics-mini-bars tone-${tone}`} aria-label="Comparaison visuelle">
    <span><i style={{ width: `${current}%` }} /></span>
    <span><i className="previous" style={{ width: `${previous}%` }} /></span>
  </div>;
}

function MetricDetailModal({ metric, onClose }: { metric: AnalyticsFinancialMetricValue; onClose: () => void }) {
  const meta = METRIC_META[metric.key];
  const pair = normalizedPair(metric);

  return <div className="phase7-statistics-modal-backdrop" role="presentation" onMouseDown={(event) => {
    if (event.target === event.currentTarget) onClose();
  }}>
    <article className={`phase7-statistics-metric-modal tone-${meta.tone}`} role="dialog" aria-modal="true" aria-label={metric.label}>
      <div className="phase7-statistics-modal-head">
        <div className="phase7-statistics-modal-title">
          <span className="phase7-statistics-metric-icon" aria-hidden="true">{meta.icon}</span>
          <div><span className="eyebrow">{meta.kicker}</span><h3>{metric.label}</h3></div>
        </div>
        <button className="phase7-statistics-modal-close" type="button" onClick={onClose} aria-label="Fermer">×</button>
      </div>

      {metric.available && metric.currentCents != null
        ? <div className="phase7-statistics-modal-content">
            <div className="phase7-statistics-modal-kpis">
              <div><span>Cette période</span><strong>{money(metric.currentCents)}</strong></div>
              <div><span>Période précédente</span><strong>{money(metric.previousCents ?? 0)}</strong></div>
              <div><span>Évolution</span><strong className={trend(metric)}>{deltaLabel(metric)}</strong></div>
            </div>

            <div className="phase7-statistics-detail-chart">
              <div className="phase7-statistics-detail-column">
                <div className="phase7-statistics-detail-bar-zone"><i className="current" style={{ height: `${pair.current}%` }} /></div>
                <strong>{money(metric.currentCents)}</strong><span>Cette période</span>
              </div>
              <div className="phase7-statistics-detail-column">
                <div className="phase7-statistics-detail-bar-zone"><i className="previous" style={{ height: `${pair.previous}%` }} /></div>
                <strong>{money(metric.previousCents ?? 0)}</strong><span>Précédente</span>
              </div>
            </div>
          </div>
        : <div className="phase7-statistics-modal-missing">
            <span className="phase7-statistics-phase-badge">Phase 5 différée</span>
            <h4>Donnée pas encore connectée</h4>
            <p>{metric.note}</p>
          </div>}

      <div className="phase7-statistics-modal-source">
        <div><span>Source</span><strong>{metric.source}</strong></div>
        <div><span>Date métier</span><strong>{metric.businessDate}</strong></div>
        <p>{metric.note}</p>
      </div>
    </article>
  </div>;
}
