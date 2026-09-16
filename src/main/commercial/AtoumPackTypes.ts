export type CatalogItemType = 'offer' | 'service';
export type CatalogPriceMode = 'fixed' | 'starting_from' | 'hourly' | 'monthly' | 'yearly' | 'quote_only' | 'free';

export type PackageManifest = {
  format: string;
  schemaVersion: string;
  packageId: string;
  packageVersion: string;
  displayName: string;
  description?: string | null;
  compatibility?: { requiredCapabilities?: string[] };
  installHints?: { localAliases?: Record<string, string[]> };
};

export type PackageCatalogEntry = {
  ref: string;
  item: {
    type: CatalogItemType;
    name: string;
    category?: string | null;
    subcategory?: string | null;
    visiblePublic?: boolean;
  };
  version: {
    description?: string | null;
    inclusions?: string[];
    exclusions?: string[];
    prerequisites?: string[];
    priceMode: CatalogPriceMode;
    priceCents?: number | null;
    recommendedPriceCents?: number | null;
    estimatedMinutes?: number | null;
    recommendedDelayDays?: number | null;
    defaultDepositPercent?: number | null;
    contractType?: string | null;
    internalAdvice?: string | null;
    specialTerms?: string | null;
  };
};

export type PackageRequirement = {
  ref: string;
  purpose?: string | null;
  resolution: 'must_resolve' | 'optional' | 'create_if_missing';
};

export type PackageDocumentTemplate = {
  ref: string;
  kind: string;
  version: string;
  format: string;
  mediaType?: string | null;
  file: string;
  engine?: string | null;
  [key: string]: unknown;
};

export type AtoumPackageData = {
  manifest: PackageManifest;
  catalog: {
    entries: PackageCatalogEntry[];
    requirements?: PackageRequirement[];
    offerCompositions?: Array<{ offerRef: string; components: unknown[] }>;
    [key: string]: unknown;
  };
  documents?: {
    templates?: PackageDocumentTemplate[];
    variableBindings?: Array<Record<string, unknown>>;
    parts?: Array<Record<string, unknown>>;
    contracts?: Array<Record<string, unknown>>;
    [key: string]: unknown;
  };
  dependencies?: Array<{
    ref: string;
    kind: string;
    resolution: string;
    requiredCapability?: string | null;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
};

export interface AtoumPackageSummary {
  id: string;
  packageId: string;
  packageVersion: string;
  schemaVersion: string;
  displayName: string;
  state: 'staged' | 'installed' | 'disabled' | 'error';
  capabilityGaps: string[];
  sourceSha256: string;
  installedAt: string;
  updatedAt: string;
}

export type CatalogMapping = { itemId: string; versionId: string };

export type CatalogItemRow = Record<string, unknown> & { id: string; item_type: CatalogItemType };
export type CatalogVersionRow = Record<string, unknown> & {
  id: string;
  item_id: string;
  version_number: number;
  description: string | null;
  inclusions_json: string;
  exclusions_json: string;
  prerequisites_json: string;
  price_mode: CatalogPriceMode;
  price_cents: number | null;
  recommended_price_cents: number | null;
  estimated_minutes: number | null;
  recommended_delay_days: number | null;
  default_deposit_percent: number | null;
  contract_type: string | null;
  internal_advice: string | null;
  special_terms: string | null;
};
