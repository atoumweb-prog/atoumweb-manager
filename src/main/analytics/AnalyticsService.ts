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
  type AnalyticsProjectEconomics,
  type AnalyticsProjectTimePeriodStats,
  type AnalyticsProjectTimeSnapshot,
  type AnalyticsProjectTypeStat,
  type AnalyticsTimeCategoryStat,
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

interface ProjectTimeRow extends Record<string, unknown> {
  projects_created: number;
  projects_completed: number;
  total_seconds: number | null;
  billable_seconds: number | null;
  non_billable_seconds: number | null;
  session_count: number;
}

interface CategoryTimeRow extends Record<string, unknown> {
  category: string;
  seconds: number | null;
  session_count: number;
}

interface ProjectEconomicsRow extends Record<string, unknown> {
  completed_project_sample: number;
  completed_with_time: number;
  tracked_seconds: number | null;
  estimated_seconds: number | null;
  estimate_tracked_seconds: number | null;
  estimate_sample: number;
  average_calendar_days: number | null;
  calendar_duration_sample: number;
  contract_value_cents: number | null;
  commercial_value_cents: number | null;
}

interface ProjectTypeRow extends Record<string, unknown> {
  project_type: string;
  completed_count: number;
  tracked_project_count: number;
  tracked_seconds: number | null;
  average_calendar_days: number | null;
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

  projectTimeSnapshot(input: AnalyticsPeriodInput, now = new Date()): AnalyticsProjectTimeSnapshot {
    const period = resolveAnalyticsPeriod(input, now);
    return {
      period,
      current: this.projectTimeStats(period.from, period.to),
      previous: this.projectTimeStats(period.comparisonFrom, period.comparisonTo),
      categories: this.timeCategories(period.from, period.to),
      previousCategories: this.timeCategories(period.comparisonFrom, period.comparisonTo),
      economics: this.projectEconomics(period.from, period.to),
      previousEconomics: this.projectEconomics(period.comparisonFrom, period.comparisonTo),
      projectTypes: this.projectTypes(period.from, period.to),
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

  private closedTimeCte(): string {
    return `
      WITH closed_sessions AS (
        SELECT
          ts.id,
          ts.project_id,
          ts.category,
          ts.billable,
          ts.started_at,
          MAX(
            0,
            CAST(strftime('%s', ts.ended_at) - strftime('%s', ts.started_at) AS INTEGER)
            - COALESCE((
              SELECT SUM(MAX(
                0,
                CAST(strftime('%s', COALESCE(p.ended_at, ts.ended_at)) - strftime('%s', p.started_at) AS INTEGER)
              ))
              FROM time_session_pauses p
              WHERE p.time_session_id = ts.id
            ), 0)
          ) AS duration_seconds
        FROM time_sessions ts
        WHERE ts.ended_at IS NOT NULL
      )
    `;
  }

  private projectTimeStats(from: string, to: string): AnalyticsProjectTimePeriodStats {
    const row = this.database.get<ProjectTimeRow>(
      `${this.closedTimeCte()}
       SELECT
         (SELECT COUNT(*) FROM projects WHERE date(created_at) BETWEEN date(?) AND date(?)) AS projects_created,
         (SELECT COUNT(*) FROM projects WHERE completed_at IS NOT NULL AND date(completed_at) BETWEEN date(?) AND date(?)) AS projects_completed,
         COALESCE(SUM(CASE WHEN date(started_at) BETWEEN date(?) AND date(?) THEN duration_seconds ELSE 0 END),0) AS total_seconds,
         COALESCE(SUM(CASE WHEN date(started_at) BETWEEN date(?) AND date(?) AND billable=1 THEN duration_seconds ELSE 0 END),0) AS billable_seconds,
         COALESCE(SUM(CASE WHEN date(started_at) BETWEEN date(?) AND date(?) AND billable=0 THEN duration_seconds ELSE 0 END),0) AS non_billable_seconds,
         SUM(CASE WHEN date(started_at) BETWEEN date(?) AND date(?) THEN 1 ELSE 0 END) AS session_count
       FROM closed_sessions`,
      [from, to, from, to, from, to, from, to, from, to, from, to],
    );

    return {
      projectsCreated: Number(row?.projects_created ?? 0),
      projectsCompleted: Number(row?.projects_completed ?? 0),
      totalSeconds: Number(row?.total_seconds ?? 0),
      billableSeconds: Number(row?.billable_seconds ?? 0),
      nonBillableSeconds: Number(row?.non_billable_seconds ?? 0),
      sessionCount: Number(row?.session_count ?? 0),
    };
  }

  private timeCategories(from: string, to: string): AnalyticsTimeCategoryStat[] {
    return this.database.all<CategoryTimeRow>(
      `${this.closedTimeCte()}
       SELECT category, COALESCE(SUM(duration_seconds),0) AS seconds, COUNT(*) AS session_count
       FROM closed_sessions
       WHERE date(started_at) BETWEEN date(?) AND date(?)
       GROUP BY category
       ORDER BY seconds DESC, category ASC`,
      [from, to],
    ).map((row) => ({
      category: row.category,
      seconds: Number(row.seconds ?? 0),
      sessionCount: Number(row.session_count ?? 0),
    }));
  }

  private projectEconomics(from: string, to: string): AnalyticsProjectEconomics {
    const row = this.database.get<ProjectEconomicsRow>(
      `${this.closedTimeCte()},
       project_time AS (
         SELECT project_id, SUM(duration_seconds) AS tracked_seconds
         FROM closed_sessions
         WHERE project_id IS NOT NULL
         GROUP BY project_id
       ),
       project_estimates AS (
         SELECT pn.project_id, SUM(COALESCE(pn.estimated_minutes,0) * 60) AS estimated_seconds
         FROM project_nodes pn
         WHERE pn.archived_at IS NULL AND (
           (EXISTS (SELECT 1 FROM project_action_instances a WHERE a.project_id=pn.project_id)
             AND pn.node_type IN ('task','checklist'))
           OR (NOT EXISTS (SELECT 1 FROM project_action_instances a WHERE a.project_id=pn.project_id)
             AND NOT EXISTS (SELECT 1 FROM project_nodes child WHERE child.parent_id=pn.id AND child.archived_at IS NULL))
         )
         AND NOT EXISTS (
           SELECT 1 FROM project_action_instances a JOIN project_nodes n ON n.id=a.project_node_id
           WHERE a.project_id=pn.project_id AND n.archived_at IS NULL
             AND json_extract(a.initial_snapshot_json,'$.estimateRequired')=1
             AND json_extract(a.initial_snapshot_json,'$.action') IS NOT NULL AND n.estimated_minutes IS NULL
         )
         GROUP BY pn.project_id
       ),
       completed AS (
         SELECT
           p.id,
           p.contract_value_cents,
           p.commercial_value_cents,
           p.created_at,
           p.start_date,
           p.completed_at,
           COALESCE(pt.tracked_seconds,0) AS tracked_seconds,
           COALESCE(pe.estimated_seconds,0) AS estimated_seconds
         FROM projects p
         LEFT JOIN project_time pt ON pt.project_id=p.id
         LEFT JOIN project_estimates pe ON pe.project_id=p.id
         WHERE p.completed_at IS NOT NULL
           AND date(p.completed_at) BETWEEN date(?) AND date(?)
       )
       SELECT
         COUNT(*) AS completed_project_sample,
         SUM(CASE WHEN tracked_seconds > 0 THEN 1 ELSE 0 END) AS completed_with_time,
         COALESCE(SUM(CASE WHEN tracked_seconds > 0 THEN tracked_seconds ELSE 0 END),0) AS tracked_seconds,
         COALESCE(SUM(CASE WHEN estimated_seconds > 0 AND tracked_seconds > 0 THEN estimated_seconds ELSE 0 END),0) AS estimated_seconds,
         COALESCE(SUM(CASE WHEN estimated_seconds > 0 AND tracked_seconds > 0 THEN tracked_seconds ELSE 0 END),0) AS estimate_tracked_seconds,
         SUM(CASE WHEN estimated_seconds > 0 AND tracked_seconds > 0 THEN 1 ELSE 0 END) AS estimate_sample,
         AVG(
           CASE WHEN completed_at IS NOT NULL
             THEN MAX(0, julianday(completed_at) - julianday(COALESCE(NULLIF(start_date,''), created_at)))
             ELSE NULL END
         ) AS average_calendar_days,
         COUNT(*) AS calendar_duration_sample,
         COALESCE(SUM(CASE WHEN tracked_seconds > 0 THEN contract_value_cents ELSE 0 END),0) AS contract_value_cents,
         COALESCE(SUM(CASE WHEN tracked_seconds > 0 THEN commercial_value_cents ELSE 0 END),0) AS commercial_value_cents
       FROM completed`,
      [from, to],
    );

    const trackedSeconds = Number(row?.tracked_seconds ?? 0);
    const contractValueCents = Number(row?.contract_value_cents ?? 0);
    const commercialValueCents = Number(row?.commercial_value_cents ?? 0);
    const hours = trackedSeconds / 3600;

    return {
      completedProjectSample: Number(row?.completed_project_sample ?? 0),
      completedProjectsWithTrackedTime: Number(row?.completed_with_time ?? 0),
      trackedSeconds,
      estimatedSeconds: Number(row?.estimated_seconds ?? 0),
      estimateTrackedSeconds: Number(row?.estimate_tracked_seconds ?? 0),
      estimateSample: Number(row?.estimate_sample ?? 0),
      averageCalendarDays: row?.average_calendar_days == null ? null : Number(row.average_calendar_days),
      calendarDurationSample: Number(row?.calendar_duration_sample ?? 0),
      contractValueCents,
      commercialValueCents,
      contractHourlyCents: hours > 0 ? contractValueCents / hours : null,
      commercialHourlyCents: hours > 0 ? commercialValueCents / hours : null,
    };
  }

  private projectTypes(from: string, to: string): AnalyticsProjectTypeStat[] {
    return this.database.all<ProjectTypeRow>(
      `${this.closedTimeCte()},
       project_time AS (
         SELECT project_id, SUM(duration_seconds) AS tracked_seconds
         FROM closed_sessions
         WHERE project_id IS NOT NULL
         GROUP BY project_id
       )
       SELECT
         p.project_type,
         COUNT(*) AS completed_count,
         SUM(CASE WHEN COALESCE(pt.tracked_seconds,0) > 0 THEN 1 ELSE 0 END) AS tracked_project_count,
         COALESCE(SUM(pt.tracked_seconds),0) AS tracked_seconds,
         AVG(MAX(0, julianday(p.completed_at) - julianday(COALESCE(NULLIF(p.start_date,''), p.created_at)))) AS average_calendar_days
       FROM projects p
       LEFT JOIN project_time pt ON pt.project_id=p.id
       WHERE p.completed_at IS NOT NULL
         AND date(p.completed_at) BETWEEN date(?) AND date(?)
       GROUP BY p.project_type
       ORDER BY completed_count DESC, p.project_type ASC`,
      [from, to],
    ).map((row) => ({
      projectType: row.project_type,
      completedCount: Number(row.completed_count ?? 0),
      trackedProjectCount: Number(row.tracked_project_count ?? 0),
      trackedSeconds: Number(row.tracked_seconds ?? 0),
      averageCalendarDays: row.average_calendar_days == null ? null : Number(row.average_calendar_days),
    }));
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
        return this.sum(
          `SELECT COALESCE(SUM(expected_amount_cents),0) AS total FROM billing_items
           WHERE status='invoiced' AND date(invoiced_at) BETWEEN date(?) AND date(?)`, [from,to],
        );
      case 'expenses':
        return this.sum(
          `SELECT COALESCE(SUM(amount_cents),0) AS total FROM expenses
           WHERE status<>'cancelled' AND date(expense_date) BETWEEN date(?) AND date(?)`, [from,to],
        );
      case 'cash_collected':
      case 'outstanding_revenue':
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
