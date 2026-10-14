export const PROSPECT_STAGES = [
  'new', 'qualifying', 'need_identified', 'quote_to_prepare', 'quote_to_send', 'quote_sent', 'follow_up', 'negotiation', 'waiting', 'won', 'lost',
] as const;
export const PROSPECT_TEMPERATURES = ['cold', 'neutral', 'warm', 'hot'] as const;
export const PROSPECT_SOURCES = ['website', 'referral', 'google', 'social', 'event', 'outbound', 'former_client', 'other'] as const;
export const PROSPECT_ORIGINS = ['outbound', 'inbound', 'referral', 'existing', 'partner', 'other'] as const;
export const PROSPECT_INTEREST_LEVELS = ['none', 'low', 'confirm', 'interested', 'very_interested'] as const;
export const CLIENT_STATUSES = ['active', 'inactive', 'archived'] as const;
export const CLIENT_CONTACT_ROLES = ['primary', 'administrative', 'billing', 'technical', 'other'] as const;
export const CRM_ACTION_TYPES = ['action', 'follow_up'] as const;
export const CRM_ACTION_STATUSES = ['open', 'done', 'cancelled'] as const;
export const CRM_ACTION_OWNER_TYPES = ['prospect', 'client'] as const;

export type ProspectStage = (typeof PROSPECT_STAGES)[number];
export type ProspectTemperature = (typeof PROSPECT_TEMPERATURES)[number];
export type ProspectSource = (typeof PROSPECT_SOURCES)[number];
export type ProspectOrigin = (typeof PROSPECT_ORIGINS)[number];
export type ProspectInterestLevel = (typeof PROSPECT_INTEREST_LEVELS)[number];
export type ClientStatus = (typeof CLIENT_STATUSES)[number];
export type ClientContactRole = (typeof CLIENT_CONTACT_ROLES)[number];
export type CrmActionType = (typeof CRM_ACTION_TYPES)[number];
export type CrmActionStatus = (typeof CRM_ACTION_STATUSES)[number];
export type CrmActionOwnerType = (typeof CRM_ACTION_OWNER_TYPES)[number];
export type ContactMethodType = 'email' | 'phone';
export type ActionRecurrence = 'none' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type ClientRelationshipStatus = 'excellent' | 'good' | 'neutral' | 'watch' | 'difficult';
export const CRM_IDENTITY_ASSET_ROLES = ['logo', 'favicon', 'avatar'] as const;
export type CrmIdentityOwnerType = 'organization' | 'contact';
export type CrmIdentityAssetRole = (typeof CRM_IDENTITY_ASSET_ROLES)[number];

export interface CrmIdentityAsset {
  id: string;
  ownerType: CrmIdentityOwnerType;
  ownerId: string;
  role: CrmIdentityAssetRole;
  relativePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  missing: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CrmIdentityAssetPreview {
  available: boolean;
  dataUrl?: string;
  mimeType?: string | null;
  error?: string;
}
export type ProspectResearchPresence = 'present' | 'absent' | 'review';
export type ProspectResearchCheckStatus = 'ok' | 'review' | 'missing' | 'na';

export interface ProspectResearchChecklistItem {
  key: string;
  label: string;
  status: ProspectResearchCheckStatus;
  note?: string | null;
}

export interface ProspectResearchStructuredCheck {
  overallStatus: ProspectResearchCheckStatus;
  items: ProspectResearchChecklistItem[];
  observations?: string | null;
  talkingPoint?: string | null;
  source?: string | null;
  url?: string | null;
}

export type ProspectResearchPriority = 'low' | 'medium' | 'high';

export interface ProspectResearchOpportunity {
  finding: string;
  service: string;
  priority: ProspectResearchPriority;
  note?: string | null;
  keep: boolean;
}

export interface ProspectResearchSnapshotInput {
  checkedAt?: string | null;
  source?: string | null;
  sourceUrl?: string | null;
  services?: string[];
  products?: string[];
  customerSegments?: string[];
  differentiators?: string[];
  googleBusiness?: {
    presence: ProspectResearchPresence;
    url?: string | null;
    category?: string | null;
    rating?: number | null;
    reviewCount?: number | null;
    hoursStatus?: ProspectResearchCheckStatus;
    photosStatus?: ProspectResearchCheckStatus;
    websiteLinkedStatus?: ProspectResearchCheckStatus;
    contactConsistencyStatus?: ProspectResearchCheckStatus;
    notes?: string | null;
  };
  website?: {
    presence: ProspectResearchPresence;
    url?: string | null;
    cms?: string | null;
    hosting?: string | null;
    httpsStatus?: ProspectResearchCheckStatus;
    responsiveStatus?: ProspectResearchCheckStatus;
    ecommerceStatus?: ProspectResearchCheckStatus;
    bookingStatus?: ProspectResearchCheckStatus;
    contactFormStatus?: ProspectResearchCheckStatus;
    blogStatus?: ProspectResearchCheckStatus;
    notes?: string | null;
  };
  legalNotices?: ProspectResearchStructuredCheck;
  audits?: {
    privacy?: ProspectResearchStructuredCheck;
    cookies?: ProspectResearchStructuredCheck;
    seo?: ProspectResearchStructuredCheck;
    performance?: ProspectResearchStructuredCheck;
    mobile?: ProspectResearchStructuredCheck;
    accessibility?: ProspectResearchStructuredCheck;
  };
  opportunities?: ProspectResearchOpportunity[];
  conversation?: {
    strengths?: string | null;
    issues?: string | null;
    talkingPoints?: string | null;
    approach?: string | null;
    callNotes?: string | null;
  };
}

export interface ProspectResearchSnapshot extends ProspectResearchSnapshotInput {
  id: string;
  prospectId: string;
  checkedAt: string;
  createdAt: string;
}
export interface ContactMethodInput { organizationId?: string | null; contactId?: string | null; type: ContactMethodType; value: string; label?: string | null; isPrimary?: boolean; notes?: string | null; }
export interface ContactMethod extends ContactMethodInput { id: string; isPrimary: boolean; createdAt: string; updatedAt: string; archivedAt?: string | null; }

export interface OrganizationInput {
  name: string; legalName?: string | null; siret?: string | null; email?: string | null; phone?: string | null; website?: string | null;
  addressLine1?: string | null; addressLine2?: string | null; postalCode?: string | null; city?: string | null; country?: string | null; industry?: string | null; notes?: string | null;
}
export interface Organization extends OrganizationInput { id: string; createdAt: string; updatedAt: string; archivedAt?: string | null; }

export type DirectoryRelation = 'client' | 'prospect' | 'client_prospect' | 'external';

export interface DirectoryOrganization extends Organization {
  contactCount: number;
  activeProspectCount: number;
  activeClientCount: number;
  relation: DirectoryRelation;
  prospectId?: string | null;
  clientId?: string | null;
}

export interface ContactInput {
  organizationId?: string | null; firstName: string; lastName: string; jobTitle?: string | null; email?: string | null; phone?: string | null; preferredChannel?: string | null; notes?: string | null;
}
export interface Contact extends ContactInput { id: string; createdAt: string; updatedAt: string; archivedAt?: string | null; }

export interface DirectoryContact extends Contact {
  organizationName?: string | null;
  activeProspectCount: number;
  activeClientCount: number;
  relation: DirectoryRelation;
  prospectId?: string | null;
  clientId?: string | null;
}

export interface ClientContactLink { id: string; clientAccountId: string; contactId: string; role: ClientContactRole; isPrimary: boolean; contact: Contact; }

export interface ProspectInput {
  organizationId?: string | null; contactId?: string | null; stage?: ProspectStage; temperature?: ProspectTemperature; source?: ProspectSource | null; sourceDetail?: string | null;
  originType?: ProspectOrigin | null; prospectingStartedAt?: string | null; qualificationValidatedAt?: string | null;
  targetingReasonCode?: string | null; targetingReasonText?: string | null; initialObservation?: string | null; detectedOpportunity?: string | null;
  firstContactResultCode?: string | null; firstContactResultText?: string | null; interestLevel?: ProspectInterestLevel | null;
  primaryNeed?: string | null; secondaryNeed?: string | null; budgetMinCents?: number | null; budgetMaxCents?: number | null; estimatedValueCents?: number | null;
  probabilityPercent?: number | null; nextActionAt?: string | null; nextActionText?: string | null; targetDate?: string | null; notes?: string | null;
  decisionStatus?: 'yes' | 'no' | 'unknown' | null; decisionMakerDetails?: string | null; decisionMakerContactId?: string | null;
  /** @deprecated Compatibilité transitoire migration 20 : utiliser decisionMakerContactId + Contact. */
  decisionMakerName?: string | null;
  /** @deprecated Compatibilité transitoire migration 20 : utiliser decisionMakerContactId + Contact. */
  decisionMakerRole?: string | null;
  /** @deprecated Compatibilité transitoire migration 20 : utiliser les contact_methods du Contact décisionnaire. */
  decisionMakerEmail?: string | null;
  /** @deprecated Compatibilité transitoire migration 20 : utiliser les contact_methods du Contact décisionnaire. */
  decisionMakerPhone?: string | null;
  projectSummary?: string | null; projectContext?: string | null;
  budgetStatus?: 'known' | 'range' | 'not_disclosed' | null; timelineStatus?: 'date' | 'note' | 'not_disclosed' | null; timelineNote?: string | null;
  existingStatus?: 'yes' | 'no' | 'unknown' | null; existingUrl?: string | null; existingNotes?: string | null; missingInformation?: string | null;
  waitingReasonCode?: string | null; waitingReasonText?: string | null; waitingResumeAt?: string | null; lostReasonCode?: string | null;
}
export interface ProspectSummary extends ProspectInput {
  id: string; clientAccountId?: string | null; lostReason?: string | null; wonAt?: string | null; lostAt?: string | null; createdAt: string; updatedAt: string; archivedAt?: string | null;
  displayName: string; secondaryLabel?: string | null;
  organizationIndustry?: string | null;
  organizationCity?: string | null;
  organizationWebsite?: string | null;
  organizationNotes?: string | null;
  hasContactMethod?: boolean;
  researchSnapshotCount?: number;
}
/** Champs éditables par le panneau Qualification 03C, isolés du décisionnaire. */
export interface ProspectQualificationBrief {
  originType: ProspectInput['originType'];
  targetingReasonCode: string | null;
  targetingReasonText: string | null;
  initialObservation: string | null;
  detectedOpportunity: string | null;
  firstContactResultCode: string | null;
  firstContactResultText: string | null;
  interestLevel: ProspectInput['interestLevel'];
  projectSummary: string | null;
  projectContext: string | null;
}

export function prospectQualificationBriefSnapshot(prospect: Partial<ProspectInput>): ProspectQualificationBrief {
  return {
    originType: prospect.originType ?? null,
    targetingReasonCode: prospect.targetingReasonCode ?? null,
    targetingReasonText: prospect.targetingReasonText ?? null,
    initialObservation: prospect.initialObservation ?? null,
    detectedOpportunity: prospect.detectedOpportunity ?? null,
    firstContactResultCode: prospect.firstContactResultCode ?? null,
    firstContactResultText: prospect.firstContactResultText ?? null,
    interestLevel: prospect.interestLevel ?? null,
    projectSummary: prospect.projectSummary ?? null,
    projectContext: prospect.projectContext ?? null,
  };
}

/** Snapshot complet du formulaire 03C Besoin / Projet, distinct de la checklist. */
export interface ProspectProjectBrief {
  projectSummary: string | null;
  projectContext: string | null;
  budgetStatus: ProspectInput['budgetStatus'];
  budgetMinCents: number | null;
  budgetMaxCents: number | null;
  timelineStatus: ProspectInput['timelineStatus'];
  targetDate: string | null;
  timelineNote: string | null;
  existingStatus: ProspectInput['existingStatus'];
  existingUrl: string | null;
  existingNotes: string | null;
}

/** Le même snapshot sert à comparer, appliquer et recharger les 11 champs. */
export function prospectProjectBriefSnapshot(prospect: ProspectSummary): ProspectProjectBrief {
  return {
    projectSummary: prospect.projectSummary ?? null,
    projectContext: prospect.projectContext ?? null,
    budgetStatus: prospect.budgetStatus ?? null,
    budgetMinCents: prospect.budgetMinCents ?? null,
    budgetMaxCents: prospect.budgetMaxCents ?? null,
    timelineStatus: prospect.timelineStatus ?? null,
    targetDate: prospect.targetDate ?? null,
    timelineNote: prospect.timelineNote ?? null,
    existingStatus: prospect.existingStatus ?? null,
    existingUrl: prospect.existingUrl ?? null,
    existingNotes: prospect.existingNotes ?? null,
  };
}

export interface ProspectFilters { stage?: ProspectStage | null; includeArchived?: boolean; search?: string | null; }

export interface ClientInput { organizationId?: string | null; primaryContactId?: string | null; status?: ClientStatus; nextActionAt?: string | null; nextActionText?: string | null; notes?: string | null; relationshipStatus?: ClientRelationshipStatus; relationshipNote?: string | null; }
export interface ClientSummary extends ClientInput {
  id: string; becameClientAt: string; createdAt: string; updatedAt: string; archivedAt?: string | null; displayName: string; contactName?: string | null; email?: string | null; phone?: string | null;
}
export interface ClientFilters { status?: ClientStatus | null; includeArchived?: boolean; search?: string | null; }

export interface CrmActionInput {
  ownerType: CrmActionOwnerType;
  ownerId: string;
  type: CrmActionType;
  title: string;
  dueAt?: string | null;
  notes?: string | null;
  relatedType?: string | null;
  relatedId?: string | null;
  targetContactId?: string | null;
  reasonCode?: string | null;
  reasonText?: string | null;
  recurrence?: ActionRecurrence;
}
export interface CompleteActionInput { channel?: string | null; outcome?: string | null; notes?: string | null; nextAction?: CrmActionInput | null; }
export interface CrmAction extends CrmActionInput { id: string; status: CrmActionStatus; completedAt?: string | null; completionChannel?: string | null; completionOutcome?: string | null; completionNotes?: string | null; createdAt: string; updatedAt: string; }
export interface CrmActionFilters { ownerType?: CrmActionOwnerType | null; ownerId?: string | null; type?: CrmActionType | null; status?: CrmActionStatus | null; }

export interface ActivityEvent { id: string; entityType: string; entityId: string; action: string; summary: string; metadata?: Record<string, unknown> | null; createdAt: string; }

export interface SearchResult {
  entityType: 'prospect' | 'client' | 'organization' | 'contact' | 'client_document' | 'catalog' | 'quote' | 'project' | 'service_request' | 'intervention' | 'maintenance' | 'hour_pack' | 'atoumweb_library' | 'backup_record';
  entityId: string;
  title: string;
  subtitle?: string | null;
  status?: string | null;
  parentEntityId?: string | null;
}

export interface ConvertProspectResult { prospectId: string; clientId: string; createdClient: boolean; }

export interface CrmApi {
  organizations: {
    list(includeArchived?: boolean): Promise<DirectoryOrganization[]>;
    get(id: string): Promise<DirectoryOrganization>;
    create(input: OrganizationInput): Promise<Organization>;
    update(id: string, input: OrganizationInput): Promise<Organization>;
  };
  contacts: {
    list(includeArchived?: boolean): Promise<DirectoryContact[]>;
    get(id: string): Promise<DirectoryContact>;
    create(input: ContactInput): Promise<Contact>;
    /** Atomic primary contact creation + Prospect attachment, retry-safe. */
    createAndAttachPrimaryProspect(prospectId: string, input: ContactInput): Promise<Contact>;
    /** Atomic decision maker creation + Prospect attachment, retry-safe. */
    createAndAttachDecisionProspect(prospectId: string, input: ContactInput): Promise<Contact>;
    update(id: string, input: ContactInput): Promise<Contact>;
  };
  contactMethods: {
    list(owner: 'organization' | 'contact', id: string, includeArchived?: boolean): Promise<ContactMethod[]>;
    save(input: ContactMethodInput, id?: string): Promise<ContactMethod>;
    archive(id: string, archived?: boolean): Promise<void>;
  };
  identityAssets: {
    list(owner: CrmIdentityOwnerType, id: string): Promise<CrmIdentityAsset[]>;
    importFile(owner: CrmIdentityOwnerType, id: string, role: CrmIdentityAssetRole): Promise<CrmIdentityAsset | null>;
    preview(assetId: string): Promise<CrmIdentityAssetPreview>;
    remove(assetId: string): Promise<void>;
  };
  prospects: {
    list(filters?: ProspectFilters): Promise<ProspectSummary[]>;
    create(input: ProspectInput): Promise<ProspectSummary>;
    update(id: string, input: ProspectInput): Promise<ProspectSummary>;
    updateQualification(id: string, input: Partial<ProspectInput>): Promise<ProspectSummary>;
    /** Atomically reject stale checklist writes from another window. */
    updateMissingInformationIfUnchanged(id: string, expected: string | null, next: string | null): Promise<ProspectSummary>;
    /** CAS atomique des 11 champs du projet, budget et calendrier. */
    updateProjectBriefIfUnchanged(id: string, expected: ProspectProjectBrief, next: ProspectProjectBrief): Promise<ProspectSummary>;
    /** Qualification avec protection des dix champs édités, y compris résumé/contexte communs. */
    updateQualificationBriefIfUnchanged(id: string, expected: ProspectQualificationBrief, next: ProspectQualificationBrief): Promise<ProspectSummary>;
    changeStage(id: string, stage: ProspectStage, lostReason?: string | null, allowIncompleteQualification?: boolean): Promise<ProspectSummary>;
    setNextAction(id: string, at: string | null, text: string | null): Promise<ProspectSummary>;
    convertToClient(id: string): Promise<ConvertProspectResult>;
    research: {
      list(id: string): Promise<ProspectResearchSnapshot[]>;
      save(id: string, input: ProspectResearchSnapshotInput): Promise<ProspectResearchSnapshot>;
    };
  };
  clients: {
    list(filters?: ClientFilters): Promise<ClientSummary[]>;
    create(input: ClientInput): Promise<ClientSummary>;
    update(id: string, input: ClientInput): Promise<ClientSummary>;
    updateRelationshipIfUnchanged(id:string,expected:{status:ClientRelationshipStatus;note:string|null},next:{status:ClientRelationshipStatus;note:string|null}):Promise<ClientSummary>;
    archive(id: string): Promise<ClientSummary>;
    reactivate(id: string, status: Exclude<ClientStatus, 'archived'>): Promise<ClientSummary>;
    listContacts(id: string): Promise<ClientContactLink[]>;
    addContact(id: string, input: ContactInput, role: ClientContactRole, makePrimary?: boolean): Promise<ClientContactLink>;
    setPrimaryContact(id: string, contactId: string): Promise<void>;
  };
  actions: {
    list(filters?: CrmActionFilters): Promise<CrmAction[]>;
    create(input: CrmActionInput): Promise<CrmAction>;
    complete(id: string, input?: CompleteActionInput): Promise<CrmAction>;
    cancel(id: string): Promise<CrmAction>;
    reopen(id: string): Promise<CrmAction>;
  };
  activity: { list(entityType: string, entityId: string): Promise<ActivityEvent[]>; };
  search: {
    global(query: string): Promise<SearchResult[]>;
    rebuild(): Promise<{ indexed: number }>;
  };
}
