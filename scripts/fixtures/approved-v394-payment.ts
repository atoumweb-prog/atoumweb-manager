import {emptyContractParameters} from '../../src/shared/quoteContractPreparation';
import type {QuoteContractAudience} from '../../src/shared/contractTerms';

/** Recipe rules only: no change to existing quotes or application defaults. */
export function approvedSimulationPayment(code:string,audience:QuoteContractAudience){
 const p=emptyContractParameters(audience,100);
 const milestone=(label:string,percent:number,event:string)=>({label,percent,dueDate:null,event});
 let reference='',unresolved=false;
 if(code==='AW-WEB-VITRINE'||code==='AW-MARIAGE-HISTOIRE'){
  reference=code==='AW-WEB-VITRINE'?'OFF-007':'SQ-24';
  p.payment.preset='custom';p.payment.milestones=[milestone('Commande',40,'À la commande'),milestone('Solde',60,code==='AW-WEB-VITRINE'?'Avant mise en ligne':'À convenir explicitement — simulation bloquée')];
  unresolved=code==='AW-MARIAGE-HISTOIRE';
 }else if(code==='AW-ECOM-BASE'||code.startsWith('V39-ECOM-')){
  reference='OFF-007';p.payment.preset='30_40_30';p.payment.milestones=[milestone('Commande',30,'À la commande'),milestone('Validation du design',40,'À validation du design'),milestone('Mise en ligne',30,'Avant mise en ligne')];
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
