import type { BusinessTimeCategory, OperationalNodeInfo } from './operational';
export const PROJECT_TEMPLATE_STATUSES = ['active', 'inactive', 'archived'] as const;
export const PROJECT_TEMPLATE_VERSION_STATUSES = ['draft', 'published', 'retired'] as const;
export const PROJECT_STATUSES = ['to_prepare', 'in_progress', 'waiting_client', 'blocked', 'to_validate', 'completed', 'archived'] as const;
export const PROJECT_COMMERCIAL_MODES = ['normal', 'discounted', 'free', 'partnership', 'internal'] as const;
export const PROJECT_NODE_TYPES = ['lot', 'module', 'task', 'checklist'] as const;
export const PROJECT_NODE_STATUSES = ['todo', 'in_progress', 'waiting_client', 'blocked', 'to_validate', 'done'] as const;
export const PROJECT_PREREQUISITE_STATUSES = ['to_request', 'requested', 'received', 'incomplete', 'validated', 'not_applicable'] as const;
export const PROJECT_RESOURCE_FOLDERS = ['identity', 'texts', 'media', 'documents', 'technical', 'deliverables', 'archives'] as const;
export const PROJECT_RESOURCE_STATUSES = ['received', 'to_process', 'in_progress', 'validated', 'obsolete'] as const;
export const PROJECT_RESOURCE_ROLES = ['client_provided', 'atoumweb_rewrite', 'final_validated', 'other'] as const;
export const PROJECT_TECHNICAL_CATEGORIES = ['header', 'footer', 'hero', 'page', 'section', 'css', 'javascript', 'php', 'acf', 'divi', 'woocommerce', 'plugin', 'config', 'note', 'other'] as const;
export const PROJECT_TECHNICAL_CONTENT_TYPES = ['code', 'json', 'text', 'reference'] as const;
export const PROJECT_COMPLETION_STATES = ['ok', 'warning', 'check'] as const;
export const PROJECT_COMPLETION_KEYS = ['required_tasks', 'prerequisites', 'final_backup', 'deliverables', 'balance', 'training', 'maintenance', 'technical_reuse'] as const;
export const PROJECT_SITE_PAGE_ROLES = ['home', 'standard', 'legal', 'landing', 'blog', 'other'] as const;

export type ProjectTemplateStatus = (typeof PROJECT_TEMPLATE_STATUSES)[number];
export type ProjectTemplateVersionStatus = (typeof PROJECT_TEMPLATE_VERSION_STATUSES)[number];
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type ProjectCommercialMode = (typeof PROJECT_COMMERCIAL_MODES)[number];
export type ProjectNodeType = (typeof PROJECT_NODE_TYPES)[number];
export type ProjectNodeStatus = (typeof PROJECT_NODE_STATUSES)[number];
export type ProjectPrerequisiteStatus = (typeof PROJECT_PREREQUISITE_STATUSES)[number];
export type ProjectResourceFolder = (typeof PROJECT_RESOURCE_FOLDERS)[number];
export type ProjectResourceStatus = (typeof PROJECT_RESOURCE_STATUSES)[number];
export type ProjectResourceRole = (typeof PROJECT_RESOURCE_ROLES)[number];
export type ProjectTechnicalCategory = (typeof PROJECT_TECHNICAL_CATEGORIES)[number];
export type ProjectTechnicalContentType = (typeof PROJECT_TECHNICAL_CONTENT_TYPES)[number];
export type ProjectCompletionState = (typeof PROJECT_COMPLETION_STATES)[number];
export type ProjectCompletionKey = (typeof PROJECT_COMPLETION_KEYS)[number];
export type ProjectSitePageRole = (typeof PROJECT_SITE_PAGE_ROLES)[number];

export type ProjectWorkCardFieldType = 'text' | 'textarea' | 'check' | 'select' | 'url';
export type ProjectCompanionAdviceKind = 'best_practice' | 'check' | 'library' | 'warning';

export interface ProjectWorkCardField {
  key: string;
  label: string;
  type: ProjectWorkCardFieldType;
  options?: string[];
  value?: string | boolean | null;
  help?: string | null;
}

export interface ProjectWorkAction {
  id: string;
  title: string;
  done: boolean;
}

export interface ProjectWorkCard {
  goal?: string | null;
  notes?: string | null;
  fields: ProjectWorkCardField[];
  actions?: ProjectWorkAction[];
}

export interface ProjectSecretInput {
  projectId: string;
  projectNodeId?: string | null;
  label: string;
  username?: string | null;
  secret: string;
  url?: string | null;
  notes?: string | null;
}

export interface ProjectSecretSummary {
  id: string;
  projectId: string;
  projectNodeId?: string | null;
  label: string;
  username?: string | null;
  url?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSecretReveal {
  id: string;
  secret: string;
}

export interface ProjectCompanionAdvice {
  kind: ProjectCompanionAdviceKind;
  title: string;
  body: string;
}

export interface ProjectBlueprintNodeSource {
  contributionKey: string; unitIndex: number; sourceTemplateNodeId: string;
  quoteLineId: string | null; catalogVersionId: string | null; componentId: string | null;
  templateVersionId: string; role: 'base' | 'addon'; quantityMilli: number;
  quantityMode: 'once' | 'per_unit'; label: string; optionPurchase: Record<string, unknown> | null;
}

export interface ProjectNodeSource {
  id: string;
  projectNodeId: string;
  quoteLineId?: string | null;
  catalogVersionId?: string | null;
  templateVersionId?: string | null;
  sourceRole: 'direct' | 'offer_component' | 'manual';
  createdAt: string;
}

export interface ProjectTemplateInput {
  name: string;
  projectType: string;
  description?: string | null;
}

export interface ProjectTemplateNodeInput {
  parentId?: string | null;
  type: ProjectNodeType;
  displaySubtype?: string | null;
  name: string;
  description?: string | null;
  sortOrder?: number;
  estimatedMinutes?: number | null;
  required?: boolean;
  initialStatus?: ProjectNodeStatus;
  timeCategory?: string | null;
  semanticKey?: string | null;
  workCard?: ProjectWorkCard | null;
  advice?: ProjectCompanionAdvice[];
}

export interface ProjectTemplateNode extends ProjectTemplateNodeInput {
  id: string;
  templateVersionId: string;
  required: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface ProjectTemplateVersion {
  operationalPurpose?: 'historical_complete' | 'structural';
  requiresOperationalModel?: boolean;
  operationalReady?: boolean;
  id: string;
  templateId: string;
  versionNumber: number;
  status: ProjectTemplateVersionStatus;
  description?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  nodes: ProjectTemplateNode[];
}

export interface ProjectTemplateSummary {
  id: string;
  name: string;
  projectType: string;
  status: ProjectTemplateStatus;
  currentVersion?: ProjectTemplateVersion | null;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
}

export interface ProjectTemplateDetail extends ProjectTemplateSummary {
  versions: ProjectTemplateVersion[];
}

export interface ProjectNodeInput {
  businessCategory?: BusinessTimeCategory | null;
  parentId?: string | null;
  type: ProjectNodeType;
  displaySubtype?: string | null;
  name: string;
  description?: string | null;
  sortOrder?: number;
  estimatedMinutes?: number | null;
  required?: boolean;
  status?: ProjectNodeStatus;
  timeCategory?: string | null;
  semanticKey?: string | null;
  workCard?: ProjectWorkCard | null;
  advice?: ProjectCompanionAdvice[];
}

export interface MoveProjectNodeInput {
  parentId?: string | null;
  targetIndex: number;
}

export interface ProjectNode extends ProjectNodeInput {
  operational?: OperationalNodeInfo;
  id: string;
  projectId: string;
  sourceTemplateNodeId?: string | null;
  required: boolean;
  sortOrder: number;
  status: ProjectNodeStatus;
  paused: boolean;
  pauseReason?: string | null;
  sources: ProjectNodeSource[];
  blueprintSources?: ProjectBlueprintNodeSource[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectServiceSnapshot {
  id: string;
  projectId: string;
  sourceQuoteLineId?: string | null;
  catalogItemId?: string | null;
  catalogVersionId?: string | null;
  label: string;
  snapshot?: Record<string, unknown> | null;
  catalogValueCents: number;
  contractValueCents: number;
  createdAt: string;
}

export interface ProjectPrerequisiteInput {
  label: string;
  description?: string | null;
  required?: boolean;
  sortOrder?: number;
}

export interface ProjectPrerequisite extends ProjectPrerequisiteInput {
  id: string;
  projectId: string;
  status: ProjectPrerequisiteStatus;
  required: boolean;
  requestedAt?: string | null;
  receivedAt?: string | null;
  validatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSummary {
  prospectId?: string | null;
  commercialState?: 'legacy' | 'provisional' | 'frozen';
  commercialDossierId?: string | null;
  acceptedQuoteId?: string | null;
  scopeFrozenAt?: string | null;
  id: string;
  number: string;
  clientAccountId?: string | null;
  clientLabel: string;
  sourceQuoteId?: string | null;
  templateVersionId?: string | null;
  name: string;
  projectType: string;
  status: ProjectStatus;
  commercialMode: ProjectCommercialMode;
  startDate?: string | null;
  targetDate?: string | null;
  commercialValueCents: number;
  contractValueCents: number;
  progressPercent: number;
  estimatedMinutes: number;
  resourceRootPath?: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  archivedAt?: string | null;
}

export interface ProjectDetail extends ProjectSummary {
  estimationIncomplete?: boolean;
  notes?: string | null;
  nodes: ProjectNode[];
  services: ProjectServiceSnapshot[];
  prerequisites: ProjectPrerequisite[];
}

export interface ProjectSiteInput {
  name: string;
  desiredDomain?: string | null;
}

export interface ProjectSite extends ProjectSiteInput {
  id: string;
  projectId: string;
  name: string;
  desiredDomain?: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
}

export interface ProjectSitePageInput {
  role?: ProjectSitePageRole | null;
  desiredPath?: string | null;
}

export interface ProjectSitePage {
  projectNodeId: string;
  projectSiteId: string;
  role: ProjectSitePageRole;
  desiredPath?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTemplateSitePageInput {
  key: string;
  templateNodeId: string;
  role: ProjectSitePageRole;
  desiredPath?: string | null;
  sortOrder?: number;
}

export interface ProjectTemplateSiteInput {
  key: string;
  name: string;
  desiredDomain?: string | null;
  sortOrder?: number;
  pages: ProjectTemplateSitePageInput[];
}

export interface ProjectBlueprintGenerationResult {
  projectId: string;
  templateVersionId: string;
  declaredSiteCount: number;
  createdSiteIds: string[];
  linkedPageIds: string[];
  preservedSiteIds: string[];
  preservedPageIds: string[];
}

export interface ProjectFilters {
  search?: string | null;
  status?: ProjectStatus | null;
  clientAccountId?: string | null;
  projectType?: string | null;
  commercialMode?: ProjectCommercialMode | null;
}

export interface TransformQuoteToProjectInput {
  quoteId: string;
  templateVersionId?: string | null;
  name?: string | null;
  targetDate?: string | null;
  commercialMode?: ProjectCommercialMode | null;
}

export interface InternalProjectInput {
  name: string;
  projectType?: string;
  templateVersionId?: string | null;
  targetDate?: string | null;
  notes?: string | null;
}

export interface ProjectResource {
  id: string;
  projectId: string;
  clientAccountId?: string | null;
  relativePath: string;
  fileName: string;
  folder: ProjectResourceFolder;
  status: ProjectResourceStatus;
  contentRole: ProjectResourceRole;
  mimeType?: string | null;
  sizeBytes?: number | null;
  checksumSha256?: string | null;
  missing: boolean;
  linkedNodeIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectResourceOpenResult {
  ok: boolean;
  error?: string | null;
}

export interface ProjectTechnicalItemInput {
  category: ProjectTechnicalCategory;
  name: string;
  description?: string | null;
  tags?: string[];
}

export interface ProjectTechnicalVersionInput {
  contentType: ProjectTechnicalContentType;
  language?: string | null;
  contentText?: string | null;
  notes?: string | null;
}

export interface ProjectTechnicalVersion extends ProjectTechnicalVersionInput {
  id: string;
  itemId: string;
  versionNumber: number;
  current: boolean;
  stable: boolean;
  linkedResourceIds: string[];
  createdAt: string;
}

export interface ProjectTechnicalItemSummary extends ProjectTechnicalItemInput {
  id: string;
  projectId: string;
  currentVersion?: ProjectTechnicalVersion | null;
  stableVersion?: ProjectTechnicalVersion | null;
  versionCount: number;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
}

export interface ProjectTechnicalItemDetail extends ProjectTechnicalItemSummary {
  versions: ProjectTechnicalVersion[];
}

export interface ProjectTechnicalReuseExportResult {
  projectId: string;
  itemId: string;
  versionId: string;
  versionNumber: number;
  path: string;
  resourceId: string;
  createdAt: string;
}

export interface ProjectCompletionItem {
  key: ProjectCompletionKey;
  label: string;
  state: ProjectCompletionState;
  detail: string;
  automatic: boolean;
}

export interface ProjectCompletionReview {
  projectId: string;
  canComplete: true;
  warningCount: number;
  checkCount: number;
  items: ProjectCompletionItem[];
  generatedAt: string;
}

export interface ProjectsApi {
  templates: {
    list(): Promise<ProjectTemplateSummary[]>;
    get(id: string): Promise<ProjectTemplateDetail>;
    create(input: ProjectTemplateInput): Promise<ProjectTemplateDetail>;
    createVersion(templateId: string, description?: string | null): Promise<ProjectTemplateVersion>;
    publishVersion(versionId: string): Promise<ProjectTemplateVersion>;
    addNode(versionId: string, input: ProjectTemplateNodeInput): Promise<ProjectTemplateVersion>;
    removeNode(nodeId: string): Promise<ProjectTemplateVersion>;
    configureSites(versionId: string, sites: ProjectTemplateSiteInput[]): Promise<ProjectTemplateVersion>;
  };
  projects: {
    list(filters?: ProjectFilters): Promise<ProjectSummary[]>;
    get(id: string): Promise<ProjectDetail>;
    transformQuote(input: TransformQuoteToProjectInput): Promise<ProjectDetail>;
    prepareQuote(input: TransformQuoteToProjectInput): Promise<ProjectDetail>;
    syncCommercial(projectId: string): Promise<ProjectDetail>;
    commercialScope(projectId: string): Promise<ProjectCommercialScope>;
    resolveScopeConflict(projectId: string, conflictId: string, decision: ProjectConflictDecision): Promise<ProjectCommercialScope>;
    createInternal(input: InternalProjectInput): Promise<ProjectDetail>;
    changeStatus(id: string, status: ProjectStatus): Promise<ProjectDetail>;
    completionReview(id: string): Promise<ProjectCompletionReview>;
    addNode(projectId: string, input: ProjectNodeInput): Promise<ProjectDetail>;
    updateNode(nodeId: string, input: Partial<ProjectNodeInput>): Promise<ProjectDetail>;
    moveNode(nodeId: string, input: MoveProjectNodeInput): Promise<ProjectDetail>;
    setNodePause(nodeId: string, paused: boolean, reason?: string | null): Promise<ProjectDetail>;
    completePhase(nodeId: string): Promise<ProjectDetail>;
    addPrerequisite(projectId: string, input: ProjectPrerequisiteInput): Promise<ProjectDetail>;
    updatePrerequisiteStatus(id: string, status: ProjectPrerequisiteStatus): Promise<ProjectDetail>;
  };
  sites: {
    list(projectId: string, includeArchived?: boolean): Promise<ProjectSite[]>;
    create(projectId: string, input: ProjectSiteInput): Promise<ProjectSite>;
    update(id: string, input: Partial<ProjectSiteInput>): Promise<ProjectSite>;
    setArchived(id: string, archived: boolean): Promise<ProjectSite>;
    listPages(projectId: string): Promise<ProjectSitePage[]>;
    linkPage(siteId: string, projectNodeId: string, input?: ProjectSitePageInput): Promise<ProjectSitePage>;
    unlinkPage(projectNodeId: string): Promise<void>;
    applyBlueprint(projectId: string, templateVersionId?: string | null): Promise<ProjectBlueprintGenerationResult>;
  };
  secrets: {
    list(projectId: string, projectNodeId?: string | null): Promise<ProjectSecretSummary[]>;
    save(input: ProjectSecretInput): Promise<ProjectSecretSummary>;
    reveal(id: string): Promise<ProjectSecretReveal>;
    remove(id: string): Promise<void>;
  };
  resources: {
    list(projectId: string): Promise<ProjectResource[]>;
    importFiles(projectId: string, folder: ProjectResourceFolder, contentRole?: ProjectResourceRole): Promise<ProjectResource[]>;
    updateStatus(id: string, status: ProjectResourceStatus): Promise<ProjectResource>;
    updateRole(id: string, role: ProjectResourceRole): Promise<ProjectResource>;
    linkToNode(id: string, nodeId: string): Promise<ProjectResource>;
    unlinkFromNode(id: string, nodeId: string): Promise<ProjectResource>;
    openFile(id: string): Promise<ProjectResourceOpenResult>;
    openFolder(projectId: string): Promise<ProjectResourceOpenResult>;
    relocalize(id: string): Promise<ProjectResource | null>;
  };
  technicalLibrary: {
    list(projectId: string, search?: string | null): Promise<ProjectTechnicalItemSummary[]>;
    get(id: string): Promise<ProjectTechnicalItemDetail>;
    create(projectId: string, item: ProjectTechnicalItemInput, version: ProjectTechnicalVersionInput): Promise<ProjectTechnicalItemDetail>;
    createVersion(itemId: string, version: ProjectTechnicalVersionInput): Promise<ProjectTechnicalItemDetail>;
    markStable(versionId: string): Promise<ProjectTechnicalItemDetail>;
    linkResource(versionId: string, resourceId: string): Promise<ProjectTechnicalItemDetail>;
    unlinkResource(versionId: string, resourceId: string): Promise<ProjectTechnicalItemDetail>;
    prepareForReuse(itemId: string, versionId?: string | null): Promise<ProjectTechnicalReuseExportResult>;
    archive(itemId: string): Promise<ProjectTechnicalItemDetail>;
  };
}

export type ProjectConflictDecision = 'keep' | 'archive' | 'detach' | 'delete';
export interface ProjectCommercialScope {
  projectId: string; state: 'legacy' | 'provisional' | 'frozen'; dossierId: string | null;
  currentQuoteId: string | null; acceptedQuoteId: string | null;
  revisions: {id:string;quoteId:string;commercialRevision:number;sequence:number;sha256:string;createdAt:string}[];
  conflicts: {id:string;entityKind:string;entityId:string;label:string;reason:string}[];
}
