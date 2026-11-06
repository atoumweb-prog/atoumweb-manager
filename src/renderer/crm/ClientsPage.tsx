import {ClientCommercialSummary} from './ClientCommercialSummary';
import {ClientHistoryTab} from './ClientHistoryTab';
import {ClientProjectsTab} from './ClientProjectsTab';
import {ClientCommercialTab} from './ClientCommercialTab';
import './client-contacts-v2.css';
import {ClientAssociations} from './ClientAssociations';
import {ClientDetailIcon} from './ClientDetailIcon';
import './client-expanded-v2.css';
import {ClientQuickSummary} from './ClientQuickSummary';
import {ClientActionsHistory} from './ClientActionsHistory';
import {CrmReconciliationPanel} from './CrmReconciliationPanel';
import {CrmRecordLayout} from './CrmRecordLayout';
import {ConfiguredDataTable} from '../ui/ConfiguredDataTable';
import {CLIENT_DIRECTORY_VIEW} from '../../shared/realTableSchemas';
import './crm-visual-foundation.css';
import { layoutKey, readLayout, writeLayout } from '../../shared/panelLayout';
import { isClientActionOverdue, CLIENT_TABS, clientTabKey, clientHistory, readClientSections, type ClientTab } from '../../shared/clientPresentation';
import './ClientsPageV2.css';
import {useSearchTargetConfirmation,type EntityReady} from '../ui/useSearchTargetConfirmation';
import {requestUnsavedExit,useUnsavedDraft} from '../unsaved/unsaved';
import { NeedChoices, openEntity } from '../workflow/DossierPanel';
import {ClientDocumentsPanel} from './ClientDocumentsPanel';
import {ClientContractsPanel} from './ClientContractsPanel';
import type { NeedInput } from '../../shared/workflow';
import { Component, useEffect, useMemo, useRef, useState, type CSSProperties, type ErrorInfo, type ReactNode } from 'react';
import {
  CLIENT_CONTACT_ROLES,
  type ActivityEvent,
  type ClientContactLink,
  type ClientContactRole,
  type ClientStatus,
  type ClientSummary,
  type ClientRelationshipStatus,
} from '../../shared/crm';
import { ClientOperationsTab } from './ClientOperationsTab';
import type { QuoteSummary } from '../../shared/commercial';
import type { Contact, Organization } from '../../shared/crm';
import type { ProjectSummary } from '../../shared/projects';
import type { Intervention, MaintenanceSubscription } from '../../shared/operations';
import { ContactMethodsPanel } from './ContactMethodsPanel';
import { FieldHelp } from '../ui/FieldHelp';
import { displayWebUrl } from '../../shared/webUrl';
import { CrmIdentityAssetEditor, CrmIdentityAvatar } from './CrmIdentityVisual';
import { OperationIcon } from '../operations/OperationIcon';

const STATUS_LABELS: Record<ClientStatus, string> = {
  active: 'Actif',
  inactive: 'Ancien client',
  archived: 'Archivé',
};

const RELATION_LABELS: Record<ClientRelationshipStatus, string> = {
  excellent: 'Excellente', good: 'Bonne', neutral: 'Neutre', watch: 'À surveiller', difficult: 'Difficile',
};
const RELATION_OPTIONS = Object.keys(RELATION_LABELS) as ClientRelationshipStatus[];

const ROLE_LABELS: Record<ClientContactRole, string> = {
  primary: 'Principal',
  administrative: 'Administratif',
  billing: 'Facturation',
  technical: 'Technique',
  other: 'Autre',
};



interface ClientDraft {
  company: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  website: string;
  notes: string;
}

interface ContactDraft {
  existingContactId?:string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  email: string;
  phone: string;
  role: ClientContactRole;
  makePrimary: boolean;
}

interface ClientActionEditor {
  clientId: string;
  date: string;
  text: string;
}

const EMPTY_DRAFT: ClientDraft = {
  company: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  website: '',
  notes: '',
};

const EMPTY_CONTACT_DRAFT: ContactDraft = {
  firstName: '',
  lastName: '',
  jobTitle: '',
  email: '',
  phone: '',
  role: 'other',
  makePrimary: false,
};

class ClientsPageErrorBoundary extends Component<
  { children: ReactNode },
  { error: string | null }
> {
  state: { error: string | null } = { error: null };

  static getDerivedStateFromError(error: unknown): { error: string } {
    return { error: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error('Erreur page Clients', error, info);
  }

  render(): ReactNode {
    if (this.state.error) {
      return <div className="clients-page-error-shell">
        <div className="panel fatal-card">
          <span className="eyebrow">Clients</span>
          <h1>La fiche Client n’a pas pu s’afficher</h1>
          <p>{this.state.error}</p>
          <p className="muted">Le Manager et les données CRM ne sont pas affectés.</p>
          <button className="secondary-button" type="button" onClick={() => this.setState({ error: null })}>Réessayer</button>
        </div>
      </div>;
    }
    return this.props.children;
  }
}

function dateInputValue(value?: string | null): string {
  if (!value) return new Date().toISOString().slice(0, 10);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString().slice(0, 10) : date.toISOString().slice(0, 10);
}

export function ClientsPage(props: { onMessage: (message: string) => void; initialId?: string | null;initialRequest?:number;onEntityReady?:EntityReady;allowTestFill?:boolean }) {
  return <ClientsPageErrorBoundary>
    <ClientsPageContent {...props} />
  </ClientsPageErrorBoundary>;
}

function ClientsPageContent({ onEntityReady, onMessage, initialId, initialRequest, allowTestFill=false }: { onMessage: (message: string) => void; initialId?: string | null;initialRequest?:number;onEntityReady?:EntityReady;allowTestFill?:boolean }) {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [sectionErrors, setSectionErrors] = useState<Record<string,string>>({});
  const [detailLoading,setDetailLoading] = useState(false);
  const [loadedClientId,setLoadedClientId] = useState<string|null>(null);
  const listEpoch=useRef(0), opener=useRef<HTMLElement|null>(null);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [contacts, setContacts] = useState<ClientContactLink[]>([]);
  const [identity, setIdentity] = useState<{ organization: Organization | null; contact: Contact | null } | null>(null);
  const [quotes, setQuotes] = useState<QuoteSummary[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [subscriptions, setSubscriptions] = useState<MaintenanceSubscription[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [tableToolsHost,setTableToolsHost]=useState<HTMLDivElement|null>(null);
  const [documentsRevision,setDocumentsRevision]=useState(0);
  const [largeView, setLargeView] = useState(false);
  const [relationshipMenuOpen, setRelationshipMenuOpen] = useState(false);
  const [relationshipSaving, setRelationshipSaving] = useState(false);
  const [relationEditor,setRelationEditor]=useState<{value:string;expected:{status:ClientRelationshipStatus;note:string|null}}|null>(null);
  const relationGuard=useUnsavedDraft('Relation Client',relationEditor,{ready:!!relationEditor||relationshipSaving,pending:relationshipSaving,resetKey:relationEditor?.expected,discard:()=>setRelationEditor(null)});
  const [editingCoordinates, setEditingCoordinates] = useState(false);
  const coordinateBaseline=useRef<{organization:Organization|null;contact:Contact|null}|null>(null);
  const contactBaseline=useRef<Contact|null>(null);
  const [coordinateDraft, setCoordinateDraft] = useState({ firstName: '', lastName: '', website: '', addressLine1: '', addressLine2: '', postalCode: '', city: '' });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | ClientStatus>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(initialId ?? null);
  const [clientSplitPercent, setClientSplitPercent] = useState(68);
  const splitRef=useRef(clientSplitPercent);splitRef.current=clientSplitPercent;
  const splitCleanup=useRef<(()=>void)|null>(null);
  const layoutStore=useMemo(()=>window.atoumweb.visualPreferences,[]);
  useEffect(()=>{try{setClientSplitPercent(readLayout(layoutStore,layoutKey('clients','list'),68));}catch{onMessage('Disposition Client indisponible ; largeur par défaut conservée.');}return()=>splitCleanup.current?.();},[layoutStore]);
  function persistSplit(value:number){try{writeLayout(layoutStore,layoutKey('clients','list'),value);}catch{onMessage('La largeur Client ne peut pas être mémorisée.');}}
  const [needsDraft,setNeedsDraft] = useState<NeedInput[]>([]);
  useEffect(()=>{if(initialId)setSelectedId(initialId);},[initialId,initialRequest]);
  const clientDataEpoch=useRef(0),clientSelection=useRef(selectedId);clientSelection.current=selectedId;
  useEffect(()=>()=>{clientDataEpoch.current++;listEpoch.current++;},[]);
  const [activeTab, setActiveTab] = useState<ClientTab>('summary');
  const [showForm, setShowForm] = useState(false);
  const [clientDraftLogo,setClientDraftLogo]=useState<{token:string;preview:string;name:string}|null>(null);
  const [draft, setDraft] = useState<ClientDraft>(EMPTY_DRAFT);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [availableContacts,setAvailableContacts]=useState<import('../../shared/crm').DirectoryContact[]>([]);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactDraft, setContactDraft] = useState<ContactDraft>(EMPTY_CONTACT_DRAFT);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactSaving, setContactSaving] = useState(false);
  const actionBaseline=useRef<{at:string|null;text:string|null}>({at:null,text:null});
  const [actionEditor, setActionEditor] = useState<ClientActionEditor | null>(null);
  const [archiveCandidateId, setArchiveCandidateId] = useState<string | null>(null);
  const [coordinatesSaving,setCoordinatesSaving]=useState(false);
  const clientCreateGuard=useUnsavedDraft('Nouveau client',{draft,needsDraft,demoMode,clientDraftLogo},{ready:showForm||saving,pending:saving,resetKey:showForm,discard:value=>{setDraft(value.draft);setNeedsDraft(value.needsDraft);setDemoMode(value.demoMode);setClientDraftLogo(value.clientDraftLogo);setShowForm(false);}});
  const coordinateGuard=useUnsavedDraft('Coordonnées client',coordinateDraft,{ready:editingCoordinates||coordinatesSaving,pending:coordinatesSaving,resetKey:selectedId+':'+editingCoordinates,discard:value=>{setCoordinateDraft(value);setEditingCoordinates(false);}});
  const contactGuard=useUnsavedDraft('Contact client',contactDraft,{ready:showContactForm||contactSaving,pending:contactSaving,resetKey:selectedId+':'+editingContactId+':'+showContactForm,discard:value=>{setContactDraft(value);setShowContactForm(false);setEditingContactId(null);}});
  const [actionSaving,setActionSaving]=useState(false);
  const actionGuard=useUnsavedDraft('Prochaine action client',actionEditor,{ready:!!actionEditor||actionSaving,pending:actionSaving,resetKey:actionEditor?.clientId,discard:()=>setActionEditor(null)});
  const sidePanelRef = useRef<HTMLElement | null>(null);

  useEffect(()=>{
    if(!largeView)return;
    const panel=sidePanelRef.current,header=document.querySelector('.aw-workspace-header'),rail=document.querySelector('.aw-navigation-rail');
    if(!panel)return;
    const measure=()=>{panel.style.setProperty('--client-desk-top',`${Math.max(0,header?.getBoundingClientRect().bottom??82)+10}px`);panel.style.setProperty('--client-desk-left',`${Math.max(0,rail?.getBoundingClientRect().right??0)+10}px`);};
    const observer=new ResizeObserver(measure);if(header)observer.observe(header);if(rail)observer.observe(rail);measure();window.addEventListener('resize',measure);
    return()=>{observer.disconnect();window.removeEventListener('resize',measure);};
  },[largeView]);

  async function refresh(): Promise<void> {
    const epoch=++listEpoch.current;
    setLoading(true);
    setLoadError(null);
    try {
      const next=await window.atoumweb.crm.clients.list({ includeArchived: true });
      if(epoch===listEpoch.current)setClients(next);
    } catch (error) {
      if(epoch!==listEpoch.current)return;
      if(initialId)onEntityReady?.('client',initialId,error instanceof Error?error.message:'Client introuvable.');
      setLoadError(error instanceof Error ? error.message : String(error));
    } finally {
      if(epoch===listEpoch.current)setLoading(false);
    }
  }

  async function refreshSelectedClientData(clientId: string): Promise<void> {
    const epoch=++clientDataEpoch.current;
    setDetailLoading(true);
    const result=await readClientSections({
      activity: async () => {
        const linked=(await window.atoumweb.crm.prospects.list({includeArchived:true})).filter(p=>p.clientAccountId===clientId);
        const histories=await Promise.all(linked.map(p=>window.atoumweb.crm.activity.list('prospect',p.id)));
        return clientHistory(await window.atoumweb.crm.activity.list('client',clientId),...histories);
      },
      contacts:()=>window.atoumweb.crm.clients.listContacts(clientId),
      identity:()=>window.atoumweb.workflow.identity('client',clientId),
      quotes:()=>window.atoumweb.quotes.list({clientAccountId:clientId}),
      projects:()=>window.atoumweb.projects.projects.list({clientAccountId:clientId}),
      subscriptions:()=>window.atoumweb.operations.maintenance.subscriptions.list({clientAccountId:clientId}),
      interventions:()=>window.atoumweb.operations.interventions.list({clientAccountId:clientId}),
    });
    if(epoch!==clientDataEpoch.current||clientSelection.current!==clientId)return;
    const v=result.values;
    if(v.activity)setActivity(v.activity);
    if(v.contacts)setContacts(v.contacts);
    if(v.identity)setIdentity(v.identity);
    if(v.quotes)setQuotes(v.quotes);
    if(v.projects)setProjects(v.projects);
    if(v.subscriptions)setSubscriptions(v.subscriptions);
    if(v.interventions)setInterventions(v.interventions);
    setSectionErrors(result.errors);setLoadedClientId(clientId);setDetailLoading(false);
  }

  async function refreshAll(): Promise<void> {
    await refresh();
    if (selectedId) await refreshSelectedClientData(selectedId);
    onMessage('Liste clients actualisée.');
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    setActivity([]);setContacts([]);setIdentity(null);setQuotes([]);setProjects([]);setSubscriptions([]);setInterventions([]);setSectionErrors({});setLoadedClientId(null);
    if (!selectedId) {
      clientDataEpoch.current++;setDetailLoading(false);
      setActivity([]);
      setContacts([]);
      setIdentity(null); setQuotes([]); setProjects([]); setSubscriptions([]); setInterventions([]);
      return;
    }
    void refreshSelectedClientData(selectedId).catch((error: unknown) => {
      onMessage(error instanceof Error ? error.message : 'Impossible de charger la fiche client.');
    });
  }, [selectedId]);
  useEffect(()=>{const changed=()=>{void refresh();if(clientSelection.current)void refreshSelectedClientData(clientSelection.current);};window.addEventListener('atoumweb:changed',changed);return()=>window.removeEventListener('atoumweb:changed',changed);},[]);

  useEffect(() => {
    if (!selectedId || largeView) return;
    const closeOnOutside = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target || sidePanelRef.current?.contains(target)) return;
      if(target instanceof Element&&target.closest('button,a,input,select,textarea,tr,[role=option]'))return;
      if(!requestUnsavedExit(()=>{}))return;
      setSelectedId(null);
      setActionEditor(null);
      setArchiveCandidateId(null);
      setRelationshipMenuOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutside);
    return () => document.removeEventListener('pointerdown', closeOnOutside);
  }, [selectedId, largeView]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('fr-FR');
    return clients.filter((client) => {
      if (statusFilter !== 'all' && client.status !== statusFilter) return false;
      if (!normalized) return true;
      return [client.displayName, client.contactName, client.email, client.phone]
        .filter(Boolean)
        .some((value) => value?.toLocaleLowerCase('fr-FR').includes(normalized));
    });
  }, [clients, query, statusFilter]);

  const selected = clients.find((client) => client.id === selectedId) ?? null;
  useSearchTargetConfirmation('client',loadedClientId===selected?.id?selected?.id:null,loading||detailLoading,onEntityReady);
  useEffect(()=>{if(!loading&&initialId&&!clients.some(client=>client.id===initialId))onEntityReady?.('client',initialId,loadError??'Client introuvable.');},[loading,initialId,initialRequest,clients,loadError,onEntityReady]);

  const clientSplitStyle = selected && !largeView
    ? ({ '--client-list-percent': `${clientSplitPercent}%` } as CSSProperties)
    : undefined;

  async function updateRelationship(client: ClientSummary, next: ClientRelationshipStatus): Promise<void> {
    if(relationEditor&&!relationGuard.request(()=>{}))return;
    setRelationshipMenuOpen(false);
    if (next === (client.relationshipStatus ?? 'neutral') || relationshipSaving) return;
    setRelationshipSaving(true);
    setClients((items) => items.map((item) => item.id === client.id ? { ...item, relationshipStatus: next } : item));
    try {
      const updated = await window.atoumweb.crm.clients.updateRelationshipIfUnchanged(client.id,{status:client.relationshipStatus??'neutral',note:client.relationshipNote??null},{status:next,note:client.relationshipNote??null});
      setClients((items) => items.map((item) => item.id === client.id ? updated : item));
      await refreshSelectedClientData(client.id);
      onMessage(`Relation client : ${RELATION_LABELS[next]}.`);
    } catch (error) {
      setClients((items) => items.map((item) => item.id === client.id ? client : item));
      onMessage(error instanceof Error ? error.message : 'Mise à jour de la relation impossible.');
    } finally { setRelationshipSaving(false); }
  }

  async function saveRelationNote():Promise<void>{
    if(!selected||!relationEditor||relationshipSaving)return;
    setRelationshipSaving(true);
    try{
      const updated=await window.atoumweb.crm.clients.updateRelationshipIfUnchanged(selected.id,relationEditor.expected,{status:relationEditor.expected.status,note:relationEditor.value.trim()||null});
      relationGuard.saved(relationEditor);setRelationEditor(null);setClients(items=>items.map(item=>item.id===updated.id?updated:item));
      await refreshSelectedClientData(updated.id);onMessage('Note de relation enregistrée.');
    }catch(error){onMessage(error instanceof Error?error.message:'Note non enregistrée.');}
    finally{setRelationshipSaving(false);}
  }

  async function submitClient(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setFormError(null);
    if (!draft.company.trim() && (!draft.firstName.trim() || !draft.lastName.trim())) {
      setFormError('Renseigne une société ou le prénom et le nom du contact.');
      return;
    }

    setSaving(true);
    let demoBatch: string | null = null;
    try {
      if(demoMode&&!allowTestFill)throw new Error('Remplissage TEST indisponible dans cet environnement.');
      if (demoMode) demoBatch = await window.atoumweb.workflow.beginDemoCapture('client saisi manuellement');
      let organizationId: string | null = null;
      let contactId: string | null = null;

      if (draft.company.trim()) {
        const organization = await window.atoumweb.crm.organizations.create({
          name: draft.company.trim(),
          email: !draft.firstName.trim() ? draft.email.trim() || null : null,
          phone: !draft.firstName.trim() ? draft.phone.trim() || null : null,
          website: draft.website.trim() || null,
        });
        organizationId = organization.id;
      }

      if (draft.firstName.trim() && draft.lastName.trim()) {
        const contact = await window.atoumweb.crm.contacts.create({
          organizationId,
          firstName: draft.firstName.trim(),
          lastName: draft.lastName.trim(),
          email: draft.email.trim() || null,
          phone: draft.phone.trim() || null,
        });
        contactId = contact.id;
      }

      const client = await window.atoumweb.crm.clients.create({
        organizationId,
        primaryContactId: contactId,
        status: 'active',
        notes: draft.notes.trim() || null,
      });

      let logoWarning='';
      if(clientDraftLogo){const owner=organizationId?'organization':'contact',ownerId=organizationId||contactId;if(ownerId){try{await window.atoumweb.crm.identityAssets.attachDraft(clientDraftLogo.token,owner,ownerId);}catch(error){logoWarning=' Logo non enregistré : '+String(error);}}}
      setClientDraftLogo(null);
      for (const need of needsDraft) await window.atoumweb.workflow.saveNeed('client', client.id, need);
      setNeedsDraft([]);
      setDraft(EMPTY_DRAFT);
      setDemoMode(false);
      clientCreateGuard.saved({draft:EMPTY_DRAFT,needsDraft:[],demoMode:false,clientDraftLogo:null});
      setShowForm(false);
      await refresh();
      openClient(client.id,true);
      onMessage('Client créé.'+logoWarning);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Impossible de créer le client.');
    } finally {
      if (demoBatch) await window.atoumweb.workflow.endDemoCapture(demoBatch);
      setSaving(false);
    }
  }

  function openClient(id: string, saved=false): void {
    if(id===selectedId)return;
    if(!saved&&!requestUnsavedExit(()=>{}))return;
    opener.current=document.querySelector<HTMLElement>('[data-client-id="'+CSS.escape(id)+'"] button');
    setSelectedId(id);
    setActiveTab('summary');
    setLargeView(false);
    setEditingCoordinates(false);setRelationEditor(null);
    setShowContactForm(false);
    setEditingContactId(null);
    setActionEditor(null);
    setArchiveCandidateId(null);
  }

  function closeClient():void{requestUnsavedExit(()=>{setRelationshipMenuOpen(false);setLargeView(false);setSelectedId(null);setActionEditor(null);setArchiveCandidateId(null);requestAnimationFrame(()=>{if(clientSelection.current)return;const button=selectedId?document.querySelector<HTMLElement>('[data-client-id="'+CSS.escape(selectedId)+'"] button'):null;if(button)button.focus();else if(opener.current?.isConnected)opener.current.focus();else document.querySelector<HTMLInputElement>('.client-toolbar .inline-search')?.focus();});});}

  function beginClientResize(splitter: HTMLElement): void {
    const workspace = splitter.parentElement;
    if (!workspace) return;
    document.body.classList.add('operation-resizing');
    const onMove = (event: PointerEvent) => {
      const rect = workspace.getBoundingClientRect();
      if (!rect.width) return;
      const requested = ((event.clientX - rect.left) / rect.width) * 100;
      const maxForDetail = ((rect.width - 350) / rect.width) * 100;
      const maxPercent = Math.max(54, Math.min(74, maxForDetail));
      splitRef.current=Math.max(42, Math.min(maxPercent, requested));setClientSplitPercent(splitRef.current);
    };
    const cleanup = () => {
      document.body.classList.remove('operation-resizing');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);window.removeEventListener('pointercancel',onUp);splitCleanup.current=null;
    };
    const onUp=()=>{cleanup();persistSplit(splitRef.current);};splitCleanup.current?.();splitCleanup.current=cleanup;
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });window.addEventListener('pointercancel',onUp,{once:true});
  }

  const clientSplitter = selected && !largeView ? <div
    className="operation-splitter client-splitter"
    role="separator"
    aria-orientation="vertical"
    aria-label="Redimensionner la liste clients et la fiche client"
    tabIndex={0}
    onPointerDown={(event) => { event.stopPropagation(); beginClientResize(event.currentTarget); }}
    onDoubleClick={(event) => { event.stopPropagation(); setClientSplitPercent(68);persistSplit(68); }}
    onKeyDown={(event) => {
      if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();const value=Math.max(42,Math.min(74,splitRef.current+(event.key==='ArrowLeft'?-3:3)));setClientSplitPercent(value);persistSplit(value);}
    }}
  ><span /></div> : null;

  function beginCoordinateEdit(): void {
    if(editingCoordinates&&!coordinateGuard.request(()=>{}))return;
    coordinateBaseline.current=identity?structuredClone(identity):null;
    setCoordinateDraft({
      firstName: identity?.contact?.firstName ?? '', lastName: identity?.contact?.lastName ?? '',
      website: displayWebUrl(identity?.organization?.website),
      addressLine1: identity?.organization?.addressLine1 ?? '', addressLine2: identity?.organization?.addressLine2 ?? '',
      postalCode: identity?.organization?.postalCode ?? '', city: identity?.organization?.city ?? '',
    });
    setEditingCoordinates(true);
  }

  async function saveCoordinates(): Promise<void> {
    if (!selected || !identity) return;
    setCoordinatesSaving(true);
    try {
      const baseline=coordinateBaseline.current;if(!baseline)throw Error('Relis les coordonnées avant de les modifier.');
      await window.atoumweb.crm.directory.saveExisting({
        contact:baseline.contact?{id:baseline.contact.id,expected:baseline.contact,input:{...baseline.contact,firstName:coordinateDraft.firstName.trim(),lastName:coordinateDraft.lastName.trim()}}:undefined,
        organization:baseline.organization?{id:baseline.organization.id,expected:baseline.organization,input:{...baseline.organization,website:coordinateDraft.website.trim()||null,addressLine1:coordinateDraft.addressLine1.trim()||null,addressLine2:coordinateDraft.addressLine2.trim()||null,postalCode:coordinateDraft.postalCode.trim()||null,city:coordinateDraft.city.trim()||null}}:undefined,
      });
      coordinateGuard.saved(coordinateDraft);setEditingCoordinates(false);
      await refreshSelectedClientData(selected.id); await refresh();
      onMessage('Coordonnées du client mises à jour.');
    } catch (error) { onMessage(error instanceof Error ? error.message : 'Mise à jour impossible.'); }
    finally{setCoordinatesSaving(false);}
  }

  async function updateStatus(client: ClientSummary, status: ClientStatus): Promise<void> {
    if (status === client.status) return;
    if (status === 'archived') {
      setArchiveCandidateId(client.id);
      return;
    }
    if (client.status === 'archived') {
      await window.atoumweb.crm.clients.reactivate(client.id, status);
    } else {
      await window.atoumweb.crm.clients.updateStatus(client.id,client.status??'active',status);
    }
    await refresh();
    onMessage(`Client passé ${status === 'active' ? 'actif' : 'inactif'}.`);
  }

  async function confirmArchive(client: ClientSummary): Promise<void> {
    await window.atoumweb.crm.clients.archive(client.id);
    setArchiveCandidateId(null);
    await refresh();
    onMessage('Client archivé. Son historique est conservé et il reste accessible avec le filtre Archivés.');
  }

  function openActionEditor(client: ClientSummary): void {
    if(actionEditor&&!actionGuard.request(()=>{}))return;
    actionBaseline.current={at:client.nextActionAt??null,text:client.nextActionText??null};
    setActionEditor({
      clientId: client.id,
      date: dateInputValue(client.nextActionAt),
      text: client.nextActionText?.trim() || 'Recontacter le client',
    });
  }

  async function saveAction(client: ClientSummary): Promise<void> {
    if (!actionEditor || actionEditor.clientId !== client.id) return;
    const text = actionEditor.text.trim();
    if (!actionEditor.date || !text) {
      onMessage('Renseigne une date et une action.');
      return;
    }
    const date = new Date(`${actionEditor.date}T09:00:00`);
    if (Number.isNaN(date.getTime())) {
      onMessage('Date invalide.');
      return;
    }
    setActionSaving(true);
    try {
    await window.atoumweb.crm.clients.scheduleAction(client.id,actionBaseline.current,{at:date.toISOString(),text});
    actionGuard.saved(actionEditor);setActionEditor(null);
    await refresh();
    onMessage('Prochaine action client enregistrée.');
    }catch(error){onMessage(error instanceof Error?error.message:'Action non enregistrée.');}finally{setActionSaving(false);}
  }

  async function clearAction(client: ClientSummary): Promise<void> {
    if(actionSaving)return;setActionSaving(true);
    try {
    await window.atoumweb.crm.clients.scheduleAction(client.id,{at:client.nextActionAt??null,text:client.nextActionText??null},null);
    setActionEditor(null);
    await refresh();
    onMessage('Prochaine action client retirée.');
    }catch(error){onMessage(error instanceof Error?error.message:'Action non retirée.');}finally{setActionSaving(false);}
  }

  useEffect(()=>{if(!showContactForm)return;let active=true;window.atoumweb.crm.contacts.list().then(items=>{if(active)setAvailableContacts(items);}).catch(e=>{if(active)setContactError(String(e));});return()=>{active=false;};},[showContactForm]);

  async function submitContact(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!selected) return;
    setContactError(null);
    if (!contactDraft.existingContactId&&(!contactDraft.firstName.trim() || !contactDraft.lastName.trim())) {
      setContactError('Le prénom et le nom sont requis.');
      return;
    }

    if(!editingContactId&&contactDraft.existingContactId&&contacts.some(link=>link.contactId===contactDraft.existingContactId)){
      setContactError('Cette personne est déjà rattachée à ce client. Utilisez « Modifier la personne » dans sa fiche contact.');
      return;
    }

    const wasEditing = Boolean(editingContactId);
    setContactSaving(true);
    try {
      if (editingContactId) {
        const link = contacts.find((item) => item.contactId === editingContactId);
        if (!link) throw new Error('Contact introuvable.');
        const baseline=contactBaseline.current;if(!baseline)throw Error('Relis le contact avant de le modifier.');
        const saved=await window.atoumweb.crm.directory.saveContact({...baseline,firstName:contactDraft.firstName.trim(),lastName:contactDraft.lastName.trim(),jobTitle:contactDraft.jobTitle.trim()||null},{id:editingContactId,expected:baseline});contactBaseline.current=saved;
        if (contactDraft.makePrimary && !link.isPrimary) await window.atoumweb.crm.clients.setPrimaryContact(selected.id, editingContactId);
      } else await window.atoumweb.crm.clients.addContact(
        selected.id,
        {
          organizationId: selected.organizationId,
          firstName: contactDraft.firstName.trim(),
          lastName: contactDraft.lastName.trim(),
          jobTitle: contactDraft.jobTitle.trim() || null,
          email: contactDraft.email.trim() || null,
          phone: contactDraft.phone.trim() || null,
        },
        contactDraft.role,
        contactDraft.makePrimary,
        contactDraft.existingContactId||undefined,
      );
      contactGuard.saved(EMPTY_CONTACT_DRAFT);setContactDraft(EMPTY_CONTACT_DRAFT);
      setEditingContactId(null);
      setShowContactForm(false);
      await refresh();
      await refreshSelectedClientData(selected.id);
      onMessage(wasEditing ? 'Contact mis à jour.' : 'Contact ajouté au client.');
    } catch (error) {
      setContactError(error instanceof Error ? error.message.replace(/^Error invoking remote method ['"][^'"]+['"]:\s*(?:Error:\s*)?/i,'') : 'Impossible d’ajouter le contact.');
    } finally {
      setContactSaving(false);
    }
  }

  async function makePrimary(link: ClientContactLink): Promise<void> {
    if (!selected || link.isPrimary) return;
    await window.atoumweb.crm.clients.setPrimaryContact(selected.id, link.contactId);
    await refresh();
    await refreshSelectedClientData(selected.id);
    onMessage(`${link.contact.firstName} ${link.contact.lastName} est maintenant le contact principal.`);
  }

  return (
    <div className="crm-stack clients-v2">
      <header className="module-toolbar client-toolbar"><div className="client-heading"><h1><OperationIcon name="users"/>Clients</h1>
        <div className="client-list-count"><strong>{filtered.length}</strong><span> client{filtered.length > 1 ? 's' : ''}</span></div>          <button className="primary-button" type="button" onClick={() => showForm?clientCreateGuard.request(()=>setShowForm(false)):setShowForm(true)}>{showForm ? 'Fermer' : '+ Nouveau client'}</button>
        </div><div className="toolbar-controls">
          <button className="secondary-button" type="button" disabled={loading} onClick={() => void refreshAll()}><OperationIcon name="refresh"/>{loading ? 'Actualisation…' : 'Actualiser'}</button>
          <input aria-label="Rechercher les clients" className="inline-search" placeholder="Rechercher un client…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select aria-label="Filtrer les clients par statut" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | ClientStatus)}>
            <option value="all">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="inactive">Anciens clients</option>
            <option value="archived">Archivés</option>
          </select>
<div className="client-table-tools" ref={setTableToolsHost}/>
        </div>
      </header>

      {showForm && (
        <form className="panel crm-form" onSubmit={(event) => void submitClient(event)}>
          <div className="panel-title"><div><span className="eyebrow">Client</span><h2>Ajouter un client directement</h2></div></div>
          {allowTestFill&&<button className="secondary-button" type="button" onClick={() => { if(!allowTestFill)return;setDemoMode(true); setDraft({ company: 'DEMO — Atelier Mercure', firstName: 'Léa', lastName: 'Durand', email: 'lea@example.test', phone: '', website: 'atelier-mercure.example', notes: 'Dossier de démonstration.' }); setNeedsDraft([{ catalogItemId: 'atoumweb-ecommerce' }]); }}>Remplir avec des données test</button>}
          <button type="button" className="crm-logo-button" aria-label="Charger le logo du client" onClick={()=>void window.atoumweb.crm.identityAssets.chooseDraft().then(setClientDraftLogo).catch(e=>setFormError(String(e)))}>{clientDraftLogo?<img src={clientDraftLogo.preview} alt="Logo choisi" style={{width:72,height:72,objectFit:'contain'}}/>:<span className="status-pill">+ Logo</span>}</button>{clientDraftLogo&&<button type="button" className="secondary-button" onClick={()=>setClientDraftLogo(null)}>Retirer le logo choisi</button>}
          <fieldset disabled={saving}><div className="form-grid">
            <label><span className="field-label-with-help">Société <FieldHelp text="Nom de l’entreprise cliente. Laisse vide uniquement pour un client particulier." /></span><input value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} /></label>
            <label><span className="field-label-with-help">Prénom <FieldHelp text="Prénom du contact principal si le client est une personne ou si un interlocuteur est déjà identifié." /></span><input value={draft.firstName} onChange={(e) => setDraft({ ...draft, firstName: e.target.value })} /></label>
            <label><span className="field-label-with-help">Nom <FieldHelp text="Nom du contact principal." /></span><input value={draft.lastName} onChange={(e) => setDraft({ ...draft, lastName: e.target.value })} /></label>
            <label><span className="field-label-with-help">Email <FieldHelp text="Adresse de contact principale. Elle pourra ensuite être complétée par d’autres coordonnées." /></span><input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></label>
            <label><span className="field-label-with-help">Téléphone <FieldHelp text="Numéro principal du client ou de l’interlocuteur." /></span><input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></label>
            <label><span className="field-label-with-help">Site web <FieldHelp text="Saisis simplement exemple.fr : https:// sera ajouté automatiquement. Tu peux saisir http:// explicitement si nécessaire." /></span><input inputMode="url" value={draft.website} onChange={(e) => setDraft({ ...draft, website: e.target.value })} placeholder="exemple.fr" /></label>
            <NeedChoices value={needsDraft} onChange={setNeedsDraft}/>
            <label className="client-create-notes"><span className="field-label-with-help">Notes <FieldHelp text="Information interne utile au démarrage du dossier client." /></span><input value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></label>
          </div>
          </fieldset>
          {formError && <p className="form-error">{formError}</p>}
          <div className="form-actions"><button className="primary-button" disabled={saving} type="submit">{saving ? 'Création…' : 'Créer le client'}</button></div>
        </form>
      )}

      {loadError && <div className="panel fatal-card clients-load-error"><span className="eyebrow">Clients</span><h2>Chargement impossible</h2><p>{loadError}</p><button className="secondary-button" type="button" onClick={() => void refresh()}>Réessayer</button></div>}
      {loading && clients.length===0 ? <div className="panel"><p className="muted">Chargement des clients…</p></div> : (
        <div className={selected && !largeView ? 'clients-layout with-detail' : 'clients-layout'} style={clientSplitStyle}>
          <div className="panel table-panel">
            <ConfiguredDataTable<ClientSummary> controlsHost={tableToolsHost} compactHiddenColumnIds={selected&&!largeView?['coordinates']:[]} scope={CLIENT_DIRECTORY_VIEW} store={window.atoumweb.visualPreferences} className="clients-table" rows={filtered} selectedId={selectedId} getId={c=>c.id} onSelect={c=>openClient(c.id)} rowAttributes={c=>({'data-client-id':c.id,className:'client-relationship-'+(c.relationshipStatus??'neutral')})} caption="Clients · source complète des résultats filtrés" columns={[
              {id:'identity',label:'Client',required:true,sortValue:c=>c.displayName,render:c=><div className="client-name-cell"><CrmIdentityAvatar organizationId={c.organizationId} contactId={c.primaryContactId} name={c.displayName}/><div><strong>{c.displayName}</strong><small>Client depuis {new Date(c.becameClientAt).toLocaleDateString('fr-FR')}</small></div></div>},
              {id:'status',label:'Statut',sortValue:c=>STATUS_LABELS[c.status??'active'],render:c=><span className={'client-status status-'+c.status}>{STATUS_LABELS[c.status??'active']}</span>},
              {id:'contact',label:'Contact principal',sortValue:c=>c.contactName??null,render:c=>c.contactName||'—'},
              {id:'coordinates',label:'Coordonnées',sortValue:c=>c.email||c.phone||null,render:c=><div className="contact-stack"><span>{c.email||'—'}</span><small>{c.phone||''}</small></div>},
              {id:'nextAction',label:'Prochaine action',sortValue:c=>c.nextActionAt??null,render:c=>c.nextActionAt?<><strong>{c.nextActionText||'Action prévue'}</strong><small>{new Date(c.nextActionAt).toLocaleDateString('fr-FR')}{isClientActionOverdue(c.nextActionAt)&&<span className="client-overdue-label"> · En retard</span>}</small></>:<span className="muted">Aucune</span>},
              {id:'open',label:'Ouvrir',required:true,render:c=><button className="link-button" type="button" aria-label={'Ouvrir '+c.displayName} title={'Ouvrir '+c.displayName} onClick={e=>{e.stopPropagation();openClient(c.id);}}><OperationIcon name="record-open"/></button>},
            ]}/>

          </div>

          {clientSplitter}
          {selected && (
            <aside key={selected.id} tabIndex={-1} data-search-entity-type="client" data-search-entity-id={selected.id} ref={sidePanelRef} className={`panel client-summary-panel client-relationship-${selected.relationshipStatus ?? 'neutral'} ${largeView ? 'client-large-view' : ''}`} role={largeView ? 'dialog' : undefined} aria-modal={largeView ? true : undefined} aria-label={largeView ? `Fiche client ${selected.displayName}` : undefined}>
{!largeView&&<ClientQuickSummary selected={selected} quotes={quotes} projects={projects} detailLoading={detailLoading} sectionErrors={sectionErrors} onClose={closeClient} onExpand={()=>setLargeView(true)} onRelation={()=>{setLargeView(true);setRelationshipMenuOpen(true);}} onAction={()=>{setLargeView(true);setActiveTab('summary');openActionEditor(selected);}}/>}
{largeView&&<header className="client-desk-heading"><div><OperationIcon name="users"/><h2>Fiche client</h2><span>{selected.displayName}</span></div><div><button className="secondary-button" type="button" onClick={()=>setLargeView(false)}><OperationIcon name="arrow-left"/>Retour à la liste</button><button className="secondary-button" type="button" aria-label="Fermer la fiche client" onClick={closeClient}><OperationIcon name="close"/></button></div></header>}
<div className="client-detail-content"><CrmRecordLayout defaultRightWidth={260} defaultLeftWidth={320} kind="client" full={largeView} identity={<>              <div className="detail-panel-heading">
                <div>
                  <div className="client-summary-head"><CrmIdentityAvatar organizationId={selected.organizationId} contactId={selected.primaryContactId} name={selected.displayName} size="large" /><div><h2>{selected.displayName}</h2><span className={`client-status status-${selected.status}`}>{STATUS_LABELS[selected.status ?? 'active']}</span></div></div>
                </div>
                <div className="detail-heading-actions"><div className="client-relationship-picker"><button className="secondary-button client-relationship-trigger" type="button" aria-expanded={relationshipMenuOpen} aria-haspopup="true" disabled={relationshipSaving} onClick={() => setRelationshipMenuOpen((value) => !value)}><span className="client-relationship-dot" />Relation client · {RELATION_LABELS[selected.relationshipStatus ?? 'neutral']}</button>{relationshipMenuOpen && <div className="client-relationship-menu" role="group" aria-label="Qualité de la relation client">{RELATION_OPTIONS.map((option) => <button key={option} type="button" className={`client-relationship-choice client-relationship-${option}`} aria-pressed={(selected.relationshipStatus ?? 'neutral') === option} onClick={() => void updateRelationship(selected, option)}><span className="client-relationship-dot" />{RELATION_LABELS[option]}</button>)}</div>}</div><button className="operation-detail-expand client-detail-expand" type="button" title={largeView ? 'Réduire la fiche' : 'Agrandir la fiche'} aria-label={largeView ? 'Réduire la fiche' : 'Agrandir la fiche'} onClick={() => setLargeView((value) => !value)}><OperationIcon name={largeView ? 'record-reduce' : 'record-expand'} size={18} /></button><button className="close-detail" type="button" aria-label="Fermer la fiche client" title="Fermer la fiche client" onClick={closeClient}><OperationIcon name="close"/></button></div>
              </div>
<div className="crm-record-properties"><strong><OperationIcon name="contact"/>Coordonnées essentielles</strong>{!largeView&&<SummaryLine label="Prochaine action" value={selected.nextActionAt?`${selected.nextActionText||'Action'} · ${new Date(selected.nextActionAt).toLocaleDateString('fr-FR')}`:'Aucune action planifiée'}/>}{selected.contactName&&<SummaryLine label="Contact" value={selected.contactName}/>} {selected.email&&<SummaryLine label="Email" value={selected.email}/>} {selected.phone&&<SummaryLine label="Téléphone" value={selected.phone}/>}{identity?.organization?.city&&<SummaryLine label="Ville" value={[identity.organization.city,identity.organization.postalCode].filter(Boolean).join(' · ')}/>}<small>Client depuis {new Date(selected.becameClientAt).toLocaleDateString('fr-FR')}</small></div>
 {(selected.phone||selected.email||!(largeView&&activeTab==='summary'))&&<div className="client-quick-actions"><h3><OperationIcon name="bolt"/>Actions rapides</h3><div>{selected.phone&&<a className="secondary-button" href={'tel:'+selected.phone}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M5 3h4l2 5-3 2a15 15 0 0 0 6 6l2-3 5 2v4c0 2-2 2-3 2C9 20 4 15 3 6c0-1 0-3 2-3Z"/></svg>Appeler</a>}{selected.email&&<a className="secondary-button" href={'mailto:'+selected.email}><ClientDetailIcon kind="email"/>Envoyer un email</a>}<button hidden={largeView&&activeTab==='summary'} className="secondary-button" type="button" onClick={()=>{setActiveTab('summary');openActionEditor(selected);}}><OperationIcon name="calendar"/>Programmer une action</button></div></div>}
 <CrmIdentityAssetEditor organizationId={selected.organizationId} contactId={selected.primaryContactId} onMessage={onMessage}/>
</>} context={<ClientAssociations activeTab={activeTab} clientId={selected.id} quotes={quotes} projects={projects} interventions={interventions} loading={detailLoading} errors={sectionErrors} documentsRevision={documentsRevision} onTab={setActiveTab} onMessage={onMessage}/>}>

              <div role="tablist" aria-label="Rubriques du client" className="client-tabs-preview client-tabs-buttons client-v2-tabs">
                {CLIENT_TABS.map(([id,label])=><button key={id} id={'client-tab-'+id} role="tab" aria-selected={activeTab===id} aria-controls={'client-panel-'+id} tabIndex={activeTab===id?0:-1} type="button" onClick={event=>{setActiveTab(id);event.currentTarget.scrollIntoView({block:'nearest',inline:'nearest'});}} onKeyDown={event=>{const next=clientTabKey(id,event.key);if(next){event.preventDefault();setActiveTab(next);const target=document.getElementById('client-tab-'+next);target?.focus({preventScroll:true});target?.scrollIntoView({block:'nearest',inline:'nearest'});}}}><OperationIcon name={({summary:'user',contacts:'users',commercial:'file-text',contracts:'file-check',projects:'folder',operations:'wrench',documents:'inbox',history:'clock'} as const)[id]}/>{label}</button>)}
              </div>
              <div className="client-summary-scroll">
              {detailLoading&&<p role="status">Actualisation de la fiche…</p>}
              {Object.entries(sectionErrors).filter(([zone])=>(zone!=='quotes'||activeTab!=='commercial')&&(zone!=='projects'||activeTab!=='projects')&&(zone!=='activity'||activeTab!=='history')).map(([zone,error])=><p role="alert" key={zone}>Chargement incomplet — {zone} : {error} <button type="button" onClick={()=>void refreshSelectedClientData(selected.id)}>Réessayer</button></p>)}
              <section hidden={activeTab!=='summary'} id="client-panel-summary" className="client-summary-overview" role="tabpanel" aria-labelledby="client-tab-summary">
                <section className="client-primary-card client-summary-priority"><h3><OperationIcon name="clock"/> À traiter · Échéances</h3>
                  {<CrmReconciliationPanel owner="client" id={selected.id}/>}<details className="client-path-actions"><summary>Actions et échanges du parcours</summary><ClientActionsHistory key={selected.id} clientId={selected.id} onChanged={()=>void refresh()}/></details>{largeView&&isClientActionOverdue(selected.nextActionAt)&&<p className="client-expanded-overdue"><OperationIcon name="alert"/>En retard · action ouverte</p>}{selected.nextActionAt && <SummaryLine label="Prochaine action" value={`${selected.nextActionText || 'Action'} · ${new Date(selected.nextActionAt).toLocaleDateString('fr-FR')}`} />}
                  {interventions.filter(item=>!['completed','cancelled'].includes(item.status)).map(item=><button className="workflow-link" type="button" key={item.id} onClick={()=>setActiveTab('operations')}>Intervention {item.number} · {item.subject}</button>)}
                  {!detailLoading&&!sectionErrors.interventions&&!selected.nextActionAt&&!interventions.some(item=>!['completed','cancelled'].includes(item.status))&&<p className="muted">Aucune action ni intervention à suivre.</p>}
                  {actionEditor?.clientId === selected.id && (
                    <div className="inline-editor">
                      <strong>Programmer une action client</strong>
                      <label>Date<input disabled={actionSaving} type="date" value={actionEditor.date} onChange={(event) => setActionEditor({ ...actionEditor, date: event.target.value })} /></label>
                      <label>Action<input disabled={actionSaving} value={actionEditor.text} onChange={(event) => setActionEditor({ ...actionEditor, text: event.target.value })} placeholder="Ex. appeler pour faire le point" /></label>
                      <div className="inline-editor-actions">
                        {selected.nextActionAt && <button className="secondary-button compact-button" type="button" disabled={actionSaving} onClick={() => void clearAction(selected)}>Retirer l’action</button>}
                        <button className="secondary-button compact-button" type="button" onClick={() => actionGuard.request(()=>setActionEditor(null))}>Annuler</button>
                        <button className="primary-button compact-button" type="button" disabled={actionSaving} onClick={() => void saveAction(selected)}>Enregistrer</button>
                      </div>
                    </div>
                  )}

                  <div className="detail-actions"><button className="secondary-button" type="button" onClick={() => openActionEditor(selected)}>Programmer une action</button></div>
                </section>
                <section className="client-primary-card client-summary-commercial"><h3><OperationIcon name="layers"/>Prestations et suivi commercial</h3>
                  <ClientCommercialSummary quotes={quotes} subscriptions={subscriptions} loading={detailLoading} errors={sectionErrors} onTab={setActiveTab}/>
                </section>
                <section className="client-primary-card client-summary-activity"><h3><ClientDetailIcon kind="history"/>Activité récente</h3>
                  {activity.slice(0,3).map(event=><div className="activity-item" key={event.id}><span className="activity-dot"/><div><p>{event.summary}</p><small>{new Date(event.createdAt).toLocaleString('fr-FR')}</small></div></div>)}
                  {!detailLoading&&!activity.length&&!sectionErrors.activity&&<p className="muted">Aucune activité enregistrée.</p>}
                  <button type="button" className="link-button" onClick={()=>setActiveTab('history')}>Voir tout l’historique</button>
                </section>
                <details className="client-primary-card client-summary-coordinates"><summary><OperationIcon name="edit"/>Coordonnées détaillées et édition</summary><div className="contact-tab-heading">{identity?.organization&&<button className="secondary-button" type="button" onClick={()=>openEntity({entityType:'organization',entityId:identity.organization!.id,title:identity.organization!.name})}>Ouvrir l’organisation dans l’Annuaire</button>}<button className="secondary-button" type="button" onClick={beginCoordinateEdit}>Modifier</button></div>
                  {selected.contactName && <SummaryLine label="Contact principal" value={selected.contactName} />}
                  {selected.phone && <SummaryLine label="Téléphone" value={selected.phone} />}
                  {selected.email && <SummaryLine label="Email" value={selected.email} />}
                  {identity?.organization && [identity.organization.addressLine1, identity.organization.addressLine2, identity.organization.postalCode, identity.organization.city].some(Boolean) && <SummaryLine label="Adresse" value={[identity.organization.addressLine1, identity.organization.addressLine2, identity.organization.postalCode, identity.organization.city].filter(Boolean).join(' · ')} />}
                  {contacts.filter((item) => !item.isPrimary).map((item) => <div className="client-secondary-contact" key={item.id}><strong>{item.contact.firstName} {item.contact.lastName}</strong><span>{item.contact.phone || item.contact.email || ROLE_LABELS[item.role]}</span><button type="button" className="link-button" onClick={() => setActiveTab('contacts')}>Modifier</button></div>)}
                  <ContactMethodsPanel organizationId={identity?.organization?.id} contactId={identity?.contact?.id} />
                  <button className="secondary-button" type="button" onClick={() => { setActiveTab('contacts'); setShowContactForm(true); }}>Ajouter un contact</button>
                  {editingCoordinates && <fieldset disabled={coordinatesSaving} className="contact-inline-form"><div className="contact-form-grid">{identity?.contact && <><label>Prénom<input value={coordinateDraft.firstName} onChange={(event) => setCoordinateDraft({ ...coordinateDraft, firstName: event.target.value })} /></label><label>Nom<input value={coordinateDraft.lastName} onChange={(event) => setCoordinateDraft({ ...coordinateDraft, lastName: event.target.value })} /></label></>}{identity?.organization && <><label>Site web<input inputMode="url" value={coordinateDraft.website} onChange={(event) => setCoordinateDraft({ ...coordinateDraft, website: event.target.value })} placeholder="exemple.fr" /></label><label>Adresse<input value={coordinateDraft.addressLine1} onChange={(event) => setCoordinateDraft({ ...coordinateDraft, addressLine1: event.target.value })} /></label><label>Complément<input value={coordinateDraft.addressLine2} onChange={(event) => setCoordinateDraft({ ...coordinateDraft, addressLine2: event.target.value })} /></label><label>Code postal<input value={coordinateDraft.postalCode} onChange={(event) => setCoordinateDraft({ ...coordinateDraft, postalCode: event.target.value })} /></label><label>Ville<input value={coordinateDraft.city} onChange={(event) => setCoordinateDraft({ ...coordinateDraft, city: event.target.value })} /></label></>}</div><div className="inline-editor-actions"><button className="secondary-button" type="button" onClick={() => coordinateGuard.request(()=>setEditingCoordinates(false))}>Annuler</button><button className="primary-button" type="button" disabled={coordinatesSaving||(!identity?.contact && !identity?.organization)} onClick={() => void saveCoordinates()}>Enregistrer</button></div></fieldset>}
                </details>
              </section>
              <section hidden={activeTab!=='summary'} className="client-summary-management"><details open={archiveCandidateId===selected.id || undefined}><summary><OperationIcon name="users"/>Gestion de la relation client</summary>
<button className="secondary-button" type="button" onClick={()=>{if(relationEditor&&!relationGuard.request(()=>{}))return;setRelationEditor({value:selected.relationshipNote??'',expected:{status:selected.relationshipStatus??'neutral',note:selected.relationshipNote??null}});}}>Modifier la note de relation</button>{relationEditor&&<fieldset className="client-relation-editor" disabled={relationshipSaving}><label>Note de relation<textarea value={relationEditor.value} onChange={event=>setRelationEditor({...relationEditor,value:event.target.value})}/></label><button className="secondary-button" type="button" onClick={()=>relationGuard.request(()=>setRelationEditor(null))}>Annuler</button><button className="primary-button" type="button" onClick={()=>void saveRelationNote()}>Enregistrer la note</button></fieldset>}{selected.relationshipNote&&<SummaryLine label="Note de relation" value={selected.relationshipNote}/>}
                  <div className="client-status-control">
                    <label>Statut du client
                      <select value={selected.status} onChange={(event) => void updateStatus(selected, event.target.value as ClientStatus)}>
                        <option value="active">Actif — relation en cours</option>
                        <option value="inactive">Ancien client — relation terminée, historique conservé</option>
                        <option value="archived">Archivé — historique uniquement</option>
                      </select>
                    </label>
                    <p className="muted">Ce statut est indépendant de l’ancien pipeline Prospect. Un prospect gagné devient Client actif, puis tu gères ici sa relation dans le temps.</p>
                  </div>

                  {archiveCandidateId === selected.id && (
                    <div className="inline-editor danger-editor">
                      <strong>Archiver ce client ?</strong>
                      <p className="muted">Il ne sera pas supprimé. Contacts, historique et données seront conservés et accessibles avec le filtre « Archivés ».</p>
                      <div className="inline-editor-actions"><button className="secondary-button compact-button" type="button" onClick={() => setArchiveCandidateId(null)}>Annuler</button><button className="danger-button compact-button" type="button" onClick={() => void confirmArchive(selected)}>Confirmer l’archivage</button></div>
                    </div>
                  )}

                  {selected.notes && <div className="client-notes"><strong>Notes</strong><p>{selected.notes}</p></div>}


              </details></section>

              <section hidden={activeTab!=='contacts'} id="client-panel-contacts" role="tabpanel" aria-labelledby="client-tab-contacts"><div className="tab-content-stack">
                  <div className="contact-tab-heading client-contacts-heading"><div><h3><OperationIcon name="users"/>Contacts du client <span>{contacts.length}</span></h3><p>Personnes liées à {selected.displayName}</p></div><button className="primary-button compact-button" type="button" onClick={() => {if(showContactForm){contactGuard.request(()=>setShowContactForm(false));return;}setEditingContactId(null);setContactDraft(EMPTY_CONTACT_DRAFT);setShowContactForm(true);}}>{showContactForm ? 'Fermer le formulaire' : '+ Ajouter un contact'}</button></div>

                  {showContactForm && (
                    <form className="contact-inline-form" onSubmit={(event) => void submitContact(event)}><fieldset disabled={contactSaving}>
                      <div className="contact-form-grid">
                        {!editingContactId&&<label className="contact-source-choice">Créer ou rattacher une personne<select value={contactDraft.existingContactId??''} onChange={e=>setContactDraft({...contactDraft,existingContactId:e.target.value})}><option value="">Créer une nouvelle personne</option><optgroup label="Rattacher une personne de l’Annuaire">{availableContacts.map(c=><option key={c.id} value={c.id}>{c.firstName} {c.lastName} · {c.organizationName||'Sans entreprise'}</option>)}</optgroup></select><small>{contactDraft.existingContactId?(contacts.some(link=>link.contactId===contactDraft.existingContactId)?'Cette personne est déjà rattachée. Utilisez « Modifier la personne » dans sa fiche contact.':'Cette personne de l’Annuaire sera rattachée sans être recréée.'):'Cette personne sera créée dans l’Annuaire puis rattachée à ce client.'}</small></label>}
                        {!contactDraft.existingContactId&&<><label>Prénom<input value={contactDraft.firstName} onChange={(e) => setContactDraft({ ...contactDraft, firstName: e.target.value })} /></label>
                        <label>Nom<input value={contactDraft.lastName} onChange={(e) => setContactDraft({ ...contactDraft, lastName: e.target.value })} /></label>
                        <label>Fonction<input value={contactDraft.jobTitle} onChange={(e) => setContactDraft({ ...contactDraft, jobTitle: e.target.value })} /></label>
                        {!editingContactId && <><label>Email<input type="email" value={contactDraft.email} onChange={(e) => setContactDraft({ ...contactDraft, email: e.target.value })} /></label><label>Téléphone<input value={contactDraft.phone} onChange={(e) => setContactDraft({ ...contactDraft, phone: e.target.value })} /></label></>}
                        </>}<label>Rôle dans le compte Client<select value={contactDraft.role} disabled={Boolean(editingContactId)} onChange={(e) => setContactDraft({ ...contactDraft, role: e.target.value as ClientContactRole })}>{CLIENT_CONTACT_ROLES.map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}</select></label>
                      </div>
                      <label className="primary-check"><input type="checkbox" checked={contactDraft.makePrimary} onChange={(e) => setContactDraft({ ...contactDraft, makePrimary: e.target.checked })} /> Définir comme contact principal</label>
                      {contactError && <p className="form-error">{contactError}</p>}
                      <div className="form-actions"><button className="secondary-button" type="button" disabled={contactSaving} onClick={()=>contactGuard.request(()=>setShowContactForm(false))}>Annuler</button><button className="primary-button compact-button" disabled={contactSaving} type="submit">{contactSaving ? 'Enregistrement…' : editingContactId ? 'Enregistrer la personne' : contactDraft.existingContactId ? 'Rattacher la personne' : 'Créer et rattacher'}</button></div></fieldset>
                    </form>
                  )}

                  <div className="contact-cards-list">
                    {contacts.map((link) => (
                      <div className="contact-card" key={link.id}>
                        <CrmIdentityAvatar contactId={link.contactId} name={`${link.contact.firstName} ${link.contact.lastName}`} />
                        <div className="contact-card-main">
                          <strong>{link.contact.firstName} {link.contact.lastName}</strong>
                          <div className="client-contact-badges">{!(link.role==='primary'&&link.isPrimary)&&<span>{ROLE_LABELS[link.role]}</span>}{link.isPrimary&&<span className="client-contact-primary">Contact principal</span>}</div>
                          {link.contact.jobTitle && <small>{link.contact.jobTitle}</small>}

                        </div>
                        <div className="client-contact-actions"><button className="link-button" type="button" onClick={() => { if(!requestUnsavedExit(()=>{}))return;contactBaseline.current=structuredClone(link.contact);setEditingContactId(link.contactId); setContactDraft({ firstName: link.contact.firstName, lastName: link.contact.lastName, jobTitle: link.contact.jobTitle ?? '', email: link.contact.email ?? '', phone: link.contact.phone ?? '', role: link.role, makePrimary: link.isPrimary }); setShowContactForm(true); }}><OperationIcon name="edit"/>Modifier la personne</button>
                        <button className="link-button" type="button" onClick={()=>openEntity({entityType:'contact',entityId:link.contactId,title:link.contact.firstName+' '+link.contact.lastName})}><OperationIcon name="external-link"/>Voir dans l’Annuaire</button></div>{!link.isPrimary && <button className="link-button" type="button" onClick={() => void makePrimary(link)}>Définir principal</button>}
                        <div className="client-contact-coordinates"><div><ClientDetailIcon kind="email"/><div><span>Email</span>{link.contact.email?<a href={'mailto:'+link.contact.email}>{link.contact.email}</a>:<small>Non renseigné</small>}</div></div><div><ClientDetailIcon kind="phone"/><div><span>Téléphone</span>{link.contact.phone?<a href={'tel:'+link.contact.phone}>{link.contact.phone}</a>:<small>Non renseigné</small>}</div></div></div>
                        <ContactMethodsPanel contactId={link.contactId} allowOrganization={false} summaryLabel="Coordonnées supplémentaires, usages et moyens préférés" contactLabel={`${link.contact.firstName} ${link.contact.lastName}`} />
                      </div>
                    ))}
                    {contacts.length === 0 && <p className="muted">Aucun contact rattaché à ce client. Ajoute une personne ou réutilise une fiche de l’Annuaire.</p>}
                  </div>
                  <aside className="client-contacts-help"><OperationIcon name="users"/><div><strong>À propos des contacts</strong><p>Rattache une personne de l’Annuaire ou crée une nouvelle personne. Le contact principal est l’interlocuteur de référence du client ; ses moyens préférés se gèrent séparément.</p></div></aside>
                </div></section>

              <section hidden={activeTab!=='commercial'} id="client-panel-commercial" role="tabpanel" aria-labelledby="client-tab-commercial">
                <ClientCommercialTab quotes={quotes} loading={detailLoading} error={sectionErrors.quotes} onRetry={()=>{void refreshSelectedClientData(selected.id);}}/>
              </section>
              <section hidden={activeTab!=='contracts'} id="client-panel-contracts" role="tabpanel" aria-labelledby="client-tab-contracts"><ClientContractsPanel clientId={selected.id} quotes={quotes} active={activeTab==='contracts'} quoteError={sectionErrors.quotes} onMessage={onMessage}/></section>
              <section hidden={activeTab!=='projects'} id="client-panel-projects" role="tabpanel" aria-labelledby="client-tab-projects">
                <ClientProjectsTab key={selected.id} projects={projects} quotes={quotes} loading={detailLoading} error={sectionErrors.projects} onRetry={()=>{void refreshSelectedClientData(selected.id);}}/>
              </section>
              <section hidden={activeTab!=='operations'} id="client-panel-operations" role="tabpanel" aria-labelledby="client-tab-operations"><ClientOperationsTab clientId={selected.id} onMessage={onMessage}/></section>
              <section hidden={activeTab!=='documents'} id="client-panel-documents" role="tabpanel" aria-labelledby="client-tab-documents"><ClientDocumentsPanel clientId={selected.id} onChanged={()=>setDocumentsRevision(n=>n+1)}/></section>
              <section hidden={activeTab!=='history'} id="client-panel-history" role="tabpanel" aria-labelledby="client-tab-history"><ClientHistoryTab key={selected.id} clientId={selected.id} activity={activity} loading={detailLoading} error={sectionErrors.activity} onRetry={()=>{void refreshSelectedClientData(selected.id);}}/></section>
              </div>
</CrmRecordLayout></div>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  const icons={Contact:'user','Contact principal':'user','Prochaine action':'calendar','Note de relation':'users'} as const;
  const icon=icons[label as keyof typeof icons];
  const kind=label==='Téléphone'?'phone':label==='Email'?'email':label==='Ville'?'city':null;
  return <div className="summary-line"><span>{kind?<ClientDetailIcon kind={kind}/>:icon?<OperationIcon name={icon}/>:null} {label}</span><strong>{value}</strong></div>;
}
