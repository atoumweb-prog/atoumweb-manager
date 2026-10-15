export const SERVICE_REQUEST_SOURCES = ['email', 'phone', 'website_form', 'message', 'meeting', 'atoumweb_detection', 'other'] as const;
export const SERVICE_REQUEST_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;
export const SERVICE_REQUEST_STATUSES = ['new', 'to_qualify', 'waiting_client', 'planned', 'converted', 'closed', 'archived'] as const;
export const INTERVENTION_TYPES = ['correction', 'modification', 'addition', 'maintenance', 'incident', 'support', 'training', 'other'] as const;
export const INTERVENTION_STATUSES = ['to_plan', 'planned', 'in_progress', 'waiting_client', 'blocked', 'to_validate', 'completed', 'cancelled', 'archived'] as const;
export const INTERVENTION_COVERAGE_MODES = ['maintenance', 'hour_pack', 'out_of_scope', 'commercial_gesture', 'included_project', 'internal'] as const;
export const INCIDENT_CRITICALITIES = ['normal', 'urgent', 'critical'] as const;
export const MAINTENANCE_FREQUENCIES = ['monthly', 'quarterly', 'yearly'] as const;
export const MAINTENANCE_CARRYOVER_MODES = ['none', 'next_period', 'custom'] as const;
export const MAINTENANCE_PLAN_STATUSES = ['active', 'archived'] as const;
export const MAINTENANCE_SUBSCRIPTION_STATUSES = ['active', 'suspended', 'ended', 'archived'] as const;
export const MAINTENANCE_PERIOD_STATUSES = ['upcoming', 'open', 'to_do', 'in_progress', 'completed', 'closed'] as const;
export const MAINTENANCE_CHECK_STATUSES = ['todo', 'done', 'not_applicable'] as const;
export const HOUR_PACK_STATUSES = ['active', 'exhausted', 'expired', 'suspended', 'archived'] as const;
export const HOUR_PACK_MOVEMENT_TYPES = ['initial_credit', 'intervention_debit', 'manual_correction', 'commercial_credit', 'reversal'] as const;

export type ServiceRequestSource = (typeof SERVICE_REQUEST_SOURCES)[number];
export type ServiceRequestPriority = (typeof SERVICE_REQUEST_PRIORITIES)[number];
export type ServiceRequestStatus = (typeof SERVICE_REQUEST_STATUSES)[number];
export type InterventionType = (typeof INTERVENTION_TYPES)[number];
export type InterventionStatus = (typeof INTERVENTION_STATUSES)[number];
export type InterventionCoverageMode = (typeof INTERVENTION_COVERAGE_MODES)[number];
export type IncidentCriticality = (typeof INCIDENT_CRITICALITIES)[number];
export type MaintenanceFrequency = (typeof MAINTENANCE_FREQUENCIES)[number];
export type MaintenanceCarryoverMode = (typeof MAINTENANCE_CARRYOVER_MODES)[number];
export type MaintenancePlanStatus = (typeof MAINTENANCE_PLAN_STATUSES)[number];
export type MaintenanceSubscriptionStatus = (typeof MAINTENANCE_SUBSCRIPTION_STATUSES)[number];
export type MaintenancePeriodStatus = (typeof MAINTENANCE_PERIOD_STATUSES)[number];
export type MaintenanceCheckStatus = (typeof MAINTENANCE_CHECK_STATUSES)[number];
export type HourPackStatus = (typeof HOUR_PACK_STATUSES)[number];
export type HourPackMovementType = (typeof HOUR_PACK_MOVEMENT_TYPES)[number];

export interface ServiceRequestInput {
  clientAccountId: string;
  projectId?: string | null;
  source?: ServiceRequestSource;
  subject: string;
  description?: string | null;
  priority?: ServiceRequestPriority;
  receivedAt?: string | null;
  nextActionAt?: string | null;
  nextActionText?: string | null;
  notes?: string | null;
}

export interface ServiceRequest extends ServiceRequestInput {
  id: string;
  source: ServiceRequestSource;
  priority: ServiceRequestPriority;
  status: ServiceRequestStatus;
  clientLabel: string;
  projectLabel?: string | null;
  interventionId?: string | null;
  closeReason?: string | null;
  receivedAt: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
}

export interface ServiceRequestFilters {
  search?: string | null;
  clientAccountId?: string | null;
  projectId?: string | null;
  status?: ServiceRequestStatus | null;
  priority?: ServiceRequestPriority | null;
  includeArchived?: boolean;
}

export interface InterventionInput {
  estimatedMinutes?:number|null;
  clientAccountId: string;
  projectId?: string | null;
  projectNodeId?: string | null;
  sourceRequestId?: string | null;
  maintenancePeriodId?: string | null;
  hourPackId?: string | null;
  type?: InterventionType;
  status?: InterventionStatus;
  coverageMode?: InterventionCoverageMode;
  subject: string;
  description?: string | null;
  priority?: ServiceRequestPriority;
  scheduledAt?: string | null;
  theoreticalValueCents?: number;
  billableAmountCents?: number;
  notes?: string | null;
  incidentCriticality?: IncidentCriticality | null;
  incidentStartedAt?: string | null;
  incidentResolvedAt?: string | null;
  downtimeMinutes?: number | null;
  incidentCause?: string | null;
  incidentDiagnosis?: string | null;
  incidentSolution?: string | null;
  incidentFollowUp?: string | null;
}

export interface Intervention extends InterventionInput {
  referenceMinutes?:number|null;
  operationalChecklist?:import('./operational').OperationalAction[];
  id: string;
  number: string;
  type: InterventionType;
  status: InterventionStatus;
  coverageMode: InterventionCoverageMode;
  priority: ServiceRequestPriority;
  clientLabel: string;
  projectLabel?: string | null;
  projectNodeLabel?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  totalTimeSeconds: number;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
}

export interface InterventionFilters {
  search?: string | null;
  clientAccountId?: string | null;
  projectId?: string | null;
  status?: InterventionStatus | null;
  type?: InterventionType | null;
  coverageMode?: InterventionCoverageMode | null;
  maintenancePeriodId?: string | null;
  hourPackId?: string | null;
  includeArchived?: boolean;
}

export interface TransformRequestToInterventionInput {
  requestId: string;
  type?: InterventionType;
  coverageMode?: InterventionCoverageMode;
  projectNodeId?: string | null;
  scheduledAt?: string | null;
  theoreticalValueCents?: number;
  billableAmountCents?: number;
}

export interface MaintenancePlanInput {
  name: string;
  periodicPriceCents: number;
  frequency?: MaintenanceFrequency;
  includedInterventions?: number;
  includedMinutes?: number | null;
  carryoverMode?: MaintenanceCarryoverMode;
  checklistTemplateId?: string | null;
  notes?: string | null;
}

export interface MaintenancePlan extends MaintenancePlanInput {
  id: string;
  frequency: MaintenanceFrequency;
  includedInterventions: number;
  includedMinutes?: number | null;
  carryoverMode: MaintenanceCarryoverMode;
  status: MaintenancePlanStatus;
  checklistTemplateName?: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
}

export interface MaintenanceSubscriptionInput {
  clientAccountId: string;
  projectId?: string | null;
  planId: string;
  startDate: string;
  endDate?: string | null;
  contractPriceCents?: number | null;
  notes?: string | null;
}

export interface MaintenanceSubscription extends MaintenanceSubscriptionInput {
  canonicalCode?:string|null;
  billingPeriod?:'monthly'|'yearly'|'once'|null;
  periodAlignment?: 'calendar' | 'anniversary';
  id: string;
  clientLabel: string;
  projectLabel?: string | null;
  planName: string;
  frequency: MaintenanceFrequency;
  includedInterventions: number;
  includedMinutes?: number | null;
  catalogPriceCents: number;
  contractPriceCents: number;
  status: MaintenanceSubscriptionStatus;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
}

export interface MaintenanceSubscriptionFilters {
  clientAccountId?: string | null;
  projectId?: string | null;
  status?: MaintenanceSubscriptionStatus | null;
  includeArchived?: boolean;
}

export interface MaintenanceCheck {
  operationalSaleId?:string|null;
  estimateRequired?:boolean;
  referenceMinutes?:number|null;
  businessCategory?:import('./operational').BusinessTimeCategory|null;
  routineInterventionId?:string|null;
  id: string;
  periodId: string;
  templateItemId?: string | null;
  label: string;
  description?: string | null;
  sortOrder: number;
  required: boolean;
  status: MaintenanceCheckStatus;
  completedAt?: string | null;
  notes?: string | null;
}

export interface MaintenancePeriodUsage {
  routineSeconds?:number;
  interventionCount: number;
  usedSeconds: number;
  remainingInterventions: number | null;
  remainingSeconds: number | null;
  interventionsOverQuota: number;
  secondsOverQuota: number;
}

export interface MaintenancePeriod {
  id: string;
  subscriptionId: string;
  periodStart: string;
  periodEnd: string;
  includedInterventions: number;
  includedMinutes?: number | null;
  status: MaintenancePeriodStatus;
  closedAt?: string | null;
  notes?: string | null;
  checks: MaintenanceCheck[];
  usage: MaintenancePeriodUsage;
  createdAt: string;
  updatedAt: string;
}

export interface HourPackInput {
  clientAccountId: string;
  projectId?: string | null;
  name: string;
  purchasedSeconds: number;
  contractPriceCents: number;
  purchasedAt?: string | null;
  expiresAt?: string | null;
  notes?: string | null;
}

export interface HourPackMovement {
  id: string;
  packId: string;
  interventionId?: string | null;
  timeSessionId?: string | null;
  reversalOfMovementId?: string | null;
  type: HourPackMovementType;
  secondsDelta: number;
  reason: string;
  sourceKey?: string | null;
  createdAt: string;
}

export interface HourPack extends HourPackInput {
  id: string;
  clientLabel: string;
  projectLabel?: string | null;
  status: HourPackStatus;
  balanceSeconds: number;
  consumedSeconds: number;
  movements: HourPackMovement[];
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
}

export interface HourPackFilters {
  clientAccountId?: string | null;
  projectId?: string | null;
  status?: HourPackStatus | null;
  includeArchived?: boolean;
}

/** Projection en lecture seule, calculée par le même service que le débit réel.
 * État instantané : la clôture revalide toujours le pack et le temps. */
export interface HourPackDebitPreview {
  packId: string;
  interventionId: string;
  packName: string;
  packStatus: HourPackStatus;
  balanceBeforeSeconds: number;
  secondsToDebit: number;
  balanceAfterSeconds: number;
  alreadyDebited: boolean;
}

export interface HourPackMovementInput {
  secondsDelta: number;
  reason: string;
  type?: Extract<HourPackMovementType, 'manual_correction' | 'commercial_credit'>;
  interventionId?: string | null;
  timeSessionId?: string | null;
}

export interface OperationsApi {
  requests: {
    list(filters?: ServiceRequestFilters): Promise<ServiceRequest[]>;
    get(id: string): Promise<ServiceRequest>;
    create(input: ServiceRequestInput): Promise<ServiceRequest>;
    update(id: string, input: Partial<ServiceRequestInput>): Promise<ServiceRequest>;
    changeStatus(id: string, status: ServiceRequestStatus): Promise<ServiceRequest>;
    closeWithoutIntervention(id: string, reason?: string | null): Promise<ServiceRequest>;
    transform(input: TransformRequestToInterventionInput): Promise<Intervention>;
  };
  interventions: {
    list(filters?: InterventionFilters): Promise<Intervention[]>;
    get(id: string): Promise<Intervention>;
    create(input: InterventionInput): Promise<Intervention>;
    update(id: string, input: Partial<InterventionInput>): Promise<Intervention>;
    changeStatus(id: string, status: InterventionStatus): Promise<Intervention>;
    complete(id: string): Promise<Intervention>;
  };
  maintenance: {
    plans: {
      list(includeArchived?: boolean): Promise<MaintenancePlan[]>;
      create(input: MaintenancePlanInput): Promise<MaintenancePlan>;
      update(id: string, input: Partial<MaintenancePlanInput>): Promise<MaintenancePlan>;
      archive(id: string): Promise<MaintenancePlan>;
    };
    subscriptions: {
      list(filters?: MaintenanceSubscriptionFilters): Promise<MaintenanceSubscription[]>;
      create(input: MaintenanceSubscriptionInput): Promise<MaintenanceSubscription>;
      changeStatus(id: string, status: MaintenanceSubscriptionStatus): Promise<MaintenanceSubscription>;
    };
    periods: {
      prepareRoutine(checkId:string):Promise<Intervention>;
      list(subscriptionId: string): Promise<MaintenancePeriod[]>;
      ensure(subscriptionId: string, referenceDate?: string | null): Promise<MaintenancePeriod>;
      changeStatus(id: string, status: MaintenancePeriodStatus): Promise<MaintenancePeriod>;
      updateCheck(id: string, status: MaintenanceCheckStatus, notes?: string | null): Promise<MaintenancePeriod>;
    };
  };
  hourPacks: {
    list(filters?: HourPackFilters): Promise<HourPack[]>;
    get(id: string): Promise<HourPack>;
    create(input: HourPackInput): Promise<HourPack>;
    changeStatus(id: string, status: HourPackStatus): Promise<HourPack>;
    addMovement(id: string, input: HourPackMovementInput): Promise<HourPack>;
    previewInterventionDebit(packId: string, interventionId: string): Promise<HourPackDebitPreview>;
    debitIntervention(packId: string, interventionId: string): Promise<HourPack>;
    reverseMovement(movementId: string, reason: string): Promise<HourPack>;
  };
}
