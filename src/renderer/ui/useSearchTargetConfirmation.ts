import { useEffect } from 'react';
import type { SearchResult } from '../../shared/crm';

export type EntityReady = (type:SearchResult['entityType'], id:string|null, error?:string) => void;
/** Acknowledge data already loaded by the page. App remains the sole navigation owner. */
export function useSearchTargetConfirmation(type:SearchResult['entityType'], id:string|null|undefined, loading:boolean, onReady?:EntityReady, error?:string|null) {
  useEffect(()=>{if(!loading)onReady?.(type,id??null,error??undefined);},[type,id,loading,onReady,error]);
}
