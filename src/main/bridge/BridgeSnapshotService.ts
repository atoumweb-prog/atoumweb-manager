import { createHash, randomUUID } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import type {
  BridgeAssetSummary,
  BridgeNodeMatchDecisionInput,
  BridgeDependencySummary,
  BridgeNodeSummary,
  BridgeObjectPreview,
  BridgeModulePreview,
  BridgePageNodeMatchReview,
  BridgePagePreview,
  BridgePageSnapshotDetail,
  BridgePageSummary,
  BridgeSiteDetail,
  BridgeSiteSummary,
  BridgeSnapshotDiff,
  BridgeSnapshotImportResult,
  BridgeSnapshotIssue,
  BridgeSnapshotSummary,
  BridgeSourceSummary,
} from '../../shared/bridgeSnapshots';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import { BridgeNodeMatchDecisions } from './BridgeNodeMatchDecisions';
import type { WorkspacePaths } from '../workspace';
import {
  arrayOfRecords,
  asRecord,
  loadBridgeSnapshotPackage,
  nullableNumber,
  nullableString,
  numberValue,
  objectRef,
  requiredString,
  stringArray,
} from './BridgeSnapshotPackage';

interface PageRow extends Record<string, unknown> {
  page_id: string;
  page_snapshot_id: string;
  external_page_snapshot_id: string;
  snapshot_id: string;
  source_page_key: string;
  source_post_id: number | null;
  post_type: string;
  status: string | null;
  title: string;
  slug: string | null;
  canonical_url: string | null;
  storage_format: string | null;
  builder: string | null;
  builder_generation: string | null;
  is_divi_content: number;
  scope: string | null;
  audit_status: string | null;
  raw_object_ref: string | null;
  source_ids_json: string;
  asset_ids_json: string;
  dependency_ids_json: string;
  metadata_json: string;
  node_count: number;
}

interface SnapshotDiffPageRow extends PageRow {
  fingerprints_json: string;
}

function stableStringSet(value: unknown): string {
  return JSON.stringify(parseStringArray(value).slice().sort());
}

function stableObjectString(value: unknown): string {
  const normalize = (input: unknown): unknown => {
    if (Array.isArray(input)) return input.map(normalize);
    if (!input || typeof input !== 'object') return input;
    return Object.fromEntries(
      Object.entries(input as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, normalize(nested)]),
    );
  };
  return JSON.stringify(normalize(value));
}

function scoreNodeMatch(before: BridgeNodeSummary, after: BridgeNodeSummary) {
  let score = 0;
  const reasons: string[] = [];

  if (before.nodeType === after.nodeType) {
    score += 14;
    reasons.push('Même type de nœud');
  } else {
    return makeNodeScore(before, after, 0, []);
  }

  if (before.moduleType && before.moduleType === after.moduleType) {
    score += 24;
    reasons.push('Même type de module');
  } else if (before.moduleType !== after.moduleType) {
    score -= 8;
  }

  const beforeFingerprints = meaningfulRecord(before.fingerprints);
  const afterFingerprints = meaningfulRecord(after.fingerprints);
  if (beforeFingerprints && afterFingerprints && stableObjectString(beforeFingerprints) === stableObjectString(afterFingerprints)) {
    score += 40;
    reasons.push('Empreinte technique identique');
  }

  if (before.label && after.label && normalizeMatchText(before.label) === normalizeMatchText(after.label)) {
    score += 10;
    reasons.push('Même libellé');
  }

  if (before.depth === after.depth) {
    score += 4;
    reasons.push('Même profondeur');
  }

  if (before.position === after.position) {
    score += 4;
    reasons.push('Même position');
  }

  const sharedIds = intersection(before.ids, after.ids);
  if (sharedIds.length > 0) {
    score += 18;
    reasons.push(`Identifiant HTML commun : ${sharedIds.slice(0, 2).join(', ')}`);
  }

  const sharedClasses = intersection(before.classes, after.classes);
  if (sharedClasses.length > 0) {
    score += Math.min(12, 4 + sharedClasses.length * 2);
    reasons.push(`Classe(s) commune(s) : ${sharedClasses.slice(0, 3).join(', ')}`);
  }

  const beforeHints = meaningfulRecord(before.matchingHints);
  const afterHints = meaningfulRecord(after.matchingHints);
  if (beforeHints && afterHints && stableObjectString(beforeHints) === stableObjectString(afterHints)) {
    score += 10;
    reasons.push('Indices de correspondance identiques');
  }

  return makeNodeScore(before, after, Math.max(0, Math.min(100, score)), reasons);
}

function makeNodeScore(before: BridgeNodeSummary, after: BridgeNodeSummary, score: number, reasons: string[]) {
  return {
    beforeOccurrenceId: before.occurrenceId,
    afterOccurrenceId: after.occurrenceId,
    beforeLabel: before.label ?? before.moduleType ?? before.nodeType,
    afterLabel: after.label ?? after.moduleType ?? after.nodeType,
    nodeType: before.nodeType,
    moduleType: before.moduleType,
    score,
    reasons,
  };
}

function meaningfulRecord(value: Record<string, unknown>): Record<string, unknown> | null {
  return Object.keys(value).length > 0 ? value : null;
}

function normalizeMatchText(value: string): string {
  return value.trim().toLocaleLowerCase('fr-FR').replace(/\s+/g, ' ');
}

function intersection(left: string[], right: string[]): string[] {
  const rightSet = new Set(right);
  return [...new Set(left.filter((item) => rightSet.has(item)))].sort();
}

function snapshotDiffWarnings(before: BridgeSnapshotSummary, after: BridgeSnapshotSummary): string[] {
  const warnings: string[] = [];
  const describe = (snapshot: BridgeSnapshotSummary, label: string) => {
    if (snapshot.snapshotType !== 'full') {
      warnings.push(`${label} n’est pas un snapshot complet : les absences ne prouvent pas forcément une suppression.`);
    }
    const pagesCoverage = snapshot.coverage.pages;
    const pageMode = pagesCoverage && typeof pagesCoverage === 'object' && !Array.isArray(pagesCoverage)
      ? String((pagesCoverage as Record<string, unknown>).mode ?? '')
      : '';
    if (pageMode && pageMode !== 'complete') {
      warnings.push(`${label} a une couverture pages « ${pageMode} » : interpréter les ajouts/suppressions avec prudence.`);
    }
    if (snapshot.scanStatus === 'partial_failure' || snapshot.scanStatus === 'failed') {
      warnings.push(`${label} a un scan ${snapshot.scanStatus} : le diff peut être incomplet.`);
    }
  };
  describe(before, 'La copie Avant');
  describe(after, 'La copie Après');
  if (before.bridgeVersion !== after.bridgeVersion) {
    warnings.push(`Versions Bridge différentes (${before.bridgeVersion} → ${after.bridgeVersion}) : une évolution du scanner peut expliquer certains écarts techniques.`);
  }
  if (before.schemaVersion !== after.schemaVersion || before.fingerprintProfile !== after.fingerprintProfile) {
    warnings.push('Le schéma ou le profil de fingerprint diffère entre les deux copies : la comparabilité technique est réduite.');
  }
  return warnings;
}

export class BridgeSnapshotService {
  constructor(
    private readonly database: DatabaseAdapter,
    private readonly workspace: WorkspacePaths,
  ) {
    mkdirSync(join(workspace.bridgeDirectory, 'objects', 'sha256'), { recursive: true });
    mkdirSync(join(workspace.bridgeDirectory, 'packages'), { recursive: true });
  }

  inspectPackage(path: string) {
    return loadBridgeSnapshotPackage(path).inspection;
  }

  importPackage(path: string): BridgeSnapshotImportResult {
    const loaded = loadBridgeSnapshotPackage(path);
    const existing = this.database.get<{ id: string; site_id: string; package_fingerprint: string }>(
      'SELECT id,site_id,package_fingerprint FROM bridge_snapshots WHERE external_snapshot_id=?',
      [loaded.inspection.externalSnapshotId],
    );
    if (existing) {
      if (existing.package_fingerprint !== loaded.packageFingerprint) {
        throw new Error('Conflit Snapshot Bridge : ce snapshot_id existe déjà avec un package différent.');
      }
      return { alreadyImported: true, site: this.getSiteSummary(existing.site_id), snapshot: this.getSnapshot(existing.id) };
    }

    const byInstance = this.database.get<{ id: string; source_site_key: string }>(
      'SELECT id,source_site_key FROM bridge_sites WHERE source_instance_id=?',
      [loaded.inspection.sourceInstanceId],
    );
    const byKey = this.database.get<{ id: string; source_instance_id: string }>(
      'SELECT id,source_instance_id FROM bridge_sites WHERE source_site_key=?',
      [loaded.inspection.sourceSiteKey],
    );
    if (byInstance && byKey && byInstance.id !== byKey.id) {
      throw new Error('Conflit d’identité Bridge : instance et URL correspondent à deux sites Manager différents.');
    }
    if (byInstance && byInstance.source_site_key !== loaded.inspection.sourceSiteKey) {
      throw new Error('Cette instance Bridge est connue sous une autre URL. Clone ou migration à examiner avant import.');
    }
    if (byKey && byKey.source_instance_id !== loaded.inspection.sourceInstanceId) {
      throw new Error('Cette URL est connue avec une autre instance Bridge. Réinstallation ou clone à examiner avant import.');
    }

    const siteId = byInstance?.id ?? byKey?.id ?? `bridge-site-${randomUUID()}`;
    const declaredManagerSiteId = nullableString(loaded.manifest.site_id);
    if (declaredManagerSiteId && declaredManagerSiteId !== siteId) {
      throw new Error('Le site_id fourni par Bridge ne correspond pas à l’identité historique du Manager.');
    }
    const snapshotId = `bridge-snapshot-${randomUUID()}`;
    const now = new Date().toISOString();
    const packageRelativePath = join('packages', siteId, `${this.safeSegment(loaded.inspection.externalSnapshotId)}.zip`).replace(/\\/g, '/');

    this.persistObjects(loaded);
    this.persistPackage(loaded.path, packageRelativePath);
    const pageSnapshotIds = new Map<string, string>();

    this.database.exec('BEGIN IMMEDIATE;');
    try {
      if (!byInstance && !byKey) {
        this.database.run(
          `INSERT INTO bridge_sites
           (id,name,canonical_url,wordpress_site_url,environment,source_instance_id,source_site_key,created_at,updated_at,last_snapshot_at)
           VALUES (?,?,?,?,?,?,?,?,?,?)`,
          [
            siteId, loaded.inspection.site.name, loaded.inspection.site.canonicalUrl, loaded.inspection.site.wordpressSiteUrl,
            loaded.inspection.site.environment, loaded.inspection.sourceInstanceId, loaded.inspection.sourceSiteKey,
            now, now, loaded.inspection.generatedAt,
          ],
        );
      } else {
        this.database.run(
          `UPDATE bridge_sites SET name=?,canonical_url=?,wordpress_site_url=?,environment=?,updated_at=?,last_snapshot_at=? WHERE id=?`,
          [
            loaded.inspection.site.name, loaded.inspection.site.canonicalUrl, loaded.inspection.site.wordpressSiteUrl,
            loaded.inspection.site.environment, now, loaded.inspection.generatedAt, siteId,
          ],
        );
      }

      const count = loaded.inspection.counts;
      this.database.run(
        `INSERT INTO bridge_snapshots
         (id,site_id,external_snapshot_id,package_fingerprint,generated_at,imported_at,snapshot_type,scan_status,bridge_version,
          schema_version,fingerprint_profile,page_count,node_count,source_count,asset_count,dependency_count,relation_count,
          object_count,issues_json,coverage_json,scanner_capabilities_json,observed_content_json,security_json,environment_json,package_relative_path)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          snapshotId, siteId, loaded.inspection.externalSnapshotId, loaded.packageFingerprint, loaded.inspection.generatedAt, now,
          loaded.inspection.snapshotType, loaded.inspection.scanStatus, loaded.inspection.bridgeVersion, loaded.inspection.schemaVersion,
          loaded.inspection.fingerprintProfile, count.pages, count.nodes, count.sources, count.assets, count.dependencies, count.relations,
          count.objects, JSON.stringify(loaded.inspection.issues), JSON.stringify(loaded.inspection.coverage),
          JSON.stringify(loaded.inspection.scannerCapabilities), JSON.stringify(loaded.inspection.observedContent),
          JSON.stringify(loaded.inspection.security), JSON.stringify(asRecord(loaded.snapshot.environment)), packageRelativePath,
        ],
      );

      for (const loadedPage of loaded.pages) {
        const page = loadedPage.page;
        const sourcePageKey = requiredString(page.source_page_key, 'source_page_key');
        let pageId = this.database.get<{ id: string }>(
          'SELECT id FROM bridge_pages WHERE site_id=? AND source_page_key=?',
          [siteId, sourcePageKey],
        )?.id;
        if (!pageId) {
          pageId = `bridge-page-${randomUUID()}`;
          this.database.run(
            `INSERT INTO bridge_pages
             (id,site_id,source_page_key,source_post_id,post_type,title,slug,canonical_url,wordpress_guid,created_at,updated_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
            [
              pageId, siteId, sourcePageKey, nullableNumber(page.source_post_id), requiredString(page.post_type, 'post_type'),
              requiredString(page.title, 'title'), nullableString(page.slug), nullableString(page.canonical_url),
              nullableString(page.wordpress_guid), now, now,
            ],
          );
        } else {
          this.database.run(
            `UPDATE bridge_pages SET source_post_id=?,post_type=?,title=?,slug=?,canonical_url=?,wordpress_guid=?,updated_at=? WHERE id=?`,
            [
              nullableNumber(page.source_post_id), requiredString(page.post_type, 'post_type'), requiredString(page.title, 'title'),
              nullableString(page.slug), nullableString(page.canonical_url), nullableString(page.wordpress_guid), now, pageId,
            ],
          );
        }

        const managerPageSnapshotId = `bridge-pagesnapshot-${randomUUID()}`;
        const externalPageSnapshotId = requiredString(page.page_snapshot_id, 'page_snapshot_id');
        pageSnapshotIds.set(externalPageSnapshotId, managerPageSnapshotId);
        this.database.run(
          `INSERT INTO bridge_page_snapshots
           (id,snapshot_id,page_id,external_page_snapshot_id,source_page_key,status,title,slug,canonical_url,storage_format,builder,
            builder_generation,is_divi_content,scope,audit_status,raw_object_ref,source_ids_json,asset_ids_json,dependency_ids_json,
            relation_ids_json,fingerprints_json,frontend_json,metadata_json)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [
            managerPageSnapshotId, snapshotId, pageId, externalPageSnapshotId, sourcePageKey, nullableString(page.status),
            requiredString(page.title, 'title'), nullableString(page.slug), nullableString(page.canonical_url),
            nullableString(page.storage_format), nullableString(page.builder), nullableString(page.builder_generation),
            page.is_divi_content ? 1 : 0, nullableString(page.scope), nullableString(page.audit_status), objectRef(page.raw_source),
            JSON.stringify(stringArray(page.source_ids)), JSON.stringify(stringArray(page.asset_ids)),
            JSON.stringify(stringArray(page.dependency_ids)), JSON.stringify(stringArray(page.relation_ids)),
            JSON.stringify(asRecord(page.fingerprints)), JSON.stringify(asRecord(page.frontend)), JSON.stringify(loadedPage.meta),
          ],
        );

        loadedPage.nodes.forEach((node, ordinal) => {
          this.database.run(
            `INSERT INTO bridge_nodes
             (id,page_snapshot_id,occurrence_id,logical_node_id,parent_occurrence_id,position,ordinal,depth,node_type,module_type,label,
              builder,builder_generation,attributes_json,responsive_json,design_json,classes_json,ids_json,source_ids_json,asset_ids_json,
              dependency_ids_json,relation_ids_json,raw_object_ref,content_object_ref,fingerprints_json,matching_hints_json)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
              `bridge-node-${randomUUID()}`, managerPageSnapshotId, requiredString(node.occurrence_id, 'occurrence_id'), null,
              nullableString(node.parent_occurrence_id), numberValue(node.position, 0), ordinal, numberValue(node.__depth, 0),
              requiredString(node.node_type, 'node_type'), nullableString(node.module_type), nullableString(node.label),
              nullableString(node.builder), nullableString(node.builder_generation), JSON.stringify(node.attributes ?? {}),
              JSON.stringify(node.responsive ?? {}), JSON.stringify(node.design ?? {}), JSON.stringify(stringArray(node.classes)),
              JSON.stringify(stringArray(node.ids)), JSON.stringify(stringArray(node.source_ids)), JSON.stringify(stringArray(node.asset_ids)),
              JSON.stringify(stringArray(node.dependency_ids)), JSON.stringify(stringArray(node.relation_ids)), objectRef(node.raw_source),
              objectRef(node.content), JSON.stringify(asRecord(node.fingerprints)), JSON.stringify(asRecord(node.matching_hints)),
            ],
          );
        });
      }

      for (const source of loaded.sources) {
        const externalPageSnapshotId = nullableString(source.page_snapshot_id);
        this.database.run(
          `INSERT INTO bridge_sources
           (snapshot_id,source_id,page_snapshot_id,node_occurrence_id,kind,scope,origin,owner,owner_slug,managed_externally,
            payload_object_ref,fingerprint,lines,bytes,evidence_json,raw_json)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [
            snapshotId, requiredString(source.source_id, 'source_id'),
            externalPageSnapshotId ? pageSnapshotIds.get(externalPageSnapshotId) ?? null : null,
            nullableString(source.node_occurrence_id), requiredString(source.kind, 'source kind'),
            requiredString(source.scope, 'source scope'), requiredString(source.origin, 'source origin'),
            requiredString(source.owner, 'source owner'), nullableString(source.owner_slug), source.managed_externally ? 1 : 0,
            objectRef(source.payload), nullableString(source.fingerprint), nullableNumber(source.lines), nullableNumber(source.bytes),
            JSON.stringify(asRecord(source.evidence)), JSON.stringify(source),
          ],
        );
      }

      for (const asset of loaded.assets) {
        const archive = asRecord(asset.archive);
        this.database.run(
          `INSERT INTO bridge_assets
           (snapshot_id,asset_id,type,wordpress_attachment_id,url,local_path,mime_type,width,height,size_bytes,hash,archive_mode,object_ref,raw_json)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [
            snapshotId, requiredString(asset.asset_id, 'asset_id'), requiredString(asset.type, 'asset type'),
            nullableNumber(asset.wordpress_attachment_id), nullableString(asset.url), nullableString(asset.local_path),
            nullableString(asset.mime_type), nullableNumber(asset.width), nullableNumber(asset.height), nullableNumber(asset.size_bytes),
            nullableString(asset.hash), nullableString(archive.mode), nullableString(archive.object_ref), JSON.stringify(asset),
          ],
        );
      }

      for (const dependency of loaded.dependencies) {
        this.database.run(
          `INSERT INTO bridge_dependencies (snapshot_id,dependency_id,type,slug,name,version,active,raw_json) VALUES (?,?,?,?,?,?,?,?)`,
          [
            snapshotId, requiredString(dependency.dependency_id, 'dependency_id'), requiredString(dependency.type, 'dependency type'),
            nullableString(dependency.slug), requiredString(dependency.name, 'dependency name'), nullableString(dependency.version),
            typeof dependency.active === 'boolean' ? (dependency.active ? 1 : 0) : null, JSON.stringify(dependency),
          ],
        );
      }

      for (const relation of loaded.relations) {
        const from = asRecord(relation.from);
        const to = asRecord(relation.to);
        this.database.run(
          `INSERT INTO bridge_relations
           (snapshot_id,relation_id,type,from_entity,from_id,to_entity,to_id,properties_json,raw_json) VALUES (?,?,?,?,?,?,?,?,?)`,
          [
            snapshotId, requiredString(relation.relation_id, 'relation_id'), requiredString(relation.type, 'relation type'),
            requiredString(from.entity, 'relation from.entity'), requiredString(from.id, 'relation from.id'),
            requiredString(to.entity, 'relation to.entity'), requiredString(to.id, 'relation to.id'),
            JSON.stringify(asRecord(relation.properties)), JSON.stringify(relation),
          ],
        );
      }

      for (const [sectionKey, payload] of Object.entries(loaded.sections)) {
        this.database.run(
          'INSERT INTO bridge_snapshot_sections (snapshot_id,section_key,payload_json) VALUES (?,?,?)',
          [snapshotId, sectionKey, JSON.stringify(payload)],
        );
      }

      for (const object of loaded.objects) {
        this.database.run(
          `INSERT OR IGNORE INTO bridge_objects
           (object_ref,relative_path,content_type,encoding,byte_length,serialization,compression,first_seen_at) VALUES (?,?,?,?,?,?,?,?)`,
          [
            requiredString(object.ref, 'object ref'), requiredString(object.path, 'object path'), nullableString(object.content_type),
            nullableString(object.encoding), numberValue(object.byte_length, 0), nullableString(object.serialization),
            nullableString(object.compression), now,
          ],
        );
      }

      this.database.run(
        'INSERT INTO activity_log (entity_type,entity_id,action,summary,metadata_json,created_at) VALUES (?,?,?,?,?,?)',
        [
          'bridge_snapshot', snapshotId, 'bridge_snapshot_imported', `Snapshot Bridge importé : ${loaded.inspection.site.name}`,
          JSON.stringify({ externalSnapshotId: loaded.inspection.externalSnapshotId, packageFingerprint: loaded.packageFingerprint, counts: count }),
          now,
        ],
      );
      this.database.exec('COMMIT;');
    } catch (error) {
      this.database.exec('ROLLBACK;');
      throw error;
    }

    return { alreadyImported: false, site: this.getSiteSummary(siteId), snapshot: this.getSnapshot(snapshotId) };
  }

  listSites(): BridgeSiteSummary[] {
    return this.database.all<Record<string, unknown>>(
      `SELECT s.*,
       (SELECT COUNT(*) FROM bridge_snapshots x WHERE x.site_id=s.id) snapshot_count,
       (SELECT x.page_count FROM bridge_snapshots x WHERE x.site_id=s.id ORDER BY x.generated_at DESC LIMIT 1) latest_page_count,
       (SELECT x.scan_status FROM bridge_snapshots x WHERE x.site_id=s.id ORDER BY x.generated_at DESC LIMIT 1) latest_scan_status
       FROM bridge_sites s ORDER BY COALESCE(s.last_snapshot_at,s.created_at) DESC,s.name COLLATE NOCASE`,
    ).map((row) => this.mapSite(row));
  }

  getSite(id: string): BridgeSiteDetail {
    return { ...this.getSiteSummary(id), snapshots: this.listSnapshots(id) };
  }

  listPages(snapshotId: string, search?: string | null): BridgePageSummary[] {
    const query = (search ?? '').trim().toLocaleLowerCase('fr-FR');
    return this.pageRows(snapshotId)
      .map((row) => this.mapPage(row))
      .filter((page) => !query || [page.title, page.slug ?? '', page.postType, page.sourcePageKey, page.canonicalUrl ?? ''].join(' ').toLocaleLowerCase('fr-FR').includes(query));
  }

  getPage(pageSnapshotId: string): BridgePageSnapshotDetail {
    const row = this.database.get<PageRow>(
      `SELECT bp.id page_id,bps.id page_snapshot_id,bps.external_page_snapshot_id,bps.snapshot_id,bps.source_page_key,bp.source_post_id,
       bp.post_type,bps.status,bps.title,bps.slug,bps.canonical_url,bps.storage_format,bps.builder,bps.builder_generation,bps.is_divi_content,bps.scope,
       bps.audit_status,bps.raw_object_ref,bps.source_ids_json,bps.asset_ids_json,bps.dependency_ids_json,bps.metadata_json,
       (SELECT COUNT(*) FROM bridge_nodes n WHERE n.page_snapshot_id=bps.id) node_count
       FROM bridge_page_snapshots bps JOIN bridge_pages bp ON bp.id=bps.page_id WHERE bps.id=?`,
      [pageSnapshotId],
    );
    if (!row) throw new Error('Page Snapshot Bridge introuvable.');
    const page = this.mapPage(row);
    const nodes = this.database.all<Record<string, unknown>>(
      'SELECT * FROM bridge_nodes WHERE page_snapshot_id=? ORDER BY ordinal',
      [pageSnapshotId],
    ).map((node) => this.mapNode(node));

    const sourceIds = new Set(parseStringArray(row.source_ids_json));
    const assetIds = new Set(parseStringArray(row.asset_ids_json));
    const dependencyIds = new Set(parseStringArray(row.dependency_ids_json));
    nodes.forEach((node) => {
      node.sourceIds.forEach((id) => sourceIds.add(id));
      node.assetIds.forEach((id) => assetIds.add(id));
      node.dependencyIds.forEach((id) => dependencyIds.add(id));
    });

    return {
      page,
      nodes,
      sources: this.loadSources(page.snapshotId, [...sourceIds]),
      assets: this.loadAssets(page.snapshotId, [...assetIds]),
      dependencies: this.loadDependencies(page.snapshotId, [...dependencyIds]),
      metadata: parseObject(row.metadata_json),
    };
  }

  compareSnapshots(beforeSnapshotId: string, afterSnapshotId: string): BridgeSnapshotDiff {
    if (beforeSnapshotId === afterSnapshotId) {
      throw new Error('Choisis deux snapshots différents pour lancer la comparaison.');
    }

    const before = this.getSnapshot(beforeSnapshotId);
    const after = this.getSnapshot(afterSnapshotId);
    if (before.siteId !== after.siteId) {
      throw new Error('Les deux snapshots doivent appartenir au même site Bridge.');
    }

    const beforeRows = this.snapshotDiffPageRows(beforeSnapshotId);
    const afterRows = this.snapshotDiffPageRows(afterSnapshotId);
    // Exclusion limitée aux brouillons portant le préfixe réservé de Bridge.
    // Une page publiée ou un simple titre contenant « Workbench » reste comparé.
    const isWorkbench = (row: SnapshotDiffPageRow) => row.post_type === 'page'
      && row.status === 'draft' && /^AWB Workbench\s*[—–-]\s*Bibliothèque\s*[—–-]\s*\S/i.test(row.title);
    const allRows = [...beforeRows, ...afterRows];
    const ignoredWorkbenches = [...new Map(allRows.filter(isWorkbench)
      .filter((row) => allRows.filter((other) => other.source_page_key === row.source_page_key).every(isWorkbench))
      .map((row) => [row.source_page_key, { sourcePageKey: row.source_page_key, title: row.title }])).values()];
    const ignoredKeys = new Set(ignoredWorkbenches.map((row) => row.sourcePageKey));
    const beforeByKey = new Map(beforeRows.filter((row) => !ignoredKeys.has(row.source_page_key)).map((row) => [row.source_page_key, row] as const));
    const afterByKey = new Map(afterRows.filter((row) => !ignoredKeys.has(row.source_page_key)).map((row) => [row.source_page_key, row] as const));
    const keys = [...new Set([...beforeByKey.keys(), ...afterByKey.keys()])].sort((left, right) => left.localeCompare(right, 'fr'));

    const pages = keys.map((sourcePageKey) => {
      const beforePage = beforeByKey.get(sourcePageKey) ?? null;
      const afterPage = afterByKey.get(sourcePageKey) ?? null;

      if (!beforePage && afterPage) {
        return {
          sourcePageKey,
          status: 'added' as const,
          titleBefore: null,
          titleAfter: afterPage.title,
          beforePageSnapshotId: null,
          afterPageSnapshotId: afterPage.page_snapshot_id,
          changes: this.allPageChanges(true),
          counts: this.pageDiffCounts(null, afterPage),
        };
      }
      if (beforePage && !afterPage) {
        return {
          sourcePageKey,
          status: 'removed' as const,
          titleBefore: beforePage.title,
          titleAfter: null,
          beforePageSnapshotId: beforePage.page_snapshot_id,
          afterPageSnapshotId: null,
          changes: this.allPageChanges(true),
          counts: this.pageDiffCounts(beforePage, null),
        };
      }

      const left = beforePage!;
      const right = afterPage!;
      const changes = {
        title: left.title !== right.title || left.slug !== right.slug,
        status: left.status !== right.status,
        url: left.canonical_url !== right.canonical_url,
        builder: left.builder !== right.builder
          || left.builder_generation !== right.builder_generation
          || left.storage_format !== right.storage_format,
        rawObject: left.raw_object_ref !== right.raw_object_ref,
        fingerprints: this.stablePageFingerprintSignature(left) !== this.stablePageFingerprintSignature(right),
        nodes: this.nodeDiffSignature(left.page_snapshot_id) !== this.nodeDiffSignature(right.page_snapshot_id),
        sources: this.sourceDiffSignature(left.page_snapshot_id) !== this.sourceDiffSignature(right.page_snapshot_id),
        assets: stableStringSet(left.asset_ids_json) !== stableStringSet(right.asset_ids_json),
        dependencies: stableStringSet(left.dependency_ids_json) !== stableStringSet(right.dependency_ids_json),
      };
      const changed = Object.values(changes).some(Boolean);
      // Le scanner peut extraire autrement les mêmes données WordPress/Divi.
      // Sans preuve d'une source brute identique, conserver « modifié ».
      const technical = changed && before.bridgeVersion !== after.bridgeVersion
        && Boolean(left.raw_object_ref) && left.raw_object_ref === right.raw_object_ref
        && !changes.title && !changes.status && !changes.url && !changes.builder
        && !changes.fingerprints && !changes.assets;

      return {
        sourcePageKey,
        status: technical ? 'technical' as const : changed ? 'changed' as const : 'unchanged' as const,
        titleBefore: left.title,
        titleAfter: right.title,
        beforePageSnapshotId: left.page_snapshot_id,
        afterPageSnapshotId: right.page_snapshot_id,
        changes,
        counts: this.pageDiffCounts(left, right),
      };
    });

    return {
      siteId: before.siteId,
      before,
      after,
      warnings: snapshotDiffWarnings(before, after),
      summary: {
        added: pages.filter((page) => page.status === 'added').length,
        removed: pages.filter((page) => page.status === 'removed').length,
        changed: pages.filter((page) => page.status === 'changed').length,
        technical: pages.filter((page) => page.status === 'technical').length,
        unchanged: pages.filter((page) => page.status === 'unchanged').length,
      },
      pages,
      ignoredWorkbenches,
    };
  }

  reviewPageNodeMatches(beforePageSnapshotId: string, afterPageSnapshotId: string): BridgePageNodeMatchReview {
    if (beforePageSnapshotId === afterPageSnapshotId) {
      throw new Error('Choisis deux versions différentes de la page.');
    }

    const before = this.getPage(beforePageSnapshotId);
    const after = this.getPage(afterPageSnapshotId);
    const beforeSnapshot = this.getSnapshot(before.page.snapshotId);
    const afterSnapshot = this.getSnapshot(after.page.snapshotId);
    if (beforeSnapshot.siteId !== afterSnapshot.siteId || before.page.sourcePageKey !== after.page.sourcePageKey) {
      throw new Error('Les deux pages doivent représenter le même contenu du même site Bridge.');
    }

    const proposals = before.nodes.flatMap((beforeNode) => {
      const scored = after.nodes
        .map((afterNode) => scoreNodeMatch(beforeNode, afterNode))
        .filter((candidate) => candidate.score >= 35)
        .sort((left, right) => right.score - left.score || left.afterOccurrenceId.localeCompare(right.afterOccurrenceId));

      if (scored.length === 0) return [];
      const best = scored[0];
      const second = scored[1];
      const ambiguous = Boolean(second && best.score - second.score < 12);
      return [{
        ...best,
        confidence: ambiguous ? 'low' as const : best.score >= 82 ? 'high' as const : best.score >= 58 ? 'medium' as const : 'low' as const,
        ambiguous,
      }];
    });

    const accepted = proposals.filter((proposal) => !proposal.ambiguous);
    const afterUsage = new Map<string, typeof accepted>();
    accepted.forEach((proposal) => {
      const current = afterUsage.get(proposal.afterOccurrenceId) ?? [];
      current.push(proposal);
      afterUsage.set(proposal.afterOccurrenceId, current);
    });

    const collidingAfterIds = new Set(
      [...afterUsage.entries()]
        .filter(([, matches]) => matches.length > 1)
        .map(([afterOccurrenceId]) => afterOccurrenceId),
    );

    const candidates = proposals
      .map((proposal) => ({
        beforeOccurrenceId: proposal.beforeOccurrenceId,
        afterOccurrenceId: proposal.afterOccurrenceId,
        beforeLabel: proposal.beforeLabel,
        afterLabel: proposal.afterLabel,
        nodeType: proposal.nodeType,
        moduleType: proposal.moduleType,
        score: proposal.score,
        confidence: proposal.ambiguous || collidingAfterIds.has(proposal.afterOccurrenceId)
          ? 'low' as const
          : proposal.confidence,
        reasons: [
          ...proposal.reasons,
          ...(proposal.ambiguous ? ['Plusieurs cibles proches : validation humaine requise.'] : []),
          ...(collidingAfterIds.has(proposal.afterOccurrenceId) ? ['Cette cible est proposée pour plusieurs nœuds source.'] : []),
        ],
      }))
      .sort((left, right) => right.score - left.score || left.beforeOccurrenceId.localeCompare(right.beforeOccurrenceId));

    const decisions = new BridgeNodeMatchDecisions(this.database).list(beforePageSnapshotId, afterPageSnapshotId);
    const safelyMatchedBefore = new Set(decisions.filter((item) => item.decision === 'accepted').map((item) => item.beforeOccurrenceId));
    const safelyMatchedAfter = new Set(decisions.filter((item) => item.decision === 'accepted').map((item) => item.afterOccurrenceId));

    return {
      beforePageSnapshotId,
      afterPageSnapshotId,
      sourcePageKey: before.page.sourcePageKey,
      candidates,
      unmatchedBefore: before.nodes.filter((node) => !safelyMatchedBefore.has(node.occurrenceId)).map((node) => node.occurrenceId),
      unmatchedAfter: after.nodes.filter((node) => !safelyMatchedAfter.has(node.occurrenceId)).map((node) => node.occurrenceId),
      ambiguousBefore: candidates.filter((candidate) => candidate.confidence === 'low').map((candidate) => candidate.beforeOccurrenceId),
      decisions,
      history: new BridgeNodeMatchDecisions(this.database).history(beforePageSnapshotId, afterPageSnapshotId),
    };
  }

  decideNodeMatch(input: BridgeNodeMatchDecisionInput): BridgePageNodeMatchReview {
    if (!input || typeof input !== 'object') throw new Error('Décision de correspondance invalide.');
    const review = this.reviewPageNodeMatches(input.beforePageSnapshotId, input.afterPageSnapshotId);
    if (input.decision === 'pending') {
      new BridgeNodeMatchDecisions(this.database).reopen(input);
      return this.reviewPageNodeMatches(input.beforePageSnapshotId, input.afterPageSnapshotId);
    }
    const proposal = review.candidates.find((item) => item.beforeOccurrenceId === input.beforeOccurrenceId && item.afterOccurrenceId === input.afterOccurrenceId);
    if (!proposal) throw new Error('Cette correspondance ne fait pas partie des propositions actuelles.');
    new BridgeNodeMatchDecisions(this.database).record(input, proposal);
    return this.reviewPageNodeMatches(input.beforePageSnapshotId, input.afterPageSnapshotId);
  }

  buildDiagnostic(snapshotId: string): Record<string, unknown> {
    const snapshot = this.getSnapshot(snapshotId);
    const site = this.getSiteSummary(snapshot.siteId);
    const contents = this.listPages(snapshotId);

    const byPostType: Record<string, number> = {};
    const byScope: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const byBuilderGeneration: Record<string, number> = {};
    const categories = { pages: 0, posts: 0, diviLibrary: 0, themeBuilder: 0, other: 0 };

    for (const item of contents) {
      byPostType[item.postType] = (byPostType[item.postType] ?? 0) + 1;
      const scope = item.scope ?? 'unknown';
      byScope[scope] = (byScope[scope] ?? 0) + 1;
      const status = item.status ?? 'unknown';
      byStatus[status] = (byStatus[status] ?? 0) + 1;
      const generation = item.builderGeneration ?? item.builder ?? 'unknown';
      byBuilderGeneration[generation] = (byBuilderGeneration[generation] ?? 0) + 1;

      if (item.postType === 'page') categories.pages += 1;
      else if (item.postType === 'post') categories.posts += 1;
      else if (item.scope === 'divi_library') categories.diviLibrary += 1;
      else if (item.scope === 'theme_builder') categories.themeBuilder += 1;
      else categories.other += 1;
    }

    const scalarCount = (sql: string, params: (string | number | null)[] = []) =>
      Number(this.database.get<{ count: number }>(sql, params)?.count ?? 0);

    const actualCounts = {
      contents: scalarCount('SELECT COUNT(*) count FROM bridge_page_snapshots WHERE snapshot_id=?', [snapshotId]),
      nodes: scalarCount(
        'SELECT COUNT(*) count FROM bridge_nodes n JOIN bridge_page_snapshots p ON p.id=n.page_snapshot_id WHERE p.snapshot_id=?',
        [snapshotId],
      ),
      sources: scalarCount('SELECT COUNT(*) count FROM bridge_sources WHERE snapshot_id=?', [snapshotId]),
      assets: scalarCount('SELECT COUNT(*) count FROM bridge_assets WHERE snapshot_id=?', [snapshotId]),
      dependencies: scalarCount('SELECT COUNT(*) count FROM bridge_dependencies WHERE snapshot_id=?', [snapshotId]),
      relations: scalarCount('SELECT COUNT(*) count FROM bridge_relations WHERE snapshot_id=?', [snapshotId]),
      sections: scalarCount('SELECT COUNT(*) count FROM bridge_snapshot_sections WHERE snapshot_id=?', [snapshotId]),
    };

    const declaredCounts = {
      contents: snapshot.counts.pages,
      nodes: snapshot.counts.nodes,
      sources: snapshot.counts.sources,
      assets: snapshot.counts.assets,
      dependencies: snapshot.counts.dependencies,
      relations: snapshot.counts.relations,
      objects: snapshot.counts.objects,
    };

    return {
      format: 'atoumweb-manager-bridge-diagnostic-v1',
      exportedAt: new Date().toISOString(),
      site,
      snapshot,
      declaredCounts,
      actualCounts,
      countChecks: {
        contents: declaredCounts.contents === actualCounts.contents,
        nodes: declaredCounts.nodes === actualCounts.nodes,
        sources: declaredCounts.sources === actualCounts.sources,
        assets: declaredCounts.assets === actualCounts.assets,
        dependencies: declaredCounts.dependencies === actualCounts.dependencies,
        relations: declaredCounts.relations === actualCounts.relations,
      },
      contentBreakdown: {
        total: contents.length,
        categories,
        byPostType,
        byScope,
        byStatus,
        byBuilderGeneration,
      },
      sectionKeys: this.database.all<{ section_key: string }>(
        'SELECT section_key FROM bridge_snapshot_sections WHERE snapshot_id=? ORDER BY section_key',
        [snapshotId],
      ).map((row) => row.section_key),
      contents,
    };
  }

  getModulePreview(pageSnapshotId: string, occurrenceId: string): BridgeModulePreview {
    const pageRow = this.database.get<Record<string, unknown>>(
      `SELECT snapshot_id,title,canonical_url,frontend_json FROM bridge_page_snapshots WHERE id=?`,
      [pageSnapshotId],
    );
    if (!pageRow) throw new Error('Page Snapshot Bridge introuvable.');

    const nodeRow = this.database.get<Record<string, unknown>>(
      `SELECT occurrence_id,module_type,label,builder_generation,content_object_ref,raw_object_ref,classes_json,ids_json,asset_ids_json,dependency_ids_json
       FROM bridge_nodes WHERE page_snapshot_id=? AND occurrence_id=?`,
      [pageSnapshotId, occurrenceId],
    );
    if (!nodeRow) throw new Error('Module Bridge introuvable.');

    const snapshotId = String(pageRow.snapshot_id);
    const moduleSources = this.database.all<Record<string, unknown>>(
      `SELECT kind,payload_object_ref FROM bridge_sources
       WHERE snapshot_id=? AND page_snapshot_id=? AND node_occurrence_id=? ORDER BY source_id`,
      [snapshotId, pageSnapshotId, occurrenceId],
    );
    const pageSources = this.database.all<Record<string, unknown>>(
      `SELECT kind,payload_object_ref FROM bridge_sources
       WHERE snapshot_id=? AND page_snapshot_id=? AND node_occurrence_id IS NULL AND scope='page' ORDER BY source_id`,
      [snapshotId, pageSnapshotId],
    );
    const globalSources = this.database.all<Record<string, unknown>>(
      `SELECT kind,payload_object_ref FROM bridge_sources
       WHERE snapshot_id=? AND scope='global' ORDER BY source_id`,
      [snapshotId],
    );

    const textFrom = (row: Record<string, unknown>): string => {
      const ref = nullableString(row.payload_object_ref);
      return ref ? this.getObjectPreview(ref).text ?? '' : '';
    };
    const joinKind = (rows: Record<string, unknown>[], kind: string): string => {
      const seen = new Set<string>();
      return rows
        .filter((row) => String(row.kind) === kind)
        .filter((row) => {
          const ref = nullableString(row.payload_object_ref);
          if (!ref || seen.has(ref)) return false;
          seen.add(ref);
          return true;
        })
        .map(textFrom)
        .filter(Boolean)
        .join('\n\n');
    };
    const uniqueCount = (rows: Record<string, unknown>[], kind: string): number =>
      new Set(rows.filter((row) => String(row.kind) === kind).map((row) => nullableString(row.payload_object_ref)).filter(Boolean)).size;

    const rawRef = nullableString(nodeRow.raw_object_ref);
    const diviSource = rawRef ? this.getObjectPreview(rawRef).text ?? null : null;
    const separatedHtml = joinKind(moduleSources, 'html');
    const fallbackHtmlRef = nullableString(nodeRow.content_object_ref);
    const objectHtml = fallbackHtmlRef ? this.getObjectPreview(fallbackHtmlRef).text ?? '' : '';
    const derivedHtml = separatedHtml || objectHtml ? '' : extractHtmlFromDiviSource(diviSource);
    const sourceHtml = separatedHtml || objectHtml || derivedHtml;
    const embedded = splitEmbeddedCode(sourceHtml);
    const html = embedded.html;
    const separatedModuleCss = joinKind(moduleSources, 'css');
    const moduleCss = [separatedModuleCss, embedded.css].filter(Boolean).join('\n\n');
    const pageCss = joinKind(pageSources, 'css');
    const globalCss = joinKind(globalSources, 'css');
    const separatedJavascript = joinKind(moduleSources, 'js');
    const javascript = [separatedJavascript, embedded.javascript].filter(Boolean).join('\n\n');
    const frontend = parseObject(pageRow.frontend_json);

    const tokens = extractHtmlTokens(html);
    const relevantPage = extractRelevantCss(pageCss, tokens);
    const relevantGlobal = extractRelevantCss(globalCss, tokens);
    const rootClasses = pickRootClasses(tokens.classes);
    const moduleAssetIds = parseStringArray(nodeRow.asset_ids_json);
    const moduleDependencyIds = parseStringArray(nodeRow.dependency_ids_json);
    const suggestedCategory = suggestLibraryCategory(rootClasses, html);
    const suggestedName = suggestLibraryName(rootClasses, String(pageRow.title), suggestedCategory);
    const hasDependencies = Boolean(relevantPage.css || relevantGlobal.css || javascript || moduleAssetIds.length || moduleDependencyIds.length);
    const reuseStatus: 'ready' | 'dependencies' | 'review' = !html ? 'review' : hasDependencies ? 'dependencies' : 'ready';

    const instructions = html ? [
      'Copier le HTML dans un module Code Divi.',
      ...(moduleCss ? ['Ajouter le CSS propre du module.'] : []),
      ...(relevantPage.css ? ['Ajouter uniquement les règles utiles extraites du CSS de page.'] : []),
      ...(relevantGlobal.css ? ['Ajouter uniquement les règles globales réellement utilisées par ce composant.'] : []),
      ...(javascript ? ['Reprendre le JavaScript séparément après vérification.'] : []),
      ...(moduleAssetIds.length ? ['Reprendre les médias liés au module.'] : []),
    ] : ['La source Divi est conservée, mais le HTML n’est pas encore isolé automatiquement.'];

    const notes = [
      ...(pageCss && !relevantPage.css ? ['Le CSS de page existe mais aucune règle spécifique à ce composant n’a été détectée.'] : []),
      ...(globalCss && !relevantGlobal.css ? ['Le CSS global existe mais aucune règle spécifique à ce composant n’a été détectée.'] : []),
      ...(derivedHtml ? ['HTML extrait automatiquement depuis la source Divi originale.'] : []),
    ];

    return {
      pageSnapshotId,
      occurrenceId,
      moduleType: nullableString(nodeRow.module_type),
      label: nullableString(nodeRow.label),
      builderGeneration: nullableString(nodeRow.builder_generation),
      pageTitle: String(pageRow.title),
      pageUrl: nullableString(pageRow.canonical_url),
      html,
      moduleCss,
      pageCss,
      globalCss,
      javascript,
      diviSource,
      sourceCounts: {
        html: uniqueCount(moduleSources, 'html') || (html ? 1 : 0),
        moduleCss: uniqueCount(moduleSources, 'css') + (embedded.css ? 1 : 0),
        pageCss: uniqueCount(pageSources, 'css'),
        globalCss: uniqueCount(globalSources, 'css'),
        javascript: uniqueCount(moduleSources, 'js') + (embedded.javascript ? 1 : 0),
      },
      frontendValidated: frontend.checked === true,
      htmlDerivedFromDiviSource: Boolean(derivedHtml),
      reuse: {
        status: reuseStatus,
        suggestedName,
        suggestedCategory,
        rootClasses,
        relevantPageCss: relevantPage.css,
        relevantGlobalCss: relevantGlobal.css,
        relevantPageRuleCount: relevantPage.ruleCount,
        relevantGlobalRuleCount: relevantGlobal.ruleCount,
        pageCssRuleCount: countCssRules(pageCss),
        globalCssRuleCount: countCssRules(globalCss),
        moduleAssetCount: moduleAssetIds.length,
        moduleDependencyCount: moduleDependencyIds.length,
        instructions,
        notes,
      },
    };
  }

  getPagePreview(pageSnapshotId: string): BridgePagePreview {
    const detail = this.getPage(pageSnapshotId);
    const codeNodes = detail.nodes.filter((node) => node.nodeType === 'module' && isBridgeCodeModule(node.moduleType));
    const previews = codeNodes.map((node) => this.getModulePreview(pageSnapshotId, node.occurrenceId));
    const html = previews.map((preview, index) =>
      preview.html
        ? `<div data-bridge-page-module="${index + 1}">${preview.html}</div>`
        : `<div data-bridge-page-module-missing="${index + 1}" style="padding:16px;border:1px dashed #bbb;margin:8px">Module non reconstructible automatiquement</div>`,
    ).join('\n');
    const uniqueModuleCss = [...new Set(previews.map((preview) => preview.moduleCss).filter(Boolean))].join('\n\n');
    const pageCss = previews.find((preview) => preview.pageCss)?.pageCss ?? '';
    const globalCss = previews.find((preview) => preview.globalCss)?.globalCss ?? '';
    return {
      pageSnapshotId,
      title: detail.page.title,
      url: detail.page.canonicalUrl,
      builderGeneration: detail.page.builderGeneration,
      html,
      moduleCss: uniqueModuleCss,
      pageCss,
      globalCss,
      renderedModuleCount: previews.filter((preview) => Boolean(preview.html)).length,
      totalModuleCount: codeNodes.length,
      omittedModuleCount: Math.max(0, codeNodes.length - previews.filter((preview) => Boolean(preview.html)).length),
      frontendValidated: previews[0]?.frontendValidated ?? false,
    };
  }

  getObjectPreview(objectRefValue: string): BridgeObjectPreview {
    if (!objectRefValue.startsWith('sha256:') || objectRefValue.length !== 71) throw new Error('Référence objet Bridge invalide.');
    const row = this.database.get<Record<string, unknown>>('SELECT * FROM bridge_objects WHERE object_ref=?', [objectRefValue]);
    if (!row) throw new Error('Objet Bridge introuvable.');
    const absolute = this.bridgePath(String(row.relative_path));
    const contentType = nullableString(row.content_type);
    const serialization = nullableString(row.serialization);
    const encoding = nullableString(row.encoding);
    const byteLength = Number(row.byte_length ?? 0);
    if (!existsSync(absolute) || !statSync(absolute).isFile()) {
      return { objectRef: objectRefValue, contentType, serialization, encoding, byteLength, available: false, text: null, truncated: false };
    }
    const textLike = Boolean(contentType?.startsWith('text/') || contentType === 'application/json' || serialization === 'text' || serialization === 'json' || serialization === 'php_serialized');
    if (!textLike) return { objectRef: objectRefValue, contentType, serialization, encoding, byteLength, available: true, text: null, truncated: false };
    const bytes = readFileSync(absolute);
    const limit = 256 * 1024;
    return {
      objectRef: objectRefValue, contentType, serialization, encoding, byteLength, available: true,
      text: bytes.subarray(0, Math.min(bytes.length, limit)).toString('utf8'), truncated: bytes.length > limit,
    };
  }

  private snapshotDiffPageRows(snapshotId: string): SnapshotDiffPageRow[] {
    return this.database.all<SnapshotDiffPageRow>(
      `SELECT bp.id page_id,bps.id page_snapshot_id,bps.external_page_snapshot_id,bps.snapshot_id,bps.source_page_key,bp.source_post_id,
       bp.post_type,bps.status,bps.title,bps.slug,bps.canonical_url,bps.storage_format,bps.builder,bps.builder_generation,bps.is_divi_content,bps.scope,
       bps.audit_status,bps.raw_object_ref,bps.source_ids_json,bps.asset_ids_json,bps.dependency_ids_json,bps.metadata_json,bps.fingerprints_json,
       (SELECT COUNT(*) FROM bridge_nodes n WHERE n.page_snapshot_id=bps.id) node_count
       FROM bridge_page_snapshots bps JOIN bridge_pages bp ON bp.id=bps.page_id
       WHERE bps.snapshot_id=?`,
      [snapshotId],
    );
  }

  private stablePageFingerprintSignature(page: SnapshotDiffPageRow): string {
    const fingerprints = parseObject(page.fingerprints_json);
    return stableObjectString({
      rawSource: nullableString(fingerprints.raw_source) ?? page.raw_object_ref,
    });
  }

  private sourceDiffSignature(pageSnapshotId: string): string {
    const rows = this.database.all<Record<string, unknown>>(
      `SELECT kind,scope,origin,owner,owner_slug,managed_externally,fingerprint
       FROM bridge_sources
       WHERE page_snapshot_id=?`,
      [pageSnapshotId],
    );
    return rows.map((row) => stableObjectString({
      kind: String(row.kind ?? ''),
      scope: String(row.scope ?? ''),
      origin: String(row.origin ?? ''),
      owner: String(row.owner ?? ''),
      ownerSlug: nullableString(row.owner_slug),
      managedExternally: Number(row.managed_externally ?? 0) === 1,
      fingerprint: nullableString(row.fingerprint),
    })).sort().join('\n');
  }

  private nodeDiffSignature(pageSnapshotId: string): string {
    const rows = this.database.all<Record<string, unknown>>(
      `SELECT node_type,module_type,label,position,depth,fingerprints_json,classes_json,ids_json
       FROM bridge_nodes WHERE page_snapshot_id=?`,
      [pageSnapshotId],
    );
    return rows.map((row) => stableObjectString({
      nodeType: String(row.node_type ?? ''),
      moduleType: nullableString(row.module_type),
      label: nullableString(row.label),
      position: Number(row.position ?? 0),
      depth: Number(row.depth ?? 0),
      fingerprints: parseObject(row.fingerprints_json),
      classes: parseStringArray(row.classes_json).slice().sort(),
      ids: parseStringArray(row.ids_json).slice().sort(),
    })).sort().join('\n');
  }

  private allPageChanges(value: boolean) {
    return {
      title: value,
      status: value,
      url: value,
      builder: value,
      rawObject: value,
      fingerprints: value,
      nodes: value,
      sources: value,
      assets: value,
      dependencies: value,
    };
  }

  private pageDiffCounts(before: SnapshotDiffPageRow | null, after: SnapshotDiffPageRow | null) {
    return {
      nodesBefore: Number(before?.node_count ?? 0),
      nodesAfter: Number(after?.node_count ?? 0),
      sourcesBefore: before ? parseStringArray(before.source_ids_json).length : 0,
      sourcesAfter: after ? parseStringArray(after.source_ids_json).length : 0,
      assetsBefore: before ? parseStringArray(before.asset_ids_json).length : 0,
      assetsAfter: after ? parseStringArray(after.asset_ids_json).length : 0,
      dependenciesBefore: before ? parseStringArray(before.dependency_ids_json).length : 0,
      dependenciesAfter: after ? parseStringArray(after.dependency_ids_json).length : 0,
    };
  }

  private pageRows(snapshotId: string): PageRow[] {
    return this.database.all<PageRow>(
      `SELECT bp.id page_id,bps.id page_snapshot_id,bps.external_page_snapshot_id,bps.snapshot_id,bps.source_page_key,bp.source_post_id,
       bp.post_type,bps.status,bps.title,bps.slug,bps.canonical_url,bps.storage_format,bps.builder,bps.builder_generation,bps.is_divi_content,bps.scope,
       bps.audit_status,bps.raw_object_ref,bps.source_ids_json,bps.asset_ids_json,bps.dependency_ids_json,bps.metadata_json,
       (SELECT COUNT(*) FROM bridge_nodes n WHERE n.page_snapshot_id=bps.id) node_count
       FROM bridge_page_snapshots bps JOIN bridge_pages bp ON bp.id=bps.page_id
       WHERE bps.snapshot_id=? ORDER BY CASE WHEN bp.post_type='page' THEN 0 WHEN bp.post_type='post' THEN 1 ELSE 2 END,bps.title COLLATE NOCASE`,
      [snapshotId],
    );
  }

  private mapPage(row: PageRow): BridgePageSummary {
    return {
      pageId: row.page_id, pageSnapshotId: row.page_snapshot_id, externalPageSnapshotId: row.external_page_snapshot_id,
      snapshotId: row.snapshot_id, sourcePageKey: row.source_page_key, sourcePostId: row.source_post_id, postType: row.post_type,
      status: row.status, title: row.title, slug: row.slug, canonicalUrl: row.canonical_url, storageFormat: row.storage_format,
      builder: row.builder, builderGeneration: row.builder_generation, isDiviContent: Boolean(row.is_divi_content),
      scope: row.scope, auditStatus: row.audit_status, rawObjectRef: row.raw_object_ref,
      nodeCount: Number(row.node_count ?? 0), sourceCount: parseStringArray(row.source_ids_json).length,
      assetCount: parseStringArray(row.asset_ids_json).length, dependencyCount: parseStringArray(row.dependency_ids_json).length,
    };
  }

  private mapNode(node: Record<string, unknown>): BridgeNodeSummary {
    return {
      occurrenceId: String(node.occurrence_id), logicalNodeId: nullableString(node.logical_node_id),
      parentOccurrenceId: nullableString(node.parent_occurrence_id), position: Number(node.position ?? 0), ordinal: Number(node.ordinal ?? 0),
      depth: Number(node.depth ?? 0), nodeType: String(node.node_type), moduleType: nullableString(node.module_type),
      label: nullableString(node.label), builder: nullableString(node.builder), builderGeneration: nullableString(node.builder_generation),
      classes: parseStringArray(node.classes_json), ids: parseStringArray(node.ids_json), sourceIds: parseStringArray(node.source_ids_json),
      assetIds: parseStringArray(node.asset_ids_json), dependencyIds: parseStringArray(node.dependency_ids_json),
      relationIds: parseStringArray(node.relation_ids_json), rawObjectRef: nullableString(node.raw_object_ref),
      contentObjectRef: nullableString(node.content_object_ref), fingerprints: parseObject(node.fingerprints_json),
      matchingHints: parseObject(node.matching_hints_json),
    };
  }

  private loadSources(snapshotId: string, ids: string[]): BridgeSourceSummary[] {
    if (!ids.length) return [];
    const sql = ids.map(() => '?').join(',');
    return this.database.all<Record<string, unknown>>(
      `SELECT * FROM bridge_sources WHERE snapshot_id=? AND source_id IN (${sql}) ORDER BY kind,origin,source_id`,
      [snapshotId, ...ids],
    ).map((source) => ({
      sourceId: String(source.source_id), kind: String(source.kind), scope: String(source.scope), origin: String(source.origin),
      owner: String(source.owner), ownerSlug: nullableString(source.owner_slug), managedExternally: Boolean(source.managed_externally),
      nodeOccurrenceId: nullableString(source.node_occurrence_id), payloadObjectRef: nullableString(source.payload_object_ref),
      fingerprint: nullableString(source.fingerprint), lines: nullableNumber(source.lines), bytes: nullableNumber(source.bytes),
      evidence: parseObject(source.evidence_json),
    }));
  }

  private loadAssets(snapshotId: string, ids: string[]): BridgeAssetSummary[] {
    if (!ids.length) return [];
    const sql = ids.map(() => '?').join(',');
    return this.database.all<Record<string, unknown>>(
      `SELECT * FROM bridge_assets WHERE snapshot_id=? AND asset_id IN (${sql}) ORDER BY type,asset_id`,
      [snapshotId, ...ids],
    ).map((asset) => ({
      assetId: String(asset.asset_id), type: String(asset.type), wordpressAttachmentId: nullableNumber(asset.wordpress_attachment_id),
      url: nullableString(asset.url), localPath: nullableString(asset.local_path), mimeType: nullableString(asset.mime_type),
      width: nullableNumber(asset.width), height: nullableNumber(asset.height), sizeBytes: nullableNumber(asset.size_bytes),
      hash: nullableString(asset.hash), archiveMode: nullableString(asset.archive_mode),
    }));
  }

  private loadDependencies(snapshotId: string, ids: string[]): BridgeDependencySummary[] {
    if (!ids.length) return [];
    const sql = ids.map(() => '?').join(',');
    return this.database.all<Record<string, unknown>>(
      `SELECT * FROM bridge_dependencies WHERE snapshot_id=? AND dependency_id IN (${sql}) ORDER BY type,name COLLATE NOCASE`,
      [snapshotId, ...ids],
    ).map((dep) => ({
      dependencyId: String(dep.dependency_id), type: String(dep.type), slug: nullableString(dep.slug), name: String(dep.name),
      version: nullableString(dep.version), active: dep.active == null ? null : Boolean(dep.active),
    }));
  }

  private persistObjects(loaded: ReturnType<typeof loadBridgeSnapshotPackage>): void {
    for (const object of loaded.objects) {
      const ref = requiredString(object.ref, 'object ref');
      const source = loaded.rootEntries.get(requiredString(object.path, 'object path'));
      if (!source) throw new Error(`Objet Bridge absent : ${ref}`);
      const hex = ref.slice(7).toLowerCase();
      const destination = this.bridgePath(join('objects', 'sha256', hex.slice(0, 2), hex));
      mkdirSync(resolve(destination, '..'), { recursive: true });
      if (existsSync(destination)) {
        if (createHash('sha256').update(readFileSync(destination)).digest('hex') !== hex) throw new Error(`Objet Bridge local corrompu : ${ref}`);
      } else {
        writeFileSync(destination, source.data);
      }
    }
  }

  private persistPackage(source: string, relativePath: string): void {
    const destination = this.bridgePath(relativePath);
    mkdirSync(resolve(destination, '..'), { recursive: true });
    copyFileSync(source, destination);
  }

  private getSiteSummary(id: string): BridgeSiteSummary {
    const row = this.database.get<Record<string, unknown>>(
      `SELECT s.*,
       (SELECT COUNT(*) FROM bridge_snapshots x WHERE x.site_id=s.id) snapshot_count,
       (SELECT x.page_count FROM bridge_snapshots x WHERE x.site_id=s.id ORDER BY x.generated_at DESC LIMIT 1) latest_page_count,
       (SELECT x.scan_status FROM bridge_snapshots x WHERE x.site_id=s.id ORDER BY x.generated_at DESC LIMIT 1) latest_scan_status
       FROM bridge_sites s WHERE s.id=?`, [id],
    );
    if (!row) throw new Error('Site Bridge introuvable.');
    return this.mapSite(row);
  }

  private mapSite(row: Record<string, unknown>): BridgeSiteSummary {
    return {
      id: String(row.id), name: String(row.name), canonicalUrl: nullableString(row.canonical_url),
      wordpressSiteUrl: nullableString(row.wordpress_site_url), environment: nullableString(row.environment),
      sourceInstanceId: String(row.source_instance_id), sourceSiteKey: String(row.source_site_key), createdAt: String(row.created_at),
      updatedAt: String(row.updated_at), lastSnapshotAt: nullableString(row.last_snapshot_at), snapshotCount: Number(row.snapshot_count ?? 0),
      latestPageCount: Number(row.latest_page_count ?? 0), latestScanStatus: nullableString(row.latest_scan_status),
    };
  }

  private listSnapshots(siteId: string): BridgeSnapshotSummary[] {
    return this.database.all<Record<string, unknown>>(
      'SELECT * FROM bridge_snapshots WHERE site_id=? ORDER BY generated_at DESC', [siteId],
    ).map((row) => this.mapSnapshot(row));
  }

  private getSnapshot(id: string): BridgeSnapshotSummary {
    const row = this.database.get<Record<string, unknown>>('SELECT * FROM bridge_snapshots WHERE id=?', [id]);
    if (!row) throw new Error('Snapshot Bridge introuvable.');
    return this.mapSnapshot(row);
  }

  private mapSnapshot(row: Record<string, unknown>): BridgeSnapshotSummary {
    return {
      id: String(row.id), siteId: String(row.site_id), externalSnapshotId: String(row.external_snapshot_id),
      packageFingerprint: String(row.package_fingerprint), generatedAt: String(row.generated_at), importedAt: String(row.imported_at),
      snapshotType: String(row.snapshot_type), scanStatus: String(row.scan_status), bridgeVersion: String(row.bridge_version),
      schemaVersion: String(row.schema_version), fingerprintProfile: String(row.fingerprint_profile),
      counts: {
        pages: Number(row.page_count ?? 0), nodes: Number(row.node_count ?? 0), sources: Number(row.source_count ?? 0),
        assets: Number(row.asset_count ?? 0), dependencies: Number(row.dependency_count ?? 0), relations: Number(row.relation_count ?? 0),
        objects: Number(row.object_count ?? 0),
      },
      issues: parseIssues(row.issues_json), coverage: parseObject(row.coverage_json),
      scannerCapabilities: parseObject(row.scanner_capabilities_json), observedContent: parseObject(row.observed_content_json),
      security: parseObject(row.security_json), packageRelativePath: nullableString(row.package_relative_path),
    };
  }

  private bridgePath(relativePath: string): string {
    const root = resolve(this.workspace.bridgeDirectory);
    const candidate = resolve(root, relativePath);
    if (candidate !== root && !candidate.startsWith(`${root}${sep}`)) throw new Error('Chemin Bridge hors workspace interdit.');
    return candidate;
  }

  private safeSegment(value: string): string {
    const printable = [...value].map((char) => char.charCodeAt(0) < 32 ? '-' : char).join('');
    return printable.replace(/[<>:"/\\|?*]/g, '-').replace(/[. ]+$/g, '').trim().slice(0, 150) || 'snapshot';
  }
}

interface HtmlTokens {
  classes: string[];
  ids: string[];
}

function isBridgeCodeModule(moduleType: string | null): boolean {
  return Boolean(moduleType && /(^|[\/_-])code($|[\/_-])/i.test(moduleType));
}

function extractHtmlFromDiviSource(source: string | null): string {
  if (!source) return '';

  const divi5Marker = source.indexOf('<!-- wp:divi/code');
  if (divi5Marker >= 0) {
    const jsonStart = source.indexOf('{', divi5Marker);
    const commentEnd = jsonStart >= 0 ? source.indexOf('-->', jsonStart) : -1;
    if (jsonStart >= 0 && commentEnd > jsonStart) {
      try {
        const rawJson = source.slice(jsonStart, commentEnd).trim().replace(/\/\s*$/, '').trim();
        const parsed = JSON.parse(rawJson) as Record<string, unknown>;
        const candidate = findHtmlValue(parsed);
        if (candidate) return candidate.trim();
      } catch {
        // La source brute reste disponible ; on bascule sur les autres formats ci-dessous.
      }
    }
  }

  const divi4 = source.match(/\[et_pb_code[^\]]*\]([\s\S]*?)\[\/et_pb_code\]/i);
  if (divi4?.[1]) {
    return divi4[1]
      .replace(/<!--\s*\[et_pb_line_break_holder\]\s*-->/gi, '\n')
      .replace(/\[et_pb_line_break_holder\]/gi, '\n')
      .trim();
  }

  return '';
}

function findHtmlValue(value: unknown): string {
  if (typeof value === 'string') return /<\/?[a-z][\s\S]*>/i.test(value) ? value : '';
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findHtmlValue(item);
      if (found) return found;
    }
    return '';
  }
  if (!value || typeof value !== 'object') return '';
  const record = value as Record<string, unknown>;
  const preferredPaths = [
    record.innerContent,
    record.content,
    record.module,
    record.desktop,
    record.value,
  ];
  for (const candidate of preferredPaths) {
    const found = findHtmlValue(candidate);
    if (found) return found;
  }
  for (const candidate of Object.values(record)) {
    const found = findHtmlValue(candidate);
    if (found) return found;
  }
  return '';
}

function splitEmbeddedCode(html: string): { html: string; css: string; javascript: string } {
  if (!html) return { html: '', css: '', javascript: '' };
  const css: string[] = [];
  const javascript: string[] = [];
  let clean = html.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (_match, body: string) => {
    if (body.trim()) css.push(body.trim());
    return '';
  });
  clean = clean.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, (_match, body: string) => {
    if (body.trim()) javascript.push(body.trim());
    return '';
  });
  return { html: clean.trim(), css: css.join('\n\n'), javascript: javascript.join('\n\n') };
}

function extractHtmlTokens(html: string): HtmlTokens {
  const classes = new Set<string>();
  const ids = new Set<string>();
  const classPattern = /\bclass\s*=\s*["']([^"']+)["']/gi;
  const idPattern = /\bid\s*=\s*["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = classPattern.exec(html))) {
    match[1].split(/\s+/).filter(Boolean).forEach((name) => classes.add(name));
  }
  while ((match = idPattern.exec(html))) {
    if (match[1].trim()) ids.add(match[1].trim());
  }
  return { classes: [...classes], ids: [...ids] };
}

function pickRootClasses(classes: string[]): string[] {
  const atoumRoots = classes.filter((name) => /^atoum[-_]/i.test(name) && !name.includes('__') && !name.includes('--'));
  const roots = atoumRoots.length ? atoumRoots : classes.filter((name) => !name.includes('__') && !name.includes('--'));
  return [...new Set(roots)].slice(0, 8);
}

function suggestLibraryCategory(rootClasses: string[], html: string): 'header' | 'footer' | 'hero' | 'section' | 'form' | 'gallery' | 'carousel' | 'navigation' | 'divi' {
  const roots = rootClasses.join(' ').toLowerCase();
  const markup = html.slice(0, 6000).toLowerCase();

  // La nature du composant vient d'abord de sa racine. Un mot "header" présent
  // dans une carte/article interne ne transforme pas toute la section en Header de site.
  if (/\b(hero|banner-hero|main-hero)\b/.test(roots)) return 'hero';
  if (/\b(blog|articles?|posts?|news|actualit[eé]s?)\b/.test(roots)) return 'section';
  if (/\b(gallery|galerie)\b/.test(roots)) return 'gallery';
  if (/\b(carousel|slider)\b/.test(roots)) return 'carousel';
  if (/\b(form|formulaire|contact-form)\b/.test(roots)) return 'form';
  if (/\b(nav|navigation|menu)\b/.test(roots)) return 'navigation';
  if (/\b(site-header|global-header|main-header|header-global)\b/.test(roots) || /^\s*<header\b/.test(markup)) return 'header';
  if (/\b(site-footer|global-footer|main-footer|footer-global)\b/.test(roots) || /^\s*<footer\b/.test(markup)) return 'footer';

  if (/^\s*<form\b/.test(markup)) return 'form';
  if (/^\s*<nav\b/.test(markup)) return 'navigation';
  return html ? 'section' : 'divi';
}

function suggestLibraryName(rootClasses: string[], pageTitle: string, category: string): string {
  const categoryLabel: Record<string, string> = {
    hero: 'Hero',
    header: 'Header',
    footer: 'Footer',
    form: 'Formulaire',
    gallery: 'Galerie',
    carousel: 'Carrousel',
    navigation: 'Navigation',
    section: 'Section',
    divi: 'Élément Divi',
  };
  const root = rootClasses[0];
  if (root) {
    const cleaned = root.replace(/^atoum[-_]?/i, '').replace(/[-_]+/g, ' ').trim();
    if (cleaned && !['hero', 'section', 'module', 'code'].includes(cleaned.toLowerCase())) {
      return `${categoryLabel[category] ?? 'Composant'} — ${cleaned.replace(/\b\w/g, (letter) => letter.toUpperCase())}`;
    }
  }
  return `${categoryLabel[category] ?? 'Composant'} — ${pageTitle}`;
}

function extractRelevantCss(css: string, tokens: HtmlTokens): { css: string; ruleCount: number } {
  if (!css.trim()) return { css: '', ruleCount: 0 };
  const selectors = [
    ...tokens.classes.map((name) => `.${name}`),
    ...tokens.ids.map((name) => `#${name}`),
  ];
  if (!selectors.length) return { css: '', ruleCount: 0 };
  return filterCssRange(css, selectors);
}

function filterCssRange(css: string, selectors: string[]): { css: string; ruleCount: number } {
  let cursor = 0;
  const kept: string[] = [];
  let ruleCount = 0;

  while (cursor < css.length) {
    while (cursor < css.length && /\s/.test(css[cursor])) cursor += 1;
    if (cursor >= css.length) break;

    if (css.startsWith('/*', cursor)) {
      const commentEnd = css.indexOf('*/', cursor + 2);
      cursor = commentEnd >= 0 ? commentEnd + 2 : css.length;
      continue;
    }

    const open = css.indexOf('{', cursor);
    if (open < 0) break;
    const header = css.slice(cursor, open).trim();
    const close = findMatchingBrace(css, open);
    if (close < 0) break;
    const body = css.slice(open + 1, close);

    if (header.startsWith('@')) {
      if (/^@(media|supports|container|layer)\b/i.test(header)) {
        const nested = filterCssRange(body, selectors);
        if (nested.css.trim()) {
          kept.push(`${header} {\n${nested.css}\n}`);
          ruleCount += nested.ruleCount;
        }
      }
    } else if (selectors.some((selector) => header.includes(selector))) {
      kept.push(`${header} {\n${body.trim()}\n}`);
      ruleCount += 1;
    }

    cursor = close + 1;
  }

  return { css: kept.join('\n\n'), ruleCount };
}

function findMatchingBrace(css: string, openIndex: number): number {
  let depth = 0;
  let quote: string | null = null;
  let inComment = false;
  for (let index = openIndex; index < css.length; index += 1) {
    const char = css[index];
    const next = css[index + 1];
    if (inComment) {
      if (char === '*' && next === '/') {
        inComment = false;
        index += 1;
      }
      continue;
    }
    if (!quote && char === '/' && next === '*') {
      inComment = true;
      index += 1;
      continue;
    }
    if (quote) {
      if (char === '\\') {
        index += 1;
        continue;
      }
      if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function countCssRules(css: string): number {
  if (!css.trim()) return 0;
  let count = 0;
  let cursor = 0;
  while (cursor < css.length) {
    const open = css.indexOf('{', cursor);
    if (open < 0) break;
    const headerStart = Math.max(css.lastIndexOf('}', open - 1), css.lastIndexOf(';', open - 1)) + 1;
    const header = css.slice(headerStart, open).trim();
    if (header && !header.startsWith('@')) count += 1;
    cursor = open + 1;
  }
  return count;
}

function parseObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value !== 'string') return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch { return {}; }
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch { return []; }
}

function parseIssues(value: unknown): BridgeSnapshotIssue[] {
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => ({
      code: String(item.code ?? ''), severity: String(item.severity ?? ''), scope: String(item.scope ?? ''),
      entityRef: nullableString(item.entityRef ?? item.entity_ref), message: String(item.message ?? ''),
    }));
  } catch { return []; }
}
