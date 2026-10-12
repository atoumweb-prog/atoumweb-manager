import{useEffect,useRef,useState,type ReactNode}from'react';
import{readHeaderPreference,writeHeaderPreference,HEADER_PREFERENCE_KEY}from'../../shared/headerPresentation';
import type{VisualPreferenceStore}from'../../shared/panelLayout';
import{AppButton}from'./AppButton';import{FieldHelp}from'./FieldHelp';
import './workspace-header.css';
/** Presentation slot only: the caller owns the unique timer and all business commands. */
export function WorkspaceHeader({store,moduleLabel,recordLabel,railCollapsed,onToggleRail,onBack,timer,timerDialogOpen,libraryCollapsed,onToggleLibrary}:{store:VisualPreferenceStore;moduleLabel:string;recordLabel?:string;railCollapsed:boolean;onToggleRail:()=>void;onBack:()=>void;timer:ReactNode;timerDialogOpen:boolean;libraryCollapsed:boolean;onToggleLibrary:()=>void}){
 const[compact,setCompact]=useState(false),[error,setError]=useState(''),[searchOpen,setSearchOpen]=useState(false),[query,setQuery]=useState(''),[optionsOpen,setOptionsOpen]=useState(false),[now,setNow]=useState(()=>new Date());
 const root=useRef<HTMLElement>(null),searchTrigger=useRef<HTMLButtonElement>(null);
 useEffect(()=>{const read=()=>{try{setCompact(readHeaderPreference(store).compact);setError('');}catch{setCompact(false);setError('En-tête non lu ; défaut développé disponible.');}};read();const changed=(event:StorageEvent)=>{if(event.key===null||event.key===HEADER_PREFERENCE_KEY)read();};window.addEventListener('storage',changed);return()=>window.removeEventListener('storage',changed);},[store]);
 useEffect(()=>{const clock=setInterval(()=>setNow(new Date()),30_000);return()=>clearInterval(clock);},[]);
 useEffect(()=>{if(searchOpen)root.current?.querySelector<HTMLInputElement>('#header-demo-search')?.focus();},[searchOpen]);
 useEffect(()=>{if(optionsOpen)root.current?.querySelector<HTMLElement>('.aw-header-secondary button')?.focus();},[optionsOpen]);
 useEffect(()=>{if(timerDialogOpen){setSearchOpen(false);setOptionsOpen(false);}},[timerDialogOpen]);
 useEffect(()=>{if(timerDialogOpen){const dialog=root.current?.querySelector<HTMLElement>('.aw-header-timer [role=dialog]');if(!dialog?.contains(document.activeElement))dialog?.querySelector<HTMLElement>('textarea,button')?.focus();}},[compact]);
 function toggle(){const next=!compact;setCompact(next);try{writeHeaderPreference(store,{version:1,compact:next});setError('');}catch{setError('Préférence d’en-tête non mémorisée ; les saisies sont conservées.');}}
 function closeSearch(){setSearchOpen(false);searchTrigger.current?.focus();}
 function closeOptions(){setOptionsOpen(false);root.current?.querySelector<HTMLButtonElement>('#header-options-trigger')?.focus();}
 return <header ref={root} className={`aw-workspace-header content-area ${compact?'is-compact':''}`} data-header-compact={compact}>
  <div className="aw-header-primary"><AppButton aria-label={railCollapsed?'Déployer le rail depuis l’en-tête':'Réduire le rail depuis l’en-tête'} aria-expanded={!railCollapsed} onAction={onToggleRail}>☰</AppButton><nav className="aw-header-context" aria-label="Contexte de navigation"><AppButton variant="quiet" onAction={onBack}>{moduleLabel}</AppButton>{recordLabel&&<span>› {recordLabel}</span>}<small>Workspace TEST · Local</small></nav>
   <button type="button" ref={searchTrigger} className="aw-header-command" id="header-search-trigger" disabled={timerDialogOpen} aria-expanded={searchOpen} aria-controls="header-search-panel" onClick={()=>{setOptionsOpen(false);setSearchOpen(true);}}>Rechercher</button>
   <section id="header-search-panel" className={`aw-header-search ${searchOpen?'is-open':''}`} role={searchOpen?'dialog':undefined} aria-label="Recherche de démonstration" onKeyDown={event=>{if(event.key==='Escape'&&searchOpen){event.preventDefault();event.stopPropagation();closeSearch();}}}><label>Recherche TEST<input id="header-demo-search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Aucune donnée cliente interrogée"/></label>{searchOpen&&<><p>Atelier de présentation uniquement. Recherche et routage02C non activés.</p><AppButton onAction={closeSearch}>Fermer la recherche</AppButton></>}</section>
   <div className="aw-header-timer">{timer}</div>
   <AppButton id="header-mode" aria-expanded={!compact} aria-label={compact?'Développer l’en-tête':'Compacter l’en-tête'} onAction={toggle}>{compact?'Développer':'Compacter'}</AppButton>
   <AppButton id="header-options-trigger" aria-controls="header-options-panel" aria-expanded={optionsOpen} disabled={timerDialogOpen||searchOpen} onAction={()=>{if(optionsOpen)closeOptions();else setOptionsOpen(true);}}>Options</AppButton>
  </div>
  <section id="header-options-panel" className={`aw-header-secondary ${optionsOpen?'is-open':''}`} aria-label="Repères secondaires" onKeyDown={event=>{if(event.key==='Escape'&&optionsOpen){event.preventDefault();event.stopPropagation();closeOptions();}}}><time dateTime={now.toISOString()}>Heure locale : {now.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</time><FieldHelp text="Les commandes restent accessibles." detail="Aucun raccourci global ajouté. Tab, Entrée, Espace et Escape agissent dans leur couche."/>{moduleLabel==='Bibliothèque AtoumWeb'&&<AppButton id="header-library" aria-pressed={libraryCollapsed} onAction={onToggleLibrary}>{libraryCollapsed?'Afficher':'Replier'} le bandeau Bibliothèque TEST</AppButton>}</section>
  {error&&<p role="alert" className="aw-header-error">{error}</p>}
 </header>;
}
