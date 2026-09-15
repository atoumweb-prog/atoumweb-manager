export const CATALOG_ITEM_TYPES = ['service', 'offer'] as const;
export const CATALOG_ITEM_STATUSES = ['active', 'inactive', 'archived'] as const;
export const CATALOG_VERSION_STATUSES = ['draft', 'published', 'retired'] as const;
export const PRICE_MODES = ['fixed', 'starting_from', 'hourly', 'monthly', 'yearly', 'quote_only', 'free'] as const;

export const QUOTE_STATUSES = ['draft', 'sent', 'viewed', 'accepted', 'refused', 'expired', 'cancelled'] as const;
export const QUOTE_ADJUSTMENT_MODES = ['none', 'percent', 'fixed_amount', 'override_price', 'free'] as const;
export const QUOTE_DISCOUNT_REASONS = ['negotiated', 'commercial_gesture', 'pilot_client', 'partnership', 'loyalty', 'pack', 'other'] as const;

export type CatalogItemType = (typeof CATALOG_ITEM_TYPES)[number];
export type CatalogItemStatus = (typeof CATALOG_ITEM_STATUSES)[number];
export type CatalogVersionStatus = (typeof CATALOG_VERSION_STATUSES)[number];
export type PriceMode = (typeof PRICE_MODES)[number];
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];
export type QuoteAdjustmentMode = (typeof QUOTE_ADJUSTMENT_MODES)[number];
export type QuoteDiscountReason = (typeof QUOTE_DISCOUNT_REASONS)[number];

export interface CatalogItemInput {
  type: CatalogItemType;
  name: string;
  category?: string | null;
  visiblePublic?: boolean;
}

export interface CatalogVersionInput {
  specialTerms?: string | null;
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

export interface OfferComponentInput {
  serviceVersionId: string;
  isOptional?: boolean;
  quantityMilli?: number;
  sortOrder?: number;
}

export interface OfferComponent {
  id: string;
  offerVersionId: string;
  serviceVersionId: string;
  serviceItemId: string;
  serviceName: string;
  serviceVersionNumber: number;
  priceMode: PriceMode;
  priceCents?: number | null;
  isOptional: boolean;
  quantityMilli: number;
  sortOrder: number;
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
  listOfferComponents(offerVersionId: string): Promise<OfferComponent[]>;
  setOfferComponents(offerVersionId: string, components: OfferComponentInput[]): Promise<OfferComponent[]>;
}

export interface QuoteInput {
  prospectId?: string | null;
  clientAccountId?: string | null;
  subject: string;
  needSummary?: string | null;
  validityDays?: number | null;
  estimatedDelay?: string | null;
  prerequisitesText?: string | null;
  specialTerms?: string | null;
  contractType?: string | null;
  depositPercent?: number | null;
}

export interface QuoteLineInput {
  label: string;
  description?: string | null;
  quantityMilli?: number;
  catalogUnitPriceCents?: number | null;
  proposedUnitPriceCents?: number | null;
  adjustmentMode?: QuoteAdjustmentMode;
  adjustmentValue?: number | null;
  discountReasonCode?: QuoteDiscountReason | null;
  discountReasonText?: string | null;
}

export interface QuoteLine extends QuoteLineInput {
  adjustmentMode: QuoteAdjustmentMode;
  id: string;
  quoteId: string;
  sortOrder: number;
  source: 'catalog' | 'custom';
  catalogItemId?: string | null;
  catalogVersionId?: string | null;
  catalogLineValueCents: number;
  contractLineValueCents: number;
  snapshot?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteSummary {
  id: string;
  number: string;
  prospectId?: string | null;
  clientAccountId?: string | null;
  acceptedClientAccountId?: string | null;
  ownerLabel: string;
  subject: string;
  status: QuoteStatus;
  catalogValueCents: number;
  discountValueCents: number;
  contractValueCents: number;
  depositPercent?: number | null;
  depositCents: number;
  balanceCents: number;
  validUntil?: string | null;
  sentAt?: string | null;
  viewedAt?: string | null;
  acceptedAt?: string | null;
  refusedAt?: string | null;
  expiredAt?: string | null;
  snapshotLockedAt?: string | null;
  finalizedAt?: string | null;
  lastExtendedAt?: string | null;
  projectReadyAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteDetail extends QuoteSummary {
  needSummary?: string | null;
  estimatedDelay?: string | null;
  prerequisitesText?: string | null;
  specialTerms?: string | null;
  contractType?: string | null;
  lines: QuoteLine[];
}

export interface QuoteFilters {
  search?: string | null;
  status?: QuoteStatus | null;
  prospectId?: string | null;
  clientAccountId?: string | null;
}

export interface QuotePdfResult {
  path: string;
  fileName: string;
}

export interface QuoteApi {
  createWithLines(input: QuoteInput, lines: Array<{catalogVersionId?: string; input: QuoteLineInput}>): Promise<QuoteDetail>;
  list(filters?: QuoteFilters): Promise<QuoteSummary[]>;
  get(id: string): Promise<QuoteDetail>;
  create(input: QuoteInput): Promise<QuoteDetail>;
  addCatalogLine(quoteId: string, catalogVersionId: string, input?: Partial<QuoteLineInput>): Promise<QuoteDetail>;
  addCustomLine(quoteId: string, input: QuoteLineInput): Promise<QuoteDetail>;
  updateLine(lineId: string, input: QuoteLineInput): Promise<QuoteDetail>;
  removeLine(lineId: string): Promise<QuoteDetail>;
  updateConditions(quoteId: string, input: Partial<QuoteInput>): Promise<QuoteDetail>;
  markSent(id: string): Promise<QuoteDetail>;
  finalize(id: string): Promise<QuoteDetail>;
  extendValidity(id: string, validUntil: string): Promise<QuoteDetail>;
  markViewed(id: string): Promise<QuoteDetail>;
  accept(id: string): Promise<QuoteDetail>;
  refuse(id: string): Promise<QuoteDetail>;
  expire(id: string): Promise<QuoteDetail>;
  duplicate(id: string): Promise<QuoteDetail>;
  generatePdf(id: string): Promise<QuotePdfResult>;
}
