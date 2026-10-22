import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import {HomeResourceLoad,type ResourceSnapshot} from '../../shared/homeResourceLoad';
import {HOME_WIDGET_PREFERENCE_KEY,HOME_WIDGET_KEYS,defaultHomeWidgets,normalizeHomeWidgets,moveHomeWidget,dropHomeWidget,type HomeWidgetKey,type HomeWidgetPreference} from '../../shared/homeWidgetPreference';
import {AppNotice} from '../ui/AppNotice';
import {AppButton} from '../ui/AppButton';
import type { BillingItem } from '../../shared/billing';
import type { QuoteSummary } from '../../shared/commercial';
import {projectPipeline,withCurrentQuoteSignal} from '../../shared/prospectPipelineProjection';
import type { CrmAction, ProspectSummary, SearchResult } from '../../shared/crm';
import type { Intervention } from '../../shared/operations';
import type { OperationsAlert, OperationsAlertsSnapshot } from '../../shared/operationsAlerts';
import type { ProjectSummary } from '../../shared/projects';
import type { TimeSummary } from '../../shared/time';
import type { DashboardEntry } from '../../shared/workflow';
import { openEntity } from '../workflow/DossierPanel';
import { OperationIcon, type OperationIconName } from '../operations/OperationIcon';
import './HomeDashboard.css';
import './HomeDashboardV2.css';

type HomePageName = 'Prospects' | 'Devis' | 'Projets' | 'Interventions & Maintenance' | 'Gestion des temps' | 'Facturation';

interface HomeData {
  entries: DashboardEntry[];
  prospects: ProspectSummary[];
  quotes: QuoteSummary[];
  actions: CrmAction[];
  projects: ProjectSummary[];
  interventions: Intervention[];
  time: TimeSummary;
  billing: BillingItem[];
  alerts: OperationsAlertsSnapshot;
}

interface PipelineItem {
  key: string;
  label: string;
  count: number;
  tone: string;
  historical?: boolean;
}

const EMPTY_TIME: TimeSummary = { totalSeconds: 0, billableSeconds: 0, nonBillableSeconds: 0, sessionCount: 0 };

function openPage(page: HomePageName): void {
  window.dispatchEvent(new CustomEvent('atoumweb:open-page', { detail: page }));
}

function openProspectPipeline(filter: 'all' | 'relaunch' | 'overdue' = 'all'): void {
  window.dispatchEvent(new CustomEvent('atoumweb:open-prospects-view', { detail: { view: 'pipeline', pipelineFilter: filter } }));
}

function money(cents: number): string {
  return `${(cents / 100).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €`;
}

function hours(seconds: number): string {
  const value = seconds / 3600;
  if (value === 0) return '0 h';
  return `${value.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} h`;
}

function alertTarget(alert: OperationsAlert): SearchResult | null {
  if (alert.interventionId) return { entityType: 'intervention', entityId: alert.interventionId, title: alert.title };
  if (alert.hourPackId) return { entityType: 'hour_pack', entityId: alert.hourPackId, title: alert.title };
  if (alert.maintenanceSubscriptionId) return { entityType: 'maintenance', entityId: alert.maintenanceSubscriptionId, title: alert.title };
  return null;
}

function targetIcon(target: SearchResult): OperationIconName {
  switch (target.entityType) {
    case 'prospect': return 'user';
    case 'quote': return 'file-text';
    case 'project': return 'folder';
    case 'service_request':
    case 'intervention':
    case 'maintenance':
    case 'hour_pack': return 'wrench';
    default: return 'calendar';
  }
}

export function HomeDashboard({ onMessage }: { onMessage: (message: string) => void }) {
  const loader=useMemo(()=>new HomeResourceLoad<HomeData>(),[]);
  const [resources,setResources]=useState<Partial<ResourceSnapshot<HomeData>>>({});
  const data=useMemo(()=>Object.fromEntries(Object.entries(resources).filter(([,resource])=>resource.value!==undefined).map(([key,resource])=>[key,resource.value])) as Partial<HomeData>,[resources]);
  const [preference,setPreference]=useState(defaultHomeWidgets),[preferenceError,setPreferenceError]=useState('');
  const widgetLabels:Record<HomeWidgetKey,string>={today:'Aujourd’hui',kpis:'Indicateurs',pipeline:'Pipeline commercial',time:'Temps & facturation',watch:'À surveiller',actions:'Projets récents'};
  const sourceLabels:Record<keyof HomeData,string>={entries:'Dossiers du jour',prospects:'Prospects',quotes:'Devis du pipeline',actions:'Relances',projects:'Projets',interventions:'Interventions',time:'Temps du mois',billing:'Éléments à facturer',alerts:'Alertes opérationnelles'};
  const loading=Object.keys(resources).length===0||Object.values(resources).some(source=>source.status==='loading');
  const failed=(Object.keys(resources) as (keyof HomeData)[]).filter(key=>resources[key]?.status==='error');
  const has=(...keys:(keyof HomeData)[])=>keys.every(key=>resources[key]?.value!==undefined);
  useEffect(()=>{const read=()=>{try{const raw=window.atoumweb.visualPreferences.getItem(HOME_WIDGET_PREFERENCE_KEY);setPreference(raw?normalizeHomeWidgets(JSON.parse(raw)):defaultHomeWidgets());setPreferenceError('');}catch(error){setPreference(defaultHomeWidgets());setPreferenceError(error instanceof Error?error.message:'Disposition non lue.');}};read();const changed=(event:StorageEvent)=>{if(event.key===null||event.key===HOME_WIDGET_PREFERENCE_KEY)read();};window.addEventListener('storage',changed);return()=>window.removeEventListener('storage',changed);},[]);
  function persist(next:HomeWidgetPreference){if(next===preference)return;try{window.atoumweb.visualPreferences.setItem(HOME_WIDGET_PREFERENCE_KEY,JSON.stringify(next));setPreference(next);setPreferenceError('');}catch(error){const message=error instanceof Error?error.message:'Disposition non enregistrée.';setPreferenceError(message);onMessage(message);}}
  function resetWidgets(){try{window.atoumweb.visualPreferences.removeItem(HOME_WIDGET_PREFERENCE_KEY);setPreference(defaultHomeWidgets());setPreferenceError('');}catch(error){setPreferenceError(error instanceof Error?error.message:'Réinitialisation impossible.');}}

  async function load(): Promise<void> {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).toISOString();
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
    await loader.load({entries:()=>window.atoumweb.workflow.dashboard(),prospects:()=>window.atoumweb.crm.prospects.list({includeArchived:true}),quotes:()=>window.atoumweb.quotes.list(),actions:()=>window.atoumweb.crm.actions.list({ownerType:'prospect'}),projects:()=>window.atoumweb.projects.projects.list(),interventions:()=>window.atoumweb.operations.interventions.list(),time:()=>window.atoumweb.time.summary({from,to}),billing:()=>window.atoumweb.billing.list(),alerts:()=>window.atoumweb.operationsAlerts.get()},setResources);
  }

  useEffect(() => {
    void load();
    const refresh = () => void load();
    window.addEventListener('atoumweb:changed', refresh);
    window.addEventListener('atoumweb:time-changed', refresh);
    window.addEventListener('atoumweb:intervention-updated', refresh);
    return () => {
      loader.invalidate();
      window.removeEventListener('atoumweb:changed', refresh);
      window.removeEventListener('atoumweb:time-changed', refresh);
      window.removeEventListener('atoumweb:intervention-updated', refresh);
    };
  }, []);

  const todayEntries = useMemo(() => data.entries?.filter((entry) => entry.group === 'Aujourd’hui') ?? [], [data]);
  const activeProspects = useMemo(() => data.prospects?.filter((item) => !item.archivedAt && !item.clientAccountId && !['won', 'lost'].includes(item.stage ?? 'new')) ?? [], [data]);
  const pipelineProspects = useMemo(() => activeProspects.filter((item) => (item.stage ?? 'new') !== 'new'), [activeProspects]);
  const dueFollowUps = useMemo(() => {
    const nowTimestamp = Date.now();
    const endOfToday = new Date();
    endOfToday.setHours(24, 0, 0, 0);
    const due = new Set<string>();
    const overdue = new Set<string>();
    for (const action of data?.actions ?? []) {
      if (action.ownerType !== 'prospect' || action.type !== 'follow_up' || action.status !== 'open' || !action.dueAt) continue;
      const timestamp = new Date(action.dueAt).getTime();
      if (!Number.isFinite(timestamp) || timestamp >= endOfToday.getTime()) continue;
      due.add(action.ownerId);
      if (timestamp < nowTimestamp) overdue.add(action.ownerId);
    }
    return { due, overdue };
  }, [data?.actions]);
  const relaunchCount = pipelineProspects.filter((item) => dueFollowUps.due.has(item.id)).length;
  const overdueRelaunchCount = pipelineProspects.filter((item) => dueFollowUps.overdue.has(item.id)).length;
  const quotePrepareCount = activeProspects.filter((item) => ['quote_to_prepare', 'quote_to_send'].includes(item.stage ?? 'new')).length;
  const projectsToStart = data.projects?.filter((item) => item.status === 'to_prepare').length ?? 0;
  const interventionsInProgress = data.interventions?.filter((item) => item.status === 'in_progress').length ?? 0;

  const projection=projectPipeline(withCurrentQuoteSignal(data.prospects??[],data.quotes??[]));
  const pipeline:PipelineItem[]=[...projection.columns.map((column,index)=>({key:column.id,label:column.label,count:column.prospects.length,tone:['blue','purple','yellow','orange','green','blue'][index]})),{key:'conversions',label:'Conversion',count:projection.conversions.length,tone:'green',historical:true}];
  const pipelineReady=has('prospects','quotes');
  const pipelineTotal = pipeline.filter(item=>!item.historical).reduce((sum, item) => sum + item.count, 0);
  const time = data?.time ?? EMPTY_TIME;
  const billableRatio = time.totalSeconds > 0 ? Math.min(1, time.billableSeconds / time.totalSeconds) : 0;
  const donutStyle = { '--home-time-progress': `${Math.round(billableRatio * 360)}deg` } as CSSProperties;
  const readyBilling = data.billing?.filter((item) => item.status === 'ready') ?? [];
  const readyAmount = readyBilling.reduce((sum, item) => sum + item.expectedAmountCents, 0);
  const alerts = data.alerts?.alerts ?? [];
  const recentProjects=[...(data.projects??[])].filter(project=>!project.archivedAt).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).slice(0,3);
  const standardOrder=preference.order.join(',')===HOME_WIDGET_KEYS.join(',');
  const displayOrder:HomeWidgetKey[]=standardOrder?['today','watch','kpis','pipeline','time','actions']:preference.order;
  const widgetIcons:Record<HomeWidgetKey,OperationIconName>={today:'calendar',watch:'alert',kpis:'chart',pipeline:'chart',time:'clock',actions:'folder'};
  const widgets:Record<HomeWidgetKey,ReactNode>={
kpis:<div className="home-kpi-grid">
      <HomeKpi icon="user" tone="red" label="Prospects à relancer" value={has("prospects","actions")?relaunchCount:"—"} helper={overdueRelaunchCount ? `${overdueRelaunchCount} en retard · à traiter dans le pipeline` : 'À traiter aujourd’hui dans le pipeline'} onClick={() => openProspectPipeline('relaunch')} />
      <HomeKpi icon="file-text" tone="blue" label="Devis à préparer" value={has("prospects")?quotePrepareCount:"—"} helper="Compteur issu des Prospects · Ouvrir tous les devis" onClick={() => openPage('Devis')} />
      <HomeKpi icon="folder" tone="green" label="Projets à démarrer" value={has("projects")?projectsToStart:"—"} helper="Statut à préparer · Ouvrir tous les projets" onClick={() => openPage('Projets')} />
      <HomeKpi icon="wrench" tone="orange" label="Interventions en cours" value={has("interventions")?interventionsInProgress:"—"} helper="Statut en cours · Ouvrir toutes les opérations" onClick={() => openPage('Interventions & Maintenance')} />
    </div>,
today:<article className="home-card home-today-card">
        <div className="home-card-title"><div><OperationIcon name="calendar" size={20} /><strong>Aujourd’hui</strong><span>{has("entries")?todayEntries.length:"—"}</span></div><button type="button" onClick={() => openPage('Prospects')} aria-label="Ouvrir les actions">›</button></div>
        <div className="home-today-scroll" tabIndex={0} aria-label="Dossiers du jour">
          {todayEntries.map((entry, index) => <button className="home-today-item" type="button" key={`${entry.target.entityType}-${entry.target.entityId}-${index}`} onClick={() => openEntity(entry.target)}>
            <span className="home-today-dot" />
            <span className="home-today-icon"><OperationIcon name={targetIcon(entry.target)} size={17} /></span>
            <span className="home-today-copy"><strong>{entry.target.title}</strong><small>{entry.target.subtitle || entry.target.status || 'Action du jour'}</small></span>
            <span className="home-today-open">›</span>
          </button>)}
          {todayEntries.length === 0 && <div className="home-empty-state"><OperationIcon name="check-circle" size={30} /><strong>{has("entries")?"Aucun dossier du jour signalé":"Dossiers du jour indisponibles"}</strong>{resources.entries?.status!=="ready"&&<span>Actualisation non confirmée ; consultez le détail des sources.</span>}</div>}
        </div>
      </article>,
pipeline:<article className="home-card home-pipeline-card">
        <div className="home-card-title"><div><OperationIcon name="chart" size={20} /><strong>Pipeline commercial</strong></div><button type="button" onClick={() => openProspectPipeline()} aria-label="Ouvrir le pipeline commercial">›</button></div>
        <div className="home-pipeline-items">
          {pipeline.map((item, index) => <button type="button" key={item.key} data-home-pipeline={item.key} className={`home-pipeline-item tone-${item.tone}`} onClick={() => item.historical?window.dispatchEvent(new CustomEvent('atoumweb:open-prospects-view',{detail:'conversions'})):openProspectPipeline()} title={`${item.label} · ${pipelineReady?item.count:'indisponible'} prospect${item.count > 1 ? 's' : ''}`}>
            <span className="home-pipeline-step" aria-hidden="true"><i /></span>
            <strong>{pipelineReady?item.count:"—"}</strong>
            <span className="home-pipeline-label">{item.label}</span>
            {item.historical&&<small>Historique</small>}
          </button>)}
        </div>
        <div className="home-pipeline-bar" aria-label="Répartition du pipeline">
          {pipeline.filter(item=>!item.historical).map((item) => <span key={item.key} className={`tone-${item.tone}`} style={{ flexGrow: Math.max(item.count, .3) }} />)}
        </div>
        <div className="home-pipeline-footer">
          <span>{pipelineReady?pipelineTotal:"—"} prospect{pipelineTotal > 1 ? 's' : ''} dans le pipeline actif</span>
          <strong>{has('prospects','actions')?(relaunchCount ? `${relaunchCount} relance${relaunchCount > 1 ? 's' : ''} à traiter` : 'Aucune relance due'):'Relances indisponibles'}</strong>
        </div>
      </article>,
time:<article className="home-card home-time-card">
        <div className="home-card-title"><div><OperationIcon name="clock" size={20} /><strong>Temps & facturation</strong></div><button type="button" onClick={() => openPage('Gestion des temps')} aria-label="Ouvrir la gestion des temps">›</button></div>
        <div className="home-time-body">
          <button type="button" className="home-time-donut" style={donutStyle} onClick={() => openPage('Gestion des temps')}><span><strong>{has("time")?hours(time.totalSeconds):"—"}</strong><small>ce mois-ci</small></span></button>
          <div className="home-time-legend">
            <span><i className="billable" /><small>Heures facturables</small><em>{has("time")&&time.totalSeconds>0?`${Math.round(billableRatio*100)} %`:"—"}</em><strong>{has("time")?hours(time.billableSeconds):"—"}</strong></span>
            <span><i /><small>Heures non facturables</small><em>{has("time")&&time.totalSeconds>0?`${100-Math.round(billableRatio*100)} %`:"—"}</em><strong>{has("time")?hours(time.nonBillableSeconds):"—"}</strong></span>
          </div>
        </div>
        <button className="home-billing-row" title="Éléments prêts à facturer, hors factures Abby émises" type="button" onClick={() => openPage('Facturation')}><OperationIcon name="receipt" size={20} /><span><small>Montant à facturer</small><strong>{has("billing")?money(readyAmount):"—"}</strong></span><em>{has("billing")?`${readyBilling.length} élément${readyBilling.length>1?"s":""}`:"Nombre indisponible"}</em><b>›</b></button>
      </article>,
watch:<article tabIndex={0} aria-label="Liste des alertes opérationnelles" className={`home-card home-watch-card ${alerts.length||resources.alerts?.status!=='ready' ? 'has-alerts' : 'is-clear'}`}>
        <div className="home-watch-copy">
          <span className="home-watch-icon"><OperationIcon name={alerts.length ? 'alert' : 'check-circle'} size={25} /></span>
          <div><span className="eyebrow">À surveiller</span><strong>{alerts.length ? `${alerts.length} alerte${alerts.length > 1 ? 's' : ''} connue${alerts.length > 1 ? 's' : ''}` : resources.alerts?.status==='ready'?'Aucune alerte opérationnelle signalée':'Alertes non confirmées'}</strong>{resources.alerts?.status!=='ready'&&<small>Actualisation non confirmée ; consultez le détail des sources.</small>}</div>
        </div>
        {alerts.map(alert=><button className="home-watch-action" type="button" key={alert.id} data-home-alert={alert.id} onClick={() => {
          const target = alertTarget(alert);
          if (target) openEntity(target); else openPage('Interventions & Maintenance');
        }}>{alert.severity==='critical'?'Critique':alert.severity==='warning'?'Avertissement':'Information'} · {alert.title} · Ouvrir ›</button>)}
        <div className="home-watch-sparkline" aria-hidden="true"><span /><span /><span /><span /><span /><i /></div>
      </article>,
actions:<article className="home-card home-actions-card">
        <div className="home-card-title"><div><OperationIcon name="bolt" size={20} /><strong>Actions rapides</strong></div></div>
        <div className="home-recent-projects">{recentProjects.map(project=><button type="button" key={project.id} data-home-project={project.id} onClick={()=>openEntity({entityType:'project',entityId:project.id,title:project.name})}><OperationIcon name="folder"/><span><strong>{project.name}</strong><small>{project.clientLabel || project.number}</small></span><span>›</span></button>)}{!recentProjects.length&&<p className="home-project-empty">{has('projects')?'Aucun projet récent':'Projets indisponibles'}</p>}</div><details className="home-shortcuts"><summary>Accès rapides</summary><div className="home-quick-actions">
          <button className="quick-prospect" type="button" onClick={() => openPage('Prospects')}><OperationIcon name="user" size={19} />Ouvrir Prospection</button>
          <button className="quick-quote" type="button" onClick={() => openPage('Devis')}><OperationIcon name="file-text" size={19} />Ouvrir Devis</button>
          <button className="quick-project" type="button" onClick={() => openPage('Projets')}><OperationIcon name="folder" size={19} />Ouvrir Projets</button>
          <button className="quick-request" type="button" onClick={() => openPage('Interventions & Maintenance')}><OperationIcon name="wrench" size={19} />Ouvrir les opérations</button>
        </div></details>
      </article>
  };
  const widgetOpen:Record<HomeWidgetKey,()=>void>={today:()=>openPage('Prospects'),kpis:()=>openProspectPipeline(),pipeline:()=>openProspectPipeline(),time:()=>openPage('Gestion des temps'),watch:()=>openPage('Interventions & Maintenance'),actions:()=>openPage('Projets')};
  function renderWidget(key:HomeWidgetKey){
    const folded=preference.collapsed?.includes(key)??false;
    return <div key={key} data-home-widget={key} className={'home-widget home-widget-'+key} hidden={preference.hidden.includes(key)}>
      <div className="home-widget-heading"><button type="button" className="home-widget-fold" aria-expanded={!folded} aria-controls={'home-content-'+key} aria-label={`${folded?'Déplier':'Replier'} ${widgetLabels[key]}`} onClick={()=>persist({...preference,collapsed:folded?(preference.collapsed??[]).filter(value=>value!==key):[...(preference.collapsed??[]),key]})}><OperationIcon name={widgetIcons[key]}/><strong>{widgetLabels[key]}</strong>{key==='today'&&has('entries')&&<span>{todayEntries.length}</span>}<span className="home-fold-symbol" aria-hidden="true">{folded?'+':'−'}</span></button>{!['kpis','time'].includes(key)&&<button type="button" className="home-widget-open" onClick={widgetOpen[key]} aria-label={key==='today'?'Ouvrir les actions':key==='pipeline'?'Ouvrir le pipeline commercial':key==='time'?'Ouvrir la gestion des temps':key==='actions'?'Ouvrir les projets':'Ouvrir les opérations'}>Voir tout <span aria-hidden="true">›</span></button>}</div>
      <div id={'home-content-'+key} className="home-widget-content" hidden={folded}>{widgets[key]}</div>
    </div>;
  }
  return <section className="home-dashboard" aria-busy={loading}>
   <header className="home-heading"><div><h1>Accueil</h1></div><div className="home-heading-actions"><button type="button" className="home-personalize" aria-controls="home-personalization" onClick={()=>{const panel=document.getElementById('home-personalization') as HTMLDetailsElement;panel.open=!panel.open;if(panel.open)panel.querySelector('summary')?.focus();}}><OperationIcon name="settings"/>Personnaliser</button><AppButton aria-label="Actualiser l’Accueil" title="Actualiser" icon={<OperationIcon name="refresh"/>} onAction={load}/></div></header>
   {failed.length>0&&<AppNotice level="error" action={{label:'Réessayer',onClick:()=>void load()}}>Sources indisponibles : {failed.map(key=>sourceLabels[key]).join(', ')}. Les dernières données confirmées, si disponibles, peuvent être anciennes.</AppNotice>}

   {resources.alerts?.status!=='ready'&&<AppNotice level="warning">La source des alertes n’est pas confirmée pour cette actualisation. {has("alerts")?"Les alertes précédemment connues restent affichées.":"La situation des alertes reste inconnue."}</AppNotice>}
   {alerts.filter(alert=>alert.severity==='critical').length>0&&<div className="home-critical-alerts" role="alert"><strong>À traiter en priorité</strong>{alerts.filter(alert=>alert.severity==='critical').map(alert=><button type="button" key={alert.id} data-home-critical={alert.id} onClick={()=>{const target=alertTarget(alert);if(target)openEntity(target);else openPage('Interventions & Maintenance');}}>{alert.title} · Ouvrir le dossier</button>)}</div>}
   {preferenceError&&<AppNotice level="error">{preferenceError} La disposition standard reste accessible.</AppNotice>}

   <details id="home-personalization" className="home-widget-settings"><summary>Personnaliser l’Accueil</summary><details className="home-source-status"><summary>{loading?'Actualisation en cours':failed.length?'Chargement partiel':`${Object.keys(sourceLabels).length} sources chargées`} · Détail des sources</summary>{(Object.keys(sourceLabels) as (keyof HomeData)[]).map(key=><p key={key} data-home-source={key} data-source-status={resources[key]?.status??'loading'}><strong>{sourceLabels[key]}</strong> : {resources[key]?.status==='ready'?'Chargé':resources[key]?.status==='error'?'Indisponible':'En cours'}{resources[key]?.loadedAt&&<> · Dernière lecture {new Date(resources[key]!.loadedAt!).toLocaleTimeString('fr-FR')}{resources[key]?.status!=='ready'?' (données anciennes)':''}</>}{resources[key]?.error&&<> · {resources[key]!.error}</>}</p>)}</details><p>Aujourd’hui et les alertes critiques restent accessibles. Seule la présentation est mémorisée.</p>{preference.order.map((key,index)=><div key={key} data-widget-setting={key} onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();const source=event.dataTransfer.getData('text/plain');if((HOME_WIDGET_KEYS as readonly string[]).includes(source))persist(dropHomeWidget(preference,source as HomeWidgetKey,key));}}><label><input type="checkbox" checked={!preference.hidden.includes(key)} disabled={key==='today'} onChange={()=>persist({...preference,hidden:preference.hidden.includes(key)?preference.hidden.filter(value=>value!==key):[...preference.hidden,key]})}/>{widgetLabels[key]}</label><button type="button" draggable={key!=='today'} aria-label={'Déplacer '+widgetLabels[key]} onDragStart={event=>{event.dataTransfer.setData('text/plain',key);event.dataTransfer.effectAllowed='move';}}>↕</button><AppButton aria-label={'Monter '+widgetLabels[key]} disabled={index<=1} onAction={()=>persist(moveHomeWidget(preference,key,-1))}>↑</AppButton><AppButton aria-label={'Descendre '+widgetLabels[key]} disabled={index===0||index===preference.order.length-1} onAction={()=>persist(moveHomeWidget(preference,key,1))}>↓</AppButton></div>)}<AppButton onAction={resetWidgets}>Réinitialiser l’Accueil</AppButton></details>
   <div className="home-widgets">{displayOrder.map(renderWidget)}</div>
  </section>;
}

function HomeKpi({ icon, tone, label, value, helper, onClick }: { icon: OperationIconName; tone: string; label: string; value: number|string; helper: string; onClick: () => void }) {
  return <button type="button" className={`home-kpi-card tone-${tone}`} onClick={onClick} title={`${label} : ${value}. ${helper}`}>
    <span className="home-kpi-icon"><OperationIcon name={icon} size={28} /></span>
    <span className="home-kpi-copy"><strong title={label}>{label}</strong><b>{value}</b></span>
    <span className="home-kpi-open">›</span>
  </button>;
}
