import {useMemo,useSyncExternalStore} from 'react';
import {DraftSection} from '../../shared/draftSection';
export function useDraftSection<T>(key:string,initial:T){
  const section=useMemo(()=>new DraftSection(initial),[key]);
  const state=useSyncExternalStore(section.subscribe,section.snapshot);
  return {section,...state};
}
