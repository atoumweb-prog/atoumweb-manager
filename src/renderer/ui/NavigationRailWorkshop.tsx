import {useEffect,useRef,useState} from 'react';
import {isNavigationModuleKey,type NavigationModuleKey} from '../../shared/navigationRail';
import type {VisualPreferenceStore} from '../../shared/panelLayout';
import {NavigationRail} from './NavigationRail';
import {UnsavedGroup,useUnsavedDraft,requestUnsavedExit,installUnsavedLifecycleBridge} from '../unsaved/unsaved';
import {AppTextField} from './AppTextField';
import {AppButton} from './AppButton';
import {RecordPane} from './RecordPane';
function DemoEditor({module,pending}:{module:NavigationModuleKey;pending:boolean}){
 const [note,setNote]=useState(''),[expanded,setExpanded]=useState(false),[closed,setClosed]=useState(false),token=useRef(crypto.randomUUID());useUnsavedDraft(`Note TEST ${module}`,note,{pending,discard:setNote});
 if(closed)return <AppButton onAction={()=>setClosed(false)}>Rouvrir la fiche fictive</AppButton>;
 return <div className={`aw-rail-demo-detail ${expanded?'is-expanded':''}`}><RecordPane title={`Fiche fictive — ${module}`} expanded={expanded} onExpand={()=>setExpanded(value=>!value)} onClose={()=>requestUnsavedExit(()=>{setExpanded(false);setClosed(true);},`rail-demo:${module}`)}><section data-editor-instance={token.current} data-editor-module={module}><AppTextField id="rail-demo-note" label="Brouillon fictif" value={note} onChange={event=>setNote(event.target.value)}/><p>Aucune sauvegarde métier dans cet atelier.</p></section></RecordPane></div>;
}
function DemoTimer(){const started=useRef(Date.now()),token=useRef(crypto.randomUUID()),[tick,setTick]=useState(0);useEffect(()=>{const timer=setInterval(()=>setTick(Math.floor((Date.now()-started.current)/1000)),500);return()=>clearInterval(timer);},[]);return <div className="aw-rail-fixture-timer" data-timer-instance={token.current} data-timer-seconds={tick}>Chrono TEST simulé : {tick}s · reste monté hors des destinations</div>;}
export function NavigationRailWorkshop({store,confirmReset}:{store:VisualPreferenceStore;confirmReset:()=>boolean}){
 const [module,setModule]=useState<NavigationModuleKey>('Accueil'),[pending,setPending]=useState(false);const active=useRef(module);active.current=module;
 useEffect(()=>installUnsavedLifecycleBridge(),[]);
 function navigate(key:NavigationModuleKey){if(key===active.current)return true;return requestUnsavedExit(()=>{setModule(key);setPending(false);},`rail-demo:${active.current}`);}
 useEffect(()=>{const open=(event:Event)=>{const key=(event as CustomEvent<unknown>).detail;if(isNavigationModuleKey(key))navigate(key);};window.addEventListener('atoumweb:open-page',open);return()=>window.removeEventListener('atoumweb:open-page',open);},[]);
 return <div className="aw-rail-workshop"><NavigationRail active={module} onNavigate={navigate} store={store} confirmReset={confirmReset}/><main className="aw-rail-content content-area"><header className="aw-rail-fixture-header"><h1>Atelier 02A — {module}</h1><DemoTimer/></header><p>Navigation TEST, 17 clés existantes. Logo et nouveaux pictogrammes : emplacements réservés, non approuvés. Aucun service client réel.</p><section className="aw-rail-test-tools"><AppButton onAction={()=>{window.dispatchEvent(new CustomEvent('atoumweb:sidebar-collapse',{detail:true}));}}>Demande Projet : réduire temporairement</AppButton><AppButton onAction={()=>{window.dispatchEvent(new CustomEvent('atoumweb:sidebar-collapse',{detail:false}));}}>Libérer la demande Projet</AppButton><label><input id="rail-demo-pending" type="checkbox" checked={pending} onChange={event=>setPending(event.target.checked)}/>Simuler pending TEST</label></section><UnsavedGroup name={`rail-demo:${module}`}><DemoEditor key={module} module={module} pending={pending}/></UnsavedGroup></main></div>;
}
