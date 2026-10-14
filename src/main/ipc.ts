import { registerShellVisualPreferences } from './shellVisualPreferencesIpc';
import {registerUnsavedConfirmationIpc,unsavedWindows} from './unsaved';
import { restoreQuitGate } from './restoreQuitGate';
import type { ContractAdministration, QuoteContractParameters, ContractDocumentLinkInput, ContractDocumentRole } from '../shared/quoteContractPreparation';
import { app, clipboard, dialog, ipcMain, safeStorage, shell } from 'electron';
import type { BridgeNodeMatchDecisionInput } from '../shared/bridgeSnapshots';
import { readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { quoteContractText } from '../shared/contractTerms';
import { compareWordDraftText, prepareWordDraftManifest, type WordDraftManifest } from './commercial/wordDraftReview';
import { makeWordDraftDocx, parseWordDraftDocx } from './commercial/wordDocxCodec';
import { saveWordDraftWorkingPdf } from './commercial/wordDraftPdf';
import { randomUUID } from 'node:crypto';
import type { BillingInvoiceInput, BillingItemFilters, BillingItemStatus } from '../shared/billing';
import type { ExpenseFilters, ExpenseInput, ExpenseStatus } from '../shared/expenses';
import type {
  ContractClauseAudience,
  ContractClauseStatus,
  ContractClauseTemplateInput,
  ContractClauseVersionInput,
  QuoteContractClauseInput,
  QuoteContractClauseUpdate,
} from '../shared/contractTerms';
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
  DisplayDensity,
  RestoreScheduleResult,
  ThemeName,
  WorkspaceChangeResult,
} from '../shared/contracts';
import { isDisplayDensity, isThemeName } from '../shared/contracts';
import type {
  ClientContactRole,
  ClientFilters,
  ClientInput,
  ClientStatus,
  ContactInput,
  CrmActionFilters,
  CrmActionInput,
  CompleteActionInput,
  ContactMethodInput,
  CrmIdentityAssetRole,
  CrmIdentityOwnerType,
  OrganizationInput,
  ProspectFilters,
  ProspectInput,
  ProspectProjectBrief,
  ProspectQualificationBrief,
  ProspectResearchSnapshotInput,
  ProspectStage,
  SearchResult,
} from '../shared/crm';
import type {ClientDocumentInput} from '../shared/clientDocuments';
import type {
  InternalProjectInput,
  MoveProjectNodeInput,
  ProjectFilters,
  ProjectNodeInput,
  ProjectPrerequisiteInput,
  ProjectPrerequisiteStatus,
  ProjectResourceFolder,
  ProjectResourceRole,
  ProjectResourceStatus,
  ProjectSiteInput,
  ProjectSitePageInput,
  ProjectStatus,
  ProjectTechnicalItemInput,
  ProjectTechnicalVersionInput,
  ProjectTemplateInput,
  ProjectTemplateNodeInput,
  ProjectTemplateSiteInput,
  TransformQuoteToProjectInput,
} from '../shared/projects';
import type { ManualTimeSessionInput, StartTimeSessionInput, TimePauseReason, TimeSessionFilters } from '../shared/time';
import type { AnalyticsPeriodInput } from '../shared/analytics';
import { generateQuotePdf } from './commercial/quotePdf';
import type { DatabaseService } from './database/DatabaseService';
import { scheduleDatabaseRestore, validateRestoreSource } from './restore';
import { saveWorkspaceRoot, type WorkspacePaths } from './workspace';

export function registerIpcHandlers(database: DatabaseService, workspace: WorkspacePaths): void {
  registerUnsavedConfirmationIpc();
  registerShellVisualPreferences(database);
  ipcMain.handle('workflow:needs', (_event, owner, id) => database.workflow.needs(owner,id));
  ipcMain.handle('workflow:save-need', (_event, owner, id, input, needId) => database.workflow.saveNeed(owner,id,input,needId));
  ipcMain.handle('workflow:remove-need', (_event, owner, id, needId) => database.workflow.removeNeed(owner,id,needId));
  ipcMain.handle('workflow:identity', (_event, owner, id) => database.workflow.identity(owner,id));
  ipcMain.handle('workflow:archive-prospect', (_event, id, archived) => database.workflow.archiveProspect(id,Boolean(archived)));
  ipcMain.handle('workflow:dashboard', () => database.workflow.dashboard());
  ipcMain.handle('workflow:begin-demo-capture', (_event, label: string) => database.demo.beginCapture(label));
  ipcMain.handle('workflow:end-demo-capture', (_event, batch: string) => database.demo.endCapture(batch));
  ipcMain.handle('workflow:create-demo', (_event, scenario) => database.demo.create(scenario,database));
  ipcMain.handle('workflow:demo-summary', () => database.demo.summary());
  ipcMain.handle('workflow:reset-demo', async () => {
    const summary=database.demo.summary();
    if(!summary.total) return {cancelled:true};
    const confirmation=await dialog.showMessageBox({type:'warning',title:'Réinitialiser les données de test',message:'Supprimer uniquement les données marquées demo ?',detail:summary.counts.map(row=>row.table+' : '+row.count).join('\n')+'\n\nCatalogue, prix, modèles, paramètres et fichiers physiques conservés. Une sauvegarde SQLite sera créée avant suppression.',buttons:['Annuler','Sauvegarder et supprimer les données demo'],defaultId:0,cancelId:0});
    if(confirmation.response!==1) return {cancelled:true};
    const result=await database.demo.reset(()=>database.createBackup('manual'));
    database.crm.rebuildSearchIndex();
    return {cancelled:false,...result};
  });
  ipcMain.handle('app:get-bootstrap', (): BootstrapState => {
    const storedTheme = database.getSetting<unknown>('theme', 'atoumweb');
    const storedDensity = database.getSetting<unknown>('display_density', 'comfort');
    const theme: ThemeName = isThemeName(storedTheme) ? storedTheme : 'atoumweb';
    const displayDensity: DisplayDensity = isDisplayDensity(storedDensity) ? storedDensity : 'comfort';
    const showHoverHelp = database.getSetting<boolean>('show_hover_help', true) !== false;
    return { appVersion: app.getVersion(), workspacePath: workspace.root, databasePath: workspace.databaseFile, theme, displayDensity, showHoverHelp, database: database.health() };
  });

  ipcMain.handle('settings:set-theme', (_event, value: unknown): ThemeName => {
    if (!isThemeName(value)) throw new Error('Thème invalide.');
    database.setSetting('theme', value);
    return value;
  });

  ipcMain.handle('settings:set-display-density', (_event, value: unknown): DisplayDensity => {
    if (!isDisplayDensity(value)) throw new Error('Densité d’affichage invalide.');
    database.setSetting('display_density', value);
    return value;
  });

  ipcMain.handle('settings:set-show-hover-help', (_event, enabled: unknown): boolean => {
    const value = Boolean(enabled);
    database.setSetting('show_hover_help', value);
    return value;
  });

  ipcMain.handle('workspace:choose', async (): Promise<WorkspaceChangeResult> => {
    const ticket=unsavedWindows.approveAll();if(!ticket)return {cancelled:true};
    const result = await dialog.showOpenDialog({ title: 'Choisir le dossier AtoumWeb Manager', defaultPath: workspace.root, properties: ['openDirectory'] });
    if (result.canceled || result.filePaths.length === 0) return { cancelled: true };
    const currentTicket=unsavedWindows.refreshApproval(ticket);if(!currentTicket)return {cancelled:true};
    const nextWorkspace = saveWorkspaceRoot(result.filePaths[0]);
    if(nextWorkspace.root!==workspace.root)unsavedWindows.remember(currentTicket);
    return { cancelled: false, workspacePath: nextWorkspace.root, restartRequired: nextWorkspace.root !== workspace.root };
  });

  ipcMain.handle('backups:create-manual', async (): Promise<BackupResult> => {
    const path = await database.createBackup('manual');
    return { path, createdAt: new Date().toISOString() };
  });

  ipcMain.handle('backups:restore', async (): Promise<RestoreScheduleResult> => {
    const ticket=unsavedWindows.approveAll();if(!ticket)return {cancelled:true};
    const selection = await dialog.showOpenDialog({ title: 'Restaurer une sauvegarde AtoumWeb Manager', defaultPath: workspace.backupsDirectory, properties: ['openFile'], filters: [{ name: 'Sauvegarde SQLite', extensions: ['sqlite', 'db'] }] });
    if (selection.canceled || selection.filePaths.length === 0) return { cancelled: true };
    const sourcePath = selection.filePaths[0];
    const packaged = app.isPackaged;
    const confirmation = await dialog.showMessageBox({
      type: 'warning',
      buttons: [packaged ? 'Restaurer et redémarrer' : 'Programmer la restauration', 'Annuler'],
      defaultId: 1,
      cancelId: 1,
      title: 'Confirmer la restauration',
      message: 'Restaurer cette sauvegarde ?',
      detail: packaged
        ? `Destination : ${workspace.databaseFile}\nLa base actuelle sera d’abord sauvegardée automatiquement dans le dossier pre-restore, puis l’application redémarrera. Un changement de workspace fera refuser cette demande.`
        : `Destination : ${workspace.databaseFile}\nLa base actuelle sera d’abord sauvegardée automatiquement dans le dossier pre-restore au prochain démarrage. En mode développement, ferme ensuite AtoumWeb Manager puis relance « npm start ». Un changement de workspace fera refuser cette demande.`,
    });
    if (confirmation.response !== 0) return { cancelled: true };
    const currentTicket=unsavedWindows.refreshApproval(ticket);if(!currentTicket)return {cancelled:true};
    if (packaged) {
      // Check the source while the window is still open so an invalid file
      // does not cause the Manager to close before explaining the failure.
      validateRestoreSource(sourcePath);
      const quitToken = restoreQuitGate.arm(() => {
        // Only will-quit reaches here, after before-quit and all unload guards.
        scheduleDatabaseRestore(sourcePath, workspace);
        app.relaunch();
      });
      unsavedWindows.remember(currentTicket);
      setTimeout(() => {
        if (restoreQuitGate.isActive(quitToken)) app.quit();
      }, 150);
      return { cancelled: false, sourcePath, restartScheduled: true };
    }
    // Development mode explicitly programs a restore for the next manual start.
    scheduleDatabaseRestore(sourcePath, workspace);
    unsavedWindows.remember(currentTicket);
    return { cancelled: false, sourcePath, restartScheduled: false };
  });

  ipcMain.handle('database:health', () => database.health());
  ipcMain.handle('analytics:financial-snapshot', (_event, input: AnalyticsPeriodInput) => database.analytics.financialSnapshot(input));
  ipcMain.handle('analytics:commercial-snapshot', (_event, input: AnalyticsPeriodInput) => database.analytics.commercialSnapshot(input));
  ipcMain.handle('analytics:project-time-snapshot', (_event, input: AnalyticsPeriodInput) => database.analytics.projectTimeSnapshot(input));
  ipcMain.handle('analytics:definitions', () => database.analytics.definitions());

  ipcMain.handle('bridge:inspect-import', async () => {
    const selection = await dialog.showOpenDialog({
      title: 'Importer un snapshot AtoumWeb Bridge',
      defaultPath: workspace.root,
      properties: ['openFile'],
      filters: [{ name: 'Snapshot AtoumWeb Bridge', extensions: ['zip'] }],
    });
    if (selection.canceled || selection.filePaths.length === 0) return null;
    return database.bridgeSnapshots.inspectPackage(selection.filePaths[0]);
  });
  ipcMain.handle('bridge:import', (_event, packagePath: string) => database.bridgeSnapshots.importPackage(packagePath));
  ipcMain.handle('bridge:sites:list', () => database.bridgeSnapshots.listSites());
  ipcMain.handle('bridge:sites:get', (_event, id: string) => database.bridgeSnapshots.getSite(id));
  ipcMain.handle('bridge:pages:list', (_event, snapshotId: string, search?: string | null) => database.bridgeSnapshots.listPages(snapshotId, search));
  ipcMain.handle('bridge:pages:get', (_event, pageSnapshotId: string) => database.bridgeSnapshots.getPage(pageSnapshotId));
  ipcMain.handle('bridge:objects:preview', (_event, objectRef: string) => database.bridgeSnapshots.getObjectPreview(objectRef));
  ipcMain.handle('bridge:modules:preview', (_event, pageSnapshotId: string, occurrenceId: string) => database.bridgeSnapshots.getModulePreview(pageSnapshotId, occurrenceId));
  ipcMain.handle('bridge:pages:preview', (_event, pageSnapshotId: string) => database.bridgeSnapshots.getPagePreview(pageSnapshotId));
  ipcMain.handle('bridge:snapshots:compare', (_event, beforeSnapshotId: string, afterSnapshotId: string) =>
    database.bridgeSnapshots.compareSnapshots(beforeSnapshotId, afterSnapshotId));
  ipcMain.handle('bridge:pages:review-node-matches', (_event, beforePageSnapshotId: string, afterPageSnapshotId: string) =>
    database.bridgeSnapshots.reviewPageNodeMatches(beforePageSnapshotId, afterPageSnapshotId));
  ipcMain.handle('bridge:pages:decide-node-match', (_event, input: BridgeNodeMatchDecisionInput) =>
    database.bridgeSnapshots.decideNodeMatch(input));
  ipcMain.handle('bridge:export-diagnostic', async (_event, snapshotId: string) => {
    const diagnostic = database.bridgeSnapshots.buildDiagnostic(snapshotId);
    const site = diagnostic.site as { name?: string } | undefined;
    const snapshot = diagnostic.snapshot as { generatedAt?: string } | undefined;
    const safeName = String(site?.name ?? 'site').normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'site';
    const date = String(snapshot?.generatedAt ?? new Date().toISOString()).slice(0, 10);
    const selection = await dialog.showSaveDialog({
      title: 'Exporter le diagnostic Bridge',
      defaultPath: join(workspace.root, `bridge-diagnostic-${safeName}-${date}.json`),
      filters: [{ name: 'Diagnostic Bridge JSON', extensions: ['json'] }],
    });
    if (selection.canceled || !selection.filePath) return { cancelled: true };
    writeFileSync(selection.filePath, `${JSON.stringify(diagnostic, null, 2)}\n`, 'utf8');
    return { cancelled: false, path: selection.filePath };
  });

  ipcMain.handle('crm:directory:save-existing',(_event,...args:Parameters<typeof database.crm.saveExistingDirectoryIdentities>)=>database.crm.saveExistingDirectoryIdentities(...args));
  ipcMain.handle('crm:directory:save-organization',(_event,...args:Parameters<typeof database.crm.saveDirectoryOrganization>)=>database.crm.saveDirectoryOrganization(...args));
  ipcMain.handle('crm:directory:save-contact',(_event,...args:Parameters<typeof database.crm.saveDirectoryContact>)=>database.crm.saveDirectoryContact(...args));
  ipcMain.handle('crm:directory:verification',(_event,...args:Parameters<typeof database.crm.directoryVerification>)=>database.crm.directoryVerification(...args));
  ipcMain.handle('crm:directory:verify',(_event,...args:Parameters<typeof database.crm.verifyDirectoryIdentity>)=>database.crm.verifyDirectoryIdentity(...args));
  ipcMain.handle('crm:organizations:list', (_event, includeArchived?: boolean) => database.crm.listDirectoryOrganizations(includeArchived));
  ipcMain.handle('crm:organizations:get', (_event, id: string) => database.crm.getDirectoryOrganization(id));
  ipcMain.handle('crm:organizations:create', (_event, input: OrganizationInput) => database.crm.createOrganization(input));
  ipcMain.handle('crm:organizations:update', (_event, id: string, input: OrganizationInput) => database.crm.updateOrganization(id, input));
  ipcMain.handle('crm:contacts:list', (_event, includeArchived?: boolean) => database.crm.listDirectoryContacts(includeArchived));
  ipcMain.handle('crm:contacts:get', (_event, id: string) => database.crm.getDirectoryContact(id));
  ipcMain.handle('crm:contacts:create', (_event, input: ContactInput) => database.crm.createContact(input));
  ipcMain.handle('crm:contacts:create-and-attach-primary-prospect', (_event, prospectId: string, input: ContactInput) => database.crm.createAndAttachPrimaryProspectContact(prospectId, input));
  ipcMain.handle('crm:contacts:create-and-attach-decision-prospect', (_event, prospectId: string, input: ContactInput) => database.crm.createAndAttachDecisionProspectContact(prospectId, input));
  ipcMain.handle('crm:contacts:update', (_event, id: string, input: ContactInput) => database.crm.updateContact(id, input));
  ipcMain.handle('crm:contact-methods:list',(_event,owner:'organization'|'contact',id:string,includeArchived?:boolean)=>database.crm.listContactMethods(owner,id,includeArchived));
  ipcMain.handle('crm:contact-methods:save',(_event,input:ContactMethodInput,id?:string)=>database.crm.saveContactMethod(input,id));
  ipcMain.handle('crm:contact-methods:archive',(_event,id:string,archived?:boolean)=>database.crm.archiveContactMethod(id,archived));
  ipcMain.handle('crm:identity-assets:list', (_event, owner: CrmIdentityOwnerType, id: string) => database.crmIdentityAssets.list(owner, id));
  ipcMain.handle('crm:identity-assets:import', async (_event, owner: CrmIdentityOwnerType, id: string, role: CrmIdentityAssetRole) => {
    const selection = await dialog.showOpenDialog({
      title: role === 'logo' ? 'Choisir le logo' : role === 'favicon' ? 'Choisir la favicon' : 'Choisir la photo',
      defaultPath: workspace.root,
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'ico'] }],
    });
    if (selection.canceled || selection.filePaths.length === 0) return null;
    return database.crmIdentityAssets.importFilePath(owner, id, role, selection.filePaths[0]);
  });
  ipcMain.handle('crm:identity-assets:preview', (_event, assetId: string) => database.crmIdentityAssets.preview(assetId));
  ipcMain.handle('crm:identity-assets:remove', (_event, assetId: string) => database.crmIdentityAssets.remove(assetId));
  ipcMain.handle('crm:prospects:list', (_event, filters?: ProspectFilters) => database.crm.listProspects(filters));
  ipcMain.handle('crm:prospects:create', (_event, input: ProspectInput) => database.crm.createProspect(input));
  ipcMain.handle('crm:prospects:update', (_event, id: string, input: ProspectInput) => database.crm.updateProspect(id, input));
  ipcMain.handle('crm:prospects:update-qualification',(_event,id:string,input:Partial<ProspectInput>)=>{
    if (Object.prototype.hasOwnProperty.call(input,'decisionMakerContactId')) {
      database.workflow.setDecisionMaker(id,input.decisionMakerContactId?.trim() || null);
    }
    return database.crm.updateProspectQualification(id,input);
  });
  ipcMain.handle('crm:prospects:update-missing-information-if-unchanged', (_event, id: string, expected: string | null, next: string | null) => database.crm.updateProspectMissingInformationIfUnchanged(id, expected, next));
  ipcMain.handle('crm:prospects:update-project-brief-if-unchanged', (_event, id: string, expected: ProspectProjectBrief, next: ProspectProjectBrief) => database.crm.updateProspectProjectBriefIfUnchanged(id, expected, next));
  ipcMain.handle('crm:prospects:update-qualification-brief-if-unchanged', (_event, id: string, expected: ProspectQualificationBrief, next: ProspectQualificationBrief) => database.crm.updateProspectQualificationBriefIfUnchanged(id, expected, next));
  ipcMain.handle('crm:prospects:change-stage', (_event, id: string, stage: ProspectStage, lostReason?: string | null, allowIncompleteQualification?: boolean) => database.crm.changeProspectStage(id, stage, lostReason, Boolean(allowIncompleteQualification)));
  ipcMain.handle('crm:prospects:set-next-action', (_event, id: string, at: string | null, text: string | null) => database.crm.setProspectNextAction(id, at, text));
  ipcMain.handle('crm:prospects:convert-to-client', (_event, id: string) => database.crm.convertProspectToClient(id));
  ipcMain.handle('crm:prospects:research:list', (_event, id: string) => database.crm.listProspectResearchSnapshots(id));
  ipcMain.handle('crm:prospects:research:save', (_event, id: string, input: ProspectResearchSnapshotInput) => database.crm.saveProspectResearchSnapshot(id, input));
  ipcMain.handle('crm:clients:list', (_event, filters?: ClientFilters) => database.crm.listClients(filters));
  ipcMain.handle('crm:clients:create', (_event, input: ClientInput) => database.crm.createClient(input));
  ipcMain.handle('crm:clients:update-relationship-if-unchanged', (_event,id:string,expected:Parameters<typeof database.crm.updateClientRelationshipIfUnchanged>[1],next:Parameters<typeof database.crm.updateClientRelationshipIfUnchanged>[2])=>database.crm.updateClientRelationshipIfUnchanged(id,expected,next));
  ipcMain.handle('crm:clients:update', (_event, id: string, input: ClientInput) => database.crm.updateClient(id, input));
  ipcMain.handle('crm:clients:archive', (_event, id: string) => database.crm.archiveClient(id));
  ipcMain.handle('crm:clients:reactivate', (_event, id: string, status: Exclude<ClientStatus, 'archived'>) => database.crm.reactivateClient(id, status));
  ipcMain.handle('crm:clients:list-contacts', (_event, id: string) => database.clientContacts.list(id));
  ipcMain.handle('crm:clients:add-contact', (_event, id: string, input: ContactInput, role: ClientContactRole, makePrimary?: boolean) => database.clientContacts.add(id, input, role, makePrimary));
  ipcMain.handle('crm:clients:set-primary-contact', (_event, id: string, contactId: string) => database.clientContacts.setPrimary(id, contactId));
  ipcMain.handle('crm:actions:list', (_event, filters?: CrmActionFilters) => database.actions.list(filters));
  ipcMain.handle('crm:actions:create', (_event, input: CrmActionInput) => database.actions.create(input));
  ipcMain.handle('crm:actions:complete', (_event, id: string,input?:CompleteActionInput) => database.actions.complete(id,input));
  ipcMain.handle('crm:actions:cancel', (_event, id: string) => database.actions.cancel(id));
  ipcMain.handle('crm:actions:reopen', (_event, id: string) => database.actions.reopen(id));
  ipcMain.handle('crm:activity:list', (_event, entityType: string, entityId: string) => database.crm.listActivity(entityType, entityId));
  ipcMain.handle('crm:search:global', (_event, query: string): SearchResult[] => {
    const normalized = query.trim();
    if (normalized.length < 2) return [];
    const needle = normalized.toLocaleLowerCase('fr-FR');

    const crmResults = database.crm.globalSearch(normalized);
    const catalogResults: SearchResult[] = database.catalog.list({ search: normalized }).slice(0, 6).map((item) => ({
      entityType: 'catalog', entityId: item.id, title: item.name,
      subtitle: `${item.type === 'offer' ? 'Offre' : 'Service'}${item.category ? ` · ${item.category}` : ''}`, status: item.status,
    }));
    const quoteResults: SearchResult[] = database.quotes.list({ search: normalized }).slice(0, 6).map((quote) => ({
      entityType: 'quote', entityId: quote.id, title: `${quote.number} · ${quote.subject}`, subtitle: quote.ownerLabel, status: quote.status,
    }));
    const projectResults = database.projectSearch.search(normalized, 12);
    const requestResults: SearchResult[] = database.operations.listRequests({ search: normalized }).slice(0, 6).map((request) => ({
      entityType: 'service_request', entityId: request.id, title: request.subject,
      subtitle: `${request.clientLabel}${request.projectLabel ? ` · ${request.projectLabel}` : ''}`, status: request.status,
    }));
    const interventionResults: SearchResult[] = database.operations.listInterventions({ search: normalized }).slice(0, 8).map((intervention) => ({
      entityType: 'intervention', entityId: intervention.id, title: `${intervention.number} · ${intervention.subject}`,
      subtitle: `${intervention.clientLabel}${intervention.projectLabel ? ` · ${intervention.projectLabel}` : ''}`, status: intervention.status,
    }));
    const maintenanceResults: SearchResult[] = database.maintenance.listSubscriptions().filter((subscription) =>
      [subscription.planName, subscription.clientLabel, subscription.projectLabel ?? ''].some((value) => value.toLocaleLowerCase('fr-FR').includes(needle)),
    ).slice(0, 6).map((subscription) => ({
      entityType: 'maintenance', entityId: subscription.id, title: subscription.planName,
      subtitle: `${subscription.clientLabel}${subscription.projectLabel ? ` · ${subscription.projectLabel}` : ''}`, status: subscription.status,
    }));
    const hourPackResults: SearchResult[] = database.hourPacks.list().filter((pack) =>
      [pack.name, pack.clientLabel, pack.projectLabel ?? ''].some((value) => value.toLocaleLowerCase('fr-FR').includes(needle)),
    ).slice(0, 6).map((pack) => ({
      entityType: 'hour_pack', entityId: pack.id, title: pack.name,
      subtitle: `${pack.clientLabel}${pack.projectLabel ? ` · ${pack.projectLabel}` : ''}`, status: pack.status,
    }));
    const documentResults:SearchResult[]=database.clientDocuments.search(normalized).map(row=>({entityType:'client_document',entityId:String(row.id),parentEntityId:String(row.client_account_id),title:String(row.title),subtitle:`${String(row.client_name)} · ${String(row.original_name)}`,status:String(row.category)}));

    return [
      ...crmResults,
      ...catalogResults,
      ...quoteResults,
      ...projectResults,
      ...interventionResults,
      ...requestResults,
      ...maintenanceResults,
      ...hourPackResults,
      ...documentResults,
    ].slice(0, 30);
  });
  ipcMain.handle('crm:search:rebuild', () => database.crm.rebuildSearchIndex());

  ipcMain.handle('client-documents:list',(_event,clientId:string,includeArchived?:boolean)=>database.clientDocuments.list(clientId,includeArchived));
  ipcMain.handle('client-documents:import',async(_event,clientId:string,input:ClientDocumentInput)=>{const selection=await dialog.showOpenDialog({title:'Importer des documents client',properties:['openFile','multiSelections']});return selection.canceled?database.clientDocuments.list(clientId):database.clientDocuments.importPaths(clientId,selection.filePaths,input);});
  ipcMain.handle('client-documents:update',(_event,id:string,input:ClientDocumentInput)=>database.clientDocuments.update(id,input));
  ipcMain.handle('client-documents:archive',(_event,id:string,archived?:boolean)=>database.clientDocuments.archive(id,archived));
  ipcMain.handle('client-documents:delete',async(_event,id:string)=>{const doc=database.clientDocuments.get(id);const answer=await dialog.showMessageBox({type:'warning',title:'Suppression définitive',message:`Supprimer définitivement « ${doc.title} » ?`,detail:'Le fichier physique et ses métadonnées seront supprimés. Cette action est irréversible.',buttons:['Annuler','Supprimer définitivement'],defaultId:0,cancelId:0});if(answer.response!==1)return{cancelled:true};database.clientDocuments.deletePermanently(id);return{cancelled:false};});
  ipcMain.handle('client-documents:open-file',async(_event,id:string)=>{const error=await shell.openPath(database.clientDocuments.verifiedPath(id));if(error)throw Error(error);});
  ipcMain.handle('client-documents:open-folder',async(_event,clientId:string)=>{const path=database.clientDocuments.clientRoot(clientId);const error=await shell.openPath(path);if(error)throw Error(error);});

  ipcMain.handle('billing:list', (_event, filters?: BillingItemFilters) => database.billingHandoff.list(filters));
  ipcMain.handle('billing:get', (_event, id: string) => database.billingHandoff.get(id));
  ipcMain.handle('billing:change-status', (_event, id: string, status: BillingItemStatus) => database.billingHandoff.changeStatus(id, status));
  ipcMain.handle('billing:update-invoice-metadata', (_event, id: string, input: BillingInvoiceInput) => database.billingHandoff.updateInvoiceMetadata(id, input));
  ipcMain.handle('billing:import-invoice', async (_event, id: string, input: BillingInvoiceInput = {}) => {
    const item = database.billingHandoff.get(id);
    const selection = await dialog.showOpenDialog({
      title: `Importer la facture PDF · ${item.clientLabel}`,
      defaultPath: database.clientDocuments.clientRoot(item.clientAccountId),
      properties: ['openFile'],
      filters: [{ name: 'Factures PDF', extensions: ['pdf'] }],
    });
    if (selection.canceled || selection.filePaths.length === 0) return null;

    const before = new Set(database.clientDocuments.list(item.clientAccountId, true).map((document) => document.id));
    const reference = input.reference?.trim();
    const title = reference ? `Facture ${reference}` : `Facture · ${item.description}`;
    const imported = database.clientDocuments.importPaths(item.clientAccountId, [selection.filePaths[0]], {
      category: 'invoice',
      title,
      notes: `Facture Abby rattachée à la facturation « ${item.description} ».`,
    });
    const document = imported.find((candidate) => !before.has(candidate.id));
    if (!document) throw new Error('La facture PDF n’a pas pu être identifiée après import.');
    database.clientDocuments.fingerprint(document.id);
    return database.billingHandoff.attachInvoice(id, document.id, input);
  });
  ipcMain.handle('billing:open-invoice', async (_event, id: string) => {
    const item = database.billingHandoff.get(id);
    if (!item.invoiceDocumentId) throw new Error('Aucune facture PDF n’est rattachée à cet élément.');
    const error = await shell.openPath(database.clientDocuments.verifiedPath(item.invoiceDocumentId));
    if (error) throw new Error(error);
  });

  ipcMain.handle('expenses:list', (_event, filters?: ExpenseFilters) => database.expenses.list(filters));
  ipcMain.handle('expenses:get', (_event, id: string) => database.expenses.get(id));
  ipcMain.handle('expenses:list-receipt-versions', (_event, id: string) => database.expenses.listReceiptVersions(id));
  ipcMain.handle('expenses:open-receipt-version', async (_event, id: string, relativePath: string) => {
    const error = await shell.openPath(database.expenses.prepareReceiptVersionPreview(id, relativePath));
    if (error) throw new Error(error);
  });
  ipcMain.handle('expenses:create', (_event, input: ExpenseInput) => database.expenses.create(input));
  ipcMain.handle('expenses:update', (_event, id: string, input: ExpenseInput) => database.expenses.update(id, input));
  ipcMain.handle('expenses:change-status', (_event, id: string, status: ExpenseStatus) => database.expenses.changeStatus(id, status));
  ipcMain.handle('expenses:import-receipt', async (_event, id: string) => {
    const expense = database.expenses.get(id);
    const selection = await dialog.showOpenDialog({
      title: `Importer un justificatif · ${expense.label}`,
      defaultPath: workspace.root,
      properties: ['openFile'],
      filters: [
        { name: 'Justificatifs', extensions: ['pdf', 'png', 'jpg', 'jpeg', 'webp'] },
      ],
    });
    if (selection.canceled || selection.filePaths.length === 0) return null;
    return database.expenses.importReceipt(id, selection.filePaths[0]);
  });
  ipcMain.handle('expenses:open-receipt', async (_event, id: string) => {
    const error = await shell.openPath(database.expenses.absoluteReceiptPath(id));
    if (error) throw new Error(error);
  });

  ipcMain.handle('catalog:list', (_event, filters?: CatalogFilters) => database.catalog.list(filters));
  ipcMain.handle('catalog:get-item', (_event, id: string) => database.catalog.getItem(id));
  ipcMain.handle('catalog:assign-canonical-code', (_event, id: string, code: string) => database.catalog.assignCanonicalCode(id, code));
  ipcMain.handle('catalog:create', (_event, input: CatalogItemInput, firstVersion: CatalogVersionInput) => database.catalog.create(input, firstVersion));
  ipcMain.handle('catalog:create-version', (_event, itemId: string, input: CatalogVersionInput) => database.catalog.createVersion(itemId, input));
  ipcMain.handle('catalog:publish-version', (_event, versionId: string) => database.catalog.publishVersion(versionId));
  ipcMain.handle('catalog:set-status', (_event, itemId: string, status: CatalogItemStatus) => database.catalog.setStatus(itemId, status));
  ipcMain.handle('catalog:set-visible-public', (_event, itemId: string, visible: boolean) => database.catalog.setVisiblePublic(itemId, visible));
  ipcMain.handle('catalog:list-offer-components', (_event, offerVersionId: string) => database.catalog.listOfferComponents(offerVersionId));
  ipcMain.handle('catalog:set-offer-components', (_event, offerVersionId: string, components: OfferComponentInput[]) => database.catalog.setOfferComponents(offerVersionId, components));

  ipcMain.handle('contract-types:list', (_event, archived?: boolean) => database.contractTypes.list(archived));
  ipcMain.handle('contract-types:get', (_event, id: string) => database.contractTypes.get(id));
  ipcMain.handle('contract-types:create', (_event, code: string, input: import('../shared/contractTypes').ContractTypeVersionInput) => database.contractTypes.create(code,input));
  ipcMain.handle('contract-types:create-version', (_event, id: string, input: import('../shared/contractTypes').ContractTypeVersionInput) => database.contractTypes.createVersion(id,input));
  ipcMain.handle('contract-types:update-draft', (_event, id: string, input: import('../shared/contractTypes').ContractTypeVersionInput) => database.contractTypes.updateDraft(id,input));
  ipcMain.handle('contract-types:publish', (_event, id: string) => database.contractTypes.publish(id));
  ipcMain.handle('contract-types:status', (_event, id: string, status: ContractClauseStatus) => database.contractTypes.setStatus(id,status));
  ipcMain.handle('contract-types:catalog', (_event, id: string) => database.contractTypes.catalog(id));
  ipcMain.handle('contract-types:set-catalog', (_event, id: string, ids: string[]) => database.contractTypes.setCatalog(id,ids));
  ipcMain.handle('contract-types:initialize', () => database.contractTypes.initialize());
  ipcMain.handle('contract-terms:library:list', (_event, includeArchived?: boolean) => database.contractTerms.listTemplates(Boolean(includeArchived)));
  ipcMain.handle('contract-terms:library:get', (_event, id: string) => database.contractTerms.getTemplate(id));
  ipcMain.handle('contract-terms:library:create', (_event, input: ContractClauseTemplateInput, firstVersion: ContractClauseVersionInput) => database.contractTerms.createTemplate(input, firstVersion));
  ipcMain.handle('contract-terms:library:create-version', (_event, clauseId: string, input: ContractClauseVersionInput) => database.contractTerms.createVersion(clauseId, input));
  ipcMain.handle('contract-terms:library:publish-version', (_event, versionId: string) => database.contractTerms.publishVersion(versionId));
  // Short-lived in-memory review only: never trust a renderer-supplied Word body.
  const wordSessions=new Map<string,{manifest:WordDraftManifest;text:string;expiresAt:number}>();
  const clauseDraft=(clauseId:string,versionId:string)=>{
    const template=database.contractTerms.getTemplate(clauseId);
    const version=template.versions.find(v=>v.id===versionId);
    if(!version||template.status==='archived'||version.status!=='draft')
      throw Error('La version de clause sélectionnée doit être un brouillon actif.');
    if(template.versions[0]?.id!==version.id)
      throw Error('Un brouillon plus récent existe. Sélectionne la dernière version avant l’export Word.');
    return {template,version,source:{kind:'contract_clause' as const,
      clauseId,versionId,status:version.status,body:version.body}};
  };
  ipcMain.handle('contract-terms:word:export',async(_event,clauseId:string,versionId:string)=>{
    const {template,source}=clauseDraft(clauseId,versionId);
    const manifest=prepareWordDraftManifest(source);
    const bytes=makeWordDraftDocx(source,manifest,template.title);
    const suggested=template.code.replace(/[^A-Za-z0-9._-]/g,'-')+'-brouillon.docx';
    const selection=await dialog.showSaveDialog({
      title:'Exporter un brouillon contractuel éditable pour Word',
      defaultPath:suggested,
      filters:[{name:'Document Word (.docx)',extensions:['docx']}],
    });
    if(selection.canceled||!selection.filePath)return {cancelled:true};
    // Recheck source after async dialog; data must remain the source of export.
    clauseDraft(clauseId,versionId);
    const path=selection.filePath.toLowerCase().endsWith('.docx')?selection.filePath:selection.filePath+'.docx';
    writeFileSync(path,bytes);
    return {cancelled:false,fileName:basename(path)};
  });
  ipcMain.handle('contract-terms:word:pdf',async(_event,clauseId:string,versionId:string)=>{
    const {template,source}=clauseDraft(clauseId,versionId);
    const selection=await dialog.showSaveDialog({
      title:'Exporter un PDF de travail — NON OFFICIEL',
      defaultPath:template.code.replace(/[^A-Za-z0-9._-]/g,'-')+'-TRAVAIL-NON-SIGNE.pdf',
      filters:[{name:'PDF de travail, non signé',extensions:['pdf']}],
    });
    if(selection.canceled||!selection.filePath)return {cancelled:true};
    clauseDraft(clauseId,versionId);
    const path=selection.filePath.toLowerCase().endsWith('.pdf')?selection.filePath:selection.filePath+'.pdf';
    await saveWordDraftWorkingPdf(source,template.title,path);
    return {cancelled:false,fileName:basename(path)};
  });
  ipcMain.handle('contract-terms:word:import',async(_event,clauseId:string,versionId:string)=>{
    const {source}=clauseDraft(clauseId,versionId);
    const selection=await dialog.showOpenDialog({
      title:'Comparer les modifications d’un brouillon Word',
      properties:['openFile'],
      filters:[{name:'Document Word (.docx)',extensions:['docx']}],
    });
    if(selection.canceled||selection.filePaths.length===0)return null;
    if(!selection.filePaths[0].toLowerCase().endsWith('.docx'))
      throw Error('Seuls les fichiers DOCX sont acceptés.');
    const imported=parseWordDraftDocx(readFileSync(selection.filePaths[0]));
    const review=compareWordDraftText(imported.manifest,source,imported.text);
    if(imported.manifest.clauseId!==clauseId||imported.manifest.versionId!==versionId)
      throw Error('Ce document Word provient d’un autre brouillon de clause.');
    for(const [key,value] of wordSessions){
      if(value.expiresAt<Date.now())wordSessions.delete(key);
    }
    if(wordSessions.size>=12)throw Error('Trop de comparaisons Word ouvertes : annule une revue avant de recommencer.');
    const sessionId=randomUUID();
    wordSessions.set(sessionId,{manifest:imported.manifest,text:imported.text,expiresAt:Date.now()+20*60_000});
    return {sessionId,clauseId,sourceVersionId:versionId,changed:review.changed,
      paragraphs:review.paragraphs,warnings:[...review.warnings,...imported.warnings],
      lossy:imported.unsupported,importedFileName:basename(selection.filePaths[0])};
  });
  ipcMain.handle('contract-terms:word:cancel',(_event,sessionId:string)=>{
    wordSessions.delete(sessionId);
  });
  ipcMain.handle('contract-terms:word:approve',(_event,sessionId:string)=>{
    const session=wordSessions.get(sessionId);
    if(!session||Date.now()>session.expiresAt){
      wordSessions.delete(sessionId);
      throw Error('La revue Word a expiré : importe à nouveau le document.');
    }
    const result=database.contractTerms.createReviewedWordDraft(session.manifest,session.text);
    wordSessions.delete(sessionId);
    return result;
  });

  ipcMain.handle('contract-terms:library:set-status', (_event, id: string, status: ContractClauseStatus) => database.contractTerms.setTemplateStatus(id, status));
  ipcMain.handle('contract-terms:library:set-audience', (_event, id: string, audience: ContractClauseAudience) => database.contractTerms.setTemplateAudience(id, audience));
  ipcMain.handle('contract-terms:library:set-catalog-links', (_event, id: string, catalogItemIds: string[]) => database.contractTerms.setCatalogLinks(id, catalogItemIds));
  ipcMain.handle('contract-terms:quotes:presentation', (_event, id: string) => database.contractTerms.presentation(id));
  ipcMain.handle('contract-terms:quotes:get', (_event, quoteId: string) => database.contractTerms.getQuoteBuild(quoteId));
  ipcMain.handle('contract-terms:quotes:sync', (_event, quoteId: string) => database.contractTerms.syncQuote(quoteId));
  ipcMain.handle('contract-terms:quotes:add-custom', (_event, quoteId: string, input: QuoteContractClauseInput) => database.contractTerms.addCustomQuoteClause(quoteId, input));
  ipcMain.handle('contract-terms:quotes:update-clause', (_event, id: string, input: QuoteContractClauseUpdate) => database.contractTerms.updateQuoteClause(id, input));
  ipcMain.handle('contract-terms:quotes:reset-clause', (_event, id: string) => database.contractTerms.resetQuoteClause(id));
  ipcMain.handle('contract-terms:quotes:remove-custom', (_event, id: string) => database.contractTerms.removeCustomQuoteClause(id));
  ipcMain.handle('contract-terms:quotes:reorder', (_event, quoteId: string, clauseIds: string[]) => database.contractTerms.reorderQuoteClauses(quoteId, clauseIds));
  ipcMain.handle('contract-terms:preview-reference', (_event,typeId:string,typeVersionId:string,versionId:string,audience:import('../shared/contractTerms').QuoteContractAudience) => database.contractTerms.previewReference(typeId,typeVersionId,versionId,audience));
  ipcMain.handle('contract-terms:copy-text', async (_event, text: string) => {
    await clipboard.writeText(text);
  });

  ipcMain.handle('quote-preparation:get', (_event,id:string)=>database.quotePreparation.get(id));
  ipcMain.handle('quote-preparation:save', (_event,id:string,input:QuoteContractParameters,expected?:{parameters:QuoteContractParameters|null})=>database.quotePreparation.save(id,input,expected));
  ipcMain.handle('quote-preparation:administration', ()=>database.quotePreparation.administration());
  ipcMain.handle('quote-preparation:save-administration', (_event,input:ContractAdministration,expected?:ContractAdministration)=>database.quotePreparation.saveAdministration(input,expected));
  ipcMain.handle('quote-preparation:attach', (_event,id:string,input:ContractDocumentLinkInput)=>{
    if(input.role==='accepted_pdf')database.quotes.attachContractDocument(id,input.documentId,undefined,input.replacementReason);
    else database.quotePreparation.attach(id,input);
    return database.quotePreparation.get(id);
  });
  ipcMain.handle('quote-preparation:record-acceptance', (_event,id:string,statement:string,occurredAt:string,provenance:string)=>database.quotePreparation.recordAcceptance(id,statement,occurredAt,provenance));
  ipcMain.handle('quote-preparation:open-document', async (_event,id:string)=>{const error=await shell.openPath(database.quotePreparation.openLinked(id));if(error)throw Error(error);});
  ipcMain.handle('quote-preparation:import-document', async (_event,id:string,role:ContractDocumentRole,provenance:string)=>{
    database.quotes.get(id);
    const selection=await dialog.showOpenDialog({title:'Rattacher une annexe / preuve au devis',properties:['openFile']});
    if(selection.canceled)return null;
    return database.quotePreparation.importPath(id,role,provenance,selection.filePaths[0]);
  });
  ipcMain.handle('quotes:set-line-parameters',(_event,lineId:string,parameters:import('../shared/commercialRules').QuoteLineParameters)=>database.quotes.setLineParameters(lineId,parameters));
  ipcMain.handle('quotes:preparation-issues',(_event,id:string)=>database.quotes.preparationIssues(id));
  ipcMain.handle('quotes:assign-operational-target',(_event,id:string,input:{projectId:string;siteId?:string|null;contextNodeId?:string|null;author:string})=>database.quotes.assignOperationalTarget(id,input));
  ipcMain.handle('quotes:operational-sales-for-client',(_event,id:string)=>database.quotes.operationalSalesForClient(id));
  ipcMain.handle('quotes:operational-sales',(_event,id:string)=>database.quotes.operationalSales(id));
  ipcMain.handle('quotes:list', (_event, filters?: QuoteFilters) => database.quotes.list(filters));
  ipcMain.handle('quotes:get', (_event, id: string) => database.quotes.get(id));
  ipcMain.handle('quotes:create-with-lines', (_event, input: QuoteInput, lines: Array<{catalogVersionId?: string; input: QuoteLineInput}>) => database.quotes.createWithLines(input,lines));
  ipcMain.handle('quotes:create', (_event, input: QuoteInput) => database.quotes.create(input));
  ipcMain.handle('quotes:add-catalog-line', (_event, quoteId: string, catalogVersionId: string, input?: Partial<QuoteLineInput>) => database.quotes.addCatalogLine(quoteId, catalogVersionId, input));
  ipcMain.handle('quotes:select-offer-option', (_event, offerLineId: string, componentId: string, input?: Partial<QuoteLineInput>) => database.quotes.selectOfferOption(offerLineId, componentId, input));
  ipcMain.handle('quotes:deselect-offer-option', (_event, offerLineId: string, componentId: string) => database.quotes.deselectOfferOption(offerLineId, componentId));
  ipcMain.handle('quotes:add-custom-line', (_event, quoteId: string, input: QuoteLineInput) => database.quotes.addCustomLine(quoteId, input));
  ipcMain.handle('quotes:update-line', (_event, lineId: string, input: QuoteLineInput) => database.quotes.updateLine(lineId, input));
  ipcMain.handle('quotes:remove-line', (_event, lineId: string) => database.quotes.removeLine(lineId));
  ipcMain.handle('quotes:update-conditions', (_event, quoteId: string, input: Partial<QuoteInput>) => database.quotes.updateConditions(quoteId, input));
  ipcMain.handle('quotes:mark-sent', (_event, id: string) => database.quotes.markSent(id));
  ipcMain.handle('quotes:principle-agreement:confirm', (_event, id: string) => database.quotes.confirmPrincipleAgreement(id));
  ipcMain.handle('quotes:principle-agreement:revoke', (_event, id: string) => database.quotes.revokePrincipleAgreement(id));
  ipcMain.handle('quotes:finalize',(_event,id:string)=>database.quotes.finalize(id));
  ipcMain.handle('quotes:extend-validity',(_event,id:string,validUntil:string)=>database.quotes.extendValidity(id,validUntil));
  ipcMain.handle('quotes:mark-viewed', (_event, id: string) => database.quotes.markViewed(id));
  ipcMain.handle('quotes:accept', (_event, id: string) => database.quotes.accept(id));
  ipcMain.handle('quotes:refuse', (_event, id: string) => database.quotes.refuse(id));
  ipcMain.handle('quotes:expire', (_event, id: string) => database.quotes.expire(id));
  ipcMain.handle('quotes:duplicate', (_event, id: string) => database.quotes.duplicate(id));
  ipcMain.handle('quotes:commercial-revision', (_event, id: string) => database.quotes.duplicate(id,true));
  ipcMain.handle('quotes:import-contract-document', async (_event, id: string, abbyReference?: string | null) => {
    const quote = database.quotes.get(id);
    if (quote.status !== 'accepted') throw new Error('Le devis doit être accepté avant d’importer le document contractuel.');
    const clientId = quote.acceptedClientAccountId ?? quote.clientAccountId;
    if (!clientId) throw new Error('Client introuvable pour ce devis.');
    const selection = await dialog.showOpenDialog({
      title: `Importer le devis contractuel Abby · ${quote.number}`,
      defaultPath: database.clientDocuments.clientRoot(clientId),
      properties: ['openFile'],
      filters: [{ name: 'Devis / contrat PDF', extensions: ['pdf'] }],
    });
    if (selection.canceled || selection.filePaths.length === 0) return null;
    let replacementReason: string|undefined;
    if(quote.contractDocumentId){const answer=await dialog.showMessageBox({type:'question',title:'Remplacer le PDF contractuel',message:'Confirmer un nouveau PDF actif ? L’ancien reste relié au devis et protégé.',buttons:['Annuler','Conserver l’ancien et rattacher le nouveau'],defaultId:0,cancelId:0});if(answer.response!==1)return null;replacementReason='Remplacement confirmé explicitement dans le dialogue d’import';}
    const before = new Set(database.clientDocuments.list(clientId, true).map((document) => document.id));
    const imported = database.clientDocuments.importPaths(clientId, [selection.filePaths[0]], {
      category: 'contract',
      title: `Devis contractuel ${quote.number}`,
      notes: `Document Abby accepté rattaché au devis ${quote.number}.`,
    });
    const document = imported.find((candidate) => !before.has(candidate.id));
    if (!document) throw new Error('Le document contractuel n’a pas pu être identifié après import.');
    return database.quotes.attachContractDocument(id, document.id, abbyReference, replacementReason);
  });
  ipcMain.handle('quotes:open-contract-document', async (_event, id: string) => {
    const quote = database.quotes.get(id);
    if (!quote.contractDocumentId) throw new Error('Aucun document contractuel n’est rattaché à ce devis.');
    const link=database.quotePreparation.links(id).find(l=>l.role==='accepted_pdf'&&l.documentId===quote.contractDocumentId);
    const error = await shell.openPath(link?database.quotePreparation.openLinked(link.id):database.clientDocuments.verifiedPath(quote.contractDocumentId));
    if (error) throw new Error(error);
  });
  ipcMain.handle('quotes:update-abby-reference', (_event, id: string, abbyReference?: string | null) => database.quotes.updateAbbyReference(id, abbyReference));

  ipcMain.handle('quotes:generate-pdf', async (_event, id: string) => {
    const quote = database.quotes.get(id);
    const contract = quote.status === 'draft' && !quote.finalizedAt
      ? database.contractTerms.syncQuote(id)
      : database.contractTerms.getQuoteBuild(id);
    return generateQuotePdf({ ...quote, contractTextSnapshot: contract.snapshotState === 'historical_missing' ? quote.contractTextSnapshot : quoteContractText(contract) }, workspace, database.contractTerms.presentation(id));
  });

  ipcMain.handle('projects:templates:list', () => database.projects.listTemplates());
  ipcMain.handle('projects:templates:get', (_event, id: string) => database.projects.getTemplate(id));
  ipcMain.handle('projects:templates:create', (_event, input: ProjectTemplateInput) => database.projects.createTemplate(input));
  ipcMain.handle('projects:templates:create-version', (_event, templateId: string, description?: string | null) => database.projects.createTemplateVersion(templateId, description));
  ipcMain.handle('projects:templates:publish-version', (_event, versionId: string) => database.projects.publishTemplateVersion(versionId));
  ipcMain.handle('projects:templates:add-node', (_event, versionId: string, input: ProjectTemplateNodeInput) => database.projects.addTemplateNode(versionId, input));
  ipcMain.handle('projects:templates:remove-node', (_event, nodeId: string) => database.projects.removeTemplateNode(nodeId));
  ipcMain.handle('projects:templates:configure-sites', (_event, versionId: string, sites: ProjectTemplateSiteInput[]) =>
    database.projects.configureTemplateSites(versionId, sites));

  ipcMain.handle('projects:list', (_event, filters?: ProjectFilters) => database.projects.listProjects(filters));
  ipcMain.handle('projects:get', (_event, id: string) => database.projects.getProject(id));
  ipcMain.handle('projects:transform-quote', (_event, input: TransformQuoteToProjectInput) => database.projects.transformQuote(input));
  ipcMain.handle('projects:prepare-quote', (_event, input: TransformQuoteToProjectInput) => database.projects.commercial.prepare(input));
  ipcMain.handle('projects:preview-quote', (_event, input: TransformQuoteToProjectInput) => database.projects.commercial.preview(input));
  ipcMain.handle('projects:sync-commercial', (_event, id: string) => database.projects.commercial.sync(id));
  ipcMain.handle('projects:assign-target', (_event,id:string,input:import('../shared/contributionTargets').ContributionTargetInput)=>database.projects.commercial.assignTarget(id,input));
  ipcMain.handle('projects:commercial-scope', (_event, id: string) => database.projects.commercial.scope(id));
  ipcMain.handle('projects:resolve-scope-conflict', (_event, id: string, conflictId: string, decision: import('../shared/projects').ProjectConflictDecision) => database.projects.commercial.resolveConflict(id,conflictId,decision));
  ipcMain.handle('projects:create-internal', (_event, input: InternalProjectInput) => database.projects.createInternal(input));
  ipcMain.handle('projects:change-status', (_event, id: string, status: ProjectStatus) => database.projects.changeProjectStatus(id, status));
  ipcMain.handle('projects:completion-review', (_event, id: string) => database.projectCompletion.review(id));
  ipcMain.handle('projects:sites:list', (_event, projectId: string, includeArchived?: boolean) => database.projectSites.list(projectId, Boolean(includeArchived)));
  ipcMain.handle('projects:sites:create', (_event, projectId: string, input: ProjectSiteInput) => database.projectSites.create(projectId, input));
  ipcMain.handle('projects:sites:update', (_event, id: string, input: Partial<ProjectSiteInput>) => database.projectSites.update(id, input));
  ipcMain.handle('projects:sites:set-archived', (_event, id: string, archived: boolean) => database.projectSites.setArchived(id, archived));
  ipcMain.handle('projects:sites:list-pages', (_event, projectId: string) => database.projectSites.listPages(projectId));
  ipcMain.handle('projects:sites:link-page', (_event, siteId: string, projectNodeId: string, input?: ProjectSitePageInput) =>
    database.projectSites.linkPage(siteId, projectNodeId, input));
  ipcMain.handle('projects:sites:unlink-page', (_event, projectNodeId: string) => database.projectSites.unlinkPage(projectNodeId));
  ipcMain.handle('projects:sites:apply-blueprint', (_event, projectId: string, templateVersionId?: string | null) =>
    database.projectSites.applyBlueprint(projectId, templateVersionId));
  ipcMain.handle('projects:add-node', (_event, projectId: string, input: ProjectNodeInput) => database.projects.addProjectNode(projectId, input));
  ipcMain.handle('projects:update-node', (_event, nodeId: string, input: Partial<ProjectNodeInput>) => database.projects.updateProjectNode(nodeId, input));
  ipcMain.handle('projects:move-node', (_event, nodeId: string, input: MoveProjectNodeInput) => database.projectNodes.move(nodeId, input));
  ipcMain.handle('projects:set-node-pause', (_event, nodeId: string, paused: boolean, reason?: string | null) => database.projects.setProjectNodePause(nodeId, paused, reason));
  ipcMain.handle('projects:complete-phase', (_event, nodeId: string) => database.projects.completeProjectPhase(nodeId));
  ipcMain.handle('projects:secrets:list', (_event, projectId: string, projectNodeId?: string | null) =>
    database.projects.listProjectSecrets(projectId, projectNodeId));

  ipcMain.handle('projects:secrets:save', (_event, input: {
    projectId: string;
    projectNodeId?: string | null;
    label: string;
    username?: string | null;
    secret: string;
    url?: string | null;
    notes?: string | null;
  }) => {
    if (!safeStorage.isEncryptionAvailable()) throw new Error('Le chiffrement système Windows n’est pas disponible.');
    const secret = input.secret?.trim();
    if (!secret) throw new Error('Mot de passe ou clé requis.');
    const secretCiphertext = safeStorage.encryptString(secret).toString('base64');
    return database.projects.saveProjectSecret({
      projectId: input.projectId,
      projectNodeId: input.projectNodeId ?? null,
      label: input.label,
      username: input.username ?? null,
      secretCiphertext,
      url: input.url ?? null,
      notes: input.notes ?? null,
    });
  });

  ipcMain.handle('projects:secrets:reveal', (_event, id: string) => {
    if (!safeStorage.isEncryptionAvailable()) throw new Error('Le chiffrement système Windows n’est pas disponible.');
    const stored = database.projects.getProjectSecretCiphertext(id);
    const secret = safeStorage.decryptString(Buffer.from(stored.ciphertext, 'base64'));
    return { id: stored.id, secret };
  });

  ipcMain.handle('projects:secrets:remove', (_event, id: string) => {
    database.projects.removeProjectSecret(id);
  });

  ipcMain.handle('projects:add-prerequisite', (_event, projectId: string, input: ProjectPrerequisiteInput) => database.projects.addPrerequisite(projectId, input));
  ipcMain.handle('projects:update-prerequisite-status', (_event, id: string, status: ProjectPrerequisiteStatus) => database.projects.updatePrerequisiteStatus(id, status));

  ipcMain.handle('projects:resources:list', (_event, projectId: string) => database.projectResources.list(projectId));
  ipcMain.handle('projects:resources:import-files', async (_event, projectId: string, folder: ProjectResourceFolder, contentRole: ProjectResourceRole = 'other') => {
    const defaultPath = database.projectResources.projectResourceRoot(projectId);
    const selection = await dialog.showOpenDialog({
      title: 'Ajouter des fichiers au projet',
      defaultPath,
      properties: ['openFile', 'multiSelections'],
    });
    if (selection.canceled || selection.filePaths.length === 0) return database.projectResources.list(projectId);
    return database.projectResources.importFilePaths(projectId, selection.filePaths, folder, contentRole);
  });
  ipcMain.handle('projects:resources:update-status', (_event, id: string, status: ProjectResourceStatus) => database.projectResources.updateStatus(id, status));
  ipcMain.handle('projects:resources:update-role', (_event, id: string, role: ProjectResourceRole) => database.projectResources.updateRole(id, role));
  ipcMain.handle('projects:resources:link-node', (_event, id: string, nodeId: string) => database.projectResources.linkToNode(id, nodeId));
  ipcMain.handle('projects:resources:unlink-node', (_event, id: string, nodeId: string) => database.projectResources.unlinkFromNode(id, nodeId));
  ipcMain.handle('projects:resources:open-file', async (_event, id: string) => {
    const error = await shell.openPath(database.projectResources.absolutePath(id));
    return { ok: !error, error: error || null };
  });
  ipcMain.handle('projects:resources:open-folder', async (_event, projectId: string) => {
    const error = await shell.openPath(database.projectResources.projectResourceRoot(projectId));
    return { ok: !error, error: error || null };
  });
  ipcMain.handle('projects:resources:relocalize', async (_event, id: string) => {
    const resource = database.projectResources.get(id);
    const selection = await dialog.showOpenDialog({
      title: `Relocaliser ${resource.fileName}`,
      defaultPath: workspace.root,
      properties: ['openFile'],
    });
    if (selection.canceled || selection.filePaths.length === 0) return null;
    return database.projectResources.relocalize(id, selection.filePaths[0]);
  });

  ipcMain.handle('projects:technical:list', (_event, projectId: string, search?: string | null) => database.projectTechnicalLibrary.list(projectId, search));
  ipcMain.handle('projects:technical:get', (_event, id: string) => database.projectTechnicalLibrary.get(id));
  ipcMain.handle('projects:technical:create', (_event, projectId: string, item: ProjectTechnicalItemInput, version: ProjectTechnicalVersionInput) => database.projectTechnicalLibrary.create(projectId, item, version));
  ipcMain.handle('projects:technical:create-version', (_event, itemId: string, version: ProjectTechnicalVersionInput) => database.projectTechnicalLibrary.createVersion(itemId, version));
  ipcMain.handle('projects:technical:mark-stable', (_event, versionId: string) => database.projectTechnicalLibrary.markStable(versionId));
  ipcMain.handle('projects:technical:link-resource', (_event, versionId: string, resourceId: string) => database.projectTechnicalLibrary.linkResource(versionId, resourceId));
  ipcMain.handle('projects:technical:unlink-resource', (_event, versionId: string, resourceId: string) => database.projectTechnicalLibrary.unlinkResource(versionId, resourceId));
  ipcMain.handle('projects:technical:prepare-reuse', (_event, itemId: string, versionId?: string | null) => database.projectReuseExport.prepare(itemId, versionId));
  ipcMain.handle('projects:technical:archive', (_event, itemId: string) => database.projectTechnicalLibrary.archive(itemId));

  ipcMain.handle('time:active', () => database.time.active());
  ipcMain.handle('time:start', (_event, input: StartTimeSessionInput) => database.time.start(input));
  ipcMain.handle('time:heartbeat', (_event, id: string) => database.time.heartbeat(id));
  ipcMain.handle('time:pause', (_event, id: string, reason?: TimePauseReason | null, reasonNote?: string | null) => database.time.pause(id, reason, reasonNote));
  ipcMain.handle('time:resume', (_event, id: string) => database.time.resume(id));
  ipcMain.handle('time:recover-resume', (_event, id: string) => database.time.recoverResume(id));
  ipcMain.handle('time:stop', (_event, id: string) => database.time.stop(id));
  ipcMain.handle('time:stop-last-known', (_event, id: string) => database.time.stopAtLastKnown(id));
  ipcMain.handle('time:add-manual', (_event, input: ManualTimeSessionInput) => database.time.addManual(input));
  ipcMain.handle('time:list', (_event, filters?: TimeSessionFilters) => database.time.list(filters));
  ipcMain.handle('time:summary', (_event, filters?: TimeSessionFilters) => database.time.summary(filters));
}
