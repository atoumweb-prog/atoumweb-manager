import type {CatalogItemSummary} from '../../shared/commercial';

const families:Record<string,string>={WEB:'Sites web',LANDING:'Landing pages',ECOM:'E-commerce',MAINT:'Maintenance',CONTENU:'Contenu',SEO:'Référencement et visibilité',IDENTITE:'Identité visuelle',APP:'Applications métier',MARIAGE:'Sites mariage',DATA:'Analytics et mesure d’audience',DEVWP:'Développement WordPress',TECH:'Prestations techniques',PHOTO:'Photographie'};
const legacy:Record<string,string>={'Web':'WEB','E-commerce':'ECOM','Maintenance':'MAINT','Contenu':'CONTENU','Visibilité':'SEO','SEO / Visibilité':'SEO','Création':'IDENTITE','Identité visuelle':'IDENTITE','Applications':'APP','Applications & outils métier':'APP','Mariage':'MARIAGE'};
/** Display aliases only. Catalogue identities, categories and business mapping remain unchanged. */
export function catalogueFamilyLabel(item:CatalogItemSummary):string {
  const code=item.currentVersion?.familyCode||item.category||'Autre';
  return families[legacy[code]??code]??code;
}
export function catalogueIsOffer(item:CatalogItemSummary):boolean {return item.type==='offer';}
