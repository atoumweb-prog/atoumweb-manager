import {useState} from 'react';
import type {ActivityEvent,SearchResult} from '../../shared/crm';
import {AppButton} from '../ui/AppButton';
import {OperationIcon,type OperationIconName} from '../operations/OperationIcon';
import {openEntity} from '../workflow/DossierPanel';
import './client-history-v2.css';

const SOURCES:Record<string,{label:string;icon:OperationIconName}>={
  client:{label:'Client',icon:'users'},prospect:{label:'Prospect',icon:'user'},quote:{label:'Devis',icon:'file-text'},
  project:{label:'Projet',icon:'folder'},intervention:{label:'Intervention',icon:'wrench'},
  service_request:{label:'Demande',icon:'inbox'},maintenance:{label:'Maintenance',icon:'shield-check'},
  hour_pack:{label:'Pack d’heures',icon:'layers'},client_document:{label:'Document client',icon:'file-text'},
  organization:{label:'Entreprise',icon:'users'},contact:{label:'Personne',icon:'contact'},
};
// Only entity types already handled by the Manager's existing navigation.
const DESTINATIONS:Partial<Record<SearchResult['entityType'],string>>={client:'Ouvrir le client',prospect:'Ouvrir le prospect',quote:'Ouvrir le devis',project:'Ouvrir le projet',intervention:'Ouvrir l’intervention',service_request:'Ouvrir la demande',maintenance:'Ouvrir la maintenance',hour_pack:'Ouvrir le pack',client_document:'Ouvrir le document',organization:'Voir l’entreprise',contact:'Voir la personne'};
const source=(type:string)=>Object.hasOwn(SOURCES,type)?SOURCES[type]:{label:type,icon:'clock' as const};
const date=(value:string)=>Number.isFinite(Date.parse(value))?new Date(value).toLocaleString('fr-FR'):value;

export function ClientHistoryTab({clientId,activity,loading,error,onRetry}:{clientId:string;activity:ActivityEvent[];loading:boolean;error?:string;onRetry:()=>void}) {
  const [query,setQuery]=useState(''),[entityType,setEntityType]=useState('');
  const types=[...new Set(activity.map(event=>event.entityType))].sort((a,b)=>source(a).label.localeCompare(source(b).label,'fr'));
  const needle=query.trim().toLocaleLowerCase('fr-FR');
  // Filtering preserves the existing ID-deduplicated, descending chronology unchanged.
  const visible=activity.filter(event=>(!entityType||event.entityType===entityType)&&(!needle||[event.summary,source(event.entityType).label,date(event.createdAt)].some(value=>value.toLocaleLowerCase('fr-FR').includes(needle))));
  const unavailable=loading||!!error;
  return <div className="client-history-tab">
    <header className="client-history-heading"><OperationIcon name="clock"/><div><h3>Historique du client</h3><p>Chronologie des événements enregistrés pour ce client et les prospects associés.</p></div><span className="client-history-count">{unavailable?'—':`${activity.length} événement${activity.length===1?'':'s'}`}</span></header>
    <div className="client-history-toolbar"><label className="client-history-search"><OperationIcon name="search"/><input type="search" aria-label="Rechercher dans l’historique" placeholder="Rechercher dans l’historique…" value={query} onChange={event=>setQuery(event.target.value)}/></label><label>Source<select aria-label="Filtrer l’historique par source" value={entityType} onChange={event=>setEntityType(event.target.value)}><option value="">Toutes les sources</option>{types.map(type=><option value={type} key={type}>{source(type).label}</option>)}</select></label><span className="client-history-readonly"><OperationIcon name="shield-check"/>Consultation seule</span></div>
    {loading?<p role="status">Chargement de l’historique…</p>:error?<div role="alert"><p>Historique indisponible : {error}</p><AppButton onAction={onRetry}>Réessayer</AppButton></div>:!activity.length?<div className="client-history-empty"><h4>Aucun événement enregistré</h4><p>Les événements rattachés à ce client et aux prospects associés apparaîtront ici.</p></div>:!visible.length?<div className="client-history-empty"><h4>Aucun événement correspondant aux filtres</h4><p>Modifiez la recherche ou choisissez « Toutes les sources ».</p></div>:<>
      {(needle||entityType)&&<p className="client-history-results" role="status">{visible.length} événement(s) affiché(s) sur {activity.length}</p>}
      <ol className="client-history-timeline">{visible.map(event=>{
        const origin=source(event.entityType),kind=event.entityType as SearchResult['entityType'];
        const destination=Object.hasOwn(DESTINATIONS,kind)?DESTINATIONS[kind]:undefined;
        const canOpen=!!destination&&!!event.entityId&&!(kind==='client'&&event.entityId===clientId);
        const icon=event.action.startsWith('action_')?'bolt':event.action==='converted_to_client'?'refresh':origin.icon;
        return <li key={event.id} data-event-id={event.id}><article className="client-history-card"><span className="client-history-icon"><OperationIcon name={icon}/></span><div className="client-history-event"><h4>{event.summary}</h4><span className="client-history-source" data-source={event.entityType}>{origin.label}</span></div><div className="client-history-event-tools"><time dateTime={event.createdAt} title={event.createdAt}><OperationIcon name="calendar"/>{date(event.createdAt)}</time>{canOpen&&<AppButton variant="quiet" icon={<OperationIcon name="external-link"/>} onAction={()=>{openEntity({entityType:kind,entityId:event.entityId,title:event.summary});}}>{destination}</AppButton>}</div></article></li>;
      })}</ol>
    </>}
    <aside className="client-history-info"><OperationIcon name="file-check"/><div><h4>À propos de l’historique</h4><p>Cette chronologie affiche les événements enregistrés liés au client et aux prospects associés. Les journaux détaillés des devis, contrats, projets et interventions restent dans leurs modules respectifs. Aucun auteur n’est déduit ; cette vue ne constitue pas une piste d’audit certifiée.</p></div></aside>
  </div>;
}
