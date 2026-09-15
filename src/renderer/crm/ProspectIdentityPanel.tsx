import { useEffect, useState } from 'react';
import type { Contact, Organization, ProspectSummary } from '../../shared/crm';
import { ContactMethodsPanel } from './ContactMethodsPanel';
import { FieldHelp } from './ProspectQualificationPanelV2';

export function ProspectIdentityPanel({ prospect, onSaved }: { prospect: ProspectSummary; onSaved: () => void }) {
  const [identity, setIdentity] = useState<{ organization: Organization | null; contact: Contact | null } | null>(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try { setIdentity(await window.atoumweb.workflow.identity('prospect', prospect.id)); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }
  useEffect(() => { setEditing(false); void load(); }, [prospect.id]);

  async function save() {
    if (!identity) return;
    setBusy(true); setError('');
    try {
      if (identity.organization) await window.atoumweb.crm.organizations.update(identity.organization.id, identity.organization);
      if (identity.contact) await window.atoumweb.crm.contacts.update(identity.contact.id, identity.contact);
      setEditing(false); await load(); onSaved();
      window.dispatchEvent(new Event('atoumweb:changed'));
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  if (!identity) return <section className="prospect-work-section"><p className="muted">Chargement des informations…</p></section>;
  const address = identity.organization ? [identity.organization.addressLine1, identity.organization.postalCode, identity.organization.city].filter(Boolean).join(' · ') : '';
  return <section className="prospect-work-section identity-panel-v2">
    <div className="work-section-heading"><div><span className="eyebrow">Entreprise & interlocuteur</span><strong>{identity.organization?.industry || identity.contact?.jobTitle || 'Informations principales'}</strong></div><button className="secondary-button compact-button" type="button" onClick={() => setEditing((value) => !value)}>{editing ? 'Fermer' : 'Modifier'}</button></div>
    {!editing && <div className="identity-summary-grid">
      {identity.organization && <><div><span>Société</span><strong>{identity.organization.name}</strong></div><div><span>Activité</span><strong>{identity.organization.industry || 'À préciser'}</strong></div>{identity.organization.website && <div><span>Site web</span><strong>{identity.organization.website}</strong></div>}{address && <div className="identity-wide"><span>Adresse</span><strong>{address}</strong></div>}{identity.organization.notes && <div className="identity-wide"><span>Description</span><strong>{identity.organization.notes}</strong></div>}</>}
      {identity.contact && <><div><span>Interlocuteur</span><strong>{identity.contact.firstName} {identity.contact.lastName}</strong></div><div><span>Fonction</span><strong>{identity.contact.jobTitle || 'À préciser'}</strong></div></>}
    </div>}
    {editing && <div className="workflow-fields identity-editor-v2">
      {identity.organization && <>
        <label>Société <FieldHelp text="Nom usuel de la société ou de la structure commerciale." /><input value={identity.organization.name} onChange={(e) => setIdentity({ ...identity, organization: { ...identity.organization!, name: e.target.value } })} /></label>
        <label>Activité / type de structure <FieldHelp text="Permet d’identifier rapidement le métier : artisan, restaurant, commerçant, association, profession libérale…" /><input value={identity.organization.industry ?? ''} onChange={(e) => setIdentity({ ...identity, organization: { ...identity.organization!, industry: e.target.value } })} placeholder="Ex. artisan cirier, restaurant, commerce…" /></label>
        <label className="form-span-2">Description de l’activité <FieldHelp text="Quelques mots sur l’activité, le positionnement et ce que fait l’entreprise. Utile pour préparer la prospection et le devis." /><textarea value={identity.organization.notes ?? ''} onChange={(e) => setIdentity({ ...identity, organization: { ...identity.organization!, notes: e.target.value } })} /></label>
        <label>Site web<input type="url" value={identity.organization.website ?? ''} onChange={(e) => setIdentity({ ...identity, organization: { ...identity.organization!, website: e.target.value } })} placeholder="https://…" /></label>
        <label>Adresse<input value={identity.organization.addressLine1 ?? ''} onChange={(e) => setIdentity({ ...identity, organization: { ...identity.organization!, addressLine1: e.target.value } })} /></label>
        <label>Complément d’adresse<input value={identity.organization.addressLine2 ?? ''} onChange={(e) => setIdentity({ ...identity, organization: { ...identity.organization!, addressLine2: e.target.value } })} /></label>
        <label>Code postal<input value={identity.organization.postalCode ?? ''} onChange={(e) => setIdentity({ ...identity, organization: { ...identity.organization!, postalCode: e.target.value } })} /></label>
        <label>Ville<input value={identity.organization.city ?? ''} onChange={(e) => setIdentity({ ...identity, organization: { ...identity.organization!, city: e.target.value } })} /></label>
        <label>Pays<input value={identity.organization.country ?? ''} onChange={(e) => setIdentity({ ...identity, organization: { ...identity.organization!, country: e.target.value } })} /></label>
      </>}
      {identity.contact && <>
        <label>Prénom<input value={identity.contact.firstName} onChange={(e) => setIdentity({ ...identity, contact: { ...identity.contact!, firstName: e.target.value } })} /></label>
        <label>Nom<input value={identity.contact.lastName} onChange={(e) => setIdentity({ ...identity, contact: { ...identity.contact!, lastName: e.target.value } })} /></label>
        <label>Fonction / rôle <FieldHelp text="Ex. gérant, responsable communication, secrétaire, interlocuteur technique…" /><input value={identity.contact.jobTitle ?? ''} onChange={(e) => setIdentity({ ...identity, contact: { ...identity.contact!, jobTitle: e.target.value } })} /></label>
      </>}
      {error && <p className="form-error">{error}</p>}
      <button className="primary-button" type="button" disabled={busy} onClick={() => void save()}>{busy ? 'Enregistrement…' : 'Enregistrer les informations'}</button>
    </div>}
    <ContactMethodsPanel organizationId={identity.organization?.id} contactId={identity.contact?.id} />
  </section>;
}
