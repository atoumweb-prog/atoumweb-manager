import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { writeZipArchive, type ZipEntryInput } from '../referentials/ZipArchive';
import { createWorkspacePaths, ensureWorkspace, type WorkspacePaths } from '../workspace';
import { calculateBridgePackageFingerprint } from './BridgeSnapshotPackage';
import { BridgeSnapshotService } from './BridgeSnapshotService';

let database: NodeSqliteAdapter;
let workspaceRoot: string;
let workspace: WorkspacePaths;
let service: BridgeSnapshotService;

beforeEach(() => {
  workspaceRoot = mkdtempSync(join(tmpdir(), 'atoumweb-bridge-manager-'));
  workspace = ensureWorkspace(workspaceRoot);
  database = new NodeSqliteAdapter(':memory:');
  database.exec('PRAGMA foreign_keys = ON;');
  applyPendingMigrations(database);
  service = new BridgeSnapshotService(database, workspace);
});

afterEach(() => {
  database.close();
  rmSync(workspaceRoot, { recursive: true, force: true });
});

describe('BridgeSnapshotService', () => {
  it('valide, importe et relit un Snapshot V1 sans dupliquer un réimport identique', () => {
    const packagePath = buildSnapshot(join(workspaceRoot, 'snapshot-v1.zip'), 'Accueil');

    const inspection = service.inspectPackage(packagePath);
    expect(inspection.contract).toBe('atoumweb-bridge-snapshot');
    expect(inspection.schemaVersion).toBe('1.0.0');
    expect(inspection.counts.pages).toBe(1);
    expect(inspection.counts.nodes).toBe(1);
    expect(inspection.checksumsVerified).toBe(true);

    const imported = service.importPackage(packagePath);
    expect(imported.alreadyImported).toBe(false);
    expect(imported.site.snapshotCount).toBe(1);
    expect(imported.snapshot.counts.pages).toBe(1);

    const sites = service.listSites();
    expect(sites).toHaveLength(1);
    const site = service.getSite(sites[0].id);
    expect(site.snapshots).toHaveLength(1);

    const pages = service.listPages(site.snapshots[0].id);
    expect(pages).toHaveLength(1);
    expect(pages[0].title).toBe('Accueil');

    const detail = service.getPage(pages[0].pageSnapshotId);
    expect(detail.nodes).toHaveLength(1);
    expect(detail.nodes[0].moduleType).toBe('divi/code');

    const preview = service.getObjectPreview(detail.nodes[0].rawObjectRef!);
    expect(preview.available).toBe(true);
    expect(preview.text).toContain('wp:divi/code');

    const modulePreview = service.getModulePreview(detail.page.pageSnapshotId, detail.nodes[0].occurrenceId);
    expect(modulePreview.html).toContain('Bonjour Bridge');
    expect(modulePreview.htmlDerivedFromDiviSource).toBe(true);
    expect(modulePreview.html).not.toContain('<style>');
    expect(modulePreview.moduleCss).toContain('.atoum-home-blog-v2');
    expect(modulePreview.pageCss).toBe('');
    expect(modulePreview.globalCss).toBe('');
    expect(modulePreview.javascript).toBe('');
    expect(modulePreview.frontendValidated).toBe(false);
    expect(modulePreview.reuse.status).toBe('ready');
    expect(modulePreview.reuse.suggestedCategory).toBe('section');
    expect(modulePreview.reuse.suggestedName).toBe('Section — Home Blog V2');

    const pagePreview = service.getPagePreview(detail.page.pageSnapshotId);
    expect(pagePreview.renderedModuleCount).toBe(1);
    expect(pagePreview.totalModuleCount).toBe(1);
    expect(pagePreview.html).toContain('Bonjour Bridge');

    const diagnostic = service.buildDiagnostic(site.snapshots[0].id);
    expect(diagnostic.actualCounts).toEqual(expect.objectContaining({
      contents: 1,
      nodes: 1,
      sources: 0,
      assets: 0,
      dependencies: 0,
      relations: 0,
    }));
    expect(diagnostic.countChecks).toEqual(expect.objectContaining({
      contents: true,
      nodes: true,
      sources: true,
      assets: true,
      dependencies: true,
      relations: true,
    }));
    expect(diagnostic.contentBreakdown).toEqual(expect.objectContaining({
      total: 1,
      categories: { pages: 1, posts: 0, diviLibrary: 0, themeBuilder: 0, other: 0 },
    }));

    const again = service.importPackage(packagePath);
    expect(again.alreadyImported).toBe(true);
    expect(service.getSite(sites[0].id).snapshots).toHaveLength(1);
  });

  it('refuse le même snapshot_id si le package a changé', () => {
    const first = buildSnapshot(join(workspaceRoot, 'snapshot-a.zip'), 'Accueil');
    const second = buildSnapshot(join(workspaceRoot, 'snapshot-b.zip'), 'Accueil modifié');
    service.importPackage(first);
    expect(() => service.importPackage(second)).toThrow(/package différent/i);
  });

  it('compare deux snapshots du même site sans modifier leur contenu', () => {
    const firstPath = buildSnapshot(join(workspaceRoot, 'snapshot-diff-a.zip'), 'Accueil', {
      snapshotId: 'awb-snap:20260924T000000Z:diff-a',
      pageSnapshotId: 'awb-pagesnap:diff-a',
      generatedAt: '2026-09-24T00:00:00Z',
      heading: 'Bonjour Bridge',
    });
    const secondPath = buildSnapshot(join(workspaceRoot, 'snapshot-diff-b.zip'), 'Accueil refondue', {
      snapshotId: 'awb-snap:20260925T000000Z:diff-b',
      pageSnapshotId: 'awb-pagesnap:diff-b',
      generatedAt: '2026-09-25T00:00:00Z',
      heading: 'Bonjour Bridge V2',
    });

    const first = service.importPackage(firstPath).snapshot;
    const second = service.importPackage(secondPath).snapshot;
    const diff = service.compareSnapshots(first.id, second.id);

    expect(diff.siteId).toBe(first.siteId);
    expect(diff.before.id).toBe(first.id);
    expect(diff.after.id).toBe(second.id);
    expect(diff.summary).toEqual({ added: 0, removed: 0, changed: 1, unchanged: 0 });
    expect(diff.pages).toHaveLength(1);
    expect(diff.pages[0]).toMatchObject({
      sourcePageKey: 'wp-post:10',
      status: 'changed',
      titleBefore: 'Accueil',
      titleAfter: 'Accueil refondue',
    });
    expect(diff.pages[0].changes.title).toBe(true);
    expect(diff.pages[0].changes.rawObject).toBe(true);
    expect(diff.pages[0].changes.nodes).toBe(true);

    expect(service.listPages(first.id)[0].title).toBe('Accueil');
    expect(service.listPages(second.id)[0].title).toBe('Accueil refondue');
  });

  it('refuse de comparer un snapshot avec lui-même', () => {
    const imported = service.importPackage(buildSnapshot(join(workspaceRoot, 'snapshot-same.zip'), 'Accueil')).snapshot;
    expect(() => service.compareSnapshots(imported.id, imported.id)).toThrow(/deux snapshots différents/i);
  });
});

function buildSnapshot(
  destination: string,
  title: string,
  options: {
    snapshotId?: string;
    pageSnapshotId?: string;
    generatedAt?: string;
    heading?: string;
  } = {},
): string {
  const sourceInstanceId = 'awb-site:test-instance';
  const sourceSiteKey = 'wp:https://example.test/:blog:1';
  const snapshotId = options.snapshotId ?? 'awb-snap:20260924T000000Z:test';
  const pageSnapshotId = options.pageSnapshotId ?? 'awb-pagesnap:test';
  const generatedAt = options.generatedAt ?? '2026-09-24T00:00:00Z';
  const heading = options.heading ?? 'Bonjour Bridge';
  const raw = Buffer.from(`<!-- wp:divi/code {"module":{"content":{"innerContent":{"desktop":{"value":"<section class=\\\"atoum-home-blog-v2\\\"><div class=\\\"article-card\\\"><header class=\\\"article-card__header\\\">Blog</header><h1>${heading}</h1></div></section><style>.atoum-home-blog-v2{color:red}</style>"}}}}} /-->`, 'utf8');
  const rawHash = sha256(raw);
  const objectRef = `sha256:${rawHash}`;
  const objectPath = `objects/sha256/${rawHash.slice(0, 2)}/${rawHash}`;

  const manifest = {
    contract: 'atoumweb-bridge-snapshot',
    schema_version: '1.0.0',
    bridge_version: '0.4.2',
    fingerprint_profile: 'awb-json-c14n-v1',
    generated_at: generatedAt,
    site_id: null,
    source_instance_id: sourceInstanceId,
    source_site_key: sourceSiteKey,
    snapshot_id: snapshotId,
    snapshot_type: 'full',
    scanner_capabilities: { wordpress: true, divi4: true, divi5: false },
    observed_content: { wordpress: true, divi4: false, divi5: true },
    coverage: { pages: { mode: 'complete', post_types: ['page'], statuses: ['publish'], excluded: [] } },
    scan_status: 'complete_with_warnings',
    issues: [{ code: 'FRONTEND_AUDIT_NOT_ATTACHED', severity: 'warning', scope: 'site', entity_ref: sourceSiteKey, message: 'Front non joint.' }],
    counts: { pages: 1, nodes: 1, sources: 0, assets: 0, dependencies: 0, relations: 0, objects: 1 },
    security: { potential_sensitive_payloads: true, redaction_applied: true, redaction_rules_version: '1', payloads_modified: false },
    package: { format: 'zip', root: 'snapshot/', checksums_file: 'checksums.json' },
  };
  const site = {
    site_id: null,
    source_instance_id: sourceInstanceId,
    source_site_key: sourceSiteKey,
    canonical_url: 'https://example.test/',
    wordpress_site_url: 'https://example.test/',
    wordpress_home_url: 'https://example.test/',
    name: 'Site test',
    environment: 'test',
    source: { wordpress_blog_id: 1, multisite: false },
    timezone: { name: 'Europe/Paris', utc_offset_at_scan: '+02:00' },
  };
  const snapshot = {
    snapshot_id: snapshotId,
    site_id: null,
    source_instance_id: sourceInstanceId,
    source_site_key: sourceSiteKey,
    snapshot_type: 'full',
    generated_at: generatedAt,
    bridge: { version: '0.4.2', schema_version: '1.0.0', fingerprint_profile: 'awb-json-c14n-v1' },
    environment: { wordpress_version: '7.1.2', php_version: '8.1.34', theme: 'Divi', theme_version: '5.13.1', child_theme: null },
    fingerprints: {},
  };
  const page = {
    page_id: null,
    source_post_id: 10,
    source_page_key: 'wp-post:10',
    page_snapshot_id: pageSnapshotId,
    source_instance_id: sourceInstanceId,
    source_site_key: sourceSiteKey,
    snapshot_id: snapshotId,
    post_type: 'page',
    status: 'publish',
    title,
    slug: 'accueil',
    canonical_url: 'https://example.test/',
    wordpress_guid: null,
    storage_format: 'divi5_serialized_blocks',
    builder: 'divi',
    builder_generation: '5',
    is_divi_content: true,
    scope: 'content',
    audit_status: 'ready',
    raw_source: { object_ref: objectRef, redacted: false },
    tree_ref: 'pages/10/tree.json',
    source_ids: [],
    asset_ids: [],
    dependency_ids: [],
    relation_ids: [],
    fingerprints: {},
    frontend: { checked: false, http_status: null },
  };
  const tree = {
    page_snapshot_id: pageSnapshotId,
    builder: 'divi',
    builder_generation: '5',
    root_nodes: ['node_text_1'],
    nodes: [{
      occurrence_id: 'node_text_1',
      page_snapshot_id: pageSnapshotId,
      parent_occurrence_id: null,
      position: 0,
      node_type: 'module',
      builder: 'divi',
      builder_generation: '5',
      module_type: 'divi/code',
      label: 'Code',
      classes: [],
      ids: [],
      source_ids: [],
      asset_ids: [],
      dependency_ids: [],
      relation_ids: [],
      raw_source: { object_ref: objectRef },
      content: null,
      fingerprints: { node: objectRef },
      matching_hints: {},
      attributes: {},
      responsive: {},
      design: {},
    }],
    matching_hints: [],
  };
  const meta = { source_post_id: 10, post: { post_type: 'page', post_status: 'publish' }, meta: [] };

  const relativeEntries = new Map<string, Buffer>();
  const addJson = (name: string, value: unknown) => relativeEntries.set(name, Buffer.from(`${JSON.stringify(value, null, 2)}\n`, 'utf8'));
  addJson('manifest.json', manifest);
  addJson('site.json', site);
  addJson('snapshot.json', snapshot);
  addJson('registries/objects.json', { objects: [{ ref: objectRef, path: objectPath, content_type: 'text/plain', encoding: 'utf-8', byte_length: raw.length, serialization: 'text', compression: 'none' }] });
  addJson('registries/sources.json', { sources: [] });
  addJson('registries/assets.json', { assets: [] });
  addJson('registries/dependencies.json', { dependencies: [] });
  addJson('registries/relations.json', { relations: [] });
  addJson('pages/10/page.json', page);
  addJson('pages/10/meta.json', meta);
  addJson('pages/10/tree.json', tree);
  relativeEntries.set(objectPath, raw);

  const files: Record<string, string> = {};
  for (const [name, data] of relativeEntries) files[name] = `sha256:${sha256(data)}`;
  const checksums = {
    algorithm: 'sha256',
    fingerprint_profile: 'awb-json-c14n-v1',
    files,
    package_fingerprint: calculateBridgePackageFingerprint(files),
  };
  addJson('checksums.json', checksums);

  const entries: ZipEntryInput[] = [...relativeEntries.entries()].map(([name, data]) => ({ name: `snapshot/${name}`, data }));
  writeZipArchive(destination, entries);
  return destination;
}

function sha256(data: Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}
