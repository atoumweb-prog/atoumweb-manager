export const SERVICE_REQUEST_SOURCES = ['email', 'phone', 'website_form', 'message', 'meeting', 'atoumweb_detection', 'other'] as const;
export const SERVICE_REQUEST_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;
export const SERVICE_REQUEST_STATUSES = ['new', 'to_qualify', 'waiting_client', 'planned', 'converted', 'closed', 'archived'] as const;
export const INTERVENTION_TYPES = ['correction', 'modification', 'addition', 'maintenance', 'incident', 'support', 'training', 'other'] as const;
export const INTERVENTION_STATUSES = ['to_plan', 'planned', 'in_progress', 'waiting_client', 'blocked', 'to_validate', 'completed', 'cancelled', 'archived'] as const;
export const INTERVENTION_COVERAGE_MODES = ['maintenance', 'hour_pack', 'out_of_scope', 'commercial_gesture', 'included_project', 'internal'] as const;
export const INCIDENT_CRITICALITIES = ['normal', 'urgent', 'critical'] as const;

export type ServiceRequestSource = (typeof SERVICE_REQUEST_SOURCES)[number];
export type ServiceRequestPriority = (typeof SERVICE_REQUEST_PRIORITIES)[number];
export type ServiceRequestStatus = (typeof SERVICE_REQUEST_STATUSES)[number];
export type InterventionType = (typeof INTERVENTION_TYPES)[number];
export type InterventionStatus = (typeof INTERVENTION_STATUSES)[number];
export type InterventionCoverageMode = (typeof INTERVENTION_COVERAGE_MODES)[number];
export type IncidentCriticality = (typeof INCIDENT_CRITICALITIES)[number];

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
  clientAccountId: string;
  projectId?: string | null;
  projectNodeId?: string | null;
  sourceRequestId?: string | null;
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
  };
}
