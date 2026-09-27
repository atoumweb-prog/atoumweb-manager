export const CONTRACT_CLAUSE_SCOPES = ['base', 'catalog'] as const;
export const CONTRACT_CLAUSE_AUDIENCES = ['all', 'professional', 'consumer'] as const;
export const CONTRACT_CLAUSE_STATUSES = ['active', 'inactive', 'archived'] as const;
export const CONTRACT_CLAUSE_VERSION_STATUSES = ['draft', 'published', 'retired'] as const;
export const QUOTE_CONTRACT_CLAUSE_SOURCES = ['base', 'catalog', 'custom'] as const;

export type ContractClauseScope = (typeof CONTRACT_CLAUSE_SCOPES)[number];
export type ContractClauseAudience = (typeof CONTRACT_CLAUSE_AUDIENCES)[number];
export type QuoteContractAudience = Exclude<ContractClauseAudience, 'all'>;
export type ContractClauseStatus = (typeof CONTRACT_CLAUSE_STATUSES)[number];
export type ContractClauseVersionStatus = (typeof CONTRACT_CLAUSE_VERSION_STATUSES)[number];
export type QuoteContractClauseSource = (typeof QUOTE_CONTRACT_CLAUSE_SOURCES)[number];

export interface ContractClauseTemplateInput {
  code: string;
  title: string;
  scope: ContractClauseScope;
  audience?: ContractClauseAudience;
  sortOrder?: number;
}

export interface ContractClauseVersionInput {
  body: string;
}

export interface ContractClauseVersion {
  id: string;
  clauseId: string;
  versionNumber: number;
  body: string;
  status: ContractClauseVersionStatus;
  publishedAt?: string | null;
  createdAt: string;
}

export interface ContractClauseTemplate {
  id: string;
  code: string;
  title: string;
  scope: ContractClauseScope;
  audience: ContractClauseAudience;
  status: ContractClauseStatus;
  sortOrder: number;
  currentVersionId?: string | null;
  currentVersion?: ContractClauseVersion | null;
  versions: ContractClauseVersion[];
  catalogItemIds: string[];
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
}

export interface QuoteContractClause {
  id: string;
  quoteId: string;
  sourceKey: string;
  sourceKind: QuoteContractClauseSource;
  sourceClauseId?: string | null;
  sourceClauseVersionId?: string | null;
  sourceCatalogItemIds: string[];
  title: string;
  body: string;
  sortOrder: number;
  enabled: boolean;
  isCustomized: boolean;
  isOrphaned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteContractClauseInput {
  title: string;
  body: string;
  enabled?: boolean;
}

export interface QuoteContractClauseUpdate {
  title?: string;
  body?: string;
  enabled?: boolean;
}

export interface QuoteContractBuild {
  quoteId: string;
  audience: QuoteContractAudience;
  locked: boolean;
  clauses: QuoteContractClause[];
  compiledText: string;
  snapshotText?: string | null;
  compiledAt?: string | null;
  warnings: string[];
}

export interface ContractTermsApi {
  library: {
    list(includeArchived?: boolean): Promise<ContractClauseTemplate[]>;
    get(id: string): Promise<ContractClauseTemplate>;
    create(input: ContractClauseTemplateInput, firstVersion: ContractClauseVersionInput): Promise<ContractClauseTemplate>;
    createVersion(clauseId: string, input: ContractClauseVersionInput): Promise<ContractClauseVersion>;
    publishVersion(versionId: string): Promise<ContractClauseTemplate>;
    setStatus(id: string, status: ContractClauseStatus): Promise<ContractClauseTemplate>;
    setAudience(id: string, audience: ContractClauseAudience): Promise<ContractClauseTemplate>;
    setCatalogLinks(id: string, catalogItemIds: string[]): Promise<ContractClauseTemplate>;
  };
  quotes: {
    get(quoteId: string): Promise<QuoteContractBuild>;
    sync(quoteId: string): Promise<QuoteContractBuild>;
    addCustom(quoteId: string, input: QuoteContractClauseInput): Promise<QuoteContractBuild>;
    updateClause(id: string, input: QuoteContractClauseUpdate): Promise<QuoteContractBuild>;
    resetClause(id: string): Promise<QuoteContractBuild>;
    removeCustom(id: string): Promise<QuoteContractBuild>;
    reorder(quoteId: string, clauseIds: string[]): Promise<QuoteContractBuild>;
  };
  copyText(text: string): Promise<void>;
}
