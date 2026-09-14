import { useEffect,useState } from 'react';
import type { DashboardEntry } from '../../shared/workflow';
import { openEntity } from './DossierPanel';
export function WorkflowDashboard(){
  const [entries,setEntries]=useState<DashboardEntry[]>([]),[error,setError]=useState('');
  useEffect(()=>{let alive=true;const load=()=>window.atoumweb.workflow.dashboard().then(rows=>{if(alive)setEntries(rows);}).catch(e=>{if(alive)setError(String(e));});void load();const timer=window.setInterval(load,10000);window.addEventListener('atoumweb:changed',load);return()=>{alive=false;clearInterval(timer);window.removeEventListener('atoumweb:changed',load);};},[]);
  const groups=['Prospects à relancer','Devis à préparer','Devis en attente de réponse','Devis acceptés à démarrer','Projets à préparer','Projets en cours','Projets en attente Client','Projets bloqués','Projets à valider','Échéances proches','Projets en retard','Demandes nouvelles','Interventions en cours','Interventions à valider'];
  return <section><h2>Parcours métier</h2>{error&&<p role="alert">{error}</p>}<div className="workflow-dashboard">{groups.map(group=><section key={group} className="panel"><h3>{group} <span className="status-pill">{entries.filter(e=>e.group===group).length}</span></h3>{entries.filter(e=>e.group===group).map(e=><button key={e.target.entityType+e.target.entityId} type="button" className="workflow-link" onClick={()=>openEntity(e.target)}>{e.target.title}</button>)}{!entries.some(e=>e.group===group)&&<p className="muted">Aucun élément.</p>}</section>)}</div></section>;
}
