import type { ContractAdministration } from './quoteContractPreparation';

/** Resolve named fields only, from the recorded configuration; unknown markers still block. */
export function resolveContractFields(body:string, admin:ContractAdministration|null):string {
  const field=(key:keyof ContractAdministration,label:string,marker:string)=>{
    const info=admin?.[key];
    if(info?.state==='filled'&&info.value.trim())body=body.replaceAll(marker,`${label} : ${info.value.trim()}`);
  };
  field('complaints','Contact pour les réclamations','[CONTACT RÉCLAMATION ATOUMWEB À RENSEIGNER]');
  field('withdrawalRecipient','Destinataire de la rétractation','[COORDONNÉES DU DESTINATAIRE À RENSEIGNER]');
  if(admin?.mediator.state==='filled'&&admin.mediator.value.trim()){
    body=body.replaceAll('[NOM DU MÉDIATEUR]',admin.mediator.value.trim())
      .replaceAll('[ADRESSE]','voir les coordonnées complètes du médiateur ci-dessus')
      .replaceAll('[SITE INTERNET]','voir les coordonnées complètes du médiateur ci-dessus');
  }
  return body;
}
export function hasUnresolvedContractFields(body:string):boolean {
  return /\[[^\]\r\n]*(?:RENSEIGNER|MÉDIATEUR|DESTINATAIRE|ADRESSE|SITE INTERNET)[^\]\r\n]*\]/iu.test(body);
}

export function renderContractReferences(body:string,references:{code:string;title:string}[]):string {
  for(const ref of references.sort((a,b)=>b.code.length-a.code.length)){
    if(!/^[A-Z][A-Z0-9]*-[A-Z0-9-]+$/.test(ref.code)||!ref.title)continue;
    const escaped=ref.code.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    body=body.replace(new RegExp(`(?<![A-Z0-9-])${escaped}(?![A-Z0-9-])`,'g'),()=>`« ${ref.title} »`);
  }
  return readableTechnicalTerms(body);
}

/** Expand established abbreviations without adding an operation or commitment. */
export function readableTechnicalTerms(body:string):string {
  return body.replace(/\bMAJ\b/g,'mises à jour').replace(/\bHNO\b/g,'en dehors des horaires de travail habituels');
}
