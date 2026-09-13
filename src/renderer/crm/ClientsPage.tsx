import { useEffect, useMemo, useState } from 'react';
import type { ClientStatus, ClientSummary } from '../../shared/crm';

const STATUS_LABELS: Record<ClientStatus, string> = {
  active: 'Actif',
  inactive: 'Inactif',
  archived: 'Archivé',
};

export function ClientsPage({ onMessage }: { onMessage: (message: string) => void }) {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | ClientStatus>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
        </div>
      </div>

      {loading ? <div className="panel"><p className="muted">Chargement des clients…</p></div> : (
        <div className="clients-layout">
          <div className="panel table-panel">
            <div className="clients-table-wrap">
              <table className="clients-table">
                <thead><tr><th>Client</th><th>Statut</th><th>Contact principal</th><th>Coordonnées</th><th>Prochaine action</th><th /></tr></thead>
                <tbody>
                  {filtered.map((client) => (
                    <tr key={client.id} className={selectedId === client.id ? 'selected-row' : ''} onClick={() => setSelectedId(client.id)}>
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
              <span className="eyebrow">Fiche client</span>
              <div className="client-summary-head"><span className="avatar-large">{initials(selected.displayName)}</span><div><h2>{selected.displayName}</h2><span className={`client-status status-${selected.status}`}>{STATUS_LABELS[selected.status ?? 'active']}</span></div></div>
              <div className="summary-list">
                <SummaryLine label="Contact principal" value={selected.contactName || 'Non renseigné'} />
                <SummaryLine label="Email" value={selected.email || 'Non renseigné'} />
                <SummaryLine label="Téléphone" value={selected.phone || 'Non renseigné'} />
                <SummaryLine label="Prochaine action" value={selected.nextActionText || 'Aucune'} />
                <SummaryLine label="Depuis" value={new Date(selected.becameClientAt).toLocaleDateString('fr-FR')} />
              </div>
              {selected.notes && <div className="client-notes"><strong>Notes</strong><p>{selected.notes}</p></div>}
              <div className="client-tabs-preview"><span className="active">Résumé</span><span>Contacts</span><span>Commercial</span><span>Historique</span></div>
              <p className="muted">Les onglets détaillés seront enrichis au fil de la Phase 1.</p>
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
