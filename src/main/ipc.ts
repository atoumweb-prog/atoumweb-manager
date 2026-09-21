import { app, dialog, ipcMain, shell } from 'electron';
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
  OrganizationInput,
  ProspectFilters,
  ProspectInput,
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
  ProjectStatus,
  ProjectTechnicalItemInput,
  ProjectTechnicalVersionInput,
  ProjectTemplateInput,
  ProjectTemplateNodeInput,
  TransformQuoteToProjectInput,
} from '../shared/projects';
import type { ManualTimeSessionInput, StartTimeSessionInput, TimeSessionFilters } from '../shared/time';
import { generateQuotePdf } from './commercial/quotePdf';
import type { DatabaseService } from './database/DatabaseService';
import { scheduleDatabaseRestore } from './restore';
import { saveWorkspaceRoot, type WorkspacePaths } from './workspace';

export function registerIpcHandlers(database: DatabaseService, workspace: WorkspacePaths): void {
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
    return { appVersion: app.getVersion(), workspacePath: workspace.root, databasePath: workspace.databaseFile, theme, displayDensity, database: database.health() };
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

  ipcMain.handle('workspace:choose', async (): Promise<WorkspaceChangeResult> => {
    const result = await dialog.showOpenDialog({ title: 'Choisir le dossier AtoumWeb Manager', defaultPath: workspace.root, properties: ['openDirectory'] });
    if (result.canceled || result.filePaths.length === 0) return { cancelled: true };
    const nextWorkspace = saveWorkspaceRoot(result.filePaths[0]);
    return { cancelled: false, workspacePath: nextWorkspace.root, restartRequired: nextWorkspace.root !== workspace.root };
  });

  ipcMain.handle('backups:create-manual', async (): Promise<BackupResult> => {
    const path = await database.createBackup('manual');
    return { path, createdAt: new Date().toISOString() };
  });

  ipcMain.handle('backups:restore', async (): Promise<RestoreScheduleResult> => {
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
        ? 'La base actuelle sera d’abord sauvegardée automatiquement dans le dossier pre-restore, puis l’application redémarrera.'
        : 'La base actuelle sera d’abord sauvegardée automatiquement dans le dossier pre-restore au prochain démarrage. En mode développement, ferme ensuite AtoumWeb Manager puis relance « npm start » pour appliquer la restauration.',
    });
    if (confirmation.response !== 0) return { cancelled: true };
    scheduleDatabaseRestore(sourcePath);
    if (packaged) {
      setTimeout(() => { app.relaunch(); app.exit(0); }, 150);
      return { cancelled: false, sourcePath, restartScheduled: true };
    }
    return { cancelled: false, sourcePath, restartScheduled: false };
  });

  ipcMain.handle('database:health', () => database.health());

  ipcMain.handle('crm:organizations:create', (_event, input: OrganizationInput) => database.crm.createOrganization(input));
  ipcMain.handle('crm:organizations:update', (_event, id: string, input: OrganizationInput) => database.crm.updateOrganization(id, input));
  ipcMain.handle('crm:contacts:create', (_event, input: ContactInput) => database.crm.createContact(input));
  ipcMain.handle('crm:contacts:update', (_event, id: string, input: ContactInput) => database.crm.updateContact(id, input));
  ipcMain.handle('crm:contact-methods:list',(_event,owner:'organization'|'contact',id:string,includeArchived?:boolean)=>database.crm.listContactMethods(owner,id,includeArchived));
  ipcMain.handle('crm:contact-methods:save',(_event,input:ContactMethodInput,id?:string)=>database.crm.saveContactMethod(input,id));
  ipcMain.handle('crm:contact-methods:archive',(_event,id:string,archived?:boolean)=>database.crm.archiveContactMethod(id,archived));
  ipcMain.handle('crm:prospects:list', (_event, filters?: ProspectFilters) => database.crm.listProspects(filters));
  ipcMain.handle('crm:prospects:create', (_event, input: ProspectInput) => database.crm.createProspect(input));
  ipcMain.handle('crm:prospects:update', (_event, id: string, input: ProspectInput) => database.crm.updateProspect(id, input));
  ipcMain.handle('crm:prospects:update-qualification',(_event,id:string,input:Partial<ProspectInput>)=>{
    if (Object.prototype.hasOwnProperty.call(input,'decisionMakerContactId')) {
      database.workflow.setDecisionMaker(id,input.decisionMakerContactId?.trim() || null);
    }
    return database.crm.updateProspectQualification(id,input);
  });
  ipcMain.handle('crm:prospects:change-stage', (_event, id: string, stage: ProspectStage, lostReason?: string | null, allowIncompleteQualification?: boolean) => database.crm.changeProspectStage(id, stage, lostReason, Boolean(allowIncompleteQualification)));
  ipcMain.handle('crm:prospects:set-next-action', (_event, id: string, at: string | null, text: string | null) => database.crm.setProspectNextAction(id, at, text));
  ipcMain.handle('crm:prospects:convert-to-client', (_event, id: string) => database.crm.convertProspectToClient(id));
  ipcMain.handle('crm:prospects:research:list', (_event, id: string) => database.crm.listProspectResearchSnapshots(id));
  ipcMain.handle('crm:prospects:research:save', (_event, id: string, input: ProspectResearchSnapshotInput) => database.crm.saveProspectResearchSnapshot(id, input));
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
  ipcMain.handle('client-documents:open-file',async(_event,id:string)=>{const error=await shell.openPath(database.clientDocuments.absolutePath(id));if(error)throw Error(error);});
  ipcMain.handle('client-documents:open-folder',async(_event,clientId:string)=>{const path=database.clientDocuments.clientRoot(clientId);const error=await shell.openPath(path);if(error)throw Error(error);});

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
  ipcMain.handle('quotes:create-with-lines', (_event, input: QuoteInput, lines: Array<{catalogVersionId?: string; input: QuoteLineInput}>) => database.quotes.createWithLines(input,lines));
  ipcMain.handle('quotes:create', (_event, input: QuoteInput) => database.quotes.create(input));
  ipcMain.handle('quotes:add-catalog-line', (_event, quoteId: string, catalogVersionId: string, input?: Partial<QuoteLineInput>) => database.quotes.addCatalogLine(quoteId, catalogVersionId, input));
  ipcMain.handle('quotes:add-custom-line', (_event, quoteId: string, input: QuoteLineInput) => database.quotes.addCustomLine(quoteId, input));
  ipcMain.handle('quotes:update-line', (_event, lineId: string, input: QuoteLineInput) => database.quotes.updateLine(lineId, input));
  ipcMain.handle('quotes:remove-line', (_event, lineId: string) => database.quotes.removeLine(lineId));
  ipcMain.handle('quotes:update-conditions', (_event, quoteId: string, input: Partial<QuoteInput>) => database.quotes.updateConditions(quoteId, input));
  ipcMain.handle('quotes:mark-sent', (_event, id: string) => database.quotes.markSent(id));
  ipcMain.handle('quotes:finalize',(_event,id:string)=>database.quotes.finalize(id));
  ipcMain.handle('quotes:extend-validity',(_event,id:string,validUntil:string)=>database.quotes.extendValidity(id,validUntil));
  ipcMain.handle('quotes:mark-viewed', (_event, id: string) => database.quotes.markViewed(id));
  ipcMain.handle('quotes:accept', (_event, id: string) => database.quotes.accept(id));
  ipcMain.handle('quotes:refuse', (_event, id: string) => database.quotes.refuse(id));
  ipcMain.handle('quotes:expire', (_event, id: string) => database.quotes.expire(id));
  ipcMain.handle('quotes:duplicate', (_event, id: string) => database.quotes.duplicate(id));
  ipcMain.handle('quotes:generate-pdf', async (_event, id: string) => generateQuotePdf(database.quotes.get(id), workspace));

  ipcMain.handle('projects:templates:list', () => database.projects.listTemplates());
  ipcMain.handle('projects:templates:get', (_event, id: string) => database.projects.getTemplate(id));
  ipcMain.handle('projects:templates:create', (_event, input: ProjectTemplateInput) => database.projects.createTemplate(input));
  ipcMain.handle('projects:templates:create-version', (_event, templateId: string, description?: string | null) => database.projects.createTemplateVersion(templateId, description));
  ipcMain.handle('projects:templates:publish-version', (_event, versionId: string) => database.projects.publishTemplateVersion(versionId));
  ipcMain.handle('projects:templates:add-node', (_event, versionId: string, input: ProjectTemplateNodeInput) => database.projects.addTemplateNode(versionId, input));
  ipcMain.handle('projects:templates:remove-node', (_event, nodeId: string) => database.projects.removeTemplateNode(nodeId));

  ipcMain.handle('projects:list', (_event, filters?: ProjectFilters) => database.projects.listProjects(filters));
  ipcMain.handle('projects:get', (_event, id: string) => database.projects.getProject(id));
  ipcMain.handle('projects:transform-quote', (_event, input: TransformQuoteToProjectInput) => database.projects.transformQuote(input));
  ipcMain.handle('projects:create-internal', (_event, input: InternalProjectInput) => database.projects.createInternal(input));
  ipcMain.handle('projects:change-status', (_event, id: string, status: ProjectStatus) => database.projects.changeProjectStatus(id, status));
  ipcMain.handle('projects:completion-review', (_event, id: string) => database.projectCompletion.review(id));
  ipcMain.handle('projects:add-node', (_event, projectId: string, input: ProjectNodeInput) => database.projects.addProjectNode(projectId, input));
  ipcMain.handle('projects:update-node', (_event, nodeId: string, input: Partial<ProjectNodeInput>) => database.projects.updateProjectNode(nodeId, input));
  ipcMain.handle('projects:move-node', (_event, nodeId: string, input: MoveProjectNodeInput) => database.projectNodes.move(nodeId, input));
  ipcMain.handle('projects:set-node-pause', (_event, nodeId: string, paused: boolean, reason?: string | null) => database.projects.setProjectNodePause(nodeId, paused, reason));
  ipcMain.handle('projects:complete-phase', (_event, nodeId: string) => database.projects.completeProjectPhase(nodeId));
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
  ipcMain.handle('time:pause', (_event, id: string) => database.time.pause(id));
  ipcMain.handle('time:resume', (_event, id: string) => database.time.resume(id));
  ipcMain.handle('time:recover-resume', (_event, id: string) => database.time.recoverResume(id));
  ipcMain.handle('time:stop', (_event, id: string) => database.time.stop(id));
  ipcMain.handle('time:stop-last-known', (_event, id: string) => database.time.stopAtLastKnown(id));
  ipcMain.handle('time:add-manual', (_event, input: ManualTimeSessionInput) => database.time.addManual(input));
  ipcMain.handle('time:list', (_event, filters?: TimeSessionFilters) => database.time.list(filters));
  ipcMain.handle('time:summary', (_event, filters?: TimeSessionFilters) => database.time.summary(filters));
}
