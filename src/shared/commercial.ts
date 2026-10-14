import type { QuoteLineParameters } from './commercialRules';
import type { QuoteContractAudience } from './contractTerms';
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

export const CATALOG_COMMERCIAL_KINDS = ['offer', 'service', 'option', 'pack', 'subscription'] as const;
export type CatalogCommercialKind = (typeof CATALOG_COMMERCIAL_KINDS)[number];
export type CatalogPriceBasis = 'listed' | 'actual_cost';
export interface CatalogProvenance {
  reference: string;
  sha256?: string | null;
  recordKey?: string | null;
}
export interface CatalogCommercialIdentity {
  commercialKind?: CatalogCommercialKind | null;
  familyCode?: string | null;
  abbyLabel?: string | null;
  unit?: string | null;
  periodicity?: string | null;
  priceBasis?: CatalogPriceBasis;
  provenance?: CatalogProvenance | null;
  commercialParameters?: CatalogCommercialParameters | null;
}
// Descriptive commercial data, never injected as contract clauses by this field.
export interface CatalogCommercialParameters {
  clientNeed?: string | null;
  /** Versioned commercial benefits, descriptive only and never contract clauses. */
  benefits?: string | null;
  /** Human-authored customer-facing pitch, for internal preparation only. */
  salesPitch?: string | null;
  /** Questions to qualify the client's request before proposing the service. */
  qualificationQuestions?: string | null;
  /** Human-authored objection handling, never contractual. */
  objections?: string | null;
  /** Admin-managed search keywords/synonyms, separated by commas, semicolons or line breaks. */
  keywords?: string | null;
  work?: string | null;
  options?: string | null;
  quoteRequiredWhen?: string | null;
  deliverables?: string | null;
  deliveryTerms?: string | null;
  reviewTerms?: string | null;
  correctiveWarranty?: string | null;
  thirdPartyCosts?: string | null;
  sourcePriceLabel?: string | null;
}
export interface CatalogIdentityAssignment {
  itemId: string;
  canonicalCode: string;
  provenance: CatalogProvenance;
}
export interface CatalogIdentityManifest {
  schemaVersion: 1;
  assignments: CatalogIdentityAssignment[];
}

export interface CatalogItemInput {
  canonicalCode?: string | null;
  identityProvenance?: CatalogProvenance | null;
  type: CatalogItemType;
  name: string;
  category?: string | null;
  /** Optional stable category chosen explicitly, atomically attached during item creation. */
  categoryId?: string | null;
  visiblePublic?: boolean;
}

export interface CatalogVersionInput extends CatalogCommercialIdentity {
  specialTerms?: string | null;
  nature?: string | null;
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
  /** Historical free-text label only; structured types are versioned references. */
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
  canonicalCode?: string | null;
  identityProvenance?: CatalogProvenance | null;
  id: string;
  type: CatalogItemType;
  name: string;
  category?: string | null;
  /** E95: stable admin category relation, independent of the legacy label and commercial family. */
  categoryId?: string | null;
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

/** Existing project production blueprints attached to one immutable catalogue version. */
export interface CatalogProductionBlueprintLink {
  id: string;
  catalogVersionId: string;
  templateVersionId: string;
  templateName: string;
  versionNumber: number;
  templateStatus: 'draft' | 'published' | 'retired';
  role: 'base' | 'addon';
  sortOrder: number;
  quantityMode: string;
  siteMode: string;
}

export interface CatalogRecommendationLink {
  id: string;
  sourceVersionId: string;
  targetVersionId: string;
  targetName: string;
  targetVersionNumber: number;
  targetItemStatus: CatalogItemStatus;
  sortOrder: number;
}

export interface CatalogApi {
  assignCanonicalCode(itemId: string, canonicalCode: string): Promise<CatalogItemDetail>;
  list(filters?: CatalogFilters): Promise<CatalogItemSummary[]>;
  getItem(id: string): Promise<CatalogItemDetail>;
  create(input: CatalogItemInput, firstVersion: CatalogVersionInput): Promise<CatalogItemDetail>;
  /** An optional stable request UUID makes network retries idempotent. */
  createVersion(itemId: string, input: CatalogVersionInput, requestId?: string): Promise<CatalogVersion>;
  /** Update only an existing draft; expected is the last loaded version for optimistic concurrency. */
  saveDraftVersion(versionId: string, expected: CatalogVersion, input: CatalogVersionInput): Promise<CatalogVersion>;
  /** Optional snapshot check prevents publication of a concurrently edited draft. */
  publishVersion(versionId: string, expected?: CatalogVersion): Promise<CatalogVersion>;
  setStatus(itemId: string, status: CatalogItemStatus): Promise<CatalogItemSummary>;
  setVisiblePublic(itemId: string, visible: boolean): Promise<CatalogItemSummary>;
  listOfferComponents(offerVersionId: string): Promise<OfferComponent[]>;
  listRecommendations(sourceVersionId: string): Promise<CatalogRecommendationLink[]>;
  replaceRecommendations(sourceVersionId: string, targetVersionIds: string[], expectedTargetVersionIds?: string[]): Promise<CatalogRecommendationLink[]>;
  /** Read the real blueprint references; never create a Project on inspection. */
  listProductionBlueprints(versionId: string): Promise<CatalogProductionBlueprintLink[]>;
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
  /** Historical free-text label only; structured types are versioned references. */
  contractType?: string | null;
  contractAudience?: QuoteContractAudience | null;
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

export interface QuoteOptionPurchase {
  state: 'purchased';
  sourceOfferLineId: string;
  sourceOfferItemId: string;
  sourceOfferVersionId: string;
  sourceComponentId: string;
  purchasedAt: string;
}

export interface QuoteLine extends QuoteLineInput {
  parameters?: QuoteLineParameters | null;
  /** Null means no recorded optional origin, including historical/manual lines. */
  optionPurchase?: QuoteOptionPurchase | null;
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
  /** Accord de principe explicite sur cette révision, distinct de la signature et du devis finalisé pour envoi. */
  principleAgreementAt?: string | null;
  projectId?: string | null;
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
  contractCompiledAt?: string | null;
  contractDocumentId?: string | null;
  contractDocumentAttachedAt?: string | null;
  abbyReference?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteDetail extends QuoteSummary {
  needSummary?: string | null;
  estimatedDelay?: string | null;
  prerequisitesText?: string | null;
  specialTerms?: string | null;
  /** Historical free-text label only; structured types are versioned references. */
  contractType?: string | null;
  contractAudience?: QuoteContractAudience | null;
  contractTextSnapshot?: string | null;
  contractSnapshotJson?: string | null;
  initialPaymentQualification?: 'acompte' | 'arrhes' | null;
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
  operationalSalesForClient(clientId:string):Promise<Record<string,unknown>[]>;
  assignOperationalTarget(saleId:string,input:{projectId:string;siteId?:string|null;contextNodeId?:string|null;author:string}):Promise<void>;
  setLineParameters(lineId:string,parameters:QuoteLineParameters):Promise<QuoteDetail>;
  preparationIssues(id:string):Promise<string[]>;
  operationalSales(id:string):Promise<Record<string,unknown>[]>;
  createWithLines(input: QuoteInput, lines: Array<{catalogVersionId?: string; input: QuoteLineInput}>): Promise<QuoteDetail>;
  list(filters?: QuoteFilters): Promise<QuoteSummary[]>;
  get(id: string): Promise<QuoteDetail>;
  create(input: QuoteInput): Promise<QuoteDetail>;
  addCatalogLine(quoteId: string, catalogVersionId: string, input?: Partial<QuoteLineInput>): Promise<QuoteDetail>;
  selectOfferOption(offerLineId: string, componentId: string, input?: Partial<QuoteLineInput>): Promise<QuoteDetail>;
  deselectOfferOption(offerLineId: string, componentId: string): Promise<QuoteDetail>;
  addCustomLine(quoteId: string, input: QuoteLineInput): Promise<QuoteDetail>;
  updateLine(lineId: string, input: QuoteLineInput): Promise<QuoteDetail>;
  removeLine(lineId: string): Promise<QuoteDetail>;
  updateConditions(quoteId: string, input: Partial<QuoteInput>): Promise<QuoteDetail>;
  markSent(id: string): Promise<QuoteDetail>;
  confirmPrincipleAgreement(id: string): Promise<QuoteDetail>;
  revokePrincipleAgreement(id: string): Promise<QuoteDetail>;
  finalize(id: string): Promise<QuoteDetail>;
  extendValidity(id: string, validUntil: string): Promise<QuoteDetail>;
  markViewed(id: string): Promise<QuoteDetail>;
  accept(id: string): Promise<QuoteDetail>;
  refuse(id: string): Promise<QuoteDetail>;
  expire(id: string): Promise<QuoteDetail>;
  duplicate(id: string): Promise<QuoteDetail>;
  createCommercialRevision(id: string): Promise<QuoteDetail>;
  importContractDocument(id: string, abbyReference?: string | null): Promise<QuoteDetail | null>;
  openContractDocument(id: string): Promise<void>;
  updateAbbyReference(id: string, abbyReference?: string | null): Promise<QuoteDetail>;
  generatePdf(id: string): Promise<QuotePdfResult>;
}
