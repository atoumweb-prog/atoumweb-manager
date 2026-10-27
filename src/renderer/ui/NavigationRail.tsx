import {BrandMark,BrandLogo} from './BrandMark';
import {useEffect,useLayoutEffect,useRef,useState,useImperativeHandle,type Ref,type CSSProperties} from 'react';
import {NAVIGATION_MODULES,NAVIGATION_GROUPS,defaultNavigationPreference,moveFavorite,readNavigationPreference,writeNavigationPreference,type NavigationModule,type NavigationModuleKey,type NavigationGroup,type NavigationPreference} from '../../shared/navigationRail';
import type {VisualPreferenceStore} from '../../shared/panelLayout';
import {OperationIcon} from '../operations/OperationIcon';
import './navigation-rail.css';
function ModuleIcon({module}:{module:NavigationModule}){return <OperationIcon name={module.icon}/>;}
export interface NavigationRailControls{toggle:()=>void}
export function NavigationRail({active,onNavigate,store,confirmReset,controlsRef,onCollapsedChange,appVersion}:{active:NavigationModuleKey;onNavigate:(key:NavigationModuleKey)=>boolean;store:VisualPreferenceStore;confirmReset:()=>boolean;controlsRef?:Ref<NavigationRailControls>;onCollapsedChange?:(value:boolean)=>void;appVersion?:string}){
 const [preference,setPreference]=useState<NavigationPreference>(defaultNavigationPreference),latest=useRef(preference),[temporary,setTemporary]=useState<true|null>(null),[openGroup,setOpenGroup]=useState<NavigationGroup|null>(null),[error,setError]=useState('');
 const root=useRef<HTMLElement>(null),trigger=useRef<HTMLButtonElement|null>(null),flyout=useRef<HTMLElement>(null);
 const [flyoutStyle,setFlyoutStyle]=useState<CSSProperties>({});
 const collapsed=temporary??preference.railCollapsed;
 // Keep the menu below the real header instead of covering its search/timer.
 // Measure again when that header wraps, the window zooms, or the rail scrolls.
 useLayoutEffect(()=>{
  if(!openGroup||!collapsed)return;
  const header=document.querySelector<HTMLElement>('.aw-workspace-header');
  const position=()=>{
   if(!root.current||!flyout.current)return;
   const gap=8,rail=root.current.getBoundingClientRect(),anchor=trigger.current?.getBoundingClientRect();
   const minimumTop=Math.max(gap,(header?.getBoundingClientRect().bottom??0)+gap);
   const available=Math.max(0,window.innerHeight-minimumTop-gap);
   const menuHeight=Math.min(flyout.current.scrollHeight+2,available);
   const top=Math.max(minimumTop,Math.min(anchor?.top??minimumTop,window.innerHeight-menuHeight-gap));
   setFlyoutStyle({left:rail.right,top,width:Math.min(350,Math.max(0,window.innerWidth-rail.right-gap)),maxHeight:Math.max(0,window.innerHeight-top-gap)});
  };
  position();
  const observer=new ResizeObserver(position);observer.observe(root.current!);if(header)observer.observe(header);
  window.addEventListener('resize',position);window.addEventListener('scroll',position,true);
  return()=>{observer.disconnect();window.removeEventListener('resize',position);window.removeEventListener('scroll',position,true);};
 },[openGroup,collapsed]);
 useEffect(()=>{const read=()=>{try{const next=readNavigationPreference(store);latest.current=next;setPreference(next);setError('');}catch{const next=defaultNavigationPreference();latest.current=next;setPreference(next);setError('Navigation non lue ; défaut sûr affiché.');}};read();const external=(event:StorageEvent)=>{if(event.key===null||event.key==='atoumweb:navigation:rail:v1')read();};window.addEventListener('storage',external);return()=>window.removeEventListener('storage',external);},[store]);
 useEffect(()=>{const contextual=(event:Event)=>{const value=(event as CustomEvent<unknown>).detail;if(typeof value==='boolean')setTemporary(value?true:null);};window.addEventListener('atoumweb:sidebar-collapse',contextual);return()=>window.removeEventListener('atoumweb:sidebar-collapse',contextual);},[]);
 useEffect(()=>{if(!openGroup)return;root.current?.querySelector<HTMLButtonElement>('.aw-rail-flyout .aw-rail-destination')?.focus();const outside=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node)){setOpenGroup(null);trigger.current?.focus();}};window.addEventListener('pointerdown',outside);return()=>window.removeEventListener('pointerdown',outside);},[openGroup]);
 function update(next:NavigationPreference){latest.current=next;setPreference(next);try{writeNavigationPreference(store,next);setError('');}catch{setError('Préférences de navigation non mémorisées ; les brouillons sont conservés.');}}
 function toggle(){update({...latest.current,railCollapsed:!collapsed});setTemporary(null);setOpenGroup(null);}
 useImperativeHandle(controlsRef,()=>({toggle}));
 useEffect(()=>onCollapsedChange?.(collapsed),[collapsed,onCollapsedChange]);
 function pin(key:NavigationModuleKey){const current=latest.current;update({...current,favoriteModuleKeys:current.favoriteModuleKeys.includes(key)?current.favoriteModuleKeys.filter(value=>value!==key):[...current.favoriteModuleKeys,key]});}
 function close(){setOpenGroup(null);trigger.current?.focus();}
 function destination(module:NavigationModule,context:'home'|'favorite'|'group'){
  const pinned=preference.favoriteModuleKeys.includes(module.key);
  return <div key={module.key} className="aw-rail-row"><button type="button" className="aw-rail-destination" data-nav-module={module.key} data-nav-context={context} aria-label={module.label} title={module.label} aria-current={active===module.key?'page':undefined} onClick={()=>{if(onNavigate(module.key))setOpenGroup(null);}}><ModuleIcon module={module}/><span className={collapsed&&context!=='group'?'aw-rail-sr-only':''}>{module.label}</span>{active===module.key&&<span aria-hidden="true" className="aw-rail-active-mark">●</span>}</button>
   {context==='group'&&<button type="button" className="aw-rail-pin" aria-label={`${pinned?'Désépingler':'Épingler'} ${module.label}`} aria-pressed={pinned} onClick={()=>pin(module.key)}>{pinned?'★':'☆'}</button>}
  </div>;
 }
 return <aside ref={root} className={`aw-navigation-rail ${collapsed?'is-collapsed':''}`} data-rail-collapsed={collapsed} data-rail-contextual={temporary===true} aria-label="Navigation principale" onKeyDown={event=>{if(openGroup&&event.key==='Escape'){event.preventDefault();event.stopPropagation();close();}else if(openGroup&&['ArrowDown','ArrowUp','Home','End'].includes(event.key)){const buttons=[...root.current!.querySelectorAll<HTMLButtonElement>('.aw-rail-flyout .aw-rail-destination')];const index=buttons.indexOf(document.activeElement as HTMLButtonElement);event.preventDefault();buttons[event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length]?.focus();}}}>
  <div className="aw-rail-brand" title={appVersion ? `Atoum Manager ${appVersion}` : 'Atoum Manager'}>{collapsed?<BrandMark/>:<BrandLogo homeReference={active==='Accueil'||active==='Prospects'}/>}</div>
  <button type="button" data-shell-presentation className="aw-rail-toggle" aria-expanded={!collapsed} aria-label={collapsed?'Déployer la navigation':'Réduire la navigation'} onClick={toggle}><OperationIcon name={collapsed?'rail-open':'rail-close'}/>{!collapsed&&'Réduire'}</button>
  <div className="aw-rail-scroll"><nav aria-label="Accueil et favoris">{destination(NAVIGATION_MODULES[0],'home')}{!!preference.favoriteModuleKeys.length&&!collapsed&&<h2>Favoris</h2>}{preference.favoriteModuleKeys.map(key=>destination(NAVIGATION_MODULES.find(module=>module.key===key)!,'favorite'))}</nav>
   <nav aria-label="Cinq groupes de navigation">{NAVIGATION_GROUPS.map((group,index)=><section key={group} className="aw-rail-group">{collapsed?<button type="button" data-nav-group={group} className="aw-rail-group-trigger" aria-label={`Groupe ${group}`} aria-expanded={openGroup===group} data-group-active={NAVIGATION_MODULES.find(module=>module.key===active)?.group===group} onClick={event=>{trigger.current=event.currentTarget;setOpenGroup(value=>value===group?null:group);}}><OperationIcon name={(['users','folder','receipt','layers','settings'] as const)[index]}/><span className="aw-rail-sr-only">{group}</span></button>:<button type="button" className="aw-rail-group-heading" aria-expanded={!preference.collapsedGroups?.includes(group)} aria-controls={`rail-group-${index}`} onClick={()=>update({...latest.current,collapsedGroups:latest.current.collapsedGroups?.includes(group)?latest.current.collapsedGroups.filter(value=>value!==group):[...(latest.current.collapsedGroups??[]),group]})}>{group}<OperationIcon name={preference.collapsedGroups?.includes(group)?'chevron-down':'chevron-up'}/></button>}<div id={`rail-group-${index}`} hidden={collapsed||preference.collapsedGroups?.includes(group)}>{!collapsed&&NAVIGATION_MODULES.filter(module=>module.group===group).map(module=>destination(module,'group'))}</div></section>)}</nav>
   {!collapsed&&!!preference.favoriteModuleKeys.length&&<details className="aw-rail-favorites-editor"><summary>Organiser les favoris</summary>{preference.favoriteModuleKeys.map((key,index)=><div key={key}><span>{NAVIGATION_MODULES.find(module=>module.key===key)!.label}</span><button type="button" aria-label={`Monter ${key}`} disabled={index===0} onClick={()=>update({...latest.current,favoriteModuleKeys:moveFavorite(latest.current.favoriteModuleKeys,key,-1)})}>↑</button><button type="button" aria-label={`Descendre ${key}`} disabled={index===preference.favoriteModuleKeys.length-1} onClick={()=>update({...latest.current,favoriteModuleKeys:moveFavorite(latest.current.favoriteModuleKeys,key,1)})}>↓</button><button type="button" aria-label={`Retirer le favori ${key}`} onClick={()=>pin(key)}><OperationIcon name="close"/></button></div>)}<button type="button" disabled={!preference.favoriteModuleKeys.length} onClick={()=>{if(confirmReset())update({...latest.current,favoriteModuleKeys:[]});}}>Réinitialiser les favoris</button></details>}
  </div>
  {error&&<p className="aw-rail-error" role="alert">{error}</p>}
  {openGroup&&collapsed&&<section ref={flyout} style={flyoutStyle} className="aw-rail-flyout" role="dialog" aria-label={`Modules ${openGroup}`}><header><h2>{openGroup}</h2><button type="button" aria-label="Fermer le groupe" onClick={close}><OperationIcon name="close"/></button></header>{NAVIGATION_MODULES.filter(module=>module.group===openGroup).map(module=>destination(module,'group'))}</section>}
 </aside>;
}
