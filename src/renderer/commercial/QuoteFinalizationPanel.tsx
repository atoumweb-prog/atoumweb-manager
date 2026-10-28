import {useEffect,useState} from 'react';
import type {QuoteDetail} from '../../shared/commercial';
import type {QuoteContractPreparation} from '../../shared/quoteContractPreparation';
import {focusContractField} from './contractFieldNavigation';

export function QuoteFinalizationPanel({quote,onFinalize}:{quote:QuoteDetail;onFinalize:(canonicalReview?:boolean)=>void}){
  const [review,setReview]=useState<QuoteContractPreparation|null>(null),[error,setError]=useState(''),[lineIssues,setLineIssues]=useState<string[]>([]);
  useEffect(()=>{let active=true,revision=0;setReview(null);setError('');const refresh=()=>{const current=++revision;void Promise.all([window.atoumweb.quotePreparation.get(quote.id),window.atoumweb.quotes.preparationIssues(quote.id)]).then(([r,issues])=>{if(active&&current===revision){setReview(r);setLineIssues(issues);setError('');}}).catch(e=>{if(active&&current===revision)setError(String(e));});};refresh();window.addEventListener('atoumweb:changed',refresh);return()=>{active=false;window.removeEventListener('atoumweb:changed',refresh);};},[quote.id,quote.updatedAt]);
  const blocking=[...(review?.issues.filter(i=>i.severity==='blocking')??[]),...lineIssues.map((message,index)=>({code:'LINE_'+index,message}))];
  return <section className="quote-finalization-check" aria-label="Contrôle de finalisation">
    <strong>{error?'Vérification impossible':!review?'Vérification avant finalisation…':blocking.length?`Finalisation impossible — ${blocking.length} élément${blocking.length>1?'s':''} à compléter`:'Les informations enregistrées permettent la finalisation technique'}</strong>
    <p>Les contrôles portent sur les valeurs enregistrées. Enregistre ta préparation pour actualiser cette liste.</p>
    {error&&<p role="alert">{error}</p>}
    {blocking.length>0&&<ul>{blocking.map((i,index)=><li key={i.code+index}><button type="button" className="contract-issue-link" data-issue-code={i.code} onClick={()=>i.code.startsWith('LINE_')?window.dispatchEvent(new CustomEvent('atoumweb:quote-lines',{detail:{quoteId:quote.id}})):focusContractField(quote.id,i.code)}>{i.message} →</button></li>)}</ul>}
    <button type="button" className="primary-button" disabled={!review||!!error||blocking.length>0} onClick={()=>onFinalize(false)}>Finaliser le devis</button>
    <details><summary>Contrôle du classement des clauses</summary><button type="button" className="secondary-button" disabled={!review||!!error||blocking.length>0} onClick={()=>onFinalize(true)}>Finaliser avec le classement approuvé</button><p className="muted">Option destinée aux bibliothèques disposant d’un classement approuvé.</p></details>
  </section>;
}
