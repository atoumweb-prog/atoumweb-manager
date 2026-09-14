import type { ProjectTechnicalContentType } from './projects';

export const ATOUMWEB_LIBRARY_CATEGORIES = [
  'header', 'footer', 'hero', 'page', 'section', 'form', 'gallery', 'carousel',
  'navigation', 'css', 'javascript', 'php', 'woocommerce', 'acf', 'divi', 'app', 'note',
] as const;
export type AtoumWebLibraryCategory = (typeof ATOUMWEB_LIBRARY_CATEGORIES)[number];

export const ATOUMWEB_REUSE_STATUSES = ['ready', 'adapt', 'reference'] as const;
export type AtoumWebReuseStatus = (typeof ATOUMWEB_REUSE_STATUSES)[number];

export interface AtoumWebTechnicalItemInput {
  category: AtoumWebLibraryCategory;
  name: string;
  description?: string | null;
  tags?: string[];
  reuseStatus: AtoumWebReuseStatus;
  originTechnicalItemId?: string | null;
}

export interface AtoumWebTechnicalVersionInput {
  contentType: ProjectTechnicalContentType;
  language?: string | null;
  contentText?: string | null;
  notes?: string | null;
}

export interface AtoumWebTechnicalVersion extends AtoumWebTechnicalVersionInput {
  id: string;
  itemId: string;
  versionNumber: number;
  current: boolean;
  stable: boolean;
  createdAt: string;
}

export interface AtoumWebTechnicalItemSummary extends AtoumWebTechnicalItemInput {
  id: string;
  currentVersion?: AtoumWebTechnicalVersion | null;
  stableVersion?: AtoumWebTechnicalVersion | null;
  versionCount: number;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
}

export interface AtoumWebTechnicalItemDetail extends AtoumWebTechnicalItemSummary {
  versions: AtoumWebTechnicalVersion[];
}

export interface AtoumWebTechnicalLibraryFilters {
  search?: string | null;
  category?: AtoumWebLibraryCategory | null;
  reuseStatus?: AtoumWebReuseStatus | null;
  includeArchived?: boolean;
}

export interface ReferentialsApi {
  library: {
    list(filters?: AtoumWebTechnicalLibraryFilters): Promise<AtoumWebTechnicalItemSummary[]>;
    get(id: string): Promise<AtoumWebTechnicalItemDetail>;
    create(item: AtoumWebTechnicalItemInput, version: AtoumWebTechnicalVersionInput): Promise<AtoumWebTechnicalItemDetail>;
    update(id: string, input: Partial<AtoumWebTechnicalItemInput>): Promise<AtoumWebTechnicalItemDetail>;
    createVersion(itemId: string, version: AtoumWebTechnicalVersionInput): Promise<AtoumWebTechnicalItemDetail>;
    markStable(versionId: string): Promise<AtoumWebTechnicalItemDetail>;
    archive(itemId: string): Promise<AtoumWebTechnicalItemDetail>;
    reactivate(itemId: string): Promise<AtoumWebTechnicalItemDetail>;
  };
}
