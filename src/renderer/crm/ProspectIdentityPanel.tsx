import { useEffect, useState } from 'react';
import type { ContactMethodType, ProspectInput, ProspectSummary } from '../../shared/crm';
import type { WorkflowIdentity } from '../../shared/workflow';
import { validateEmail, validatePhone } from '../../shared/contactValidation';
import { ContactMethodsPanel } from './ContactMethodsPanel';
import { ProspectLinkedContactsPanel } from './ProspectLinkedContactsPanel';
import { FieldHelp } from './ProspectQualificationPanelV2';
import { displayWebUrl } from '../../shared/webUrl';
import { CrmIdentityAssetEditor } from './CrmIdentityVisual';

interface DecisionDraft {
  status: ProspectInput['decisionStatus'];
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  phone: string;
  details: string;
}

interface PrimaryDraft { firstName: string; lastName: string; role: string; }

function legacyName(value?: string | null): { firstName: string; lastName: string } {
  const parts = value?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function decisionFromIdentity(prospect: ProspectSummary, identity?: WorkflowIdentity | null): DecisionDraft {
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
    .replace(/^Error invoking remote method ['\"][^'\"]+['\"]:\s*/i, '')
    .replace(/^Error:\s*/i, '')
    .trim();
}

export function ProspectIdentityPanel({ prospect, onSaved, focusRequest }: { prospect: ProspectSummary; onSaved: () => void; focusRequest?: { target: 'decision' | 'contact'; sequence: number } | null }) {
  const [identity, setIdentity] = useState<WorkflowIdentity | null>(null);
  const [decision, setDecision] = useState<DecisionDraft>(() => decisionFromIdentity(prospect));
  const [decisionContactId, setDecisionContactId] = useState('');
  const [primaryDraft, setPrimaryDraft] = useState<PrimaryDraft>({ firstName: '', lastName: '', role: '' });
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!focusRequest) return;
    if (focusRequest.target === 'decision') setEditing(true);
    window.setTimeout(() => {
      const field = focusRequest.target === 'decision' ? document.getElementById('prospect-decision-field') : document.querySelector<HTMLElement>('.prospect-detail-v2 .contact-methods-panel');
      if (field instanceof HTMLDetailsElement) field.open = true;
      field?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      field?.querySelector<HTMLElement>(focusRequest.target === 'decision' ? 'select' : '.contact-method-add input')?.focus({ preventScroll: true });
    }, 50);
  }, [focusRequest?.sequence]);

  async function draftFromContact(contactId: string, base: DecisionDraft, sourceIdentity: WorkflowIdentity): Promise<DecisionDraft> {
    const contact = sourceIdentity.contacts.find((item) => item.id === contactId) ?? sourceIdentity.decisionMaker;
    if (!contact) return base;
    const methods = await window.atoumweb.crm.contactMethods.list('contact', contact.id);
    const primaryEmail = methods.find((item) => item.type === 'email' && item.isPrimary) ?? methods.find((item) => item.type === 'email');
    const primaryPhone = methods.find((item) => item.type === 'phone' && item.isPrimary) ?? methods.find((item) => item.type === 'phone');
    return {
      ...base,
      firstName: contact.firstName,
      lastName: contact.lastName,
      role: contact.jobTitle ?? '',
      email: primaryEmail?.value ?? '',
      phone: primaryPhone?.value ?? '',
    };
  }

  async function load() {
    try {
      const nextIdentity = await window.atoumweb.workflow.identity('prospect', prospect.id);
      setIdentity(nextIdentity);
      setPrimaryDraft(nextIdentity.contact
        ? { firstName: nextIdentity.contact.firstName, lastName: nextIdentity.contact.lastName, role: nextIdentity.contact.jobTitle ?? '' }
        : { firstName: '', lastName: '', role: '' });
      const separateDecisionMaker = nextIdentity.decisionMaker && nextIdentity.decisionMaker.id !== nextIdentity.contact?.id
        ? nextIdentity.decisionMaker
        : null;
      const nextDecisionContactId = prospect.decisionStatus === 'no' ? separateDecisionMaker?.id ?? '' : '';
      setDecisionContactId(nextDecisionContactId);
      const base = decisionFromIdentity(prospect, nextIdentity);
      setDecision(nextDecisionContactId ? await draftFromContact(nextDecisionContactId, base, nextIdentity) : base);
    } catch (e) { setError(cleanError(e)); }
  }

  useEffect(() => { setEditing(false); void load(); }, [prospect.id]);
  useEffect(() => { if (identity) void load(); }, [prospect.updatedAt]);

  const decisionEmail = validateEmail(decision.email);
  const decisionPhone = validatePhone(decision.phone);

  async function chooseDecisionContact(contactId: string) {
    if (!identity) return;
    setDecisionContactId(contactId);
    if (!contactId) {
      setDecision({ ...decision, firstName: '', lastName: '', role: '', email: '', phone: '' });
      return;
    }
    try {
      setDecision(await draftFromContact(contactId, { ...decision, status: 'no' }, identity));
    } catch (e) { setError(cleanError(e)); }
  }

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
      label: primary?.label ?? (type === 'phone' ? 'Portable' : 'Professionnel'),
      isPrimary: true,
      notes: primary?.notes ?? null,
    }, primary?.id);
  }

  async function save() {
    if (!identity) return;
    const creatingDecisionContact = decision.status === 'no' && !decisionContactId;
    if (creatingDecisionContact && (!decisionEmail.valid || !decisionPhone.valid)) return;
    const primaryStarted = primaryDraft.firstName.trim() || primaryDraft.lastName.trim() || primaryDraft.role.trim();
    if (!identity.contact && primaryStarted && (!primaryDraft.firstName.trim() || !primaryDraft.lastName.trim())) {
      setError('Pour créer l’interlocuteur principal, renseigne son prénom et son nom.');
      return;
    }
    if (decision.status === 'yes' && !identity.contact && (!primaryDraft.firstName.trim() || !primaryDraft.lastName.trim())) {
      setError('Ajoute d’abord l’interlocuteur principal pour pouvoir le définir comme décisionnaire.');
      return;
    }
    if (creatingDecisionContact && (!decision.firstName.trim() || !decision.lastName.trim())) {
      setError('Choisis un contact existant ou renseigne le prénom et le nom du nouveau décisionnaire.');
      return;
    }

    setBusy(true); setError('');
    try {
      if (identity.organization) await window.atoumweb.crm.organizations.update(identity.organization.id, identity.organization);

      let primaryContact = identity.contact;
      if (primaryContact) {
        primaryContact = await window.atoumweb.crm.contacts.update(primaryContact.id, {
          ...primaryContact,
          firstName: primaryDraft.firstName.trim(),
          lastName: primaryDraft.lastName.trim(),
          jobTitle: primaryDraft.role.trim() || null,
        });
      } else if (primaryDraft.firstName.trim() && primaryDraft.lastName.trim()) {
        primaryContact = await window.atoumweb.crm.contacts.create({
          organizationId: identity.organization?.id ?? null,
          firstName: primaryDraft.firstName.trim(),
          lastName: primaryDraft.lastName.trim(),
          jobTitle: primaryDraft.role.trim() || null,
          email: null,
          phone: null,
        });
        await window.atoumweb.crm.prospects.update(prospect.id, { ...prospect, contactId: primaryContact.id });
      }

      let decisionMakerContactId: string | null = null;
      if (decision.status === 'yes') {
        decisionMakerContactId = primaryContact?.id ?? null;
      } else if (decision.status === 'no') {
        if (decisionContactId) {
          decisionMakerContactId = decisionContactId;
        } else {
          const decisionContact = await window.atoumweb.crm.contacts.create({
            organizationId: identity.organization?.id ?? primaryContact?.organizationId ?? null,
            firstName: decision.firstName.trim(),
            lastName: decision.lastName.trim(),
            jobTitle: decision.role.trim() || null,
            email: null,
            phone: null,
          });
          decisionMakerContactId = decisionContact.id;
          await syncPrimaryMethod(decisionContact.id, 'email', decision.email);
          await syncPrimaryMethod(decisionContact.id, 'phone', decision.phone);
        }
      }

      await window.atoumweb.crm.prospects.updateQualification(prospect.id, {
        decisionStatus: decision.status ?? null,
        decisionMakerContactId,
        decisionMakerDetails: decision.status === 'yes'
          ? null
          : decision.details.trim() || (decision.status === 'no' ? 'Décisionnaire identifié dans les Contacts' : null),
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
    ? identity.contact ? `${identity.contact.firstName} ${identity.contact.lastName} · interlocuteur principal` : 'Interlocuteur principal à renseigner'
    : decision.status === 'no'
      ? identity.decisionMaker
        ? `${identity.decisionMaker.firstName} ${identity.decisionMaker.lastName}${identity.decisionMaker.jobTitle ? ` · ${identity.decisionMaker.jobTitle}` : ''}`
        : [decision.firstName, decision.lastName, decision.role].filter(Boolean).join(' · ') || 'Autre décisionnaire à préciser'
      : decision.status === 'unknown'
        ? 'Inconnu pour le moment'
        : 'À qualifier';
  const decisionOptions = identity.contacts.filter((contact) => contact.id !== identity.contact?.id);
  const contactOwners = identity.contacts.map((contact) => ({
    id: contact.id,
    label: contact.id === identity.contact?.id
      ? `Interlocuteur principal · ${contact.firstName} ${contact.lastName}`
      : contact.id === identity.decisionMaker?.id
        ? `Décisionnaire · ${contact.firstName} ${contact.lastName}`
        : `${contact.jobTitle || 'Contact'} · ${contact.firstName} ${contact.lastName}`,
  }));

  return <section className="prospect-work-section identity-panel-v2">
    <div className="work-section-heading"><div><span className="eyebrow">Entreprise & interlocuteur</span><strong>{identity.organization?.industry || identity.contact?.jobTitle || 'Informations principales'}</strong></div><button className="secondary-button compact-button" type="button" onClick={() => setEditing((value) => !value)}>{editing ? 'Fermer' : 'Modifier'}</button></div>
    {!editing && <div className="identity-summary-grid">
      {identity.organization && <><div><span>Société</span><strong>{identity.organization.name}</strong></div><div><span>Activité</span><strong>{identity.organization.industry || 'À préciser'}</strong></div>{identity.organization.website && <div><span>Site web</span><strong>{displayWebUrl(identity.organization.website)}</strong></div>}{address && <div className="identity-wide"><span>Adresse</span><strong>{address}</strong></div>}{identity.organization.notes && <div className="identity-wide"><span>Description</span><strong>{identity.organization.notes}</strong></div>}</>}
      {identity.contact ? <><div><span>Interlocuteur principal</span><strong>{identity.contact.firstName} {identity.contact.lastName}</strong></div><div><span>Fonction</span><strong>{identity.contact.jobTitle || 'À préciser'}</strong></div></> : <div className="identity-wide"><span>Interlocuteur principal</span><strong>Aucun interlocuteur renseigné</strong><small>Utilise « Modifier » pour l’ajouter sans recréer le prospect.</small></div>}
      <div className="identity-wide decision-summary"><span>Décisionnaire</span><strong>{decisionLabel}</strong>{decision.details && decision.details !== 'Décisionnaire identifié dans les Contacts' && <small>{decision.details}</small>}</div>
    </div>}
    {editing && <div className="workflow-fields identity-editor-v2">
      <div className="form-span-2"><CrmIdentityAssetEditor organizationId={identity.organization?.id} contactId={identity.contact?.id} /></div>
      {identity.organization && <>
        <label>Société <FieldHelp text="Nom usuel de la société ou de la structure commerciale." /><input value={identity.organization.name} onChange={(e) => setIdentity({ ...identity, organization: { ...identity.organization!, name: e.target.value } })} /></label>
        <label>Activité / type de structure <FieldHelp text="Permet d’identifier rapidement le métier : artisan, restaurant, commerçant, association, profession libérale…" /><input value={identity.organization.industry ?? ''} onChange={(e) => setIdentity({ ...identity, organization: { ...identity.organization!, industry: e.target.value } })} placeholder="Ex. artisan cirier, restaurant, commerce…" /></label>
        <label className="form-span-2">Description de l’activité <FieldHelp text="Quelques mots sur l’activité, le positionnement et ce que fait l’entreprise. Utile pour préparer la prospection et le devis." /><textarea value={identity.organization.notes ?? ''} onChange={(e) => setIdentity({ ...identity, organization: { ...identity.organization!, notes: e.target.value } })} /></label>
        <label>Site web <FieldHelp text="Tu peux saisir simplement exemple.fr. Le Manager ajoute https:// automatiquement. Si le site fonctionne volontairement en http://, saisis-le explicitement." /><input inputMode="url" value={displayWebUrl(identity.organization.website)} onChange={(e) => setIdentity({ ...identity, organization: { ...identity.organization!, website: e.target.value } })} placeholder="exemple.fr" /></label>
        <label>Adresse<input value={identity.organization.addressLine1 ?? ''} onChange={(e) => setIdentity({ ...identity, organization: { ...identity.organization!, addressLine1: e.target.value } })} /></label>
        <label>Complément d’adresse<input value={identity.organization.addressLine2 ?? ''} onChange={(e) => setIdentity({ ...identity, organization: { ...identity.organization!, addressLine2: e.target.value } })} /></label>
        <label>Code postal<input value={identity.organization.postalCode ?? ''} onChange={(e) => setIdentity({ ...identity, organization: { ...identity.organization!, postalCode: e.target.value } })} /></label>
        <label>Ville<input value={identity.organization.city ?? ''} onChange={(e) => setIdentity({ ...identity, organization: { ...identity.organization!, city: e.target.value } })} /></label>
        <label>Pays<input value={identity.organization.country ?? ''} onChange={(e) => setIdentity({ ...identity, organization: { ...identity.organization!, country: e.target.value } })} /></label>
      </>}

      <div className="form-span-2"><span className="eyebrow">Interlocuteur principal</span></div>
      <label id="prospect-contact-field">Prénom interlocuteur<input value={primaryDraft.firstName} onChange={(e) => setPrimaryDraft({ ...primaryDraft, firstName: e.target.value })} placeholder="Prénom" /></label>
      <label>Nom interlocuteur<input value={primaryDraft.lastName} onChange={(e) => setPrimaryDraft({ ...primaryDraft, lastName: e.target.value })} placeholder="Nom" /></label>
      <label>Fonction / rôle <FieldHelp text="Champ libre : gérant, patron, comptable, banquier, responsable communication…" /><input value={primaryDraft.role} onChange={(e) => setPrimaryDraft({ ...primaryDraft, role: e.target.value })} placeholder="Gérant, responsable…" /></label>

      <fieldset id="prospect-decision-field" className="identity-decision-maker form-span-2">
        <legend>Décisionnaire <FieldHelp text="Choisis qui peut réellement valider le devis. Le décisionnaire reste un vrai Contact réutilisable." /></legend>
        <label>Qui est le décisionnaire ?
          <select value={decision.status ?? ''} onChange={(e) => { const status = (e.target.value || null) as ProspectInput['decisionStatus']; setDecision({ ...decision, status }); if (status !== 'no') setDecisionContactId(''); }}>
            <option value="">À préciser</option>
            <option value="yes">L’interlocuteur principal</option>
            <option value="no">Un autre contact</option>
            <option value="unknown">Inconnu pour le moment</option>
          </select>
        </label>
        {decision.status === 'no' && <div className="decision-maker-grid">
          <label className="form-span-2">Contact décisionnaire
            <select value={decisionContactId} onChange={(e) => void chooseDecisionContact(e.target.value)}>
              <option value="">Créer un nouveau contact…</option>
              {decisionOptions.map((contact) => <option key={contact.id} value={contact.id}>{contact.firstName} {contact.lastName}{contact.jobTitle ? ` · ${contact.jobTitle}` : ''}</option>)}
            </select>
          </label>
          {decisionContactId ? <div className="form-span-2 selected-contact-summary"><strong>{decision.firstName} {decision.lastName}</strong><small>{decision.role || 'Fonction à préciser'} · les coordonnées restent modifiables dans le bloc Coordonnées ci-dessous.</small></div> : <>
            <label>Prénom du décisionnaire<input value={decision.firstName} onChange={(e) => setDecision({ ...decision, firstName: e.target.value })} /></label>
            <label>Nom du décisionnaire<input value={decision.lastName} onChange={(e) => setDecision({ ...decision, lastName: e.target.value })} /></label>
            <label>Fonction / rôle<input value={decision.role} onChange={(e) => setDecision({ ...decision, role: e.target.value })} placeholder="Gérant, associé, directeur…" /></label>
            <label>Email<input type="email" value={decision.email} onChange={(e) => setDecision({ ...decision, email: e.target.value })} />{decision.email.trim() && !decisionEmail.valid && <small className="field-error">{decisionEmail.message}</small>}</label>
            <label>Téléphone<input inputMode="tel" value={decision.phone} onChange={(e) => setDecision({ ...decision, phone: e.target.value })} />{decision.phone.trim() && !decisionPhone.valid && <small className="field-error">{decisionPhone.message}</small>}</label>
          </>}
        </div>}
        {decision.status !== 'yes' && <label>Précisions / chemin de validation<input value={decision.details} onChange={(e) => setDecision({ ...decision, details: e.target.value === 'Décisionnaire identifié dans les Contacts' ? '' : e.target.value })} placeholder="Ex. associé à consulter, responsable régional, nom à confirmer…" /></label>}
      </fieldset>

      {error && <p className="form-error form-span-2">{error}</p>}
      <button className="primary-button" type="button" disabled={busy || (decision.status === 'no' && !decisionContactId && (!decisionEmail.valid || !decisionPhone.valid))} onClick={() => void save()}>{busy ? 'Enregistrement…' : 'Enregistrer les informations'}</button>
    </div>}
    <ProspectLinkedContactsPanel
      organizationId={identity.organization?.id}
      contacts={identity.contacts}
      primaryContactId={identity.contact?.id}
      decisionMakerContactId={identity.decisionMaker?.id}
      onChanged={() => void load()}
    />
    <ContactMethodsPanel
      organizationId={identity.organization?.id}
      contactOwners={contactOwners}
      organizationLabel="Entreprise / accueil"
      summaryLabel="Coordonnées"
    />
  </section>;
}
