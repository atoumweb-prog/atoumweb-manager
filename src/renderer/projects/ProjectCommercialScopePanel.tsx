import {ContributionTargetChoices} from './ContributionTargetChoices';
import {requestUnsavedExit} from '../unsaved/unsaved';
import {useEffect,useState} from 'react';
import type {ProjectCommercialScope,ProjectCommercialRestartPreview,ProjectConflictDecision,ProjectDetail} from '../../shared/projects';

export function ProjectCommercialScopePanel({projectId,onChanged}:{projectId:string;onChanged?:(p:ProjectDetail)=>void}) {
  const [scope,setScope]=useState<ProjectCommercialScope|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const [restartPreview,setRestartPreview]=useState<ProjectCommercialRestartPreview|null>(null),[restartConfirmed,setRestartConfirmed]=useState(false);
  const api=window.atoumweb.projects.projects;
  useEffect(()=>{let live=true;setRestartPreview(null);setRestartConfirmed(false);api.commercialScope(projectId).then(s=>{if(live)setScope(s);}).catch(e=>{if(live)setError(String(e));});return()=>{live=false;};},[projectId]);
  async function run(conflictId?:string,decision?:ProjectConflictDecision) {
    setBusy(true);setError('');setRestartPreview(null);setRestartConfirmed(false);
    try {
      if(conflictId && decision) await api.resolveScopeConflict(projectId,conflictId,decision);
      else await api.syncCommercial(projectId);
      setScope(await api.commercialScope(projectId));onChanged?.(await api.get(projectId));
    } catch(e) {setError(e instanceof Error?e.message:String(e));} finally {setBusy(false);}
  }
  async function inspectRestart():Promise<void> {
    if(busy)return;
    setBusy(true);setError('');setRestartConfirmed(false);setRestartPreview(null);
    try {setRestartPreview(await api.previewRestart(projectId));}
    catch(e){setError(e instanceof Error?e.message:String(e));}
    finally{setBusy(false);}
  }
  async function restartProject():Promise<void> {
    if(busy||!restartPreview||!restartConfirmed)return;
    setBusy(true);setError('');
    try {
      const next=await api.restartProject(projectId,restartPreview.sha256);
      setRestartPreview(null);setRestartConfirmed(false);onChanged?.(next);
      window.dispatchEvent(new CustomEvent('atoumweb:navigate',{detail:{
        entityType:'project',entityId:next.id,title:next.name,
      }}));
    } catch(e){
      // A stale review must never be silently reapplied; ask for a new preview.
      setRestartPreview(null);setRestartConfirmed(false);
      setError(e instanceof Error?e.message:String(e));
    } finally {setBusy(false);}
  }
  if(!scope || scope.state==='legacy') return error?<p role="alert">{error}</p>:null;
  // The archived predecessor keeps its own commercial history but no longer
  // owns the dossier. Never expose actions belonging to the replacement.
  const isCurrentProvisional = scope.state==='provisional' && Boolean(scope.dossierId && scope.currentQuoteId);
  const canAssignTargets = isCurrentProvisional || scope.state==='frozen';
  return <section className="project-commercial-scope" aria-label="Périmètre commercial du Projet">
    <strong>{scope.state==='provisional'
      ? isCurrentProvisional?'Projet prévisionnel — devis non accepté':'Ancien Projet prévisionnel — archive conservée, lecture seule'
      :'Périmètre accepté et figé'}</strong>
    {isCurrentProvisional && <><p>Les étapes, Sites et Pages préparent le périmètre du devis. Aucune maintenance, intervention ou facturation n’est activée.</p>
      <button className="secondary-button" disabled={busy} onClick={()=>void run()}>Synchroniser le périmètre commercial</button>
      <div className="project-restart-review">
        <button type="button" className="secondary-button" disabled={busy} onClick={()=>void inspectRestart()}>Examiner « Repartir de zéro »</button>
        {restartPreview&&<div role="group" aria-label="Impact de la régénération du Projet">
          <strong>Remplacement du Projet prévisionnel depuis le devis courant</strong>
          <p>Le Projet actuel sera archivé avec ses versions, Pages, fichiers, temps, secrets et exports Bridge. Aucun contenu n’est supprimé physiquement. Un nouveau Projet indépendant sera préparé et deviendra le seul Projet courant du dossier commercial.</p>
          <p>Référence du devis : {restartPreview.quoteId}. Éléments rattachés à préserver :</p>
          {Object.entries(restartPreview.counts).length
            ? <ul>{Object.entries(restartPreview.counts).map(([table,count])=><li key={table}>{table} : {count}</li>)}</ul>
            : <p>Aucune donnée enfant répertoriée. L’ancien Projet restera néanmoins archivé.</p>}
          <label><input type="checkbox" checked={restartConfirmed} onChange={e=>setRestartConfirmed(e.target.checked)}/>
            J’ai vérifié l’impact et je confirme l’archivage de l’ancien Projet et la création d’un nouveau Projet.</label>
          <button type="button" className="secondary-button danger-outline" disabled={busy||!restartConfirmed}
            onClick={()=>requestUnsavedExit(()=>{void restartProject();})}>Confirmer la régénération du Projet</button>
          <button type="button" className="secondary-button" disabled={busy} onClick={()=>{setRestartPreview(null);setRestartConfirmed(false);}}>Annuler</button>
        </div>}
      </div></>}
    <details><summary>Historique du périmètre ({scope.revisions.length})</summary>
      {scope.revisions.map(r=><p key={r.id}>Synchronisation {r.sequence} · révision commerciale {r.commercialRevision} · {new Date(r.createdAt).toLocaleString('fr-FR')}</p>)}
    </details>
    {scope.conflicts.map(c=><div key={c.id} className="project-scope-conflict" role="group" aria-label={c.reason}>
      <strong>{c.reason}</strong><p>{c.label} · {c.entityKind==='node'?'Étape / Page':c.entityKind==='site'?'Site':'Prérequis'} : travail conservé, choix nécessaire avant acceptation.</p>
      {([['keep','Conserver'],['archive','Archiver'],['detach','Détacher de la provenance'],['delete','Supprimer si vierge']] as [ProjectConflictDecision,string][])
        .map(([d,label])=><button key={d} className="secondary-button" disabled={busy||!isCurrentProvisional} onClick={()=>void run(c.id,d)}>{label}</button>)}
    </div>)}
    {canAssignTargets&&<details open={scope.targets?.some(t=>t.state==='pending')}><summary>Affectation des prestations — {scope.targets?.filter(t=>t.state==='pending').length||0} destination(s) à choisir</summary>
    {scope.targets?.map(t=><ContributionTargetChoices key={JSON.stringify([t.lineOrigin,t.slot,t.unitIndex])} target={t} choices={scope.targetChoices??{sites:[],pages:[],contexts:[]}} busy={busy} onAssign={async input=>{
      setBusy(true);setError('');try{setScope(await api.assignTarget(projectId,input));onChanged?.(await api.get(projectId));}catch(e){setError(e instanceof Error?e.message:String(e));}finally{setBusy(false);}
    }} />)}
    </details>}
    {error&&<p className="form-error" role="alert">{error}</p>}
  </section>;
}
