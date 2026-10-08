import type { ContractClauseStatus, ContractClauseVersionStatus } from './contractTerms';

export interface ContractTypeVersion {
  id: string; typeId: string; versionNumber: number; name: string; description: string;
  status: ContractClauseVersionStatus; moduleIds: string[]; createdAt: string; publishedAt: string | null;
}
export interface ContractTypeCatalogLink {
  catalogVersionId: string; itemId: string; canonicalCode: string | null; name: string;
  versionNumber: number; status: string;
}
export interface ContractType {
  id: string; code: string; status: ContractClauseStatus; currentVersionId: string | null;
  currentVersion: ContractTypeVersion | null; versions: ContractTypeVersion[];
  catalogLinks: ContractTypeCatalogLink[];
}
export interface ContractTypeVersionInput { name: string; description: string; moduleIds: string[] }
export interface ContractTypeReference {
  id: string; code: string; name: string; versionId: string; versionNumber: number;
  moduleIds: string[]; catalogVersionIds: string[];
}
export interface ContractTypesApi {
  list(includeArchived?: boolean): Promise<ContractType[]>;
  get(id: string): Promise<ContractType>;
  create(code: string, input: ContractTypeVersionInput): Promise<ContractType>;
  createVersion(id: string, input: ContractTypeVersionInput): Promise<ContractType>;
  updateDraft(versionId: string, input: ContractTypeVersionInput): Promise<ContractType>;
  publish(versionId: string): Promise<ContractType>;
  setStatus(id: string, status: ContractClauseStatus): Promise<ContractType>;
  catalog(versionId: string): Promise<ContractType[]>;
  setCatalog(versionId: string, typeIds: string[]): Promise<ContractType[]>;
  initialize(): Promise<{ created: number; linked: number; unchanged: number }>;
}
