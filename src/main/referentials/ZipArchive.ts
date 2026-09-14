import { readFileSync, writeFileSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';

const LOCAL_FILE_HEADER = 0x04034b50;
const CENTRAL_DIRECTORY_HEADER = 0x02014b50;
const END_OF_CENTRAL_DIRECTORY = 0x06054b50;
const UTF8_FLAG = 0x0800;
const MAX_ENTRIES = 5000;
const MAX_ENTRY_SIZE = 50 * 1024 * 1024;
const MAX_TOTAL_SIZE = 200 * 1024 * 1024;

export interface ZipEntryInput {
  name: string;
  data: Buffer;
}

export interface ZipEntryOutput {
  name: string;
  data: Buffer;
  compressedSize: number;
  uncompressedSize: number;
  compressionMethod: number;
}

interface CentralEntry {
  name: string;
  nameBuffer: Buffer;
  crc: number;
  size: number;
  offset: number;
  dosTime: number;
  dosDate: number;
}

const CRC_TABLE = createCrcTable();

export function writeZipArchive(path: string, entries: ZipEntryInput[]): void {
  if (entries.length > MAX_ENTRIES) throw new Error('Le paquet ZIP contient trop de fichiers.');

  const localParts: Buffer[] = [];
  const centralEntries: CentralEntry[] = [];
  let offset = 0;
  let totalSize = 0;
  const now = new Date();
  const { dosTime, dosDate } = dateToDos(now);

  for (const input of entries) {
    const name = normalizeEntryName(input.name);
    if (input.data.length > MAX_ENTRY_SIZE) throw new Error(`Fichier trop volumineux dans le ZIP : ${name}`);
    totalSize += input.data.length;
    if (totalSize > MAX_TOTAL_SIZE) throw new Error('Le paquet ZIP dépasse la taille totale autorisée.');

    const nameBuffer = Buffer.from(name, 'utf8');
    const crc = crc32(input.data);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(LOCAL_FILE_HEADER, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(UTF8_FLAG, 6);
    header.writeUInt16LE(0, 8);
    header.writeUInt16LE(dosTime, 10);
    header.writeUInt16LE(dosDate, 12);
    header.writeUInt32LE(crc, 14);
    header.writeUInt32LE(input.data.length, 18);
    header.writeUInt32LE(input.data.length, 22);
    header.writeUInt16LE(nameBuffer.length, 26);
    header.writeUInt16LE(0, 28);

    localParts.push(header, nameBuffer, input.data);
    centralEntries.push({ name, nameBuffer, crc, size: input.data.length, offset, dosTime, dosDate });
    offset += header.length + nameBuffer.length + input.data.length;
  }

  const centralOffset = offset;
  const centralParts: Buffer[] = [];
  let centralSize = 0;

  for (const entry of centralEntries) {
    const header = Buffer.alloc(46);
    header.writeUInt32LE(CENTRAL_DIRECTORY_HEADER, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(20, 6);
    header.writeUInt16LE(UTF8_FLAG, 8);
    header.writeUInt16LE(0, 10);
    header.writeUInt16LE(entry.dosTime, 12);
    header.writeUInt16LE(entry.dosDate, 14);
    header.writeUInt32LE(entry.crc, 16);
    header.writeUInt32LE(entry.size, 20);
    header.writeUInt32LE(entry.size, 24);
    header.writeUInt16LE(entry.nameBuffer.length, 28);
    header.writeUInt16LE(0, 30);
    header.writeUInt16LE(0, 32);
    header.writeUInt16LE(0, 34);
    header.writeUInt16LE(0, 36);
    header.writeUInt32LE(0, 38);
    header.writeUInt32LE(entry.offset, 42);
    centralParts.push(header, entry.nameBuffer);
    centralSize += header.length + entry.nameBuffer.length;
  }

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(END_OF_CENTRAL_DIRECTORY, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(centralEntries.length, 8);
  eocd.writeUInt16LE(centralEntries.length, 10);
  eocd.writeUInt32LE(centralSize, 12);
  eocd.writeUInt32LE(centralOffset, 16);
  eocd.writeUInt16LE(0, 20);

  writeFileSync(path, Buffer.concat([...localParts, ...centralParts, eocd]));
}

export function readZipArchive(path: string): ZipEntryOutput[] {
  const buffer = readFileSync(path);
  if (buffer.length < 22) throw new Error('Archive ZIP invalide.');

  const eocdOffset = findEndOfCentralDirectory(buffer);
  const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
  const centralSize = buffer.readUInt32LE(eocdOffset + 12);
  const centralOffset = buffer.readUInt32LE(eocdOffset + 16);

  if (totalEntries > MAX_ENTRIES) throw new Error('Le paquet ZIP contient trop de fichiers.');
  if (centralOffset + centralSize > buffer.length) throw new Error('Répertoire central ZIP invalide.');

  const outputs: ZipEntryOutput[] = [];
  const seen = new Set<string>();
  let cursor = centralOffset;
  let totalUncompressed = 0;

  for (let index = 0; index < totalEntries; index += 1) {
    if (cursor + 46 > buffer.length || buffer.readUInt32LE(cursor) !== CENTRAL_DIRECTORY_HEADER) {
      throw new Error('Entrée ZIP invalide.');
    }
    const flags = buffer.readUInt16LE(cursor + 8);
    const method = buffer.readUInt16LE(cursor + 10);
    const expectedCrc = buffer.readUInt32LE(cursor + 16);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const uncompressedSize = buffer.readUInt32LE(cursor + 24);
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const localOffset = buffer.readUInt32LE(cursor + 42);
    const entryEnd = cursor + 46 + nameLength + extraLength + commentLength;
    if (entryEnd > buffer.length) throw new Error('Nom ou métadonnées ZIP invalides.');

    const rawName = buffer.subarray(cursor + 46, cursor + 46 + nameLength);
    const name = normalizeEntryName(rawName.toString((flags & UTF8_FLAG) ? 'utf8' : 'latin1'));
    if (seen.has(name)) throw new Error(`Entrée ZIP dupliquée : ${name}`);
    seen.add(name);

    if (uncompressedSize > MAX_ENTRY_SIZE) throw new Error(`Fichier trop volumineux dans le ZIP : ${name}`);
    totalUncompressed += uncompressedSize;
    if (totalUncompressed > MAX_TOTAL_SIZE) throw new Error('Le paquet ZIP dépasse la taille totale autorisée.');
    if (method !== 0 && method !== 8) throw new Error(`Méthode de compression ZIP non prise en charge pour ${name}.`);

    if (localOffset + 30 > buffer.length || buffer.readUInt32LE(localOffset) !== LOCAL_FILE_HEADER) {
      throw new Error(`En-tête local ZIP invalide pour ${name}.`);
    }
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const dataEnd = dataStart + compressedSize;
    if (dataEnd > buffer.length) throw new Error(`Contenu ZIP tronqué pour ${name}.`);

    const compressed = buffer.subarray(dataStart, dataEnd);
    const data = method === 0 ? Buffer.from(compressed) : inflateRawSync(compressed);
    if (data.length !== uncompressedSize) throw new Error(`Taille décompressée incohérente pour ${name}.`);
    if (crc32(data) !== expectedCrc) throw new Error(`CRC invalide pour ${name}.`);

    outputs.push({ name, data, compressedSize, uncompressedSize, compressionMethod: method });
    cursor = entryEnd;
  }

  return outputs;
}

export function crc32(data: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of data) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function normalizeEntryName(value: string): string {
  const normalized = value.replace(/\\/g, '/').replace(/^\.\//, '');
  if (!normalized || normalized.startsWith('/') || /^[A-Za-z]:\//.test(normalized)) {
    throw new Error('Chemin ZIP absolu interdit.');
  }
  const segments = normalized.split('/');
  if (segments.some((segment) => !segment || segment === '.' || segment === '..')) {
    throw new Error(`Chemin ZIP dangereux : ${value}`);
  }
  return segments.join('/');
}

function createCrcTable(): Uint32Array {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
}

function dateToDos(date: Date): { dosTime: number; dosDate: number } {
  const year = Math.min(2107, Math.max(1980, date.getFullYear()));
  const dosTime = ((date.getHours() & 0x1f) << 11) | ((date.getMinutes() & 0x3f) << 5) | ((Math.floor(date.getSeconds() / 2)) & 0x1f);
  const dosDate = (((year - 1980) & 0x7f) << 9) | (((date.getMonth() + 1) & 0x0f) << 5) | (date.getDate() & 0x1f);
  return { dosTime, dosDate };
}

function findEndOfCentralDirectory(buffer: Buffer): number {
  const minimum = Math.max(0, buffer.length - (22 + 0xffff));
  for (let offset = buffer.length - 22; offset >= minimum; offset -= 1) {
    if (buffer.readUInt32LE(offset) === END_OF_CENTRAL_DIRECTORY) return offset;
  }
  throw new Error('Fin de répertoire central ZIP introuvable.');
}
