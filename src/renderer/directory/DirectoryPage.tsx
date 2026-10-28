import {CrmReconciliationPanel} from '../crm/CrmReconciliationPanel';
import {OrganizationContactLinks} from '../crm/OrganizationContactLinks';
import {ConfiguredDataTable} from '../ui/ConfiguredDataTable';
import {DIRECTORY_ORGANIZATIONS_VIEW,DIRECTORY_CONTACTS_VIEW} from '../../shared/realTableSchemas';
import '../crm/crm-visual-foundation.css';
import { layoutKey, readLayout, writeLayout } from '../../shared/panelLayout';
import { useUnsavedDraft, requestUnsavedExit, UnsavedGroup, unsavedRegistry } from '../unsaved/unsaved';
import type { DirectoryVerification } from '../../shared/directoryIdentity';
import {useSearchTargetConfirmation,type EntityReady} from '../ui/useSearchTargetConfirmation';
import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  ActivityEvent,
  ContactInput,
  DirectoryContact,
  DirectoryOrganization,
  DirectoryRelation,
  OrganizationInput,
} from '../../shared/crm';
import { CrmIdentityAssetEditor, CrmIdentityAvatar } from '../crm/CrmIdentityVisual';
import { ContactMethodsPanel } from '../crm/ContactMethodsPanel';
import { OperationIcon } from '../operations/OperationIcon';
import { openEntity } from '../workflow/DossierPanel';
import './DirectoryPage.css';

export type DirectorySearchTarget = {
  entityType: 'organization' | 'contact';
  entityId: string;
};

type DirectoryView = 'organizations' | 'contacts';
type CreateMode = 'organization' | 'contact' | null;

const RELATION_LABELS: Record<DirectoryRelation, string> = {
  client: 'Client',
  prospect: 'Prospect',
  client_prospect: 'Client + prospect',
  external: 'Externe',
};

function relationClass(relation: DirectoryRelation): string {
  return `relation-${relation.replace('_', '-')}`;
}

function organizationForm(item?: DirectoryOrganization | null): OrganizationInput {
  return {
    name: item?.name ?? '',
    legalName: item?.legalName ?? '',
    siret: item?.siret ?? '',
    email: item?.email ?? '',
    phone: item?.phone ?? '',
    website: item?.website ?? '',
    addressLine1: item?.addressLine1 ?? '',
    addressLine2: item?.addressLine2 ?? '',
    postalCode: item?.postalCode ?? '',
    city: item?.city ?? '',
    country: item ? (item.country ?? '') : 'France',
    industry: item?.industry ?? '',
    notes: item?.notes ?? '',
  };
}

function contactForm(item?: DirectoryContact | null): ContactInput {
  return {
    organizationId: item?.organizationId ?? '',
    firstName: item?.firstName ?? '',
    lastName: item?.lastName ?? '',
    jobTitle: item?.jobTitle ?? '',
    email: item?.email ?? '',
    phone: item?.phone ?? '',
    preferredChannel: item?.preferredChannel ?? '',
    notes: item?.notes ?? '',
  };
}

function fullAddress(item: DirectoryOrganization): string {
  return [item.addressLine1, item.addressLine2, [item.postalCode, item.city].filter(Boolean).join(' '), item.country].filter(Boolean).join(' · ') || 'Non renseignée';
}

function formatPhone(value?: string | null): string {
  if (!value) return '—';
  const digits = value.replace(/\D/g, '');
  if (digits.length === 10) return digits.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
  return value;
}

function dateLabel(value?: string | null): string {
  return value ? new Date(value).toLocaleDateString('fr-FR') : '—';
}

type DirectoryPageProps={onMessage:(message:string)=>void;initialTarget?:DirectorySearchTarget|null;initialRequest?:number;onEntityReady?:EntityReady};
export function DirectoryPage(props:DirectoryPageProps){return <UnsavedGroup name="directory"><DirectoryPageContent {...props}/></UnsavedGroup>;}
function DirectoryPageContent({onEntityReady,onMessage,initialTarget,initialRequest}:DirectoryPageProps) {
  const [organizations, setOrganizations] = useState<DirectoryOrganization[]>([]);
  const [contacts, setContacts] = useState<DirectoryContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<DirectoryView>(initialTarget?.entityType === 'contact' ? 'contacts' : 'organizations');
  const [selectedType, setSelectedType] = useState<'organization' | 'contact' | null>(initialTarget?.entityType ?? null);
  const [selectedId, setSelectedId] = useState(initialTarget?.entityId ?? '');
  const selectedIdentityRef=useRef(selectedId);selectedIdentityRef.current=selectedId;
  const [createMode, setCreateMode] = useState<CreateMode>(null);
  const [expanded, setExpanded] = useState(false);
  const [splitPercent, setSplitPercent] = useState(38);
  const splitRef=useRef(splitPercent);splitRef.current=splitPercent;
  const splitCleanup=useRef<(()=>void)|null>(null);
  useEffect(()=>{try{setSplitPercent(Math.min(58,readLayout(window.atoumweb.visualPreferences,layoutKey('directory','list'),38)));}catch{onMessage('Disposition Annuaire indisponible ; largeur par défaut conservée.');}return()=>splitCleanup.current?.();},[]);
  function persistSplit(value:number){try{writeLayout(window.atoumweb.visualPreferences,layoutKey('directory','list'),value);}catch{onMessage('Largeur Annuaire non mémorisée.');}}

  const [query, setQuery] = useState('');
  const [relationFilter, setRelationFilter] = useState<'all' | DirectoryRelation>('all');
  const [secondaryFilter, setSecondaryFilter] = useState('all');
  const [editing, setEditing] = useState(false);
  const [organizationDraft, setOrganizationDraft] = useState<OrganizationInput>(() => organizationForm());
  const [contactDraft, setContactDraft] = useState<ContactInput>(() => contactForm());
  const [busy, setBusy] = useState(false);
  const [saveError,setSaveError]=useState('');
  const [identityHistory,setIdentityHistory]=useState<ActivityEvent[]>([]);
  const directoryOpener=useRef<HTMLElement|null>(null);
  const busyRef=useRef(busy);busyRef.current=busy;
  const operationId=useRef(crypto.randomUUID());
  const expectedOrganization=useRef<OrganizationInput|null>(null),expectedContact=useRef<ContactInput|null>(null);
  const [verification,setVerification]=useState<DirectoryVerification|null>(null),[verificationError,setVerificationError]=useState('');
  const verificationEpoch=useRef(0);
  const editorGuard=useUnsavedDraft('Identité Annuaire',createMode==='organization'||selectedType==='organization'?organizationDraft:contactDraft,{ready:!!createMode||editing||busy,pending:busy,resetKey:selectedType+':'+selectedId+':'+createMode+':'+editing,discard:()=>{setEditing(false);setCreateMode(null);}});

  useSearchTargetConfirmation(selectedType==='contact'?'contact':'organization',selectedType==='contact'?contacts.find(item=>item.id===selectedId)?.id:organizations.find(item=>item.id===selectedId)?.id,loading,onEntityReady);


  const refreshEpoch=useRef(0);useEffect(()=>()=>{refreshEpoch.current++;},[]);
  async function refresh(preferred?: DirectorySearchTarget | null): Promise<void> {
    const epoch=++refreshEpoch.current;
    setLoading(true);
    try {
      const [nextOrganizations, nextContacts] = await Promise.all([
        window.atoumweb.crm.organizations.list(false),
        window.atoumweb.crm.contacts.list(false),
      ]);
      if(epoch!==refreshEpoch.current)return;
      const preserveDraft=editorGuard.dirty||busyRef.current;
      setOrganizations(previous=>preserveDraft&&selectedType==='organization'&&selectedId&&!nextOrganizations.some(item=>item.id===selectedId)?[...nextOrganizations,...previous.filter(item=>item.id===selectedId)]:nextOrganizations);
      setContacts(previous=>preserveDraft&&selectedType==='contact'&&selectedId&&!nextContacts.some(item=>item.id===selectedId)?[...nextContacts,...previous.filter(item=>item.id===selectedId)]:nextContacts);
      const target = preferred ?? (selectedType && selectedId ? { entityType: selectedType, entityId: selectedId } : null);
      if (target?.entityType === 'organization' && nextOrganizations.some((item) => item.id === target.entityId)) {
        setView('organizations');
        setSelectedType('organization');
        setSelectedId(target.entityId);
      } else if (target?.entityType === 'contact' && nextContacts.some((item) => item.id === target.entityId)) {
        setView('contacts');
        setSelectedType('contact');
        setSelectedId(target.entityId);
      } else if (target && preserveDraft) {
        setSaveError('Cette identité n’est plus disponible ; la saisie locale est conservée.');
      } else if (target) {
        onEntityReady?.(target.entityType,target.entityId,'Entrée introuvable.');
        setSelectedType(null);
        setSelectedId('');
      }
    } catch (error) {
      if(epoch!==refreshEpoch.current)return;
      if(preferred)onEntityReady?.(preferred.entityType,preferred.entityId,error instanceof Error?error.message:'Annuaire indisponible.');
      onMessage(error instanceof Error ? error.message : 'Impossible de charger l’annuaire.');
    } finally {
      if(epoch===refreshEpoch.current)setLoading(false);
    }
  }

  useEffect(() => { void refresh(initialTarget ?? null); }, [initialTarget?.entityType, initialTarget?.entityId,initialRequest]);

  useEffect(() => {
    const reload = () => void refresh();
    window.addEventListener('atoumweb:changed', reload);
    return () => window.removeEventListener('atoumweb:changed', reload);
  }, [selectedType, selectedId]);

  const selectedOrganization = selectedType === 'organization' ? organizations.find((item) => item.id === selectedId) ?? null : null;
  const selectedContact = selectedType === 'contact' ? contacts.find((item) => item.id === selectedId) ?? null : null;

  useEffect(() => {
    setSaveError('');
    if (selectedOrganization) setOrganizationDraft(organizationForm(selectedOrganization));
    if (selectedContact) setContactDraft(contactForm(selectedContact));
    setEditing(false);
  }, [selectedOrganization?.id, selectedContact?.id]);

  const organizationIndustries = useMemo(() => [...new Set(organizations.map((item) => item.industry?.trim()).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b, 'fr')), [organizations]);
  const contactOrganizations = useMemo(() => [...new Map(organizations.map((item) => [item.id, item])).values()].sort((a, b) => a.name.localeCompare(b.name, 'fr')), [organizations]);

  const filteredOrganizations = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('fr-FR');
    return organizations.filter((item) => {
      if (relationFilter !== 'all' && item.relation !== relationFilter) return false;
      if (secondaryFilter !== 'all' && (item.industry ?? '') !== secondaryFilter) return false;
      if (!needle) return true;
      return [
        item.name, item.legalName ?? '', item.industry ?? '', item.city ?? '', item.email ?? '', item.phone ?? '',
        item.website ?? '', item.siret ?? '', item.notes ?? '',
      ].some((value) => value.toLocaleLowerCase('fr-FR').includes(needle));
    });
  }, [organizations, query, relationFilter, secondaryFilter]);

  const filteredContacts = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('fr-FR');
    return contacts.filter((item) => {
      if (relationFilter !== 'all' && item.relation !== relationFilter) return false;
      if (secondaryFilter !== 'all' && !item.organizationLinks?.some(l=>l.organizationId===secondaryFilter&&!l.archivedAt)) return false;
      if (!needle) return true;
      return [
        item.firstName, item.lastName, item.organizationName ?? '',...(item.organizationLinks??[]).filter(l=>!l.archivedAt).map(l=>l.jobTitle??''), item.jobTitle ?? '', item.email ?? '', item.phone ?? '', item.notes ?? '',
      ].some((value) => value.toLocaleLowerCase('fr-FR').includes(needle));
    });
  }, [contacts, query, relationFilter, secondaryFilter]);

  const activeClients = organizations.filter((item) => item.activeClientCount > 0).length;
  const activeProspects = organizations.filter((item) => item.activeProspectCount > 0).length;
  const selectedOrganizationContacts = selectedOrganization ? contacts.filter((item) => item.organizationLinks?.some(l=>l.organizationId===selectedOrganization.id&&!l.archivedAt)).map(item=>({...item,jobTitle:item.organizationLinks?.find(l=>l.organizationId===selectedOrganization.id&&!l.archivedAt)?.jobTitle??null})) : [];
  const showDetail = Boolean(selectedOrganization || selectedContact || createMode);

  function closeDirectory():void {
    requestUnsavedExit(()=>{refreshEpoch.current++;setLoading(false);setCreateMode(null);setSelectedType(null);setSelectedId('');setExpanded(false);setEditing(false);requestAnimationFrame(()=>{if(selectedIdentityRef.current)return;const row=selectedId?document.querySelector<HTMLElement>('[data-directory-id="'+CSS.escape(selectedId)+'"]'):null;if(row)row.focus();else if(directoryOpener.current?.isConnected)directoryOpener.current.focus();else document.querySelector<HTMLInputElement>('.directory-toolbar .inline-search')?.focus();});});
  }
  function toggleEdit():void {
    if(editing){editorGuard.request(()=>setEditing(false));return;}
    if(selectedOrganization){expectedOrganization.current=selectedOrganization;setOrganizationDraft(organizationForm(selectedOrganization));}
    if(selectedContact){expectedContact.current=selectedContact;setContactDraft(contactForm(selectedContact));}
    setSaveError('');setEditing(true);
  }
  function chooseView(next:DirectoryView):void {
    if(next===view)return;
    requestUnsavedExit(()=>{refreshEpoch.current++;setLoading(false);setView(next);setSelectedType(null);setSelectedId('');setCreateMode(null);setExpanded(false);setEditing(false);setSecondaryFilter('all');});
  }
  function selectOrganization(id:string):void {
    if(selectedType==='organization'&&selectedId===id&&!createMode)return;
    requestUnsavedExit(()=>{directoryOpener.current=document.activeElement instanceof HTMLElement?document.activeElement:null;refreshEpoch.current++;setLoading(false);setCreateMode(null);setEditing(false);setSelectedType('organization');setSelectedId(id);setExpanded(false);});
  }
  function selectContact(id:string):void {
    if(selectedType==='contact'&&selectedId===id&&!createMode)return;
    requestUnsavedExit(()=>{directoryOpener.current=document.activeElement instanceof HTMLElement?document.activeElement:null;refreshEpoch.current++;setLoading(false);setCreateMode(null);setEditing(false);setSelectedType('contact');setSelectedId(id);setExpanded(false);});
  }

  function beginResize(): void {
    const workspace = document.querySelector<HTMLElement>('.directory-workspace.with-detail');
    if (!workspace) return;
    document.body.classList.add('directory-resizing');
    const onMove = (event: PointerEvent) => {
      const rect = workspace.getBoundingClientRect();
      if (!rect.width) return;
      const ratio = ((event.clientX - rect.left) / rect.width) * 100;
      splitRef.current=Math.max(20,Math.min(58,ratio));setSplitPercent(splitRef.current);
    };
    const cleanup = () => {
      document.body.classList.remove('directory-resizing');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);window.removeEventListener('pointercancel',onUp);splitCleanup.current=null;
    };
    const onUp=()=>{cleanup();persistSplit(splitRef.current);};splitCleanup.current?.();splitCleanup.current=cleanup;
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });window.addEventListener('pointercancel',onUp,{once:true});
  }

  function openCreate(mode: Exclude<CreateMode, null>): void {
    if(!requestUnsavedExit(()=>{}))return;
    directoryOpener.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
    operationId.current=crypto.randomUUID();setSaveError('');
    setCreateMode(mode);
    setSelectedType(null);
    setSelectedId('');
    setExpanded(false);
    setEditing(false);
    if (mode === 'organization') setOrganizationDraft(organizationForm());
    else setContactDraft(contactForm());
  }

  async function saveOrganization(create=false):Promise<void>{
    if(busyRef.current)return;
    busyRef.current=true;setBusy(true);setSaveError('');
    try{
      if(!create&&!selectedOrganization)throw Error('Organisation introuvable.');
      const saved=await window.atoumweb.crm.directory.saveOrganization(organizationDraft,create?{operationId:operationId.current}:{id:selectedOrganization!.id,expected:expectedOrganization.current??undefined});
      editorGuard.saved(organizationDraft);setCreateMode(null);setEditing(false);
      await refresh({entityType:'organization',entityId:saved.id});window.dispatchEvent(new Event('atoumweb:changed'));onMessage('Organisation enregistrée dans l’Annuaire.');
    }catch(error){setSaveError(error instanceof Error?error.message:'Organisation non enregistrée.');}
    finally{busyRef.current=false;setBusy(false);}
  }
  async function saveContact(create=false):Promise<void>{
    if(busyRef.current)return;
    busyRef.current=true;setBusy(true);setSaveError('');
    try{
      if(!create&&!selectedContact)throw Error('Contact introuvable.');
      const saved=await window.atoumweb.crm.directory.saveContact({...contactDraft,organizationId:contactDraft.organizationId||null},create?{operationId:operationId.current}:{id:selectedContact!.id,expected:expectedContact.current??undefined});
      editorGuard.saved(contactDraft);setCreateMode(null);setEditing(false);
      await refresh({entityType:'contact',entityId:saved.id});window.dispatchEvent(new Event('atoumweb:changed'));onMessage('Contact enregistré dans l’Annuaire.');
    }catch(error){setSaveError(error instanceof Error?error.message:'Contact non enregistré.');}
    finally{busyRef.current=false;setBusy(false);}
  }
  async function loadVerification():Promise<void>{
    const epoch=++verificationEpoch.current;setVerification(null);setIdentityHistory([]);setVerificationError('');
    if(!selectedType||!selectedId)return;
    try{const value=await window.atoumweb.crm.directory.verification(selectedType,selectedId);if(epoch===verificationEpoch.current)setVerification(value);const history=await window.atoumweb.crm.activity.list(selectedType,selectedId);if(epoch===verificationEpoch.current)setIdentityHistory(history);}
    catch(error){if(epoch===verificationEpoch.current)setVerificationError(error instanceof Error?error.message:'Vérification indisponible.');}
  }
  useEffect(()=>{void loadVerification();return()=>{verificationEpoch.current++;};},[selectedOrganization,selectedContact]);
  async function verifyIdentity():Promise<void>{
    if(!selectedType||!selectedId||!verification||busyRef.current||editing)return;
    if(unsavedRegistry.active('directory').length){setVerificationError('Enregistre ou annule les saisies de cette identité avant de déclarer sa vérification.');return;}
    busyRef.current=true;setBusy(true);setVerificationError('');
    try{setVerification(await window.atoumweb.crm.directory.verify(selectedType,selectedId,verification.currentFingerprint));setIdentityHistory(await window.atoumweb.crm.activity.list(selectedType,selectedId));}
    catch(error){setVerificationError(error instanceof Error?error.message:'Vérification non enregistrée.');}
    finally{busyRef.current=false;setBusy(false);}
  }
  const verificationPanel=selectedId&&!createMode?<section className="directory-verification"><strong>Dernière vérification humaine</strong>{verification?<><p>{verification.verifiedAt?'Déclarée le '+dateLabel(verification.verifiedAt)+' · déclaration manuelle dans le Manager':'Aucune vérification déclarée.'}</p>{verification.verifiedAt&&verification.verifiedFingerprint!==verification.currentFingerprint&&<p role="status">Les informations ont changé depuis cette vérification.</p>}<button className="secondary-button" type="button" disabled={busy||editing} onClick={()=>void verifyIdentity()}>Déclarer les coordonnées vérifiées</button></>:<p>Vérification en cours de lecture…</p>}{verificationError&&<p role="alert">{verificationError}<button type="button" onClick={()=>void loadVerification()}>Relire</button></p>}<details><summary>Historique de l’identité et provenance</summary>{identityHistory.map(event=><p key={event.id}>{dateLabel(event.createdAt)} · {event.summary}</p>)}{!identityHistory.length&&<p>Aucun événement chargé.</p>}</details></section>:null;

  function navigateRelation(clientId?: string | null, prospectId?: string | null): void {
    if (clientId) {
      openEntity({ entityType: 'client', entityId: clientId, title: 'Client' });
      return;
    }
    if (prospectId) openEntity({ entityType: 'prospect', entityId: prospectId, title: 'Prospect' });
  }

  return <div className="directory-page-stack">{saveError&&<p role="alert" className="form-error">{saveError}</p>}
    <div className="directory-kpi-grid">
      <DirectoryKpi icon="folder" label="Organisations" value={organizations.length} helper="Entreprises et structures" />
      <DirectoryKpi icon="user" label="Contacts" value={contacts.length} helper="Interlocuteurs enregistrés" />
      <DirectoryKpi icon="check-circle" label="Clients liés" value={activeClients} helper="Organisations clientes" />
      <DirectoryKpi icon="chart" label="Prospects actifs" value={activeProspects} helper="Organisations en prospection" />
    </div>

    <div className="directory-toolbar">
      <div className="directory-view-tabs">
        <button type="button" className={view === 'organizations' ? 'active' : ''} onClick={() => chooseView('organizations')}><OperationIcon name="folder" size={16} /> Organisations <span>{organizations.length}</span></button>
        <button type="button" className={view === 'contacts' ? 'active' : ''} onClick={() => chooseView('contacts')}><OperationIcon name="user" size={16} /> Contacts <span>{contacts.length}</span></button>
      </div>
      <div className="toolbar-controls">
        <button className="secondary-button" type="button" onClick={() => void refresh()}><OperationIcon name="refresh" size={16} /> Actualiser</button>
        <input aria-label="Rechercher dans l’annuaire" className="inline-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={view === 'organizations' ? 'Rechercher entreprise, ville, activité…' : 'Rechercher contact, entreprise, fonction…'} />
        <select value={relationFilter} onChange={(event) => setRelationFilter(event.target.value as 'all' | DirectoryRelation)}>
          <option value="all">Toutes les relations</option>
          <option value="client">Clients</option>
          <option value="prospect">Prospects</option>
          <option value="client_prospect">Client + prospect</option>
          <option value="external">Externes</option>
        </select>
        {view === 'organizations'
          ? <select value={secondaryFilter} onChange={(event) => setSecondaryFilter(event.target.value)}><option value="all">Toutes les activités</option>{organizationIndustries.map((industry) => <option key={industry} value={industry}>{industry}</option>)}</select>
          : <select value={secondaryFilter} onChange={(event) => setSecondaryFilter(event.target.value)}><option value="all">Toutes les entreprises</option>{contactOrganizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}</select>}
        <button className="primary-button" type="button" onClick={() => openCreate(view === 'organizations' ? 'organization' : 'contact')}><OperationIcon name={view === 'organizations' ? 'folder' : 'user'} size={16} /> + {view === 'organizations' ? 'Organisation' : 'Contact'}</button>
      </div>
    </div>

    <div
      className={`directory-workspace ${showDetail ? 'with-detail' : ''} ${expanded ? 'detail-expanded' : ''}`}
      style={showDetail && !expanded ? { gridTemplateColumns: `${splitPercent}% 8px minmax(0, 1fr)` } : undefined}
    >
      {!expanded && <article className="panel directory-list-panel">
        {loading && organizations.length===0 && contacts.length===0 ? <p className="muted directory-empty">Chargement de l’annuaire…</p> : showDetail ? <div className="directory-compact-list">
          {view === 'organizations' ? filteredOrganizations.map((item) => <button key={item.id} type="button" className={`directory-compact-item ${selectedType === 'organization' && selectedId === item.id ? 'selected' : ''}`} tabIndex={0} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();selectOrganization(item.id);}}} data-directory-id={item.id} onClick={() => selectOrganization(item.id)}>
            <CrmIdentityAvatar organizationId={item.id} name={item.name} />
            <span className="directory-compact-copy"><strong>{item.name}</strong><span>{[item.industry, item.city].filter(Boolean).join(' · ') || 'Organisation'}</span><small>{item.contactCount} contact{item.contactCount > 1 ? 's' : ''}</small></span>
            <span className={`directory-relation-pill ${relationClass(item.relation)}`}>{RELATION_LABELS[item.relation]}</span>
          </button>) : filteredContacts.map((item) => <button key={item.id} type="button" className={`directory-compact-item ${selectedType === 'contact' && selectedId === item.id ? 'selected' : ''}`} tabIndex={0} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();selectContact(item.id);}}} data-directory-id={item.id} onClick={() => selectContact(item.id)}>
            <CrmIdentityAvatar organizationId={item.organizationId} contactId={item.id} name={`${item.firstName} ${item.lastName}`} />
            <span className="directory-compact-copy"><strong>{item.firstName} {item.lastName}</strong><span>{item.organizationName || 'Sans entreprise'}</span><small>{item.jobTitle || 'Fonction non renseignée'}</small></span>
            <span className={`directory-relation-pill ${relationClass(item.relation)}`}>{RELATION_LABELS[item.relation]}</span>
          </button>)}
          {((view === 'organizations' && !filteredOrganizations.length) || (view === 'contacts' && !filteredContacts.length)) && <p className="muted directory-empty">Aucun résultat dans cette vue.</p>}
        </div> : view === 'organizations' ? <ConfiguredDataTable<DirectoryOrganization> scope={DIRECTORY_ORGANIZATIONS_VIEW} store={window.atoumweb.visualPreferences} className="directory-table" rows={filteredOrganizations} selectedId={selectedType==='organization'?selectedId:null} getId={item=>item.id} onSelect={item=>selectOrganization(item.id)} rowAttributes={item=>({'data-directory-id':item.id})} caption="Organisations · source complète des résultats filtrés" columns={[
          {id:'identity',label:'Organisation',required:true,sortValue:i=>i.name,render:i=><div className="directory-name-cell"><CrmIdentityAvatar organizationId={i.id} name={i.name}/><div><strong>{i.name}</strong><small>{i.legalName||i.website||'Organisation professionnelle'}</small></div></div>},
          {id:'industry',label:'Activité',sortValue:i=>i.industry??null,render:i=>i.industry||'—'},
          {id:'city',label:'Ville',sortValue:i=>i.city??null,render:i=>i.city||'—'},
          {id:'coordinates',label:'Coordonnées',sortValue:i=>i.email||i.phone||null,render:i=><><span>{i.email||'—'}</span><small>{formatPhone(i.phone)}</small></>},
          {id:'contacts',label:'Contacts',sortValue:i=>i.contactCount,render:i=>i.contactCount},
          {id:'relation',label:'Relation',sortValue:i=>RELATION_LABELS[i.relation],render:i=><span className={'directory-relation-pill '+relationClass(i.relation)}>{RELATION_LABELS[i.relation]}</span>},
          {id:'open',label:'Ouvrir',required:true,render:i=><button type="button" className="link-button" title={'Ouvrir '+i.name} aria-label={'Ouvrir '+i.name} onClick={e=>{e.stopPropagation();selectOrganization(i.id);}}><OperationIcon name="record-open"/></button>},
        ]}/> : <ConfiguredDataTable<DirectoryContact> scope={DIRECTORY_CONTACTS_VIEW} store={window.atoumweb.visualPreferences} className="directory-table" rows={filteredContacts} selectedId={selectedType==='contact'?selectedId:null} getId={i=>i.id} onSelect={i=>selectContact(i.id)} rowAttributes={i=>({'data-directory-id':i.id})} caption="Contacts · source complète des résultats filtrés" columns={[
          {id:'identity',label:'Contact',required:true,sortValue:i=>i.lastName+' '+i.firstName,render:i=><div className="directory-name-cell"><CrmIdentityAvatar organizationId={i.organizationId} contactId={i.id} name={i.firstName+' '+i.lastName}/><div><strong>{i.firstName} {i.lastName}</strong><small>{i.preferredChannel||'Contact professionnel'}</small></div></div>},
          {id:'organization',label:'Entreprise',sortValue:i=>i.organizationName??null,render:i=>i.organizationName||'—'},
          {id:'jobTitle',label:'Fonction',sortValue:i=>i.jobTitle??null,render:i=>i.jobTitle||'—'},
          {id:'coordinates',label:'Coordonnées',sortValue:i=>i.email||i.phone||null,render:i=><><span>{i.email||'—'}</span><small>{formatPhone(i.phone)}</small></>},
          {id:'relation',label:'Relation',sortValue:i=>RELATION_LABELS[i.relation],render:i=><span className={'directory-relation-pill '+relationClass(i.relation)}>{RELATION_LABELS[i.relation]}</span>},
          {id:'open',label:'Ouvrir',required:true,render:i=><button type="button" className="link-button" title={'Ouvrir '+i.firstName+' '+i.lastName} aria-label={'Ouvrir '+i.firstName+' '+i.lastName} onClick={e=>{e.stopPropagation();selectContact(i.id);}}><OperationIcon name="record-open"/></button>},
        ]}/>}

      </article>}

      {showDetail && !expanded && <div className="directory-splitter" role="separator" aria-orientation="vertical" aria-label="Redimensionner la liste et la fiche annuaire" tabIndex={0} onPointerDown={beginResize} onDoubleClick={() => {setSplitPercent(38);persistSplit(38);}} onKeyDown={(event) => {
        if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();const value=Math.max(20,Math.min(58,splitRef.current+(event.key==='ArrowLeft'?-3:3)));setSplitPercent(value);persistSplit(value);}
      }}><span /></div>}

      {createMode && <article className={`panel directory-detail-panel ${expanded ? 'expanded' : ''}`}>
        <DirectoryDetailActions expanded={expanded} onExpand={() => setExpanded((value) => !value)} onClose={closeDirectory} />
        <div className="directory-detail-heading"><span className="eyebrow">Nouvelle entrée</span><h2>{createMode === 'organization' ? 'Ajouter une organisation' : 'Ajouter un contact'}</h2><p>Une seule identité, réutilisable ensuite dans le CRM.</p></div>
        {createMode === 'organization'
          ? <OrganizationEditor value={organizationDraft} onChange={setOrganizationDraft} onSave={() => void saveOrganization(true)} busy={busy} includeCoordinates />
          : <ContactEditor value={contactDraft} organizations={organizations} onChange={setContactDraft} onSave={() => void saveContact(true)} busy={busy} includeCoordinates />}
      </article>}

      {selectedOrganization && !createMode && <article data-search-entity-type="organization" data-search-entity-id={selectedOrganization.id} key={selectedOrganization.id} className={`panel directory-detail-panel ${expanded ? 'expanded' : ''}`}>
        <DirectoryDetailActions expanded={expanded} onExpand={() => setExpanded((value) => !value)} onClose={closeDirectory} />
        <div className="directory-identity-heading">
          <CrmIdentityAvatar organizationId={selectedOrganization.id} name={selectedOrganization.name} size="large" />
          <div><span className="eyebrow">Organisation</span><h2>{selectedOrganization.name}</h2><p>{[selectedOrganization.industry, selectedOrganization.city].filter(Boolean).join(' · ') || 'Organisation professionnelle'}</p></div>
        </div>
        <div className="directory-status-row">
          <span className={`directory-relation-pill ${relationClass(selectedOrganization.relation)}`}>{RELATION_LABELS[selectedOrganization.relation]}</span>
          {selectedOrganization.clientId && <button className="secondary-button" type="button" onClick={() => navigateRelation(selectedOrganization.clientId, null)}>Ouvrir le client</button>}
          {selectedOrganization.prospectId && <button className="secondary-button" type="button" onClick={() => navigateRelation(null, selectedOrganization.prospectId)}>Ouvrir le prospect</button>}
          <button className="secondary-button" type="button" onClick={toggleEdit}>{editing ? 'Annuler' : 'Modifier'}</button>
        </div>

        <CrmReconciliationPanel owner="organization" id={selectedOrganization.id}/>
        <CrmIdentityAssetEditor organizationId={selectedOrganization.id} onMessage={onMessage}/>
        {verificationPanel}{editing ? <OrganizationEditor value={organizationDraft} onChange={setOrganizationDraft} onSave={() => void saveOrganization(false)} busy={busy} /> : <>
          <div className="directory-meta-grid">
            <div><span>Activité</span><strong>{selectedOrganization.industry || 'Non renseignée'}</strong></div>
            <div><span>Ville</span><strong>{selectedOrganization.city || 'Non renseignée'}</strong></div>
            <div><span>Site web</span><strong>{selectedOrganization.website || 'Non renseigné'}</strong></div>
            <div><span>SIRET</span><strong>{selectedOrganization.siret || 'Non renseigné'}</strong></div>
          </div>
          <section className="directory-info-block"><div><span>Adresse</span><strong>{fullAddress(selectedOrganization)}</strong></div></section>
          <ContactMethodsPanel organizationId={selectedOrganization.id} contactOwners={selectedOrganizationContacts.map((contact) => ({ id: contact.id, label: `${contact.firstName} ${contact.lastName}` }))} summaryLabel="Coordonnées de l’organisation" />
          <section className="directory-info-block">
            <div><span>Contacts rattachés</span><strong>{selectedOrganizationContacts.length} contact{selectedOrganizationContacts.length > 1 ? 's' : ''}</strong></div>
            <div className="directory-linked-contacts">{selectedOrganizationContacts.map((contact) => <button type="button" key={contact.id} onClick={() => { setView('contacts'); setSecondaryFilter('all'); selectContact(contact.id); }}><CrmIdentityAvatar organizationId={selectedOrganization.id} contactId={contact.id} name={`${contact.firstName} ${contact.lastName}`} /><span><strong>{contact.firstName} {contact.lastName}</strong><small>{contact.jobTitle || 'Fonction non renseignée'}</small></span></button>)}{!selectedOrganizationContacts.length && <p className="muted">Aucun contact rattaché.</p>}</div>
          </section>
          <section className="directory-info-block"><div><span>Notes</span><strong>{selectedOrganization.notes || 'Aucune note'}</strong></div></section>

        </>}
      </article>}

      {selectedContact && !createMode && <article data-search-entity-type="contact" data-search-entity-id={selectedContact.id} key={selectedContact.id} className={`panel directory-detail-panel ${expanded ? 'expanded' : ''}`}>
        <DirectoryDetailActions expanded={expanded} onExpand={() => setExpanded((value) => !value)} onClose={closeDirectory} />
        <div className="directory-identity-heading">
          <CrmIdentityAvatar organizationId={selectedContact.organizationId} contactId={selectedContact.id} name={`${selectedContact.firstName} ${selectedContact.lastName}`} size="large" />
          <div><span className="eyebrow">Contact</span><h2>{selectedContact.firstName} {selectedContact.lastName}</h2><p>{[(selectedContact.organizationLinks?.filter(l=>!l.archivedAt).length??0)>1?'Plusieurs fonctions — voir les associations':selectedContact.jobTitle, selectedContact.organizationName].filter(Boolean).join(' · ') || 'Contact professionnel'}</p></div>
        </div>
        <div className="directory-status-row">
          <span className={`directory-relation-pill ${relationClass(selectedContact.relation)}`}>{RELATION_LABELS[selectedContact.relation]}</span>
          {selectedContact.clientId && <button className="secondary-button" type="button" onClick={() => navigateRelation(selectedContact.clientId, null)}>Ouvrir le client</button>}
          {selectedContact.prospectId && <button className="secondary-button" type="button" onClick={() => navigateRelation(null, selectedContact.prospectId)}>Ouvrir le prospect</button>}
          <button className="secondary-button" type="button" onClick={toggleEdit}>{editing ? 'Annuler' : 'Modifier'}</button>
        </div>

        <CrmIdentityAssetEditor contactId={selectedContact.id} onMessage={onMessage}/>
        {verificationPanel}{editing ? <ContactEditor value={contactDraft} organizations={organizations} onChange={setContactDraft} onSave={() => void saveContact(false)} busy={busy} /> : <>
          <div className="directory-meta-grid">
            <div><span>Entreprise</span><strong>{selectedContact.organizationName || 'Aucune'}</strong></div>
            <div><span>Fonction</span><strong>{selectedContact.jobTitle || 'Non renseignée'}</strong></div>
            <div><span>Canal préféré</span><strong>{selectedContact.preferredChannel || 'Non renseigné'}</strong></div>
            <div><span>Mis à jour</span><strong>{dateLabel(selectedContact.updatedAt)}</strong></div>
          </div>
          <CrmReconciliationPanel owner="contact" id={selectedContact.id}/>
          {selectedContact.legacyJobTitle&&<p>Ancienne fonction sans association confirmée : {selectedContact.legacyJobTitle}</p>}
          <OrganizationContactLinks contactId={selectedContact.id} onChanged={()=>void refresh()}/>
          <ContactMethodsPanel organizationId={selectedContact.organizationId} contactId={selectedContact.id} summaryLabel="Coordonnées du contact" />
          <section className="directory-info-block"><div><span>Notes</span><strong>{selectedContact.notes || 'Aucune note'}</strong></div></section>

        </>}
      </article>}
    </div>
  </div>;
}

function DirectoryKpi({ icon, label, value, helper }: { icon: 'folder' | 'user' | 'check-circle' | 'chart'; label: string; value: number; helper: string }) {
  return <article><span className="directory-kpi-icon"><OperationIcon name={icon} size={27} /></span><div><strong>{label}</strong><span>{value}</span><small>{helper}</small></div></article>;
}

function DirectoryDetailActions({ expanded, onExpand, onClose }: { expanded: boolean; onExpand: () => void; onClose: () => void }) {
  return <div className="directory-detail-actions"><button className="operation-detail-expand" type="button" title={expanded ? 'Réduire la fiche' : 'Agrandir la fiche'} aria-label={expanded ? 'Réduire la fiche' : 'Agrandir la fiche'} onClick={onExpand}><OperationIcon name={expanded ? 'record-reduce' : 'record-expand'} size={18} /></button><button className="close-detail" type="button" title="Fermer" onClick={onClose}><OperationIcon name="close" size={18} /></button></div>;
}

function OrganizationEditor({ value, onChange, onSave, busy, includeCoordinates = false }: { value: OrganizationInput; onChange: (value: OrganizationInput) => void; onSave: () => void; busy: boolean; includeCoordinates?: boolean }) {
  return <fieldset disabled={busy} className="directory-editor">
    <label className="wide">Nom de l’organisation<input value={value.name} onChange={(event) => onChange({ ...value, name: event.target.value })} /></label>
    <label>Raison sociale<input value={value.legalName ?? ''} onChange={(event) => onChange({ ...value, legalName: event.target.value })} /></label>
    <label>Activité<input value={value.industry ?? ''} onChange={(event) => onChange({ ...value, industry: event.target.value })} /></label>
    {includeCoordinates && <><label>Email<input inputMode="email" value={value.email ?? ''} onChange={(event) => onChange({ ...value, email: event.target.value })} /></label>
    <label>Téléphone<input inputMode="tel" value={value.phone ?? ''} onChange={(event) => onChange({ ...value, phone: event.target.value })} /></label></>}
    <label className="wide">Site web<input value={value.website ?? ''} onChange={(event) => onChange({ ...value, website: event.target.value })} placeholder="exemple.fr" /></label>
    <label>SIRET<input value={value.siret ?? ''} onChange={(event) => onChange({ ...value, siret: event.target.value })} /></label>
    <label>Ville<input value={value.city ?? ''} onChange={(event) => onChange({ ...value, city: event.target.value })} /></label>
    <label>Code postal<input value={value.postalCode ?? ''} onChange={(event) => onChange({ ...value, postalCode: event.target.value })} /></label>
    <label>Pays<input value={value.country ?? ''} onChange={(event) => onChange({ ...value, country: event.target.value })} /></label>
    <label className="wide">Adresse<input value={value.addressLine1 ?? ''} onChange={(event) => onChange({ ...value, addressLine1: event.target.value })} /></label>
    <label className="wide">Complément d’adresse<input value={value.addressLine2 ?? ''} onChange={(event) => onChange({ ...value, addressLine2: event.target.value })} /></label>
    <label className="wide">Notes<textarea value={value.notes ?? ''} onChange={(event) => onChange({ ...value, notes: event.target.value })} /></label>
    <div className="wide directory-editor-footer"><span /><button className="primary-button" type="button" disabled={busy || !value.name.trim()} onClick={onSave}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button></div>
  </fieldset>;
}

function ContactEditor({ value, organizations, onChange, onSave, busy, includeCoordinates = false }: { value: ContactInput; organizations: DirectoryOrganization[]; onChange: (value: ContactInput) => void; onSave: () => void; busy: boolean; includeCoordinates?: boolean }) {
  return <fieldset disabled={busy} className="directory-editor">
    <label>Prénom<input value={value.firstName} onChange={(event) => onChange({ ...value, firstName: event.target.value })} /></label>
    <label>Nom<input value={value.lastName} onChange={(event) => onChange({ ...value, lastName: event.target.value })} /></label>
    {includeCoordinates&&<><label className="wide">Entreprise<select value={value.organizationId ?? ''} onChange={(event) => onChange({ ...value, organizationId: event.target.value || null })}><option value="">Sans entreprise</option>{organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}</select></label>
    <label>Fonction dans cette entreprise<input disabled={!value.organizationId} value={value.jobTitle ?? ''} onChange={(event) => onChange({ ...value, jobTitle: event.target.value })} /></label></>}
    <label>Canal préféré<select value={value.preferredChannel ?? ''} onChange={(event) => onChange({ ...value, preferredChannel: event.target.value || null })}><option value="">Non renseigné</option><option value="email">Email</option><option value="phone">Téléphone</option></select></label>
    {includeCoordinates && <><label>Email<input inputMode="email" value={value.email ?? ''} onChange={(event) => onChange({ ...value, email: event.target.value })} /></label>
    <label>Téléphone<input inputMode="tel" value={value.phone ?? ''} onChange={(event) => onChange({ ...value, phone: event.target.value })} /></label></>}
    <label className="wide">Notes<textarea value={value.notes ?? ''} onChange={(event) => onChange({ ...value, notes: event.target.value })} /></label>
    <div className="wide directory-editor-footer"><span /><button className="primary-button" type="button" disabled={busy || !value.firstName.trim() || !value.lastName.trim()} onClick={onSave}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button></div>
  </fieldset>;
}
