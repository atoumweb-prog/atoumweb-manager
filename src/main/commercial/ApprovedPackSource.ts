import catalogue from '../../../data/approved/2026-11-08/CATALOGUE_V394_130_EXTRAIT_WORD.json';
import library from '../../../data/approved/2026-11-08/CLAUSES_V394_119_EXTRAITES_WORD.json';
import business from '../../../data/approved/2026-11-08/REFERENTIEL_METIER_V15_EXTRAIT_WORD.json';
import baseline from '../../../data/catalogue/atoumweb-catalogue-v1.json';
import type {CatalogImportSource} from './CatalogImportService';
import type {CatalogVersionInput} from '../../shared/commercial';
import type {CommercialVersionRules} from '../../shared/commercialRules';
import {approvedFamilyLabel} from '../../shared/approvedFamilies';

export const APPROVED_PACK={reference:'AtoumWeb V3.9.4 / V1.5 — 2026-11-08 — rectificatif 019 — métier approuvé, non publié',catalogue,library,business};

export function approvedCatalogSource():CatalogImportSource {
 return {schemaVersion:1,expectedRecordCount:130,preserveItemMetadata:true,provisionalCodes:catalogue.identifiants_provisoires_V39,
  source:{reference:catalogue.source_word,sha256:catalogue.sha256_word,sheet:'Word final — 130 références'},
  records:catalogue.references.map(r=>{
   const old=baseline.records.find(b=>b.canonicalCode===r.code_source),code=r.code_source;
   // Décision 09/11/2026 : un libellé qui ne commence pas par un montant (ex. « À vérifier — ancienne offre 499 € »)
   // n'est pas un prix exploitable ; il reste « sur devis », libellé source conservé tel quel.
   const amount=!/^(Dès\s+)?\d/.test(r.prix_affiche.trim())?null:r.prix_affiche.match(/(\d[\d \u00a0\u202f]*(?:,\d{1,2})?)\s*€/);
   const priceCents=amount?Math.round(Number(amount[1].replace(/[ \u00a0\u202f]/g,'').replace(',','.'))*100):null;
   const mode:CatalogVersionInput['priceMode']=priceCents==null?'quote_only':/\/\s*mois/.test(r.prix_affiche)?'monthly':/\/\s*an/.test(r.prix_affiche)?'yearly':/^Dès/.test(r.prix_affiche)?'starting_from':'fixed';
   const family=old?.category??code.split('-')[1];
   const type=old?.type==='offer'||/^V39-(WEB|ECOM)-/.test(code)?'offer':'service';
   return {canonicalCode:code,name:r.nom,type,category:approvedFamilyLabel(family),version:{priceMode:mode,priceCents,priceBasis:'listed',
    nature:r.nom,description:r.nom,inclusions:r.inclusions,exclusions:r.exclusions,prerequisites:[],
    commercialKind:type==='offer'?'offer':mode==='monthly'||mode==='yearly'?'subscription':'service',familyCode:family,
    abbyLabel:r.nom,unit:old?.version.unit??'forfait',periodicity:mode==='monthly'?'mensuelle':mode==='yearly'?'annuelle':'ponctuelle',
    provenance:{reference:catalogue.source_word,sha256:catalogue.sha256_word,recordKey:code},
    commercialParameters:{sourceStatus:r.statut_source,sourceVersion:catalogue.version,sourcePriceLabel:r.prix_affiche,
      commercialCautions:r.commentaires_documentaires.map(c=>c.type+' : '+c.texte).join('\n')},
    internalAdvice:'Référence métier approuvée pour intégration interne, non publiée. Statut source : '+r.statut_source,
   }};
  })};
}

export function approvedVersionRules(code:string,status:string):CommercialVersionRules {
 const monthly=/-M$/.test(code),annual=/-A$/.test(code)||code==='V39-HOST-LUNE'||code==='V39-HOST-DOMAINE'||code==='AW-MARIAGE-RENOUV';
 const recurring=monthly||annual;
 const woo=code==='AW-ECOM-BASE'?10:code==='V39-ECOM-BUSINESS'||code==='V39-ECOM-VISIBILITE'?25:undefined;
 return {schemaVersion:1,...(code==='AW-PHOTO-DETOUR'?{minimumLineCents:4500}:{}),approvedPack:{version:'V3.9.4/V1.5',sourceCode:code,sourceStatus:status,
  includedProducts:woo,includedCodes:code==='V39-ECOM-BUSINESS'||code==='V39-ECOM-VISIBILITE'?['AW-WEB-NEWSLETTER','AW-DATA-GA-SC','AW-WEB-AVIS-GOOGLE']:undefined,
  renewal:recurring?code.startsWith('AW-MAINT-')&&annual||code==='V39-HOST-DOMAINE'?'express':'contractual_automatic':'none',
  priceChange:monthly?'monthly_30_days':annual?'annual_written_agreement':'none'}};
}
