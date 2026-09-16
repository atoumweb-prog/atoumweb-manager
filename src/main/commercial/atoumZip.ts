import { inflateRawSync } from 'node:zlib';
import type { AtoumPackageData } from './AtoumPackTypes';

function findEndOfCentralDirectory(buffer: Buffer): number {
  const signature = 0x06054b50;
  const minimum = Math.max(0, buffer.length - 0xffff - 22);
  for (let offset = buffer.length - 22; offset >= minimum; offset -= 1) {
    if (buffer.readUInt32LE(offset) === signature) return offset;
  }
  throw new Error('Archive .atoum invalide : répertoire ZIP introuvable.');
}

export function readZipEntries(archive: Buffer): Map<string, Buffer> {
  const endOffset = findEndOfCentralDirectory(archive);
  const entryCount = archive.readUInt16LE(endOffset + 10);
  let cursor = archive.readUInt32LE(endOffset + 16);
  const entries = new Map<string, Buffer>();

  for (let index = 0; index < entryCount; index += 1) {
    if (archive.readUInt32LE(cursor) !== 0x02014b50) {
      throw new Error('Archive .atoum invalide : entrée ZIP corrompue.');
    }
    const method = archive.readUInt16LE(cursor + 10);
    const compressedSize = archive.readUInt32LE(cursor + 20);
    const nameLength = archive.readUInt16LE(cursor + 28);
    const extraLength = archive.readUInt16LE(cursor + 30);
    const commentLength = archive.readUInt16LE(cursor + 32);
    const localOffset = archive.readUInt32LE(cursor + 42);
    const name = archive.subarray(cursor + 46, cursor + 46 + nameLength).toString('utf8');

    if (archive.readUInt32LE(localOffset) !== 0x04034b50) {
      throw new Error(`Archive .atoum invalide : en-tête local manquant pour ${name}.`);
    }
    const localNameLength = archive.readUInt16LE(localOffset + 26);
    const localExtraLength = archive.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = archive.subarray(dataStart, dataStart + compressedSize);

    let data: Buffer;
    if (method === 0) data = Buffer.from(compressed);
    else if (method === 8) data = inflateRawSync(compressed);
    else throw new Error(`Archive .atoum non prise en charge : compression ZIP ${method} pour ${name}.`);

    entries.set(name.replace(/\\/g, '/'), data);
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

export function parseAtoumPackage(entries: Map<string, Buffer>): AtoumPackageData {
  const packageJson = entries.get('package.json');
  if (!packageJson) throw new Error('Archive .atoum invalide : package.json absent.');
  let data: AtoumPackageData;
  try {
    data = JSON.parse(packageJson.toString('utf8')) as AtoumPackageData;
  } catch {
    throw new Error('package.json contient un JSON invalide.');
  }

  const manifest = data?.manifest;
  if (!manifest || manifest.format !== 'atoum-offer-pack') {
    throw new Error('Ce fichier n’est pas un pack d’offre AtoumWeb.');
  }
  if (manifest.schemaVersion !== '0.2.0') {
    throw new Error(`Version de schéma .atoum non prise en charge : ${manifest.schemaVersion || 'inconnue'}.`);
  }
  if (!manifest.packageId?.trim() || !manifest.packageVersion?.trim() || !manifest.displayName?.trim()) {
    throw new Error('Manifest .atoum incomplet.');
  }
  if (!data.catalog || !Array.isArray(data.catalog.entries)) {
    throw new Error('Catalogue du pack .atoum absent ou invalide.');
  }

  const seen = new Set<string>();
  for (const entry of data.catalog.entries) {
    if (!entry.ref?.trim() || seen.has(entry.ref)) {
      throw new Error(`Référence catalogue absente ou dupliquée : ${entry.ref || '(vide)'}.`);
    }
    seen.add(entry.ref);
    if (!['offer', 'service'].includes(entry.item?.type)) {
      throw new Error(`Type catalogue invalide pour ${entry.ref}.`);
    }
    if (!entry.item?.name?.trim() || !entry.version?.priceMode) {
      throw new Error(`Entrée catalogue incomplète : ${entry.ref}.`);
    }
  }

  for (const template of data.documents?.templates ?? []) {
    if (!template.ref?.trim() || !template.version?.trim() || !template.file?.trim()) {
      throw new Error('Modèle documentaire .atoum incomplet.');
    }
    if (!entries.has(template.file)) {
      throw new Error(`Fichier du modèle documentaire absent du pack : ${template.file}.`);
    }
  }
  return data;
}
