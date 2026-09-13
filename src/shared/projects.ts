export const PROJECT_TEMPLATE_STATUSES = ['active', 'inactive', 'archived'] as const;
export const PROJECT_TEMPLATE_VERSION_STATUSES = ['draft', 'published', 'retired'] as const;
export const PROJECT_STATUSES = ['to_prepare', 'in_progress', 'waiting_client', 'blocked', 'to_validate', 'completed', 'archived'] as const;
export const PROJECT_COMMERCIAL_MODES = ['normal', 'discounted', 'free', 'partnership', 'internal'] as const;
export const PROJECT_NODE_TYPES = ['lot', 'module', 'task', 'checklist'] as const;
export const PROJECT_NODE_STATUSES = ['todo', 'in_progress', 'waiting_client', 'blocked', 'to_validate', 'done'] as const;
export const PROJECT_PREREQUISITE_STATUSES = ['to_request', 'requested', 'received', 'incomplete', 'validated', 'not_applicable'] as const;

export type ProjectTemplateStatus = (typeof PROJECT_TEMPLATE_STATUSES)[number];
export type ProjectTemplateVersionStatus = (typeof PROJECT_TEMPLATE_VERSION_STATUSES)[number];
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type ProjectCommercialMode = (typeof PROJECT_COMMERCIAL_MODES)[number];
export type ProjectNodeType = (typeof PROJECT_NODE_TYPES)[number];
export type ProjectNodeStatus = (typeof PROJECT_NODE_STATUSES)[number];
export type ProjectPrerequisiteStatus = (typeof PROJECT_PREREQUISITE_STATUSES)[number];

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
}
