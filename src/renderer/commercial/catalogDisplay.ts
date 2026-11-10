import type {CatalogItemSummary} from '../../shared/commercial';
import type {OperationIconName} from '../operations/OperationIcon';

const families:Record<string,string>={WEB:'Sites web',LANDING:'Landing pages',ECOM:'E-commerce',MAINT:'Maintenance',CONTENU:'Contenu',SEO:'Référencement et visibilité',IDENTITE:'Identité visuelle',APP:'Applications métier',MARIAGE:'Sites mariage',DATA:'Analytics et mesure d’audience',DEVWP:'Développement WordPress',TECH:'Prestations techniques',PHOTO:'Photographie'};
const legacy:Record<string,string>={'Web':'WEB','E-commerce':'ECOM','Maintenance':'MAINT','Contenu':'CONTENU','Visibilité':'SEO','SEO / Visibilité':'SEO','Création':'IDENTITE','Identité visuelle':'IDENTITE','Applications':'APP','Applications & outils métier':'APP','Mariage':'MARIAGE'};
/** Display aliases only. Catalogue identities, categories and business mapping remain unchanged. */
export function catalogueFamilyLabel(item:CatalogItemSummary):string {
  const code=item.currentVersion?.familyCode||item.category||'Autre';
  return families[legacy[code]??code]??code;
}
export function catalogueIsOffer(item:CatalogItemSummary):boolean {return item.type==='offer';}

/** Main category display label; stored category and canonical families remain unchanged. */
export function catalogueCategoryName(value:string|null|undefined):string {
  const category=value?.trim();
  if (!category) return 'Sans catégorie';
  return families[legacy[category]??category]??category;
}

/** Item category (not the family's commercial/version code). */
export function cataloguePrimaryCategoryLabel(item:CatalogItemSummary):string {
  return catalogueCategoryName(item.category);
}

/** Family code behind a stored family/category label (display alias only). */
export function catalogueFamilyCode(value:string|null|undefined):string|null {
  const key=value?.trim();
  return key?legacy[key]??key:null;
}

/** One icon per commercial family, shared by the Catalogue and the quote assistant. */
export function catalogueFamilyIcon(name:string):OperationIconName {
  return /maintenance/i.test(name)?'shield-check':/commerce/i.test(name)?'wallet':/mariage/i.test(name)?'gift':/site|landing/i.test(name)?'server':/photo|visuelle/i.test(name)?'image':/contenu/i.test(name)?'file-text':/audience|visibilit|référencement/i.test(name)?'chart':/application|WordPress/i.test(name)?'code':'wrench';
}
