import { useEffect,useState } from 'react';
import type { CatalogItemDetail } from '../../shared/commercial';
import type { ContractType } from '../../shared/contractTypes';
import type { ContractClauseTemplate } from '../../shared/contractTerms';

export function CatalogContractPanel({item}:{item:CatalogItemDetail}) {
  const [versionId,setVersionId]=useState(item.currentVersion?.id??item.versions[0]?.id??'');
  const [types,setTypes]=useState<ContractType[]>([]),[selected,setSelected]=useState<string[]>([]),[clauses,setClauses]=useState<ContractClauseTemplate[]>([]),[message,setMessage]=useState('');
  const version=item.versions.find(v=>v.id===versionId),editable=version?.status==='draft';
  useEffect(()=>{let alive=true;Promise.all([window.atoumweb.contractTypes.list(),window.atoumweb.contractTypes.catalog(versionId),window.atoumweb.contractTerms.library.list()]).then(([all,linked,modules])=>{if(!alive)return;setTypes(all);setSelected(linked.map(t=>t.id));setClauses(modules.filter(c=>c.catalogItemIds.includes(item.id)).sort((a,b)=>a.title.localeCompare(b.title,'fr')));}).catch(e=>setMessage(String(e)));return()=>{alive=false;};},[item.id,versionId]);
  return <section className="catalog-detail-section contract-type-detail"><h3>Références contractuelles</h3>
    <label>Version Catalogue<select aria-label="Version Catalogue contractuelle" value={versionId} onChange={e=>setVersionId(e.target.value)}>{item.versions.map(v=><option key={v.id} value={v.id}>v{v.versionNumber} — {v.status==='draft'?'Brouillon':v.status==='published'?'Publiée':'Retirée'}</option>)}</select></label>
    {!editable&&<p>Rattachement versionné. Crée une nouvelle version Catalogue pour le modifier.</p>}
    {types.filter(t=>editable||selected.includes(t.id)).map(t=><div key={t.id} className="contract-module-row"><label><input type="checkbox" disabled={!editable} checked={selected.includes(t.id)} onChange={()=>setSelected(selected.includes(t.id)?selected.filter(x=>x!==t.id):[...selected,t.id])}/>{(t.currentVersion??t.versions[0])?.name} · {t.code}</label><button type="button" className="secondary-button" onClick={()=>window.dispatchEvent(new CustomEvent('atoumweb:open-contract-library',{detail:t.id}))}>Ouvrir le type et ses modules</button></div>)}
    {!types.length&&<p>Aucun type structuré initialisé.</p>}
    {editable&&<button type="button" onClick={()=>void window.atoumweb.contractTypes.setCatalog(versionId,selected).then(()=>setMessage('Rattachement enregistré pour cette version Catalogue.')).catch(e=>setMessage(String(e)))}>Enregistrer les types de cette version</button>}
    <details open><summary>Modules déclenchés par cette prestation ({clauses.length})</summary>{clauses.map(c=><details key={c.id}><summary>{c.title} · {c.code} · {c.currentVersion?`v${c.currentVersion.versionNumber}`:'Brouillon'}</summary><div className="contract-paragraph">{c.currentVersion?.body??c.versions[0]?.body}</div></details>)}</details>
    <button type="button" className="secondary-button" onClick={()=>window.dispatchEvent(new CustomEvent('atoumweb:open-contract-library',{detail:null}))}>Bibliothèque contractuelle</button>
    {version?.contractType&&<p className="contract-legacy">Ancien libellé contract_type (legacy) : {version.contractType}. Ne détermine pas l’assemblage.</p>}
    {message&&<p role="status">{message}</p>}
  </section>;
}
