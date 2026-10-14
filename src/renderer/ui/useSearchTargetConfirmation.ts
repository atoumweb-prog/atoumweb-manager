import { useEffect } from 'react';
import type { SearchResult } from '../../shared/crm';

export type EntityReady = (type:SearchResult['entityType'], id:string|null, error?:string) => void;
const panels: Record<SearchResult['entityType'],string> = {
  catalog:'.catalog-detail-panel',quote:'.quote-detail-panel',prospect:'.prospect-side-panel-boundary,.prospect-detail-panel',client:'.client-summary-panel',project:'.project-production-page',
  service_request:'.operation-detail-boundary',intervention:'.operation-detail-boundary',maintenance:'.maintenance-detail-panel',hour_pack:'.hour-pack-detail',
  organization:'.directory-detail-panel',contact:'.directory-detail-panel',client_document:'.documents-detail-panel',atoumweb_library:'.aw-library-detail',backup_record:'.business-backups-detail',
};
/** Acknowledge data already loaded by the page. App remains the sole navigation owner. */
export function useSearchTargetConfirmation(type:SearchResult['entityType'], id:string|null|undefined, loading:boolean, onReady?:EntityReady, error?:string|null) {
  useEffect(()=>{
    if(!onReady)return;
    if(loading||!id){onReady(type,null);return;}
    if(error){onReady(type,id,error);return;}
    // View changes can replace the pane without changing its model ID (History/desk).
    // A hidden pane is never proof that the requested model is displayed.
    const visible=Array.from(document.querySelectorAll<HTMLElement>(panels[type]))
      .map(element=>getComputedStyle(element).display==='contents'?element.firstElementChild as HTMLElement|null:element)
      .filter((element):element is HTMLElement=>!!element&&element.getClientRects().length>0&&!element.closest('[hidden],[aria-hidden=true]'));
    const pane=visible.find(element=>element.closest('[role=dialog][aria-modal=true]'))??visible[0];
    if(!pane){onReady(type,id,'La fiche demandée ne peut pas être affichée.');return;}
    pane.dataset.searchEntityType=type;pane.dataset.searchEntityId=id;
    if(!pane.hasAttribute('tabindex'))pane.tabIndex=-1;
    onReady(type,id);
  });
}
