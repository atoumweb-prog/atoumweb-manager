import type {ContractSectionKey,ContractSectionReview} from './contractSectionPolicy';
import type { ContractPresentation } from './contractPresentation';
import type { ContractTypeReference } from './contractTypes';

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

export const CONTRACT_LEGAL_REVIEW_LEVELS = [
  'Vérifié sur sources officielles',
  'Vérifié avec réserve',
  'Incertitude résiduelle',
  'Validation externe recommandée mais non prévue',
  'Fonctionnalité à ne pas activer sans nouvelle vérification',
] as const;

/** Documentary review only: neither publication status nor an automatic lawyer approval gate. */
export interface ContractClauseReviewMetadata {
  level: (typeof CONTRACT_LEGAL_REVIEW_LEVELS)[number];
  sources: string | null;
  verifiedAt: string | null;
  reserve: string | null;
  risk: string | null;
  prudence: string | null;
  externalSupport: string | null;
  finalReview: string | null;
  businessDecisions: string;
  editorialDecision: string;
  decisionReason: string | null;
  outsideActions: string | null;
  editorialStatus: string;
  origin: string;
  parameters: string | null;
  dependencies: string | null;
  textSource: string | null;
  provenance: { reference: string; sha256: string; referenceCell: string; bodyCell: string; reviewCell: string; decisionCell: string };
}

export interface ContractClauseTemplateInput {
  code: string;
  title: string;
  scope: ContractClauseScope;
  audience?: ContractClauseAudience;
  sortOrder?: number;
}

export interface ContractClauseVersionInput {
  body: string;
  review?: ContractClauseReviewMetadata | null;
}

export interface ContractClauseVersion {
  id: string;
  clauseId: string;
  versionNumber: number;
  body: string;
  status: ContractClauseVersionStatus;
  publishedAt?: string | null;
  review?: ContractClauseReviewMetadata | null;
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
  snapshotState: 'draft' | 'frozen' | 'historical_missing';
  clauses: QuoteContractClause[];
  compiledText: string;
  snapshotText?: string | null;
  compiledAt?: string | null;
  warnings: string[];
  types?: ContractTypeReference[];
}

/** Never substitute the current compilation for an empty or absent historical snapshot. */
export function quoteContractText(build: QuoteContractBuild): string {
  if (build.snapshotState === 'frozen') return build.snapshotText ?? '';
  if (build.snapshotState === 'historical_missing') return '';
  return build.compiledText;
}

/** Disposable review session: Word bytes never reach the renderer. */
export interface WordDraftPreview {
  sessionId:string;
  clauseId:string;
  sourceVersionId:string;
  changed:boolean;
  paragraphs:Array<{kind:'unchanged'|'added'|'removed';text:string;beforeIndex:number|null;afterIndex:number|null}>;
  warnings:string[];
  lossy:boolean;
  importedFileName:string;
}
export interface WordDraftExportResult { cancelled:boolean;fileName?:string; }

export interface ContractTermsApi {
  sectionReviews: {
    get(versionId:string):Promise<ContractSectionReview>;
    propose(versionId:string,sectionKey:ContractSectionKey,rankInSection:number,reason:string):Promise<ContractSectionReview>;
    approve(versionId:string,reviewer:string):Promise<ContractSectionReview>;
  };
  library: {
    list(includeArchived?: boolean): Promise<ContractClauseTemplate[]>;
    get(id: string): Promise<ContractClauseTemplate>;
    create(input: ContractClauseTemplateInput, firstVersion: ContractClauseVersionInput): Promise<ContractClauseTemplate>;
    createVersion(clauseId: string, input: ContractClauseVersionInput): Promise<ContractClauseVersion>;
    exportWordDraft(clauseId:string,versionId:string):Promise<WordDraftExportResult>;
    exportWorkingPdf(clauseId:string,versionId:string):Promise<WordDraftExportResult>;
    importWordDraft(clauseId:string,versionId:string):Promise<WordDraftPreview|null>;
    approveWordDraft(sessionId:string):Promise<ContractClauseVersion>;
    cancelWordDraft(sessionId:string):Promise<void>;
    publishVersion(versionId: string): Promise<ContractClauseTemplate>;
    setStatus(id: string, status: ContractClauseStatus): Promise<ContractClauseTemplate>;
    setAudience(id: string, audience: ContractClauseAudience): Promise<ContractClauseTemplate>;
    setCatalogLinks(id: string, catalogItemIds: string[]): Promise<ContractClauseTemplate>;
  };
  quotes: {
    get(quoteId: string): Promise<QuoteContractBuild>;
    presentation(quoteId: string): Promise<ContractPresentation>;
    sync(quoteId: string): Promise<QuoteContractBuild>;
    addCustom(quoteId: string, input: QuoteContractClauseInput): Promise<QuoteContractBuild>;
    updateClause(id: string, input: QuoteContractClauseUpdate): Promise<QuoteContractBuild>;
    resetClause(id: string): Promise<QuoteContractBuild>;
    removeCustom(id: string): Promise<QuoteContractBuild>;
    reorder(quoteId: string, clauseIds: string[]): Promise<QuoteContractBuild>;
  };
  previewReference(typeId:string,typeVersionId:string,catalogVersionId:string,audience:QuoteContractAudience):Promise<ContractPresentation>;
  copyText(text: string): Promise<void>;
}
