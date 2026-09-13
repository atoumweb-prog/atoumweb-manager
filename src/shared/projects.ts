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
}

export interface ProjectTemplateNode extends ProjectTemplateNodeInput {
  id: string;
  templateVersionId: string;
  required: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface ProjectTemplateVersion {
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
}

export interface ProjectNode extends ProjectNodeInput {
  id: string;
  projectId: string;
  sourceTemplateNodeId?: string | null;
  required: boolean;
  sortOrder: number;
  status: ProjectNodeStatus;
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
  notes?: string | null;
  nodes: ProjectNode[];
  services: ProjectServiceSnapshot[];
  prerequisites: ProjectPrerequisite[];
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
  templateVersionId: string;
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

export interface ProjectsApi {
  templates: {
    list(): Promise<ProjectTemplateSummary[]>;
    get(id: string): Promise<ProjectTemplateDetail>;
    create(input: ProjectTemplateInput): Promise<ProjectTemplateDetail>;
    createVersion(templateId: string, description?: string | null): Promise<ProjectTemplateVersion>;
    publishVersion(versionId: string): Promise<ProjectTemplateVersion>;
    addNode(versionId: string, input: ProjectTemplateNodeInput): Promise<ProjectTemplateVersion>;
    removeNode(nodeId: string): Promise<ProjectTemplateVersion>;
  };
  projects: {
    list(filters?: ProjectFilters): Promise<ProjectSummary[]>;
    get(id: string): Promise<ProjectDetail>;
    transformQuote(input: TransformQuoteToProjectInput): Promise<ProjectDetail>;
    createInternal(input: InternalProjectInput): Promise<ProjectDetail>;
    changeStatus(id: string, status: ProjectStatus): Promise<ProjectDetail>;
    addNode(projectId: string, input: ProjectNodeInput): Promise<ProjectDetail>;
    updateNode(nodeId: string, input: Partial<ProjectNodeInput>): Promise<ProjectDetail>;
    addPrerequisite(projectId: string, input: ProjectPrerequisiteInput): Promise<ProjectDetail>;
    updatePrerequisiteStatus(id: string, status: ProjectPrerequisiteStatus): Promise<ProjectDetail>;
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
    archive(itemId: string): Promise<ProjectTechnicalItemDetail>;
  };
}
