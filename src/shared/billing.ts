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
  createdAt: string;
  updatedAt: string;
}

export interface BillingItemFilters {
  clientAccountId?: string | null;
  projectId?: string | null;
  sourceType?: BillingItemSourceType | null;
  status?: BillingItemStatus | null;
}
