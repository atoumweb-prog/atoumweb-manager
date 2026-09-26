export type BridgeSnapshotType = 'full' | 'partial';
export type BridgeScanStatus = 'complete' | 'complete_with_warnings' | 'partial_failure' | 'failed';

export interface BridgeSnapshotCounts {
  pages: number;
  nodes: number;
  sources: number;
  assets: number;
  dependencies: number;
  relations: number;
  objects: number;
}

export interface BridgeSnapshotIssue {
  code: string;
  severity: 'info' | 'warning' | 'error' | 'fatal' | string;
  scope: string;
  entityRef: string | null;
  message: string;
}

export interface BridgeSnapshotInspection {
  packagePath: string;
  contract: string;
  schemaVersion: string;
  bridgeVersion: string;
  fingerprintProfile: string;
  generatedAt: string;
  sourceInstanceId: string;
  sourceSiteKey: string;
  externalSnapshotId: string;
  snapshotType: BridgeSnapshotType;
  scanStatus: BridgeScanStatus | string;
  packageFingerprint: string;
  site: {
    name: string;
    canonicalUrl: string | null;
    wordpressSiteUrl: string | null;
    environment: string | null;
    timezone: string | null;
  };
  counts: BridgeSnapshotCounts;
  issues: BridgeSnapshotIssue[];
  coverage: Record<string, unknown>;
  scannerCapabilities: Record<string, unknown>;
  observedContent: Record<string, unknown>;
  security: Record<string, unknown>;
  checksumsVerified: boolean;
}

export interface BridgeSiteSummary {
  id: string;
  name: string;
  canonicalUrl: string | null;
  wordpressSiteUrl: string | null;
  environment: string | null;
  sourceInstanceId: string;
  sourceSiteKey: string;
  createdAt: string;
  updatedAt: string;
  lastSnapshotAt: string | null;
  snapshotCount: number;
  latestPageCount: number;
  latestScanStatus: string | null;
}

export interface BridgeSnapshotSummary {
  id: string;
  siteId: string;
  externalSnapshotId: string;
  packageFingerprint: string;
  generatedAt: string;
  importedAt: string;
  snapshotType: BridgeSnapshotType | string;
  scanStatus: string;
  bridgeVersion: string;
  schemaVersion: string;
  fingerprintProfile: string;
  counts: BridgeSnapshotCounts;
  issues: BridgeSnapshotIssue[];
  coverage: Record<string, unknown>;
  scannerCapabilities: Record<string, unknown>;
  observedContent: Record<string, unknown>;
  security: Record<string, unknown>;
  packageRelativePath: string | null;
}

export interface BridgeSiteDetail extends BridgeSiteSummary {
  snapshots: BridgeSnapshotSummary[];
}

export interface BridgePageSummary {
  pageId: string;
  pageSnapshotId: string;
  externalPageSnapshotId: string;
  snapshotId: string;
  sourcePageKey: string;
  sourcePostId: number | null;
  postType: string;
  status: string | null;
  title: string;
  slug: string | null;
  canonicalUrl: string | null;
  storageFormat: string | null;
  builder: string | null;
  builderGeneration: string | null;
  isDiviContent: boolean;
  scope: string | null;
  auditStatus: string | null;
  rawObjectRef: string | null;
  nodeCount: number;
  sourceCount: number;
  assetCount: number;
  dependencyCount: number;
}

export interface BridgeNodeSummary {
  occurrenceId: string;
  logicalNodeId: string | null;
  parentOccurrenceId: string | null;
  position: number;
  ordinal: number;
  depth: number;
  nodeType: string;
  moduleType: string | null;
  label: string | null;
  builder: string | null;
  builderGeneration: string | null;
  classes: string[];
  ids: string[];
  sourceIds: string[];
  assetIds: string[];
  dependencyIds: string[];
  relationIds: string[];
  rawObjectRef: string | null;
  contentObjectRef: string | null;
  fingerprints: Record<string, unknown>;
  matchingHints: Record<string, unknown>;
}

export interface BridgeSourceSummary {
  sourceId: string;
  kind: string;
  scope: string;
  origin: string;
  owner: string;
  ownerSlug: string | null;
  managedExternally: boolean;
  nodeOccurrenceId: string | null;
  payloadObjectRef: string | null;
  fingerprint: string | null;
  lines: number | null;
  bytes: number | null;
  evidence: Record<string, unknown>;
}

export interface BridgeAssetSummary {
  assetId: string;
  type: string;
  wordpressAttachmentId: number | null;
  url: string | null;
  localPath: string | null;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  sizeBytes: number | null;
  hash: string | null;
  archiveMode: string | null;
}

export interface BridgeDependencySummary {
  dependencyId: string;
  type: string;
  slug: string | null;
  name: string;
  version: string | null;
  active: boolean | null;
}

export interface BridgePageSnapshotDetail {
  page: BridgePageSummary;
  nodes: BridgeNodeSummary[];
  sources: BridgeSourceSummary[];
  assets: BridgeAssetSummary[];
  dependencies: BridgeDependencySummary[];
  metadata: Record<string, unknown>;
}

export interface BridgeObjectPreview {
  objectRef: string;
  contentType: string | null;
  serialization: string | null;
  encoding: string | null;
  byteLength: number;
  available: boolean;
  text: string | null;
  truncated: boolean;
}

export interface BridgeReuseAnalysis {
  status: 'ready' | 'dependencies' | 'review';
  suggestedName: string;
  suggestedCategory: 'header' | 'footer' | 'hero' | 'section' | 'form' | 'gallery' | 'carousel' | 'navigation' | 'divi';
  rootClasses: string[];
  relevantPageCss: string;
  relevantGlobalCss: string;
  relevantPageRuleCount: number;
  relevantGlobalRuleCount: number;
  pageCssRuleCount: number;
  globalCssRuleCount: number;
  moduleAssetCount: number;
  moduleDependencyCount: number;
  instructions: string[];
  notes: string[];
}

export interface BridgeModulePreview {
  pageSnapshotId: string;
  occurrenceId: string;
  moduleType: string | null;
  label: string | null;
  builderGeneration: string | null;
  pageTitle: string;
  pageUrl: string | null;
  html: string;
  moduleCss: string;
  pageCss: string;
  globalCss: string;
  javascript: string;
  diviSource: string | null;
  sourceCounts: {
    html: number;
    moduleCss: number;
    pageCss: number;
    globalCss: number;
    javascript: number;
  };
  frontendValidated: boolean;
  htmlDerivedFromDiviSource: boolean;
  reuse: BridgeReuseAnalysis;
}

export interface BridgePagePreview {
  pageSnapshotId: string;
  title: string;
  url: string | null;
  builderGeneration: string | null;
  html: string;
  moduleCss: string;
  pageCss: string;
  globalCss: string;
  renderedModuleCount: number;
  totalModuleCount: number;
  omittedModuleCount: number;
  frontendValidated: boolean;
}

export interface BridgeSnapshotImportResult {
  alreadyImported: boolean;
  site: BridgeSiteSummary;
  snapshot: BridgeSnapshotSummary;
}

export type BridgeSnapshotDiffStatus = 'added' | 'removed' | 'changed' | 'unchanged';

export interface BridgeSnapshotPageDiff {
  sourcePageKey: string;
  status: BridgeSnapshotDiffStatus;
  titleBefore: string | null;
  titleAfter: string | null;
  beforePageSnapshotId: string | null;
  afterPageSnapshotId: string | null;
  changes: {
    title: boolean;
    status: boolean;
    url: boolean;
    builder: boolean;
    rawObject: boolean;
    fingerprints: boolean;
    nodes: boolean;
    sources: boolean;
    assets: boolean;
    dependencies: boolean;
  };
  counts: {
    nodesBefore: number;
    nodesAfter: number;
    sourcesBefore: number;
    sourcesAfter: number;
    assetsBefore: number;
    assetsAfter: number;
    dependenciesBefore: number;
    dependenciesAfter: number;
  };
}

export interface BridgeSnapshotDiff {
  siteId: string;
  before: BridgeSnapshotSummary;
  after: BridgeSnapshotSummary;
  warnings: string[];
  summary: {
    added: number;
    removed: number;
    changed: number;
    unchanged: number;
  };
  pages: BridgeSnapshotPageDiff[];
}

export type BridgeNodeMatchConfidence = 'high' | 'medium' | 'low';

export interface BridgeNodeMatchCandidate {
  beforeOccurrenceId: string;
  afterOccurrenceId: string;
  beforeLabel: string;
  afterLabel: string;
  nodeType: string;
  moduleType: string | null;
  score: number;
  confidence: BridgeNodeMatchConfidence;
  reasons: string[];
}

export interface BridgePageNodeMatchReview {
  beforePageSnapshotId: string;
  afterPageSnapshotId: string;
  sourcePageKey: string;
  candidates: BridgeNodeMatchCandidate[];
  unmatchedBefore: string[];
  unmatchedAfter: string[];
  ambiguousBefore: string[];
}

export interface BridgeSnapshotDiagnosticExportResult {
  cancelled: boolean;
  path?: string;
}

export interface BridgeSnapshotsApi {
  inspectImport(): Promise<BridgeSnapshotInspection | null>;
  importSnapshot(packagePath: string): Promise<BridgeSnapshotImportResult>;
  listSites(): Promise<BridgeSiteSummary[]>;
  getSite(id: string): Promise<BridgeSiteDetail>;
  listPages(snapshotId: string, search?: string | null): Promise<BridgePageSummary[]>;
  getPage(pageSnapshotId: string): Promise<BridgePageSnapshotDetail>;
  getObjectPreview(objectRef: string): Promise<BridgeObjectPreview>;
  getModulePreview(pageSnapshotId: string, occurrenceId: string): Promise<BridgeModulePreview>;
  getPagePreview(pageSnapshotId: string): Promise<BridgePagePreview>;
  compareSnapshots(beforeSnapshotId: string, afterSnapshotId: string): Promise<BridgeSnapshotDiff>;
  reviewPageNodeMatches(beforePageSnapshotId: string, afterPageSnapshotId: string): Promise<BridgePageNodeMatchReview>;
  exportDiagnostic(snapshotId: string): Promise<BridgeSnapshotDiagnosticExportResult>;
}
