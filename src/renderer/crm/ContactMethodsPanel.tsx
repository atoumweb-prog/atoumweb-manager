import { useEffect, useMemo, useState } from 'react';
import type { ContactMethod, ContactMethodType } from '../../shared/crm';
import { formatPhone, validateEmail, validatePhone } from '../../shared/contactValidation';

function cleanError(error: unknown): string {
  if (!(error instanceof Error)) return 'Une erreur est survenue.';
  return error.message
    .replace(/^Error invoking remote method ['"][^'"]+['"]:\s*/i, '')
    .replace(/^Error:\s*/i, '')
    .trim();
}

interface ContactMethodsPanelProps {
  organizationId?: string | null;
  contactId?: string | null;
  summaryLabel?: string;
  organizationLabel?: string;
  contactLabel?: string;
  allowOrganization?: boolean;
}

export function ContactMethodsPanel({
  organizationId,
  contactId,
  summaryLabel = 'Coordonnées',
  organizationLabel = 'Entreprise / accueil',
  contactLabel = 'Interlocuteur principal',
  allowOrganization = true,
}: ContactMethodsPanelProps) {
  const [organizationItems, setOrganizationItems] = useState<ContactMethod[]>([]);
  const [contactItems, setContactItems] = useState<ContactMethod[]>([]);
  const [owner, setOwner] = useState<'organization' | 'contact'>(contactId ? 'contact' : 'organization');
  const [type, setType] = useState<ContactMethodType>('email');
  const [value, setValue] = useState('');
  const [label, setLabel] = useState('');
  const [error, setError] = useState('');

  async function load() {
    try {
      const [org, contact] = await Promise.all([
        allowOrganization && organizationId ? window.atoumweb.crm.contactMethods.list('organization', organizationId) : Promise.resolve([]),
        contactId ? window.atoumweb.crm.contactMethods.list('contact', contactId) : Promise.resolve([]),
      ]);
      setOrganizationItems(org);
      setContactItems(contact);
    } catch (e) { setError(cleanError(e)); }
  }

  useEffect(() => {
    if (contactId) setOwner('contact');
    else if (allowOrganization && organizationId) setOwner('organization');
    void load();
  }, [organizationId, contactId, allowOrganization]);

  const items = useMemo(() => [...organizationItems, ...contactItems], [organizationItems, contactItems]);
  const emailCount = items.filter((item) => item.type === 'email').length;
  const phoneCount = items.filter((item) => item.type === 'phone').length;
  const validation = type === 'email' ? validateEmail(value) : validatePhone(value);

  async function add() {
    const effectiveOwner = contactId && (!allowOrganization || !organizationId) ? 'contact' : owner;
    const ownerId = effectiveOwner === 'contact' ? contactId : organizationId;
    if (!ownerId || !value.trim() || !validation.valid) return;
    setError('');
    try {
      const siblings = effectiveOwner === 'contact' ? contactItems : organizationItems;
      await window.atoumweb.crm.contactMethods.save({
        [effectiveOwner === 'contact' ? 'contactId' : 'organizationId']: ownerId,
        type,
        value: value.trim(),
        label: label.trim() || null,
        isPrimary: siblings.every((item) => item.type !== type),
      });
      setValue(''); setLabel(''); await load();
      window.dispatchEvent(new Event('atoumweb:changed'));
    } catch (e) { setError(cleanError(e)); }
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

  if ((!allowOrganization || !organizationId) && !contactId) return null;
  const canChooseOwner = Boolean(allowOrganization && organizationId && contactId);
  return <details className="contact-methods-panel" open={false}>
    <summary><span><strong>{summaryLabel}</strong><small>{emailCount} email{emailCount > 1 ? 's' : ''} · {phoneCount} téléphone{phoneCount > 1 ? 's' : ''}</small></span><span className="details-hint">Afficher / modifier</span></summary>
    <div className="contact-methods-content">
      {allowOrganization && group(organizationLabel, organizationItems)}
      {group(contactLabel, contactItems)}
      <div className="contact-method-add">
        {canChooseOwner && <label>Rattacher à<select value={owner} onChange={(e) => setOwner(e.target.value as 'organization' | 'contact')}><option value="contact">{contactLabel}</option><option value="organization">{organizationLabel}</option></select></label>}
        <label>Type<select value={type} onChange={(e) => { setType(e.target.value as ContactMethodType); setValue(''); setError(''); }}><option value="email">Email</option><option value="phone">Téléphone</option></select></label>
        <label>Coordonnée<input inputMode={type === 'phone' ? 'tel' : 'email'} value={value} onChange={(e) => setValue(e.target.value)} placeholder={type === 'email' ? 'nom@exemple.fr' : '06 12 34 56 78 ou +33…'} />{value.trim() && !validation.valid && <small className="field-error">{validation.message}</small>}</label>
        <label>Libellé<input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Portable, bureau, accueil…" /></label>
        <button className="secondary-button" type="button" disabled={!value.trim() || !validation.valid} onClick={() => void add()}>Ajouter</button>
      </div>
      {error && <p className="form-error">{error}</p>}
    </div>
  </details>;
}
