import { randomUUID } from 'node:crypto';
import type { DatabaseAdapter, SqlValue } from '../database/DatabaseAdapter';
import {
  CATALOG_ITEM_STATUSES,
  CATALOG_ITEM_TYPES,
  PRICE_MODES,
  type CatalogFilters,
  type CatalogItemDetail,
  type CatalogItemInput,
  type CatalogItemStatus,
  type CatalogItemSummary,
  type CatalogVersion,
  type CatalogVersionInput,
} from '../../shared/commercial';

const nowIso = (): string => new Date().toISOString();
const clean = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

interface CatalogRow extends Record<string, unknown> {
  id: string;
  item_type: CatalogItemSummary['type'];
  name: string;
  category: string | null;
  status: CatalogItemSummary['status'];
  visible_public: number;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  version_id: string | null;
  version_number: number | null;
  version_status: CatalogVersion['status'] | null;
  description: string | null;
  inclusions_json: string | null;
  exclusions_json: string | null;
  prerequisites_json: string | null;
  price_mode: CatalogVersion['priceMode'] | null;
  price_cents: number | null;
  recommended_price_cents: number | null;
  estimated_minutes: number | null;
  recommended_delay_days: number | null;
  default_deposit_percent: number | null;
  contract_type: string | null;
  internal_advice: string | null;
  published_at: string | null;
  version_created_at: string | null;
}

interface VersionRow extends Record<string, unknown> {
  id: string;
  item_id: string;
  version_number: number;
  status: CatalogVersion['status'];
  description: string | null;
  inclusions_json: string;
  exclusions_json: string;
  prerequisites_json: string;
  price_mode: CatalogVersion['priceMode'];
  price_cents: number | null;
  recommended_price_cents: number | null;
  estimated_minutes: number | null;
  recommended_delay_days: number | null;
  default_deposit_percent: number | null;
  contract_type: string | null;
  internal_advice: string | null;
  published_at: string | null;
  created_at: string;
}

export class CatalogService {
  constructor(private readonly database: DatabaseAdapter) {}

  list(filters: CatalogFilters = {}): CatalogItemSummary[] {
    const where: string[] = [];
    const params: SqlValue[] = [];

    if (filters.type) {
      where.push('i.item_type=?');
      params.push(filters.type);
    }
    if (filters.status) {
      where.push('i.status=?');
      params.push(filters.status);
    }
    if (clean(filters.category)) {
      where.push('i.category=? COLLATE NOCASE');
      params.push(clean(filters.category) as string);
    }
    if (typeof filters.visiblePublic === 'boolean') {
      where.push('i.visible_public=?');
      params.push(filters.visiblePublic ? 1 : 0);
    }
    if (filters.priceMode) {
      where.push('v.price_mode=?');
      params.push(filters.priceMode);
    }
    if (clean(filters.search)) {
      where.push('(i.name LIKE ? COLLATE NOCASE OR COALESCE(i.category, \'\') LIKE ? COLLATE NOCASE OR COALESCE(v.description, \'\') LIKE ? COLLATE NOCASE)');
      const query = `%${clean(filters.search)}%`;
      params.push(query, query, query);
    }

    const rows = this.database.all<CatalogRow>(
      `SELECT
        i.*,
        v.id AS version_id,
        v.version_number,
        v.status AS version_status,
        v.description,
        v.inclusions_json,
        v.exclusions_json,
        v.prerequisites_json,
        v.price_mode,
        v.price_cents,
        v.recommended_price_cents,
        v.estimated_minutes,
        v.recommended_delay_days,
        v.default_deposit_percent,
        v.contract_type,
        v.internal_advice,
        v.published_at,
        v.created_at AS version_created_at
       FROM catalog_items i
       LEFT JOIN catalog_versions v ON v.id = (
         SELECT v2.id
         FROM catalog_versions v2
         WHERE v2.item_id=i.id
         ORDER BY CASE v2.status WHEN 'published' THEN 0 WHEN 'draft' THEN 1 ELSE 2 END,
                  v2.version_number DESC
         LIMIT 1
       )
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY CASE i.status WHEN 'active' THEN 0 WHEN 'inactive' THEN 1 ELSE 2 END,
                COALESCE(i.category, ''), i.name COLLATE NOCASE`,
      params,
    );

    return rows.map((row) => this.mapSummary(row));
  }

  getItem(id: string): CatalogItemDetail {
    const item = this.list().find((candidate) => candidate.id === id);
    if (!item) throw new Error('Élément du catalogue introuvable.');
    const versions = this.database
      .all<VersionRow>('SELECT * FROM catalog_versions WHERE item_id=? ORDER BY version_number DESC', [id])
      .map((row) => this.mapVersion(row));
    return { ...item, versions };
  }

  create(input: CatalogItemInput, firstVersion: CatalogVersionInput): CatalogItemDetail {
    if (!CATALOG_ITEM_TYPES.includes(input.type)) throw new Error('Type de catalogue invalide.');
    const name = clean(input.name);
    if (!name) throw new Error('Le nom est requis.');
    this.validateVersion(firstVersion);

    const id = randomUUID();
    const now = nowIso();
    this.database.exec('BEGIN IMMEDIATE;');
    try {
      this.database.run(
        `INSERT INTO catalog_items (
          id, item_type, name, category, status, visible_public, created_at, updated_at, archived_at
        ) VALUES (?, ?, ?, ?, 'active', ?, ?, ?, NULL)`,
        [id, input.type, name, clean(input.category), input.visiblePublic ? 1 : 0, now, now],
      );
      this.insertVersion(id, 1, firstVersion, now);
      this.writeActivity(id, 'catalog_created', `${input.type === 'offer' ? 'Offre' : 'Service'} créé : ${name}`);
      this.database.exec('COMMIT;');
    } catch (error) {
      this.database.exec('ROLLBACK;');
      throw error;
    }
    return this.getItem(id);
  }

  createVersion(itemId: string, input: CatalogVersionInput): CatalogVersion {
    this.assertItem(itemId);
    this.validateVersion(input);
    const row = this.database.get<{ next_version: number }>(
      'SELECT COALESCE(MAX(version_number), 0) + 1 AS next_version FROM catalog_versions WHERE item_id=?',
      [itemId],
    );
    const version = this.insertVersion(itemId, Number(row?.next_version ?? 1), input, nowIso());
    this.database.run('UPDATE catalog_items SET updated_at=? WHERE id=?', [nowIso(), itemId]);
    this.writeActivity(itemId, 'catalog_version_created', `Nouvelle version brouillon v${version.versionNumber}`);
    return version;
  }

  publishVersion(versionId: string): CatalogVersion {
    const target = this.getVersion(versionId);
    const now = nowIso();
    this.database.exec('BEGIN IMMEDIATE;');
    try {
      this.database.run(
        `UPDATE catalog_versions
         SET status='retired'
         WHERE item_id=? AND status='published' AND id<>?`,
        [target.itemId, target.id],
      );
      this.database.run(
        `UPDATE catalog_versions SET status='published', published_at=? WHERE id=?`,
        [now, target.id],
      );
      this.database.run('UPDATE catalog_items SET updated_at=? WHERE id=?', [now, target.itemId]);
      this.writeActivity(target.itemId, 'catalog_version_published', `Version v${target.versionNumber} publiée`);
      this.database.exec('COMMIT;');
    } catch (error) {
      this.database.exec('ROLLBACK;');
      throw error;
    }
    return this.getVersion(versionId);
  }

  setStatus(itemId: string, status: CatalogItemStatus): CatalogItemSummary {
    if (!CATALOG_ITEM_STATUSES.includes(status)) throw new Error('Statut catalogue invalide.');
    this.assertItem(itemId);
    const now = nowIso();
    this.database.run(
      'UPDATE catalog_items SET status=?, archived_at=?, updated_at=? WHERE id=?',
      [status, status === 'archived' ? now : null, now, itemId],
    );
    this.writeActivity(itemId, 'catalog_status_changed', `Statut catalogue : ${status}`);
    return this.list().find((item) => item.id === itemId) as CatalogItemSummary;
  }

  setVisiblePublic(itemId: string, visible: boolean): CatalogItemSummary {
    this.assertItem(itemId);
    this.database.run('UPDATE catalog_items SET visible_public=?, updated_at=? WHERE id=?', [visible ? 1 : 0, nowIso(), itemId]);
    this.writeActivity(itemId, 'catalog_visibility_changed', visible ? 'Visible sur le site public' : 'Masqué du site public');
    return this.list().find((item) => item.id === itemId) as CatalogItemSummary;
  }

  private insertVersion(itemId: string, versionNumber: number, input: CatalogVersionInput, createdAt: string): CatalogVersion {
    const id = randomUUID();
    this.database.run(
      `INSERT INTO catalog_versions (
        id, item_id, version_number, status, description, inclusions_json, exclusions_json,
        prerequisites_json, price_mode, price_cents, recommended_price_cents,
        estimated_minutes, recommended_delay_days, default_deposit_percent,
        contract_type, internal_advice, published_at, created_at
      ) VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)`,
      [
        id,
        itemId,
        versionNumber,
        clean(input.description),
        JSON.stringify(input.inclusions ?? []),
        JSON.stringify(input.exclusions ?? []),
        JSON.stringify(input.prerequisites ?? []),
        input.priceMode,
        input.priceMode === 'free' ? 0 : input.priceCents ?? null,
        input.recommendedPriceCents ?? null,
        input.estimatedMinutes ?? null,
        input.recommendedDelayDays ?? null,
        input.defaultDepositPercent ?? null,
        clean(input.contractType),
        clean(input.internalAdvice),
        createdAt,
      ],
    );
    return this.getVersion(id);
  }

  private validateVersion(input: CatalogVersionInput): void {
    if (!PRICE_MODES.includes(input.priceMode)) throw new Error('Mode tarifaire invalide.');
    for (const [label, value] of [
      ['prix', input.priceCents],
      ['prix conseillé', input.recommendedPriceCents],
      ['durée', input.estimatedMinutes],
      ['délai', input.recommendedDelayDays],
    ] as const) {
      if (value != null && (!Number.isInteger(value) || value < 0)) throw new Error(`${label} invalide.`);
    }
    if (input.defaultDepositPercent != null && (!Number.isInteger(input.defaultDepositPercent) || input.defaultDepositPercent < 0 || input.defaultDepositPercent > 100)) {
      throw new Error('Acompte par défaut invalide.');
    }
    if (!['quote_only', 'free'].includes(input.priceMode) && input.priceCents == null) {
      throw new Error('Un prix est requis pour ce mode tarifaire.');
    }
  }

  private assertItem(id: string): void {
    if (!this.database.get<{ id: string }>('SELECT id FROM catalog_items WHERE id=?', [id])) {
      throw new Error('Élément du catalogue introuvable.');
    }
  }

  private getVersion(id: string): CatalogVersion {
    const row = this.database.get<VersionRow>('SELECT * FROM catalog_versions WHERE id=?', [id]);
    if (!row) throw new Error('Version du catalogue introuvable.');
    return this.mapVersion(row);
  }

  private mapSummary(row: CatalogRow): CatalogItemSummary {
    return {
      id: row.id,
      type: row.item_type,
      name: row.name,
      category: row.category,
      status: row.status,
      visiblePublic: Boolean(row.visible_public),
      currentVersion: row.version_id ? this.mapVersion({
        id: row.version_id,
        item_id: row.id,
        version_number: Number(row.version_number),
        status: row.version_status as CatalogVersion['status'],
        description: row.description,
        inclusions_json: row.inclusions_json ?? '[]',
        exclusions_json: row.exclusions_json ?? '[]',
        prerequisites_json: row.prerequisites_json ?? '[]',
        price_mode: row.price_mode as CatalogVersion['priceMode'],
        price_cents: row.price_cents,
        recommended_price_cents: row.recommended_price_cents,
        estimated_minutes: row.estimated_minutes,
        recommended_delay_days: row.recommended_delay_days,
        default_deposit_percent: row.default_deposit_percent,
        contract_type: row.contract_type,
        internal_advice: row.internal_advice,
        published_at: row.published_at,
        created_at: row.version_created_at as string,
      }) : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      archivedAt: row.archived_at,
    };
  }

  private mapVersion(row: VersionRow): CatalogVersion {
    const parseList = (value: string): string[] => {
      try {
        const parsed = JSON.parse(value) as unknown;
        return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
      } catch {
        return [];
      }
    };
    return {
      id: row.id,
      itemId: row.item_id,
      versionNumber: Number(row.version_number),
      status: row.status,
      description: row.description,
      inclusions: parseList(row.inclusions_json),
      exclusions: parseList(row.exclusions_json),
      prerequisites: parseList(row.prerequisites_json),
      priceMode: row.price_mode,
      priceCents: row.price_cents,
      recommendedPriceCents: row.recommended_price_cents,
      estimatedMinutes: row.estimated_minutes,
      recommendedDelayDays: row.recommended_delay_days,
      defaultDepositPercent: row.default_deposit_percent,
      contractType: row.contract_type,
      internalAdvice: row.internal_advice,
      publishedAt: row.published_at,
      createdAt: row.created_at,
    };
  }

  private writeActivity(itemId: string, action: string, summary: string): void {
    this.database.run(
      'INSERT INTO activity_log (entity_type, entity_id, action, summary, metadata_json, created_at) VALUES (?, ?, ?, ?, NULL, ?)',
      ['catalog', itemId, action, summary, nowIso()],
    );
  }
}
