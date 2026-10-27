import type {ProspectSummary} from './crm';
import {parseProspectInformation} from './prospectInformation';
export interface ProspectMissing {key:string;label:string;tab:'contacts'|'qualification'|'brief'|'commercial'|'services';}
export function qualificationMissing(p:ProspectSummary):ProspectMissing[]{
 const m:ProspectMissing[]=[];const add=(key:string,label:string,ok:unknown,tab:ProspectMissing['tab']='qualification')=>{if(!ok)m.push({key,label,tab});};
 add('decision','Situation du décisionnaire',p.decisionStatus&&(p.decisionStatus!=='no'||p.decisionMakerContactId||p.decisionMakerDetails),'contacts');
 const outbound=p.originType==='outbound'||(!p.originType&&p.source==='outbound');
 if(outbound){add('target','Motif de ciblage',p.targetingReasonCode||p.targetingReasonText);add('observation','Constat ou opportunité',p.initialObservation||p.detectedOpportunity);add('contact_result','Résultat du premier contact',p.firstContactResultCode||p.firstContactResultText);add('interest','Intérêt confirmé',['interested','very_interested'].includes(p.interestLevel??''));}
 else add('request','Demande initiale ou contexte',p.initialRequest||p.projectSummary||p.projectContext,'brief');
 return m;
}
export function beforeQuoteMissing(p:ProspectSummary,hasNeeds:boolean):ProspectMissing[]{
 const m:ProspectMissing[]=[];if(!hasNeeds)m.push({key:'services',label:'Prestation envisagée',tab:'services'});
 if(!p.projectSummary?.trim())m.push({key:'summary',label:'Besoin confirmé',tab:'brief'});
 if(!p.budgetStatus)m.push({key:'budget',label:'Budget ou « Non communiqué »',tab:'commercial'});
 if(!p.timelineStatus)m.push({key:'timeline',label:'Calendrier ou « Non communiqué »',tab:'commercial'});
 if(!p.decisionStatus||(p.decisionStatus==='no'&&!p.decisionMakerContactId&&!p.decisionMakerDetails))m.push({key:'decision',label:'Situation du décisionnaire',tab:'contacts'});
 for(const item of parseProspectInformation(p.missingInformation).filter(i=>i.status==='open'&&i.isBlocking))m.push({key:item.id,label:'Obtenir : '+item.label,tab:'services'});
 return m;
}
