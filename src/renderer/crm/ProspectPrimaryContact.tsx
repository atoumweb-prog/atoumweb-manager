import {useEffect,useState} from 'react';
import type {Contact,ProspectSummary} from '../../shared/crm';
import {useUnsavedDraft} from '../unsaved/unsaved';
export function ProspectPrimaryContact({prospect,onSaved}:{prospect:ProspectSummary;onSaved:()=>void}){
 const [contacts,setContacts]=useState<Contact[]>([]),[id,setId]=useState(prospect.contactId??''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const guard=useUnsavedDraft('Interlocuteur principal',{id},{pending:busy,discard:s=>setId(s.id)});
 useEffect(()=>{let active=true;const load=()=>void window.atoumweb.workflow.identity('prospect',prospect.id).then(i=>{if(active)setContacts(i.contacts);}).catch(e=>setError(String(e)));load();window.addEventListener('atoumweb:changed',load);return()=>{active=false;window.removeEventListener('atoumweb:changed',load);};},[prospect.id]);
 useEffect(()=>{if(!guard.dirty){setId(prospect.contactId??'');guard.initial({id:prospect.contactId??''});}},[prospect.contactId]);
 async function save(){setBusy(true);setError('');try{await window.atoumweb.crm.prospects.patchIfUnchanged(prospect.id,{contactId:prospect.contactId??null,...(prospect.decisionStatus==='yes'?{decisionMakerContactId:prospect.decisionMakerContactId??null}:{})},{contactId:id,...(prospect.decisionStatus==='yes'?{decisionMakerContactId:id}:{})});guard.saved();onSaved();window.dispatchEvent(new Event('atoumweb:changed'));}catch(e){setError(String(e));}finally{setBusy(false);}}
 return <section className="panel"><label>Interlocuteur principal<select aria-label="Choisir l’interlocuteur principal" value={id} disabled={busy} onChange={e=>setId(e.target.value)}><option value="">Choisir une personne associée</option>{contacts.map(c=><option key={c.id} value={c.id}>{c.firstName} {c.lastName}{c.jobTitle?' · '+c.jobTitle:''}</option>)}</select></label><button type="button" className="secondary-button" disabled={busy||!id||id===prospect.contactId} onClick={()=>void save()}>Choisir cet interlocuteur principal</button><p>Une nouvelle personne peut être ajoutée dans « Ajouter un contact » ci-dessous, puis choisie ici.</p>{error&&<p role="alert">{error}</p>}</section>;
}
