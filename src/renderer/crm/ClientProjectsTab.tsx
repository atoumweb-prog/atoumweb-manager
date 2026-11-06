import {useState} from 'react';
import type {ProjectSummary, ProjectStatus} from '../../shared/projects';
import type {QuoteSummary} from '../../shared/commercial';
import {AppButton} from '../ui/AppButton';
import {OperationIcon} from '../operations/OperationIcon';
import {openEntity} from '../workflow/DossierPanel';
import './client-projects-v2.css';

const STATUS_LABELS: Record<ProjectStatus,string> = {
  to_prepare:'À préparer', in_progress:'En cours', waiting_client:'En attente client',
  blocked:'Bloqué', to_validate:'À valider', completed:'Terminé', archived:'Archivé',
};
const TYPE_LABELS: Record<string,string> = {website:'Site vitrine', ecommerce:'E-commerce', landing:'Landing page', application:'Application', software:'Logiciel', internal:'Projet interne AtoumWeb'};
const archived = (project:ProjectSummary) => !!project.archivedAt || project.status==='archived';
const date = (value?:string|null) => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleDateString('fr-FR') : null;

export function ClientProjectsTab({projects,quotes,loading,error,onRetry}:{
  projects:ProjectSummary[]; quotes:QuoteSummary[]; loading:boolean; error?:string; onRetry:()=>void;
}) {
  const [filter,setFilter] = useState<'all'|ProjectStatus>('all');
  const matches = (project:ProjectSummary,status:ProjectStatus) => status==='archived' ? archived(project) : !archived(project) && project.status===status;
  const count = (status:ProjectStatus) => projects.filter(project=>matches(project,status)).length;
  const visible = projects.filter(project=>filter==='all'||matches(project,filter));
  const unavailable = loading || !!error;
  const indicators = [
    {label:'Projets au total',value:projects.length,icon:'folder' as const},
    {label:'En cours',value:count('in_progress'),icon:'layers' as const},
    {label:'À préparer',value:count('to_prepare'),icon:'clock' as const},
    {label:'Terminés / archivés',value:projects.filter(project=>archived(project)||project.status==='completed').length,icon:'check-circle' as const},
  ];
  return <div className="client-projects-tab">
    <header className="client-projects-heading"><OperationIcon name="folder"/><div><h3>Projets du client</h3><p>Projets rattachés, état d’avancement et accès au suivi détaillé.</p></div><span className="client-projects-count">{unavailable?'—':`${projects.length} projet${projects.length===1?'':'s'}`}</span></header>
    <div className="client-projects-indicators" aria-label="Situation des projets">{indicators.map(item=><div key={item.label}><OperationIcon name={item.icon}/><strong>{unavailable?'—':item.value}</strong><span>{item.label}</span></div>)}</div>
    <div className="client-projects-filters" role="group" aria-label="Filtrer les projets du client">
      <label>État<select aria-label="État des projets" value={filter} onChange={event=>setFilter(event.target.value as typeof filter)}><option value="all">Tous les états</option>{Object.entries(STATUS_LABELS).map(([status,label])=><option key={status} value={status}>{label}</option>)}</select></label>
    </div>
    {loading?<p role="status">Chargement des projets…</p>:error?<div role="alert"><p>Impossible de charger les projets : {error}</p><AppButton onAction={onRetry}>Réessayer</AppButton></div>:!visible.length?<div className="client-projects-empty"><OperationIcon name="folder"/><h4>{projects.length?'Aucun projet dans cet état':'Aucun projet rattaché à ce client'}</h4><p>{projects.length?'Choisissez « Tous les états » pour retrouver les dossiers.':'Les projets associés apparaîtront ici ; leur gestion détaillée reste dans le module Projets.'}</p></div>:<div className="client-projects-cards">{visible.map(project=>{
      const quote = quotes.find(item=>item.id===project.sourceQuoteId);
      return <article className="client-project-card" data-project-id={project.id} key={project.id}>
        <header><OperationIcon name="folder"/><div className="client-project-title"><h4>{project.name}</h4><div><span>{project.commercialState==='provisional'?'Prévisionnel':project.commercialState==='frozen'?'Confirmé':'Projet existant'}</span><span className="client-project-status" data-status={project.status}>{STATUS_LABELS[project.status]}</span>{project.archivedAt&&project.status!=='archived'&&<span className="client-project-status" data-status="archived">Archivé</span>}</div></div>
        <div className="client-project-progress"><label htmlFor={`client-progress-${project.id}`}>Avancement</label><div><progress id={`client-progress-${project.id}`} max={100} value={project.progressPercent}/><span>{project.progressPercent} %</span></div></div>
        <AppButton icon={<OperationIcon name="external-link"/>} onAction={()=>{openEntity({entityType:'project',entityId:project.id,title:project.name});}}>Ouvrir le projet</AppButton></header>
        <dl><div><dt><OperationIcon name="layers"/>Type</dt><dd>{TYPE_LABELS[project.projectType]||project.projectType||'Non renseigné'}</dd></div><div><dt><OperationIcon name="calendar"/>Dates</dt><dd>{date(project.startDate)&&<span>Début : {date(project.startDate)}</span>}{date(project.targetDate)&&<span>Cible : {date(project.targetDate)}</span>}{date(project.completedAt)&&<span>Terminé le : {date(project.completedAt)}</span>}{date(project.archivedAt)&&<span>Archivé le : {date(project.archivedAt)}</span>}{![project.startDate,project.targetDate,project.completedAt,project.archivedAt].some(value=>date(value))&&'Non renseignées'}</dd></div><div><dt><OperationIcon name="file-text"/>Devis source</dt><dd>{project.sourceQuoteId?<AppButton variant="quiet" onAction={()=>{openEntity({entityType:'quote',entityId:project.sourceQuoteId!,title:quote?.subject||project.name});}}>{quote?.number||'Ouvrir le devis source'}</AppButton>:'Non rattaché'}</dd></div></dl>
      </article>;
    })}</div>}
    <aside className="client-projects-info"><OperationIcon name="chart"/><div><h4>À propos des projets</h4><p>L’avancement représente les tâches et checklists obligatoires terminées, pas le temps consommé. Phases, tâches, prérequis et temps restent gérés dans le dossier Projet.</p></div></aside>
  </div>;
}
