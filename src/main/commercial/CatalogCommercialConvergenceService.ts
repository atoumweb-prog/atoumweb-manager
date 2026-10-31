import { createHash } from 'node:crypto';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import type { CatalogVersionInput } from '../../shared/commercial';
import { CatalogService } from './CatalogService';

export interface CatalogCommercialConvergenceRecord {
  canonicalCode: string;
  expectedPublishedVersionId: string;
  overrides: Partial<CatalogVersionInput>;
}
export interface CatalogCommercialConvergenceSource {
  schemaVersion: 1;
  reference: string;
  records: CatalogCommercialConvergenceRecord[];
}
export interface CatalogCommercialConvergenceRow {
  canonicalCode: string;
  itemId: string;
  publishedVersionId: string;
  nextVersionNumber: number;
  requestId: string;
}

const stable = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => `${JSON.stringify(key)}:${stable(entry)}`).join(',')}}`;
  return JSON.stringify(value) ?? 'null';
};
const requestId = (value: unknown): string => {
  const hash = createHash('sha256').update(stable(value)).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
};
const toVersionInput = (version: ReturnType<CatalogService['getVersion']>): CatalogVersionInput => {
  const { id: _id, itemId: _itemId, versionNumber: _versionNumber, status: _status,
    publishedAt: _publishedAt, createdAt: _createdAt, ...input } = version;
  return input;
};

export class CatalogCommercialConvergenceService {
  private readonly catalog: CatalogService;
  constructor(private readonly database: DatabaseAdapter) { this.catalog = new CatalogService(database); }

  simulate(source: CatalogCommercialConvergenceSource): CatalogCommercialConvergenceRow[] {
    if (source.schemaVersion !== 1 || !source.reference.trim() || source.records.length !== 6) throw new Error('Source de convergence commerciale invalide.');
    const codes = new Set<string>();
    return source.records.map((record) => {
      if (!/^AW-[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(record.canonicalCode) || codes.has(record.canonicalCode)) throw new Error('Code commercial absent ou dupliqué.');
      codes.add(record.canonicalCode);
      const item = this.database.get<{ id: string }>('SELECT id FROM catalog_items WHERE canonical_code=? AND status=\'active\'', [record.canonicalCode]);
      if (!item) throw new Error(`Référence Catalogue introuvable : ${record.canonicalCode}.`);
      const currentPublished = this.database.get<{ id: string }>('SELECT id FROM catalog_versions WHERE item_id=? AND status=\'published\' ORDER BY version_number DESC LIMIT 1', [item.id]);
      if (currentPublished?.id !== record.expectedPublishedVersionId) throw new Error(`La version publiée de ${record.canonicalCode} a changé : nouvelle revue requise.`);
      const published = this.catalog.getItem(item.id).versions.find((version) => version.id === record.expectedPublishedVersionId);
      if (!published || published.status !== 'published') throw new Error(`Origine publiée invalide : ${record.canonicalCode}.`);
      const input = { ...toVersionInput(published), ...record.overrides };
      this.catalog.validateVersion(input);
      const stableRequestId = requestId({ source: source.reference, code: record.canonicalCode, published: published.id, overrides: record.overrides });
      const existingDraft = this.database.get<{ version_number: number; item_id: string; status: string }>('SELECT version_number,item_id,status FROM catalog_versions WHERE id=?', [stableRequestId]);
      if (existingDraft && (existingDraft.item_id !== item.id || existingDraft.status !== 'draft')) throw new Error(`Le brouillon de convergence de ${record.canonicalCode} est en conflit.`);
      return { canonicalCode: record.canonicalCode, itemId: item.id, publishedVersionId: published.id,
        nextVersionNumber: existingDraft?.version_number ?? Math.max(...this.catalog.getItem(item.id).versions.map((version) => version.versionNumber)) + 1,
        requestId: stableRequestId };
    });
  }

  apply(source: CatalogCommercialConvergenceSource, expectedRows: CatalogCommercialConvergenceRow[]): CatalogCommercialConvergenceRow[] {
    this.database.exec('BEGIN IMMEDIATE;');
    try {
      const rows = this.simulate(source);
      if (stable(rows) !== stable(expectedRows)) throw new Error('Le plan Catalogue a changé : relancer la simulation.');
      for (const row of rows) {
        const record = source.records.find((candidate) => candidate.canonicalCode === row.canonicalCode)!;
        const published = this.catalog.getItem(row.itemId).versions.find((version) => version.id === row.publishedVersionId)!;
        this.catalog.createVersion(row.itemId, { ...toVersionInput(published), ...record.overrides }, row.requestId);
      }
      this.database.exec('COMMIT;');
      return rows;
    } catch (error) {
      this.database.exec('ROLLBACK;');
      throw error;
    }
  }
}
