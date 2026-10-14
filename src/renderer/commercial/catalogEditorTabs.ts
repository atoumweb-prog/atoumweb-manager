/** Stable tabs for the Catalogue editor. Values do not change commercial data. */
export const CATALOG_EDITOR_TABS = [
  {id:'identity',label:'Identité',hint:'Identité commune et repères commerciaux'},
  {id:'pricing',label:'Tarifs & Abby',hint:'Prix, unité, périodicité et acompte'},
  {id:'scope',label:'Contenu & périmètre',hint:'Livrables, inclusions, exclusions et prérequis'},
  {id:'associations',label:'Associations',hint:'Composition des offres et recommandations complémentaires'},
  {id:'sales',label:'Aide à la vente',hint:'Bénéfices, besoins et recommandations internes'},
  {id:'contracts',label:'Contrat & CGV',hint:'Références versionnées et conditions commerciales'},
  {id:'production',label:'Production',hint:'Blueprints et préparation du travail'},
  {id:'history',label:'Historique',hint:'Versions enregistrées et publication'},
] as const;
export type CatalogEditorTab = typeof CATALOG_EDITOR_TABS[number]['id'];
export const CATALOG_INPUT_TABS: readonly CatalogEditorTab[] = ['identity','pricing','scope','sales','contracts'];
export function catalogTabHasVersionFields(tab: CatalogEditorTab): boolean {
  return CATALOG_INPUT_TABS.includes(tab);
}
export function catalogTabAppliesToType(tab: CatalogEditorTab,type:'offer'|'service'): boolean {
  // Les compositions restent réservées aux offres ; les recommandations 04D
  // sont maintenant disponibles aussi sur les services.
  return true;
}
