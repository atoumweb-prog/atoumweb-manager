import { app, dialog, ipcMain } from 'electron';
import type {
  CatalogFilters,
  CatalogItemInput,
  CatalogItemStatus,
  CatalogVersionInput,
  OfferComponentInput,
  QuoteFilters,
  QuoteInput,
  QuoteLineInput,
} from '../shared/commercial';
import type {
  BackupResult,
  BootstrapState,
  RestoreScheduleResult,
  ThemeName,
  WorkspaceChangeResult,
} from '../shared/contracts';
import { isThemeName } from '../shared/contracts';
import type {
  ClientContactRole,
  ClientFilters,
  ClientInput,
  ClientStatus,
  ContactInput,
  CrmActionFilters,
  CrmActionInput,
  OrganizationInput,
  ProspectFilters,
  ProspectInput,
  ProspectStage,
  SearchResult,
} from '../shared/crm';
import { generateQuotePdf } from './commercial/quotePdf';
import type { DatabaseService } from './database/DatabaseService';
import { scheduleDatabaseRestore } from './restore';
import { saveWorkspaceRoot, type WorkspacePaths } from './workspace';

export function registerIpcHandlers(database: DatabaseService, workspace: WorkspacePaths): void {
  ipcMain.handle('app:get-bootstrap', (): BootstrapState => {
    const storedTheme = database.getSetting<unknown>('theme', 'atoumweb');
    const theme: ThemeName = isThemeName(storedTheme) ? storedTheme : 'atoumweb';
    return { appVersion: app.getVersion(), workspacePath: workspace.root, databasePath: workspace.databaseFile, theme, database: database.health() };
  });

  ipcMain.handle('settings:set-theme', (_event, value: unknown): ThemeName => {
    if (!isThemeName(value)) throw new Error('Thème invalide.');
    database.setSetting('theme', value); return value;
  });

  ipcMain.handle('workspace:choose', async (): Promise<WorkspaceChangeResult> => {
    const result = await dialog.showOpenDialog({ title: 'Choisir le dossier AtoumWeb Manager', defaultPath: workspace.root, properties: ['openDirectory'] });
    if (result.canceled || result.filePaths.length === 0) return { cancelled: true };
    const nextWorkspace = saveWorkspaceRoot(result.filePaths[0]);
    return { cancelled: false, workspacePath: nextWorkspace.root, restartRequired: nextWorkspace.root !== workspace.root };
  });

  ipcMain.handle('backups:create-manual', async (): Promise<BackupResult> => {
    const path = await database.createBackup('manual'); return { path, createdAt: new Date().toISOString() };
  });

  ipcMain.handle('backups:restore', async (): Promise<RestoreScheduleResult> => {
    const selection = await dialog.showOpenDialog({ title: 'Restaurer une sauvegarde AtoumWeb Manager', defaultPath: workspace.backupsDirectory, properties: ['openFile'], filters: [{ name: 'Sauvegarde SQLite', extensions: ['sqlite', 'db'] }] });
    if (selection.canceled || selection.filePaths.length === 0) return { cancelled: true };
    const sourcePath = selection.filePaths[0];
    const packaged = app.isPackaged;
    const confirmation = await dialog.showMessageBox({
      type: 'warning', buttons: [packaged ? 'Restaurer et redémarrer' : 'Programmer la restauration', 'Annuler'], defaultId: 1, cancelId: 1,
      title: 'Confirmer la restauration', message: 'Restaurer cette sauvegarde ?',
      detail: packaged
        ? 'La base actuelle sera d’abord sauvegardée automatiquement dans le dossier pre-restore, puis l’application redémarrera.'
        : 'La base actuelle sera d’abord sauvegardée automatiquement dans le dossier pre-restore au prochain démarrage. En mode développement, ferme ensuite AtoumWeb Manager puis relance « npm start » pour appliquer la restauration.',
    });
    if (confirmation.response !== 0) return { cancelled: true };
    scheduleDatabaseRestore(sourcePath);
    if (packaged) { setTimeout(() => { app.relaunch(); app.exit(0); }, 150); return { cancelled: false, sourcePath, restartScheduled: true }; }
    return { cancelled: false, sourcePath, restartScheduled: false };
  });

  ipcMain.handle('database:health', () => database.health());

  ipcMain.handle('crm:organizations:create', (_event, input: OrganizationInput) => database.crm.createOrganization(input));
  ipcMain.handle('crm:organizations:update', (_event, id: string, input: OrganizationInput) => database.crm.updateOrganization(id, input));
  ipcMain.handle('crm:contacts:create', (_event, input: ContactInput) => database.crm.createContact(input));
  ipcMain.handle('crm:contacts:update', (_event, id: string, input: ContactInput) => database.crm.updateContact(id, input));
  ipcMain.handle('crm:prospects:list', (_event, filters?: ProspectFilters) => database.crm.listProspects(filters));
  ipcMain.handle('crm:prospects:create', (_event, input: ProspectInput) => database.crm.createProspect(input));
  ipcMain.handle('crm:prospects:update', (_event, id: string, input: ProspectInput) => database.crm.updateProspect(id, input));
  ipcMain.handle('crm:prospects:change-stage', (_event, id: string, stage: ProspectStage, lostReason?: string | null) => database.crm.changeProspectStage(id, stage, lostReason));
  ipcMain.handle('crm:prospects:set-next-action', (_event, id: string, at: string | null, text: string | null) => database.crm.setProspectNextAction(id, at, text));
  ipcMain.handle('crm:prospects:convert-to-client', (_event, id: string) => database.crm.convertProspectToClient(id));
  ipcMain.handle('crm:clients:list', (_event, filters?: ClientFilters) => database.crm.listClients(filters));
  ipcMain.handle('crm:clients:create', (_event, input: ClientInput) => database.crm.createClient(input));
  ipcMain.handle('crm:clients:update', (_event, id: string, input: ClientInput) => database.crm.updateClient(id, input));
  ipcMain.handle('crm:clients:archive', (_event, id: string) => database.crm.archiveClient(id));
  ipcMain.handle('crm:clients:reactivate', (_event, id: string, status: Exclude<ClientStatus, 'archived'>) => database.crm.reactivateClient(id, status));
  ipcMain.handle('crm:clients:list-contacts', (_event, id: string) => database.clientContacts.list(id));
  ipcMain.handle('crm:clients:add-contact', (_event, id: string, input: ContactInput, role: ClientContactRole, makePrimary?: boolean) => database.clientContacts.add(id, input, role, makePrimary));
  ipcMain.handle('crm:clients:set-primary-contact', (_event, id: string, contactId: string) => database.clientContacts.setPrimary(id, contactId));
  ipcMain.handle('crm:actions:list', (_event, filters?: CrmActionFilters) => database.actions.list(filters));
  ipcMain.handle('crm:actions:create', (_event, input: CrmActionInput) => database.actions.create(input));
  ipcMain.handle('crm:actions:complete', (_event, id: string) => database.actions.complete(id));
  ipcMain.handle('crm:actions:cancel', (_event, id: string) => database.actions.cancel(id));
  ipcMain.handle('crm:actions:reopen', (_event, id: string) => database.actions.reopen(id));
  ipcMain.handle('crm:activity:list', (_event, entityType: string, entityId: string) => database.crm.listActivity(entityType, entityId));
  ipcMain.handle('crm:search:global', (_event, query: string): SearchResult[] => {
    const normalized = query.trim();
    if (normalized.length < 2) return [];
    const crmResults = database.crm.globalSearch(normalized);
    const catalogResults: SearchResult[] = database.catalog.list({ search: normalized }).slice(0, 6).map((item) => ({
      entityType: 'catalog',
      entityId: item.id,
      title: item.name,
      subtitle: `${item.type === 'offer' ? 'Offre' : 'Service'}${item.category ? ` · ${item.category}` : ''}`,
      status: item.status,
    }));
    const quoteResults: SearchResult[] = database.quotes.list({ search: normalized }).slice(0, 6).map((quote) => ({
      entityType: 'quote',
      entityId: quote.id,
      title: `${quote.number} · ${quote.subject}`,
      subtitle: quote.ownerLabel,
      status: quote.status,
    }));
    return [...crmResults, ...catalogResults, ...quoteResults].slice(0, 20);
  });
  ipcMain.handle('crm:search:rebuild', () => database.crm.rebuildSearchIndex());

  ipcMain.handle('catalog:list', (_event, filters?: CatalogFilters) => database.catalog.list(filters));
  ipcMain.handle('catalog:get-item', (_event, id: string) => database.catalog.getItem(id));
  ipcMain.handle('catalog:create', (_event, input: CatalogItemInput, firstVersion: CatalogVersionInput) => database.catalog.create(input, firstVersion));
  ipcMain.handle('catalog:create-version', (_event, itemId: string, input: CatalogVersionInput) => database.catalog.createVersion(itemId, input));
  ipcMain.handle('catalog:publish-version', (_event, versionId: string) => database.catalog.publishVersion(versionId));
  ipcMain.handle('catalog:set-status', (_event, itemId: string, status: CatalogItemStatus) => database.catalog.setStatus(itemId, status));
  ipcMain.handle('catalog:set-visible-public', (_event, itemId: string, visible: boolean) => database.catalog.setVisiblePublic(itemId, visible));
  ipcMain.handle('catalog:list-offer-components', (_event, offerVersionId: string) => database.catalog.listOfferComponents(offerVersionId));
  ipcMain.handle('catalog:set-offer-components', (_event, offerVersionId: string, components: OfferComponentInput[]) => database.catalog.setOfferComponents(offerVersionId, components));

  ipcMain.handle('quotes:list', (_event, filters?: QuoteFilters) => database.quotes.list(filters));
  ipcMain.handle('quotes:get', (_event, id: string) => database.quotes.get(id));
  ipcMain.handle('quotes:create', (_event, input: QuoteInput) => database.quotes.create(input));
  ipcMain.handle('quotes:add-catalog-line', (_event, quoteId: string, catalogVersionId: string, input?: Partial<QuoteLineInput>) => database.quotes.addCatalogLine(quoteId, catalogVersionId, input));
  ipcMain.handle('quotes:add-custom-line', (_event, quoteId: string, input: QuoteLineInput) => database.quotes.addCustomLine(quoteId, input));
  ipcMain.handle('quotes:update-line', (_event, lineId: string, input: QuoteLineInput) => database.quotes.updateLine(lineId, input));
  ipcMain.handle('quotes:remove-line', (_event, lineId: string) => database.quotes.removeLine(lineId));
  ipcMain.handle('quotes:update-conditions', (_event, quoteId: string, input: Partial<QuoteInput>) => database.quotes.updateConditions(quoteId, input));
  ipcMain.handle('quotes:mark-sent', (_event, id: string) => database.quotes.markSent(id));
  ipcMain.handle('quotes:mark-viewed', (_event, id: string) => database.quotes.markViewed(id));
  ipcMain.handle('quotes:accept', (_event, id: string) => database.quotes.accept(id));
  ipcMain.handle('quotes:refuse', (_event, id: string) => database.quotes.refuse(id));
  ipcMain.handle('quotes:expire', (_event, id: string) => database.quotes.expire(id));
  ipcMain.handle('quotes:duplicate', (_event, id: string) => database.quotes.duplicate(id));
  ipcMain.handle('quotes:generate-pdf', async (_event, id: string) => generateQuotePdf(database.quotes.get(id), workspace));
}
