import type { AtoumWebApi } from './contracts';
import type { SearchResult } from './crm';
import type { NavigationModuleKey } from './navigationRail';

export const SEARCH_DESTINATIONS: Record<SearchResult['entityType'], NavigationModuleKey> = {
  prospect:'Prospects',client:'Clients',catalog:'Offres & Tarifs',quote:'Devis',project:'Projets',
  service_request:'Interventions & Maintenance',intervention:'Interventions & Maintenance',maintenance:'Interventions & Maintenance',hour_pack:'Interventions & Maintenance',
  client_document:'Documents & Contrats',atoumweb_library:'Bibliothèque AtoumWeb',backup_record:'Sauvegardes',organization:'Annuaire',contact:'Annuaire',
};
export interface SearchNavigationResult {status:'opened'|'cancelled'|'failed'|'unsupported'; message?:string; cancelledReason?:'guard'|'superseded'}
export function searchDestination(value: unknown): NavigationModuleKey | null {
  if (!value || typeof value!=='object') return null;
  const {entityType,entityId}=value as Record<string,unknown>;
  if(typeof entityType!=='string'||!Object.hasOwn(SEARCH_DESTINATIONS,entityType)||typeof entityId!=='string'||!entityId||entityId!==entityId.trim())return null;
  return SEARCH_DESTINATIONS[entityType as SearchResult['entityType']];
}
/** Read through existing APIs only; never publish, convert, restore or mutate an entity. */
export async function readSearchTarget(api:AtoumWebApi, result:SearchResult, allowArchived=false):Promise<{id:string}> {
  const id=result.entityId;
  if(!searchDestination(result))throw Error('Type ou identifiant de destination non pris en charge.');
  let target: {id:string;archivedAt?:string|null;status?:string}|undefined;
  switch(result.entityType){
    case 'catalog':target=await api.catalog.getItem(id);break;
    case 'quote':target=await api.quotes.get(id);break;
    case 'project':target=await api.projects.projects.get(id);break;
    case 'atoumweb_library':target=await api.referentials.library.get(id);break;
    case 'backup_record':target=await api.businessBackups.get(id);break;
    case 'organization':target=await api.crm.organizations.get(id);break;
    case 'contact':target=await api.crm.contacts.get(id);break;
    case 'prospect':target=(await api.crm.prospects.list({includeArchived:true})).find(item=>item.id===id);break;
    case 'client':target=(await api.crm.clients.list({includeArchived:true})).find(item=>item.id===id);break;
    case 'service_request':target=await api.operations.requests.get(id);break;
    case 'intervention':target=await api.operations.interventions.get(id);break;
    case 'maintenance':target=(await api.operations.maintenance.subscriptions.list()).find(item=>item.id===id);break;
    case 'hour_pack':target=await api.operations.hourPacks.get(id);break;
    case 'client_document':{
      const clients=await api.crm.clients.list({includeArchived:true});
      const documents=await Promise.all(clients.map(client=>api.clientDocuments.list(client.id,true)));
      target=documents.flat().find(item=>item.id===id);break;
    }
  }
  if(!target||target.id!==id)throw Error('La fiche demandée est introuvable.');
  if(!allowArchived&&(target.archivedAt||target.status==='archived'))throw Error('La fiche demandée a été archivée.');
  return target;
}

