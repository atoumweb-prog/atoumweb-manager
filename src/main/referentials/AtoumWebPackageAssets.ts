import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import type { WorkspacePaths } from '../workspace';
import type { AtoumWebPackageAssetTransport, AtoumWebTechnicalAssetRole } from '../../shared/referentials';
import type { ZipEntryInput } from './ZipArchive';

export interface PackageManifestAsset {
  role: AtoumWebTechnicalAssetRole;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number;
  checksumSha256: string;
  archivePath: string | null;
  missing: boolean;
}

const sha256 = (data: Buffer): string => createHash('sha256').update(data).digest('hex');
function digest(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const hash = value.replace(/^sha256:/i, '').toLowerCase();
  return /^[a-f0-9]{64}$/.test(hash) ? hash : null;
}
function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
function sourceDocument(content: string | null | undefined) {
  let document: Record<string, unknown> | null;
  try { document = record(JSON.parse(content ?? 'null')); } catch { return null; }
  if (!document || !['atoumweb-bridge-library-candidate', 'atoumweb-library-work-component',
    'atoumweb-library-cleaned-component', 'atoumweb-library-reusable-component'].includes(String(document.kind))) return null;
  const owner = document.kind === 'atoumweb-bridge-library-candidate' ? record(document.prepared) : document;
  return { document, references: owner?.assets === undefined ? [] : Array.isArray(owner.assets) ? owner.assets as unknown[] : [owner.assets], origin: record(document.origin) };
}

export function packageAssetReferences(content: string | null | undefined): unknown[] {
  return sourceDocument(content)?.references ?? [];
}

export function inspectAssetTransport(content: string | null | undefined, assets: PackageManifestAsset[]): AtoumWebPackageAssetTransport {
  const issues = assets.filter(asset => asset.missing || !asset.archivePath)
    .map(asset => 'Fichier attaché manquant : ' + asset.fileName);
  const references = (sourceDocument(content)?.references ?? []).map((value, index) => {
    const ref = record(value);
    const hash = digest(ref?.hash);
    const file = hash ? assets.find(asset => !asset.missing && asset.archivePath && asset.checksumSha256.toLowerCase() === hash) : undefined;
    const status = file ? 'embedded' as const
      : !ref ? 'unresolved' as const
      : ref.localPath || ref.archiveMode === 'embedded' || ref.archiveMode === 'object' ? 'missing' as const
      : typeof ref.url === 'string' && ref.url ? 'external' as const : 'unresolved' as const;
    const assetId = typeof ref?.assetId === 'string' ? ref.assetId : 'reference-' + (index + 1);
    const reason = file ? null : status === 'external' ? 'Ressource externe non transportée.'
      : status === 'missing' ? 'Copie locale référencée mais non embarquée.'
      : 'Référence sans correspondance vérifiable par SHA-256.';
    if (reason) issues.push(assetId + ' : ' + reason);
    return { assetId, url: typeof ref?.url === 'string' ? ref.url : null, checksumSha256: hash,
      archivePath: file?.archivePath ?? null, status, reason };
  });
  return { complete: issues.length === 0, references, issues: [...new Set(issues)] };
}

// The existing hash / checksumSha256 / archivePath fields are sufficient.
// Only the exported JSON copy is enriched; historical versions are never rewritten.
export function preparePackageAssets(
  content: string | null | undefined,
  attached: Array<PackageManifestAsset & { absolutePath: string }>,
  database: DatabaseAdapter,
  workspace: WorkspacePaths,
  entries: ZipEntryInput[],
): { contentText: string | null; assets: PackageManifestAsset[]; transport: AtoumWebPackageAssetTransport } {
  const assets: PackageManifestAsset[] = [];
  const embedded = new Map<string, PackageManifestAsset>();
  const add = (data: Buffer, hash: string, fileName: string, role: AtoumWebTechnicalAssetRole, mimeType: string | null) => {
    if (embedded.has(hash)) return;
    const safeName = basename(fileName).replace(/[<>:"/\\|?*\x00-\x1F]/g, '-').replace(/[. ]+$/g, '').slice(0, 100) || 'asset';
    const archivePath = 'assets/' + role + '/' + hash + '-' + safeName;
    entries.push({ name: archivePath, data });
    const asset = { role, fileName: safeName, mimeType, sizeBytes: data.length, checksumSha256: hash, archivePath, missing: false };
    const missingIndex = assets.findIndex(item => item.missing && item.checksumSha256.toLowerCase() === hash);
    if (missingIndex >= 0) assets[missingIndex] = asset; else assets.push(asset);
    embedded.set(hash, asset);
  };
  for (const attachedAsset of attached) {
    const { absolutePath, ...asset } = attachedAsset;
    const hash = digest(asset.checksumSha256);
    if (!hash) throw new Error('Empreinte de fichier attaché invalide : ' + asset.fileName);
    if (existsSync(absolutePath) && statSync(absolutePath).isFile()) {
      const data = readFileSync(absolutePath);
      if (sha256(data) !== hash) throw new Error('Fichier attaché altéré : ' + asset.fileName);
      add(data, hash, asset.fileName, asset.role, asset.mimeType);
    } else if (!embedded.has(hash)) assets.push({ ...asset, checksumSha256: hash, missing: true, archivePath: null });
  }
  const source = sourceDocument(content);
  let enriched = false;
  for (const value of source?.references ?? []) {
    const ref = record(value);
    if (!ref) continue;
    let hash = digest(ref.hash);
    if (ref.hash != null && !hash) continue; // Unknown hash algorithm is not proof of identity.
    const snapshotId = source?.origin?.snapshotId;
    const snapshotAsset = typeof snapshotId === 'string' && typeof ref.assetId === 'string'
      ? database.get<{ object_ref: string | null; hash: string | null }>(
        'SELECT a.object_ref,a.hash FROM bridge_assets a JOIN bridge_snapshots s ON s.id=a.snapshot_id WHERE s.external_snapshot_id=? AND a.asset_id=?',
        [snapshotId, ref.assetId],
      ) : undefined;
    const objectHash = digest(snapshotAsset?.object_ref);
    if (hash && objectHash && hash !== objectHash) continue;
    const sourceHash = digest(snapshotAsset?.hash);
    if (sourceHash && objectHash && sourceHash !== objectHash) continue;
    hash ??= objectHash;
    if (!hash) continue;
    if (!embedded.has(hash)) {
      const knownObject = database.get('SELECT object_ref FROM bridge_objects WHERE object_ref=?', ['sha256:' + hash]);
      if (!knownObject) continue;
      // Never read localPath from an imported document: it belongs to the source site.
      const path = join(workspace.bridgeDirectory, 'objects', 'sha256', hash.slice(0, 2), hash);
      if (!existsSync(path) || !statSync(path).isFile()) continue;
      const data = readFileSync(path);
      if (sha256(data) !== hash) throw new Error('Objet du coffre altéré : ' + hash);
      let name = typeof ref.assetId === 'string' ? ref.assetId : 'asset';
      if (typeof ref.url === 'string') {
        try { name = basename(new URL(ref.url).pathname) || name; } catch { /* Keep opaque asset ID. */ }
      }
      add(data, hash, name, 'source', typeof ref.mimeType === 'string' ? ref.mimeType : null);
    }
    if (embedded.has(hash) && !digest(ref.hash)) { ref.hash = 'sha256:' + hash; enriched = true; }
  }
  const contentText = enriched ? JSON.stringify(source!.document, null, 2) : content ?? null;
  return { contentText, assets, transport: inspectAssetTransport(contentText, assets) };
}
