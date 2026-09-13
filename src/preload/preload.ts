import { contextBridge, ipcRenderer } from 'electron';
import type { AtoumWebApi, ThemeName } from '../shared/contracts';
import type {
  ClientFilters,
  ClientInput,
  ClientStatus,
  ContactInput,
  OrganizationInput,
  ProspectFilters,
  ProspectInput,
  ProspectStage,
} from '../shared/crm';

const api: AtoumWebApi = {
  app: {
    getBootstrap: () => ipcRenderer.invoke('app:get-bootstrap'),
  },
  settings: {
    setTheme: (theme: ThemeName) => ipcRenderer.invoke('settings:set-theme', theme),
  },
  workspace: {
    choose: () => ipcRenderer.invoke('workspace:choose'),
  },
  backups: {
    createManual: () => ipcRenderer.invoke('backups:create-manual'),
    restore: () => ipcRenderer.invoke('backups:restore'),
  },
  database: {
    health: () => ipcRenderer.invoke('database:health'),
  },
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
      changeStage: (id: string, stage: ProspectStage, lostReason?: string | null) =>
        ipcRenderer.invoke('crm:prospects:change-stage', id, stage, lostReason),
      setNextAction: (id: string, at: string | null, text: string | null) =>
        ipcRenderer.invoke('crm:prospects:set-next-action', id, at, text),
      convertToClient: (id: string) => ipcRenderer.invoke('crm:prospects:convert-to-client', id),
    },
    clients: {
      list: (filters?: ClientFilters) => ipcRenderer.invoke('crm:clients:list', filters),
      create: (input: ClientInput) => ipcRenderer.invoke('crm:clients:create', input),
      update: (id: string, input: ClientInput) => ipcRenderer.invoke('crm:clients:update', id, input),
      archive: (id: string) => ipcRenderer.invoke('crm:clients:archive', id),
      reactivate: (id: string, status: Exclude<ClientStatus, 'archived'>) =>
        ipcRenderer.invoke('crm:clients:reactivate', id, status),
    },
    activity: {
      list: (entityType: string, entityId: string) => ipcRenderer.invoke('crm:activity:list', entityType, entityId),
    },
    search: {
      global: (query: string) => ipcRenderer.invoke('crm:search:global', query),
      rebuild: () => ipcRenderer.invoke('crm:search:rebuild'),
    },
  },
};

contextBridge.exposeInMainWorld('atoumweb', api);
