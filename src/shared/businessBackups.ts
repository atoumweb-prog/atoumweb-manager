export const BUSINESS_BACKUP_TYPES = [
  'complete', 'database', 'files_code', 'config_export',
  'pre_intervention', 'post_validation', 'other',
] as const;
export type BusinessBackupType = (typeof BUSINESS_BACKUP_TYPES)[number];

export const BUSINESS_BACKUP_LOCATION_TYPES = ['server', 'local', 'external', 'other'] as const;
export type BusinessBackupLocationType = (typeof BUSINESS_BACKUP_LOCATION_TYPES)[number];

export interface BusinessBackupRecordInput {
  clientAccountId?: string | null;
  projectId?: string | null;
  backupType: BusinessBackupType;
  label: string;
  backupAt?: string | null;
  sizeBytes?: number | null;
  checksumSha256?: string | null;
  notes?: string | null;
}

export interface BusinessBackupLocationInput {
  locationType: BusinessBackupLocationType;
  label: string;
  pathOrReference: string;
  notes?: string | null;
}

export interface BusinessBackupLocation {
  id: string;
  backupRecordId: string;
  locationType: BusinessBackupLocationType;
  label: string;
  pathOrReference: string;
  verifiedAt?: string | null;
  lastCheckedAt?: string | null;
  missingAt?: string | null;
  exists?: boolean | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessBackupRecord {
  id: string;
  clientAccountId?: string | null;
  projectId?: string | null;
  backupType: BusinessBackupType;
  label: string;
  backupAt: string;
  sizeBytes?: number | null;
  checksumSha256?: string | null;
  stable: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  locations: BusinessBackupLocation[];
}

export interface BusinessBackupFilters {
  clientAccountId?: string | null;
  projectId?: string | null;
  backupType?: BusinessBackupType | null;
  locationType?: BusinessBackupLocationType | null;
  search?: string | null;
}

export interface BusinessBackupOverview {
  latestKnown?: BusinessBackupRecord | null;
  latestLocal?: BusinessBackupRecord | null;
  latestStable?: BusinessBackupRecord | null;
  totalRecords: number;
  localCopies: number;
  missingLocalCopies: number;
}

export interface BusinessBackupOpenResult {
  ok: boolean;
  error?: string | null;
}

export interface BusinessBackupsApi {
  list(filters?: BusinessBackupFilters): Promise<BusinessBackupRecord[]>;
  get(id: string): Promise<BusinessBackupRecord>;
  create(input: BusinessBackupRecordInput): Promise<BusinessBackupRecord>;
  addLocation(recordId: string, input: BusinessBackupLocationInput): Promise<BusinessBackupRecord>;
  verifyLocation(locationId: string): Promise<BusinessBackupRecord>;
  markStable(recordId: string): Promise<BusinessBackupRecord>;
  overview(filters?: Pick<BusinessBackupFilters, 'clientAccountId' | 'projectId'>): Promise<BusinessBackupOverview>;
  relocalize(locationId: string): Promise<BusinessBackupRecord>;
  openLocation(locationId: string): Promise<BusinessBackupOpenResult>;
}
