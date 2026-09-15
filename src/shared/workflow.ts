import type { Contact, Organization, SearchResult } from './crm';
export interface Need { id: string; catalogItemId: string | null; label: string; type: string; otherText: string | null; }
export interface NeedInput { catalogItemId?: string | null; otherText?: string | null; }
export interface DashboardEntry { group: string; target: SearchResult; }
export interface DemoSummary { counts: Array<{ table: string; count: number }>; total: number; }
export interface WorkflowIdentity { organization: Organization | null; contact: Contact | null; decisionMaker: Contact | null; }
export interface WorkflowApi {
  needs(owner: 'prospect' | 'client', id: string): Promise<Need[]>;
  saveNeed(owner: 'prospect' | 'client', id: string, input: NeedInput, needId?: string): Promise<Need[]>;
  removeNeed(owner: 'prospect' | 'client', id: string, needId: string): Promise<Need[]>;
  identity(owner: 'prospect' | 'client', id: string): Promise<WorkflowIdentity>;
  setDecisionMaker(prospectId: string, contactId: string | null): Promise<WorkflowIdentity>;
  archiveProspect(id: string, archived: boolean): Promise<void>;
  dashboard(): Promise<DashboardEntry[]>;
  beginDemoCapture(label: string): Promise<string>;
  endDemoCapture(batch: string): Promise<void>;
  createDemo(scenario: 'vitrine' | 'ecommerce' | 'maintenance'): Promise<{ prospectId: string; quoteId: string; clientId: string; projectId: string; interventionId: string }>;
  demoSummary(): Promise<DemoSummary>;
  resetDemo(): Promise<{ cancelled: boolean; backupPath?: string; deleted?: number }>;
}
