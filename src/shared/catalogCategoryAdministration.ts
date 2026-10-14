export type CatalogCategoryStatus = 'active' | 'archived';

export interface CatalogCategoryRecord {
  id: string;
  name: string;
  normalizedKey: string;
  status: CatalogCategoryStatus;
  revision: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

/** All values are historical raw values, never silently normalized or merged. */
export interface CatalogLegacyCategory {
  rawValue: string;
  itemIds: string[];
  itemCount: number;
}

export interface CatalogCategoryAssignment {
  itemId: string;
  categoryId: string | null;
  /** Required compare-and-swap values from the last loaded item. */
  expectedCategoryId: string | null;
  expectedRawValue: string | null;
}

export interface CatalogCategoryApi {
  list(): Promise<CatalogCategoryRecord[]>;
  listLegacy(): Promise<CatalogLegacyCategory[]>;
  create(name: string): Promise<CatalogCategoryRecord>;
  rename(id: string, name: string, expectedRevision: number, expectedItemIds: string[]): Promise<CatalogCategoryRecord>;
  setStatus(id: string, status: CatalogCategoryStatus, expectedRevision: number): Promise<CatalogCategoryRecord>;
  assign(input: CatalogCategoryAssignment): Promise<void>;
  /** Explicitly confirm the full list of currently unlinked legacy item IDs. */
  reconcileLegacy(rawValue: string, categoryId: string, expectedItemIds: string[]): Promise<number>;
}
