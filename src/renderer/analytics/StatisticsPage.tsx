import { useEffect, useMemo, useState } from 'react';
import type {
  AnalyticsFinancialMetricValue,
  AnalyticsFinancialSnapshot,
  AnalyticsPeriodInput,
  AnalyticsPeriodPreset,
} from '../../shared/analytics';

const PRESETS: Array<{ value: AnalyticsPeriodPreset; label: string }> = [
  { value: 'today', label: 'Aujourd’hui' },
  { value: 'week', label: 'Cette semaine' },
  { value: 'month', label: 'Ce mois' },
  { value: 'quarter', label: 'Ce trimestre' },
  { value: 'year', label: 'Cette année' },
  { value: 'previous_year', label: 'Année précédente' },
  { value: 'custom', label: 'Période personnalisée' },
];

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
    return `${metric.deltaCents > 0 ? '+' : ''}${money(metric.deltaCents)} · pas de base précédente`;
  }
  const percent = metric.deltaPercent == null ? '' : ` · ${metric.deltaPercent > 0 ? '+' : ''}${metric.deltaPercent.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`;
  return `${metric.deltaCents > 0 ? '+' : ''}${money(metric.deltaCents)}${percent}`;
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

  return <div className="statistics-page">
    <article className="panel statistics-toolbar">
      <div>
        <span className="eyebrow">Phase 7A</span>
        <h2>Définitions financières traçables</h2>
        <p className="muted">Chaque montant indique sa source et sa date métier. Les sources Phase 5 absentes restent volontairement indisponibles.</p>
      </div>
      <div className="statistics-period-controls">
        <label>Période
          <select value={period.preset} onChange={(event) => setPeriod({ preset: event.target.value as AnalyticsPeriodPreset })}>
            {PRESETS.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
          </select>
        </label>
        {period.preset === 'custom' && <>
          <label>Du<input type="date" value={period.from ?? ''} onChange={(event) => setPeriod((current) => ({ ...current, from: event.target.value }))} /></label>
          <label>Au<input type="date" value={period.to ?? ''} onChange={(event) => setPeriod((current) => ({ ...current, to: event.target.value }))} /></label>
        </>}
        <button className="secondary-button" type="button" disabled={loading} onClick={() => void load()}>{loading ? 'Calcul…' : 'Recalculer'}</button>
      </div>
    </article>

    {snapshot && <div className="statistics-period-summary">
      <strong>{dateFr(snapshot.period.from)} → {dateFr(snapshot.period.to)}</strong>
      <span>Comparaison : {dateFr(snapshot.period.comparisonFrom)} → {dateFr(snapshot.period.comparisonTo)}</span>
    </div>}

    <div className="statistics-metrics-grid">
      {snapshot?.metrics.map((metric) => <MetricCard metric={metric} key={metric.key} />)}
      {!snapshot && <article className="panel"><span className="muted">{loading ? 'Calcul des indicateurs…' : 'Choisis une période pour afficher les indicateurs.'}</span></article>}
    </div>
  </div>;
}

function MetricCard({ metric }: { metric: AnalyticsFinancialMetricValue }) {
  return <article className={`panel statistics-metric-card ${metric.available ? '' : 'unavailable'}`}>
    <div className="statistics-metric-heading">
      <span className="eyebrow">{metric.available ? 'Disponible' : 'Source non intégrée'}</span>
      {!metric.available && <span className="status-pill">Phase 5</span>}
    </div>
    <h3>{metric.label}</h3>
    <strong className="statistics-metric-value">{metric.available && metric.currentCents != null ? money(metric.currentCents) : 'Indisponible'}</strong>
    <div className="statistics-metric-comparison">
      <span>Période précédente</span>
      <strong>{metric.available && metric.previousCents != null ? money(metric.previousCents) : '—'}</strong>
      <small>{metric.available ? deltaLabel(metric) : metric.note}</small>
    </div>
    <details>
      <summary>Source du calcul</summary>
      <div className="statistics-source-detail">
        <span><b>Source :</b> {metric.source}</span>
        <span><b>Date métier :</b> {metric.businessDate}</span>
        <span>{metric.note}</span>
      </div>
    </details>
  </article>;
}
