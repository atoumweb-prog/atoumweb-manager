import type { ProjectTechnicalCategory, ProjectTechnicalContentType } from './projects';

export const ATOUMWEB_REUSE_STATUSES = ['ready', 'adapt', 'reference'] as const;
export type AtoumWebReuseStatus = (typeof ATOUMWEB_REUSE_STATUSES)[number];

export interface AtoumWebTechnicalItemInput {
  category: ProjectTechnicalCategory;
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
  category?: ProjectTechnicalCategory | null;
  reuseStatus?: AtoumWebReuseStatus | null;
  includeArchived?: boolean;
}
