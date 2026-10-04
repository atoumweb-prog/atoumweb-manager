import {useEffect,useState} from 'react';
import type {ProjectCommercialScope,ProjectConflictDecision,ProjectDetail} from '../../shared/projects';

export function ProjectCommercialScopePanel({projectId,onChanged}:{projectId:string;onChanged?:(p:ProjectDetail)=>void}) {
  const [scope,setScope]=useState<ProjectCommercialScope|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const api=window.atoumweb.projects.projects;
  useEffect(()=>{let live=true;api.commercialScope(projectId).then(s=>{if(live)setScope(s);}).catch(e=>{if(live)setError(String(e));});return()=>{live=false;};},[projectId]);
  async function run(conflictId?:string,decision?:ProjectConflictDecision) {
    setBusy(true);setError('');
    try {
      if(conflictId && decision) await api.resolveScopeConflict(projectId,conflictId,decision);
      else await api.syncCommercial(projectId);
      setScope(await api.commercialScope(projectId));onChanged?.(await api.get(projectId));
    } catch(e) {setError(e instanceof Error?e.message:String(e));} finally {setBusy(false);}
  }
  if(!scope || scope.state==='legacy') return error?<p role="alert">{error}</p>:null;
  return <section className="project-commercial-scope" aria-label="Périmètre commercial du Projet">
    <strong>{scope.state==='provisional'?'Projet prévisionnel — devis non accepté':'Périmètre accepté et figé'}</strong>
    {scope.state==='provisional' && <><p>Les étapes, Sites et Pages préparent le périmètre du devis. Aucune maintenance, intervention ou facturation n’est activée.</p>
      <button className="secondary-button" disabled={busy} onClick={()=>void run()}>Synchroniser le périmètre commercial</button></>}
    <details><summary>Historique du périmètre ({scope.revisions.length})</summary>
      {scope.revisions.map(r=><p key={r.id}>Synchronisation {r.sequence} · révision commerciale {r.commercialRevision} · {new Date(r.createdAt).toLocaleString('fr-FR')}</p>)}
    </details>
    {scope.conflicts.map(c=><div key={c.id} className="project-scope-conflict" role="group" aria-label={c.reason}>
      <strong>{c.reason}</strong><p>{c.label} · {c.entityKind==='node'?'Étape / Page':c.entityKind==='site'?'Site':'Prérequis'} : travail conservé, choix nécessaire avant acceptation.</p>
      {([['keep','Conserver'],['archive','Archiver'],['detach','Détacher de la provenance'],['delete','Supprimer si vierge']] as [ProjectConflictDecision,string][])
        .map(([d,label])=><button key={d} className="secondary-button" disabled={busy||scope.state!=='provisional'} onClick={()=>void run(c.id,d)}>{label}</button>)}
    </div>)}
    {error&&<p className="form-error" role="alert">{error}</p>}
  </section>;
}
