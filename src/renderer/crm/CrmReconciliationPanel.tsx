import {useEffect,useState} from 'react';
import type {CrmReconciliation} from '../../shared/crm';
const labels:Record<string,string>={conflict:'Valeurs différentes : choix nécessaire',archived:'Ancienne valeur déjà archivée',invalid:'Format à vérifier',review_existing_actions:'Programme existant conservé',review_past_or_incomplete:'Ancien rappel à vérifier',imported:'Reprise effectuée avec provenance',already_shared:'Déjà partagé'};
export function CrmReconciliationPanel({owner,id}:{owner:string;id:string}){
 const [rows,setRows]=useState<CrmReconciliation[]>([]),[error,setError]=useState('');
 useEffect(()=>{let active=true;window.atoumweb.crm.directory.reconciliation(owner,id).then(r=>{if(active)setRows(r);}).catch(e=>{if(active)setError(String(e));});return()=>{active=false;};},[owner,id]);
 if(!rows.length&&!error)return null;
 return <details className="panel"><summary>Reprise des anciennes informations · {rows.length}</summary><p>Les valeurs d’origine sont conservées ci-dessous. Corrige les coordonnées dans leur éditeur et les rappels dans Actions.</p>{rows.map(r=><div key={r.id}><strong>{r.field==='next_action'?'Ancien rappel':r.field==='email'?'Ancien email':'Ancien téléphone'}</strong><p>{r.legacyValue}</p><small>{labels[r.disposition]||'À vérifier'}</small></div>)}{error&&<p role="alert">{error}</p>}</details>;
}
