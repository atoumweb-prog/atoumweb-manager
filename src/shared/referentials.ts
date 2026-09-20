import type { ProjectTechnicalContentType } from './projects';

export const ATOUMWEB_LIBRARY_CATEGORIES = [
  'header', 'footer', 'hero', 'page', 'section', 'form', 'gallery', 'carousel',
  'navigation', 'css', 'javascript', 'php', 'woocommerce', 'acf', 'divi', 'app', 'note',
] as const;
export type AtoumWebLibraryCategory = (typeof ATOUMWEB_LIBRARY_CATEGORIES)[number];

export const ATOUMWEB_REUSE_STATUSES = ['ready', 'adapt', 'reference'] as const;
export type AtoumWebReuseStatus = (typeof ATOUMWEB_REUSE_STATUSES)[number];

export const ATOUMWEB_TECHNICAL_ASSET_ROLES = ['screenshot', 'preview', 'source', 'attachment'] as const;
export type AtoumWebTechnicalAssetRole = (typeof ATOUMWEB_TECHNICAL_ASSET_ROLES)[number];

export interface AtoumWebTechnicalItemInput {
  category: AtoumWebLibraryCategory;
  name: string;
  description?: string | null;
  tags?: string[];
  reuseStatus: AtoumWebReuseStatus;
  originTechnicalItemId?: string | null;
}

export interface AtoumWebTechnicalVersionInput {
  contentType: ProjectTechnicalContentType;
  language?: string | null;
  contentText?: string | null;
  notes?: string | null;
}

export interface AtoumWebTechnicalVersion extends AtoumWebTechnicalVersionInput {
  id: string;
  itemId: string;
  versionNumber: number;
  current: boolean;
  stable: boolean;
  createdAt: string;
}

export interface AtoumWebTechnicalAsset {
  id: string;
  versionId: string;
  role: AtoumWebTechnicalAssetRole;
  relativePath: string;
  fileName: string;
  mimeType?: string | null;
  sizeBytes: number;
  checksumSha256: string;
  missing: boolean;
  createdAt: string;
}

export interface AtoumWebAssetPreview {
  available: boolean;
  dataUrl?: string | null;
  mimeType?: string | null;
  width?: number | null;
  height?: number | null;
  error?: string | null;
}

export interface AtoumWebTechnicalItemSummary extends AtoumWebTechnicalItemInput {
  id: string;
  currentVersion?: AtoumWebTechnicalVersion | null;
  stableVersion?: AtoumWebTechnicalVersion | null;
  versionCount: number;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
}

export interface AtoumWebTechnicalItemDetail extends AtoumWebTechnicalItemSummary {
  versions: AtoumWebTechnicalVersion[];
}

export interface AtoumWebTechnicalLibraryFilters {
  search?: string | null;
  category?: AtoumWebLibraryCategory | null;
  reuseStatus?: AtoumWebReuseStatus | null;
  includeArchived?: boolean;
}

export interface AtoumWebAssetOpenResult {
  ok: boolean;
  error?: string | null;
}

export interface ReusePreparationInput {
  itemId: string;
  versionId?: string | null;
  adaptationNotes?: string | null;
}

export interface ReusePreparationCopiedFile {
  resourceId: string;
  fileName: string;
  sourceRelativePath: string;
  packageRelativePath?: string | null;
  copied: boolean;
  missing: boolean;
  checksumSha256?: string | null;
}

export interface ReusePreparationResult {
  projectId: string;
  itemId: string;
  versionId: string;
  versionNumber: number;
  packageDirectory: string;
  manifestPath: string;
  contentPath?: string | null;
  adaptationNotesPath: string;
  copiedFiles: ReusePreparationCopiedFile[];
  createdAt: string;
}

export interface ReuseCreateGlobalInput {
  preparation: ReusePreparationResult;
  item: Omit<AtoumWebTechnicalItemInput, 'originTechnicalItemId'>;
  version: AtoumWebTechnicalVersionInput;
}

export interface AtoumWebPackageExportResult {
  path: string;
  fileName: string;
  itemId: string;
  versionId: string;
  versionNumber: number;
  assetCount: number;
  createdAt: string;
}

export interface AtoumWebPackageDuplicateCandidate {
  itemId: string;
  name: string;
  category: AtoumWebLibraryCategory;
  reason: 'same_name_category' | 'same_content';
}

export interface AtoumWebPackageInspection {
  packagePath: string;
  schemaVersion: number;
  item: Omit<AtoumWebTechnicalItemInput, 'originTechnicalItemId'>;
  version: AtoumWebTechnicalVersionInput & { exportedVersionNumber: number; stable: boolean };
  assetCount: number;
  missingAssetCount: number;
  probableDuplicates: AtoumWebPackageDuplicateCandidate[];
}

export interface AtoumWebPackageImportInput {
  packagePath: string;
  mode: 'new_item' | 'new_version';
  targetItemId?: string | null;
  itemOverrides?: Partial<Omit<AtoumWebTechnicalItemInput, 'originTechnicalItemId'>>;
  markStable?: boolean;
}

export interface AtoumWebPackageImportResult {
  item: AtoumWebTechnicalItemDetail;
  importedAssetCount: number;
  importedAs: 'new_item' | 'new_version';
}

export interface ReferentialsApi {
  library: {
    list(filters?: AtoumWebTechnicalLibraryFilters): Promise<AtoumWebTechnicalItemSummary[]>;
    get(id: string): Promise<AtoumWebTechnicalItemDetail>;
    create(item: AtoumWebTechnicalItemInput, version: AtoumWebTechnicalVersionInput): Promise<AtoumWebTechnicalItemDetail>;
    update(id: string, input: Partial<AtoumWebTechnicalItemInput>): Promise<AtoumWebTechnicalItemDetail>;
    createVersion(itemId: string, version: AtoumWebTechnicalVersionInput): Promise<AtoumWebTechnicalItemDetail>;
    markStable(versionId: string): Promise<AtoumWebTechnicalItemDetail>;
    archive(itemId: string): Promise<AtoumWebTechnicalItemDetail>;
    reactivate(itemId: string): Promise<AtoumWebTechnicalItemDetail>;
    assets: {
      list(versionId: string): Promise<AtoumWebTechnicalAsset[]>;
      importFiles(versionId: string, role: AtoumWebTechnicalAssetRole): Promise<AtoumWebTechnicalAsset[]>;
      preview(assetId: string): Promise<AtoumWebAssetPreview>;
      openFile(assetId: string): Promise<AtoumWebAssetOpenResult>;
      openFolder(versionId: string): Promise<AtoumWebAssetOpenResult>;
    };
  };
  reuse: {
    prepareProjectItem(input: ReusePreparationInput): Promise<ReusePreparationResult>;
    createGlobal(input: ReuseCreateGlobalInput): Promise<AtoumWebTechnicalItemDetail>;
    openPackage(path: string): Promise<AtoumWebAssetOpenResult>;
  };
  packages: {
    exportItem(itemId: string, versionId?: string | null): Promise<AtoumWebPackageExportResult>;
    inspectImport(): Promise<AtoumWebPackageInspection | null>;
    importPackage(input: AtoumWebPackageImportInput): Promise<AtoumWebPackageImportResult>;
    showExport(path: string): Promise<AtoumWebAssetOpenResult>;
  };
}
