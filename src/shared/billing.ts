export const BILLING_ITEM_SOURCE_TYPES = ['quote_deposit', 'project_balance', 'intervention', 'maintenance_overage', 'hour_pack', 'subscription', 'other'] as const;
export const BILLING_ITEM_STATUSES = ['planned', 'ready', 'invoiced', 'cancelled', 'offered'] as const;

export type BillingItemSourceType = (typeof BILLING_ITEM_SOURCE_TYPES)[number];
export type BillingItemStatus = (typeof BILLING_ITEM_STATUSES)[number];

export interface BillingItem {
  id: string;
  clientAccountId: string;
  clientLabel: string;
  projectId?: string | null;
  projectLabel?: string | null;
  sourceType: BillingItemSourceType;
  sourceId: string;
  sourceKey: string;
  description: string;
  expectedAmountCents: number;
  theoreticalValueCents: number;
  dueAt?: string | null;
  status: BillingItemStatus;
  notes?: string | null;
  invoiceDocumentId?: string | null;
  invoiceReference?: string | null;
  invoiceFileName?: string | null;
  invoicedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BillingItemFilters {
  clientAccountId?: string | null;
  projectId?: string | null;
  sourceType?: BillingItemSourceType | null;
  status?: BillingItemStatus | null;
}

export interface BillingInvoiceInput {
  reference?: string | null;
  invoicedAt?: string | null;
}

export interface BillingApi {
  list(filters?: BillingItemFilters): Promise<BillingItem[]>;
  get(id: string): Promise<BillingItem>;
  changeStatus(id: string, status: BillingItemStatus): Promise<BillingItem>;
  importInvoice(id: string, input?: BillingInvoiceInput): Promise<BillingItem | null>;
  updateInvoiceMetadata(id: string, input: BillingInvoiceInput): Promise<BillingItem>;
  openInvoice(id: string): Promise<void>;
}
