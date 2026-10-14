import type { BillingApi } from './billing';
import type { ExpensesApi } from './expenses';
import type { CatalogApi, QuoteApi } from './commercial';
import type { CatalogCategoryApi } from './catalogCategoryAdministration';
import type { ContractTypesApi } from './contractTypes';
import type { ContractTermsApi } from './contractTerms';
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
import type { AnalyticsApi } from './analytics';
import type { TimeApi } from './time';
import type { BridgeSnapshotsApi } from './bridgeSnapshots';

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
  showHoverHelp: boolean;
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
  unsaved: {confirmExit(labels:string[],pending:boolean):boolean;publishState(state:import('./unsavedWindows').UnsavedWindowState):boolean};
  workflow: import('./workflow').WorkflowApi;
  app: {
    getBootstrap(): Promise<BootstrapState>;
    openProspectReferenceWindow(id: string): Promise<void>;
  };
  visualPreferences: import("./shellVisualPreferences").ShellVisualPreferencesApi;
  settings: {
    setTheme(theme: ThemeName): Promise<ThemeName>;
    setDisplayDensity(density: DisplayDensity): Promise<DisplayDensity>;
    setShowHoverHelp(enabled: boolean): Promise<boolean>;
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
  analytics: AnalyticsApi;
  database: {
    health(): Promise<DatabaseHealth>;
  };
  bridgeSnapshots: BridgeSnapshotsApi;
  crm: CrmApi;
  clientDocuments: ClientDocumentsApi;
  billing: BillingApi;
  expenses: ExpensesApi;
  catalog: CatalogApi;
  catalogCategories: CatalogCategoryApi;
  contractTerms: ContractTermsApi;
  contractTypes: ContractTypesApi;
  quotes: QuoteApi;
  quotePreparation: import('./quoteContractPreparation').QuoteContractPreparationApi;
  projects: ProjectsApi;
  referentials: ReferentialsApi;
  operations: OperationsApi;
  hourPackShortfalls: HourPackShortfallApi;
  maintenanceOverages: MaintenanceOverageApi;
  maintenanceReports: MaintenanceReportApi;
  operationsAlerts: OperationsAlertsApi;
  time: TimeApi;
}
