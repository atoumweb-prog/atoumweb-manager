import { createHash, randomUUID } from 'node:crypto';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import type { CatalogItemType, CatalogVersionInput } from '../../shared/commercial';
import { CatalogService } from './CatalogService';

export type CatalogImportAction = 'create' | 'update' | 'keep' | 'archive' | 'verify';
export interface CatalogImportRecord {
  canonicalCode: string; name: string; type: CatalogItemType; category: string;
  version: CatalogVersionInput;
}
export interface CatalogImportSource {
  schemaVersion: 1;
  source: { reference: string; sha256: string; sheet: string };
  records: CatalogImportRecord[];
}
export interface CatalogImportMapping {
  itemId: string; canonicalCode: string | null; action: 'update' | 'keep' | 'archive' | 'verify';
  expectedVersionId: string; candidateCodes?: string[]; blockedCodes?: string[]; reason?: string;
  decision?: 'distinct_v1_archive_legacy'; formerCandidates?: string[];
}
export interface CatalogImportManifest {
  schemaVersion: 1; reference: string; entries: CatalogImportMapping[];
}
export interface CatalogImportPlanRow {
  key: string; canonicalCode: string | null; action: CatalogImportAction;
  itemId: string | null; name: string;
  oldVersionId: string | null; oldVersionNumber: number | null; newVersionNumber: number | null;
  oldPriceMode: string | null; oldPriceCents: number | null;
  newPriceMode: string | null; newPriceCents: number | null; newPriceBasis: string | null;
  recordSha256: string | null; anomaly: string | null; pending: boolean;
  blueprintLinks: number; offerComponents: number;
}
export interface CatalogImportPlan {
  payloadSha256: string; planSha256: string; sourceSha256: string; manifestSha256: string;
  rows: CatalogImportPlanRow[];
  counts: Record<CatalogImportAction, number>;
  pendingMappings: number; blockedCanonicalCodes: string[]; anomalies: string[];
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value).filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b)).map(([key, v]) => `${JSON.stringify(key)}:${stable(v)}`).join(',')}}`;
  return JSON.stringify(value) ?? 'null';
}
export const catalogImportHash = (value: unknown): string => createHash('sha256').update(stable(value)).digest('hex');

export class CatalogImportService {
  private readonly catalog: CatalogService;
  constructor(private readonly database: DatabaseAdapter) { this.catalog = new CatalogService(database); }

  /** Read-only. No name matching, migration, seed, version creation or activity write. */
  simulate(source: CatalogImportSource, manifest: CatalogImportManifest): CatalogImportPlan {
    this.validate(source, manifest);
    const manifestSha256 = catalogImportHash(manifest);
    const payloadSha256 = catalogImportHash({ source, manifest });
    const blockedCanonicalCodes = [...new Set(manifest.entries.filter(entry => entry.action === 'verify').flatMap(entry => entry.blockedCodes ?? []))].sort();
    const rows: CatalogImportPlanRow[] = [];
    for (const record of source.records) {
      const mapping = manifest.entries.find(entry => entry.canonicalCode === record.canonicalCode);
      const assigned = this.database.get<{ id: string }>('SELECT id FROM catalog_items WHERE canonical_code=?', [record.canonicalCode]);
      const itemId = assigned?.id ?? mapping?.itemId ?? null;
      const blocked = blockedCanonicalCodes.includes(record.canonicalCode);
      rows.push(this.planRecord(record, itemId, mapping, blocked, source));
    }
    for (const mapping of manifest.entries.filter(entry => !entry.canonicalCode)) {
      const item = this.database.get<{ name: string; status: string }>('SELECT name,status FROM catalog_items WHERE id=?', [mapping.itemId]);
      const version = this.latest(mapping.itemId);
      const pending = mapping.action === 'verify';
      const changed = item && version && version.id !== mapping.expectedVersionId;
      const previouslyArchived = mapping.action === 'archive' && this.database.get('SELECT run_id FROM catalog_import_entries WHERE item_id=? AND action=\'archive\'', [mapping.itemId]);
      rows.push({ key: `legacy:${mapping.itemId}`, canonicalCode: null, itemId: mapping.itemId,
        name: item?.name ?? mapping.itemId, action: mapping.action === 'archive' && item?.status === 'archived' ? 'keep' : mapping.action,
        oldVersionId: version?.id ?? null, oldVersionNumber: version?.version_number ?? null, newVersionNumber: null,
        oldPriceMode: version?.price_mode ?? null, oldPriceCents: version?.price_cents ?? null,
        newPriceMode: null, newPriceCents: null, newPriceBasis: null, recordSha256: null,
        anomaly: !item ? 'Ancien ID absent : mapping à adapter explicitement.' : changed ? 'Version historique différente de la version contrôlée.' : previouslyArchived && item.status !== 'archived' ? 'Archive réactivée manuellement : ne pas réarchiver silencieusement.' : pending ? mapping.reason ?? 'Décision métier requise.' : null,
        pending, blueprintLinks: this.countLinks('catalog_project_blueprints', 'catalog_version_id', version?.id),
        offerComponents: this.countLinks('offer_components', 'offer_version_id', version?.id),
      });
    }
    const counts: Record<CatalogImportAction, number> = { create: 0, update: 0, keep: 0, archive: 0, verify: 0 };
    for (const row of rows) counts[row.action]++;
    const anomalies = rows.filter(row => row.anomaly && !row.pending).map(row => `${row.key}: ${row.anomaly}`);
    // Bind approval to the catalogue, versions and link contents, not just row counts/prices.
    const state = {
      items: this.database.all('SELECT * FROM catalog_items ORDER BY id'),
      versions: this.database.all('SELECT * FROM catalog_versions ORDER BY id'),
      components: this.database.all('SELECT * FROM offer_components ORDER BY id'),
      blueprints: this.database.all('SELECT * FROM catalog_project_blueprints ORDER BY id'),
    };
    return { payloadSha256, planSha256: catalogImportHash({ payloadSha256, rows, state }),
      sourceSha256: source.source.sha256, manifestSha256, rows, counts,
      pendingMappings: manifest.entries.filter(entry => entry.action === 'verify').length, blockedCanonicalCodes, anomalies };
  }

  /** Explicit call only. Caller must supply the exact preview token; unresolved rows are never executed. */
  apply(source: CatalogImportSource, manifest: CatalogImportManifest, options: { expectedPlanSha256: string; allowPartial?: boolean }): CatalogImportPlan {
    this.database.exec('BEGIN IMMEDIATE;');
    try {
      const plan = this.simulate(source, manifest);
      if (options.expectedPlanSha256 !== plan.planSha256) throw new Error('La simulation a changé : recalculer et valider le dry-run.');
      if (plan.anomalies.length) throw new Error(`Import refusé : ${plan.anomalies.join(' ; ')}`);
      if (plan.pendingMappings && !options.allowPartial) throw new Error('Rapprochements À VÉRIFIER : décision métier requise, import intégral refusé.');
      const actionable = plan.rows.filter(row => ['create', 'update', 'archive'].includes(row.action) && !row.pending);
      if (!actionable.length) { this.database.exec('COMMIT;'); return plan; }
      const runId = randomUUID(), now = new Date().toISOString();
      this.database.run('INSERT INTO catalog_import_runs (id,payload_sha256,source_sha256,manifest_sha256,summary_json,created_at) VALUES (?,?,?,?,?,?)',
        [runId, plan.payloadSha256, plan.sourceSha256, plan.manifestSha256, JSON.stringify(plan.counts), now]);
      for (const row of actionable) {
        const before = row.itemId ? this.database.get('SELECT * FROM catalog_items WHERE id=?', [row.itemId]) : null;
        let itemId = row.itemId!, toVersionId: string | null = null;
        if (row.action === 'archive') this.catalog.setStatus(itemId, 'archived');
        else {
          const record = source.records.find(record => record.canonicalCode === row.canonicalCode)!;
          if (row.action === 'create') {
            const item = this.catalog.create({ type: record.type, name: record.name, category: record.category,
              canonicalCode: record.canonicalCode, identityProvenance: record.version.provenance }, record.version);
            itemId = item.id; toVersionId = item.versions[0].id;
          } else {
            this.catalog.applyIdentityManifest({ schemaVersion: 1, assignments: [{ itemId, canonicalCode: record.canonicalCode, provenance: record.version.provenance! }] });
            toVersionId = this.catalog.createVersion(itemId, record.version).id;
            // Item labels are live metadata; old names are preserved in the import ledger and quote snapshots.
            this.database.run('UPDATE catalog_items SET name=?,category=?,updated_at=? WHERE id=?', [record.name, record.category, now, itemId]);
          }
        }
        const after = this.database.get('SELECT * FROM catalog_items WHERE id=?', [itemId])!;
        this.database.run(`INSERT INTO catalog_import_entries
          (run_id,entry_key,action,item_id,from_version_id,to_version_id,source_record_sha256,before_item_json,after_item_json)
          VALUES (?,?,?,?,?,?,?,?,?)`, [runId, row.key, row.action, itemId, row.oldVersionId, toVersionId,
          row.recordSha256, before ? JSON.stringify(before) : null, JSON.stringify(after)]);
      }
      this.database.run('INSERT INTO activity_log (entity_type,entity_id,action,summary,metadata_json,created_at) VALUES (?,?,?,?,?,?)',
        ['catalog', runId, 'catalog_v1_imported', 'Reprise explicite catalogue V1 en brouillon ; aucune clause importée.',
          JSON.stringify({ source: source.source, manifest: manifest.reference, counts: plan.counts, pendingMappings: plan.pendingMappings }), now]);
      this.database.exec('COMMIT;');
      return plan;
    } catch (error) { this.database.exec('ROLLBACK;'); throw error; }
  }

  private planRecord(record: CatalogImportRecord, itemId: string | null, mapping: CatalogImportMapping | undefined, blocked: boolean, source: CatalogImportSource): CatalogImportPlanRow {
    const item = itemId ? this.database.get<{ canonical_code: string | null; name: string; category: string | null; status: string }>('SELECT canonical_code,name,category,status FROM catalog_items WHERE id=?', [itemId]) : null;
    const version = itemId ? this.latest(itemId) : undefined;
    const recordSha256 = catalogImportHash(record);
    const imported = itemId ? this.database.get<{ to_version_id: string; from_version_id: string | null }>(
      'SELECT to_version_id,from_version_id FROM catalog_import_entries WHERE item_id=? AND source_record_sha256=? ORDER BY rowid DESC LIMIT 1', [itemId, recordSha256]) : undefined;
    let anomaly: string | null = null;
    let action: CatalogImportAction = itemId ? 'update' : 'create';
    if (blocked) { action = 'verify'; anomaly = 'Création/reprise suspendue : rapprochement métier non décidé.'; }
    else if (mapping && this.database.get<{ id: string }>('SELECT id FROM catalog_items WHERE canonical_code=? AND id<>?', [record.canonicalCode, mapping.itemId])) anomaly = 'Le code est déjà attribué à un autre ID ; aucun rapprochement automatique.';
    else if (mapping && !item) anomaly = 'Ancien ID absent : aucune création de remplacement automatique.';
    else if (item?.canonical_code && item.canonical_code !== record.canonicalCode) anomaly = 'Ancien ID déjà attribué à un autre code.';
    else if (imported) {
      if (version?.id !== imported.to_version_id || !this.matchesImportedVersion(version.id, record)
        || !this.matchesCopiedRelations(imported.from_version_id, imported.to_version_id)
        || item?.name !== record.name || item?.category !== record.category || item?.status !== 'active') anomaly = 'Référence importée modifiée depuis : ne pas écraser les changements manuels.';
      else action = 'keep';
    } else if (item?.canonical_code) anomaly = 'Code existant sans provenance de cette reprise : validation explicite requise.';
    else if (mapping && version?.id !== mapping.expectedVersionId) anomaly = 'Version historique différente de la version contrôlée.';
    if (record.version.provenance?.sha256 !== source.source.sha256) anomaly = 'Empreinte de provenance différente de la source.';
    return { key: record.canonicalCode, canonicalCode: record.canonicalCode, action, itemId, name: record.name,
      oldVersionId: version?.id ?? null, oldVersionNumber: version?.version_number ?? null,
      newVersionNumber: action === 'keep' || action === 'verify' ? version?.version_number ?? null : Number(version?.version_number ?? 0) + 1,
      oldPriceMode: version?.price_mode ?? null, oldPriceCents: version?.price_cents ?? null,
      newPriceMode: record.version.priceMode, newPriceCents: record.version.priceCents ?? null,
      newPriceBasis: record.version.priceBasis ?? 'listed', recordSha256, anomaly, pending: blocked,
      blueprintLinks: this.countLinks('catalog_project_blueprints', 'catalog_version_id', version?.id),
      offerComponents: this.countLinks('offer_components', 'offer_version_id', version?.id) };
  }

  private matchesImportedVersion(versionId: string, record: CatalogImportRecord): boolean {
    const stored = this.catalog.getItem(this.database.get<{ item_id: string }>('SELECT item_id FROM catalog_versions WHERE id=?', [versionId])!.item_id)
      .versions.find(version => version.id === versionId)!;
    return Object.entries(record.version).every(([key, value]) => stable(stored[key as keyof typeof stored]) === stable(value));
  }

  private matchesCopiedRelations(from: string | null, to: string): boolean {
    if (!from) return true;
    const relations = (id: string) => ({
      components: this.database.all('SELECT service_version_id,is_optional,quantity_milli,sort_order FROM offer_components WHERE offer_version_id=? ORDER BY sort_order,service_version_id', [id]),
      blueprints: this.database.all('SELECT template_version_id,role,sort_order,quantity_mode,site_mode FROM catalog_project_blueprints WHERE catalog_version_id=? ORDER BY sort_order,template_version_id,role', [id]),
    });
    return stable(relations(from)) === stable(relations(to));
  }

  private latest(itemId: string) {
    return this.database.get<{ id: string; version_number: number; price_mode: string; price_cents: number | null }>(
      'SELECT id,version_number,price_mode,price_cents FROM catalog_versions WHERE item_id=? ORDER BY version_number DESC LIMIT 1', [itemId]);
  }
  private countLinks(table: 'catalog_project_blueprints' | 'offer_components', column: string, versionId?: string): number {
    return versionId ? Number(this.database.get<{ n: number }>(`SELECT COUNT(*) n FROM ${table} WHERE ${column}=?`, [versionId])?.n ?? 0) : 0;
  }

  private validate(source: CatalogImportSource, manifest: CatalogImportManifest): void {
    if (source.schemaVersion !== 1 || manifest.schemaVersion !== 1 || !/^[a-f0-9]{64}$/.test(source.source.sha256)) throw new Error('Source/manifeste V1 invalide.');
    if (source.records.length !== 112) throw new Error('Le référentiel V1 doit contenir exactement 112 codes.');
    const codes = new Set<string>();
    for (const record of source.records) {
      if (!/^AW-[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(record.canonicalCode) || codes.has(record.canonicalCode)) throw new Error('Code AW invalide ou dupliqué.');
      codes.add(record.canonicalCode);
      if (!record.name.trim() || !['offer','service'].includes(record.type)) throw new Error('Identité commerciale invalide.');
      this.catalog.validateVersion(record.version);
      if (record.version.provenance?.sha256 !== source.source.sha256 || record.version.provenance.reference !== source.source.reference || !record.version.provenance.recordKey) throw new Error('Provenance commerciale différente ou incomplète.');
    }
    const ids = new Set<string>(), mappedCodes = new Set<string>();
    for (const mapping of manifest.entries) {
      if (!mapping.itemId || !mapping.expectedVersionId || ids.has(mapping.itemId)) throw new Error('Ancien ID ambigu/dupliqué dans le manifeste.');
      ids.add(mapping.itemId);
      if (!['update','keep','archive','verify'].includes(mapping.action)) throw new Error('Action de mapping invalide.');
      if (mapping.action === 'update' && !mapping.canonicalCode) throw new Error('Code cible requis pour une reprise.');
      if (mapping.canonicalCode && (mapping.action !== 'update' || !codes.has(mapping.canonicalCode) || mappedCodes.has(mapping.canonicalCode))) throw new Error('Code cible absent, ambigu ou action incompatible.');
      if (mapping.canonicalCode) mappedCodes.add(mapping.canonicalCode);
      if (mapping.decision && (mapping.decision !== 'distinct_v1_archive_legacy' || mapping.action !== 'archive' || mapping.canonicalCode || mapping.blockedCodes?.length)) throw new Error('Décision de référence distincte incompatible avec le mapping historique.');
      for (const code of [...mapping.candidateCodes ?? [], ...mapping.blockedCodes ?? [], ...mapping.formerCandidates ?? []]) if (!codes.has(code)) throw new Error('Candidat absent du référentiel.');
    }
  }
}
