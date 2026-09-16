import { useMemo, useState } from 'react';
import type { Contact } from '../../shared/crm';
import { validateEmail, validatePhone } from '../../shared/contactValidation';

function cleanError(error: unknown): string {
  if (!(error instanceof Error)) return 'Une erreur est survenue.';
  return error.message
    .replace(/^Error invoking remote method ['\"][^'\"]+['\"]:\s*/i, '')
    .replace(/^Error:\s*/i, '')
    .trim();
}

export function ProspectLinkedContactsPanel({
  organizationId,
  contacts,
  primaryContactId,
  decisionMakerContactId,
  onChanged,
}: {
  organizationId?: string | null;
  contacts: Contact[];
  primaryContactId?: string | null;
  decisionMakerContactId?: string | null;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const emailValidation = validateEmail(email);
  const phoneValidation = validatePhone(phone);

  const otherContacts = useMemo(() => contacts.filter((contact) =>
    contact.id !== primaryContactId && contact.id !== decisionMakerContactId,
  ), [contacts, primaryContactId, decisionMakerContactId]);

  async function createContact() {
    if (!organizationId) { setError('Une entreprise est nécessaire pour rattacher un autre contact.'); return; }
    if (!firstName.trim() || !lastName.trim()) { setError('Renseigne le prénom et le nom du contact.'); return; }
    if (!emailValidation.valid || !phoneValidation.valid) return;
    setBusy(true); setError('');
    try {
      const created = await window.atoumweb.crm.contacts.create({
        organizationId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        jobTitle: role.trim() || null,
        email: null,
        phone: null,
      });
      if (email.trim()) await window.atoumweb.crm.contactMethods.save({ contactId: created.id, type: 'email', value: email.trim(), label: 'Professionnel', isPrimary: true });
      if (phone.trim()) await window.atoumweb.crm.contactMethods.save({ contactId: created.id, type: 'phone', value: phone.trim(), label: 'Portable', isPrimary: true });
      setFirstName(''); setLastName(''); setRole(''); setEmail(''); setPhone(''); setOpen(false);
      onChanged();
      window.dispatchEvent(new Event('atoumweb:changed'));
    } catch (e) { setError(cleanError(e)); }
    finally { setBusy(false); }
  }

  if (!organizationId) return null;
  return <div className="linked-contacts-panel">
    <div className="work-section-heading">
      <div><span className="eyebrow">Autres contacts liés</span><strong>{otherContacts.length} contact{otherContacts.length > 1 ? 's' : ''}</strong></div>
      <button className="secondary-button compact-button" type="button" onClick={() => setOpen((value) => !value)}>{open ? 'Fermer' : '+ Contact'}</button>
    </div>
    {open && <div className="inline-editor linked-contact-editor">
      <strong>Ajouter un contact de l’entreprise</strong>
      <div className="action-editor-grid">
        <label>Prénom<input value={firstName} onChange={(e) => setFirstName(e.target.value)} /></label>
        <label>Nom<input value={lastName} onChange={(e) => setLastName(e.target.value)} /></label>
        <label className="span-2">Fonction / rôle <small>(champ libre)</small><input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Gérant, patron, banquier, comptable…" /></label>
        <label className="span-2">Téléphone<input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="06 12 34 56 78" />{phone.trim() && !phoneValidation.valid && <small className="field-error">{phoneValidation.message}</small>}</label>
        <label className="span-2">Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nom@exemple.fr" />{email.trim() && !emailValidation.valid && <small className="field-error">{emailValidation.message}</small>}</label>
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="inline-editor-actions"><button className="secondary-button" type="button" onClick={() => setOpen(false)}>Annuler</button><button className="primary-button" type="button" disabled={busy || !emailValidation.valid || !phoneValidation.valid} onClick={() => void createContact()}>{busy ? 'Ajout…' : 'Ajouter le contact'}</button></div>
    </div>}
    {otherContacts.length > 0 && <div className="linked-contact-list">{otherContacts.map((contact) => <div className="linked-contact-row" key={contact.id}><div><strong>{contact.firstName} {contact.lastName}</strong><small>{contact.jobTitle || 'Fonction à préciser'}</small></div><span className="status-pill">Contact lié</span></div>)}</div>}
    {otherContacts.length === 0 && !open && <p className="muted">Aucun autre contact lié pour le moment.</p>}
  </div>;
}
