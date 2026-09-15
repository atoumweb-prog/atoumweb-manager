import { useEffect, useState } from 'react';
import type { Contact, ContactMethodType, Organization, ProspectInput, ProspectSummary } from '../../shared/crm';
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
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  phone: string;
  details: string;
}

function legacyName(value?: string | null): { firstName: string; lastName: string } {
  const parts = value?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function decisionFromIdentity(prospect: ProspectSummary, identity?: IdentityState | null): DecisionDraft {
  const decisionMaker = identity?.decisionMaker;
  const legacy = legacyName(prospect.decisionMakerName);
  return {
    status: prospect.decisionStatus ?? null,
    firstName: decisionMaker?.firstName ?? legacy.firstName,
    lastName: decisionMaker?.lastName ?? legacy.lastName,
    role: decisionMaker?.jobTitle ?? prospect.decisionMakerRole ?? '',
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
  const [decision, setDecision] = useState<DecisionDraft>(() => decisionFromIdentity(prospect));
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function hydrateDecisionMethods(nextIdentity: IdentityState, base: DecisionDraft): Promise<DecisionDraft> {
    if (!nextIdentity.decisionMaker || prospect.decisionStatus !== 'no') return base;
    const methods = await window.atoumweb.crm.contactMethods.list('contact', nextIdentity.decisionMaker.id);
    const primaryEmail = methods.find((item) => item.type === 'email' && item.isPrimary) ?? methods.find((item) => item.type === 'email');
    const primaryPhone = methods.find((item) => item.type === 'phone' && item.isPrimary) ?? methods.find((item) => item.type === 'phone');
    return { ...base, email: primaryEmail?.value ?? '', phone: primaryPhone?.value ?? '' };
  }

  async function load() {
    try {
      const nextIdentity = await window.atoumweb.workflow.identity('prospect', prospect.id);
      setIdentity(nextIdentity);
      setDecision(await hydrateDecisionMethods(nextIdentity, decisionFromIdentity(prospect, nextIdentity)));
    } catch (e) { setError(cleanError(e)); }
  }

  useEffect(() => { setEditing(false); void load(); }, [prospect.id]);
  useEffect(() => { if (identity) void hydrateDecisionMethods(identity, decisionFromIdentity(prospect, identity)).then(setDecision); }, [prospect.updatedAt]);

  const decisionEmail = validateEmail(decision.email);
  const decisionPhone = validatePhone(decision.phone);

  async function syncPrimaryMethod(contactId: string, type: ContactMethodType, value: string) {
    const methods = await window.atoumweb.crm.contactMethods.list('contact', contactId);
    const primary = methods.find((item) => item.type === type && item.isPrimary) ?? methods.find((item) => item.type === type);
    const normalizedValue = value.trim();
    if (!normalizedValue) {
      if (primary) await window.atoumweb.crm.contactMethods.archive(primary.id, true);
      return;
    }
    await window.atoumweb.crm.contactMethods.save({
      contactId,
      type,
      value: normalizedValue,
      label: primary?.label ?? 'Principal',
      isPrimary: true,
      notes: primary?.notes ?? null,
    }, primary?.id);
  }

  async function save() {
    if (!identity || !decisionEmail.valid || !decisionPhone.valid) return;
    if (decision.status === 'yes' && !identity.contact) {
      setError('Renseigne d’abord l’interlocuteur principal pour pouvoir le définir comme décisionnaire.');
      return;
    }
    if (decision.status === 'no' && (!decision.firstName.trim() || !decision.lastName.trim())) {
      setError('Renseigne le prénom et le nom du décisionnaire, ou choisis « Inconnu pour le moment ».');
      return;
    }

    setBusy(true); setError('');
    try {
      if (identity.organization) await window.atoumweb.crm.organizations.update(identity.organization.id, identity.organization);
      if (identity.contact) await window.atoumweb.crm.contacts.update(identity.contact.id, identity.contact);

      let decisionMakerContactId: string | null = null;
      if (decision.status === 'yes') {
        decisionMakerContactId = identity.contact?.id ?? null;
      } else if (decision.status === 'no') {
        const existingSeparateDecisionMaker = identity.decisionMaker && identity.decisionMaker.id !== identity.contact?.id
          ? identity.decisionMaker
          : null;
        const decisionInput = {
          organizationId: identity.organization?.id ?? identity.contact?.organizationId ?? null,
          firstName: decision.firstName.trim(),
          lastName: decision.lastName.trim(),
          jobTitle: decision.role.trim() || null,
          email: null,
          phone: null,
          preferredChannel: existingSeparateDecisionMaker?.preferredChannel ?? null,
          notes: existingSeparateDecisionMaker?.notes ?? null,
        };
        const decisionContact = existingSeparateDecisionMaker
          ? await window.atoumweb.crm.contacts.update(existingSeparateDecisionMaker.id, decisionInput)
          : await window.atoumweb.crm.contacts.create(decisionInput);
        decisionMakerContactId = decisionContact.id;
        await syncPrimaryMethod(decisionContact.id, 'email', decision.email);
        await syncPrimaryMethod(decisionContact.id, 'phone', decision.phone);
      }

      await window.atoumweb.crm.prospects.updateQualification(prospect.id, {
        decisionStatus: decision.status ?? null,
        decisionMakerContactId,
        decisionMakerDetails: decision.status === 'yes'
          ? null
          : decision.details.trim() || (decision.status === 'no' ? 'Décisionnaire identifié dans les Contacts' : null),
        // Les anciennes colonnes sont volontairement vidées : le Contact devient l’unique source de vérité.
        decisionMakerName: null,
        decisionMakerRole: null,
        decisionMakerEmail: null,
        decisionMakerPhone: null,
      });
      setEditing(false); await load(); onSaved();
      window.dispatchEvent(new Event('atoumweb:changed'));
    } catch (e) { setError(cleanError(e)); }
    finally { setBusy(false); }
  }

  if (!identity) return <section className="prospect-work-section"><p className="muted">Chargement des informations…</p></section>;
  const address = identity.organization ? [identity.organization.addressLine1, identity.organization.postalCode, identity.organization.city].filter(Boolean).join(' · ') : '';
  const decisionLabel = decision.status === 'yes'
    ? identity.contact ? `${identity.contact.firstName} ${identity.contact.lastName} · interlocuteur décisionnaire` : 'Interlocuteur décisionnaire à renseigner'
    : decision.status === 'no'
      ? identity.decisionMaker
        ? `${identity.decisionMaker.firstName} ${identity.decisionMaker.lastName}${identity.decisionMaker.jobTitle ? ` · ${identity.decisionMaker.jobTitle}` : ''}`
        : [decision.firstName, decision.lastName, decision.role].filter(Boolean).join(' · ') || 'Décisionnaire à préciser'
      : decision.status === 'unknown'
        ? 'Décisionnaire encore inconnu'
        : 'À qualifier';

  return <section className="prospect-work-section identity-panel-v2">
    <div className="work-section-heading"><div><span className="eyebrow">Entreprise & interlocuteur</span><strong>{identity.organization?.industry || identity.contact?.jobTitle || 'Informations principales'}</strong></div><button className="secondary-button compact-button" type="button" onClick={() => setEditing((value) => !value)}>{editing ? 'Fermer' : 'Modifier'}</button></div>
    {!editing && <div className="identity-summary-grid">
      {identity.organization && <><div><span>Société</span><strong>{identity.organization.name}</strong></div><div><span>Activité</span><strong>{identity.organization.industry || 'À préciser'}</strong></div>{identity.organization.website && <div><span>Site web</span><strong>{identity.organization.website}</strong></div>}{address && <div className="identity-wide"><span>Adresse</span><strong>{address}</strong></div>}{identity.organization.notes && <div className="identity-wide"><span>Description</span><strong>{identity.organization.notes}</strong></div>}</>}
      {identity.contact && <><div><span>Interlocuteur principal</span><strong>{identity.contact.firstName} {identity.contact.lastName}</strong></div><div><span>Fonction</span><strong>{identity.contact.jobTitle || 'À préciser'}</strong></div></>}
      <div className="identity-wide decision-summary"><span>Décisionnaire</span><strong>{decisionLabel}</strong>{decision.details && decision.details !== 'Décisionnaire identifié dans les Contacts' && <small>{decision.details}</small>}</div>
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
        <legend>Décisionnaire <FieldHelp text="Indique si l’interlocuteur actuel peut valider le devis. Si ce n’est pas lui, le décisionnaire est enregistré comme un vrai Contact réutilisable dans le Manager." /></legend>
        <label>L’interlocuteur principal peut valider le devis
          <select value={decision.status ?? ''} onChange={(e) => setDecision({ ...decision, status: (e.target.value || null) as ProspectInput['decisionStatus'] })}>
            <option value="">À préciser</option><option value="yes">Oui</option><option value="no">Non</option><option value="unknown">Inconnu pour le moment</option>
          </select>
        </label>
        {decision.status === 'no' && <div className="decision-maker-grid">
          <label>Prénom du décisionnaire<input value={decision.firstName} onChange={(e) => setDecision({ ...decision, firstName: e.target.value })} /></label>
          <label>Nom du décisionnaire<input value={decision.lastName} onChange={(e) => setDecision({ ...decision, lastName: e.target.value })} /></label>
          <label>Fonction<input value={decision.role} onChange={(e) => setDecision({ ...decision, role: e.target.value })} /></label>
          <label>Email<input type="email" value={decision.email} onChange={(e) => setDecision({ ...decision, email: e.target.value })} />{!decisionEmail.valid && <small className="field-error">{decisionEmail.message}</small>}</label>
          <label>Téléphone<input inputMode="tel" value={decision.phone} onChange={(e) => setDecision({ ...decision, phone: e.target.value })} />{!decisionPhone.valid && <small className="field-error">{decisionPhone.message}</small>}</label>
        </div>}
        {decision.status !== 'yes' && <label>Précisions / chemin de validation<input value={decision.details} onChange={(e) => setDecision({ ...decision, details: e.target.value === 'Décisionnaire identifié dans les Contacts' ? '' : e.target.value })} placeholder="Ex. associé à consulter, responsable régional, nom à confirmer…" /></label>}
      </fieldset>

      {error && <p className="form-error form-span-2">{error}</p>}
      <button className="primary-button" type="button" disabled={busy || !decisionEmail.valid || !decisionPhone.valid} onClick={() => void save()}>{busy ? 'Enregistrement…' : 'Enregistrer les informations'}</button>
    </div>}
    <ContactMethodsPanel organizationId={identity.organization?.id} contactId={identity.contact?.id} />
    {identity.decisionMaker && prospect.decisionStatus === 'no' && <ContactMethodsPanel contactId={identity.decisionMaker.id} allowOrganization={false} summaryLabel="Coordonnées du décisionnaire" contactLabel={`Décisionnaire · ${identity.decisionMaker.firstName} ${identity.decisionMaker.lastName}`} />}
  </section>;
}
