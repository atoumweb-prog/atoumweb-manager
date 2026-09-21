import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import {
  ANALYTICS_METRIC_DEFINITIONS,
  type AnalyticsFinancialMetric,
  type AnalyticsFinancialMetricValue,
  type AnalyticsFinancialSnapshot,
  type AnalyticsCommercialDelayStats,
  type AnalyticsCommercialPeriodStats,
  type AnalyticsCommercialReasonStat,
  type AnalyticsCommercialSnapshot,
  type AnalyticsCommercialSourceStat,
  type AnalyticsMetricDefinition,
  type AnalyticsPeriodInput,
} from '../../shared/analytics';
import { resolveAnalyticsPeriod } from './AnalyticsPeriodService';

interface SumRow extends Record<string, unknown> {
  total: number | null;
}

interface SourceRow extends Record<string, unknown> {
  source: string | null;
  prospect_count: number;
  won_count: number;
  lost_count: number;
}

interface ReasonRow extends Record<string, unknown> {
  reason: string | null;
  total: number;
}

interface DelayRow extends Record<string, unknown> {
  average_hours: number | null;
  sample: number;
}

export class AnalyticsService {
  constructor(private readonly database: DatabaseAdapter) {}

  definitions(): AnalyticsMetricDefinition[] {
    return ANALYTICS_METRIC_DEFINITIONS.map((definition) => ({ ...definition }));
  }

  financialSnapshot(input: AnalyticsPeriodInput, now = new Date()): AnalyticsFinancialSnapshot {
    const period = resolveAnalyticsPeriod(input, now);
    return {
      period,
      metrics: ANALYTICS_METRIC_DEFINITIONS.map((definition) =>
        this.metricValue(definition, period.from, period.to, period.comparisonFrom, period.comparisonTo),
      ),
    };
  }

  commercialSnapshot(input: AnalyticsPeriodInput, now = new Date()): AnalyticsCommercialSnapshot {
    const period = resolveAnalyticsPeriod(input, now);
    return {
      period,
      current: this.commercialStats(period.from, period.to),
      previous: this.commercialStats(period.comparisonFrom, period.comparisonTo),
      sources: this.commercialSources(period.from, period.to),
      previousSources: this.commercialSources(period.comparisonFrom, period.comparisonTo),
      lostReasons: this.lostReasons(period.from, period.to),
      previousLostReasons: this.lostReasons(period.comparisonFrom, period.comparisonTo),
      delays: this.commercialDelays(period.from, period.to),
      previousDelays: this.commercialDelays(period.comparisonFrom, period.comparisonTo),
    };
  }

  private commercialStats(from: string, to: string): AnalyticsCommercialPeriodStats {
    const newProspects = this.count(
      `SELECT COUNT(*) AS total FROM prospects
       WHERE date(created_at) BETWEEN date(?) AND date(?)`,
      [from, to],
    );
    const wonProspects = this.count(
      `SELECT COUNT(*) AS total FROM prospects
       WHERE won_at IS NOT NULL AND date(won_at) BETWEEN date(?) AND date(?)`,
      [from, to],
    );
    const lostProspects = this.count(
      `SELECT COUNT(*) AS total FROM prospects
       WHERE lost_at IS NOT NULL AND date(lost_at) BETWEEN date(?) AND date(?)`,
      [from, to],
    );
    const decidedProspects = wonProspects + lostProspects;

    const quotesCreated = this.count(
      `SELECT COUNT(*) AS total FROM quotes
       WHERE date(created_at) BETWEEN date(?) AND date(?)`,
      [from, to],
    );
    const quotesAccepted = this.count(
      `SELECT COUNT(*) AS total FROM quotes
       WHERE accepted_at IS NOT NULL AND date(accepted_at) BETWEEN date(?) AND date(?)`,
      [from, to],
    );
    const quotesRefused = this.count(
      `SELECT COUNT(*) AS total FROM quotes
       WHERE refused_at IS NOT NULL AND date(refused_at) BETWEEN date(?) AND date(?)`,
      [from, to],
    );
    const quotesExpired = this.count(
      `SELECT COUNT(*) AS total FROM quotes
       WHERE expired_at IS NOT NULL AND date(expired_at) BETWEEN date(?) AND date(?)`,
      [from, to],
    );
    const quoteDecisions = quotesAccepted + quotesRefused + quotesExpired;

    return {
      newProspects,
      wonProspects,
      lostProspects,
      decidedProspects,
      conversionPercent: decidedProspects > 0 ? (wonProspects / decidedProspects) * 100 : null,
      quotesCreated,
      quotesAccepted,
      quotesRefused,
      quotesExpired,
      quoteDecisions,
      quoteAcceptancePercent: quoteDecisions > 0 ? (quotesAccepted / quoteDecisions) * 100 : null,
    };
  }

  private commercialSources(from: string, to: string): AnalyticsCommercialSourceStat[] {
    const rows = this.database.all<SourceRow>(
      `WITH period_prospects AS (
         SELECT
           COALESCE(NULLIF(source, ''), 'not_set') AS source,
           CASE WHEN won_at IS NOT NULL AND date(won_at) BETWEEN date(?) AND date(?) THEN 1 ELSE 0 END AS won,
           CASE WHEN lost_at IS NOT NULL AND date(lost_at) BETWEEN date(?) AND date(?) THEN 1 ELSE 0 END AS lost,
           CASE WHEN date(created_at) BETWEEN date(?) AND date(?) THEN 1 ELSE 0 END AS created
         FROM prospects
         WHERE date(created_at) BETWEEN date(?) AND date(?)
            OR (won_at IS NOT NULL AND date(won_at) BETWEEN date(?) AND date(?))
            OR (lost_at IS NOT NULL AND date(lost_at) BETWEEN date(?) AND date(?))
       )
       SELECT source,
              SUM(created) AS prospect_count,
              SUM(won) AS won_count,
              SUM(lost) AS lost_count
       FROM period_prospects
       GROUP BY source
       ORDER BY prospect_count DESC, won_count DESC, source ASC`,
      [from, to, from, to, from, to, from, to, from, to, from, to],
    );

    return rows.map((row) => {
      const wonCount = Number(row.won_count ?? 0);
      const lostCount = Number(row.lost_count ?? 0);
      const decidedCount = wonCount + lostCount;
      return {
        source: row.source || 'not_set',
        prospectCount: Number(row.prospect_count ?? 0),
        wonCount,
        lostCount,
        decidedCount,
        conversionPercent: decidedCount > 0 ? (wonCount / decidedCount) * 100 : null,
      };
    });
  }

  private lostReasons(from: string, to: string): AnalyticsCommercialReasonStat[] {
    return this.database.all<ReasonRow>(
      `SELECT COALESCE(NULLIF(trim(lost_reason), ''), 'Non renseigné') AS reason, COUNT(*) AS total
       FROM prospects
       WHERE lost_at IS NOT NULL AND date(lost_at) BETWEEN date(?) AND date(?)
       GROUP BY COALESCE(NULLIF(trim(lost_reason), ''), 'Non renseigné')
       ORDER BY total DESC, reason ASC`,
      [from, to],
    ).map((row) => ({
      reason: row.reason || 'Non renseigné',
      count: Number(row.total ?? 0),
    }));
  }

  private commercialDelays(from: string, to: string): AnalyticsCommercialDelayStats {
    const prospectToQuote = this.database.get<DelayRow>(
      `WITH first_quotes AS (
         SELECT prospect_id, MIN(created_at) AS first_quote_at
         FROM quotes
         WHERE prospect_id IS NOT NULL
         GROUP BY prospect_id
       )
       SELECT AVG((julianday(first_quotes.first_quote_at) - julianday(prospects.created_at)) * 24.0) AS average_hours,
              COUNT(*) AS sample
       FROM first_quotes
       JOIN prospects ON prospects.id = first_quotes.prospect_id
       WHERE date(first_quotes.first_quote_at) BETWEEN date(?) AND date(?)`,
      [from, to],
    );

    const quoteToAcceptance = this.database.get<DelayRow>(
      `SELECT AVG((julianday(accepted_at) - julianday(created_at)) * 24.0) AS average_hours,
              COUNT(*) AS sample
       FROM quotes
       WHERE accepted_at IS NOT NULL
         AND date(accepted_at) BETWEEN date(?) AND date(?)`,
      [from, to],
    );

    return {
      prospectToQuoteHours: prospectToQuote?.average_hours == null ? null : Number(prospectToQuote.average_hours),
      prospectToQuoteSample: Number(prospectToQuote?.sample ?? 0),
      quoteToAcceptanceHours: quoteToAcceptance?.average_hours == null ? null : Number(quoteToAcceptance.average_hours),
      quoteToAcceptanceSample: Number(quoteToAcceptance?.sample ?? 0),
    };
  }

  private metricValue(
    definition: AnalyticsMetricDefinition,
    from: string,
    to: string,
    comparisonFrom: string,
    comparisonTo: string,
  ): AnalyticsFinancialMetricValue {
    if (!definition.available) {
      return {
        ...definition,
        currentCents: null,
        previousCents: null,
        deltaCents: null,
        deltaPercent: null,
      };
    }

    const currentCents = this.calculate(definition.key, from, to);
    const previousCents = this.calculate(definition.key, comparisonFrom, comparisonTo);
    const deltaCents = currentCents - previousCents;
    const deltaPercent = previousCents === 0
      ? null
      : ((currentCents - previousCents) / Math.abs(previousCents)) * 100;

    return {
      ...definition,
      currentCents,
      previousCents,
      deltaCents,
      deltaPercent,
    };
  }

  private calculate(metric: AnalyticsFinancialMetric, from: string, to: string): number {
    switch (metric) {
      case 'commercial_signed':
        return this.sum(
          `SELECT COALESCE(SUM(catalog_value_cents),0) AS total
           FROM quotes
           WHERE status='accepted' AND accepted_at IS NOT NULL
             AND date(accepted_at) BETWEEN date(?) AND date(?)`,
          [from, to],
        );
      case 'contract_signed':
        return this.sum(
          `SELECT COALESCE(SUM(contract_value_cents),0) AS total
           FROM quotes
           WHERE status='accepted' AND accepted_at IS NOT NULL
             AND date(accepted_at) BETWEEN date(?) AND date(?)`,
          [from, to],
        );
      case 'gifted_value':
        return this.sum(
          `SELECT COALESCE(SUM(MAX(catalog_value_cents - contract_value_cents, 0)),0) AS total
           FROM quotes
           WHERE status='accepted' AND accepted_at IS NOT NULL
             AND date(accepted_at) BETWEEN date(?) AND date(?)`,
          [from, to],
        );
      case 'commercial_delivered': {
        const projects = this.sum(
          `SELECT COALESCE(SUM(commercial_value_cents),0) AS total
           FROM projects
           WHERE status='completed' AND completed_at IS NOT NULL
             AND date(completed_at) BETWEEN date(?) AND date(?)`,
          [from, to],
        );
        const interventions = this.sum(
          `SELECT COALESCE(SUM(theoretical_value_cents),0) AS total
           FROM interventions
           WHERE status='completed' AND completed_at IS NOT NULL
             AND coverage_mode <> 'included_project'
             AND date(completed_at) BETWEEN date(?) AND date(?)`,
          [from, to],
        );
        return projects + interventions;
      }
      case 'invoiced_revenue':
      case 'cash_collected':
      case 'outstanding_revenue':
      case 'expenses':
        return 0;
      default: {
        const exhaustive: never = metric;
        throw new Error(`Indicateur financier inconnu : ${exhaustive}`);
      }
    }
  }

  private count(sql: string, params: Array<string | number | null>): number {
    const row = this.database.get<SumRow>(sql, params);
    return Number(row?.total ?? 0);
  }

  private sum(sql: string, params: Array<string | number | null>): number {
    const row = this.database.get<SumRow>(sql, params);
    return Number(row?.total ?? 0);
  }
}
