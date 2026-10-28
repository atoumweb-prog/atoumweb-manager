import {useEffect,useRef,useState} from 'react';
import type {OperationsAlert} from '../../shared/operationsAlerts';
import {OperationIcon} from '../operations/OperationIcon';
import {openEntity} from '../workflow/DossierPanel';

/** Existing operational alerts, read only. Navigation keeps the App/UX01 guard. */
export function HeaderAlerts({disabled,contextKey}:{disabled:boolean;contextKey:string}){
 const [open,setOpen]=useState(false),[alerts,setAlerts]=useState<OperationsAlert[]|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(false);
 const root=useRef<HTMLDivElement>(null),button=useRef<HTMLButtonElement>(null),generation=useRef(0);
 function close(focus=true){generation.current++;setLoading(false);setOpen(false);if(focus)button.current?.focus();}
 async function load(){const token=++generation.current;setLoading(true);setError('');try{const result=await window.atoumweb.operationsAlerts.get();if(token===generation.current)setAlerts(result.alerts);}catch(e){if(token===generation.current)setError(e instanceof Error?e.message:'Alertes indisponibles.');}finally{if(token===generation.current)setLoading(false);}}
 useEffect(()=>{generation.current++;setAlerts(null);setOpen(false);void load();const refresh=()=>void load();window.addEventListener('atoumweb:changed',refresh);return()=>{generation.current++;window.removeEventListener('atoumweb:changed',refresh);};},[contextKey]);
 useEffect(()=>{if(disabled)close(false);},[disabled]);
 useEffect(()=>{if(!open)return;root.current?.querySelector<HTMLButtonElement>('[role=dialog] button')?.focus();const outside=(e:PointerEvent)=>{if(!root.current?.contains(e.target as Node))close(false);};document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside);},[open]);
 function visit(alert:OperationsAlert){close();if(alert.interventionId)openEntity({entityType:'intervention',entityId:alert.interventionId,title:alert.title});else if(alert.hourPackId)openEntity({entityType:'hour_pack',entityId:alert.hourPackId,title:alert.title});else if(alert.maintenanceSubscriptionId)openEntity({entityType:'maintenance',entityId:alert.maintenanceSubscriptionId,title:alert.title});else window.dispatchEvent(new CustomEvent('atoumweb:open-page',{detail:'Interventions & Maintenance'}));}
 return <div ref={root} className="aw-header-alerts" onKeyDown={e=>{if(open&&e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}}}>
  <button ref={button} type="button" id="header-alerts-trigger" className="aw-header-command" aria-label="Alertes opérationnelles" title="Alertes opérationnelles" aria-expanded={open} aria-controls="header-alerts-panel" disabled={disabled} onClick={()=>{if(open)close();else{setOpen(true);void load();}}}><OperationIcon name="bell"/>{!error&&alerts!==null&&alerts.length>0&&<span className="aw-header-alert-count">{alerts.length}</span>}</button>
  {open&&<section id="header-alerts-panel" role="dialog" aria-label="Alertes opérationnelles" aria-busy={loading}><header><strong>Alertes opérationnelles</strong><button type="button" aria-label="Fermer les alertes" onClick={()=>close()}><OperationIcon name="close"/></button></header>{loading&&<p role="status">Chargement…</p>}{error?<p role="alert">{error}<button type="button" onClick={()=>void load()}>Réessayer</button></p>:!loading&&alerts?.length===0?<p>Aucune alerte opérationnelle signalée.</p>:!loading&&alerts?.map(alert=><button type="button" className="aw-header-alert-item" key={alert.id} onClick={()=>visit(alert)}><OperationIcon name="alert"/><span><strong>{alert.title}</strong><small>{alert.detail}</small></span></button>)}</section>}
 </div>;
}
