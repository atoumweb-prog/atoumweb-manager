import {useEffect,useState} from 'react';
import type {QuoteDetail} from '../../shared/commercial';
import type {QuoteContractPreparation} from '../../shared/quoteContractPreparation';
import {focusContractField} from './contractFieldNavigation';

export function QuoteFinalizationPanel({quote,onFinalize}:{quote:QuoteDetail;onFinalize:()=>void}){
  const [review,setReview]=useState<QuoteContractPreparation|null>(null),[error,setError]=useState('');
  useEffect(()=>{let active=true,revision=0;setReview(null);setError('');const refresh=()=>{const current=++revision;void window.atoumweb.quotePreparation.get(quote.id).then(r=>{if(active&&current===revision){setReview(r);setError('');}}).catch(e=>{if(active&&current===revision)setError(String(e));});};refresh();window.addEventListener('atoumweb:changed',refresh);return()=>{active=false;window.removeEventListener('atoumweb:changed',refresh);};},[quote.id,quote.updatedAt]);
  const blocking=review?.issues.filter(i=>i.severity==='blocking')??[];
  return <section className="quote-finalization-check" aria-label="Contrôle de finalisation">
    <strong>{error?'Vérification impossible':!review?'Vérification avant finalisation…':blocking.length?`Finalisation impossible — ${blocking.length} élément${blocking.length>1?'s':''} à compléter`:'Les informations enregistrées permettent la finalisation technique'}</strong>
    <p>Les contrôles portent sur les valeurs enregistrées. Enregistre ta préparation pour actualiser cette liste.</p>
    {error&&<p role="alert">{error}</p>}
    {blocking.length>0&&<ul>{blocking.map((i,index)=><li key={i.code+index}><button type="button" className="contract-issue-link" data-issue-code={i.code} onClick={()=>focusContractField(quote.id,i.code)}>{i.message} →</button></li>)}</ul>}
    <button type="button" className="primary-button" disabled={!review||!!error||blocking.length>0} onClick={onFinalize}>Finaliser le devis</button>
  </section>;
}
