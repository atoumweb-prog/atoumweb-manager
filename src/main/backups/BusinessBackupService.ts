import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { DatabaseAdapter, SqlValue } from '../database/DatabaseAdapter';
import {
  BUSINESS_BACKUP_LOCATION_TYPES,
  BUSINESS_BACKUP_TYPES,
  type BusinessBackupFilters,
  type BusinessBackupLocation,
  type BusinessBackupLocationInput,
  type BusinessBackupOverview,
  type BusinessBackupRecord,
  type BusinessBackupRecordInput,
  type BusinessBackupType,
} from '../../shared/businessBackups';

const nowIso = (): string => new Date().toISOString();
const clean = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

interface BackupRow extends Record<string, unknown> {
  id: string;
  client_account_id: string | null;
  project_id: string | null;
  backup_type: BusinessBackupType;
  label: string;
  backup_at: string;
  size_bytes: number | null;
  checksum_sha256: string | null;
  is_stable: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface LocationRow extends Record<string, unknown> {
  id: string;
  backup_record_id: string;
  location_type: BusinessBackupLocation['locationType'];
  label: string;
  path_or_reference: string;
  verified_at: string | null;
  last_checked_at: string | null;
  missing_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export class BusinessBackupService {
  constructor(private readonly database: DatabaseAdapter) {}

  list(filters: BusinessBackupFilters = {}): BusinessBackupRecord[] {
    const where: string[] = [];
    const params: SqlValue[] = [];
    if (clean(filters.clientAccountId)) {
      where.push('b.client_account_id=?');
      params.push(clean(filters.clientAccountId));
    }
    if (clean(filters.projectId)) {
      where.push('b.project_id=?');
      params.push(clean(filters.projectId));
    }
    if (filters.backupType) {
      if (!BUSINESS_BACKUP_TYPES.includes(filters.backupType)) throw new Error('Type de sauvegarde invalide.');
      where.push('b.backup_type=?');
      params.push(filters.backupType);
    }
    if (filters.locationType) {
      if (!BUSINESS_BACKUP_LOCATION_TYPES.includes(filters.locationType)) throw new Error('Type d’emplacement invalide.');
      where.push('EXISTS (SELECT 1 FROM backup_locations l WHERE l.backup_record_id=b.id AND l.location_type=?)');
      params.push(filters.locationType);
    }
    if (clean(filters.search)) {
      const query = `%${clean(filters.search)}%`;
      where.push(`(b.label LIKE ? COLLATE NOCASE OR b.notes LIKE ? COLLATE NOCASE OR EXISTS (
        SELECT 1 FROM backup_locations l2 WHERE l2.backup_record_id=b.id
        AND (l2.label LIKE ? COLLATE NOCASE OR l2.path_or_reference LIKE ? COLLATE NOCASE OR l2.notes LIKE ? COLLATE NOCASE)
      ))`);
      params.push(query, query, query, query, query);
    }
    return this.database.all<BackupRow>(
      `SELECT b.* FROM backup_records b ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY b.backup_at DESC, b.created_at DESC`,
      params,
    ).map((row) => this.mapRecord(row));
  }

  get(id: string): BusinessBackupRecord {
    const row = this.database.get<BackupRow>('SELECT * FROM backup_records WHERE id=?', [id]);
    if (!row) throw new Error('Sauvegarde métier introuvable.');
    return this.mapRecord(row);
  }

  create(input: BusinessBackupRecordInput): BusinessBackupRecord {
    if (!BUSINESS_BACKUP_TYPES.includes(input.backupType)) throw new Error('Type de sauvegarde invalide.');
    const label = clean(input.label);
    if (!label) throw new Error('Le libellé de la sauvegarde est requis.');
    if (input.sizeBytes != null && (!Number.isInteger(input.sizeBytes) || input.sizeBytes < 0)) {
      throw new Error('La taille de sauvegarde doit être positive.');
    }

    const relation = this.resolveOwner(input.clientAccountId, input.projectId);
    const id = randomUUID();
    const now = nowIso();
    const backupAt = clean(input.backupAt) ?? now;
    this.database.run(
      `INSERT INTO backup_records (
        id,client_account_id,project_id,backup_type,label,backup_at,size_bytes,checksum_sha256,is_stable,notes,created_at,updated_at
       ) VALUES (?,?,?,?,?,?,?,?,0,?,?,?)`,
      [
        id, relation.clientAccountId, relation.projectId, input.backupType, label, backupAt,
        input.sizeBytes ?? null, clean(input.checksumSha256), clean(input.notes), now, now,
      ],
    );
    this.activity(id, relation.projectId, relation.clientAccountId, 'backup_created', `Sauvegarde métier enregistrée : ${label}`);
    this.index(id);
    return this.get(id);
  }

  addLocation(recordId: string, input: BusinessBackupLocationInput): BusinessBackupRecord {
    const record = this.get(recordId);
    if (!BUSINESS_BACKUP_LOCATION_TYPES.includes(input.locationType)) throw new Error('Type d’emplacement invalide.');
    const label = clean(input.label);
    const reference = clean(input.pathOrReference);
    if (!label) throw new Error('Le libellé de l’emplacement est requis.');
    if (!reference) throw new Error('Le chemin ou la référence de sauvegarde est requis.');

    const now = nowIso();
    const pathOrReference = input.locationType === 'local' ? resolve(reference) : reference;
    const localExists = input.locationType === 'local' ? this.pathExists(pathOrReference) : null;
    this.database.run(
      `INSERT INTO backup_locations (
        id,backup_record_id,location_type,label,path_or_reference,verified_at,last_checked_at,missing_at,notes,created_at,updated_at
       ) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [
        randomUUID(), recordId, input.locationType, label, pathOrReference,
        localExists === true ? now : null,
        input.locationType === 'local' ? now : null,
        localExists === false ? now : null,
        clean(input.notes), now, now,
      ],
    );
    this.activity(recordId, record.projectId ?? null, record.clientAccountId ?? null, 'backup_location_added', `Emplacement ajouté : ${label} (${input.locationType})`);
    this.index(recordId);
    return this.get(recordId);
  }

  verifyLocation(locationId: string): BusinessBackupRecord {
    const location = this.requireLocation(locationId);
    const record = this.get(location.backup_record_id);
    const now = nowIso();
    if (location.location_type === 'local') {
      const exists = this.pathExists(location.path_or_reference);
      this.database.run(
        `UPDATE backup_locations SET verified_at=?,last_checked_at=?,missing_at=?,updated_at=? WHERE id=?`,
        [exists ? now : location.verified_at, now, exists ? null : now, now, locationId],
      );
      this.activity(
        record.id, record.projectId ?? null, record.clientAccountId ?? null,
        exists ? 'backup_local_verified' : 'backup_local_missing',
        exists ? `Copie locale vérifiée : ${location.label}` : `Copie locale introuvable : ${location.label}`,
      );
    } else {
      this.database.run(
        `UPDATE backup_locations SET verified_at=?,last_checked_at=?,missing_at=NULL,updated_at=? WHERE id=?`,
        [now, now, now, locationId],
      );
      this.activity(record.id, record.projectId ?? null, record.clientAccountId ?? null, 'backup_remote_verified', `Emplacement ${location.location_type} confirmé manuellement : ${location.label}`);
    }
    this.index(record.id);
    return this.get(record.id);
  }

  relocalizePath(locationId: string, replacementPath: string): BusinessBackupRecord {
    const location = this.requireLocation(locationId);
    if (location.location_type !== 'local') throw new Error('Seule une copie locale peut être relocalisée depuis le disque.');
    const candidate = resolve(replacementPath);
    if (!this.pathExists(candidate)) throw new Error('Le nouvel emplacement local est introuvable.');
    const now = nowIso();
    this.database.run(
      `UPDATE backup_locations SET path_or_reference=?,verified_at=?,last_checked_at=?,missing_at=NULL,updated_at=? WHERE id=?`,
      [candidate, now, now, now, locationId],
    );
    const record = this.get(location.backup_record_id);
    this.activity(record.id, record.projectId ?? null, record.clientAccountId ?? null, 'backup_local_relocated', `Copie locale relocalisée : ${location.label}`);
    this.index(record.id);
    return this.get(record.id);
  }

  markStable(recordId: string): BusinessBackupRecord {
    const record = this.get(recordId);
    this.database.exec('BEGIN IMMEDIATE;');
    try {
      if (record.projectId) {
        this.database.run('UPDATE backup_records SET is_stable=0,updated_at=? WHERE project_id=? AND is_stable=1', [nowIso(), record.projectId]);
      } else if (record.clientAccountId) {
        this.database.run('UPDATE backup_records SET is_stable=0,updated_at=? WHERE project_id IS NULL AND client_account_id=? AND is_stable=1', [nowIso(), record.clientAccountId]);
      }
      this.database.run('UPDATE backup_records SET is_stable=1,updated_at=? WHERE id=?', [nowIso(), recordId]);
      this.database.exec('COMMIT;');
    } catch (error) {
      this.database.exec('ROLLBACK;');
      throw error;
    }
    this.activity(record.id, record.projectId ?? null, record.clientAccountId ?? null, 'backup_marked_stable', `Version stable : ${record.label}`);
    this.index(record.id);
    return this.get(recordId);
  }

  overview(filters: Pick<BusinessBackupFilters, 'clientAccountId' | 'projectId'> = {}): BusinessBackupOverview {
    const records = this.list(filters);
    let localCopies = 0;
    let missingLocalCopies = 0;
    let latestLocal: BusinessBackupRecord | null = null;
    for (const record of records) {
      const localLocations = record.locations.filter((location) => location.locationType === 'local');
      localCopies += localLocations.filter((location) => location.exists === true).length;
      missingLocalCopies += localLocations.filter((location) => location.exists === false).length;
      if (!latestLocal && localLocations.some((location) => location.exists === true)) latestLocal = record;
    }
    return {
      latestKnown: records[0] ?? null,
      latestLocal,
      latestStable: records.find((record) => record.stable) ?? null,
      totalRecords: records.length,
      localCopies,
      missingLocalCopies,
    };
  }

  rebuildSearchIndex(): number {
    this.database.run(`DELETE FROM search_documents WHERE entity_type='backup_record'`);
    const rows = this.database.all<{ id: string }>('SELECT id FROM backup_records');
    rows.forEach((row) => this.index(row.id));
    return rows.length;
  }

  absoluteLocalPath(locationId: string): string {
    const location = this.requireLocation(locationId);
    if (location.location_type !== 'local') throw new Error('Cet emplacement n’est pas une copie locale.');
    return resolve(location.path_or_reference);
  }

  private resolveOwner(clientAccountId?: string | null, projectId?: string | null): { clientAccountId: string | null; projectId: string | null } {
    const requestedClient = clean(clientAccountId);
    const requestedProject = clean(projectId);
    if (!requestedClient && !requestedProject) throw new Error('Une sauvegarde doit être rattachée à un Client ou à un Projet.');

    let projectClient: string | null = null;
    if (requestedProject) {
      const project = this.database.get<{ client_account_id: string | null }>('SELECT client_account_id FROM projects WHERE id=?', [requestedProject]);
      if (!project) throw new Error('Projet introuvable.');
      projectClient = project.client_account_id;
      if (requestedClient && projectClient && requestedClient !== projectClient) {
        throw new Error('Le Client choisi ne correspond pas au Client du Projet.');
      }
    }
    const finalClient = requestedClient ?? projectClient;
    if (finalClient) {
      const client = this.database.get<{ id: string }>('SELECT id FROM client_accounts WHERE id=?', [finalClient]);
      if (!client) throw new Error('Client introuvable.');
    }
    return { clientAccountId: finalClient ?? null, projectId: requestedProject ?? null };
  }

  private mapRecord(row: BackupRow): BusinessBackupRecord {
    return {
      id: row.id,
      clientAccountId: row.client_account_id,
      projectId: row.project_id,
      backupType: row.backup_type,
      label: row.label,
      backupAt: row.backup_at,
      sizeBytes: row.size_bytes,
      checksumSha256: row.checksum_sha256,
      stable: Boolean(row.is_stable),
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      locations: this.listLocations(row.id),
    };
  }

  private listLocations(recordId: string): BusinessBackupLocation[] {
    return this.database.all<LocationRow>(
      'SELECT * FROM backup_locations WHERE backup_record_id=? ORDER BY created_at DESC',
      [recordId],
    ).map((row) => this.mapLocation(row));
  }

  private mapLocation(row: LocationRow): BusinessBackupLocation {
    let exists: boolean | null = null;
    let missingAt = row.missing_at;
    if (row.location_type === 'local') {
      exists = this.pathExists(row.path_or_reference);
      if (!exists && !missingAt) {
        missingAt = nowIso();
        this.database.run('UPDATE backup_locations SET missing_at=?,last_checked_at=?,updated_at=? WHERE id=?', [missingAt, missingAt, missingAt, row.id]);
      } else if (exists && missingAt) {
        const checked = nowIso();
        missingAt = null;
        this.database.run('UPDATE backup_locations SET missing_at=NULL,last_checked_at=?,updated_at=? WHERE id=?', [checked, checked, row.id]);
      }
    }
    return {
      id: row.id,
      backupRecordId: row.backup_record_id,
      locationType: row.location_type,
      label: row.label,
      pathOrReference: row.path_or_reference,
      verifiedAt: row.verified_at,
      lastCheckedAt: row.last_checked_at,
      missingAt,
      exists,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private requireLocation(id: string): LocationRow {
    const row = this.database.get<LocationRow>('SELECT * FROM backup_locations WHERE id=?', [id]);
    if (!row) throw new Error('Emplacement de sauvegarde introuvable.');
    return row;
  }

  private pathExists(path: string): boolean {
    try {
      return existsSync(path) && (statSync(path).isFile() || statSync(path).isDirectory());
    } catch {
      return false;
    }
  }

  private activity(recordId: string, projectId: string | null, clientId: string | null, action: string, summary: string): void {
    this.database.run(
      `INSERT INTO activity_log (entity_type,entity_id,action,summary,metadata_json,created_at)
       VALUES ('backup_record',?,?,?,?,?)`,
      [recordId, action, summary, JSON.stringify({ projectId, clientAccountId: clientId }), nowIso()],
    );
  }

  private index(recordId: string): void {
    const record = this.get(recordId);
    const locationText = record.locations.map((location) => `${location.label} ${location.pathOrReference} ${location.notes ?? ''}`).join(' ');
    const searchText = [record.label, record.backupType, record.notes ?? '', locationText].join(' ').toLocaleLowerCase('fr-FR');
    const status = record.stable ? 'stable' : 'known';
    this.database.run(
      `INSERT INTO search_documents (id,entity_type,entity_id,title,subtitle,status,search_text,updated_at)
       VALUES (?,?,?,?,?,?,?,?)
       ON CONFLICT(entity_type,entity_id) DO UPDATE SET title=excluded.title,subtitle=excluded.subtitle,status=excluded.status,search_text=excluded.search_text,updated_at=excluded.updated_at`,
      [`backup_record:${recordId}`, 'backup_record', recordId, record.label, record.backupType, status, searchText, nowIso()],
    );
  }
}
