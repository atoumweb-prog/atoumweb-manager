import { useEffect, useState } from 'react';
import type { QuoteDetail } from '../../shared/commercial';
import type { OperationalSalePolicy } from '../../shared/commercialRules';
import {useUnsavedDraft} from '../unsaved/unsaved';

const LABELS:Record<string,string>={hour_pack:'Crédit de temps',maintenance:'Maintenance',recurring:'Suivi périodique',recurring_addon:'Établissement supplémentaire du suivi principal',hosting:'Hébergement',intervention:'Intervention'};
export function QuoteOperationalSalesPanel({quote}:{quote:QuoteDetail}) {
  const [sales,setSales]=useState<Record<string,unknown>[]>([]),[projects,setProjects]=useState<Array<{id:string;name:string}>>([]),[error,setError]=useState('');
  async function refresh(){setSales(await window.atoumweb.quotes.operationalSales(quote.id));}
  useEffect(()=>{void refresh().catch(e=>setError(String(e)));void window.atoumweb.projects.projects.list({clientAccountId:quote.acceptedClientAccountId||quote.clientAccountId}).then(setProjects).catch(e=>setError(String(e)));},[quote.id]);
  if(quote.status!=='accepted'||!sales.length)return null;
  return <section className="panel"><h3>Services issus du devis accepté</h3><p>Le crédit, la période ou l’intervention renvoie à cette ligne vendue. Choisissez les destinations nécessaires avant exécution ; aucun Site n’est créé automatiquement.</p>{sales.map(sale=><SaleTarget key={String(sale.id)} sale={sale} projects={projects} onSave={refresh}/>)}{error&&<p className="form-error">{error}</p>}</section>;
}
function SaleTarget({sale,projects,onSave}:{sale:Record<string,unknown>;projects:Array<{id:string;name:string}>;onSave:()=>Promise<void>}){
  const policy=JSON.parse(String(sale.policy_snapshot_json)) as OperationalSalePolicy;
  const [projectId,setProjectId]=useState(String(sale.target_project_id||sale.project_id||'')),[siteId,setSiteId]=useState(String(sale.target_site_id||'')),[contextId,setContextId]=useState(String(sale.target_context_node_id||'')),[author,setAuthor]=useState(''),[error,setError]=useState('');
  const [sites,setSites]=useState<Array<{id:string;name:string}>>([]),[contexts,setContexts]=useState<Array<{id:string;name:string}>>([]),[saving,setSaving]=useState(false);
  const guard=useUnsavedDraft('Destination opérationnelle du devis',{projectId,siteId,contextId,author},{pending:saving,discard:value=>{setProjectId(value.projectId);setSiteId(value.siteId);setContextId(value.contextId);setAuthor(value.author);}});
  useEffect(()=>{if(projectId){void window.atoumweb.projects.sites.list(projectId).then(setSites).catch(e=>setError(String(e)));void window.atoumweb.projects.projects.get(projectId).then(p=>setContexts(p.nodes)).catch(e=>setError(String(e)));}},[projectId]);
  async function assign(){setSaving(true);setError('');try{await window.atoumweb.quotes.assignOperationalTarget(String(sale.id),{projectId,siteId:siteId||null,contextNodeId:contextId||null,author});await onSave();guard.saved();}catch(e){setError(String(e));}finally{setSaving(false);}}
  return <article className="quote-line-block"><strong>{String(sale.canonical_code)} — {String(sale.label)}</strong><p>{LABELS[String(sale.kind)]} · {policy.billingPeriod==='yearly'?'Facturation annuelle':policy.billingPeriod==='monthly'?'Facturation mensuelle':'Ponctuel'} · {policy.cadence==='monthly'?'Cycles mensuels':policy.cadence==='yearly'?'Cycle annuel':'Une prestation'}</p>
    {policy.creditMinutes&&<p>Crédit : {policy.creditMinutes} min / unité · validité {policy.validityMonths} mois. Le solde et les mouvements sont consultables dans Packs d’heures.</p>}
    {policy.minorInterventions&&<p>{policy.minorInterventions} interventions mineures / mois, {policy.maximumMinorMinutes} min maximum par intervention. Mises à jour hors quota, aucun report.</p>}
    {policy.targetRequirement&&policy.targetRequirement!=='none'&&<details open={sale.target_state!=='active'}><summary>Destination {sale.target_state==='active'?'définie':'à choisir'}</summary><label>Projet<select disabled={!!sale.project_id} value={projectId} onChange={e=>{setProjectId(e.target.value);setSiteId('');setContextId('');}}><option value="">À choisir</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      {policy.targetRequirement==='site'?<label>Site<select value={siteId} onChange={e=>setSiteId(e.target.value)}><option value="">À choisir</option>{sites.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>:<label>Élément concerné<select value={contextId} onChange={e=>setContextId(e.target.value)}><option value="">À choisir</option>{contexts.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>}
      <label>Auteur du choix<input value={author} onChange={e=>setAuthor(e.target.value)}/></label><button type="button" className="secondary-button" onClick={()=>void assign()}>Enregistrer la destination</button><p>Une cible utilisée ne peut plus être réaffectée silencieusement.</p></details>}
    <button type="button" className="secondary-button" onClick={()=>window.dispatchEvent(new CustomEvent('atoumweb:open-page',{detail:'Interventions & Maintenance'}))}>Ouvrir les opérations</button>{error&&<p role="alert" className="form-error">{error}</p>}
  </article>;
}
