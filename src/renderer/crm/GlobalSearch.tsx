import {useEffect,useRef,useState} from 'react';
import type {SearchResult} from '../../shared/crm';
import {searchDestination,type SearchNavigationResult} from '../../shared/searchNavigation';

export function GlobalSearch({onOpen,onDismiss,onCancelSelection,contextKey}:{onOpen:(result:SearchResult)=>Promise<SearchNavigationResult>;onDismiss?:()=>void;onCancelSelection?:()=>void;contextKey?:string}) {
  const [query,setQuery]=useState(''),[results,setResults]=useState<SearchResult[]>([]),[open,setOpen]=useState(false),[activeIndex,setActiveIndex]=useState(-1);
  const [status,setStatus]=useState<'idle'|'loading'|'ready'|'error'>('idle'),[error,setError]=useState(''),[retry,setRetry]=useState(0),[opening,setOpening]=useState(false);
  const [compactPlaceholder,setCompactPlaceholder]=useState(()=>window.innerWidth<1180);
  const requestId=useRef(0),selectionId=useRef(0),selectionBusy=useRef(false),currentQuery=useRef(query),input=useRef<HTMLInputElement>(null),openingDestination=useRef<string|null>(null),outcomeFocus=useRef(false);
  currentQuery.current=query;
  const cancelSelection=useRef(onCancelSelection);cancelSelection.current=onCancelSelection;
  useEffect(()=>{const update=()=>setCompactPlaceholder(window.innerWidth<1180);window.addEventListener('resize',update);return()=>window.removeEventListener('resize',update);},[]);
  useEffect(()=>{
    const current=++requestId.current;
    if(selectionBusy.current){selectionId.current++;selectionBusy.current=false;setOpening(false);cancelSelection.current?.();}
    const normalized=query.trim();setError('');setResults([]);setActiveIndex(-1);
    if(normalized.length<2){setOpen(false);setStatus('idle');return;}
    setStatus('loading');setOpen(true);
    const timer=window.setTimeout(()=>{
      void Promise.resolve().then(()=>window.atoumweb.crm.search.global(normalized)).then(items=>{
        if(current!==requestId.current)return;
        if(!Array.isArray(items))throw Error('Réponse de recherche invalide.');
        setResults(items);setStatus('ready');setOpen(true);setActiveIndex(items.length?0:-1);
      }).catch((failure:unknown)=>{if(current!==requestId.current)return;setStatus('error');setError(failure instanceof Error?failure.message:'Recherche indisponible.');setOpen(true);});
    },180);
    return()=>{window.clearTimeout(timer);if(current===requestId.current)requestId.current++;};
  },[query,retry]);
  useEffect(()=>{if(selectionBusy.current&&openingDestination.current!==contextKey){selectionId.current++;selectionBusy.current=false;setOpening(false);}requestId.current++;setOpen(false);setStatus('idle');setResults([]);setActiveIndex(-1);},[contextKey]);
  useEffect(()=>()=>{requestId.current++;selectionId.current++;},[]);
  function close(){requestId.current++;setOpen(false);setStatus(value=>value==='loading'?'idle':value);setActiveIndex(-1);}
  async function choose(result:SearchResult){
    if(selectionBusy.current)return;
    selectionBusy.current=true;openingDestination.current=searchDestination(result);const sequence=++selectionId.current,submitted=query;setOpening(true);setError('');
    try {
      const outcome=await onOpen(result);
      if(sequence!==selectionId.current)return;
      if(outcome.status==='opened'){
        if(currentQuery.current===submitted){setQuery('');setResults([]);setOpen(false);setActiveIndex(-1);setStatus('idle');}
      }else if(outcome.cancelledReason==='superseded'){close();}
      else{if(outcome.status!=='cancelled')setStatus('error');setError(outcome.message??(outcome.status==='cancelled'?'Navigation annulée ; recherche conservée.':'Cette fiche ne peut pas être ouverte.'));setOpen(true);outcomeFocus.current=true;input.current?.focus();outcomeFocus.current=false;}
    }catch(failure){if(sequence===selectionId.current){setError(failure instanceof Error?failure.message:'Ouverture impossible.');setStatus('error');setOpen(true);outcomeFocus.current=true;input.current?.focus();outcomeFocus.current=false;}}
    finally{if(sequence===selectionId.current){selectionBusy.current=false;setOpening(false);}}
  }
  function keyDown(event:React.KeyboardEvent<HTMLInputElement>){
    if(event.nativeEvent.isComposing)return;
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();if(!open)onDismiss?.();close();if(selectionBusy.current){selectionId.current++;selectionBusy.current=false;setOpening(false);cancelSelection.current?.();}return;}
    if(!open||!results.length||opening)return;
    if(event.key==='ArrowDown'){event.preventDefault();setActiveIndex(index=>(index+1)%results.length);}
    else if(event.key==='ArrowUp'){event.preventDefault();setActiveIndex(index=>index<=0?results.length-1:index-1);}
    else if(event.key==='Enter'&&activeIndex>=0){event.preventDefault();void choose(results[activeIndex]);}
  }
  return <div className="global-search search-with-results" onPointerDown={event=>event.stopPropagation()} onBlur={event=>{
    if(event.currentTarget.contains(event.relatedTarget as Node|null))return;
    close();
  }}>
    <span aria-hidden="true">⌕</span>
    <input ref={input} role="combobox" aria-autocomplete="list" aria-label="Recherche globale" aria-expanded={open} aria-controls="global-search-results" aria-busy={status==='loading'||opening} aria-activedescendant={open&&activeIndex>=0?'global-search-result-'+activeIndex:undefined}
      value={query} onChange={event=>setQuery(event.target.value)} onKeyDown={keyDown}
      onFocus={()=>{if(query.trim().length>=2){setOpen(true);if(status==='idle'&&!outcomeFocus.current)setRetry(value=>value+1);}}}
      placeholder={compactPlaceholder?'Rechercher dans AtoumWeb…':'Rechercher client, prospect, devis, projet, intervention…'}/>
    {open&&<div className="search-results-panel" id="global-search-results" role="listbox" aria-label="Résultats de recherche">
      {opening&&<div role="status" className="search-empty">Ouverture de la fiche…</div>}
      {status==='loading'&&<div role="status" className="search-empty">Recherche en cours…</div>}
      {error&&<div role="alert" className="search-empty">{error}{status==='error'&&<button type="button" onClick={()=>setRetry(value=>value+1)}>Réessayer</button>}</div>}
      {status==='ready'&&!results.length&&!error&&<div className="search-empty">Aucun résultat</div>}
      {results.map((result,index)=><div key={result.entityType+':'+result.entityId} id={'global-search-result-'+index} role="option" aria-selected={activeIndex===index} aria-disabled={opening} className={'search-result '+(activeIndex===index?'active-search-result':'')}
        data-search-type={result.entityType} data-search-id={result.entityId} onMouseEnter={()=>{if(!opening)setActiveIndex(index);}} onPointerDown={event=>event.preventDefault()} onClick={()=>{setActiveIndex(index);void choose(result);}}>
        <span className="search-result-type">{entityLabel(result.entityType)}</span><span className="search-result-main"><strong>{result.title}</strong><small>{result.subtitle||'—'}</small></span>{result.status&&<span className="status-pill">{result.status}</span>}
      </div>)}
    </div>}
  </div>;
}

function entityLabel(type: SearchResult['entityType']): string {
  switch (type) {
    case 'client': return 'Client';
    case 'prospect': return 'Prospect';
    case 'organization': return 'Société';
    case 'contact': return 'Contact';
    case 'client_document': return 'Document client';
    case 'catalog': return 'Offre / Service';
    case 'quote': return 'Devis';
    case 'project': return 'Projet';
    case 'service_request': return 'Demande';
    case 'intervention': return 'Intervention';
    case 'maintenance': return 'Maintenance';
    case 'hour_pack': return 'Pack d’heures';
    default: return 'Référence non prise en charge';
    case 'atoumweb_library': return 'Bibliothèque AtoumWeb';
    case 'backup_record': return 'Sauvegarde';
  }
}
