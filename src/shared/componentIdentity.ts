export const ATOUMWEB_COMPONENT_REUSABILITY_SCOPES = ['generic', 'vertical', 'site_specific', 'unclassified'] as const;
export type AtoumWebComponentReusabilityScope = typeof ATOUMWEB_COMPONENT_REUSABILITY_SCOPES[number];

export const ATOUMWEB_COMPONENT_VARIANT_MODES = ['base', 'inherit', 'forked', 'none'] as const;
export type AtoumWebComponentVariantMode = typeof ATOUMWEB_COMPONENT_VARIANT_MODES[number];

export interface AtoumWebComponentIdentityV1 {
  contract: 'atoumweb_component_identity';
  schemaVersion: 1;
  classificationStatus: 'classified' | 'unclassified';
  libraryDisplayName: string;
  componentFamilyId: string | null;
  componentKey: string | null;
  libraryVariantId: string | null;
  variantKey: string | null;
  variantOf: string | null;
  variantMode: AtoumWebComponentVariantMode;
  vertical: string | null;
  reusabilityScope: AtoumWebComponentReusabilityScope;
  tags: string[];
  libraryItemId: string;
  libraryVersionId: string;
  libraryVersionNumber: number;
}

export interface AtoumWebComponentIdentityInput {
  libraryDisplayName: string;
  libraryItemId: string;
  libraryVersionId: string;
  libraryVersionNumber: number;
  tags?: string[] | null;
  componentFamilyId?: string | null;
  componentKey?: string | null;
  libraryVariantId?: string | null;
  variantKey?: string | null;
  variantOf?: string | null;
  variantMode?: AtoumWebComponentVariantMode | null;
  vertical?: string | null;
  reusabilityScope?: AtoumWebComponentReusabilityScope | null;
}

export function buildComponentIdentityV1(input: AtoumWebComponentIdentityInput): AtoumWebComponentIdentityV1 {
  const componentKey = normalizeComponentKey(input.componentKey);
  const componentFamilyId = normalizeOpaqueId(input.componentFamilyId);
  const variantId = normalizeOpaqueId(input.libraryVariantId);
  const variantKey = normalizeSlug(input.variantKey);
  const variantOf = normalizeComponentKey(input.variantOf) ?? normalizeOpaqueId(input.variantOf);
  const vertical = normalizeSlug(input.vertical);
  const scope = input.reusabilityScope && ATOUMWEB_COMPONENT_REUSABILITY_SCOPES.includes(input.reusabilityScope)
    ? input.reusabilityScope
    : 'unclassified';
  const variantMode = input.variantMode && ATOUMWEB_COMPONENT_VARIANT_MODES.includes(input.variantMode)
    ? input.variantMode
    : variantId || variantKey ? 'inherit' : 'none';
  const classified = Boolean(componentKey && scope !== 'unclassified');

  return {
    contract: 'atoumweb_component_identity',
    schemaVersion: 1,
    classificationStatus: classified ? 'classified' : 'unclassified',
    libraryDisplayName: input.libraryDisplayName.trim() || 'Composant AtoumWeb',
    componentFamilyId,
    componentKey,
    libraryVariantId: variantId,
    variantKey,
    variantOf,
    variantMode,
    vertical,
    reusabilityScope: scope,
    tags: uniqueStrings(input.tags ?? []),
    libraryItemId: input.libraryItemId,
    libraryVersionId: input.libraryVersionId,
    libraryVersionNumber: input.libraryVersionNumber,
  };
}

export function normalizeComponentKey(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const normalized = value.trim().toLowerCase();
  return /^aw-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized) ? normalized : null;
}

export function normalizeSlug(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const normalized = value
    .trim()
    .toLocaleLowerCase('fr-FR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || null;
}

function normalizeOpaqueId(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}
