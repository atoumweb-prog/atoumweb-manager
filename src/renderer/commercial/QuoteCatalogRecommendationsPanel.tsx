import { useEffect,useRef,useState } from 'react';
import type { CatalogRecommendationLink,QuoteDetail,QuoteLine } from '../../shared/commercial';
import { quoteRecommendationState,QUOTE_RECOMMENDATION_STATE_LABELS } from '../../shared/quoteRecommendationStatus';
import { useUnsavedDraft } from '../unsaved/unsaved';

/** 04D: read-only advice until a user explicitly adds a line to an editable Quote. */
export function QuoteCatalogRecommendationsPanel({quote,source,onSave}:{
  quote:QuoteDetail;source:QuoteLine;onSave:(next:QuoteDetail)=>void;
}) {
  const sourceVersionId=source.catalogVersionId ??
    (typeof source.snapshot?.versionId==='string'?source.snapshot.versionId:'');
  const [links,setLinks]=useState<CatalogRecommendationLink[]>([]);
  const [loading,setLoading]=useState(Boolean(sourceVersionId));
  const [error,setError]=useState('');
  const [priceDrafts,setPriceDrafts]=useState<Record<string,string>>({});
  const [busy,setBusy]=useState(false);
  const saving=useRef(false);
  const epoch=useRef(0);
  const guard=useUnsavedDraft('Prix du complément recommandé',priceDrafts,{
    group:'quote:'+quote.id+'/recommendations:'+source.id,
    ready:Boolean(sourceVersionId)&&!loading,
    pending:busy,
    resetKey:sourceVersionId,
    discard:setPriceDrafts,
  });
  useEffect(()=>{
    const request=++epoch.current;
    setLinks([]);setError('');setLoading(Boolean(sourceVersionId));
    if(!sourceVersionId)return;
    void window.atoumweb.catalog.listRecommendations(sourceVersionId)
      .then(rows=>{if(request!==epoch.current)return;setLinks(rows);setLoading(false);})
      .catch(err=>{if(request!==epoch.current)return;
        setError(err instanceof Error?err.message:'Lecture des recommandations impossible.');
        setLoading(false);
      });
    return()=>{++epoch.current;};
  },[sourceVersionId]);
  const editable=quote.status==='draft'&&!quote.finalizedAt&&!quote.contractCompiledAt
    &&!quote.snapshotLockedAt&&quote.contractSnapshotJson==null;
  async function add(target:CatalogRecommendationLink) {
    if(saving.current||!editable||loading)return;
    const state=quoteRecommendationState(source,target,quote.lines);
    if(state!=='recommended')return;
    const priceText=priceDrafts[target.targetVersionId]?.trim()??'';
    let proposedUnitPriceCents: number|undefined;
    if(priceText) {
      const normalized=priceText.replace(',','.');
      if(!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
        setError('Prix proposé invalide : utilise un montant positif avec deux décimales au maximum.');
        return;
      }
      proposedUnitPriceCents=Math.round(Number(normalized)*100);
      if(!Number.isSafeInteger(proposedUnitPriceCents)) {
        setError('Montant trop élevé.');
        return;
      }
    }
    saving.current=true;setBusy(true);setError('');
    const sourceAtStart=sourceVersionId,quoteAtStart=quote.id,request=epoch.current;
    try {
      // The native service still enforces draft/status/price/contract locks on every call.
      const result=await window.atoumweb.quotes.addCatalogLine(quote.id,target.targetVersionId,
        proposedUnitPriceCents===undefined?{}:{proposedUnitPriceCents});
      if(request!==epoch.current||sourceAtStart!==sourceVersionId||quoteAtStart!==quote.id)return;
      setPriceDrafts({});
      guard.saved({});
      onSave(result);
    }catch(err) {
      if(request===epoch.current)setError(err instanceof Error?err.message:'Ligne non ajoutée au devis.');
    }finally {
      saving.current=false;
      if(request===epoch.current)setBusy(false);
    }
  }
  if(!sourceVersionId)return null;
  return <section className="quote-offer-composition" aria-label={'Recommandations de '+source.label}>
    <h4>Compléments conseillés pour {source.label} · v{String(source.snapshot?.versionNumber??'—')}</h4>
    <p className="muted">Conseils du Catalogue associés à cette version. Aucun service n’est acheté ni ajouté automatiquement.</p>
    {loading&&<p role="status">Chargement des recommandations…</p>}
    {error&&<p role="alert">{error}</p>}
    {!loading&&links.length===0&&!error&&<p className="muted">Aucune recommandation administrée pour cette version.</p>}
    {!loading&&links.map(link=>{
      const state=quoteRecommendationState(source,link,quote.lines);
      const eligible=state==='recommended'&&editable;
      return <div className="quote-offer-option" key={link.id}
        data-recommendation-version={link.targetVersionId} data-recommendation-state={state}>
        <div><strong>{link.targetName}</strong>
          <small>Service · v{link.targetVersionNumber}</small>
          <p>{QUOTE_RECOMMENDATION_STATE_LABELS[state]}</p>
        </div>
        {eligible&&<div className="quote-offer-option-actions">
          <label>Prix proposé (€), facultatif sauf sur devis
            <input inputMode="decimal" aria-label={'Prix proposé pour '+link.targetName}
              value={priceDrafts[link.targetVersionId]??''}
              onChange={e=>setPriceDrafts(current=>({...current,[link.targetVersionId]:e.target.value}))}
              disabled={busy} placeholder="Prix catalogue par défaut" />
          </label>
          <button className="secondary-button" type="button" disabled={busy}
            onClick={()=>void add(link)}>Ajouter ce service au devis</button>
        </div>}
        {state==='unavailable'&&<p>Ancienne recommandation conservée pour l’historique ; aucun achat possible.</p>}
        {state==='option-available'&&<p>Pour acheter cette option, utilise sa ligne dans « Options disponibles / achetées ».</p>}
        {!editable&&state==='recommended'&&<p>Devis verrouillé : recommandation consultative uniquement.</p>}
      </div>;
    })}
  </section>;
}
