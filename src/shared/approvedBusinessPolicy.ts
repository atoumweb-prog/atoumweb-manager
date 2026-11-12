import type {QuoteDetail} from './commercial';
import type {CommercialVersionRules} from './commercialRules';
import {maintenanceQuotaOverlap} from './quoteBillingRules';

/** Only immutable line snapshots opt in. Historical quotes never inherit new policy. */
export function approvedBusinessReview(quote:Pick<QuoteDetail,'lines'|'contractAudience'>) {
  const blocking:string[]=[],warnings:string[]=[];
  const lines=quote.lines.map(line=>({line,policy:(line.snapshot?.commercialRules as CommercialVersionRules|undefined)?.approvedPack})).filter(row=>row.policy?.version==='V3.9.4/V1.5');
  if(!lines.length)return {blocking,warnings};
  warnings.push('RC Pro : aucune couverture active attestée par le pack ; ne pas déclarer une assurance sans justificatif. Décision distincte avant engagement.');
  warnings.push('Référence commerciale/logo : consentement distinct, facultatif et révocable requis ; la clause 119 ne constitue pas un accord.');
  warnings.push('RGPD : contrôler les accords, instructions, sous-traitants et accès par Site. Les annexes manquantes ne sont pas réputées finalisées.');
  warnings.push('Impayés ponctuels : relance J+7, mise en demeure J+15 et suspension éventuellement possible à J+23 des seules tâches non exécutées, après examen et notification. Récurrents : J+30/J+60 selon conditions. Aucune suspension ni suppression automatique.');
  if(quote.contractAudience==='consumer'){
    warnings.push('Consommateur : convention de médiation non attestée ; information/rétractation/début anticipé et résiliation électronique restent à vérifier selon le parcours.');
    warnings.push('Reconduction : contrôler la limite de refus, information nominative entre 3 et 1 mois avant cette limite et preuves. Aucun envoi automatique développé par ce pack.');
  }
  for(const {line,policy} of lines){
    if(!policy)continue;
    if(/^(A_VERIFIER|ANCIEN_|BASE_INTERNE)/.test(policy.sourceStatus))blocking.push(`${line.label} : référence source non commercialisable (${policy.sourceStatus}).`);
    if(policy.sourceStatus==='RETENU_SUR_DELEGATION_07_11_2026')warnings.push(`${line.label} : prix retenu sur délégation, statut conservé sans validation individuelle.`);
    if(policy.sourceCode==='V39-HOST-DOMAINE')warnings.push(`${line.label} : 29 €/an de gestion auxquels s'ajoute le prix du registrar ; préciser le coût tiers réel et sa prise en charge, sans présenter 29 € comme un total tout compris.`);
    for(const included of policy.includedCodes??[])for(const extra of quote.lines.filter(candidate=>((candidate.snapshot?.commercialRules as CommercialVersionRules|undefined)?.approvedPack?.sourceCode??String(candidate.snapshot?.canonicalCode??''))===included)){
      if(extra.parameters?.scope?.trim()&&extra.parameters.parentLineId!==line.id)warnings.push(`${extra.label} : périmètre distinct déclaré ; vérifier qu'il ne recouvre pas l'inclusion de ${line.label}.`);
      else blocking.push(`${line.label} : ${included} est déjà inclus ; retirer la double facturation ou documenter une prestation distincte hors de ce périmètre.`);
    }
    const count=line.parameters?.productCount;
    if(count?.kind==='included'&&policy.includedProducts!=null&&count.count!==policy.includedProducts)blocking.push(`${line.label} : ${policy.includedProducts} produits simples au total sont inclus par la version choisie.`);
    if(policy.renewal==='express')warnings.push(`${line.label} : renouvellement uniquement sur accord exprès, jamais automatique.`);
    if(policy.renewal==='contractual_automatic')warnings.push(`${line.label} : reconduction uniquement si prévue au contrat et après contrôles d'information et de résiliation applicables.`);
    if(policy.priceChange==='monthly_30_days')warnings.push(`${line.label} : hausse mensuelle annoncée au moins 30 jours avant, avec faculté de résiliation.`);
    if(policy.priceChange==='annual_written_agreement')warnings.push(`${line.label} : prix fixe pendant l'annualité ; hausse à la nouvelle annualité sur accord écrit.`);
  }
  const quota=maintenanceQuotaOverlap(quote.lines.map(line=>({id:line.id,label:line.label,snapshot:(line.snapshot??null) as Record<string,unknown>|null})));
  if(quota.length)warnings.push(`${quota.map(label=>`« ${label} »`).join(' et ')} peu${quota.length>1?'vent':'t'} compter comme l’une des petites interventions mensuelles de la maintenance de ce devis (30 minutes, sans report ni cumul) : ne pas facturer en plus si le quota du mois est disponible.`);
  return {blocking:[...new Set(blocking)],warnings:[...new Set(warnings)]};
}
