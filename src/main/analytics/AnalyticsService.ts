import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import {
  ANALYTICS_METRIC_DEFINITIONS,
  type AnalyticsFinancialMetric,
  type AnalyticsFinancialMetricValue,
  type AnalyticsFinancialSnapshot,
  type AnalyticsCommercialPeriodStats,
  type AnalyticsCommercialSnapshot,
  type AnalyticsMetricDefinition,
  type AnalyticsPeriodInput,
} from '../../shared/analytics';
import { resolveAnalyticsPeriod } from './AnalyticsPeriodService';

interface SumRow extends Record<string, unknown> {
  total: number | null;
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
