import { useEffect, useRef, useState } from 'react';
import type { CatalogItemDetail, CatalogItemSummary, CatalogRecommendationLink, CatalogRecommendationDetails } from '../../shared/commercial';
import { useUnsavedDraft } from '../unsaved/unsaved';

/** 04D: edits recommendations independently of an offer composition or contract. */
export function CatalogRecommendationsPanel({item,items,locked}:{
  item: CatalogItemDetail;
  items: CatalogItemSummary[];
  locked: boolean;
}) {
  const source = item.versions.find(version=>version.status==='draft') ?? item.currentVersion ?? null;
  const sourceId = source?.id ?? '';
  const [savedLinks,setSavedLinks] = useState<CatalogRecommendationLink[]>([]);
  const [targets,setTargets] = useState<string[]>([]);
  const [metadata,setMetadata] = useState<Record<string,CatalogRecommendationDetails>>({});
  const [loading,setLoading] = useState(true);
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState('');
  const sourceRef=useRef(sourceId);
  sourceRef.current=sourceId;
  const requestEpoch=useRef(0);
  const saveInFlight=useRef<string|null>(null);
  const guard=useUnsavedDraft('Recommandations Catalogue',{targets,metadata},{
    group:'catalog:'+item.id,resetKey:sourceId,ready:!!sourceId&&!loading,
    pending:saving,discard:baseline=>{setTargets(baseline.targets);setMetadata(baseline.metadata);},
  });
  useEffect(()=>{
    ++requestEpoch.current;
    saveInFlight.current=null;
    let cancelled=false;
    setLoading(true);setSaving(false);setError('');setTargets([]);setMetadata({});setSavedLinks([]);
    if (!sourceId){setLoading(false);return;}
    void window.atoumweb.catalog.listRecommendations(sourceId).then(links=>{
      if(cancelled)return;
      setSavedLinks(links);
      const next=links.map(link=>link.targetVersionId);
      const info=Object.fromEntries(links.map(link=>[link.targetVersionId,{
        targetVersionId:link.targetVersionId,reason:link.reason??'',status:link.status??'active',
        conditions:link.conditions??'',provenance:link.provenance??'manual',
      }]));
      setTargets(next);setMetadata(info);guard.initial({targets:next,metadata:info});setLoading(false);
    }).catch(err=>{
      if(!cancelled){setError(err instanceof Error?err.message:'Lecture des recommandations impossible.');setLoading(false);}
    });
    return()=>{cancelled=true;};
  // One load per source version. Other local edits must not trigger a reload.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[sourceId]);
  const editable=source?.status==='draft'&&!locked;
  const available=items.filter(candidate=>candidate.type==='service'&&candidate.id!==item.id&&candidate.status==='active'
    &&candidate.currentVersion?.status==='published'
    &&!targets.includes(candidate.currentVersion.id));
  function moveTarget(id:string,direction:-1|1){
    setTargets(current=>{
      const from=current.indexOf(id),to=from+direction;
      if(from<0||to<0||to>=current.length)return current;
      const next=[...current];
      [next[from],next[to]]=[next[to],next[from]];
      return next;
    });
  }
  function patch(id:string,fields:Partial<CatalogRecommendationDetails>){
    setMetadata(current=>({...current,[id]:{...current[id],...fields,targetVersionId:id,reason:fields.reason??current[id]?.reason??'',status:fields.status??current[id]?.status??'active',conditions:fields.conditions??current[id]?.conditions??'',provenance:fields.provenance??current[id]?.provenance??'manual'}}));
  }
  async function save(){
    if(!sourceId||!editable||saving||saveInFlight.current===sourceId)return;
    const savingSourceId=sourceId;
    const saveEpoch=requestEpoch.current;
    saveInFlight.current=sourceId;
    setSaving(true);setError('');
    try{
      const links=await window.atoumweb.catalog.replaceRecommendations(sourceId,targets,savedLinks.map(link=>link.targetVersionId),targets.map(id=>({...metadata[id],targetVersionId:id,reason:metadata[id]?.reason??'',status:metadata[id]?.status??'active',conditions:metadata[id]?.conditions??'',provenance:metadata[id]?.provenance??'manual'})),savedLinks.map(link=>({targetVersionId:link.targetVersionId,reason:link.reason??'',status:link.status??'active',conditions:link.conditions??'',provenance:link.provenance??'manual'})));
      if(sourceRef.current!==savingSourceId||requestEpoch.current!==saveEpoch)return;
      setSavedLinks(links);const saved=links.map(link=>link.targetVersionId);
      const info=Object.fromEntries(links.map(link=>[link.targetVersionId,{targetVersionId:link.targetVersionId,
        reason:link.reason??'',status:link.status??'active',conditions:link.conditions??'',provenance:link.provenance??'manual'}]));
      setTargets(saved);setMetadata(info);guard.saved({targets:saved,metadata:info});
    }catch(err){if(sourceRef.current===savingSourceId&&requestEpoch.current===saveEpoch)setError(err instanceof Error?err.message:'Enregistrement impossible : saisie conservée.');}
    finally{if(sourceRef.current===savingSourceId&&requestEpoch.current===saveEpoch){saveInFlight.current=null;setSaving(false);}}
  }
  return <section className="catalog-detail-section" aria-label="Recommandations commerciales">
    <strong>Recommandations complémentaires · {source?'v'+source.versionNumber:'Aucune version'}</strong>
    <p className="muted">Ces recommandations ne créent ni ligne de devis, ni clause contractuelle.</p>
    {loading&&<p role="status">Chargement des associations…</p>}
    {error&&<p className="form-error" role="alert">{error}</p>}
    {!loading&&<div>
      {targets.map((id,index)=><div className="offer-component-row" key={id}>
        <span>{savedLinks.find(link=>link.targetVersionId===id)?.targetName
          ??items.find(candidate=>candidate.currentVersion?.id===id)?.name??id}
          {savedLinks.find(link=>link.targetVersionId===id)?.targetVersionNumber
            ? ' · v'+savedLinks.find(link=>link.targetVersionId===id)!.targetVersionNumber : ''}
          {savedLinks.find(link=>link.targetVersionId===id)?.targetVersionStatus==='retired'?' · Version retirée':''}
          {savedLinks.find(link=>link.targetVersionId===id)?.targetItemStatus==='inactive'?' · Inactif':''}
          {savedLinks.find(link=>link.targetVersionId===id)?.targetItemStatus==='archived'?' · Archivé':''}
        </span>
        <div className="catalog-recommendation-metadata">
          <label>Motif interne<input value={metadata[id]?.reason??''} maxLength={1000}
            disabled={!editable||saving} onChange={event=>patch(id,{reason:event.target.value})}/></label>
          <label>État<select value={metadata[id]?.status??'active'} disabled={!editable||saving}
            onChange={event=>patch(id,{status:event.target.value as 'active'|'paused'})}>
            <option value="active">Active</option><option value="paused">En pause</option>
          </select></label>
          <label>Conditions d'application<textarea value={metadata[id]?.conditions??''} maxLength={3000}
            disabled={!editable||saving} onChange={event=>patch(id,{conditions:event.target.value})}/></label>
          <span className="muted">Provenance : {metadata[id]?.provenance??'manual'}</span>
        </div>
        {editable&&<div className="inline-editor-actions" aria-label="Ordre de recommandation">
          <button type="button" className="secondary-button compact-button"
            disabled={saving||index===0} aria-label={`Monter la recommandation ${index+1}`}
            onClick={()=>moveTarget(id,-1)}>↑</button>
          <button type="button" className="secondary-button compact-button"
            disabled={saving||index===targets.length-1} aria-label={`Descendre la recommandation ${index+1}`}
            onClick={()=>moveTarget(id,1)}>↓</button>
          <span className="muted">Priorité d’affichage {index+1}</span>
        </div>}
        {editable&&<button type="button" className="secondary-button" aria-label={`Retirer la recommandation ${savedLinks.find(link=>link.targetVersionId===id)?.targetName ?? items.find(candidate=>candidate.currentVersion?.id===id)?.name ?? id}`} disabled={saving} onClick={()=>{setTargets(values=>values.filter(value=>value!==id));setMetadata(current=>{const next={...current};delete next[id];return next;});}}>Retirer</button>}
      </div>)}
      {!targets.length&&<p className="muted">Aucune recommandation.</p>}
      {editable&&<div className="offer-component-editor">
        <select aria-label="Ajouter une recommandation" value="" disabled={saving} onChange={event=>{
          const id=event.target.value;if(id){setTargets(values=>values.includes(id)?values:[...values,id]);patch(id,{});}
        }}>
          <option value="">Choisir une prestation publiée…</option>
          {available.map(candidate=><option key={candidate.id} value={candidate.currentVersion!.id}>{candidate.name}</option>)}
        </select>
        <button type="button" className="primary-button" disabled={saving||!guard.dirty} onClick={()=>void save()}>
          {saving?'Enregistrement…':'Enregistrer les recommandations'}
        </button>
      </div>}
      {!editable&&<p className="muted">Les associations d'une version publiée sont figées. Crée un brouillon pour les modifier.</p>}
    </div>}
  </section>;
}
