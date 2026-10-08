import { useEffect, useState } from 'react';
import type { QuoteSummary } from '../../shared/commercial';
import type { Contact, Organization, ProspectSummary, SearchResult } from '../../shared/crm';
import type { ProjectSummary } from '../../shared/projects';
import type { Need, NeedInput } from '../../shared/workflow';
import { ContactMethodsPanel } from '../crm/ContactMethodsPanel';
import { NeedDraftSelector } from '../crm/ProspectNeedsPanel';

export const openEntity = (target: SearchResult) => window.dispatchEvent(new CustomEvent('atoumweb:navigate', { detail: target }));
export const changed = () => window.dispatchEvent(new Event('atoumweb:changed'));

/* Compatibilité des écrans existants : le sélecteur historique utilise maintenant le choix Catégorie → Prestation. */
export function NeedChoices({ value, onChange }: { value: NeedInput[]; onChange: (value: NeedInput[]) => void }) {
  return <NeedDraftSelector value={value} onChange={onChange} />;
}

export function DossierPanel({ owner, id, onSaved }: { owner: 'prospect' | 'client'; id: string; onSaved?: () => void }) {
  const [needs, setNeeds] = useState<Need[]>([]), [draft, setDraft] = useState<NeedInput[]>([]), [editing, setEditing] = useState<string>();
  const [quotes, setQuotes] = useState<QuoteSummary[]>([]), [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [identity, setIdentity] = useState<{ organization: Organization | null; contact: Contact | null } | null>(null);
  const [prospect, setProspect] = useState<ProspectSummary | null>(null);
  const [edit, setEdit] = useState(false), [error, setError] = useState(''), [busy, setBusy] = useState(false);

  async function load() {
    try {
      const [n, q, i] = await Promise.all([window.atoumweb.workflow.needs(owner, id), window.atoumweb.quotes.list(owner === 'client' ? { clientAccountId: id } : { prospectId: id }), window.atoumweb.workflow.identity(owner, id)]);
      setNeeds(n); setQuotes(q); setIdentity(i);
      const p = owner === 'prospect' ? (await window.atoumweb.crm.prospects.list({ includeArchived: true })).find((item) => item.id === id) ?? null : null;
      setProspect(p);
      const client = owner === 'client' ? id : p?.clientAccountId;
      setProjects(client ? await window.atoumweb.projects.projects.list({ clientAccountId: client }) : []);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }
  useEffect(() => { setEdit(false); setDraft([]); setEditing(undefined); void load(); const refresh = () => void load(); window.addEventListener('atoumweb:changed', refresh); return () => window.removeEventListener('atoumweb:changed', refresh); }, [owner, id]);
  async function run(action: () => Promise<unknown>) { setBusy(true); setError(''); try { await action(); await load(); onSaved?.(); changed(); } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); } }

  return <section className="workflow-dossier legacy-dossier-panel">{error && <p className="form-error" role="alert">{error}</p>}
    <button type="button" className="secondary-button" onClick={() => setEdit(!edit)}>Modifier les informations</button>
    {edit && identity && <form className="workflow-fields" onSubmit={(e) => { e.preventDefault(); void run(async () => { if (identity.organization) await window.atoumweb.crm.organizations.update(identity.organization.id, identity.organization); if (identity.contact) await window.atoumweb.crm.contacts.update(identity.contact.id, identity.contact); if (prospect) await window.atoumweb.crm.prospects.update(prospect.id, prospect); setEdit(false); }); }}>
      {identity.organization && <label>Société<input required value={identity.organization.name} onChange={(e) => setIdentity({ ...identity, organization: { ...identity.organization!, name: e.target.value } })} /></label>}
      {identity.contact && <><label>Prénom<input required value={identity.contact.firstName} onChange={(e) => setIdentity({ ...identity, contact: { ...identity.contact!, firstName: e.target.value } })} /></label><label>Nom<input required value={identity.contact.lastName} onChange={(e) => setIdentity({ ...identity, contact: { ...identity.contact!, lastName: e.target.value } })} /></label></>}
      {prospect && <><label>Notes<textarea value={prospect.notes ?? ''} onChange={(e) => setProspect({ ...prospect, notes: e.target.value })} /></label><label>Budget minimum (€)<input type="number" min="0" value={prospect.budgetMinCents == null ? '' : prospect.budgetMinCents / 100} onChange={(e) => setProspect({ ...prospect, budgetMinCents: e.target.value ? Math.round(Number(e.target.value) * 100) : null })} /></label><label>Date cible<input type="date" value={prospect.targetDate?.slice(0, 10) ?? ''} onChange={(e) => setProspect({ ...prospect, targetDate: e.target.value || null })} /></label></>}
      <button className="primary-button" disabled={busy}>Enregistrer</button>
    </form>}
    {identity && <ContactMethodsPanel organizationId={identity.organization?.id} contactId={identity.contact?.id} />}
    {owner === 'prospect' && <button className="secondary-button" type="button" disabled={busy} onClick={() => void run(() => window.atoumweb.workflow.archiveProspect(id, !prospect?.archivedAt))}>{prospect?.archivedAt ? 'Réactiver le prospect' : 'Archiver le prospect'}</button>}
    <h4>Besoins / Offres / Services</h4>{needs.map((need) => <div key={need.id} className="workflow-row"><span>{need.type === 'offer' ? 'Offre' : need.type === 'service' ? 'Service' : 'Autre'} · {need.label}</span><button type="button" className="secondary-button" onClick={() => { setEditing(need.id); setDraft([{ catalogItemId: need.catalogItemId, otherText: need.otherText }]); }}>Modifier</button><button type="button" className="secondary-button" disabled={busy} onClick={() => void run(() => window.atoumweb.workflow.removeNeed(owner, id, need.id))}>Retirer</button></div>)}
    <NeedChoices value={draft} onChange={setDraft} />{draft.length > 0 && <button type="button" className="primary-button" disabled={busy} onClick={() => void run(async () => { const valid = draft.filter((need) => Boolean(need.catalogItemId?.trim() || need.otherText?.trim())); for (let i = 0; i < valid.length; i++) await window.atoumweb.workflow.saveNeed(owner, id, valid[i], i === 0 ? editing : undefined); setDraft([]); setEditing(undefined); })}>Enregistrer les besoins</button>}
    <h4>Devis liés</h4>{quotes.length === 0 && <p className="muted">Aucun devis lié.</p>}{quotes.map((quote) => <button className="workflow-link" type="button" key={quote.id} onClick={() => openEntity({ entityType: 'quote', entityId: quote.id, title: quote.subject })}>{quote.number} · {quote.subject} · {quote.status}</button>)}
    <h4>Projets liés</h4>{projects.length === 0 && <p className="muted">Aucun projet lié.</p>}{projects.map((project) => <button className="workflow-link" type="button" key={project.id} onClick={() => openEntity({ entityType: 'project', entityId: project.id, title: project.name })}>{project.name} · {project.status}</button>)}
  </section>;
}
