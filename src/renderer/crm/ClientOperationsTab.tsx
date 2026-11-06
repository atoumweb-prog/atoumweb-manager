import {useEffect, useRef, useState, type ReactNode} from 'react';
import type {HourPack, Intervention, MaintenanceSubscription, MaintenancePeriod, ServiceRequest, InterventionStatus, HourPackStatus, MaintenanceSubscriptionStatus, MaintenancePeriodStatus, ServiceRequestStatus, ServiceRequestSource} from '../../shared/operations';
import type {SearchResult} from '../../shared/crm';
import {OperationIcon, type OperationIconName} from '../operations/OperationIcon';
import {AppButton} from '../ui/AppButton';
import {openEntity} from '../workflow/DossierPanel';
import './ClientOperationsTab.css';

const INTERVENTION_LABELS:Record<InterventionStatus,string>={to_plan:'À planifier',planned:'Planifiée',in_progress:'En cours',waiting_client:'En attente client',blocked:'Bloquée',to_validate:'À valider',completed:'Terminée',cancelled:'Annulée',archived:'Archivée'};
const PACK_LABELS:Record<HourPackStatus,string>={active:'Actif',exhausted:'Épuisé',expired:'Expiré',suspended:'Suspendu',archived:'Archivé'};
const MAINTENANCE_LABELS:Record<MaintenanceSubscriptionStatus,string>={active:'Active',suspended:'Suspendue',ended:'Terminée',archived:'Archivée'};
const PERIOD_LABELS:Record<MaintenancePeriodStatus,string>={upcoming:'À venir',open:'Ouverte',to_do:'À faire',in_progress:'En cours',completed:'Terminée',closed:'Clôturée'};
const REQUEST_LABELS:Record<ServiceRequestStatus,string>={new:'Nouveau',to_qualify:'À qualifier',waiting_client:'En attente client',planned:'Planifié',converted:'Transformé',closed:'Clos sans intervention',archived:'Archivé'};
const SOURCE_LABELS:Record<ServiceRequestSource,string>={email:'Email',phone:'Téléphone',website_form:'Formulaire site',message:'Message',meeting:'Réunion',atoumweb_detection:'Détection AtoumWeb',other:'Autre'};
const CATEGORIES=[{id:'interventions',label:'Interventions',icon:'wrench'},{id:'maintenance',label:'Maintenances',icon:'shield-check'},{id:'packs',label:'Packs d’heures',icon:'layers'},{id:'requests',label:'Demandes',icon:'inbox'}] as const;
type Category=typeof CATEGORIES[number]['id'];
function duration(seconds:number):string {const minutes=Math.max(0,Math.round(seconds/60)),hours=Math.floor(minutes/60);return hours?`${hours} h ${String(minutes%60).padStart(2,'0')}`:`${minutes} min`;}
function date(value?:string|null):string|null {return value&&Number.isFinite(Date.parse(value))?new Date(value).toLocaleDateString('fr-FR'):null;}
function DateInfo({label,value}:{label:string;value?:string|null}) {return date(value)?<span><OperationIcon name="calendar"/>{label} : {date(value)}</span>:null;}

// Presentation counts only: pack availability is already derived by HourPackService.
export function clientOperationCounts(interventions:ReadonlyArray<Pick<Intervention,'status'|'archivedAt'>>,packs:ReadonlyArray<Pick<HourPack,'status'|'archivedAt'>>) {
  return {
    inProgress:interventions.filter(item=>item.status==='in_progress'&&!item.archivedAt).length,
    toPlan:interventions.filter(item=>item.status==='to_plan'&&!item.archivedAt).length,
    completed:interventions.filter(item=>item.status==='completed').length,
    activePacks:packs.filter(item=>item.status==='active'&&!item.archivedAt).length,
  };
}

export function ClientOperationsTab({clientId,onMessage}:{clientId:string;onMessage:(message:string)=>void}) {
  const [requests,setRequests]=useState<ServiceRequest[]>([]),[interventions,setInterventions]=useState<Intervention[]>([]);
  const [maintenance,setMaintenance]=useState<MaintenanceSubscription[]>([]),[packs,setPacks]=useState<HourPack[]>([]);
  const [periods,setPeriods]=useState<Record<string,MaintenancePeriod[]>>({}),[periodErrors,setPeriodErrors]=useState<string[]>([]);
  const [view,setView]=useState<'all'|Category>('all'),[loading,setLoading]=useState(true),[error,setError]=useState('');
  const generation=useRef(0);
  async function load():Promise<void> {
    const current=++generation.current;setLoading(true);setError('');setPeriodErrors([]);
    try {
      const [nextRequests,nextInterventions,nextMaintenance,nextPacks]=await Promise.all([
        window.atoumweb.operations.requests.list({clientAccountId:clientId,includeArchived:true}),
        window.atoumweb.operations.interventions.list({clientAccountId:clientId,includeArchived:true}),
        window.atoumweb.operations.maintenance.subscriptions.list({clientAccountId:clientId,includeArchived:true}),
        window.atoumweb.operations.hourPacks.list({clientAccountId:clientId,includeArchived:true}),
      ]);
      if(current!==generation.current)return;
      const results=await Promise.allSettled(nextMaintenance.map(item=>window.atoumweb.operations.maintenance.periods.list(item.id)));
      if(current!==generation.current)return;
      const nextPeriods:Record<string,MaintenancePeriod[]>={},failures:string[]=[];
      results.forEach((result,index)=>{const item=nextMaintenance[index];if(result.status==='fulfilled')nextPeriods[item.id]=result.value;else failures.push(item.planName);});
      setRequests(nextRequests);setInterventions(nextInterventions);setMaintenance(nextMaintenance);setPacks(nextPacks);setPeriods(nextPeriods);setPeriodErrors(failures);
    } catch(reason) {
      if(current!==generation.current)return;
      const message=reason instanceof Error?reason.message:'Impossible de charger les opérations de ce client.';setError(message);onMessage(message);
    } finally {if(current===generation.current)setLoading(false);}
  }
  useEffect(()=>{setView('all');void load();return()=>{generation.current++;};},[clientId]);
  const counts={interventions:interventions.length,maintenance:maintenance.length,packs:packs.length,requests:requests.length};
  const indicators=clientOperationCounts(interventions,packs);
  const unavailable=loading||!!error;
  const show=(category:Category)=>view===category||(view==='all'&&counts[category]>0);
  return <div className="client-operations-tab">
    <header className="client-operations-heading"><OperationIcon name="wrench"/><div><h3>Interventions et maintenance</h3><p>Suivi opérationnel des interventions, maintenances et packs d’heures du client.</p></div><span className="client-operations-count">{unavailable?'—':`${interventions.length} intervention${interventions.length===1?'':'s'} · ${packs.length} pack${packs.length===1?'':'s'}`}</span></header>
    <div className="client-operations-kpis" aria-label="Situation des interventions">
      <OperationKpi icon="wrench" label="En cours" value={unavailable?'—':String(indicators.inProgress)}/>
      <OperationKpi icon="calendar" label="À planifier" value={unavailable?'—':String(indicators.toPlan)}/>
      <OperationKpi icon="check-circle" label="Terminées" value={unavailable?'—':String(indicators.completed)}/>
      <OperationKpi icon="layers" label="Packs actifs" value={unavailable?'—':String(indicators.activePacks)}/>
    </div>
    <nav className="client-operations-navigation" aria-label="Catégories opérationnelles">
      <AppButton variant={view==='all'?'primary':'secondary'} aria-pressed={view==='all'} onAction={()=>setView('all')}>Vue d’ensemble</AppButton>
      {CATEGORIES.map(category=><AppButton key={category.id} variant={view===category.id?'primary':'secondary'} aria-pressed={view===category.id} icon={<OperationIcon name={category.icon}/>} onAction={()=>setView(category.id)}>{category.label}{!unavailable&&` (${counts[category.id]})`}</AppButton>)}
    </nav>
    {loading?<p role="status">Chargement des interventions du client…</p>:error?<div role="alert"><p>Opérations indisponibles : {error}</p><AppButton onAction={()=>load()}>Réessayer</AppButton></div>:<>
      {view==='all'&&!Object.values(counts).some(Boolean)&&<p className="client-operations-empty">Aucune opération rattachée à ce client. Les quatre catégories restent accessibles ci-dessus.</p>}
      {show('interventions')&&<OperationSection id="interventions" icon="wrench" title="Interventions" count={interventions.length} empty="Aucune intervention enregistrée.">
        {interventions.map(item=><OperationCard key={item.id} target={{entityType:'intervention',entityId:item.id,title:item.subject}} icon="wrench" title={`${item.number} — ${item.subject}`} status={item.status} statusLabel={INTERVENTION_LABELS[item.status]}>
          <span><OperationIcon name="folder"/>{item.projectLabel||'Sans projet'}{item.projectNodeLabel&&` · ${item.projectNodeLabel}`}</span><span><OperationIcon name="clock"/>Temps enregistré : {duration(item.totalTimeSeconds)}</span>
          <DateInfo label="Prévue" value={item.scheduledAt}/><DateInfo label="Démarrée" value={item.startedAt}/><DateInfo label="Terminée" value={item.completedAt}/>
          {item.sourceRequestId&&<OriginLink type="service_request" id={item.sourceRequestId} title="Demande d’origine"/>}{item.hourPackId&&<OriginLink type="hour_pack" id={item.hourPackId} title="Pack lié"/>}
          {item.maintenancePeriodId&&Object.entries(periods).filter(([,items])=>items.some(period=>period.id===item.maintenancePeriodId)).map(([id])=><OriginLink key={id} type="maintenance" id={id} title="Maintenance liée"/>)}
        </OperationCard>)}
      </OperationSection>}
      {show('maintenance')&&<OperationSection id="maintenance" icon="shield-check" title="Maintenances" count={maintenance.length} empty="Aucune souscription de maintenance.">
        {maintenance.length>0&&<p className="client-operations-section-note">{maintenance.filter(item=>item.status==='active'&&!item.archivedAt).length} souscription(s) au statut Actif · toutes les souscriptions sont consultables ci-dessous.</p>}
        {periodErrors.length>0&&<div role="alert">Périodes indisponibles : {periodErrors.join(', ')}. <AppButton onAction={()=>load()}>Réessayer</AppButton></div>}
        {maintenance.map(item=><OperationCard key={item.id} target={{entityType:'maintenance',entityId:item.id,title:item.planName}} icon="shield-check" title={item.planName} status={item.status} statusLabel={MAINTENANCE_LABELS[item.status]}>
          <span><OperationIcon name="folder"/>{item.projectLabel||'Sans projet dédié'}</span><span>{item.includedInterventions} intervention(s) incluse(s) par période</span>
          {periods[item.id]&&<details className="client-operation-periods"><summary>Périodes opérationnelles ({periods[item.id].length})</summary>{!periods[item.id].length?<p>Aucune période enregistrée.</p>:periods[item.id].map(period=><div key={period.id}><span>{date(period.periodStart)} → {date(period.periodEnd)} · {PERIOD_LABELS[period.status]}</span><span>Temps enregistré : {duration(period.usage.usedSeconds)} · {period.usage.interventionCount} intervention(s)</span></div>)}</details>}
        </OperationCard>)}
      </OperationSection>}
      {show('packs')&&<OperationSection id="packs" icon="layers" title="Packs d’heures" count={packs.length} empty="Aucun pack d’heures.">
        {packs.map(item=><OperationCard key={item.id} target={{entityType:'hour_pack',entityId:item.id,title:item.name}} icon="layers" title={item.name} status={item.status} statusLabel={PACK_LABELS[item.status]}>
          <span><OperationIcon name="folder"/>{item.projectLabel||'Sans projet dédié'}</span><span><OperationIcon name="clock"/>{duration(item.balanceSeconds)} restantes</span><span>Consommation du pack : {duration(item.consumedSeconds)}</span><DateInfo label="Expiration" value={item.expiresAt}/>
        </OperationCard>)}
      </OperationSection>}
      {show('requests')&&<OperationSection id="requests" icon="inbox" title="Demandes" count={requests.length} empty="Aucune demande enregistrée.">
        {requests.map(item=><OperationCard key={item.id} target={{entityType:'service_request',entityId:item.id,title:item.subject}} icon="inbox" title={item.subject} status={item.status} statusLabel={REQUEST_LABELS[item.status]}>
          <span><OperationIcon name="folder"/>{item.projectLabel||'Sans projet'}</span><span>Origine : {SOURCE_LABELS[item.source]}</span><DateInfo label="Reçue" value={item.receivedAt}/><DateInfo label="Prochaine action" value={item.nextActionAt}/>{item.interventionId&&<OriginLink type="intervention" id={item.interventionId} title="Intervention liée"/>}
        </OperationCard>)}
      </OperationSection>}
    </>}
    <aside className="client-operations-info"><OperationIcon name="file-check"/><div><h4>À propos des interventions</h4><p>Le temps affiché est le temps réellement enregistré. Statuts, chronomètres, estimations et comptes rendus restent gérés dans les dossiers opérationnels. Les engagements et prix contractuels restent dans Contrats.</p></div></aside>
    <AppButton className="client-operations-refresh" icon={<OperationIcon name="refresh"/>} onAction={()=>load()} disabled={loading}>Actualiser</AppButton>
  </div>;
}
function OperationKpi({icon,label,value}:{icon:OperationIconName;label:string;value:string}) {return <div className="client-operation-kpi"><OperationIcon name={icon}/><strong>{value}</strong><span>{label}</span></div>;}
function OriginLink({type,id,title}:{type:SearchResult['entityType'];id:string;title:string}) {return <AppButton variant="quiet" onAction={()=>{openEntity({entityType:type,entityId:id,title});}}>{title}</AppButton>;}
function OperationCard({target,icon,title,status,statusLabel,children}:{target:SearchResult;icon:OperationIconName;title:string;status:string;statusLabel:string;children:ReactNode}) {return <article className="client-operation-card" data-operation-id={target.entityId}><OperationIcon name={icon}/><div className="client-operation-content"><h5>{title}</h5><div className="client-operation-meta">{children}</div></div><span className="client-operation-status" data-status={status}>{statusLabel}</span><AppButton icon={<OperationIcon name="external-link"/>} onAction={()=>{openEntity(target);}}>Ouvrir</AppButton></article>;}
function OperationSection({id,icon,title,count,empty,children}:{id:Category;icon:OperationIconName;title:string;count:number;empty:string;children:ReactNode}) {return <section className="client-operation-section" data-operation-category={id}><h4><OperationIcon name={icon}/>{title} ({count})</h4>{count?children:<p className="client-operations-empty">{empty}</p>}</section>;}
