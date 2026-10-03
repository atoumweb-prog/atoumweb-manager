import { randomUUID } from 'node:crypto';
import type { DatabaseAdapter, SqlValue } from '../database/DatabaseAdapter';
import {
  CATALOG_ITEM_STATUSES,
  CATALOG_ITEM_TYPES,
  PRICE_MODES,
  CATALOG_COMMERCIAL_KINDS,
  type CatalogCommercialIdentity,
  type CatalogIdentityManifest,
  type CatalogProvenance,
  type CatalogFilters,
  type CatalogItemDetail,
  type CatalogItemInput,
  type CatalogItemStatus,
  type CatalogItemSummary,
  type CatalogVersion,
  type CatalogVersionInput,
  type OfferComponent,
  type OfferComponentInput,
} from '../../shared/commercial';

const nowIso = (): string => new Date().toISOString();
const clean = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

interface CatalogRow extends Record<string, unknown> {
  commercial_parameters_json: string | null;
  canonical_code: string | null;
  identity_provenance_json: string | null;
  commercial_kind: CatalogCommercialIdentity['commercialKind'];
  family_code: string | null;
  abby_label: string | null;
  unit: string | null;
  periodicity: string | null;
  price_basis: CatalogCommercialIdentity['priceBasis'];
  provenance_json: string | null;
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
  nature: string | null;
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
  special_terms: string | null;
  published_at: string | null;
  version_created_at: string | null;
}

interface VersionRow extends Record<string, unknown> {
  commercial_parameters_json: string | null;
  commercial_kind: CatalogCommercialIdentity['commercialKind'];
  family_code: string | null;
  abby_label: string | null;
  unit: string | null;
  periodicity: string | null;
  price_basis: CatalogCommercialIdentity['priceBasis'];
  provenance_json: string | null;
  id: string;
  item_id: string;
  version_number: number;
  status: CatalogVersion['status'];
  nature: string | null;
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
  special_terms: string | null;
  published_at: string | null;
  created_at: string;
}

interface OfferComponentRow extends Record<string, unknown> {
  id: string;
  offer_version_id: string;
  service_version_id: string;
  service_item_id: string;
  service_name: string;
  service_version_number: number;
  price_mode: CatalogVersion['priceMode'];
  price_cents: number | null;
  is_optional: number;
  quantity_milli: number;
  sort_order: number;
}

interface ItemIdentityRow extends Record<string, unknown> {
  id: string;
  item_type: CatalogItemSummary['type'];
}

interface VersionIdentityRow extends Record<string, unknown> {
  id: string;
  item_id: string;
  item_type: CatalogItemSummary['type'];
  status: CatalogVersion['status'];
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
      where.push('(i.name LIKE ? COLLATE NOCASE OR COALESCE(i.category, \'\') LIKE ? COLLATE NOCASE OR COALESCE(v.nature, \'\') LIKE ? COLLATE NOCASE OR COALESCE(v.description, \'\') LIKE ? COLLATE NOCASE OR i.canonical_code LIKE ? COLLATE NOCASE OR v.abby_label LIKE ? COLLATE NOCASE OR v.family_code LIKE ? COLLATE NOCASE)');
      const query = `%${clean(filters.search)}%`;
      params.push(query, query, query, query, query, query, query);
    }

    const rows = this.database.all<CatalogRow>(
      `SELECT
        i.*,
        v.id AS version_id,
        v.version_number,
        v.status AS version_status,
        v.nature,
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
        v.special_terms,
        v.commercial_kind, v.family_code, v.abby_label, v.unit, v.periodicity, v.price_basis, v.provenance_json, v.commercial_parameters_json,
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
    const canonicalCode = clean(input.canonicalCode) ? this.normalizeCode(input.canonicalCode!) : null;
    if (canonicalCode) this.assertCodeAvailable(canonicalCode);
    const identityProvenance = canonicalCode ? this.normalizeProvenance(input.identityProvenance ?? { reference: 'manual' }) : null;

    const id = randomUUID();
    const now = nowIso();
    this.database.exec('SAVEPOINT catalog_service;');
    try {
      this.database.run(
        `INSERT INTO catalog_items (
          id, item_type, name, category, status, visible_public, created_at, updated_at, archived_at, canonical_code, identity_provenance_json
        ) VALUES (?, ?, ?, ?, 'active', ?, ?, ?, NULL, ?, ?)`,
        [id, input.type, name, clean(input.category), input.visiblePublic ? 1 : 0, now, now, canonicalCode, identityProvenance ? JSON.stringify(identityProvenance) : null],
      );
      this.insertVersion(id, 1, firstVersion, now);
      this.writeActivity(id, 'catalog_created', `${input.type === 'offer' ? 'Offre' : 'Service'} créé : ${name}`);
      this.database.exec('RELEASE SAVEPOINT catalog_service;');
    } catch (error) {
      this.database.exec('ROLLBACK TO SAVEPOINT catalog_service; RELEASE SAVEPOINT catalog_service;');
      throw error;
    }
    return this.getItem(id);
  }

  createVersion(itemId: string, input: CatalogVersionInput): CatalogVersion {
    const item = this.assertItem(itemId);
    const previous = this.database.get<{ id: string; version_number: number }>(
      'SELECT id, version_number FROM catalog_versions WHERE item_id=? ORDER BY version_number DESC LIMIT 1',
      [itemId],
    );
    const nextVersion = Number(previous?.version_number ?? 0) + 1;
    const previousVersion = previous ? this.getVersion(previous.id) : null;
    const nextInput: CatalogVersionInput = { ...input };
    for (const key of ['commercialKind', 'familyCode', 'abbyLabel', 'unit', 'periodicity', 'priceBasis', 'provenance', 'commercialParameters'] as const) {
      if (input[key] === undefined && previousVersion) Object.assign(nextInput, { [key]: previousVersion[key] });
    }
    this.validateVersion(nextInput);
    const now = nowIso();

    this.database.exec('SAVEPOINT catalog_service;');
    try {
      const version = this.insertVersion(itemId, nextVersion, nextInput, now);
      if (item.item_type === 'offer' && previous) {
        const previousComponents = this.listOfferComponents(previous.id);
        for (const component of previousComponents) {
          this.database.run(
            `INSERT INTO offer_components (
              id, offer_version_id, service_version_id, is_optional, quantity_milli, sort_order, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [randomUUID(), version.id, component.serviceVersionId, component.isOptional ? 1 : 0, component.quantityMilli, component.sortOrder, now],
          );
        }
      }
      if (previous) {
        const links = this.database.all<{ template_version_id: string; role: string; sort_order: number; quantity_mode: string; site_mode: string }>(
          'SELECT template_version_id,role,sort_order,quantity_mode,site_mode FROM catalog_project_blueprints WHERE catalog_version_id=? ORDER BY sort_order,id', [previous.id]);
        for (const link of links) this.database.run(
          'INSERT INTO catalog_project_blueprints (id,catalog_version_id,template_version_id,role,sort_order,created_at,quantity_mode,site_mode) VALUES (?,?,?,?,?,?,?,?)',
          [randomUUID(), version.id, link.template_version_id, link.role, link.sort_order, now, link.quantity_mode, link.site_mode]);
      }
      this.database.run('UPDATE catalog_items SET updated_at=? WHERE id=?', [now, itemId]);
      this.writeActivity(itemId, 'catalog_version_created', `Nouvelle version brouillon v${version.versionNumber}`);
      this.database.exec('RELEASE SAVEPOINT catalog_service;');
      return version;
    } catch (error) {
      this.database.exec('ROLLBACK TO SAVEPOINT catalog_service; RELEASE SAVEPOINT catalog_service;');
      throw error;
    }
  }

  assignCanonicalCode(itemId: string, canonicalCode: string): CatalogItemDetail {
    return this.applyIdentityManifest({ schemaVersion: 1, assignments: [{ itemId, canonicalCode, provenance: { reference: 'manual' } }] })[0];
  }

  /** Explicit UUID-to-code assignments only; never match names or create catalogue items. */
  applyIdentityManifest(manifest: CatalogIdentityManifest): CatalogItemDetail[] {
    if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.assignments)) throw new Error('Manifeste d’identité catalogue invalide.');
    const ids = new Set<string>();
    const codes = new Set<string>();
    const assignments = manifest.assignments.map((entry) => {
      this.assertItem(entry.itemId);
      const code = this.normalizeCode(entry.canonicalCode);
      if (ids.has(entry.itemId) || codes.has(code)) throw new Error('Identifiant ou code dupliqué dans le manifeste.');
      ids.add(entry.itemId); codes.add(code);
      const item = this.getItem(entry.itemId);
      if (item.canonicalCode && item.canonicalCode !== code) throw new Error('Le code canonique attribué est immuable.');
      this.assertCodeAvailable(code, entry.itemId);
      return { item, code, provenance: this.normalizeProvenance(entry.provenance) };
    });
    this.database.exec('SAVEPOINT catalog_service;');
    try {
      for (const { item, code, provenance } of assignments) {
        if (item.canonicalCode === code) continue;
        this.database.run('UPDATE catalog_items SET canonical_code=?,identity_provenance_json=?,updated_at=? WHERE id=?', [code, JSON.stringify(provenance), nowIso(), item.id]);
        this.writeActivity(item.id, 'catalog_canonical_code_assigned', `Code ${code} attribué explicitement à ${item.id} ; source ${provenance.reference}`);
      }
      this.database.exec('RELEASE SAVEPOINT catalog_service;');
    } catch (error) {
      this.database.exec('ROLLBACK TO SAVEPOINT catalog_service; RELEASE SAVEPOINT catalog_service;');
      throw error;
    }
    return assignments.map(({ item }) => this.getItem(item.id));
  }

  private normalizeCode(value: string): string {
    const code = value.trim().toUpperCase();
    if (!/^AW-[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(code)) throw new Error('Code canonique invalide : utilise un code AW-* du référentiel.');
    return code;
  }

  private assertCodeAvailable(code: string, itemId?: string): void {
    const existing = this.database.get<{ id: string }>('SELECT id FROM catalog_items WHERE canonical_code=? COLLATE NOCASE', [code]);
    if (existing && existing.id !== itemId) throw new Error('Ce code canonique est déjà attribué, y compris aux éléments archivés.');
  }

  private normalizeProvenance(source: CatalogProvenance): CatalogProvenance {
    const reference = clean(source?.reference);
    if (!reference) throw new Error('La référence de provenance est requise.');
    const sha256 = clean(source.sha256)?.toLowerCase() ?? null;
    if (sha256 && !/^[a-f0-9]{64}$/.test(sha256)) throw new Error('Empreinte source SHA-256 invalide.');
    return { reference, sha256, recordKey: clean(source.recordKey) };
  }

  private readProvenance(json: string | null): CatalogProvenance | null {
    return json ? JSON.parse(json) as CatalogProvenance : null;
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

  listOfferComponents(offerVersionId: string): OfferComponent[] {
    const version = this.assertOfferVersion(offerVersionId);
    if (version.item_type !== 'offer') throw new Error('Cette version n’est pas une Offre.');
    return this.database.all<OfferComponentRow>(
      `SELECT
        c.id,
        c.offer_version_id,
        c.service_version_id,
        i.id AS service_item_id,
        i.name AS service_name,
        v.version_number AS service_version_number,
        v.price_mode,
        v.price_cents,
        c.is_optional,
        c.quantity_milli,
        c.sort_order
       FROM offer_components c
       JOIN catalog_versions v ON v.id=c.service_version_id
       JOIN catalog_items i ON i.id=v.item_id
       WHERE c.offer_version_id=?
       ORDER BY c.sort_order, i.name COLLATE NOCASE`,
      [offerVersionId],
    ).map((row) => ({
      id: row.id,
      offerVersionId: row.offer_version_id,
      serviceVersionId: row.service_version_id,
      serviceItemId: row.service_item_id,
      serviceName: row.service_name,
      serviceVersionNumber: Number(row.service_version_number),
      priceMode: row.price_mode,
      priceCents: row.price_cents,
      isOptional: Boolean(row.is_optional),
      quantityMilli: Number(row.quantity_milli),
      sortOrder: Number(row.sort_order),
    }));
  }

  setOfferComponents(offerVersionId: string, components: OfferComponentInput[]): OfferComponent[] {
    const offerVersion = this.assertOfferVersion(offerVersionId);
    if (offerVersion.status !== 'draft') {
      throw new Error('La composition d’une Offre publiée est figée. Crée une nouvelle version pour la modifier.');
    }

    const seen = new Set<string>();
    const normalized = components.map((component, index) => {
      const serviceVersionId = clean(component.serviceVersionId);
      if (!serviceVersionId) throw new Error('Version de Service invalide.');
      if (seen.has(serviceVersionId)) throw new Error('Un même Service ne peut apparaître qu’une fois dans une Offre.');
      seen.add(serviceVersionId);
      const quantityMilli = component.quantityMilli ?? 1000;
      if (!Number.isInteger(quantityMilli) || quantityMilli <= 0) throw new Error('Quantité de Service invalide.');
      const service = this.database.get<VersionIdentityRow>(
        `SELECT v.id, v.item_id, i.item_type, v.status
         FROM catalog_versions v JOIN catalog_items i ON i.id=v.item_id
         WHERE v.id=?`,
        [serviceVersionId],
      );
      if (!service || service.item_type !== 'service') throw new Error('La composition d’une Offre ne peut contenir que des Services.');
      if (service.status !== 'published') throw new Error('Publie le Service avant de l’ajouter à une Offre.');
      return {
        serviceVersionId,
        isOptional: Boolean(component.isOptional),
        quantityMilli,
        sortOrder: component.sortOrder ?? index * 10,
      };
    });

    const now = nowIso();
    this.database.exec('BEGIN IMMEDIATE;');
    try {
      this.database.run('DELETE FROM offer_components WHERE offer_version_id=?', [offerVersionId]);
      for (const component of normalized) {
        this.database.run(
          `INSERT INTO offer_components (
            id, offer_version_id, service_version_id, is_optional, quantity_milli, sort_order, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [randomUUID(), offerVersionId, component.serviceVersionId, component.isOptional ? 1 : 0, component.quantityMilli, component.sortOrder, now],
        );
      }
      this.database.run('UPDATE catalog_items SET updated_at=? WHERE id=?', [now, offerVersion.item_id]);
      this.writeActivity(offerVersion.item_id, 'offer_composition_updated', `Composition de l’Offre mise à jour (${normalized.length} service${normalized.length > 1 ? 's' : ''})`);
      this.database.exec('COMMIT;');
    } catch (error) {
      this.database.exec('ROLLBACK;');
      throw error;
    }

    return this.listOfferComponents(offerVersionId);
  }

  private insertVersion(itemId: string, versionNumber: number, input: CatalogVersionInput, createdAt: string): CatalogVersion {
    const id = randomUUID();
    this.database.run(
      `INSERT INTO catalog_versions (
        id, item_id, version_number, status, nature, description, inclusions_json, exclusions_json,
        prerequisites_json, price_mode, price_cents, recommended_price_cents,
        estimated_minutes, recommended_delay_days, default_deposit_percent,
        contract_type, internal_advice, published_at, created_at, special_terms,
        commercial_kind, family_code, abby_label, unit, periodicity, price_basis, provenance_json, commercial_parameters_json
      ) VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        itemId,
        versionNumber,
        clean(input.nature),
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
        clean(input.specialTerms),
        input.commercialKind ?? null,
        clean(input.familyCode)?.toUpperCase() ?? null,
        clean(input.abbyLabel),
        clean(input.unit),
        clean(input.periodicity),
        input.priceBasis ?? 'listed',
        input.provenance ? JSON.stringify(this.normalizeProvenance(input.provenance)) : null,
        input.commercialParameters ? JSON.stringify(input.commercialParameters) : null,
      ],
    );
    return this.getVersion(id);
  }

  validateVersion(input: CatalogVersionInput): void {
    if (input.commercialParameters != null && (typeof input.commercialParameters !== 'object' || Array.isArray(input.commercialParameters)
      || Object.values(input.commercialParameters).some(value => value != null && typeof value !== 'string'))) throw new Error('Paramètres commerciaux descriptifs invalides.');
    if (input.commercialKind != null && !CATALOG_COMMERCIAL_KINDS.includes(input.commercialKind)) throw new Error('Nature commerciale invalide.');
    if (input.priceBasis != null && !['listed', 'actual_cost'].includes(input.priceBasis)) throw new Error('Base de prix invalide.');
    if (input.priceBasis === 'actual_cost' && (input.priceMode !== 'quote_only' || input.priceCents != null)) throw new Error('Un coût tiers réel est sans prix catalogue fixe ; utilise Sur devis.');
    if (input.provenance) this.normalizeProvenance(input.provenance);
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

  private assertItem(id: string): ItemIdentityRow {
    const item = this.database.get<ItemIdentityRow>('SELECT id, item_type FROM catalog_items WHERE id=?', [id]);
    if (!item) throw new Error('Élément du catalogue introuvable.');
    return item;
  }

  private assertOfferVersion(id: string): VersionIdentityRow {
    const version = this.database.get<VersionIdentityRow>(
      `SELECT v.id, v.item_id, i.item_type, v.status
       FROM catalog_versions v JOIN catalog_items i ON i.id=v.item_id
       WHERE v.id=?`,
      [id],
    );
    if (!version) throw new Error('Version du catalogue introuvable.');
    if (version.item_type !== 'offer') throw new Error('Cette version n’est pas une Offre.');
    return version;
  }

  private getVersion(id: string): CatalogVersion {
    const row = this.database.get<VersionRow>('SELECT * FROM catalog_versions WHERE id=?', [id]);
    if (!row) throw new Error('Version du catalogue introuvable.');
    return this.mapVersion(row);
  }

  private mapSummary(row: CatalogRow): CatalogItemSummary {
    return {
      id: row.id,
      canonicalCode: row.canonical_code,
      identityProvenance: this.readProvenance(row.identity_provenance_json),
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
        nature: row.nature,
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
        special_terms: row.special_terms,
        published_at: row.published_at,
        created_at: row.version_created_at as string,
        commercial_kind: row.commercial_kind,
        family_code: row.family_code,
        abby_label: row.abby_label,
        unit: row.unit,
        periodicity: row.periodicity,
        price_basis: row.price_basis,
        provenance_json: row.provenance_json,
        commercial_parameters_json: row.commercial_parameters_json,
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
      commercialKind: row.commercial_kind,
      familyCode: row.family_code,
      abbyLabel: row.abby_label,
      unit: row.unit,
      periodicity: row.periodicity,
      priceBasis: row.price_basis,
      provenance: this.readProvenance(row.provenance_json),
      commercialParameters: row.commercial_parameters_json ? JSON.parse(row.commercial_parameters_json) : null,
      versionNumber: Number(row.version_number),
      status: row.status,
      nature: row.nature,
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
      specialTerms: row.special_terms,
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
