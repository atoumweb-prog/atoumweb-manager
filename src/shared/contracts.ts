import type { CatalogApi, QuoteApi } from './commercial';
import type { CrmApi } from './crm';
import type { MaintenanceOverageApi } from './maintenanceOverage';
import type { OperationsApi } from './operations';
import type { OperationsAlertsApi } from './operationsAlerts';
import type { ProjectsApi } from './projects';
import type { TimeApi } from './time';

export const THEME_NAMES = ['atoumweb', 'noir', 'blanc'] as const;

export type ThemeName = (typeof THEME_NAMES)[number];

export function isThemeName(value: unknown): value is ThemeName {
  return typeof value === 'string' && THEME_NAMES.includes(value as ThemeName);
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
  app: {
    getBootstrap(): Promise<BootstrapState>;
  };
  settings: {
    setTheme(theme: ThemeName): Promise<ThemeName>;
  };
  workspace: {
    choose(): Promise<WorkspaceChangeResult>;
  };
  backups: {
    createManual(): Promise<BackupResult>;
    restore(): Promise<RestoreScheduleResult>;
  };
  database: {
    health(): Promise<DatabaseHealth>;
  };
  crm: CrmApi;
  catalog: CatalogApi;
  quotes: QuoteApi;
  projects: ProjectsApi;
  operations: OperationsApi;
  maintenanceOverages: MaintenanceOverageApi;
  operationsAlerts: OperationsAlertsApi;
  time: TimeApi;
}
