import {BrandLogo} from './BrandMark';
import {OperationIcon} from '../operations/OperationIcon';
import{useEffect,useRef,useState,type ReactNode}from'react';
import{readHeaderPreference,writeHeaderPreference,HEADER_PREFERENCE_KEY}from'../../shared/headerPresentation';
import type{VisualPreferenceStore}from'../../shared/panelLayout';
import{AppButton}from'./AppButton';import{FieldHelp}from'./FieldHelp';
import './workspace-header.css';
/** Presentation slot only: the caller owns the unique timer and all business commands. */
export function WorkspaceHeader({store,moduleLabel,recordLabel,railCollapsed,onToggleRail,onBack,timer,timerDialogOpen,libraryCollapsed,onToggleLibrary,search,clock,workspaceLabel,environmentBanner}:{store:VisualPreferenceStore;moduleLabel:string;recordLabel?:string;railCollapsed:boolean;onToggleRail:()=>void;onBack?:()=>void;timer:ReactNode;timerDialogOpen:boolean;libraryCollapsed:boolean;onToggleLibrary:()=>void;search?:ReactNode|((close:()=>void)=>ReactNode);clock?:ReactNode;workspaceLabel?:string;environmentBanner?:ReactNode}){
 const[compact,setCompact]=useState(false),[error,setError]=useState(''),[searchOpen,setSearchOpen]=useState(false),[query,setQuery]=useState(''),[optionsOpen,setOptionsOpen]=useState(false),[now,setNow]=useState(()=>new Date());
 const root=useRef<HTMLElement>(null),searchTrigger=useRef<HTMLButtonElement>(null);
 const lastHeaderFocus=useRef<HTMLElement|null>(null),presentedFocus=useRef<HTMLElement|null>(null);
 const timerDialogCurrent=useRef(timerDialogOpen);timerDialogCurrent.current=timerDialogOpen;
 useEffect(()=>{const read=()=>{try{setCompact(readHeaderPreference(store).compact);setError('');}catch{setCompact(false);setError('En-tête non lu ; défaut développé disponible.');}};read();const changed=(event:StorageEvent)=>{if(event.key===null||event.key===HEADER_PREFERENCE_KEY)read();};window.addEventListener('storage',changed);return()=>window.removeEventListener('storage',changed);},[store]);
 useEffect(()=>{const clock=setInterval(()=>setNow(new Date()),30_000);return()=>clearInterval(clock);},[]);
 useEffect(()=>{if(searchOpen&&!timerDialogOpen){(presentedFocus.current&&root.current?.contains(presentedFocus.current)?presentedFocus.current:root.current?.querySelector<HTMLInputElement>('input[role=combobox],#header-demo-search'))?.focus();presentedFocus.current=null;}},[searchOpen,timerDialogOpen]);
 useEffect(()=>{if(optionsOpen&&!timerDialogOpen){(presentedFocus.current&&root.current?.contains(presentedFocus.current)?presentedFocus.current:root.current?.querySelector<HTMLElement>('.aw-header-secondary button'))?.focus();presentedFocus.current=null;}},[optionsOpen,timerDialogOpen]);
 useEffect(()=>{
  const remember=(event:FocusEvent)=>{const target=event.target;if(target instanceof HTMLElement&&target!==document.body)lastHeaderFocus.current=root.current?.contains(target)?target:null;};
  const outside=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))lastHeaderFocus.current=null;};
  const preserve=()=>{
   if(timerDialogOpen)return;
   const target=document.activeElement===document.body?lastHeaderFocus.current:document.activeElement;
   if(!(target instanceof HTMLElement)||!root.current?.contains(target)||target.getClientRects().length)return;
   if(root.current.querySelector('.aw-header-search')?.contains(target)){presentedFocus.current=target;setSearchOpen(true);}
   else if(root.current.querySelector('.aw-header-secondary')?.contains(target)){presentedFocus.current=target;setOptionsOpen(true);}
  };
  document.addEventListener('focusin',remember,true);window.addEventListener('pointerdown',outside,true);window.addEventListener('resize',preserve);
  preserve();
  return()=>{document.removeEventListener('focusin',remember,true);window.removeEventListener('pointerdown',outside,true);window.removeEventListener('resize',preserve);};
 },[compact,timerDialogOpen]);
 useEffect(()=>{if(timerDialogOpen){setSearchOpen(false);setOptionsOpen(false);}},[timerDialogOpen]);
 useEffect(()=>{if(timerDialogOpen){const dialog=root.current?.querySelector<HTMLElement>('.aw-header-timer [role=dialog]');if(!dialog?.contains(document.activeElement))dialog?.querySelector<HTMLElement>('textarea,button')?.focus();}},[compact]);
 function toggle(){const next=!compact;setCompact(next);try{writeHeaderPreference(store,{version:1,compact:next});setError('');}catch{setError('Préférence d’en-tête non mémorisée ; les saisies sont conservées.');}}
 function closeSearch(){setSearchOpen(false);searchTrigger.current?.focus();}
 function openSearch(){setOptionsOpen(false);setSearchOpen(true);requestAnimationFrame(()=>{if(!timerDialogCurrent.current&&root.current?.querySelector('.aw-header-search.is-open'))root.current.querySelector<HTMLInputElement>('input[role=combobox],#header-demo-search')?.focus();});}
 function closeOptions(){setOptionsOpen(false);root.current?.querySelector<HTMLButtonElement>('#header-options-trigger')?.focus();}
 return <header ref={root} className={`aw-workspace-header ${workspaceLabel ? "" : "content-area"} ${compact?'is-compact':''}`} data-header-compact={compact}>
  <div className="aw-header-primary"><AppButton data-shell-presentation aria-label={railCollapsed?'Déployer le rail depuis l’en-tête':'Réduire le rail depuis l’en-tête'} aria-expanded={!railCollapsed} title={railCollapsed?'Déployer la navigation':'Réduire la navigation'} icon={<OperationIcon name={railCollapsed?'rail-open':'rail-close'}/>} onAction={onToggleRail}/><nav className="aw-header-context" aria-label="Contexte de navigation"><BrandLogo/>{onBack ? <AppButton variant="quiet" onAction={onBack}>{moduleLabel}</AppButton> : <strong className="aw-header-module-label">{moduleLabel}</strong>}{recordLabel&&<span>› {recordLabel}</span>}<small>{workspaceLabel ?? "Workspace TEST · Local"}</small></nav>
   <button type="button" ref={searchTrigger} className="aw-header-command" id="header-search-trigger" disabled={timerDialogOpen} aria-expanded={searchOpen} aria-controls="header-search-panel" title="Rechercher dans le Manager" aria-label="Rechercher dans le Manager" onClick={openSearch}><OperationIcon name="search"/></button>
   <section id="header-search-panel" className={`aw-header-search ${searchOpen?'is-open':''}`} role={searchOpen?'dialog':undefined} aria-label={search ? "Recherche globale" : "Recherche de démonstration"} onKeyDown={event=>{if(event.key==='Escape'&&searchOpen){event.preventDefault();event.stopPropagation();closeSearch();}}}>{typeof search === "function" ? search(closeSearch) : search ?? <><label>Recherche TEST<input id="header-demo-search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Aucune donnée cliente interrogée"/></label>{searchOpen&&<><p>Atelier de présentation uniquement. Recherche et routage02C non activés.</p><AppButton onAction={closeSearch}>Fermer la recherche</AppButton></>}</>}</section>
   <div className="aw-header-timer">{timer}</div>
   <AppButton data-shell-presentation id="header-mode" aria-expanded={!compact} aria-label={compact?'Développer l’en-tête':'Compacter l’en-tête'} title={compact?'Développer l’en-tête':'Compacter l’en-tête'} icon={<OperationIcon name={compact?'header-expand':'header-compact'}/>} onAction={toggle}/>
   <AppButton id="header-options-trigger" aria-controls="header-options-panel" aria-expanded={optionsOpen} aria-label="Options de l’en-tête" title="Options de l’en-tête" icon={<OperationIcon name="settings"/>} disabled={timerDialogOpen||searchOpen} onAction={()=>{if(optionsOpen)closeOptions();else setOptionsOpen(true);}}/>
  </div>
  <section id="header-options-panel" className={`aw-header-secondary ${optionsOpen?'is-open':''}`} aria-label="Repères secondaires" onKeyDown={event=>{if(event.key==='Escape'&&optionsOpen){event.preventDefault();event.stopPropagation();closeOptions();}}}>{clock ?? <time dateTime={now.toISOString()}>Heure locale : {now.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</time>}<FieldHelp text="Les commandes restent accessibles." detail="Aucun raccourci global ajouté. Tab, Entrée, Espace et Escape agissent dans leur couche."/>{moduleLabel==='Bibliothèque AtoumWeb'&&<AppButton data-shell-presentation id="header-library" aria-pressed={libraryCollapsed} onAction={onToggleLibrary}>{libraryCollapsed?'Afficher':'Replier'} le bandeau Bibliothèque</AppButton>}</section>
  {environmentBanner}
  {error&&<p role="alert" className="aw-header-error">{error}</p>}
 </header>;
}
