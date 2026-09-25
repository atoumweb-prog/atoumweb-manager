export const ATOUMWEB_SITE_OCCURRENCE_STATES = [
  'created',
  'configured',
  'workbench_created',
  'modified',
  'analyzed',
  'ready_for_review',
  'validated',
  'published',
  'archived',
] as const;

export type AtoumWebSiteOccurrenceState = typeof ATOUMWEB_SITE_OCCURRENCE_STATES[number];
export type AtoumWebOccurrenceFieldValue = string | number | boolean | null;

export interface AtoumWebSiteOccurrenceSourceV1 {
  componentPackageContractVersion: 1;
  fieldsContractVersion: 1;
  identityContractVersion: 1;
  libraryItemId: string;
  libraryVersionId: string;
  libraryVersionNumber: number;
  componentFamilyId: string | null;
  componentKey: string | null;
  libraryVariantId: string | null;
  variantKey: string | null;
  sourcePackageFingerprint?: string | null;
  sourceHtmlSha256?: string | null;
  sourceCssSha256?: string | null;
  sourceJavascriptSha256?: string | null;
}

export interface AtoumWebSiteOccurrenceTargetV1 {
  siteUrl: string | null;
  siteKey: string | null;
  workbenchId: string;
  workbenchPostId: string | null;
  bridgeVersion: string | null;
}

export interface AtoumWebSiteOccurrenceConfigurationV1 {
  fieldValues: Record<string, AtoumWebOccurrenceFieldValue>;
  cssVariables: Record<string, string | number>;
  assetSelections: Record<string, string | null>;
}

export interface AtoumWebSiteOccurrenceChangeSummaryV1 {
  changedFieldIds: string[];
  changedCssVariables: string[];
  changedAssetIds: string[];
  htmlChanged: boolean;
  cssChanged: boolean;
  javascriptChanged: boolean;
  structuralChange: boolean;
}

export interface AtoumWebSiteOccurrenceV1 {
  contract: 'atoumweb_site_occurrence';
  schemaVersion: 1;
  siteOccurrenceId: string;
  createdBy: 'bridge';
  source: AtoumWebSiteOccurrenceSourceV1;
  target: AtoumWebSiteOccurrenceTargetV1;
  state: AtoumWebSiteOccurrenceState;
  configuration: AtoumWebSiteOccurrenceConfigurationV1;
  changes: AtoumWebSiteOccurrenceChangeSummaryV1;
  createdAt: string;
  updatedAt: string;
}

export interface AtoumWebOccurrenceReturnFile {
  path: string;
  sha256: string;
}

export interface AtoumWebOccurrenceReturnManifestV1 {
  contract: 'atoumweb_bridge_occurrence_return';
  schemaVersion: 1;
  occurrenceContractVersion: 1;
  sourceComponentPackageContractVersion: 1;
  returnedAt: string;
  actionPolicy: 'manager_decides';
  siteOccurrenceId: string;
  files: {
    occurrence: AtoumWebOccurrenceReturnFile;
    html: AtoumWebOccurrenceReturnFile;
    css: AtoumWebOccurrenceReturnFile | null;
    javascript: AtoumWebOccurrenceReturnFile | null;
    assets: AtoumWebOccurrenceReturnFile;
    provenance: AtoumWebOccurrenceReturnFile;
  };
  changes: AtoumWebSiteOccurrenceChangeSummaryV1;
}

export function validateSiteOccurrenceV1(value: unknown): string[] {
  const errors: string[] = [];
  if (!value || typeof value !== 'object') return ['Occurrence absente ou invalide.'];
  const occurrence = value as Record<string, unknown>;

  if (occurrence.contract !== 'atoumweb_site_occurrence') errors.push('contract invalide.');
  if (occurrence.schemaVersion !== 1) errors.push('schemaVersion invalide.');
  if (typeof occurrence.siteOccurrenceId !== 'string' || !occurrence.siteOccurrenceId.trim()) errors.push('siteOccurrenceId manquant.');
  if (occurrence.createdBy !== 'bridge') errors.push('createdBy doit valoir bridge.');
  if (typeof occurrence.state !== 'string' || !(ATOUMWEB_SITE_OCCURRENCE_STATES as readonly string[]).includes(occurrence.state)) {
    errors.push('state invalide.');
  }

  validateSource(occurrence.source, errors);
  validateTarget(occurrence.target, errors);
  validateConfiguration(occurrence.configuration, errors);
  validateChanges(occurrence.changes, errors);

  if (!isIsoDate(occurrence.createdAt)) errors.push('createdAt invalide.');
  if (!isIsoDate(occurrence.updatedAt)) errors.push('updatedAt invalide.');

  return errors;
}

export function validateOccurrenceReturnManifestV1(value: unknown): string[] {
  const errors: string[] = [];
  if (!value || typeof value !== 'object') return ['Manifest de retour absent ou invalide.'];
  const manifest = value as Record<string, unknown>;

  if (manifest.contract !== 'atoumweb_bridge_occurrence_return') errors.push('contract de retour invalide.');
  if (manifest.schemaVersion !== 1) errors.push('schemaVersion de retour invalide.');
  if (manifest.occurrenceContractVersion !== 1) errors.push('occurrenceContractVersion invalide.');
  if (manifest.sourceComponentPackageContractVersion !== 1) errors.push('sourceComponentPackageContractVersion invalide.');
  if (manifest.actionPolicy !== 'manager_decides') errors.push('actionPolicy doit valoir manager_decides.');
  if (typeof manifest.siteOccurrenceId !== 'string' || !manifest.siteOccurrenceId.trim()) errors.push('siteOccurrenceId du retour manquant.');
  if (!isIsoDate(manifest.returnedAt)) errors.push('returnedAt invalide.');

  if (!manifest.files || typeof manifest.files !== 'object') {
    errors.push('files manquant.');
  } else {
    const files = manifest.files as Record<string, unknown>;
    validateFile(files.occurrence, 'occurrence', errors, false);
    validateFile(files.html, 'html', errors, false);
    validateFile(files.css, 'css', errors, true);
    validateFile(files.javascript, 'javascript', errors, true);
    validateFile(files.assets, 'assets', errors, false);
    validateFile(files.provenance, 'provenance', errors, false);
  }

  validateChanges(manifest.changes, errors);
  return errors;
}

function validateSource(value: unknown, errors: string[]): void {
  if (!value || typeof value !== 'object') {
    errors.push('source manquante.');
    return;
  }
  const source = value as Record<string, unknown>;
  if (source.componentPackageContractVersion !== 1) errors.push('source.componentPackageContractVersion invalide.');
  if (source.fieldsContractVersion !== 1) errors.push('source.fieldsContractVersion invalide.');
  if (source.identityContractVersion !== 1) errors.push('source.identityContractVersion invalide.');
  if (typeof source.libraryItemId !== 'string' || !source.libraryItemId.trim()) errors.push('source.libraryItemId manquant.');
  if (typeof source.libraryVersionId !== 'string' || !source.libraryVersionId.trim()) errors.push('source.libraryVersionId manquant.');
  if (!Number.isInteger(source.libraryVersionNumber) || Number(source.libraryVersionNumber) < 1) errors.push('source.libraryVersionNumber invalide.');
}

function validateTarget(value: unknown, errors: string[]): void {
  if (!value || typeof value !== 'object') {
    errors.push('target manquante.');
    return;
  }
  const target = value as Record<string, unknown>;
  if (typeof target.workbenchId !== 'string' || !target.workbenchId.trim()) errors.push('target.workbenchId manquant.');
}

function validateConfiguration(value: unknown, errors: string[]): void {
  if (!value || typeof value !== 'object') {
    errors.push('configuration manquante.');
    return;
  }
  const configuration = value as Record<string, unknown>;
  if (!isPrimitiveRecord(configuration.fieldValues)) errors.push('configuration.fieldValues invalide.');
  if (!isStringNumberRecord(configuration.cssVariables)) errors.push('configuration.cssVariables invalide.');
  if (!isNullableStringRecord(configuration.assetSelections)) errors.push('configuration.assetSelections invalide.');
}

function validateChanges(value: unknown, errors: string[]): void {
  if (!value || typeof value !== 'object') {
    errors.push('changes manquant.');
    return;
  }
  const changes = value as Record<string, unknown>;
  if (!isStringArray(changes.changedFieldIds)) errors.push('changes.changedFieldIds invalide.');
  if (!isStringArray(changes.changedCssVariables)) errors.push('changes.changedCssVariables invalide.');
  if (!isStringArray(changes.changedAssetIds)) errors.push('changes.changedAssetIds invalide.');
  for (const key of ['htmlChanged', 'cssChanged', 'javascriptChanged', 'structuralChange']) {
    if (typeof changes[key] !== 'boolean') errors.push(`changes.${key} invalide.`);
  }
}

function validateFile(value: unknown, label: string, errors: string[], nullable: boolean): void {
  if (value == null && nullable) return;
  if (!value || typeof value !== 'object') {
    errors.push(`files.${label} invalide.`);
    return;
  }
  const file = value as Record<string, unknown>;
  if (typeof file.path !== 'string' || !file.path.trim()) errors.push(`files.${label}.path invalide.`);
  if (typeof file.sha256 !== 'string' || !/^[a-f0-9]{64}$/i.test(file.sha256)) errors.push(`files.${label}.sha256 invalide.`);
}

function isPrimitiveRecord(value: unknown): boolean {
  return isRecordWithValues(value, (item) => item == null || typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean');
}

function isStringNumberRecord(value: unknown): boolean {
  return isRecordWithValues(value, (item) => typeof item === 'string' || typeof item === 'number');
}

function isNullableStringRecord(value: unknown): boolean {
  return isRecordWithValues(value, (item) => item == null || typeof item === 'string');
}

function isRecordWithValues(value: unknown, predicate: (item: unknown) => boolean): boolean {
  return Boolean(value)
    && typeof value === 'object'
    && !Array.isArray(value)
    && Object.values(value as Record<string, unknown>).every(predicate);
}

function isStringArray(value: unknown): boolean {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isIsoDate(value: unknown): boolean {
  return typeof value === 'string' && value.length >= 20 && !Number.isNaN(Date.parse(value));
}
