import { useEffect, useMemo, useState } from 'react';
import type { ContactMethod, ContactMethodType } from '../../shared/crm';

export function ContactMethodsPanel({ organizationId, contactId }: { organizationId?: string | null; contactId?: string | null }) {
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
        organizationId ? window.atoumweb.crm.contactMethods.list('organization', organizationId) : Promise.resolve([]),
        contactId ? window.atoumweb.crm.contactMethods.list('contact', contactId) : Promise.resolve([]),
      ]);
      setOrganizationItems(org);
      setContactItems(contact);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }

  useEffect(() => { if (!contactId && organizationId) setOwner('organization'); void load(); }, [organizationId, contactId]);

  const items = useMemo(() => [...organizationItems, ...contactItems], [organizationItems, contactItems]);
  const emailCount = items.filter((item) => item.type === 'email').length;
  const phoneCount = items.filter((item) => item.type === 'phone').length;

  async function add() {
    const ownerId = owner === 'contact' ? contactId : organizationId;
    if (!ownerId || !value.trim()) return;
    setError('');
    try {
      const siblings = owner === 'contact' ? contactItems : organizationItems;
      await window.atoumweb.crm.contactMethods.save({
        [owner === 'contact' ? 'contactId' : 'organizationId']: ownerId,
        type,
        value: value.trim(),
        label: label.trim() || null,
        isPrimary: siblings.every((item) => item.type !== type),
      });
      setValue(''); setLabel(''); await load();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }

  async function archive(id: string) {
    await window.atoumweb.crm.contactMethods.archive(id, true);
    await load();
  }

  function group(title: string, values: ContactMethod[]) {
    if (!values.length) return null;
    return <div className="contact-method-group"><strong>{title}</strong>{values.map((item) => <div className="contact-method-row" key={item.id}><span><b>{item.type === 'email' ? 'Email' : 'Téléphone'}</b> · {item.value}{item.label ? ` · ${item.label}` : ''}{item.isPrimary ? ' · Principal' : ''}</span><button className="secondary-button compact-button" type="button" onClick={() => void archive(item.id)}>Archiver</button></div>)}</div>;
  }

  if (!organizationId && !contactId) return null;
  return <details className="contact-methods-panel" open={false}>
    <summary><span><strong>Coordonnées</strong><small>{emailCount} email{emailCount > 1 ? 's' : ''} · {phoneCount} téléphone{phoneCount > 1 ? 's' : ''}</small></span><span className="details-hint">Afficher / modifier</span></summary>
    <div className="contact-methods-content">
      {group('Entreprise / accueil', organizationItems)}
      {group('Interlocuteur', contactItems)}
      <div className="contact-method-add">
        {organizationId && contactId && <label>Rattacher à<select value={owner} onChange={(e) => setOwner(e.target.value as 'organization' | 'contact')}><option value="contact">Interlocuteur</option><option value="organization">Entreprise / accueil</option></select></label>}
        <label>Type<select value={type} onChange={(e) => setType(e.target.value as ContactMethodType)}><option value="email">Email</option><option value="phone">Téléphone</option></select></label>
        <label>Coordonnée<input value={value} onChange={(e) => setValue(e.target.value)} placeholder={type === 'email' ? 'nom@exemple.fr' : '06…'} /></label>
        <label>Libellé<input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Accueil, mobile, facturation…" /></label>
        <button className="secondary-button" type="button" disabled={!value.trim()} onClick={() => void add()}>Ajouter</button>
      </div>
      {error && <p className="form-error">{error}</p>}
    </div>
  </details>;
}
