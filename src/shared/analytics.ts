export const ANALYTICS_PERIOD_PRESETS = [
  'today',
  'week',
  'month',
  'quarter',
  'year',
  'previous_year',
  'custom',
] as const;

export type AnalyticsPeriodPreset = (typeof ANALYTICS_PERIOD_PRESETS)[number];

export interface AnalyticsPeriodInput {
  preset: AnalyticsPeriodPreset;
  from?: string | null;
  to?: string | null;
}

export interface AnalyticsDateRange {
  preset: AnalyticsPeriodPreset;
  from: string;
  to: string;
  comparisonFrom: string;
  comparisonTo: string;
}

/** Validation côté vue ; l'IPC revalide toujours la période avant les requêtes SQL. */
export function validateAnalyticsCustomPeriod(input: AnalyticsPeriodInput): string | null {
  if (input.preset !== 'custom' || !input.from || !input.to) return null;
  const parse = (value: string): boolean => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  };
  if (!parse(input.from) || !parse(input.to)) return 'Choisis des dates valides pour la période personnalisée.';
  if (input.from > input.to) return 'La date de début doit précéder ou égaler la date de fin.';
  return null;
}

/** Permet d'identifier des chiffres d'une sélection précédente sans les attribuer au nouveau filtre. */
export function analyticsSnapshotMatchesSelection(input: AnalyticsPeriodInput, actual: AnalyticsDateRange): boolean {
  if (input.preset !== actual.preset) return false;
  return input.preset !== 'custom' || (input.from === actual.from && input.to === actual.to);
}

export const ANALYTICS_FINANCIAL_METRICS = [
  'commercial_signed',
  'contract_signed',
  'commercial_delivered',
  'invoiced_revenue',
  'cash_collected',
  'outstanding_revenue',
  'expenses',
  'gifted_value',
] as const;

export type AnalyticsFinancialMetric = (typeof ANALYTICS_FINANCIAL_METRICS)[number];

export interface AnalyticsMetricDefinition {
  key: AnalyticsFinancialMetric;
  label: string;
  source: string;
  businessDate: string;
  available: boolean;
  note: string;
}

export const ANALYTICS_METRIC_DEFINITIONS: readonly AnalyticsMetricDefinition[] = [
  {
    key: 'commercial_signed',
    label: 'Valeur commerciale signée',
    source: 'quotes.catalog_value_cents',
    businessDate: 'quotes.accepted_at',
    available: true,
    note: 'Somme des valeurs catalogue historiques des devis acceptés.',
  },
  {
    key: 'contract_signed',
    label: 'Valeur contractuelle signée',
    source: 'quotes.contract_value_cents',
    businessDate: 'quotes.accepted_at',
    available: true,
    note: 'Somme des montants réellement convenus des devis acceptés.',
  },
  {
    key: 'commercial_delivered',
    label: 'Valeur commerciale livrée',
    source: 'projects.commercial_value_cents + interventions.theoretical_value_cents',
    businessDate: 'projects.completed_at / interventions.completed_at',
    available: true,
    note: 'Les interventions déjà incluses dans un projet ne doivent jamais être comptées une seconde fois.',
  },
  {
    key: 'invoiced_revenue',
    label: 'Facturé suivi (Abby)',
    source: 'billing_items.expected_amount_cents',
    businessDate: 'billing_items.invoiced_at',
    available: true,
    note: 'Factures Abby enregistrées dans le suivi Manager ; aucune déduction d’encaissement.',
  },
  {
    key: 'cash_collected',
    label: 'CA encaissé',
    source: 'payments.amount_cents',
    businessDate: 'payments.paid_at',
    available: false,
    note: 'Bloqué tant que la table/source payments de la Phase 5 n’est pas intégrée.',
  },
  {
    key: 'outstanding_revenue',
    label: 'Reste à encaisser',
    source: 'invoices - payments',
    businessDate: 'invoice_date / paid_at',
    available: false,
    note: 'Dépend des sources factures et paiements de la Phase 5.',
  },
  {
    key: 'expenses',
    label: 'Dépenses',
    source: 'expenses',
    businessDate: 'expense_date',
    available: true,
    note: 'Dépenses enregistrées hors annulations, selon leur date de dépense ; pas uniquement les paiements.',
  },
  {
    key: 'gifted_value',
    label: 'Valeur offerte',
    source: 'quotes.catalog_value_cents - quotes.contract_value_cents',
    businessDate: 'quotes.accepted_at',
    available: true,
    note: 'Différence documentée sur les devis acceptés ; jamais déduite automatiquement d’une facture.',
  },
] as const;


export interface AnalyticsFinancialMetricValue {
  key: AnalyticsFinancialMetric;
  label: string;
  source: string;
  businessDate: string;
  available: boolean;
  currentCents: number | null;
  previousCents: number | null;
  deltaCents: number | null;
  deltaPercent: number | null;
  note: string;
}

export interface AnalyticsFinancialSnapshot {
  period: AnalyticsDateRange;
  metrics: AnalyticsFinancialMetricValue[];
}

export interface AnalyticsApi {
  financialSnapshot(input: AnalyticsPeriodInput): Promise<AnalyticsFinancialSnapshot>;
  commercialSnapshot(input: AnalyticsPeriodInput): Promise<AnalyticsCommercialSnapshot>;
  projectTimeSnapshot(input: AnalyticsPeriodInput): Promise<AnalyticsProjectTimeSnapshot>;
  definitions(): Promise<AnalyticsMetricDefinition[]>;
}


export interface AnalyticsCommercialPeriodStats {
  newProspects: number;
  wonProspects: number;
  lostProspects: number;
  decidedProspects: number;
  conversionPercent: number | null;
  quotesCreated: number;
  quotesAccepted: number;
  quotesRefused: number;
  quotesExpired: number;
  quoteDecisions: number;
  quoteAcceptancePercent: number | null;
}

export interface AnalyticsCommercialSourceStat {
  source: string;
  prospectCount: number;
  wonCount: number;
  lostCount: number;
  decidedCount: number;
  conversionPercent: number | null;
}

export interface AnalyticsCommercialReasonStat {
  reason: string;
  count: number;
}

export interface AnalyticsCommercialDelayStats {
  prospectToQuoteHours: number | null;
  prospectToQuoteSample: number;
  quoteToAcceptanceHours: number | null;
  quoteToAcceptanceSample: number;
}

export interface AnalyticsCommercialSnapshot {
  period: AnalyticsDateRange;
  current: AnalyticsCommercialPeriodStats;
  previous: AnalyticsCommercialPeriodStats;
  sources: AnalyticsCommercialSourceStat[];
  previousSources: AnalyticsCommercialSourceStat[];
  lostReasons: AnalyticsCommercialReasonStat[];
  previousLostReasons: AnalyticsCommercialReasonStat[];
  delays: AnalyticsCommercialDelayStats;
  previousDelays: AnalyticsCommercialDelayStats;
}


export interface AnalyticsTimeCategoryStat {
  category: string;
  seconds: number;
  sessionCount: number;
}

export interface AnalyticsProjectTimePeriodStats {
  projectsCreated: number;
  projectsCompleted: number;
  totalSeconds: number;
  billableSeconds: number;
  nonBillableSeconds: number;
  sessionCount: number;
}

export interface AnalyticsProjectEconomics {
  completedProjectSample: number;
  completedProjectsWithTrackedTime: number;
  trackedSeconds: number;
  estimatedSeconds: number;
  estimateTrackedSeconds: number;
  estimateSample: number;
  averageCalendarDays: number | null;
  calendarDurationSample: number;
  contractValueCents: number;
  commercialValueCents: number;
  contractHourlyCents: number | null;
  commercialHourlyCents: number | null;
}

export interface AnalyticsProjectTypeStat {
  projectType: string;
  completedCount: number;
  trackedProjectCount: number;
  trackedSeconds: number;
  averageCalendarDays: number | null;
}

export interface AnalyticsProjectTimeSnapshot {
  period: AnalyticsDateRange;
  current: AnalyticsProjectTimePeriodStats;
  previous: AnalyticsProjectTimePeriodStats;
  categories: AnalyticsTimeCategoryStat[];
  previousCategories: AnalyticsTimeCategoryStat[];
  economics: AnalyticsProjectEconomics;
  previousEconomics: AnalyticsProjectEconomics;
  projectTypes: AnalyticsProjectTypeStat[];
}
