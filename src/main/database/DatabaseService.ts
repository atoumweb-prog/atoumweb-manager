import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { DatabaseHealth } from '../../shared/contracts';
import { CrmService } from '../crm/CrmService';
import type { WorkspacePaths } from '../workspace';
import type { DatabaseAdapter } from './DatabaseAdapter';
import { NodeSqliteAdapter } from './NodeSqliteAdapter';
import { applyPendingMigrations, getPendingMigrations } from './migrations';

export type BackupKind = 'automatic' | 'manual' | 'pre-migration';

export class DatabaseService {
  private readonly database: DatabaseAdapter;
  private readonly existedBeforeOpen: boolean;
  readonly crm: CrmService;

  constructor(private readonly workspace: WorkspacePaths) {
    this.existedBeforeOpen = existsSync(workspace.databaseFile);
    this.database = new NodeSqliteAdapter(workspace.databaseFile);
    this.crm = new CrmService(this.database);
  }

  async initialize(): Promise<void> {
    this.configureConnection();
    const pending = getPendingMigrations(this.database);

    if (this.existedBeforeOpen && pending.length > 0) {
      await this.createBackup('pre-migration');
    }

    applyPendingMigrations(this.database);
    this.seedDefaults();
    this.crm.rebuildSearchIndex();
    await this.createDailyBackupIfNeeded();
  }

  private configureConnection(): void {
    this.database.exec('PRAGMA foreign_keys = ON;');
    this.database.exec('PRAGMA journal_mode = WAL;');
    this.database.exec('PRAGMA synchronous = NORMAL;');
    this.database.exec('PRAGMA busy_timeout = 5000;');
  }

  private seedDefaults(): void {
    this.setSettingIfMissing('theme', 'atoumweb');
    this.setSettingIfMissing('show_hover_help', true);
  }

  private setSettingIfMissing(key: string, value: unknown): void {
    const existing = this.database.get<{ key: string }>('SELECT key FROM settings WHERE key = ?', [key]);
    if (existing) return;
    this.setSetting(key, value);
  }

  getSetting<T>(key: string, fallback: T): T {
    const row = this.database.get<{ value_json: string }>(
      'SELECT value_json FROM settings WHERE key = ?',
      [key],
    );

    if (!row) return fallback;

    try {
      return JSON.parse(row.value_json) as T;
    } catch {
      return fallback;
    }
  }

  setSetting(key: string, value: unknown): void {
    const now = new Date().toISOString();
    const valueJson = JSON.stringify(value);

    this.database.run(
      `INSERT INTO settings (key, value_json, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET
         value_json = excluded.value_json,
         updated_at = excluded.updated_at`,
      [key, valueJson, now],
    );
  }

  health(): DatabaseHealth {
    const row = this.database.get<{ count: number }>('SELECT COUNT(*) AS count FROM schema_migrations');
    return {
      healthy: true,
      migrationCount: Number(row?.count ?? 0),
      databasePath: this.workspace.databaseFile,
    };
  }

  async createBackup(kind: BackupKind): Promise<string> {
    const directory = join(this.workspace.backupsDirectory, kind);
    mkdirSync(directory, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const destination = join(directory, `atoumweb-manager-${timestamp}.sqlite`);
    await this.database.backupTo(destination);
    return destination;
  }

  private async createDailyBackupIfNeeded(): Promise<void> {
    const directory = join(this.workspace.backupsDirectory, 'automatic');
    mkdirSync(directory, { recursive: true });

    const day = new Date().toISOString().slice(0, 10);
    const destination = join(directory, `atoumweb-manager-${day}.sqlite`);
    if (existsSync(destination)) return;

    await this.database.backupTo(destination);
  }

  close(): void {
    this.database.close();
  }
}
