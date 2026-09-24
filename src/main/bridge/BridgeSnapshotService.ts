import { createHash, randomUUID } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import type {
  BridgeAssetSummary,
  BridgeDependencySummary,
  BridgeNodeSummary,
  BridgeObjectPreview,
  BridgeModulePreview,
  BridgePageSnapshotDetail,
  BridgePageSummary,
  BridgeSiteDetail,
  BridgeSiteSummary,
  BridgeSnapshotImportResult,
  BridgeSnapshotIssue,
  BridgeSnapshotSummary,
  BridgeSourceSummary,
} from '../../shared/bridgeSnapshots';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
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
      `SELECT occurrence_id,module_type,label,builder_generation,content_object_ref,raw_object_ref
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
    const joinKind = (rows: Record<string, unknown>[], kind: string): string =>
      rows.filter((row) => String(row.kind) === kind).map(textFrom).filter(Boolean).join('\n\n');

    const moduleHtml = joinKind(moduleSources, 'html');
    const fallbackHtmlRef = nullableString(nodeRow.content_object_ref);
    const rawRef = nullableString(nodeRow.raw_object_ref);
    const frontend = parseObject(pageRow.frontend_json);

    return {
      pageSnapshotId,
      occurrenceId,
      moduleType: nullableString(nodeRow.module_type),
      label: nullableString(nodeRow.label),
      builderGeneration: nullableString(nodeRow.builder_generation),
      pageTitle: String(pageRow.title),
      pageUrl: nullableString(pageRow.canonical_url),
      html: moduleHtml || (fallbackHtmlRef ? this.getObjectPreview(fallbackHtmlRef).text ?? '' : ''),
      moduleCss: joinKind(moduleSources, 'css'),
      pageCss: joinKind(pageSources, 'css'),
      globalCss: joinKind(globalSources, 'css'),
      javascript: joinKind(moduleSources, 'js'),
      diviSource: rawRef ? this.getObjectPreview(rawRef).text ?? null : null,
      sourceCounts: {
        html: moduleSources.filter((row) => String(row.kind) === 'html').length,
        moduleCss: moduleSources.filter((row) => String(row.kind) === 'css').length,
        pageCss: pageSources.filter((row) => String(row.kind) === 'css').length,
        globalCss: globalSources.filter((row) => String(row.kind) === 'css').length,
        javascript: moduleSources.filter((row) => String(row.kind) === 'js').length,
      },
      frontendValidated: frontend.checked === true,
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
