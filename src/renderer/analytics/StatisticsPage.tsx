import { useEffect, useMemo, useState } from 'react';
import type {
  AnalyticsFinancialMetric,
  AnalyticsFinancialMetricValue,
  AnalyticsFinancialSnapshot,
  AnalyticsPeriodInput,
  AnalyticsPeriodPreset,
} from '../../shared/analytics';

const PRESETS: Array<{ value: AnalyticsPeriodPreset; label: string; short: string }> = [
  { value: 'today', label: 'Aujourd’hui', short: 'Jour' },
  { value: 'week', label: 'Cette semaine', short: 'Semaine' },
  { value: 'month', label: 'Ce mois', short: 'Mois' },
  { value: 'quarter', label: 'Ce trimestre', short: 'Trimestre' },
  { value: 'year', label: 'Cette année', short: 'Année' },
  { value: 'previous_year', label: 'Année précédente', short: 'N-1' },
  { value: 'custom', label: 'Période personnalisée', short: 'Dates' },
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

function comparisonWidths(metric: AnalyticsFinancialMetricValue): { current: string; previous: string } {
  if (!metric.available || metric.currentCents == null || metric.previousCents == null) return { current: '0%', previous: '0%' };
  const max = Math.max(Math.abs(metric.currentCents), Math.abs(metric.previousCents), 1);
  return {
    current: `${Math.max(5, Math.round((Math.abs(metric.currentCents) / max) * 100))}%`,
    previous: metric.previousCents === 0 ? '0%' : `${Math.max(5, Math.round((Math.abs(metric.previousCents) / max) * 100))}%`,
  };
}

export function StatisticsPage({ onMessage }: { onMessage: (message: string) => void }) {
  const [period, setPeriod] = useState<AnalyticsPeriodInput>({ preset: 'month' });
  const [snapshot, setSnapshot] = useState<AnalyticsFinancialSnapshot | null>(null);
  const [loading, setLoading] = useState(false);

  const effectivePeriod = useMemo<AnalyticsPeriodInput>(() => {
    if (period.preset !== 'custom') return { preset: period.preset };
    return period;
  }, [period]);

  async function load(): Promise<void> {
    if (effectivePeriod.preset === 'custom' && (!effectivePeriod.from || !effectivePeriod.to)) return;
    setLoading(true);
    try {
      setSnapshot(await window.atoumweb.analytics.financialSnapshot(effectivePeriod));
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de calculer les statistiques.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [effectivePeriod.preset, effectivePeriod.from, effectivePeriod.to]);

  const metricMap = useMemo(
    () => new Map(snapshot?.metrics.map((metric) => [metric.key, metric]) ?? []),
    [snapshot],
  );
  const availableCount = snapshot?.metrics.filter((metric) => metric.available).length ?? 0;
  const signed = metricMap.get('contract_signed');
  const delivered = metricMap.get('commercial_delivered');
  const gifted = metricMap.get('gifted_value');

  return <div className="statistics-page">
    <section className="statistics-hero">
      <div className="statistics-hero-copy">
        <div className="statistics-hero-mark" aria-hidden="true">AW</div>
        <div>
          <span className="eyebrow">Pilotage AtoumWeb · Phase 7A</span>
          <h2>Les chiffres qui racontent ton activité</h2>
          <p>Une lecture rapide d’abord, les sources et règles de calcul restent accessibles derrière chaque indicateur.</p>
        </div>
      </div>

      <div className="statistics-hero-side">
        <div className="statistics-hero-score">
          <strong>{availableCount}</strong>
          <span>indicateurs actifs</span>
          <small>sur {snapshot?.metrics.length ?? 8}</small>
        </div>
        <button className="statistics-refresh" type="button" disabled={loading} onClick={() => void load()} aria-label="Recalculer les statistiques">
          <span aria-hidden="true">{loading ? '…' : '↻'}</span>
          {loading ? 'Calcul' : 'Actualiser'}
        </button>
      </div>
    </section>

    <section className="statistics-period-panel">
      <div className="statistics-quick-periods" aria-label="Période statistique">
        {PRESETS.map((item) => <button
          key={item.value}
          type="button"
          className={period.preset === item.value ? 'active' : ''}
          onClick={() => setPeriod({ preset: item.value })}
        >{item.short}</button>)}
      </div>

      {period.preset === 'custom' && <div className="statistics-custom-dates">
        <label>Du
          <input type="date" value={period.from ?? ''} onChange={(event) => setPeriod((current) => ({ ...current, from: event.target.value }))} />
        </label>
        <span>→</span>
        <label>Au
          <input type="date" value={period.to ?? ''} onChange={(event) => setPeriod((current) => ({ ...current, to: event.target.value }))} />
        </label>
      </div>}

      {snapshot && <div className="statistics-period-summary">
        <div><span>Période analysée</span><strong>{dateFr(snapshot.period.from)} → {dateFr(snapshot.period.to)}</strong></div>
        <i aria-hidden="true" />
        <div><span>Comparaison</span><strong>{dateFr(snapshot.period.comparisonFrom)} → {dateFr(snapshot.period.comparisonTo)}</strong></div>
      </div>}
    </section>

    {snapshot && <section className="statistics-glance">
      <div className="statistics-glance-heading">
        <span className="eyebrow">À retenir</span>
        <strong>Le résumé en 10 secondes</strong>
      </div>
      <QuickFact icon="✓" label="Signé sur la période" value={signed?.currentCents != null ? money(signed.currentCents) : '—'} />
      <QuickFact icon="◆" label="Valeur livrée" value={delivered?.currentCents != null ? money(delivered.currentCents) : '—'} />
      <QuickFact icon="◇" label="Valeur offerte" value={gifted?.currentCents != null ? money(gifted.currentCents) : '—'} />
      <QuickFact icon="◎" label="Sources exploitables" value={`${availableCount} / ${snapshot.metrics.length}`} />
    </section>}

    <MetricSection
      title="Activité & valeur"
      subtitle="Ce que tu signes, livres ou offres commercialement."
      metrics={PRIMARY_METRICS.map((key) => metricMap.get(key)).filter(Boolean) as AnalyticsFinancialMetricValue[]}
    />

    <MetricSection
      title="Flux financiers"
      subtitle="Factures, encaissements et dépenses dès que la Phase 5 fournit leurs sources de vérité."
      metrics={FLOW_METRICS.map((key) => metricMap.get(key)).filter(Boolean) as AnalyticsFinancialMetricValue[]}
      secondary
    />

    {!snapshot && <article className="panel statistics-loading"><span className="statistics-loader" /><strong>{loading ? 'Calcul des indicateurs…' : 'Choisis une période pour afficher les indicateurs.'}</strong></article>}
  </div>;
}

function QuickFact({ icon, label, value }: { icon: string; label: string; value: string }) {
  return <div className="statistics-quick-fact">
    <span className="statistics-quick-icon" aria-hidden="true">{icon}</span>
    <div><small>{label}</small><strong>{value}</strong></div>
  </div>;
}

function MetricSection({ title, subtitle, metrics, secondary = false }: {
  title: string;
  subtitle: string;
  metrics: AnalyticsFinancialMetricValue[];
  secondary?: boolean;
}) {
  if (metrics.length === 0) return null;
  return <section className={`statistics-section ${secondary ? 'secondary' : ''}`}>
    <div className="statistics-section-heading">
      <div><span className="eyebrow">{secondary ? 'Suivi' : 'Performance'}</span><h3>{title}</h3></div>
      <p>{subtitle}</p>
    </div>
    <div className="statistics-metrics-grid">
      {metrics.map((metric) => <MetricCard metric={metric} key={metric.key} />)}
    </div>
  </section>;
}

function MetricCard({ metric }: { metric: AnalyticsFinancialMetricValue }) {
  const meta = METRIC_META[metric.key];
  const state = trend(metric);
  const widths = comparisonWidths(metric);

  return <article className={`statistics-metric-card tone-${meta.tone} ${metric.available ? '' : 'unavailable'}`}>
    <div className="statistics-metric-top">
      <span className="statistics-metric-icon" aria-hidden="true">{meta.icon}</span>
      <div className="statistics-metric-title">
        <small>{meta.kicker}</small>
        <h4>{metric.label}</h4>
      </div>
      {metric.available
        ? <span className="statistics-live-badge"><i /> Actif</span>
        : <span className="statistics-phase-badge">Phase 5</span>}
    </div>

    {metric.available && metric.currentCents != null
      ? <>
        <div className="statistics-value-row">
          <strong>{money(metric.currentCents)}</strong>
          <span className={`statistics-trend ${state}`}><b>{trendArrow(metric)}</b>{deltaLabel(metric)}</span>
        </div>

        <div className="statistics-mini-compare" aria-label="Comparaison avec la période précédente">
          <div>
            <span>Cette période</span>
            <i><b style={{ width: widths.current }} /></i>
          </div>
          <div>
            <span>Précédente</span>
            <i><b className="previous" style={{ width: widths.previous }} /></i>
          </div>
        </div>

        <div className="statistics-previous">
          <span>Période précédente</span>
          <strong>{metric.previousCents != null ? money(metric.previousCents) : '—'}</strong>
        </div>
      </>
      : <div className="statistics-unavailable-body">
        <strong>En attente de connexion</strong>
        <p>{metric.note}</p>
        <span><i aria-hidden="true">↗</i> Prévu dans la Phase 5 différée</span>
      </div>}

    <details>
      <summary><span>Voir la source du calcul</span><b aria-hidden="true">+</b></summary>
      <div className="statistics-source-detail">
        <span><b>Source</b>{metric.source}</span>
        <span><b>Date métier</b>{metric.businessDate}</span>
        <p>{metric.note}</p>
      </div>
    </details>
  </article>;
}
