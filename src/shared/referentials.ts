import type { ProjectTechnicalContentType } from './projects';
import type { AtoumWebSiteOccurrenceChangeSummaryV1, AtoumWebSiteOccurrenceV1 } from './siteOccurrence';

export const ATOUMWEB_LIBRARY_CATEGORIES = [
  'header', 'footer', 'hero', 'page', 'section', 'form', 'gallery', 'carousel',
  'navigation', 'code_snippet', 'css', 'javascript', 'php', 'woocommerce', 'acf', 'divi', 'app', 'note',
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
  vertical?: string | null;
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
  componentFamilyId?: string | null;
  componentKey?: string | null;
  familyDisplayName?: string | null;
  libraryVariantId?: string | null;
  variantKey?: string | null;
  variantMode?: 'base' | 'inherit' | 'forked' | null;
  variantOfId?: string | null;
  reusabilityScope?: 'generic' | 'vertical' | 'site_specific' | null;
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
  vertical?: string | null;
  includeArchived?: boolean;
}

export interface AtoumWebDirectReusableCodeInput {
  name: string;
  category: AtoumWebLibraryCategory;
  description?: string | null;
  vertical?: string | null;
  tags?: string[];
  html: string;
  css?: string | null;
  javascript?: string | null;
}

export interface AtoumWebDirectVariantCodeInput {
  sourceItemId: string;
  name: string;
  variantKey?: string | null;
  description?: string | null;
  vertical?: string | null;
  tags?: string[];
  html: string;
  css?: string | null;
  javascript?: string | null;
  reuseStatus?: Extract<AtoumWebReuseStatus, 'adapt' | 'ready'>;
  markStable?: boolean;
  provenanceNote?: string | null;
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

export interface AtoumWebPackageAssetTransport {
  complete: boolean;
  references: Array<{
    assetId: string;
    url: string | null;
    checksumSha256: string | null;
    archivePath: string | null;
    status: 'embedded' | 'missing' | 'external' | 'unresolved';
    reason: string | null;
  }>;
  issues: string[];
}

export interface AtoumWebPackageExportResult {
  assetTransport: AtoumWebPackageAssetTransport;
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
  assetTransport: AtoumWebPackageAssetTransport;
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

export type AtoumWebCompositionStatus = 'draft' | 'packaged' | 'archived';

export interface AtoumWebCompositionInput {
  name: string;
  targetVertical?: string | null;
  notes?: string | null;
}

export interface AtoumWebCompositionItemLocalSettings {
  textEdits?: Array<{ from: string; to: string; target?: string }>;
  colorEdits?: Array<{ from: string; to: string }>;
  visualEdits?: Array<{
    target: string;
    label?: string;
    symbol?: string;
    color?: string;
    backgroundColor?: string;
    hidden?: boolean;
  }>;
  note?: string | null;
}

export interface AtoumWebCompositionItemLocalCodeInput {
  html: string;
  css?: string | null;
  javascript?: string | null;
  settings?: AtoumWebCompositionItemLocalSettings | null;
}

export interface AtoumWebCompositionPromoteVariantInput {
  name: string;
  variantKey?: string | null;
  description?: string | null;
}

export interface AtoumWebCompositionItem {
  id: string;
  compositionId: string;
  sortOrder: number;
  sourceItemId: string;
  sourceVersionId: string;
  sourceVersionNumber: number;
  displayName: string;
  category: AtoumWebLibraryCategory;
  vertical: string | null;
  componentFamilyId: string | null;
  componentKey: string | null;
  libraryVariantId: string | null;
  variantKey: string | null;
  variantMode: 'base' | 'inherit' | 'forked' | null;
  localHtml: string | null;
  localCss: string | null;
  localJavascript: string | null;
  localSettings: AtoumWebCompositionItemLocalSettings;
  localUpdatedAt: string | null;
  hasLocalChanges: boolean;
  createdAt: string;
}

export interface AtoumWebCompositionSummary {
  id: string;
  name: string;
  targetVertical: string | null;
  notes: string | null;
  status: AtoumWebCompositionStatus;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface AtoumWebCompositionDetail extends AtoumWebCompositionSummary {
  items: AtoumWebCompositionItem[];
}

export interface AtoumWebCompositionAddItemInput {
  libraryItemId: string;
  versionId?: string | null;
}

export interface AtoumWebCompositionMoveItemInput {
  targetIndex: number;
}

export interface ProjectPagePackageHistoryEntry {
  exportId: string;
  compositionId: string;
  projectId: string;
  siteId: string;
  pageId: string;
  fingerprint: string;
  componentCount: number;
  createdAt: string;
}

export interface AtoumWebCompositionPackageExportResult {
  compositionId: string;
  exportId?: string | null;
  projectId?: string | null;
  siteId?: string | null;
  pageId?: string | null;
  path: string;
  fileName: string;
  componentCount: number;
  createdAt: string;
}

export type AtoumWebOccurrenceReturnDecision =
  | 'keep_occurrence'
  | 'create_variant'
  | 'update_variant'
  | 'new_family';

export interface AtoumWebOccurrenceVariantTarget {
  variantId: string;
  familyId: string;
  technicalItemId: string;
  itemName: string;
  variantKey: string;
  displayName: string;
  variantMode: 'base' | 'inherit' | 'forked';
  isSourceVariant: boolean;
}

export interface AtoumWebOccurrenceCreateVariantInput {
  name: string;
  variantKey?: string | null;
}

export interface AtoumWebOccurrenceUpdateVariantInput {
  targetVariantId: string;
}

export interface AtoumWebOccurrenceCreateFamilyInput {
  name: string;
  componentKey?: string | null;
}

export interface AtoumWebOccurrenceReturnSummary {
  id: string;
  packageFingerprint: string;
  siteOccurrenceId: string;
  libraryItemId: string;
  libraryVersionId: string;
  libraryVersionNumber: number;
  libraryItemName: string;
  returnedAt: string;
  occurrenceState: string;
  changes: AtoumWebSiteOccurrenceChangeSummaryV1;
  decision: AtoumWebOccurrenceReturnDecision | null;
  decidedAt: string | null;
  resultTechnicalItemId: string | null;
  resultVariantId: string | null;
  createdAt: string;
}

export interface AtoumWebOccurrenceReturnDetail extends AtoumWebOccurrenceReturnSummary {
  occurrence: AtoumWebSiteOccurrenceV1;
  html: string;
  css: string | null;
  javascript: string | null;
  assets: Record<string, unknown>;
  provenance: Record<string, unknown>;
  packageRelativePath: string;
}

export interface AtoumWebOccurrenceReturnInspection {
  packagePath: string;
  packageFingerprint: string;
  siteOccurrenceId: string;
  libraryItemId: string;
  libraryVersionId: string;
  libraryVersionNumber: number;
  libraryItemName: string;
  returnedAt: string;
  occurrenceState: string;
  changes: AtoumWebSiteOccurrenceChangeSummaryV1;
  alreadyImported: boolean;
  existingReturnId: string | null;
}

export interface ReferentialsApi {
  library: {
    list(filters?: AtoumWebTechnicalLibraryFilters): Promise<AtoumWebTechnicalItemSummary[]>;
    get(id: string): Promise<AtoumWebTechnicalItemDetail>;
    create(item: AtoumWebTechnicalItemInput, version: AtoumWebTechnicalVersionInput): Promise<AtoumWebTechnicalItemDetail>;
    createReusableCode(input: AtoumWebDirectReusableCodeInput): Promise<AtoumWebTechnicalItemDetail>;
    createVariantCode(input: AtoumWebDirectVariantCodeInput): Promise<AtoumWebTechnicalItemDetail>;
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
  compositions: {
    getForProjectPage(projectNodeId: string): Promise<AtoumWebCompositionDetail | null>;
    ensureForProjectPage(projectNodeId: string): Promise<AtoumWebCompositionDetail>;
    attachToProjectPage(projectNodeId: string, compositionId: string): Promise<AtoumWebCompositionDetail>;
    detachFromProjectPage(projectNodeId: string): Promise<void>;
    list(includeArchived?: boolean): Promise<AtoumWebCompositionSummary[]>;
    get(id: string): Promise<AtoumWebCompositionDetail>;
    create(input: AtoumWebCompositionInput): Promise<AtoumWebCompositionDetail>;
    update(id: string, input: Partial<AtoumWebCompositionInput>): Promise<AtoumWebCompositionDetail>;
    addItem(id: string, input: AtoumWebCompositionAddItemInput): Promise<AtoumWebCompositionDetail>;
    updateItemLocalCode(id: string, itemId: string, input: AtoumWebCompositionItemLocalCodeInput): Promise<AtoumWebCompositionDetail>;
    resetItemLocalCode(id: string, itemId: string): Promise<AtoumWebCompositionDetail>;
    promoteItemVariant(id: string, itemId: string, input: AtoumWebCompositionPromoteVariantInput): Promise<AtoumWebTechnicalItemDetail>;
    removeItem(id: string, itemId: string): Promise<AtoumWebCompositionDetail>;
    moveItem(id: string, itemId: string, input: AtoumWebCompositionMoveItemInput): Promise<AtoumWebCompositionDetail>;
    restoreOrder(id: string, expectedIds: string[], targetIds: string[]): Promise<AtoumWebCompositionDetail>;
    archive(id: string): Promise<AtoumWebCompositionDetail>;
    reactivate(id: string): Promise<AtoumWebCompositionDetail>;
    exportPackage(id: string): Promise<AtoumWebCompositionPackageExportResult>;
    exportPagePackage(projectNodeId: string): Promise<AtoumWebCompositionPackageExportResult>;
    listPageExports(projectNodeId: string): Promise<ProjectPagePackageHistoryEntry[]>;
    showPackage(path: string): Promise<AtoumWebAssetOpenResult>;
  };
  occurrenceReturns: {
    list(): Promise<AtoumWebOccurrenceReturnSummary[]>;
    get(id: string): Promise<AtoumWebOccurrenceReturnDetail>;
    inspectImport(): Promise<AtoumWebOccurrenceReturnInspection | null>;
    importReturn(packagePath: string): Promise<AtoumWebOccurrenceReturnDetail>;
    keepOccurrence(id: string): Promise<AtoumWebOccurrenceReturnDetail>;
    listVariantTargets(id: string): Promise<AtoumWebOccurrenceVariantTarget[]>;
    createVariant(id: string, input: AtoumWebOccurrenceCreateVariantInput): Promise<AtoumWebOccurrenceReturnDetail>;
    updateVariant(id: string, input: AtoumWebOccurrenceUpdateVariantInput): Promise<AtoumWebOccurrenceReturnDetail>;
    createFamily(id: string, input: AtoumWebOccurrenceCreateFamilyInput): Promise<AtoumWebOccurrenceReturnDetail>;
  };
}
