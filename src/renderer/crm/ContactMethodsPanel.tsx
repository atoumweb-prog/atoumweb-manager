import {useUnsavedDraft,requestUnsavedExit} from '../unsaved/unsaved';
import { useEffect, useMemo, useState } from 'react';
import type { ContactMethod, ContactMethodType } from '../../shared/crm';
import { formatPhone, validateEmail, validatePhone } from '../../shared/contactValidation';

function cleanError(error: unknown): string {
  if (!(error instanceof Error)) return 'Une erreur est survenue.';
  return error.message
    .replace(/^Error invoking remote method ['\"][^'\"]+['\"]:\s*/i, '')
    .replace(/^Error:\s*/i, '')
    .trim();
}

const USAGES: Record<ContactMethodType, readonly string[]> = {
  phone: ['Portable', 'Bureau', 'Standard', 'Personnel', 'Autre'],
  email: ['Professionnel', 'Personnel', 'Facturation', 'Support', 'Autre'],
};

interface ContactOwnerOption { id: string; label: string; }

interface ContactMethodsPanelProps {
  organizationId?: string | null;
  contactId?: string | null;
  contactOwners?: ContactOwnerOption[];
  summaryLabel?: string;
  organizationLabel?: string;
  contactLabel?: string;
  allowOrganization?: boolean;
}

export function ContactMethodsPanel({
  organizationId,
  contactId,
  contactOwners,
  summaryLabel = 'Coordonnées',
  organizationLabel = 'Entreprise / accueil',
  contactLabel = 'Interlocuteur principal',
  allowOrganization = true,
}: ContactMethodsPanelProps) {
  const owners = useMemo<ContactOwnerOption[]>(() => {
    if (contactOwners?.length) return contactOwners;
    return contactId ? [{ id: contactId, label: contactLabel }] : [];
  }, [contactOwners, contactId, contactLabel]);
  const [organizationItems, setOrganizationItems] = useState<ContactMethod[]>([]);
  const [contactItems, setContactItems] = useState<Record<string, ContactMethod[]>>({});
  const [owner, setOwner] = useState<string>(() => owners[0]?.id ?? (allowOrganization && organizationId ? 'organization' : ''));
  const [type, setType] = useState<ContactMethodType>('phone');
  const [value, setValue] = useState('');
  const [usage, setUsage] = useState('Portable');
  const [error, setError] = useState('');
  const [saving,setSaving]=useState(false);
  const guard=useUnsavedDraft('Coordonnée à ajouter',{value},{pending:saving,discard:s=>setValue(s.value)});


  async function load() {
    try {
      const orgPromise = allowOrganization && organizationId
        ? window.atoumweb.crm.contactMethods.list('organization', organizationId)
        : Promise.resolve([] as ContactMethod[]);
      const contactPromises = owners.map(async (item) => [item.id, await window.atoumweb.crm.contactMethods.list('contact', item.id)] as const);
      const [org, loadedContacts] = await Promise.all([orgPromise, Promise.all(contactPromises)]);
      setOrganizationItems(org);
      setContactItems(Object.fromEntries(loadedContacts));
    } catch (e) { setError(cleanError(e)); }
  }

  useEffect(() => {
    const available = new Set(owners.map((item) => item.id));
    if (allowOrganization && organizationId) available.add('organization');
    if (!owner || !available.has(owner)) setOwner(owners[0]?.id ?? (allowOrganization && organizationId ? 'organization' : ''));
    void load();
  }, [organizationId, allowOrganization, owners.map((item) => item.id).join('|')]);

  const items = useMemo(() => [
    ...organizationItems,
    ...Object.values(contactItems).flat(),
  ], [organizationItems, contactItems]);
  const emailCount = items.filter((item) => item.type === 'email').length;
  const phoneCount = items.filter((item) => item.type === 'phone').length;
  const validation = type === 'email' ? validateEmail(value) : validatePhone(value);

  async function add() {
    if (!owner || !value.trim() || !validation.valid) return;
    const organizationOwner = owner === 'organization';
    const ownerId = organizationOwner ? organizationId : owner;
    if (!ownerId) return;
    setError('');setSaving(true);
    try {
      const siblings = organizationOwner ? organizationItems : (contactItems[ownerId] ?? []);
      await window.atoumweb.crm.contactMethods.save({
        [organizationOwner ? 'organizationId' : 'contactId']: ownerId,
        type,
        value: value.trim(),
        label: usage,
        isPrimary: siblings.every((item) => item.type !== type),
      });
      setValue('');
      await load();
      window.dispatchEvent(new Event('atoumweb:changed'));
    } catch (e) { setError(cleanError(e)); } finally{setSaving(false);}
  }

  async function archive(id: string) {
    try {
      await window.atoumweb.crm.contactMethods.archive(id, true);
      await load();
      window.dispatchEvent(new Event('atoumweb:changed'));
    } catch (e) { setError(cleanError(e)); }
  }

  function group(title: string, values: ContactMethod[]) {
    if (!values.length) return null;
    const sorted = [...values].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || (a.label ?? '').localeCompare(b.label ?? '', 'fr'));
    return <div className="contact-method-group"><strong>{title}</strong>{sorted.map((item) => <div className="contact-method-row" key={item.id}><span><b>{item.type === 'email' ? 'Email' : 'Téléphone'}</b> · {item.type === 'phone' ? formatPhone(item.value) : item.value}{item.label ? ` · ${item.label}` : ''}{item.isPrimary ? ' · Principal' : ''}</span><button className="secondary-button compact-button" type="button" onClick={() => void archive(item.id)}>Archiver</button></div>)}</div>;
  }

  if ((!allowOrganization || !organizationId) && owners.length === 0) return null;
  const ownerOptions = [
    ...(allowOrganization && organizationId ? [{ id: 'organization', label: organizationLabel }] : []),
    ...owners,
  ];
  return <details className="contact-methods-panel" open={false}>
    <summary><span><strong>{summaryLabel}</strong><small>{emailCount} email{emailCount > 1 ? 's' : ''} · {phoneCount} téléphone{phoneCount > 1 ? 's' : ''}</small></span><span className="details-hint">Afficher / modifier</span></summary>
    <div className="contact-methods-content">
      {allowOrganization && group(organizationLabel, organizationItems)}
      {owners.map((item) => <div key={item.id}>{group(item.label, contactItems[item.id] ?? [])}</div>)}
      <div className="contact-method-add">
        {ownerOptions.length > 1 && <label>Appartient à<select value={owner} onChange={(e) => setOwner(e.target.value)}>{ownerOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>}
        <label>Type<select value={type} onChange={(e) => { const next = e.target.value as ContactMethodType; setType(next); setUsage(USAGES[next][0]); setValue(''); setError(''); }}><option value="phone">Téléphone</option><option value="email">Email</option></select></label>
        <label>Usage<select value={usage} onChange={(e) => setUsage(e.target.value)}>{USAGES[type].map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label>Coordonnée<input inputMode={type === 'phone' ? 'tel' : 'email'} value={value} onChange={(e) => setValue(e.target.value)} placeholder={type === 'email' ? 'nom@exemple.fr' : '06 12 34 56 78 ou +33…'} />{value.trim() && !validation.valid && <small className="field-error">{validation.message}</small>}</label>
        <button className="secondary-button" type="button" disabled={!owner || !value.trim() || !validation.valid} onClick={() => void add()}>Ajouter</button>
      </div>
      {error && <p className="form-error">{error}</p>}
    </div>
  </details>;
}
