import { useEffect, useMemo, useState } from 'react';
import type {
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
    country: item?.country ?? 'France',
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

export function DirectoryPage({ onMessage, initialTarget }: { onMessage: (message: string) => void; initialTarget?: DirectorySearchTarget | null }) {
  const [organizations, setOrganizations] = useState<DirectoryOrganization[]>([]);
  const [contacts, setContacts] = useState<DirectoryContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<DirectoryView>(initialTarget?.entityType === 'contact' ? 'contacts' : 'organizations');
  const [selectedType, setSelectedType] = useState<'organization' | 'contact' | null>(initialTarget?.entityType ?? null);
  const [selectedId, setSelectedId] = useState(initialTarget?.entityId ?? '');
  const [createMode, setCreateMode] = useState<CreateMode>(null);
  const [expanded, setExpanded] = useState(false);
  const [splitPercent, setSplitPercent] = useState(38);
  const [query, setQuery] = useState('');
  const [relationFilter, setRelationFilter] = useState<'all' | DirectoryRelation>('all');
  const [secondaryFilter, setSecondaryFilter] = useState('all');
  const [editing, setEditing] = useState(false);
  const [organizationDraft, setOrganizationDraft] = useState<OrganizationInput>(() => organizationForm());
  const [contactDraft, setContactDraft] = useState<ContactInput>(() => contactForm());
  const [busy, setBusy] = useState(false);

  async function refresh(preferred?: DirectorySearchTarget | null): Promise<void> {
    setLoading(true);
    try {
      const [nextOrganizations, nextContacts] = await Promise.all([
        window.atoumweb.crm.organizations.list(false),
        window.atoumweb.crm.contacts.list(false),
      ]);
      setOrganizations(nextOrganizations);
      setContacts(nextContacts);
      const target = preferred ?? (selectedType && selectedId ? { entityType: selectedType, entityId: selectedId } : null);
      if (target?.entityType === 'organization' && nextOrganizations.some((item) => item.id === target.entityId)) {
        setView('organizations');
        setSelectedType('organization');
        setSelectedId(target.entityId);
      } else if (target?.entityType === 'contact' && nextContacts.some((item) => item.id === target.entityId)) {
        setView('contacts');
        setSelectedType('contact');
        setSelectedId(target.entityId);
      } else if (target) {
        setSelectedType(null);
        setSelectedId('');
      }
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de charger l’annuaire.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(initialTarget ?? null); }, [initialTarget?.entityType, initialTarget?.entityId]);

  useEffect(() => {
    const reload = () => void refresh();
    window.addEventListener('atoumweb:changed', reload);
    return () => window.removeEventListener('atoumweb:changed', reload);
  }, [selectedType, selectedId]);

  const selectedOrganization = selectedType === 'organization' ? organizations.find((item) => item.id === selectedId) ?? null : null;
  const selectedContact = selectedType === 'contact' ? contacts.find((item) => item.id === selectedId) ?? null : null;

  useEffect(() => {
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
      if (secondaryFilter !== 'all' && (item.organizationId ?? '') !== secondaryFilter) return false;
      if (!needle) return true;
      return [
        item.firstName, item.lastName, item.organizationName ?? '', item.jobTitle ?? '', item.email ?? '', item.phone ?? '', item.notes ?? '',
      ].some((value) => value.toLocaleLowerCase('fr-FR').includes(needle));
    });
  }, [contacts, query, relationFilter, secondaryFilter]);

  const activeClients = organizations.filter((item) => item.activeClientCount > 0).length;
  const activeProspects = organizations.filter((item) => item.activeProspectCount > 0).length;
  const selectedOrganizationContacts = selectedOrganization ? contacts.filter((item) => item.organizationId === selectedOrganization.id) : [];
  const showDetail = Boolean(selectedOrganization || selectedContact || createMode);

  function chooseView(next: DirectoryView): void {
    setView(next);
    setSelectedType(null);
    setSelectedId('');
    setCreateMode(null);
    setExpanded(false);
    setEditing(false);
    setSecondaryFilter('all');
  }

  function selectOrganization(id: string): void {
    setCreateMode(null);
    setSelectedType('organization');
    setSelectedId(id);
    setExpanded(false);
  }

  function selectContact(id: string): void {
    setCreateMode(null);
    setSelectedType('contact');
    setSelectedId(id);
    setExpanded(false);
  }

  function beginResize(): void {
    const workspace = document.querySelector<HTMLElement>('.directory-workspace.with-detail');
    if (!workspace) return;
    document.body.classList.add('directory-resizing');
    const onMove = (event: PointerEvent) => {
      const rect = workspace.getBoundingClientRect();
      if (!rect.width) return;
      const ratio = ((event.clientX - rect.left) / rect.width) * 100;
      setSplitPercent(Math.max(20, Math.min(58, ratio)));
    };
    const onUp = () => {
      document.body.classList.remove('directory-resizing');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
  }

  function openCreate(mode: Exclude<CreateMode, null>): void {
    setCreateMode(mode);
    setSelectedType(null);
    setSelectedId('');
    setExpanded(false);
    setEditing(false);
    if (mode === 'organization') setOrganizationDraft(organizationForm());
    else setContactDraft(contactForm());
  }

  async function saveOrganization(create = false): Promise<void> {
    if (!organizationDraft.name.trim()) {
      onMessage('Le nom de l’organisation est requis.');
      return;
    }
    setBusy(true);
    try {
      if (create) {
        const created = await window.atoumweb.crm.organizations.create(organizationDraft);
        setCreateMode(null);
        await refresh({ entityType: 'organization', entityId: created.id });
        onMessage('Organisation ajoutée à l’annuaire.');
      } else if (selectedOrganization) {
        await window.atoumweb.crm.organizations.update(selectedOrganization.id, organizationDraft);
        await refresh({ entityType: 'organization', entityId: selectedOrganization.id });
        setEditing(false);
        onMessage('Organisation mise à jour.');
      }
      window.dispatchEvent(new Event('atoumweb:changed'));
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible d’enregistrer l’organisation.');
    } finally {
      setBusy(false);
    }
  }

  async function saveContact(create = false): Promise<void> {
    if (!contactDraft.firstName.trim() || !contactDraft.lastName.trim()) {
      onMessage('Le prénom et le nom sont requis.');
      return;
    }
    setBusy(true);
    try {
      const input = { ...contactDraft, organizationId: contactDraft.organizationId || null };
      if (create) {
        const created = await window.atoumweb.crm.contacts.create(input);
        setCreateMode(null);
        await refresh({ entityType: 'contact', entityId: created.id });
        onMessage('Contact ajouté à l’annuaire.');
      } else if (selectedContact) {
        await window.atoumweb.crm.contacts.update(selectedContact.id, input);
        await refresh({ entityType: 'contact', entityId: selectedContact.id });
        setEditing(false);
        onMessage('Contact mis à jour.');
      }
      window.dispatchEvent(new Event('atoumweb:changed'));
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible d’enregistrer le contact.');
    } finally {
      setBusy(false);
    }
  }

  function navigateRelation(clientId?: string | null, prospectId?: string | null): void {
    if (clientId) {
      openEntity({ entityType: 'client', entityId: clientId, title: 'Client' });
      return;
    }
    if (prospectId) openEntity({ entityType: 'prospect', entityId: prospectId, title: 'Prospect' });
  }

  return <div className="directory-page-stack">
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
        <input className="inline-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={view === 'organizations' ? 'Rechercher entreprise, ville, activité…' : 'Rechercher contact, entreprise, fonction…'} />
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
        {loading ? <p className="muted directory-empty">Chargement de l’annuaire…</p> : showDetail ? <div className="directory-compact-list">
          {view === 'organizations' ? filteredOrganizations.map((item) => <button key={item.id} type="button" className={`directory-compact-item ${selectedType === 'organization' && selectedId === item.id ? 'selected' : ''}`} onClick={() => selectOrganization(item.id)}>
            <CrmIdentityAvatar organizationId={item.id} name={item.name} />
            <span className="directory-compact-copy"><strong>{item.name}</strong><span>{[item.industry, item.city].filter(Boolean).join(' · ') || 'Organisation'}</span><small>{item.contactCount} contact{item.contactCount > 1 ? 's' : ''}</small></span>
            <span className={`directory-relation-pill ${relationClass(item.relation)}`}>{RELATION_LABELS[item.relation]}</span>
          </button>) : filteredContacts.map((item) => <button key={item.id} type="button" className={`directory-compact-item ${selectedType === 'contact' && selectedId === item.id ? 'selected' : ''}`} onClick={() => selectContact(item.id)}>
            <CrmIdentityAvatar organizationId={item.organizationId} contactId={item.id} name={`${item.firstName} ${item.lastName}`} />
            <span className="directory-compact-copy"><strong>{item.firstName} {item.lastName}</strong><span>{item.organizationName || 'Sans entreprise'}</span><small>{item.jobTitle || 'Fonction non renseignée'}</small></span>
            <span className={`directory-relation-pill ${relationClass(item.relation)}`}>{RELATION_LABELS[item.relation]}</span>
          </button>)}
          {((view === 'organizations' && !filteredOrganizations.length) || (view === 'contacts' && !filteredContacts.length)) && <p className="muted directory-empty">Aucun résultat dans cette vue.</p>}
        </div> : view === 'organizations' ? <div className="directory-table-wrap">
          <table className="directory-table">
            <thead><tr><th>Organisation</th><th>Activité</th><th>Ville</th><th>Coordonnées</th><th>Contacts</th><th>Relation</th></tr></thead>
            <tbody>{filteredOrganizations.map((item) => <tr key={item.id} onClick={() => selectOrganization(item.id)}>
              <td><div className="directory-name-cell"><CrmIdentityAvatar organizationId={item.id} name={item.name} /><div><strong>{item.name}</strong><small>{item.legalName || item.website || 'Organisation professionnelle'}</small></div></div></td>
              <td>{item.industry || '—'}</td>
              <td>{item.city || '—'}</td>
              <td><span>{item.email || '—'}</span><small>{formatPhone(item.phone)}</small></td>
              <td>{item.contactCount}</td>
              <td><span className={`directory-relation-pill ${relationClass(item.relation)}`}>{RELATION_LABELS[item.relation]}</span></td>
            </tr>)}</tbody>
          </table>
          {!filteredOrganizations.length && <p className="muted directory-empty">Aucune organisation dans cette vue.</p>}
        </div> : <div className="directory-table-wrap">
          <table className="directory-table">
            <thead><tr><th>Contact</th><th>Entreprise</th><th>Fonction</th><th>Coordonnées</th><th>Relation</th></tr></thead>
            <tbody>{filteredContacts.map((item) => <tr key={item.id} onClick={() => selectContact(item.id)}>
              <td><div className="directory-name-cell"><CrmIdentityAvatar organizationId={item.organizationId} contactId={item.id} name={`${item.firstName} ${item.lastName}`} /><div><strong>{item.firstName} {item.lastName}</strong><small>{item.preferredChannel || 'Contact professionnel'}</small></div></div></td>
              <td>{item.organizationName || '—'}</td>
              <td>{item.jobTitle || '—'}</td>
              <td><span>{item.email || '—'}</span><small>{formatPhone(item.phone)}</small></td>
              <td><span className={`directory-relation-pill ${relationClass(item.relation)}`}>{RELATION_LABELS[item.relation]}</span></td>
            </tr>)}</tbody>
          </table>
          {!filteredContacts.length && <p className="muted directory-empty">Aucun contact dans cette vue.</p>}
        </div>}
      </article>}

      {showDetail && !expanded && <div className="directory-splitter" role="separator" aria-orientation="vertical" aria-label="Redimensionner la liste et la fiche annuaire" tabIndex={0} onPointerDown={beginResize} onDoubleClick={() => setSplitPercent(38)} onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') setSplitPercent((value) => Math.max(20, value - 3));
        if (event.key === 'ArrowRight') setSplitPercent((value) => Math.min(58, value + 3));
      }}><span /></div>}

      {createMode && <article className={`panel directory-detail-panel ${expanded ? 'expanded' : ''}`}>
        <DirectoryDetailActions expanded={expanded} onExpand={() => setExpanded((value) => !value)} onClose={() => { setCreateMode(null); setExpanded(false); }} />
        <div className="directory-detail-heading"><span className="eyebrow">Nouvelle entrée</span><h2>{createMode === 'organization' ? 'Ajouter une organisation' : 'Ajouter un contact'}</h2><p>Une seule identité, réutilisable ensuite dans le CRM.</p></div>
        {createMode === 'organization'
          ? <OrganizationEditor value={organizationDraft} onChange={setOrganizationDraft} onSave={() => void saveOrganization(true)} busy={busy} />
          : <ContactEditor value={contactDraft} organizations={organizations} onChange={setContactDraft} onSave={() => void saveContact(true)} busy={busy} />}
      </article>}

      {selectedOrganization && !createMode && <article className={`panel directory-detail-panel ${expanded ? 'expanded' : ''}`}>
        <DirectoryDetailActions expanded={expanded} onExpand={() => setExpanded((value) => !value)} onClose={() => { setSelectedType(null); setSelectedId(''); setExpanded(false); setEditing(false); }} />
        <div className="directory-identity-heading">
          <CrmIdentityAvatar organizationId={selectedOrganization.id} name={selectedOrganization.name} size="large" />
          <div><span className="eyebrow">Organisation</span><h2>{selectedOrganization.name}</h2><p>{[selectedOrganization.industry, selectedOrganization.city].filter(Boolean).join(' · ') || 'Organisation professionnelle'}</p></div>
        </div>
        <div className="directory-status-row">
          <span className={`directory-relation-pill ${relationClass(selectedOrganization.relation)}`}>{RELATION_LABELS[selectedOrganization.relation]}</span>
          {selectedOrganization.clientId && <button className="secondary-button" type="button" onClick={() => navigateRelation(selectedOrganization.clientId, null)}>Ouvrir le client</button>}
          {selectedOrganization.prospectId && <button className="secondary-button" type="button" onClick={() => navigateRelation(null, selectedOrganization.prospectId)}>Ouvrir le prospect</button>}
          <button className="secondary-button" type="button" onClick={() => setEditing((value) => !value)}>{editing ? 'Annuler' : 'Modifier'}</button>
        </div>

        {editing ? <OrganizationEditor value={organizationDraft} onChange={setOrganizationDraft} onSave={() => void saveOrganization(false)} busy={busy} /> : <>
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
          <details className="directory-identity-details"><summary>Logo et identité visuelle</summary><CrmIdentityAssetEditor organizationId={selectedOrganization.id} onMessage={onMessage} /></details>
        </>}
      </article>}

      {selectedContact && !createMode && <article className={`panel directory-detail-panel ${expanded ? 'expanded' : ''}`}>
        <DirectoryDetailActions expanded={expanded} onExpand={() => setExpanded((value) => !value)} onClose={() => { setSelectedType(null); setSelectedId(''); setExpanded(false); setEditing(false); }} />
        <div className="directory-identity-heading">
          <CrmIdentityAvatar organizationId={selectedContact.organizationId} contactId={selectedContact.id} name={`${selectedContact.firstName} ${selectedContact.lastName}`} size="large" />
          <div><span className="eyebrow">Contact</span><h2>{selectedContact.firstName} {selectedContact.lastName}</h2><p>{[selectedContact.jobTitle, selectedContact.organizationName].filter(Boolean).join(' · ') || 'Contact professionnel'}</p></div>
        </div>
        <div className="directory-status-row">
          <span className={`directory-relation-pill ${relationClass(selectedContact.relation)}`}>{RELATION_LABELS[selectedContact.relation]}</span>
          {selectedContact.clientId && <button className="secondary-button" type="button" onClick={() => navigateRelation(selectedContact.clientId, null)}>Ouvrir le client</button>}
          {selectedContact.prospectId && <button className="secondary-button" type="button" onClick={() => navigateRelation(null, selectedContact.prospectId)}>Ouvrir le prospect</button>}
          <button className="secondary-button" type="button" onClick={() => setEditing((value) => !value)}>{editing ? 'Annuler' : 'Modifier'}</button>
        </div>

        {editing ? <ContactEditor value={contactDraft} organizations={organizations} onChange={setContactDraft} onSave={() => void saveContact(false)} busy={busy} /> : <>
          <div className="directory-meta-grid">
            <div><span>Entreprise</span><strong>{selectedContact.organizationName || 'Aucune'}</strong></div>
            <div><span>Fonction</span><strong>{selectedContact.jobTitle || 'Non renseignée'}</strong></div>
            <div><span>Canal préféré</span><strong>{selectedContact.preferredChannel || 'Non renseigné'}</strong></div>
            <div><span>Mis à jour</span><strong>{dateLabel(selectedContact.updatedAt)}</strong></div>
          </div>
          <ContactMethodsPanel organizationId={selectedContact.organizationId} contactId={selectedContact.id} summaryLabel="Coordonnées du contact" />
          <section className="directory-info-block"><div><span>Notes</span><strong>{selectedContact.notes || 'Aucune note'}</strong></div></section>
          <details className="directory-identity-details"><summary>Photo / avatar</summary><CrmIdentityAssetEditor contactId={selectedContact.id} onMessage={onMessage} /></details>
        </>}
      </article>}
    </div>
  </div>;
}

function DirectoryKpi({ icon, label, value, helper }: { icon: 'folder' | 'user' | 'check-circle' | 'chart'; label: string; value: number; helper: string }) {
  return <article><span className="directory-kpi-icon"><OperationIcon name={icon} size={27} /></span><div><strong>{label}</strong><span>{value}</span><small>{helper}</small></div></article>;
}

function DirectoryDetailActions({ expanded, onExpand, onClose }: { expanded: boolean; onExpand: () => void; onClose: () => void }) {
  return <div className="directory-detail-actions"><button className="operation-detail-expand" type="button" title={expanded ? 'Réduire la fiche' : 'Agrandir la fiche'} onClick={onExpand}><OperationIcon name={expanded ? 'collapse' : 'expand'} size={18} /></button><button className="close-detail" type="button" title="Fermer" onClick={onClose}><OperationIcon name="close" size={18} /></button></div>;
}

function OrganizationEditor({ value, onChange, onSave, busy }: { value: OrganizationInput; onChange: (value: OrganizationInput) => void; onSave: () => void; busy: boolean }) {
  return <div className="directory-editor">
    <label className="wide">Nom de l’organisation<input value={value.name} onChange={(event) => onChange({ ...value, name: event.target.value })} /></label>
    <label>Raison sociale<input value={value.legalName ?? ''} onChange={(event) => onChange({ ...value, legalName: event.target.value })} /></label>
    <label>Activité<input value={value.industry ?? ''} onChange={(event) => onChange({ ...value, industry: event.target.value })} /></label>
    <label>Email<input inputMode="email" value={value.email ?? ''} onChange={(event) => onChange({ ...value, email: event.target.value })} /></label>
    <label>Téléphone<input inputMode="tel" value={value.phone ?? ''} onChange={(event) => onChange({ ...value, phone: event.target.value })} /></label>
    <label className="wide">Site web<input value={value.website ?? ''} onChange={(event) => onChange({ ...value, website: event.target.value })} placeholder="exemple.fr" /></label>
    <label>SIRET<input value={value.siret ?? ''} onChange={(event) => onChange({ ...value, siret: event.target.value })} /></label>
    <label>Ville<input value={value.city ?? ''} onChange={(event) => onChange({ ...value, city: event.target.value })} /></label>
    <label>Code postal<input value={value.postalCode ?? ''} onChange={(event) => onChange({ ...value, postalCode: event.target.value })} /></label>
    <label>Pays<input value={value.country ?? ''} onChange={(event) => onChange({ ...value, country: event.target.value })} /></label>
    <label className="wide">Adresse<input value={value.addressLine1 ?? ''} onChange={(event) => onChange({ ...value, addressLine1: event.target.value })} /></label>
    <label className="wide">Complément d’adresse<input value={value.addressLine2 ?? ''} onChange={(event) => onChange({ ...value, addressLine2: event.target.value })} /></label>
    <label className="wide">Notes<textarea value={value.notes ?? ''} onChange={(event) => onChange({ ...value, notes: event.target.value })} /></label>
    <div className="wide directory-editor-footer"><span /><button className="primary-button" type="button" disabled={busy || !value.name.trim()} onClick={onSave}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button></div>
  </div>;
}

function ContactEditor({ value, organizations, onChange, onSave, busy }: { value: ContactInput; organizations: DirectoryOrganization[]; onChange: (value: ContactInput) => void; onSave: () => void; busy: boolean }) {
  return <div className="directory-editor">
    <label>Prénom<input value={value.firstName} onChange={(event) => onChange({ ...value, firstName: event.target.value })} /></label>
    <label>Nom<input value={value.lastName} onChange={(event) => onChange({ ...value, lastName: event.target.value })} /></label>
    <label className="wide">Entreprise<select value={value.organizationId ?? ''} onChange={(event) => onChange({ ...value, organizationId: event.target.value || null })}><option value="">Sans entreprise</option>{organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}</select></label>
    <label>Fonction<input value={value.jobTitle ?? ''} onChange={(event) => onChange({ ...value, jobTitle: event.target.value })} /></label>
    <label>Canal préféré<select value={value.preferredChannel ?? ''} onChange={(event) => onChange({ ...value, preferredChannel: event.target.value || null })}><option value="">Non renseigné</option><option value="email">Email</option><option value="phone">Téléphone</option></select></label>
    <label>Email<input inputMode="email" value={value.email ?? ''} onChange={(event) => onChange({ ...value, email: event.target.value })} /></label>
    <label>Téléphone<input inputMode="tel" value={value.phone ?? ''} onChange={(event) => onChange({ ...value, phone: event.target.value })} /></label>
    <label className="wide">Notes<textarea value={value.notes ?? ''} onChange={(event) => onChange({ ...value, notes: event.target.value })} /></label>
    <div className="wide directory-editor-footer"><span /><button className="primary-button" type="button" disabled={busy || !value.firstName.trim() || !value.lastName.trim()} onClick={onSave}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button></div>
  </div>;
}
