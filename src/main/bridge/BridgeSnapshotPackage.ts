import { createHash } from 'node:crypto';
import { existsSync, statSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import type { BridgeSnapshotCounts, BridgeSnapshotInspection, BridgeSnapshotIssue } from '../../shared/bridgeSnapshots';
import { readZipArchive, type ZipEntryOutput } from '../referentials/ZipArchive';

export type BridgeJson = Record<string, any>;

export interface BridgeLoadedPage {
  page: BridgeJson;
  meta: BridgeJson;
  tree: BridgeJson;
  nodes: BridgeJson[];
}

export interface BridgeLoadedPackage {
  path: string;
  entries: Map<string, ZipEntryOutput>;
  rootEntries: Map<string, ZipEntryOutput>;
  manifest: BridgeJson;
  site: BridgeJson;
  snapshot: BridgeJson;
  objects: BridgeJson[];
  sources: BridgeJson[];
  assets: BridgeJson[];
  dependencies: BridgeJson[];
  relations: BridgeJson[];
  pages: BridgeLoadedPage[];
  packageFingerprint: string;
  inspection: BridgeSnapshotInspection;
}

export function loadBridgeSnapshotPackage(path: string): BridgeLoadedPackage {
  const absolute = resolve(path);
  if (!existsSync(absolute) || !statSync(absolute).isFile()) throw new Error('Snapshot Bridge introuvable.');
  if (extname(absolute).toLowerCase() !== '.zip') throw new Error('Le Snapshot Bridge doit être un fichier ZIP.');
  if (statSync(absolute).size > 220 * 1024 * 1024) throw new Error('Le Snapshot Bridge dépasse la taille ZIP autorisée.');

  const rawEntries = readZipArchive(absolute);
  if (!rawEntries.length) throw new Error('Snapshot Bridge vide.');
  const entries = new Map(rawEntries.map((entry) => [entry.name, entry]));
  const rootEntries = new Map<string, ZipEntryOutput>();
  for (const entry of rawEntries) {
    if (!entry.name.startsWith('snapshot/')) throw new Error(`Entrée hors racine snapshot/ interdite : ${entry.name}`);
    const relative = entry.name.slice('snapshot/'.length);
    if (!relative) continue;
    if (rootEntries.has(relative)) throw new Error(`Entrée Snapshot dupliquée : ${relative}`);
    rootEntries.set(relative, entry);
  }

  const manifest = parseJson(rootEntries, 'manifest.json', 2 * 1024 * 1024);
  const site = parseJson(rootEntries, 'site.json', 2 * 1024 * 1024);
  const snapshot = parseJson(rootEntries, 'snapshot.json', 2 * 1024 * 1024);
  const checksums = parseJson(rootEntries, 'checksums.json', 8 * 1024 * 1024);
  const objectRegistry = parseJson(rootEntries, 'registries/objects.json', 10 * 1024 * 1024);
  const sourceRegistry = parseJson(rootEntries, 'registries/sources.json', 12 * 1024 * 1024);
  const assetRegistry = parseJson(rootEntries, 'registries/assets.json', 10 * 1024 * 1024);
  const dependencyRegistry = parseJson(rootEntries, 'registries/dependencies.json', 10 * 1024 * 1024);
  const relationRegistry = parseJson(rootEntries, 'registries/relations.json', 20 * 1024 * 1024);

  assertContract(manifest, site, snapshot);
  const checksumFiles = asRecord(checksums.files);
  verifyChecksums(rootEntries, checksumFiles);
  const packageFingerprint = calculateBridgePackageFingerprint(checksumFiles);
  if (checksums.package_fingerprint !== packageFingerprint) throw new Error('package_fingerprint Bridge invalide.');

  const objects = arrayOfRecords(objectRegistry.objects);
  const sources = arrayOfRecords(sourceRegistry.sources);
  const assets = arrayOfRecords(assetRegistry.assets);
  const dependencies = arrayOfRecords(dependencyRegistry.dependencies);
  const relations = arrayOfRecords(relationRegistry.relations);

  const objectRefs = verifyObjects(rootEntries, objects);
  const sourceIds = uniqueIds(sources, 'source_id', 'Source');
  const assetIds = uniqueIds(assets, 'asset_id', 'Asset');
  const dependencyIds = uniqueIds(dependencies, 'dependency_id', 'Dependency');
  const relationIds = uniqueIds(relations, 'relation_id', 'Relation');

  const snapshotId = requiredString(manifest.snapshot_id, 'snapshot_id');
  const pagePaths = [...rootEntries.keys()].filter((name) => /^pages\/[^/]+\/page\.json$/.test(name));
  const pages: BridgeLoadedPage[] = [];
  const pageSnapshotIds = new Set<string>();
  const sourcePageKeys = new Set<string>();
  const allNodeIds = new Set<string>();

  for (const pagePath of pagePaths) {
    const directory = pagePath.slice(0, -'/page.json'.length);
    const page = parseJson(rootEntries, pagePath, 5 * 1024 * 1024);
    const tree = parseJson(rootEntries, `${directory}/tree.json`, 20 * 1024 * 1024);
    const meta = parseJson(rootEntries, `${directory}/meta.json`, 10 * 1024 * 1024);
    const sourcePageKey = requiredString(page.source_page_key, 'source_page_key');
    const pageSnapshotId = requiredString(page.page_snapshot_id, 'page_snapshot_id');
    if (sourcePageKeys.has(sourcePageKey)) throw new Error(`Page source dupliquée : ${sourcePageKey}`);
    if (pageSnapshotIds.has(pageSnapshotId)) throw new Error(`page_snapshot_id dupliqué : ${pageSnapshotId}`);
    sourcePageKeys.add(sourcePageKey);
    pageSnapshotIds.add(pageSnapshotId);
    if (page.snapshot_id !== snapshotId) throw new Error(`snapshot_id incohérent pour ${sourcePageKey}`);
    if (tree.page_snapshot_id !== pageSnapshotId) throw new Error(`tree.json incohérent pour ${sourcePageKey}`);

    assertIds(stringArray(page.source_ids), sourceIds, 'Source page');
    assertIds(stringArray(page.asset_ids), assetIds, 'Asset page');
    assertIds(stringArray(page.dependency_ids), dependencyIds, 'Dependency page');
    assertIds(stringArray(page.relation_ids), relationIds, 'Relation page');
    assertObjectRef(objectRef(page.raw_source), objectRefs, 'Objet brut page');

    const nodes = arrayOfRecords(tree.nodes);
    const localNodeIds = uniqueIds(nodes, 'occurrence_id', `Node ${sourcePageKey}`);
    const nodeById = new Map(nodes.map((node) => [requiredString(node.occurrence_id, 'occurrence_id'), node]));
    for (const node of nodes) {
      const occurrenceId = requiredString(node.occurrence_id, 'occurrence_id');
      if (allNodeIds.has(occurrenceId)) throw new Error(`occurrence_id dupliqué dans le snapshot : ${occurrenceId}`);
      allNodeIds.add(occurrenceId);
      const parent = nullableString(node.parent_occurrence_id);
      if (parent && !localNodeIds.has(parent)) throw new Error(`Parent node introuvable : ${parent}`);
      assertIds(stringArray(node.source_ids), sourceIds, 'Source node');
      assertIds(stringArray(node.asset_ids), assetIds, 'Asset node');
      assertIds(stringArray(node.dependency_ids), dependencyIds, 'Dependency node');
      assertIds(stringArray(node.relation_ids), relationIds, 'Relation node');
      assertObjectRef(objectRef(node.raw_source), objectRefs, 'Objet brut node');
      assertObjectRef(objectRef(node.content), objectRefs, 'Contenu node');
    }
    const depthMemo = new Map<string, number>();
    const depthOf = (id: string, visiting = new Set<string>()): number => {
      const known = depthMemo.get(id);
      if (known !== undefined) return known;
      if (visiting.has(id)) throw new Error(`Cycle détecté dans l’arbre Bridge : ${id}`);
      visiting.add(id);
      const parent = nullableString(nodeById.get(id)?.parent_occurrence_id);
      const depth = parent ? depthOf(parent, visiting) + 1 : 0;
      visiting.delete(id);
      depthMemo.set(id, depth);
      return depth;
    };
    nodes.forEach((node) => { node.__depth = depthOf(requiredString(node.occurrence_id, 'occurrence_id')); });
    pages.push({ page, meta, tree, nodes });
  }

  for (const source of sources) {
    assertObjectRef(objectRef(source.payload), objectRefs, 'Payload Source');
    const sourcePageSnapshot = nullableString(source.page_snapshot_id);
    if (sourcePageSnapshot && !pageSnapshotIds.has(sourcePageSnapshot)) throw new Error(`PageSnapshot Source introuvable : ${sourcePageSnapshot}`);
    const nodeId = nullableString(source.node_occurrence_id);
    if (nodeId && !allNodeIds.has(nodeId)) throw new Error(`Node Source introuvable : ${nodeId}`);
  }

  const relationTargets: Record<string, Set<string>> = {
    page_snapshot: pageSnapshotIds,
    node: allNodeIds,
    source: sourceIds,
    asset: assetIds,
    dependency: dependencyIds,
  };
  for (const relation of relations) {
    for (const endpoint of [asRecord(relation.from), asRecord(relation.to)]) {
      const entity = requiredString(endpoint.entity, 'relation endpoint entity');
      const id = requiredString(endpoint.id, 'relation endpoint id');
      if (entity === 'global') {
        if (!id.startsWith('global:')) throw new Error(`Référence globale Bridge invalide : ${id}`);
        continue;
      }
      const allowed = relationTargets[entity];
      if (!allowed) throw new Error(`Type de relation Bridge non pris en charge : ${entity}`);
      if (!allowed.has(id)) throw new Error(`Référence Relation introuvable : ${entity} ${id}`);
    }
  }

  const counts: BridgeSnapshotCounts = {
    pages: pages.length,
    nodes: pages.reduce((sum, page) => sum + page.nodes.length, 0),
    sources: sources.length,
    assets: assets.length,
    dependencies: dependencies.length,
    relations: relations.length,
    objects: objects.length,
  };
  const declaredCounts = asRecord(manifest.counts);
  for (const [key, value] of Object.entries(counts)) {
    if (numberValue(declaredCounts[key], -1) !== value) throw new Error(`Compteur manifest incohérent : ${key}`);
  }

  const issues = arrayOfRecords(manifest.issues).map(toIssue);
  const inspection: BridgeSnapshotInspection = {
    packagePath: absolute,
    contract: String(manifest.contract),
    schemaVersion: String(manifest.schema_version),
    bridgeVersion: requiredString(manifest.bridge_version, 'bridge_version'),
    fingerprintProfile: String(manifest.fingerprint_profile),
    generatedAt: requiredString(manifest.generated_at, 'generated_at'),
    sourceInstanceId: requiredString(manifest.source_instance_id, 'source_instance_id'),
    sourceSiteKey: requiredString(manifest.source_site_key, 'source_site_key'),
    externalSnapshotId: snapshotId,
    snapshotType: manifest.snapshot_type,
    scanStatus: String(manifest.scan_status ?? 'complete'),
    packageFingerprint,
    site: {
      name: requiredString(site.name, 'site.name'),
      canonicalUrl: nullableString(site.canonical_url),
      wordpressSiteUrl: nullableString(site.wordpress_site_url),
      environment: nullableString(site.environment),
      timezone: nullableString(asRecord(site.timezone).name),
    },
    counts,
    issues,
    coverage: asRecord(manifest.coverage),
    scannerCapabilities: asRecord(manifest.scanner_capabilities),
    observedContent: asRecord(manifest.observed_content),
    security: asRecord(manifest.security),
    checksumsVerified: true,
  };

  return { path: absolute, entries, rootEntries, manifest, site, snapshot, objects, sources, assets, dependencies, relations, pages, packageFingerprint, inspection };
}

export function calculateBridgePackageFingerprint(files: BridgeJson): string {
  const material = Object.keys(files).sort().map((relativePath) => {
    const checksum = requiredString(files[relativePath], `checksum ${relativePath}`);
    const hex = checksum.startsWith('sha256:') ? checksum.slice(7) : checksum;
    if (!/^[a-f0-9]{64}$/i.test(hex)) throw new Error(`Checksum invalide : ${relativePath}`);
    return `${relativePath}\t${hex.toLowerCase()}\n`;
  }).join('');
  return `sha256:${sha256Hex(Buffer.from(material, 'utf8'))}`;
}

function assertContract(manifest: BridgeJson, site: BridgeJson, snapshot: BridgeJson): void {
  if (manifest.contract !== 'atoumweb-bridge-snapshot') throw new Error('Contrat Bridge inconnu.');
  if (manifest.schema_version !== '1.0.0') throw new Error(`Snapshot Schema Bridge non pris en charge : ${String(manifest.schema_version)}`);
  if (manifest.fingerprint_profile !== 'awb-json-c14n-v1') throw new Error('Profil de fingerprint Bridge non pris en charge.');
  if (manifest.snapshot_type !== 'full' && manifest.snapshot_type !== 'partial') throw new Error('Type de snapshot Bridge invalide.');
  const instance = requiredString(manifest.source_instance_id, 'source_instance_id');
  const sourceSite = requiredString(manifest.source_site_key, 'source_site_key');
  const snapshotId = requiredString(manifest.snapshot_id, 'snapshot_id');
  if (site.source_instance_id !== instance || snapshot.source_instance_id !== instance) throw new Error('source_instance_id incohérent.');
  if (site.source_site_key !== sourceSite || snapshot.source_site_key !== sourceSite) throw new Error('source_site_key incohérent.');
  if (snapshot.snapshot_id !== snapshotId) throw new Error('snapshot_id incohérent.');
}

function verifyChecksums(entries: Map<string, ZipEntryOutput>, files: BridgeJson): void {
  const expected = Object.keys(files).sort();
  const actual = [...entries.keys()].filter((name) => name !== 'checksums.json').sort();
  if (expected.length !== actual.length || expected.some((name, index) => name !== actual[index])) {
    throw new Error('La liste des checksums ne couvre pas exactement le Snapshot Bridge.');
  }
  for (const path of actual) {
    const checksum = requiredString(files[path], `checksum ${path}`);
    const actualChecksum = `sha256:${sha256Hex(entries.get(path)!.data)}`;
    if (checksum !== actualChecksum) throw new Error(`Checksum Bridge invalide : ${path}`);
  }
}

function verifyObjects(entries: Map<string, ZipEntryOutput>, objects: BridgeJson[]): Set<string> {
  const refs = new Set<string>();
  for (const object of objects) {
    const ref = requiredString(object.ref, 'object.ref');
    const path = requiredString(object.path, 'object.path');
    if (!/^sha256:[a-f0-9]{64}$/i.test(ref)) throw new Error(`Référence objet invalide : ${ref}`);
    const hex = ref.slice(7).toLowerCase();
    const expectedPath = `objects/sha256/${hex.slice(0, 2)}/${hex}`;
    if (path !== expectedPath) throw new Error(`Chemin objet incohérent : ${path}`);
    const entry = entries.get(path);
    if (!entry) throw new Error(`Payload objet absent : ${path}`);
    if (sha256Hex(entry.data) !== hex) throw new Error(`Hash objet invalide : ${path}`);
    if (numberValue(object.byte_length, -1) !== entry.data.length) throw new Error(`Taille objet incohérente : ${path}`);
    if (refs.has(ref)) throw new Error(`Objet Bridge dupliqué : ${ref}`);
    refs.add(ref);
  }
  return refs;
}

function parseJson(entries: Map<string, ZipEntryOutput>, path: string, maxBytes: number): BridgeJson {
  const entry = entries.get(path);
  if (!entry) throw new Error(`Fichier Bridge obligatoire absent : ${path}`);
  if (entry.data.length > maxBytes) throw new Error(`JSON Bridge trop volumineux : ${path}`);
  try {
    const parsed = JSON.parse(entry.data.toString('utf8'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
    return parsed;
  } catch {
    throw new Error(`JSON Bridge invalide : ${path}`);
  }
}

function uniqueIds(items: BridgeJson[], key: string, label: string): Set<string> {
  const result = new Set<string>();
  for (const item of items) {
    const id = requiredString(item[key], `${label}.${key}`);
    if (result.has(id)) throw new Error(`${label} dupliqué : ${id}`);
    result.add(id);
  }
  return result;
}

function assertIds(ids: string[], allowed: Set<string>, label: string): void {
  for (const id of ids) if (!allowed.has(id)) throw new Error(`${label} introuvable : ${id}`);
}

function assertObjectRef(ref: string | null, allowed: Set<string>, label: string): void {
  if (ref && !allowed.has(ref)) throw new Error(`${label} introuvable : ${ref}`);
}

function sha256Hex(data: Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}

export function asRecord(value: unknown): BridgeJson {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as BridgeJson : {};
}

export function arrayOfRecords(value: unknown): BridgeJson[] {
  return Array.isArray(value) ? value.filter((item): item is BridgeJson => Boolean(item) && typeof item === 'object' && !Array.isArray(item)) : [];
}

export function requiredString(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Champ Bridge obligatoire invalide : ${label}`);
  return value;
}

export function nullableString(value: unknown): string | null {
  return typeof value === 'string' && value.length ? value : null;
}

export function nullableNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function numberValue(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export function objectRef(value: unknown): string | null {
  return nullableString(asRecord(value).object_ref);
}

function toIssue(value: BridgeJson): BridgeSnapshotIssue {
  return {
    code: requiredString(value.code, 'issue.code'),
    severity: requiredString(value.severity, 'issue.severity'),
    scope: requiredString(value.scope, 'issue.scope'),
    entityRef: nullableString(value.entity_ref),
    message: requiredString(value.message, 'issue.message'),
  };
}
