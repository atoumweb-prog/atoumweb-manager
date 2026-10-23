import {useEffect,useState,type ReactNode} from 'react';
import {requestUnsavedExit} from '../unsaved/unsaved';
export type QuoteJourneyStep='prices'|'terms'|'review';
const labels:Record<QuoteJourneyStep,string>={prices:'Prestations et prix',terms:'Conditions et CGV',review:'Vérifier et sortir'};
function initial(id:string):QuoteJourneyStep{try{const s=sessionStorage.getItem('quote-journey:'+id);return s==='terms'||s==='review'?s:'prices';}catch{return 'prices';}}
export function QuoteJourney({id,prices,terms,review}:{id:string;prices:ReactNode;terms:ReactNode;review:ReactNode}){
 const [step,setStep]=useState<QuoteJourneyStep>(()=>initial(id));
 function go(next:QuoteJourneyStep){if(step===next)return;requestUnsavedExit(()=>{setStep(next);try{sessionStorage.setItem('quote-journey:'+id,next);}catch{}},'quote:'+id);}
 useEffect(()=>{const focus=(e:Event)=>{const d=(e as CustomEvent).detail;if(d?.quoteId!==id)return;setStep('review');try{sessionStorage.setItem('quote-journey:'+id,'review');}catch{}};window.addEventListener('atoumweb:contract-focus',focus);return()=>window.removeEventListener('atoumweb:contract-focus',focus);},[id]);
 return <section className="quote-journey" data-quote-id={id} data-step={step}><nav className="quote-journey-tabs" role="tablist" aria-label="Parcours du devis">{(Object.keys(labels) as QuoteJourneyStep[]).map((s,i)=><button key={s} id={'quote-tab-'+id+s} type="button" role="tab" aria-controls={'quote-pane-'+id+s} aria-selected={step===s} onClick={()=>go(s)}>{i+1}. {labels[s]}</button>)}</nav>{(Object.keys(labels) as QuoteJourneyStep[]).map(s=><div key={s} id={'quote-pane-'+id+s} role="tabpanel" aria-labelledby={'quote-tab-'+id+s} hidden={step!==s}>{s==='prices'?prices:s==='terms'?terms:review}</div>)}<footer className="quote-journey-footer">{step!=='prices'&&<button type="button" className="secondary-button" onClick={()=>go(step==='review'?'terms':'prices')}>← {step==='review'?labels.terms:labels.prices}</button>}{step!=='review'&&<button type="button" className="primary-button" onClick={()=>go(step==='prices'?'terms':'review')}>{step==='prices'?'Continuer vers les CGV':'Vérifier le devis'} →</button>}</footer></section>;
}
