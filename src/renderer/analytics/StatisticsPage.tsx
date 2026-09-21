import { useEffect, useMemo, useState } from 'react';
import type {
  AnalyticsCommercialSnapshot,
  AnalyticsFinancialMetric,
  AnalyticsFinancialMetricValue,
  AnalyticsFinancialSnapshot,
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
  const [loading, setLoading] = useState(false);
  const [commercialOpen, setCommercialOpen] = useState(false);
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
      const [financialSnapshot, commercialSnapshot] = await Promise.all([
        window.atoumweb.analytics.financialSnapshot(effectivePeriod),
        window.atoumweb.analytics.commercialSnapshot(effectivePeriod),
      ]);
      setSnapshot(financialSnapshot);
      setCommercial(commercialSnapshot);
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

  return <div className="statistics-page">
    <section className="statistics-hero compact">
      <div className="statistics-hero-copy">
        <div className="statistics-hero-mark" aria-hidden="true">AW</div>
        <div>
          <span className="eyebrow">Pilotage AtoumWeb · Phase 7A</span>
          <h2>Les chiffres qui racontent ton activité</h2>
          <p>Vue synthétique par défaut. Chaque bloc peut être déployé et chaque indicateur agrandi.</p>
        </div>
      </div>
      <div className="statistics-hero-side">
        <div className="statistics-hero-score">
          <strong>{availableCount}/{snapshot?.metrics.length ?? 8}</strong>
          <span>sources actives</span>
        </div>
        <button className="statistics-refresh" type="button" disabled={loading} onClick={() => void load()}>
          <span aria-hidden="true">{loading ? '…' : '↻'}</span>{loading ? 'Calcul' : 'Actualiser'}
        </button>
      </div>
    </section>

    <section className="statistics-period-panel compact">
      <div className="statistics-quick-periods" aria-label="Période statistique">
        {PRESETS.map((item) => <button
          key={item.value}
          type="button"
          className={period.preset === item.value ? 'active' : ''}
          onClick={() => setPeriod({ preset: item.value })}
        >{item.short}</button>)}
      </div>

      {period.preset === 'custom' && <div className="statistics-custom-dates">
        <label>Du<input type="date" value={period.from ?? ''} onChange={(event) => setPeriod((current) => ({ ...current, from: event.target.value }))} /></label>
        <span>→</span>
        <label>Au<input type="date" value={period.to ?? ''} onChange={(event) => setPeriod((current) => ({ ...current, to: event.target.value }))} /></label>
      </div>}

      {snapshot && <div className="statistics-period-summary">
        <div><span>Période</span><strong>{dateFr(snapshot.period.from)} → {dateFr(snapshot.period.to)}</strong></div>
        <i aria-hidden="true" />
        <div><span>Comparaison</span><strong>{dateFr(snapshot.period.comparisonFrom)} → {dateFr(snapshot.period.comparisonTo)}</strong></div>
      </div>}
    </section>

    {snapshot && <section className="statistics-overview-grid">
      <div className="statistics-glance compact">
        <div className="statistics-glance-heading">
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

    {!snapshot && <article className="panel statistics-loading"><span className="statistics-loader" /><strong>{loading ? 'Calcul des indicateurs…' : 'Choisis une période pour afficher les indicateurs.'}</strong></article>}

    {expandedMetric && <MetricDetailModal metric={expandedMetric} onClose={() => setExpandedMetricKey(null)} />}
  </div>;
}

function QuickFact({ icon, label, value }: { icon: string; label: string; value: string }) {
  return <div className="statistics-quick-fact">
    <span className="statistics-quick-icon" aria-hidden="true">{icon}</span>
    <div><small>{label}</small><strong>{value}</strong></div>
  </div>;
}

function OverviewChart({ metrics }: { metrics: AnalyticsFinancialMetricValue[] }) {
  const available = metrics.filter((metric) => metric.available && metric.currentCents != null);
  const max = Math.max(...available.flatMap((metric) => [Math.abs(metric.currentCents ?? 0), Math.abs(metric.previousCents ?? 0)]), 1);

  return <article className="statistics-overview-chart">
    <div className="statistics-chart-heading">
      <div><span className="eyebrow">Comparaison</span><strong>Actuel vs précédent</strong></div>
      <div className="statistics-chart-legend"><span><i className="current" />Actuel</span><span><i />Précédent</span></div>
    </div>
    <div className="statistics-chart-bars">
      {available.map((metric) => {
        const meta = METRIC_META[metric.key];
        const current = Math.max(3, Math.round((Math.abs(metric.currentCents ?? 0) / max) * 100));
        const previous = metric.previousCents ? Math.max(3, Math.round((Math.abs(metric.previousCents) / max) * 100)) : 0;
        return <div className={`statistics-chart-row tone-${meta.tone}`} key={metric.key}>
          <span title={metric.label}>{metric.label.replace('Valeur ', '')}</span>
          <div className="statistics-chart-track">
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

  return <section className={`statistics-section statistics-commercial-section collapsible ${open ? 'open' : 'closed'}`}>
    <button className="statistics-section-toggle" type="button" onClick={onToggle} aria-expanded={open} aria-controls="statistics-section-commercial">
      <div>
        <span className="eyebrow">Commercial</span>
        <h3>Prospects & devis</h3>
        <p>Volumes bruts d’abord, pourcentages ensuite.</p>
      </div>
      <div className="statistics-section-summary commercial">
        <span className="statistics-summary-chip tone-blue"><i>+</i><b>{current.newProspects} prospect{current.newProspects > 1 ? 's' : ''}</b></span>
        <span className="statistics-summary-chip tone-green"><i>✓</i><b>{current.wonProspects} gagné{current.wonProspects > 1 ? 's' : ''}</b></span>
        <span className="statistics-summary-chip tone-gold"><i>%</i><b>{percent(current.conversionPercent)}</b></span>
        <span className="statistics-summary-chip tone-violet"><i>▤</i><b>{current.quotesAccepted}/{current.quoteDecisions} devis</b></span>
      </div>
      <span className="statistics-section-chevron" aria-hidden="true">{open ? '−' : '+'}</span>
    </button>

    {open && <div className="statistics-commercial-grid" id="statistics-section-commercial">
      <CommercialCountCard
        icon="+"
        tone="blue"
        label="Nouveaux prospects"
        current={current.newProspects}
        previous={previous.newProspects}
      />

      <article className="statistics-commercial-card tone-green">
        <div className="statistics-commercial-card-head"><span className="statistics-commercial-icon">✓</span><div><small>Prospects décidés</small><h4>Gagnés / perdus</h4></div></div>
        <div className="statistics-commercial-main"><strong>{current.wonProspects} / {current.lostProspects}</strong><span>{percent(current.conversionPercent)} de conversion · n={current.decidedProspects}</span></div>
        <div className="statistics-split-bar" aria-label="Répartition gagnés et perdus">
          <i className="won" style={{ width: `${(current.wonProspects / wonMax) * 100}%` }} />
          <i className="lost" style={{ width: `${(current.lostProspects / wonMax) * 100}%` }} />
        </div>
        <div className="statistics-commercial-legend"><span><i className="won" />Gagnés {current.wonProspects}</span><span><i className="lost" />Perdus {current.lostProspects}</span></div>
        <small className="statistics-commercial-previous">Précédente : {previous.wonProspects} gagné{previous.wonProspects > 1 ? 's' : ''}, {previous.lostProspects} perdu{previous.lostProspects > 1 ? 's' : ''} · {percent(previous.conversionPercent)}</small>
      </article>

      <CommercialCountCard
        icon="▤"
        tone="violet"
        label="Devis créés"
        current={current.quotesCreated}
        previous={previous.quotesCreated}
      />

      <article className="statistics-commercial-card tone-orange">
        <div className="statistics-commercial-card-head"><span className="statistics-commercial-icon">◎</span><div><small>Décisions devis</small><h4>Acceptés / refusés / expirés</h4></div></div>
        <div className="statistics-commercial-main"><strong>{current.quotesAccepted} / {current.quotesRefused} / {current.quotesExpired}</strong><span>{percent(current.quoteAcceptancePercent)} d’acceptation · n={current.quoteDecisions}</span></div>
        <div className="statistics-split-bar quote" aria-label="Répartition décisions devis">
          <i className="accepted" style={{ width: `${(current.quotesAccepted / quoteMax) * 100}%` }} />
          <i className="refused" style={{ width: `${(current.quotesRefused / quoteMax) * 100}%` }} />
          <i className="expired" style={{ width: `${(current.quotesExpired / quoteMax) * 100}%` }} />
        </div>
        <div className="statistics-commercial-legend three"><span><i className="accepted" />Acceptés {current.quotesAccepted}</span><span><i className="refused" />Refusés {current.quotesRefused}</span><span><i className="expired" />Expirés {current.quotesExpired}</span></div>
        <small className="statistics-commercial-previous">Précédente : {previous.quotesAccepted}/{previous.quoteDecisions} acceptés · {percent(previous.quoteAcceptancePercent)}</small>
      </article>

      <CommercialInsights snapshot={snapshot} />
    </div>}
  </section>;
}

function CommercialInsights({ snapshot }: { snapshot: AnalyticsCommercialSnapshot }) {
  const maxSource = Math.max(...snapshot.sources.map((item) => item.prospectCount), 1);
  const maxReason = Math.max(...snapshot.lostReasons.map((item) => item.count), 1);

  return <div className="statistics-commercial-insights">
    <article className="statistics-insight-card">
      <div className="statistics-insight-heading"><div><span className="eyebrow">Origines</span><h4>D’où viennent les prospects ?</h4></div><span>{snapshot.sources.reduce((sum, item) => sum + item.prospectCount, 0)} créés</span></div>
      <div className="statistics-source-list">
        {snapshot.sources.length > 0 ? snapshot.sources.map((item) => <div className="statistics-source-row" key={item.source}>
          <div><strong>{SOURCE_LABELS[item.source] ?? item.source}</strong><small>{item.prospectCount} prospect{item.prospectCount > 1 ? 's' : ''}{item.decidedCount > 0 ? ` · ${percent(item.conversionPercent)} · n=${item.decidedCount}` : ''}</small></div>
          <i><b style={{ width: `${Math.max(5, (item.prospectCount / maxSource) * 100)}%` }} /></i>
        </div>) : <p className="statistics-insight-empty">Aucune source de prospect sur la période.</p>}
      </div>
    </article>

    <article className="statistics-insight-card">
      <div className="statistics-insight-heading"><div><span className="eyebrow">Délais</span><h4>Vitesse commerciale</h4></div></div>
      <div className="statistics-delay-grid">
        <div><span>Prospect → 1er devis</span><strong>{durationLabel(snapshot.delays.prospectToQuoteHours)}</strong><small>n={snapshot.delays.prospectToQuoteSample}</small></div>
        <div><span>Devis → acceptation</span><strong>{durationLabel(snapshot.delays.quoteToAcceptanceHours)}</strong><small>n={snapshot.delays.quoteToAcceptanceSample}</small></div>
      </div>
      <div className="statistics-delay-previous">
        <span>Période précédente</span>
        <strong>{durationLabel(snapshot.previousDelays.prospectToQuoteHours)} / {durationLabel(snapshot.previousDelays.quoteToAcceptanceHours)}</strong>
      </div>
    </article>

    <article className="statistics-insight-card">
      <div className="statistics-insight-heading"><div><span className="eyebrow">Pertes</span><h4>Pourquoi les prospects sont perdus ?</h4></div><span>{snapshot.lostReasons.reduce((sum, item) => sum + item.count, 0)} perdu{snapshot.lostReasons.reduce((sum, item) => sum + item.count, 0) > 1 ? 's' : ''}</span></div>
      <div className="statistics-reason-list">
        {snapshot.lostReasons.length > 0 ? snapshot.lostReasons.slice(0, 5).map((item) => <div className="statistics-reason-row" key={item.reason}>
          <div><strong>{item.reason}</strong><span>{item.count}</span></div>
          <i><b style={{ width: `${Math.max(7, (item.count / maxReason) * 100)}%` }} /></i>
        </div>) : <p className="statistics-insight-empty">Aucun prospect perdu sur la période.</p>}
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
  return <article className={`statistics-commercial-card tone-${tone}`}>
    <div className="statistics-commercial-card-head"><span className="statistics-commercial-icon">{icon}</span><div><small>Volume</small><h4>{label}</h4></div></div>
    <div className="statistics-commercial-main"><strong>{current}</strong><span>{countComparison(current, previous)}</span></div>
    <div className="statistics-commercial-bars">
      <div><span>Actuel</span><i><b style={{ width: `${current === 0 ? 0 : Math.max(7, (current / max) * 100)}%` }} /></i></div>
      <div><span>Précédent</span><i><b className="previous" style={{ width: `${previous === 0 ? 0 : Math.max(7, (previous / max) * 100)}%` }} /></i></div>
    </div>
  </article>;
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

  return <section className={`statistics-section collapsible ${secondary ? 'secondary' : ''} ${open ? 'open' : 'closed'}`}>
    <button className="statistics-section-toggle" type="button" onClick={onToggle} aria-expanded={open} aria-controls={`statistics-section-${id}`}>
      <div>
        <span className="eyebrow">{secondary ? 'Suivi' : 'Performance'}</span>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
      <div className="statistics-section-summary">
        {metrics.map((metric) => <MetricSummaryChip metric={metric} key={metric.key} />)}
      </div>
      <span className="statistics-section-chevron" aria-hidden="true">{open ? '−' : '+'}</span>
    </button>

    {open && <div className="statistics-metrics-grid compact" id={`statistics-section-${id}`}>
      {metrics.map((metric) => <MetricCard metric={metric} key={metric.key} onExpand={() => onExpand(metric.key)} />)}
    </div>}
  </section>;
}

function MetricSummaryChip({ metric }: { metric: AnalyticsFinancialMetricValue }) {
  const meta = METRIC_META[metric.key];
  return <span className={`statistics-summary-chip tone-${meta.tone} ${metric.available ? '' : 'unavailable'}`} title={metric.label}>
    <i aria-hidden="true">{meta.icon}</i>
    <b>{metric.available && metric.currentCents != null ? money(metric.currentCents) : 'Phase 5'}</b>
  </span>;
}

function MetricCard({ metric, onExpand }: { metric: AnalyticsFinancialMetricValue; onExpand: () => void }) {
  const meta = METRIC_META[metric.key];
  const state = trend(metric);
  const pair = normalizedPair(metric);

  return <article className={`statistics-metric-card compact tone-${meta.tone} ${metric.available ? '' : 'unavailable'}`}>
    <div className="statistics-metric-top">
      <span className="statistics-metric-icon" aria-hidden="true">{meta.icon}</span>
      <div className="statistics-metric-title">
        <small>{meta.kicker}</small>
        <h4>{metric.label}</h4>
      </div>
      <button className="statistics-expand-button" type="button" onClick={onExpand} title="Agrandir le module" aria-label={`Agrandir ${metric.label}`}>⤢</button>
    </div>

    {metric.available && metric.currentCents != null
      ? <div className="statistics-card-compact-body">
          <div className="statistics-value-row compact">
            <strong>{money(metric.currentCents)}</strong>
            <span className={`statistics-trend ${state}`}><b>{trendArrow(metric)}</b>{deltaLabel(metric)}</span>
          </div>
          <MiniBars current={pair.current} previous={pair.previous} tone={meta.tone} />
        </div>
      : <div className="statistics-unavailable-compact">
          <strong>En attente de connexion</strong>
          <span>Phase 5 différée</span>
        </div>}

    <button className="statistics-card-detail-button" type="button" onClick={onExpand}>
      <span>{metric.available ? 'Voir le détail' : 'Voir ce qui manque'}</span><b aria-hidden="true">→</b>
    </button>
  </article>;
}

function MiniBars({ current, previous, tone }: { current: number; previous: number; tone: string }) {
  return <div className={`statistics-mini-bars tone-${tone}`} aria-label="Comparaison visuelle">
    <span><i style={{ width: `${current}%` }} /></span>
    <span><i className="previous" style={{ width: `${previous}%` }} /></span>
  </div>;
}

function MetricDetailModal({ metric, onClose }: { metric: AnalyticsFinancialMetricValue; onClose: () => void }) {
  const meta = METRIC_META[metric.key];
  const pair = normalizedPair(metric);

  return <div className="statistics-modal-backdrop" role="presentation" onMouseDown={(event) => {
    if (event.target === event.currentTarget) onClose();
  }}>
    <article className={`statistics-metric-modal tone-${meta.tone}`} role="dialog" aria-modal="true" aria-label={metric.label}>
      <div className="statistics-modal-head">
        <div className="statistics-modal-title">
          <span className="statistics-metric-icon" aria-hidden="true">{meta.icon}</span>
          <div><span className="eyebrow">{meta.kicker}</span><h3>{metric.label}</h3></div>
        </div>
        <button className="statistics-modal-close" type="button" onClick={onClose} aria-label="Fermer">×</button>
      </div>

      {metric.available && metric.currentCents != null
        ? <div className="statistics-modal-content">
            <div className="statistics-modal-kpis">
              <div><span>Cette période</span><strong>{money(metric.currentCents)}</strong></div>
              <div><span>Période précédente</span><strong>{money(metric.previousCents ?? 0)}</strong></div>
              <div><span>Évolution</span><strong className={trend(metric)}>{deltaLabel(metric)}</strong></div>
            </div>

            <div className="statistics-detail-chart">
              <div className="statistics-detail-column">
                <div className="statistics-detail-bar-zone"><i className="current" style={{ height: `${pair.current}%` }} /></div>
                <strong>{money(metric.currentCents)}</strong><span>Cette période</span>
              </div>
              <div className="statistics-detail-column">
                <div className="statistics-detail-bar-zone"><i className="previous" style={{ height: `${pair.previous}%` }} /></div>
                <strong>{money(metric.previousCents ?? 0)}</strong><span>Précédente</span>
              </div>
            </div>
          </div>
        : <div className="statistics-modal-missing">
            <span className="statistics-phase-badge">Phase 5 différée</span>
            <h4>Donnée pas encore connectée</h4>
            <p>{metric.note}</p>
          </div>}

      <div className="statistics-modal-source">
        <div><span>Source</span><strong>{metric.source}</strong></div>
        <div><span>Date métier</span><strong>{metric.businessDate}</strong></div>
        <p>{metric.note}</p>
      </div>
    </article>
  </div>;
}
