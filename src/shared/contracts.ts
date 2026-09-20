import type { CatalogApi, QuoteApi } from './commercial';
import type { CrmApi } from './crm';
import type { ClientDocumentsApi } from './clientDocuments';
import type { HourPackShortfallApi } from './hourPackShortfall';
import type { MaintenanceOverageApi } from './maintenanceOverage';
import type { MaintenanceReportApi } from './maintenanceReport';
import type { OperationsApi } from './operations';
import type { OperationsAlertsApi } from './operationsAlerts';
import type { ProjectsApi } from './projects';
import type { ReferentialsApi } from './referentials';
import type { BusinessBackupsApi } from './businessBackups';
import type { BusinessBackupAlertsApi } from './businessBackupAlerts';
import type { TimeApi } from './time';

export const THEME_NAMES = ['atoumweb', 'noir', 'blanc'] as const;
export const DISPLAY_DENSITIES = ['compact', 'comfort', 'comfort_plus'] as const;

export type ThemeName = (typeof THEME_NAMES)[number];
export type DisplayDensity = (typeof DISPLAY_DENSITIES)[number];

export function isThemeName(value: unknown): value is ThemeName {
  return typeof value === 'string' && THEME_NAMES.includes(value as ThemeName);
}

export function isDisplayDensity(value: unknown): value is DisplayDensity {
  return typeof value === 'string' && DISPLAY_DENSITIES.includes(value as DisplayDensity);
}

export interface DatabaseHealth {
  healthy: boolean;
  migrationCount: number;
  databasePath: string;
}

export interface BootstrapState {
  appVersion: string;
  workspacePath: string;
  databasePath: string;
  theme: ThemeName;
  displayDensity: DisplayDensity;
  database: DatabaseHealth;
}

export interface WorkspaceChangeResult {
  cancelled: boolean;
  workspacePath?: string;
  restartRequired?: boolean;
}

export interface BackupResult {
  path: string;
  createdAt: string;
}

export interface RestoreScheduleResult {
  cancelled: boolean;
  sourcePath?: string;
  restartScheduled?: boolean;
}

export interface AtoumWebApi {
  workflow: import('./workflow').WorkflowApi;
  app: {
    getBootstrap(): Promise<BootstrapState>;
    openProspectReferenceWindow(id: string): Promise<void>;
  };
  settings: {
    setTheme(theme: ThemeName): Promise<ThemeName>;
    setDisplayDensity(density: DisplayDensity): Promise<DisplayDensity>;
  };
  workspace: {
    choose(): Promise<WorkspaceChangeResult>;
  };
  backups: {
    createManual(): Promise<BackupResult>;
    restore(): Promise<RestoreScheduleResult>;
  };
  businessBackups: BusinessBackupsApi;
  businessBackupAlerts: BusinessBackupAlertsApi;
  database: {
    health(): Promise<DatabaseHealth>;
  };
  crm: CrmApi;
  clientDocuments: ClientDocumentsApi;
  catalog: CatalogApi;
  quotes: QuoteApi;
  projects: ProjectsApi;
  referentials: ReferentialsApi;
  operations: OperationsApi;
  hourPackShortfalls: HourPackShortfallApi;
  maintenanceOverages: MaintenanceOverageApi;
  maintenanceReports: MaintenanceReportApi;
  operationsAlerts: OperationsAlertsApi;
  time: TimeApi;
}
