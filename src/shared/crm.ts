export const PROSPECT_STAGES = [
  'new',
  'qualifying',
  'need_identified',
  'quote_to_prepare',
  'quote_sent',
  'follow_up',
  'negotiation',
  'waiting',
  'won',
  'lost',
] as const;

export const PROSPECT_TEMPERATURES = ['cold', 'warm', 'hot'] as const;
export const PROSPECT_SOURCES = [
  'website',
  'referral',
  'google',
  'social',
  'event',
  'outbound',
  'former_client',
  'other',
] as const;
export const CLIENT_STATUSES = ['active', 'inactive', 'archived'] as const;
export const CLIENT_CONTACT_ROLES = ['primary', 'administrative', 'billing', 'technical', 'other'] as const;

export type ProspectStage = (typeof PROSPECT_STAGES)[number];
export type ProspectTemperature = (typeof PROSPECT_TEMPERATURES)[number];
export type ProspectSource = (typeof PROSPECT_SOURCES)[number];
export type ClientStatus = (typeof CLIENT_STATUSES)[number];
export type ClientContactRole = (typeof CLIENT_CONTACT_ROLES)[number];

export interface OrganizationInput {
  name: string;
  legalName?: string | null;
  siret?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
  industry?: string | null;
  notes?: string | null;
}

export interface Organization extends OrganizationInput {
  id: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
}

export interface ContactInput {
  organizationId?: string | null;
  firstName: string;
  lastName: string;
  jobTitle?: string | null;
  email?: string | null;
  phone?: string | null;
  preferredChannel?: string | null;
  notes?: string | null;
}

export interface Contact extends ContactInput {
  id: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
}

export interface ProspectInput {
  organizationId?: string | null;
  contactId?: string | null;
  stage?: ProspectStage;
  temperature?: ProspectTemperature;
  source?: ProspectSource | null;
  sourceDetail?: string | null;
  primaryNeed?: string | null;
  secondaryNeed?: string | null;
  budgetMinCents?: number | null;
  budgetMaxCents?: number | null;
  estimatedValueCents?: number | null;
  probabilityPercent?: number | null;
  nextActionAt?: string | null;
  nextActionText?: string | null;
  targetDate?: string | null;
  notes?: string | null;
}

export interface ProspectSummary extends ProspectInput {
  id: string;
  clientAccountId?: string | null;
  lostReason?: string | null;
  wonAt?: string | null;
  lostAt?: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
  displayName: string;
  secondaryLabel?: string | null;
}

export interface ProspectFilters {
  stage?: ProspectStage | null;
  includeArchived?: boolean;
  search?: string | null;
}

export interface ClientInput {
  organizationId?: string | null;
  primaryContactId?: string | null;
  status?: ClientStatus;
  nextActionAt?: string | null;
  nextActionText?: string | null;
  notes?: string | null;
}

export interface ClientSummary extends ClientInput {
  id: string;
  becameClientAt: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
  displayName: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface ClientFilters {
  status?: ClientStatus | null;
  includeArchived?: boolean;
  search?: string | null;
}

export interface ActivityEvent {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  summary: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface SearchResult {
  entityType: 'prospect' | 'client' | 'organization' | 'contact';
  entityId: string;
  title: string;
  subtitle?: string | null;
  status?: string | null;
}

export interface ConvertProspectResult {
  prospectId: string;
  clientId: string;
  createdClient: boolean;
}

export interface CrmApi {
  organizations: {
    create(input: OrganizationInput): Promise<Organization>;
    update(id: string, input: OrganizationInput): Promise<Organization>;
  };
  contacts: {
    create(input: ContactInput): Promise<Contact>;
    update(id: string, input: ContactInput): Promise<Contact>;
  };
  prospects: {
    list(filters?: ProspectFilters): Promise<ProspectSummary[]>;
    create(input: ProspectInput): Promise<ProspectSummary>;
    update(id: string, input: ProspectInput): Promise<ProspectSummary>;
    changeStage(id: string, stage: ProspectStage, lostReason?: string | null): Promise<ProspectSummary>;
    setNextAction(id: string, at: string | null, text: string | null): Promise<ProspectSummary>;
    convertToClient(id: string): Promise<ConvertProspectResult>;
  };
  clients: {
    list(filters?: ClientFilters): Promise<ClientSummary[]>;
    create(input: ClientInput): Promise<ClientSummary>;
    update(id: string, input: ClientInput): Promise<ClientSummary>;
    archive(id: string): Promise<ClientSummary>;
    reactivate(id: string, status: Exclude<ClientStatus, 'archived'>): Promise<ClientSummary>;
  };
  activity: {
    list(entityType: string, entityId: string): Promise<ActivityEvent[]>;
  };
  search: {
    global(query: string): Promise<SearchResult[]>;
    rebuild(): Promise<{ indexed: number }>;
  };
}
