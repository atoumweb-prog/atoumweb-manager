export const CATALOG_ITEM_TYPES = ['service', 'offer'] as const;
export const CATALOG_ITEM_STATUSES = ['active', 'inactive', 'archived'] as const;
export const CATALOG_VERSION_STATUSES = ['draft', 'published', 'retired'] as const;
export const PRICE_MODES = ['fixed', 'starting_from', 'hourly', 'monthly', 'yearly', 'quote_only', 'free'] as const;

export type CatalogItemType = (typeof CATALOG_ITEM_TYPES)[number];
export type CatalogItemStatus = (typeof CATALOG_ITEM_STATUSES)[number];
export type CatalogVersionStatus = (typeof CATALOG_VERSION_STATUSES)[number];
export type PriceMode = (typeof PRICE_MODES)[number];

export interface CatalogItemInput {
  type: CatalogItemType;
  name: string;
  category?: string | null;
  visiblePublic?: boolean;
}

export interface CatalogVersionInput {
  description?: string | null;
  inclusions?: string[];
  exclusions?: string[];
  prerequisites?: string[];
  priceMode: PriceMode;
  priceCents?: number | null;
  recommendedPriceCents?: number | null;
  estimatedMinutes?: number | null;
  recommendedDelayDays?: number | null;
  defaultDepositPercent?: number | null;
  contractType?: string | null;
  internalAdvice?: string | null;
}

export interface CatalogVersion extends CatalogVersionInput {
  id: string;
  itemId: string;
  versionNumber: number;
  status: CatalogVersionStatus;
  publishedAt?: string | null;
  createdAt: string;
}

export interface CatalogItemSummary {
  id: string;
  type: CatalogItemType;
  name: string;
  category?: string | null;
  status: CatalogItemStatus;
  visiblePublic: boolean;
  currentVersion?: CatalogVersion | null;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
}

export interface CatalogItemDetail extends CatalogItemSummary {
  versions: CatalogVersion[];
}

export interface CatalogFilters {
  search?: string | null;
  type?: CatalogItemType | null;
  status?: CatalogItemStatus | null;
  category?: string | null;
  visiblePublic?: boolean | null;
  priceMode?: PriceMode | null;
}

export interface CatalogApi {
  list(filters?: CatalogFilters): Promise<CatalogItemSummary[]>;
  getItem(id: string): Promise<CatalogItemDetail>;
  create(input: CatalogItemInput, firstVersion: CatalogVersionInput): Promise<CatalogItemDetail>;
  createVersion(itemId: string, input: CatalogVersionInput): Promise<CatalogVersion>;
  publishVersion(versionId: string): Promise<CatalogVersion>;
  setStatus(itemId: string, status: CatalogItemStatus): Promise<CatalogItemSummary>;
  setVisiblePublic(itemId: string, visible: boolean): Promise<CatalogItemSummary>;
}
