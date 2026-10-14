import { useEffect, useRef, useState } from 'react';
import type { CatalogItemDetail, CatalogItemSummary, CatalogRecommendationLink } from '../../shared/commercial';
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
  const [loading,setLoading] = useState(true);
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState('');
  const sourceRef=useRef(sourceId);
  sourceRef.current=sourceId;
  const requestEpoch=useRef(0);
  const saveInFlight=useRef<string|null>(null);
  const guard=useUnsavedDraft('Recommandations Catalogue',targets,{
    group:'catalog:'+item.id,resetKey:sourceId,ready:!!sourceId&&!loading,
    pending:saving,discard:setTargets,
  });
  useEffect(()=>{
    ++requestEpoch.current;
    saveInFlight.current=null;
    let cancelled=false;
    setLoading(true);setSaving(false);setError('');setTargets([]);setSavedLinks([]);
    if (!sourceId){setLoading(false);return;}
    void window.atoumweb.catalog.listRecommendations(sourceId).then(links=>{
      if(cancelled)return;
      setSavedLinks(links);
      const next=links.map(link=>link.targetVersionId);
      setTargets(next);guard.initial(next);setLoading(false);
    }).catch(err=>{
      if(!cancelled){setError(err instanceof Error?err.message:'Lecture des recommandations impossible.');setLoading(false);}
    });
    return()=>{cancelled=true;};
  // One load per source version. Other local edits must not trigger a reload.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[sourceId]);
  const editable=source?.status==='draft'&&!locked;
  const available=items.filter(candidate=>candidate.id!==item.id&&candidate.status==='active'
    &&candidate.currentVersion?.status==='published'
    &&!targets.includes(candidate.currentVersion.id));
  async function save(){
    if(!sourceId||!editable||saving||saveInFlight.current===sourceId)return;
    const savingSourceId=sourceId;
    const saveEpoch=requestEpoch.current;
    saveInFlight.current=sourceId;
    setSaving(true);setError('');
    try{
      const links=await window.atoumweb.catalog.replaceRecommendations(sourceId,targets,savedLinks.map(link=>link.targetVersionId));
      if(sourceRef.current!==savingSourceId||requestEpoch.current!==saveEpoch)return;
      setSavedLinks(links);const saved=links.map(link=>link.targetVersionId);
      setTargets(saved);guard.saved(saved);
    }catch(err){if(sourceRef.current===savingSourceId&&requestEpoch.current===saveEpoch)setError(err instanceof Error?err.message:'Enregistrement impossible : saisie conservée.');}
    finally{if(sourceRef.current===savingSourceId&&requestEpoch.current===saveEpoch){saveInFlight.current=null;setSaving(false);}}
  }
  return <section className="catalog-detail-section" aria-label="Recommandations commerciales">
    <strong>Recommandations complémentaires · {source?'v'+source.versionNumber:'Aucune version'}</strong>
    <p className="muted">Ces recommandations ne créent ni ligne de devis, ni clause contractuelle.</p>
    {loading&&<p role="status">Chargement des associations…</p>}
    {error&&<p className="form-error" role="alert">{error}</p>}
    {!loading&&<div>
      {targets.map(id=><div className="offer-component-row" key={id}>
        <span>{savedLinks.find(link=>link.targetVersionId===id)?.targetName
          ??items.find(candidate=>candidate.currentVersion?.id===id)?.name??id}
          {savedLinks.find(link=>link.targetVersionId===id)?.targetVersionNumber
            ? ' · v'+savedLinks.find(link=>link.targetVersionId===id)!.targetVersionNumber : ''}
          {savedLinks.find(link=>link.targetVersionId===id)?.targetItemStatus==='inactive'?' · Inactif':''}
          {savedLinks.find(link=>link.targetVersionId===id)?.targetItemStatus==='archived'?' · Archivé':''}
        </span>
        {editable&&<button type="button" className="secondary-button" disabled={saving} onClick={()=>setTargets(values=>values.filter(value=>value!==id))}>Retirer</button>}
      </div>)}
      {!targets.length&&<p className="muted">Aucune recommandation.</p>}
      {editable&&<div className="offer-component-editor">
        <select aria-label="Ajouter une recommandation" value="" disabled={saving} onChange={event=>{
          const id=event.target.value;if(id)setTargets(values=>values.includes(id)?values:[...values,id]);
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
