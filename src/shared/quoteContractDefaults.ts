import { paymentMilestones, type QuoteContractParameters } from './quoteContractPreparation';

export interface ContractDefaultLine { id:string;label:string;snapshot:Record<string,unknown>|null }
export interface ContractDefaultFact {
  code:string;status:'automatic'|'confirm'|'missing';message:string;source:string;
}
export interface ContractDefaults { parameters:QuoteContractParameters; facts:ContractDefaultFact[]; includedBenefits:string[]; marriage:boolean }

/** Known sold-version data only. No legal qualification inferred from a product name or a family. */
export function deriveQuoteContractDefaults(input:{subject:string;needSummary:string|null;estimatedDelay:string|null;lines:ContractDefaultLine[]},stored:QuoteContractParameters):ContractDefaults {
  const p=structuredClone(stored),facts:ContractDefaultFact[]=[],includedBenefits:string[]=[];
  const add=(code:string,status:ContractDefaultFact['status'],message:string,source:string)=>facts.push({code,status,message,source});
  if(!p.conclusion.purchasePurpose.trim()){
    p.conclusion.purchasePurpose=input.needSummary?.trim()||input.subject;
    if(p.conclusion.purchasePurpose)add('CONCLUSION','automatic','Objet de l’achat repris du besoin/devis.','Besoin enregistré et objet du devis');
  }
  const defaults=paymentMilestones(p.payment.preset);
  if(defaults.length&&defaults.length===p.payment.milestones.length){
    p.payment.milestones=p.payment.milestones.map((m,i)=>!m.dueDate&&!m.event.trim()?{...m,event:i===0?'Commande / acceptation du devis':i===defaults.length-1?'Livraison / mise à disposition du livrable':'Validation explicite du jalon intermédiaire'}:m);
    add('PAYMENT_DATES','automatic','Événements de paiement issus du modèle choisi ; dates inconnues laissées vides.','Modèle d’échéancier enregistré');
  }
  const deliveries:string[]=[];
  let hasContinuous=false,hasOneOff=false;
  for(const line of input.lines){
    const s=line.snapshot??{},commercial=(s.commercialParameters??{}) as Record<string,unknown>;
    const source=`${String(s.canonicalCode??line.label)} · v${String(s.versionNumber??'historique')}`;
    if(typeof commercial.deliverables==='string'&&commercial.deliverables.trim())deliveries.push(`${line.label} : ${commercial.deliverables}`);
    if(s.periodicity==='ponctuelle')hasOneOff=true;
    if(['mensuelle','annuelle','monthly','yearly'].includes(String(s.periodicity)))hasContinuous=true;
    const inclusions=Array.isArray(s.inclusions)?s.inclusions.filter((x):x is string=>typeof x==='string'):[];
    for(const inclusion of inclusions){
      if(/hébergement\s+1\s+an/i.test(inclusion)){includedBenefits.push(`${line.label} — Hébergement WordPress inclus/offert pendant 1 an.`);hasContinuous=true;}
      if(/domaine.*1\s+an/i.test(inclusion))includedBenefits.push(`${line.label} — Nom de domaine standard inclus/offert pendant 1 an.`);
    }
    const warranty=typeof commercial.correctiveWarranty==='string'?commercial.correctiveWarranty.trim():'';
    const existing=p.warranties.find(w=>w.lineId===line.id);
    const days=/^30\s*jours/i.test(warranty)?30:/^60\s*jours/i.test(warranty)?60:/^90\s*jours/i.test(warranty)?90:null;
    const nonApplicable=/^N\s*\/\s*A\b/i.test(warranty);
    if(!existing&&(days!==null||nonApplicable)){
      const kind=days===30?'small_adjustment':days===60?'wordpress_custom':days===90?'business_app':'not_applicable';
      const production=typeof commercial.deliverables==='string'&&/site en ligne|page.*intégrée|paiement.*opérationnel|fonction opérationnelle/i.test(commercial.deliverables);
      p.warranties.push({lineId:line.id,kind,days,startEvent:days===null?'':production?'Mise en production de la prestation convenue':'Mise à disposition définitive du livrable',statutoryRightsUnaffected:true});
      add('WARRANTY_COVERAGE','automatic',`${line.label} : ${days===null?'garantie corrective non prévue par le Catalogue':`${days} jours correctifs`}.`,`${source} — garantie corrective et doctrine de départ déjà décidées`);
    }else if(!existing)add('WARRANTY_COVERAGE','missing',`${line.label} : aucune règle corrective exploitable dans la version vendue.`,source);
    else if(!existing.startEvent.trim()&&existing.days!==null)add('WARRANTY_COVERAGE','confirm',`${line.label} : préciser le départ de la garantie choisie.`,source);
  }
  if(!p.digital.delivery.trim()&&deliveries.length){p.digital.delivery=deliveries.join('\n');add('DIGITAL_QUALIFICATION','automatic','Livrables et mode de remise descriptif repris des versions vendues.','Catalogue vendu — livrables');}
  if(p.digital.supply===null&&hasOneOff&&!hasContinuous){p.digital.supply='one_off';add('DIGITAL_QUALIFICATION','automatic','Fourniture ponctuelle selon la périodicité des prestations vendues.','Périodicité Catalogue');}
  if(p.digital.supply===null&&hasContinuous&&!hasOneOff){p.digital.supply='continuous';add('DIGITAL_QUALIFICATION','automatic','Fourniture continue selon la périodicité des prestations vendues.','Périodicité Catalogue');}
  if(hasContinuous&&hasOneOff)add('DIGITAL_QUALIFICATION','confirm','Prestations ponctuelles et service continu coexistent : confirmer la qualification et la fourniture adaptées au contrat.','Périodicités et hébergement inclus');
  if(!p.digital.kinds.length)add('DIGITAL_QUALIFICATION','missing','La version vendue ne contient pas de qualification juridique structurée. Le livrable numérique ne suffit pas à déterminer seul cette qualification.','Catalogue / doctrine qualification par obligations');
  if(includedBenefits.some(x=>x.includes('Hébergement WordPress'))&&!p.digital.kinds.length){p.digital.hosting=true;if(!p.digital.associatedServices.trim())p.digital.associatedServices=includedBenefits.join('\n');}
  if(includedBenefits.length){
    add('INCLUDED_BENEFITS','automatic','Hébergement/domaine inclus repris de l’offre, sans ligne facturée supplémentaire.','Inclusions de la version vendue');
    add('RENEWAL','confirm','Confirmer l’activation, la fin de la période incluse et les conditions de renouvellement. Aucun tarif de domaine ou renouvellement de forfait inventé.','Offre vendue — période incluse');
  }
  if(!p.milestones.length&&input.estimatedDelay?.trim())add('DELIVERY_MILESTONE','confirm',`Délai indiqué au devis : ${input.estimatedDelay}. Préciser le jalon et son point de départ convenus.`, 'Délai du devis');
  if(!p.rights.reviewed)add('RIGHTS_REVIEW','confirm','Confirmer les usages, droits/licences et sources réellement prévus pour les livrables de ce dossier.','Livrables Catalogue ; aucune cession inventée');
  if(!p.renewal.reviewed)add('RENEWAL_REVIEW','confirm',hasContinuous?'Des prestations/périodes continues sont présentes : confirmer leurs modalités.':'Confirmer si une fin de service ou un renouvellement particulier est prévu.','Périmètre vendu');
  return {parameters:p,facts,includedBenefits,marriage:input.lines.some(l=>l.snapshot?.familyCode==='MARIAGE')};
}
