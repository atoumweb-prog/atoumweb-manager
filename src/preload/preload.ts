import { contextBridge, ipcRenderer } from 'electron';
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
import type { AtoumWebApi, ThemeName } from '../shared/contracts';
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
} from '../shared/crm';

const api: AtoumWebApi = {
  app: { getBootstrap: () => ipcRenderer.invoke('app:get-bootstrap') },
  settings: { setTheme: (theme: ThemeName) => ipcRenderer.invoke('settings:set-theme', theme) },
  workspace: { choose: () => ipcRenderer.invoke('workspace:choose') },
  backups: {
    createManual: () => ipcRenderer.invoke('backups:create-manual'),
    restore: () => ipcRenderer.invoke('backups:restore'),
  },
  database: { health: () => ipcRenderer.invoke('database:health') },
  crm: {
    organizations: {
      create: (input: OrganizationInput) => ipcRenderer.invoke('crm:organizations:create', input),
      update: (id: string, input: OrganizationInput) => ipcRenderer.invoke('crm:organizations:update', id, input),
    },
    contacts: {
      create: (input: ContactInput) => ipcRenderer.invoke('crm:contacts:create', input),
      update: (id: string, input: ContactInput) => ipcRenderer.invoke('crm:contacts:update', id, input),
    },
    prospects: {
      list: (filters?: ProspectFilters) => ipcRenderer.invoke('crm:prospects:list', filters),
      create: (input: ProspectInput) => ipcRenderer.invoke('crm:prospects:create', input),
      update: (id: string, input: ProspectInput) => ipcRenderer.invoke('crm:prospects:update', id, input),
      changeStage: (id: string, stage: ProspectStage, lostReason?: string | null) => ipcRenderer.invoke('crm:prospects:change-stage', id, stage, lostReason),
      setNextAction: (id: string, at: string | null, text: string | null) => ipcRenderer.invoke('crm:prospects:set-next-action', id, at, text),
      convertToClient: (id: string) => ipcRenderer.invoke('crm:prospects:convert-to-client', id),
    },
    clients: {
      list: (filters?: ClientFilters) => ipcRenderer.invoke('crm:clients:list', filters),
      create: (input: ClientInput) => ipcRenderer.invoke('crm:clients:create', input),
      update: (id: string, input: ClientInput) => ipcRenderer.invoke('crm:clients:update', id, input),
      archive: (id: string) => ipcRenderer.invoke('crm:clients:archive', id),
      reactivate: (id: string, status: Exclude<ClientStatus, 'archived'>) => ipcRenderer.invoke('crm:clients:reactivate', id, status),
      listContacts: (id: string) => ipcRenderer.invoke('crm:clients:list-contacts', id),
      addContact: (id: string, input: ContactInput, role: ClientContactRole, makePrimary?: boolean) => ipcRenderer.invoke('crm:clients:add-contact', id, input, role, makePrimary),
      setPrimaryContact: (id: string, contactId: string) => ipcRenderer.invoke('crm:clients:set-primary-contact', id, contactId),
    },
    actions: {
      list: (filters?: CrmActionFilters) => ipcRenderer.invoke('crm:actions:list', filters),
      create: (input: CrmActionInput) => ipcRenderer.invoke('crm:actions:create', input),
      complete: (id: string) => ipcRenderer.invoke('crm:actions:complete', id),
      cancel: (id: string) => ipcRenderer.invoke('crm:actions:cancel', id),
      reopen: (id: string) => ipcRenderer.invoke('crm:actions:reopen', id),
    },
    activity: { list: (entityType: string, entityId: string) => ipcRenderer.invoke('crm:activity:list', entityType, entityId) },
    search: {
      global: (query: string) => ipcRenderer.invoke('crm:search:global', query),
      rebuild: () => ipcRenderer.invoke('crm:search:rebuild'),
    },
  },
  catalog: {
    list: (filters?: CatalogFilters) => ipcRenderer.invoke('catalog:list', filters),
    getItem: (id: string) => ipcRenderer.invoke('catalog:get-item', id),
    create: (input: CatalogItemInput, firstVersion: CatalogVersionInput) => ipcRenderer.invoke('catalog:create', input, firstVersion),
    createVersion: (itemId: string, input: CatalogVersionInput) => ipcRenderer.invoke('catalog:create-version', itemId, input),
    publishVersion: (versionId: string) => ipcRenderer.invoke('catalog:publish-version', versionId),
    setStatus: (itemId: string, status: CatalogItemStatus) => ipcRenderer.invoke('catalog:set-status', itemId, status),
    setVisiblePublic: (itemId: string, visible: boolean) => ipcRenderer.invoke('catalog:set-visible-public', itemId, visible),
    listOfferComponents: (offerVersionId: string) => ipcRenderer.invoke('catalog:list-offer-components', offerVersionId),
    setOfferComponents: (offerVersionId: string, components: OfferComponentInput[]) => ipcRenderer.invoke('catalog:set-offer-components', offerVersionId, components),
  },
  quotes: {
    list: (filters?: QuoteFilters) => ipcRenderer.invoke('quotes:list', filters),
    get: (id: string) => ipcRenderer.invoke('quotes:get', id),
    create: (input: QuoteInput) => ipcRenderer.invoke('quotes:create', input),
    addCatalogLine: (quoteId: string, catalogVersionId: string, input?: Partial<QuoteLineInput>) => ipcRenderer.invoke('quotes:add-catalog-line', quoteId, catalogVersionId, input),
    addCustomLine: (quoteId: string, input: QuoteLineInput) => ipcRenderer.invoke('quotes:add-custom-line', quoteId, input),
    updateLine: (lineId: string, input: QuoteLineInput) => ipcRenderer.invoke('quotes:update-line', lineId, input),
    removeLine: (lineId: string) => ipcRenderer.invoke('quotes:remove-line', lineId),
    updateConditions: (quoteId: string, input: Partial<QuoteInput>) => ipcRenderer.invoke('quotes:update-conditions', quoteId, input),
    markSent: (id: string) => ipcRenderer.invoke('quotes:mark-sent', id),
    markViewed: (id: string) => ipcRenderer.invoke('quotes:mark-viewed', id),
    accept: (id: string) => ipcRenderer.invoke('quotes:accept', id),
    refuse: (id: string) => ipcRenderer.invoke('quotes:refuse', id),
    expire: (id: string) => ipcRenderer.invoke('quotes:expire', id),
    duplicate: (id: string) => ipcRenderer.invoke('quotes:duplicate', id),
    generatePdf: (id: string) => ipcRenderer.invoke('quotes:generate-pdf', id),
  },
};

contextBridge.exposeInMainWorld('atoumweb', api);
