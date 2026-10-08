import type { ContractAdministration, QuoteContractParameters } from './quoteContractPreparation';
import type { QuoteContractClause } from './contractTerms';
import type { ContractTypeReference } from './contractTypes';
import type { QuoteDetail } from './commercial';

export interface ContractSection { id: string; title: string; text: string }
export interface ContractPresentation {
  schemaVersion: 1; state: 'draft' | 'frozen' | 'historical_missing'; compiledAt: string | null;
  sections: ContractSection[]; text: string; types: ContractTypeReference[];
  template?: { referenceName:string; referenceCode:string|null; catalogueVersion:number; audience:'professional'|'consumer'; inclusions?:string[]; exclusions?:string[] };
  modules: { code: string; title: string; version: number | null; source: string }[];
}
export interface ContractPresentationInput {
  template?: ContractPresentation['template'];
  state: ContractPresentation['state']; number: string; subject: string; totalCents: number;
  estimatedDelay: string | null; prerequisites: string | null; compiledAt: string | null;
  clauseText: string; clauses: QuoteContractClause[]; parameters: QuoteContractParameters | null;
  administration: ContractAdministration | null; types: ContractTypeReference[];
  modules: ContractPresentation['modules']; lineDetails?: string[]; warrantyLabels?: Record<string,string>; clauseGroupLabels?:Record<string,string>;
}
const money=(c:number)=>`${(c/100).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})} €`;
const value=(s?:string|null)=>s?.trim()||'À renseigner';

/** Pure presentation of one existing contract source. No clause selection, placeholder substitution or mutation. */
export function formatContractPresentation(i:ContractPresentationInput):ContractPresentation {
  const sections:ContractSection[]=[];
  const add=(id:string,title:string,lines:string[])=>sections.push({id,title,text:lines.filter(Boolean).join('\n')});
  if(i.state==='historical_missing')return {schemaVersion:1,state:i.state,compiledAt:i.compiledAt,sections:[{id:'historical',title:'Contrat historique',text:'Absence historique de snapshot contractuel. Aucun contrat reconstruit depuis la bibliothèque actuelle.'}],text:'',types:[],modules:[]};
  // An explicitly empty frozen contract is never expanded with today's defaults.
  if(i.state==='frozen'&&!i.clauseText&&!i.clauses.length&&!i.parameters)return {schemaVersion:1,state:i.state,compiledAt:i.compiledAt,sections:[],text:'',types:[],modules:[]};
  if(i.template)add('identity','Aperçu de contrat type',[`Référence : ${i.template.referenceName} · ${i.template.referenceCode??'Catalogue'} · v${i.template.catalogueVersion}`,`Client contractuel : ${i.template.audience==='professional'?'Professionnel':'Particulier / consommateur'}`,'Consultation des textes courants, sans client, montant convenu ni devis créé.']);
  else add('identity','Informations du devis',[`${i.number} — ${i.subject}`,`Montant convenu : ${money(i.totalCents)}`,i.estimatedDelay?`Délai indiqué au devis : ${i.estimatedDelay}`:'',i.prerequisites?`Prérequis : ${i.prerequisites}`:'']);
  if(i.template?.inclusions?.length)add('reference-scope','Périmètre de référence du Catalogue — à personnaliser au devis',i.template.inclusions);
  if(i.template?.exclusions?.length)add('reference-exclusions','Exclusions de la référence Catalogue',i.template.exclusions);
  if(i.administration){
    const labels:Record<keyof ContractAdministration,string>={identity:'Identité AtoumWeb',administrative:'Mentions administratives',vat:'TVA',complaints:'Réclamations',mediator:'Médiateur',withdrawalRecipient:'Rétractation',providers:'Prestataires',gdpr:'Données personnelles'};
    add('administration','Informations AtoumWeb',Object.entries(i.administration).map(([key,v])=>`${labels[key as keyof ContractAdministration]} : ${v.state==='not_applicable'?'Non applicable':value(v.value)}${v.reason?` — ${v.reason}`:''}`));
  }
  const enabled=i.clauses.filter(c=>c.enabled);
  if(enabled.length){
    for(const [kind,title] of [['base','Conditions générales — CGV communes'],['catalog','Conditions spécifiques — Modules des prestations vendues'],['custom','Conditions particulières']] as const){
      const items=enabled.filter(c=>c.sourceKind===kind);
      if(items.length){
        const groups=new Map<string,QuoteContractClause[]>();
        for(const c of items){const group=kind==='catalog'?i.clauseGroupLabels?.[c.id]??'Prestations du devis':'';groups.set(group,[...(groups.get(group)??[]),c]);}
        add(kind,title,[...groups].map(([group,clauses])=>[group?group.toUpperCase():'',...clauses.map(c=>`${enabled.indexOf(c)+1}. ${c.title}\n\n${c.body}`)].filter(Boolean).join('\n\n')));
      }
    }
  }else if(i.clauseText)add('clauses','Clauses contractuelles conservées',[i.clauseText]);
  const p=i.parameters;
  if(p){
    const lines=[`Client contractuel : ${p.audience==='consumer'?'Particulier / consommateur':'Professionnel'}`,`Paiement initial : ${p.initialPayment.qualification==='arrhes'?'Arrhes':'Acompte'}${p.initialPayment.dueDate?` — ${p.initialPayment.dueDate}`:''}`];
    let used=0;p.payment.milestones.forEach((m,index)=>{const cents=index===p.payment.milestones.length-1?i.totalCents-used:Math.round(i.totalCents*m.percent/100);used+=cents;lines.push(`${m.label} : ${m.percent} % — ${money(cents)} — ${value(m.dueDate||m.event)}`);});
    if(p.payment.professionalTerms)lines.push(`Délai particulier B2B : ${p.payment.professionalTerms.extraDelay||'Aucun délai supplémentaire convenu'}`,`Taux B2B retenu : ${p.payment.professionalTerms.lateRate==='three_times_legal'?'trois fois le taux d’intérêt légal':'À qualifier'}. Indemnité forfaitaire prévue : ${money(p.payment.professionalTerms.recoveryIndemnityCents)} ; conditions d’application prévues par les clauses.`);
    lines.push(`Qualification prévue : ${p.digital.kinds.map(k=>({digital_content:'Contenu numérique',digital_service:'Service numérique',classical_service:'Prestation classique'}[k])).join(' / ')||'À qualifier'}${p.digital.mixed?' — prestation mixte':''}`,`Fourniture : ${p.digital.supply==='continuous'?'Continue':p.digital.supply==='one_off'?'Ponctuelle':'À qualifier'}`);
    lines.push(...p.milestones.map(m=>`Exécution — ${m.label} : ${value(m.date||m.event)}`));
    lines.push(`Conclusion : ${{distance:'À distance',off_premises:'Hors établissement',on_premises:'En établissement',other:p.conclusion.otherChannelReason}[p.conclusion.channel??'other']||'À qualifier'} — ${value(p.conclusion.context)}`,`Finalité : ${value(p.conclusion.purchasePurpose)}`,`Prestation / qualification : ${value(p.digital.qualificationReason)}`,`Livraison : ${value(p.digital.delivery)}`,p.digital.associatedServices?`Services associés : ${p.digital.associatedServices}`:'','Validation explicite uniquement : le silence ne vaut pas acceptation.');
    lines.push(...p.warranties.filter(w=>w.days!==null).map(w=>`Garantie corrective — ${i.warrantyLabels?.[w.lineId]??'Prestation du devis'} : ${w.days} jours à compter de ${value(w.startEvent)}. Sans limitation des garanties légales applicables.`));
    if(p.rights.applicable)lines.push(`Droits transmis : ${value(p.rights.uses)}`,`Durée / territoire des droits : ${value(p.rights.duration)} / ${value(p.rights.territory)}`,`Sources : ${value(p.rights.sourceDelivery)}`,`Exclusivité : ${p.rights.exclusivity||'Aucune exclusivité particulière'}`);
    if(p.renewal.applicable)lines.push(`Renouvellement : ${p.renewal.mode==='express'?'Exprès':'Mensuel sans engagement'} — ${value(p.renewal.period)}`,`Préavis : ${value(p.renewal.notice)}`,`Fin de service : ${value(p.renewal.termination)}`,`Restitution : ${value(p.renewal.restitution)}`);
    if(p.audience==='consumer'||p.conclusion.channel==='off_premises')lines.push(`Rétractation : ${{applicable:'Applicable',not_applicable:'Non applicable après vérification',unknown:'À déterminer'}[p.consumer.withdrawal]}${p.consumer.exceptionReason?` — ${p.consumer.exceptionReason}`:''}`,`Commencement anticipé demandé : ${p.consumer.earlyStartRequested?'Oui — justificatifs distincts à conserver':'Non'}`);
    if(p.rsvp.applicable)lines.push('RSVP minimal ; aucune collecte sensible activée.',p.rsvp.sensitiveRoute==='direct_caterer'?'Besoins particuliers : transmission directe au traiteur.':'',`Fonctionnement / rôles RGPD : ${value(p.rsvp.roles)}`);
    lines.push(...p.annexes.map(a=>`Annexe ${a.role} : ${a.required?'requise':'complémentaire'} — ${a.documentId?'rattachée':'à joindre'}`));
    add('parameters','Paramètres contractuels du devis',lines);
  }
  if(i.template&&!p)add('parameters','Paramètres à compléter dans le devis',['Identité du client, périmètre personnalisé, montant, échéancier, délais, droits et annexes seront renseignés dans le devis.','Cet aperçu n’est ni un devis finalisé ni un snapshot contractuel signé.']);
  if(i.lineDetails?.length)add('sold-details','Périmètre vendu',i.lineDetails.map(d=>d+'\n'));
  if(i.types.length)add('types','Types et versions utilisés',i.types.map(t=>`${t.name} · ${t.code} · v${t.versionNumber}`));
  const text=sections.map(s=>`${s.title.toUpperCase()}\n\n${s.text}`).join('\n\n');
  return {schemaVersion:1,state:i.state,compiledAt:i.compiledAt,sections,text,types:i.types,modules:i.modules,...(i.template?{template:i.template}:{})};
}
export function contractCopy(kind:'abby'|'contract'|'all',p:ContractPresentation,commercial:string):string {
  return kind==='all'?[commercial,p.text].filter(Boolean).join('\n\n---\n\n'):p.text;
}
const escape=(v:string)=>v.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
export function contractPresentationHtml(p:ContractPresentation):string {
  return p.sections.map(s=>`<section class="contract-section"><h2>${escape(s.title)}</h2><div style="white-space:pre-wrap">${escape(s.text).replace(/\n/g,'<br />')}</div></section>`).join('');
}

/** Legacy PDF callers also read the saved source, never current library/configuration. */
export function contractPresentationFromSnapshot(quote:QuoteDetail):ContractPresentation|null {
  if(!quote.contractSnapshotJson)return null;
  const snapshot=JSON.parse(quote.contractSnapshotJson) as Record<string,unknown>;
  if(snapshot.presentation)return snapshot.presentation as ContractPresentation;
  return formatContractPresentation({state:'frozen',number:quote.number,subject:quote.subject,totalCents:quote.contractValueCents,
    estimatedDelay:quote.estimatedDelay??null,prerequisites:quote.prerequisitesText??null,compiledAt:quote.contractCompiledAt??null,
    clauseText:quote.contractTextSnapshot??'',clauses:(snapshot.clauses??[]) as QuoteContractClause[],
    parameters:(snapshot.parameters??null) as QuoteContractParameters|null,administration:(snapshot.administration??null) as ContractAdministration|null,
    types:(snapshot.types??[]) as ContractTypeReference[],modules:[]});
}
