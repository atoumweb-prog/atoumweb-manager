import {useEffect,useState} from 'react';
import type {Contact,ContactMethod} from '../../shared/crm';
import {ProspectValue} from './ProspectValue';
import {ContactNameEditor} from './ContactNameEditor';
import {ContactMethodsPanel} from './ContactMethodsPanel';
export function ContactSummaryCard({contact,role,onChanged}:{contact:Contact;role:string;onChanged:()=>void}){
 const [methods,setMethods]=useState<ContactMethod[]>([]),[editing,setEditing]=useState(false),[error,setError]=useState('');
 useEffect(()=>{let active=true;const load=()=>void window.atoumweb.crm.contactMethods.list('contact',contact.id).then(m=>{if(active)setMethods(m);}).catch(e=>setError(String(e)));load();window.addEventListener('atoumweb:changed',load);return()=>{active=false;window.removeEventListener('atoumweb:changed',load);};},[contact.id]);
 const phone=methods.find(m=>m.type==='phone'&&m.isPrimary)||methods.find(m=>m.type==='phone'),email=methods.find(m=>m.type==='email'&&m.isPrimary)||methods.find(m=>m.type==='email');
 return <article className="crm-contact-card"><header><div><strong>{contact.firstName} {contact.lastName}</strong><p>{contact.jobTitle||'Fonction à renseigner'}</p></div><span className="status-pill">{role}</span></header><div className="crm-contact-coordinates"><div><small>Téléphone{phone?.isPrimary?' préféré':''}</small>{phone?<ProspectValue value={phone.value} kind="phone"/>:<span className="muted">À renseigner</span>}</div><div><small>Email{email?.isPrimary?' préféré':''}</small>{email?<ProspectValue value={email.value} kind="email"/>:<span className="muted">À renseigner</span>}</div></div><button type="button" className="secondary-button" onClick={()=>setEditing(true)}>Modifier ce contact</button><ContactMethodsPanel contactId={contact.id} contactLabel={contact.firstName+' '+contact.lastName} allowOrganization={false}/>{editing&&<ContactNameEditor id={contact.id} organizationId={contact.organizationId} onClose={()=>{setEditing(false);onChanged();}}/>}{error&&<p role="alert">{error}</p>}</article>;
}
