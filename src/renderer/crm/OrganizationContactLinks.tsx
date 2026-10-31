import {useEffect,useState} from 'react';
import type {DirectoryOrganization,OrganizationContactLink} from '../../shared/crm';
import {useUnsavedDraft} from '../unsaved/unsaved';

export function OrganizationContactLinks({contactId,onChanged}:{contactId:string;onChanged:()=>void}){
 const [links,setLinks]=useState<OrganizationContactLink[]>([]),[organizations,setOrganizations]=useState<DirectoryOrganization[]>([]);
 const [organizationId,setOrganizationId]=useState(''),[jobTitle,setJobTitle]=useState(''),[editing,setEditing]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const guard=useUnsavedDraft('Association entreprise et fonction',{organizationId,jobTitle},{pending:busy,discard:s=>{setOrganizationId(s.organizationId);setJobTitle(s.jobTitle);}});
 useEffect(()=>{let active=true;Promise.all([window.atoumweb.crm.organizationContacts.list(contactId),window.atoumweb.crm.organizations.list()]).then(([l,o])=>{if(active){setLinks(l);setOrganizations(o);}}).catch(e=>{if(active)setError(String(e));});return()=>{active=false;};},[contactId]);
 async function save(archive=false){
  if(!organizationId||busy)return;setBusy(true);setError('');
  const current=links.find(l=>l.organizationId===organizationId);
  try{const updated=await window.atoumweb.crm.organizationContacts.save(organizationId,contactId,current?{jobTitle:current.jobTitle,archivedAt:current.archivedAt}:null,{jobTitle:jobTitle.trim()||null,archivedAt:archive?new Date().toISOString():null});setLinks(updated);guard.saved({organizationId:'',jobTitle:''});setOrganizationId('');setJobTitle('');setEditing(false);onChanged();window.dispatchEvent(new Event('atoumweb:changed'));}catch(e){setError(String(e));}finally{setBusy(false);}
 }
 return <section className="panel"><h3>Entreprises et fonctions</h3>{links.map(l=><div className="work-section-heading" key={l.organizationId}><span><strong>{l.organizationName}</strong> · {l.jobTitle||'Fonction non renseignée'}{l.archivedAt?' · Association archivée':''}</span><button type="button" className="secondary-button compact-button" disabled={busy} onClick={()=>{if(!guard.request(()=>{}))return;setOrganizationId(l.organizationId);setJobTitle(l.jobTitle||'');guard.initial({organizationId:l.organizationId,jobTitle:l.jobTitle||''});setEditing(true);}}>Modifier l’association</button></div>)}
 {!editing&&<button type="button" className="secondary-button" onClick={()=>setEditing(true)}>Associer une entreprise</button>}
 {editing&&<div className="form-grid"><label>Entreprise<select disabled={busy} value={organizationId} onChange={e=>{setOrganizationId(e.target.value);setJobTitle(links.find(l=>l.organizationId===e.target.value)?.jobTitle||'');}}><option value="">Choisir une entreprise</option>{organizations.map(o=><option value={o.id} key={o.id}>{o.name}</option>)}</select></label><label>Fonction principale dans cette entreprise<input disabled={busy} value={jobTitle} onChange={e=>setJobTitle(e.target.value)}/></label><div className="form-actions"><button type="button" disabled={busy||!organizationId} className="primary-button" onClick={()=>void save()}>Enregistrer l’association</button>{links.some(l=>l.organizationId===organizationId&&!l.archivedAt)&&<button type="button" className="secondary-button" disabled={busy} onClick={()=>{if(window.confirm('Archiver cette association ? La personne et son historique seront conservés.'))void save(true);}}>Archiver l’association</button>}<button type="button" className="secondary-button" disabled={busy} onClick={()=>guard.request(()=>{setEditing(false);setOrganizationId('');setJobTitle('');guard.saved({organizationId:'',jobTitle:''});})}>Annuler</button></div></div>}{error&&<p role="alert" className="form-error">{error}</p>}
 </section>;
}
