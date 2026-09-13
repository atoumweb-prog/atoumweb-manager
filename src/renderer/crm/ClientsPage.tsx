import { useEffect, useMemo, useState } from 'react';
import type { ActivityEvent, ClientStatus, ClientSummary } from '../../shared/crm';

const STATUS_LABELS: Record<ClientStatus, string> = {
  active: 'Actif',
  inactive: 'Inactif',
  archived: 'Archivé',
};

type ClientTab = 'summary' | 'contacts' | 'commercial' | 'history';

interface ClientDraft {
  company: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes: string;
}

const EMPTY_DRAFT: ClientDraft = {
  company: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  notes: '',
};

export function ClientsPage({ onMessage }: { onMessage: (message: string) => void }) {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | ClientStatus>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ClientTab>('summary');
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<ClientDraft>(EMPTY_DRAFT);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function refresh(): Promise<void> {
    setLoading(true);
    try {
      setClients(await window.atoumweb.crm.clients.list({ includeArchived: true }));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setActivity([]);
      return;
    }
    void window.atoumweb.crm.activity.list('client', selectedId).then(setActivity);
  }, [selectedId, clients]);

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

  async function submitClient(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setFormError(null);
    if (!draft.company.trim() && (!draft.firstName.trim() || !draft.lastName.trim())) {
      setFormError('Renseigne une société ou le prénom et le nom du contact.');
      return;
    }

    setSaving(true);
    try {
      let organizationId: string | null = null;
      let contactId: string | null = null;

      if (draft.company.trim()) {
        const organization = await window.atoumweb.crm.organizations.create({
          name: draft.company.trim(),
          email: !draft.firstName.trim() ? draft.email.trim() || null : null,
          phone: !draft.firstName.trim() ? draft.phone.trim() || null : null,
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

      setDraft(EMPTY_DRAFT);
      setShowForm(false);
      await refresh();
      openClient(client.id);
      onMessage('Client créé.');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Impossible de créer le client.');
    } finally {
      setSaving(false);
    }
  }

  function openClient(id: string): void {
    setSelectedId(id);
    setActiveTab('summary');
  }

  async function archive(client: ClientSummary): Promise<void> {
    if (!window.confirm(`Archiver ${client.displayName} ?`)) return;
    await window.atoumweb.crm.clients.archive(client.id);
    await refresh();
    onMessage('Client archivé.');
  }

  async function reactivate(client: ClientSummary): Promise<void> {
    await window.atoumweb.crm.clients.reactivate(client.id, 'active');
    await refresh();
    onMessage('Client réactivé.');
  }

  async function scheduleAction(client: ClientSummary): Promise<void> {
    const today = new Date().toISOString().slice(0, 10);
    const dateText = window.prompt('Date de la prochaine action (AAAA-MM-JJ)', today)?.trim();
    if (!dateText) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
      onMessage('Date invalide. Utilise le format AAAA-MM-JJ.');
      return;
    }
    const action = window.prompt('Action à prévoir ?', client.nextActionText || 'Recontacter le client')?.trim();
    if (!action) return;
    const date = new Date(`${dateText}T09:00:00`);
    if (Number.isNaN(date.getTime())) {
      onMessage('Date invalide.');
      return;
    }
    await window.atoumweb.crm.clients.update(client.id, {
      organizationId: client.organizationId,
      primaryContactId: client.primaryContactId,
      status: client.status,
      notes: client.notes,
      nextActionAt: date.toISOString(),
      nextActionText: action,
    });
    await refresh();
    onMessage('Prochaine action client enregistrée.');
  }

  return (
    <div className="crm-stack">
      <div className="module-toolbar client-toolbar">
        <div><strong>{filtered.length}</strong><span> client{filtered.length > 1 ? 's' : ''}</span></div>
        <div className="toolbar-controls">
          <input className="inline-search" placeholder="Rechercher un client…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | ClientStatus)}>
            <option value="all">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
            <option value="archived">Archivés</option>
          </select>
          <button className="primary-button" type="button" onClick={() => setShowForm((value) => !value)}>
            {showForm ? 'Fermer' : '+ Nouveau client'}
          </button>
        </div>
      </div>

      {showForm && (
        <form className="panel crm-form" onSubmit={(event) => void submitClient(event)}>
          <div className="panel-title">
            <div><span className="eyebrow">Client</span><h2>Ajouter un client directement</h2></div>
          </div>
          <div className="form-grid">
            <label>Société<input value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} /></label>
            <label>Prénom<input value={draft.firstName} onChange={(e) => setDraft({ ...draft, firstName: e.target.value })} /></label>
            <label>Nom<input value={draft.lastName} onChange={(e) => setDraft({ ...draft, lastName: e.target.value })} /></label>
            <label>Email<input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></label>
            <label>Téléphone<input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></label>
            <label>Notes<input value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></label>
          </div>
          {formError && <p className="form-error">{formError}</p>}
          <div className="form-actions"><button className="primary-button" disabled={saving} type="submit">{saving ? 'Création…' : 'Créer le client'}</button></div>
        </form>
      )}

      {loading ? <div className="panel"><p className="muted">Chargement des clients…</p></div> : (
        <div className="clients-layout">
          <div className="panel table-panel">
            <div className="clients-table-wrap">
              <table className="clients-table">
                <thead><tr><th>Client</th><th>Statut</th><th>Contact principal</th><th>Coordonnées</th><th>Prochaine action</th><th /></tr></thead>
                <tbody>
                  {filtered.map((client) => (
                    <tr key={client.id} className={selectedId === client.id ? 'selected-row' : ''} onClick={() => openClient(client.id)}>
                      <td><div className="client-name-cell"><span className="avatar-initials">{initials(client.displayName)}</span><div><strong>{client.displayName}</strong><small>Client depuis {new Date(client.becameClientAt).toLocaleDateString('fr-FR')}</small></div></div></td>
                      <td><span className={`client-status status-${client.status}`}>{STATUS_LABELS[client.status ?? 'active']}</span></td>
                      <td>{client.contactName || '—'}</td>
                      <td><div className="contact-stack"><span>{client.email || '—'}</span><small>{client.phone || ''}</small></div></td>
                      <td>{client.nextActionAt ? <><strong>{client.nextActionText || 'Action prévue'}</strong><small>{new Date(client.nextActionAt).toLocaleDateString('fr-FR')}</small></> : <span className="muted">Aucune</span>}</td>
                      <td onClick={(event) => event.stopPropagation()}>
                        {client.status === 'archived'
                          ? <button className="link-button" type="button" onClick={() => void reactivate(client)}>Réactiver</button>
                          : <button className="link-button danger-link" type="button" onClick={() => void archive(client)}>Archiver</button>}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && <tr><td colSpan={6}><div className="empty-table">Aucun client pour ce filtre.</div></td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {selected && (
            <aside className="panel client-summary-panel">
              <div className="detail-panel-heading">
                <div>
                  <span className="eyebrow">Fiche client</span>
                  <div className="client-summary-head"><span className="avatar-large">{initials(selected.displayName)}</span><div><h2>{selected.displayName}</h2><span className={`client-status status-${selected.status}`}>{STATUS_LABELS[selected.status ?? 'active']}</span></div></div>
                </div>
                <button className="close-detail" type="button" onClick={() => setSelectedId(null)}>×</button>
              </div>

              <div className="client-tabs-preview client-tabs-buttons">
                <button className={activeTab === 'summary' ? 'active' : ''} type="button" onClick={() => setActiveTab('summary')}>Résumé</button>
                <button className={activeTab === 'contacts' ? 'active' : ''} type="button" onClick={() => setActiveTab('contacts')}>Contacts</button>
                <button className={activeTab === 'commercial' ? 'active' : ''} type="button" onClick={() => setActiveTab('commercial')}>Commercial</button>
                <button className={activeTab === 'history' ? 'active' : ''} type="button" onClick={() => setActiveTab('history')}>Historique</button>
              </div>

              {activeTab === 'summary' && (
                <>
                  <div className="summary-list">
                    <SummaryLine label="Contact principal" value={selected.contactName || 'Non renseigné'} />
                    <SummaryLine label="Email" value={selected.email || 'Non renseigné'} />
                    <SummaryLine label="Téléphone" value={selected.phone || 'Non renseigné'} />
                    <SummaryLine label="Prochaine action" value={selected.nextActionAt ? `${selected.nextActionText || 'Action'} · ${new Date(selected.nextActionAt).toLocaleDateString('fr-FR')}` : 'Aucune'} />
                    <SummaryLine label="Depuis" value={new Date(selected.becameClientAt).toLocaleDateString('fr-FR')} />
                  </div>
                  {selected.notes && <div className="client-notes"><strong>Notes</strong><p>{selected.notes}</p></div>}
                  <div className="detail-actions"><button className="secondary-button" type="button" onClick={() => void scheduleAction(selected)}>Programmer une action</button></div>
                </>
              )}

              {activeTab === 'contacts' && (
                <div className="tab-content-stack">
                  <div className="contact-card">
                    <span className="avatar-initials">{initials(selected.contactName || selected.displayName)}</span>
                    <div><strong>{selected.contactName || 'Contact principal non renseigné'}</strong><span>Principal</span><small>{selected.email || 'Email non renseigné'}{selected.phone ? ` · ${selected.phone}` : ''}</small></div>
                  </div>
                  <p className="muted">La gestion de plusieurs contacts et rôles sera raccordée au modèle déjà prévu dans `client_contact_roles`.</p>
                </div>
              )}

              {activeTab === 'commercial' && (
                <div className="tab-content-stack">
                  <div className="commercial-kpis">
                    <MiniKpi label="Projets actifs" value="0" />
                    <MiniKpi label="Services actifs" value="0" />
                    <MiniKpi label="CA encaissé" value="0 €" />
                    <MiniKpi label="Temps cumulé" value="0 h" />
                  </div>
                  <p className="muted">Ces valeurs seront calculées depuis Projets, Facturation et Gestion des temps. Elles ne sont pas stockées en double dans la fiche Client.</p>
                </div>
              )}

              {activeTab === 'history' && (
                <ActivityList activity={activity} />
              )}
            </aside>
          )}
        </div>
      )}
    </div>
  );
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'AW';
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return <div className="summary-line"><span>{label}</span><strong>{value}</strong></div>;
}

function MiniKpi({ label, value }: { label: string; value: string }) {
  return <div className="mini-kpi"><span>{label}</span><strong>{value}</strong></div>;
}

function ActivityList({ activity }: { activity: ActivityEvent[] }) {
  return (
    <div className="activity-preview activity-full">
      <strong>Historique du client</strong>
      {activity.map((event) => (
        <div className="activity-item" key={event.id}>
          <span className="activity-dot" />
          <div><p>{event.summary}</p><small>{new Date(event.createdAt).toLocaleString('fr-FR')}</small></div>
        </div>
      ))}
      {activity.length === 0 && <p className="muted">Aucune activité enregistrée.</p>}
    </div>
  );
}
