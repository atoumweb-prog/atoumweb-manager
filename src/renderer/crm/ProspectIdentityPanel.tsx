import { useEffect, useState } from 'react';
import type { Contact, Organization, ProspectInput, ProspectSummary } from '../../shared/crm';
import { validateEmail, validatePhone } from '../../shared/contactValidation';
import { ContactMethodsPanel } from './ContactMethodsPanel';
import { FieldHelp } from './ProspectQualificationPanelV2';

interface IdentityState {
  organization: Organization | null;
  contact: Contact | null;
  decisionMaker: Contact | null;
}

interface DecisionDraft {
  status: ProspectInput['decisionStatus'];
  name: string;
  role: string;
  email: string;
  phone: string;
  details: string;
}

function decisionFromProspect(prospect: ProspectSummary): DecisionDraft {
  return {
    status: prospect.decisionStatus ?? null,
    name: prospect.decisionMakerName ?? '',
    role: prospect.decisionMakerRole ?? '',
    email: prospect.decisionMakerEmail ?? '',
    phone: prospect.decisionMakerPhone ?? '',
    details: prospect.decisionMakerDetails ?? '',
  };
}

function cleanError(error: unknown): string {
  if (!(error instanceof Error)) return 'Une erreur est survenue.';
  return error.message
    .replace(/^Error invoking remote method ['"][^'"]+['"]:\s*/i, '')
    .replace(/^Error:\s*/i, '')
    .trim();
}

export function ProspectIdentityPanel({ prospect, onSaved }: { prospect: ProspectSummary; onSaved: () => void }) {
  const [identity, setIdentity] = useState<IdentityState | null>(null);
  const [decision, setDecision] = useState<DecisionDraft>(() => decisionFromProspect(prospect));
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      setIdentity(await window.atoumweb.workflow.identity('prospect', prospect.id));
      setDecision(decisionFromProspect(prospect));
    } catch (e) { setError(cleanError(e)); }
  }

  useEffect(() => { setEditing(false); void load(); }, [prospect.id]);
  useEffect(() => { setDecision(decisionFromProspect(prospect)); }, [prospect.updatedAt]);

  const decisionEmail = validateEmail(decision.email);
  const decisionPhone = validatePhone(decision.phone);

  async function save() {
    if (!identity || !decisionEmail.valid || !decisionPhone.valid) return;
    setBusy(true); setError('');
    try {
      if (identity.organization) await window.atoumweb.crm.organizations.update(identity.organization.id, identity.organization);
      if (identity.contact) await window.atoumweb.crm.contacts.update(identity.contact.id, identity.contact);
      await window.atoumweb.crm.prospects.updateQualification(prospect.id, {
        decisionStatus: decision.status ?? null,
        decisionMakerName: decision.status === 'no' ? decision.name.trim() || null : null,
        decisionMakerRole: decision.status === 'no' ? decision.role.trim() || null : null,
        decisionMakerEmail: decision.status === 'no' ? decision.email.trim() || null : null,
        decisionMakerPhone: decision.status === 'no' ? decision.phone.trim() || null : null,
        decisionMakerDetails: decision.status === 'yes' ? null : decision.details.trim() || null,
      });
      setEditing(false); await load(); onSaved();
      window.dispatchEvent(new Event('atoumweb:changed'));
    } catch (e) { setError(cleanError(e)); }
    finally { setBusy(false); }
  }

  if (!identity) return <section className="prospect-work-section"><p className="muted">Chargement des informations…</p></section>;
  const address = identity.organization ? [identity.organization.addressLine1, identity.organization.postalCode, identity.organization.city].filter(Boolean).join(' · ') : '';
  const decisionLabel = decision.status === 'yes'
    ? 'Interlocuteur décisionnaire'
    : decision.status === 'no'
      ? [decision.name, decision.role].filter(Boolean).join(' · ') || 'Décisionnaire à préciser'
      : decision.status === 'unknown'
        ? 'Décisionnaire encore inconnu'
        : 'À qualifier';

  return <section className="prospect-work-section identity-panel-v2">
    <div className="work-section-heading"><div><span className="eyebrow">Entreprise & interlocuteur</span><strong>{identity.organization?.industry || identity.contact?.jobTitle || 'Informations principales'}</strong></div><button className="secondary-button compact-button" type="button" onClick={() => setEditing((value) => !value)}>{editing ? 'Fermer' : 'Modifier'}</button></div>
    {!editing && <div className="identity-summary-grid">
      {identity.organization && <><div><span>Société</span><strong>{identity.organization.name}</strong></div><div><span>Activité</span><strong>{identity.organization.industry || 'À préciser'}</strong></div>{identity.organization.website && <div><span>Site web</span><strong>{identity.organization.website}</strong></div>}{address && <div className="identity-wide"><span>Adresse</span><strong>{address}</strong></div>}{identity.organization.notes && <div className="identity-wide"><span>Description</span><strong>{identity.organization.notes}</strong></div>}</>}
      {identity.contact && <><div><span>Interlocuteur principal</span><strong>{identity.contact.firstName} {identity.contact.lastName}</strong></div><div><span>Fonction</span><strong>{identity.contact.jobTitle || 'À préciser'}</strong></div></>}
      <div className="identity-wide decision-summary"><span>Décisionnaire</span><strong>{decisionLabel}</strong>{decision.status === 'no' && (decision.email || decision.phone) && <small>{[decision.email, decision.phone].filter(Boolean).join(' · ')}</small>}{decision.details && <small>{decision.details}</small>}</div>
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
        <label>Prénom interlocuteur<input value={identity.contact.firstName} onChange={(e) => setIdentity({ ...identity, contact: { ...identity.contact!, firstName: e.target.value } })} /></label>
        <label>Nom interlocuteur<input value={identity.contact.lastName} onChange={(e) => setIdentity({ ...identity, contact: { ...identity.contact!, lastName: e.target.value } })} /></label>
        <label>Fonction / rôle <FieldHelp text="Ex. gérant, responsable communication, secrétaire, interlocuteur technique…" /><input value={identity.contact.jobTitle ?? ''} onChange={(e) => setIdentity({ ...identity, contact: { ...identity.contact!, jobTitle: e.target.value } })} /></label>
      </>}

      <fieldset className="identity-decision-maker form-span-2">
        <legend>Décisionnaire <FieldHelp text="Indique si l’interlocuteur actuel peut valider le devis. S’il ne le peut pas, renseigne le véritable décisionnaire ou le chemin de validation." /></legend>
        <label>L’interlocuteur principal peut valider le devis
          <select value={decision.status ?? ''} onChange={(e) => setDecision({ ...decision, status: (e.target.value || null) as ProspectInput['decisionStatus'] })}>
            <option value="">À préciser</option><option value="yes">Oui</option><option value="no">Non</option><option value="unknown">Inconnu pour le moment</option>
          </select>
        </label>
        {decision.status === 'no' && <div className="decision-maker-grid">
          <label>Nom du décisionnaire<input value={decision.name} onChange={(e) => setDecision({ ...decision, name: e.target.value })} /></label>
          <label>Fonction<input value={decision.role} onChange={(e) => setDecision({ ...decision, role: e.target.value })} /></label>
          <label>Email<input type="email" value={decision.email} onChange={(e) => setDecision({ ...decision, email: e.target.value })} />{!decisionEmail.valid && <small className="field-error">{decisionEmail.message}</small>}</label>
          <label>Téléphone<input inputMode="tel" value={decision.phone} onChange={(e) => setDecision({ ...decision, phone: e.target.value })} />{!decisionPhone.valid && <small className="field-error">{decisionPhone.message}</small>}</label>
        </div>}
        {decision.status !== 'yes' && <label>Précisions / chemin de validation<input value={decision.details} onChange={(e) => setDecision({ ...decision, details: e.target.value })} placeholder="Ex. associé à consulter, responsable régional, nom à confirmer…" /></label>}
      </fieldset>

      {error && <p className="form-error form-span-2">{error}</p>}
      <button className="primary-button" type="button" disabled={busy || !decisionEmail.valid || !decisionPhone.valid} onClick={() => void save()}>{busy ? 'Enregistrement…' : 'Enregistrer les informations'}</button>
    </div>}
    <ContactMethodsPanel organizationId={identity.organization?.id} contactId={identity.contact?.id} />
  </section>;
}
