import {emptyContractParameters} from '../../src/shared/quoteContractPreparation';
import type {QuoteContractAudience} from '../../src/shared/contractTerms';
import {approvedPaymentPlanForCode} from '../../src/shared/approvedPaymentPlans';

/** Recipe rules only: no change to existing quotes or application defaults. */
export function approvedSimulationPayment(code:string,audience:QuoteContractAudience){
 const p=emptyContractParameters(audience,100);
 const milestone=(label:string,percent:number,event:string)=>({label,percent,dueDate:null,event});
 let reference='',unresolved=false;
 const approved=approvedPaymentPlanForCode(code);
 if(approved){
  // OFF-007 : même source que l'assistant de devis (src/shared/approvedPaymentPlans.ts).
  reference=approved.reference;p.payment.preset=approved.preset;p.payment.milestones=approved.milestones;
 }else if(code==='AW-MARIAGE-HISTOIRE'){
  reference='SQ-24';
  p.payment.preset='custom';p.payment.milestones=[milestone('Commande',40,'À la commande'),milestone('Solde',60,'À convenir explicitement — simulation bloquée')];
  unresolved=true;
 }else if(code==='V39-NL-PONCT-SIMPLE'){
  reference='SQ-24';p.payment.milestones=[milestone('Commande',100,'À la commande')];
 }else{
  // One period billed in full is not a fictional order deposit. Unknown dates remain blocked.
  reference=code.startsWith('AW-MAINT-')?'CL-05 / PAY-001':code==='V39-STAT-ESS-M'?'CL-06 / SQ-42 / PAY-001':'CL-01';
  p.payment.preset='custom';
  const event=code.startsWith('AW-MAINT-')?'Échéance de la période de maintenance à convenir — simulation bloquée':code==='V39-STAT-ESS-M'?'Prise en charge effective, accès opérationnels confirmés par écrit — date à convenir': 'Date anniversaire annuelle, sans encaissement définitif anticipé — prise d’effet à convenir';
  p.payment.milestones=[milestone('Paiement de la période (aucun acompte à la commande simulé)',100,event)];unresolved=true;
 }
 return {parameters:p,reference,unresolved};
}
