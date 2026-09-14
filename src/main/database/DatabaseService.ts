import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { DatabaseHealth } from '../../shared/contracts';
import { BillingHandoffService } from '../billing/BillingHandoffService';
import { CatalogService } from '../commercial/CatalogService';
import { QuoteService } from '../commercial/QuoteService';
import { ActionService } from '../crm/ActionService';
import { ClientContactService } from '../crm/ClientContactService';
import { CrmService } from '../crm/CrmService';
import { HourPackService } from '../operations/HourPackService';
import { HourPackShortfallService } from '../operations/HourPackShortfallService';
import { InterventionCompletionService } from '../operations/InterventionCompletionService';
import { MaintenanceOverageService } from '../operations/MaintenanceOverageService';
import { MaintenanceReportService } from '../operations/MaintenanceReportService';
import { MaintenanceService } from '../operations/MaintenanceService';
import { OperationsAlertService } from '../operations/OperationsAlertService';
import { OperationsService } from '../operations/OperationsService';
import { ProjectCompletionService } from '../projects/ProjectCompletionService';
import { ProjectNodeArrangementService } from '../projects/ProjectNodeArrangementService';
import { ProjectResourceService } from '../projects/ProjectResourceService';
import { ProjectReuseExportService } from '../projects/ProjectReuseExportService';
import { ProjectSearchService } from '../projects/ProjectSearchService';
import { ProjectService } from '../projects/ProjectService';
import { ProjectTechnicalLibraryService } from '../projects/ProjectTechnicalLibraryService';
import { AtoumWebTechnicalAssetService } from '../referentials/AtoumWebTechnicalAssetService';
import { AtoumWebTechnicalLibraryService } from '../referentials/AtoumWebTechnicalLibraryService';
import { TimeCorrectionService } from '../time/TimeCorrectionService';
import { TimeService } from '../time/TimeService';
import { TimeSwitchService } from '../time/TimeSwitchService';
import type { WorkspacePaths } from '../workspace';
import type { DatabaseAdapter } from './DatabaseAdapter';
import { NodeSqliteAdapter } from './NodeSqliteAdapter';
import { applyPendingMigrations, getPendingMigrations } from './migrations';

export type BackupKind = 'automatic' | 'manual' | 'pre-migration';

export class DatabaseService {
  private readonly database: DatabaseAdapter;
  private readonly existedBeforeOpen: boolean;
  readonly crm: CrmService;
  readonly clientContacts: ClientContactService;
  readonly actions: ActionService;
  readonly catalog: CatalogService;
  readonly quotes: QuoteService;
  readonly projects: ProjectService;
  readonly projectCompletion: ProjectCompletionService;
  readonly projectNodes: ProjectNodeArrangementService;
  readonly projectResources: ProjectResourceService;
  readonly projectReuseExport: ProjectReuseExportService;
  readonly projectSearch: ProjectSearchService;
  readonly projectTechnicalLibrary: ProjectTechnicalLibraryService;
  readonly atoumWebTechnicalLibrary: AtoumWebTechnicalLibraryService;
  readonly atoumWebTechnicalAssets: AtoumWebTechnicalAssetService;
  readonly operations: OperationsService;
  readonly maintenance: MaintenanceService;
  readonly hourPacks: HourPackService;
  readonly billingHandoff: BillingHandoffService;
  readonly hourPackShortfalls: HourPackShortfallService;
  readonly maintenanceOverages: MaintenanceOverageService;
  readonly maintenanceReports: MaintenanceReportService;
  readonly operationsAlerts: OperationsAlertService;
  readonly interventionCompletion: InterventionCompletionService;
  readonly time: TimeService;
  readonly timeCorrections: TimeCorrectionService;
  readonly timeSwitches: TimeSwitchService;

  constructor(private readonly workspace: WorkspacePaths) {
    this.existedBeforeOpen = existsSync(workspace.databaseFile);
    this.database = new NodeSqliteAdapter(workspace.databaseFile);
    this.crm = new CrmService(this.database);
    this.clientContacts = new ClientContactService(this.database, this.crm);
    this.actions = new ActionService(this.database);
    this.catalog = new CatalogService(this.database);
    this.quotes = new QuoteService(this.database, this.crm);
    this.projects = new ProjectService(this.database, this.workspace);
    this.projectCompletion = new ProjectCompletionService(this.database);
    this.projectNodes = new ProjectNodeArrangementService(this.database, this.projects);
    this.projectResources = new ProjectResourceService(this.database, this.workspace);
    this.projectReuseExport = new ProjectReuseExportService(this.database, this.workspace);
    this.projectSearch = new ProjectSearchService(this.database);
    this.projectTechnicalLibrary = new ProjectTechnicalLibraryService(this.database);
    this.atoumWebTechnicalLibrary = new AtoumWebTechnicalLibraryService(this.database);
    this.atoumWebTechnicalAssets = new AtoumWebTechnicalAssetService(this.database, this.workspace);
    this.operations = new OperationsService(this.database);
    this.maintenance = new MaintenanceService(this.database);
    this.hourPacks = new HourPackService(this.database);
    this.billingHandoff = new BillingHandoffService(this.database);
    this.hourPackShortfalls = new HourPackShortfallService(this.database, this.hourPacks, this.billingHandoff);
    this.maintenanceOverages = new MaintenanceOverageService(this.database, this.billingHandoff);
    this.maintenanceReports = new MaintenanceReportService(this.database);
    this.operationsAlerts = new OperationsAlertService(this.database, this.hourPackShortfalls);
    this.interventionCompletion = new InterventionCompletionService(this.database, this.operations, this.hourPacks, this.billingHandoff, this.maintenanceOverages);
    this.time = new TimeService(this.database);
    this.timeCorrections = new TimeCorrectionService(this.database, this.time);
    this.timeSwitches = new TimeSwitchService(this.database, this.time);
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
    try { return JSON.parse(row.value_json) as T; } catch { return fallback; }
  }

  setSetting(key: string, value: unknown): void {
    const now = new Date().toISOString();
    const valueJson = JSON.stringify(value);
    this.database.run(
      `INSERT INTO settings (key, value_json, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at`,
      [key, valueJson, now],
    );
  }

  health(): DatabaseHealth {
    const row = this.database.get<{ count: number }>('SELECT COUNT(*) AS count FROM schema_migrations');
    return { healthy: true, migrationCount: Number(row?.count ?? 0), databasePath: this.workspace.databaseFile };
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
