import {useEffect,useRef,useState} from 'react';
import {useUnsavedDraft} from '../unsaved/unsaved';
import {CONTRACT_SECTION_ORDER,CONTRACT_SECTION_LABELS,type ContractSectionKey,type ContractSectionReview} from '../../shared/contractSectionPolicy';

/** Editorial classification of the selected clause VERSION, never legal approval or publication. */
export function ContractSectionReviewPanel({versionId,group}:{versionId:string;group:string}) {
  const [review,setReview]=useState<ContractSectionReview|null>(null);
  const [sectionKey,setSectionKey]=useState<ContractSectionKey>('object');
  const [rank,setRank]=useState('0');
  const [reason,setReason]=useState('');
  const [reviewer,setReviewer]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const activeRequest=useRef(0);
  const locked=useRef(false);
  useEffect(()=>{
    const request=++activeRequest.current;
    setReview(null);setError('');setReviewer('');
    void window.atoumweb.contractTerms.sectionReviews.get(versionId).then(value=>{
      if(request!==activeRequest.current)return;
      setReview(value);
      setSectionKey(value.sectionKey??'object');
      setRank(value.rankInSection===null?'0':String(value.rankInSection));
      setReason(value.status==='proposed'?value.reason:'');
    }).catch(e=>{if(request===activeRequest.current)setError(String(e));});
    return()=>{activeRequest.current+=1;};
  },[versionId]);
  const dirty=review!==null&&review.status!=='approved'&&
    (sectionKey!==(review.sectionKey??'object')||rank!==String(review.rankInSection??0)||
      reason!==(review.status==='proposed'?review.reason:''));
  useUnsavedDraft('Classement contractuel',{sectionKey,rank,reason},{
    group,ready:review!==null,resetKey:versionId,dirty,pending:busy,
    discard:()=>{setSectionKey(review?.sectionKey??'object');setRank(String(review?.rankInSection??0));setReason(review?.status==='proposed'?review.reason:'');},
  });
  const act=async(action:()=>Promise<ContractSectionReview>)=>{
    if(locked.current)return;
    locked.current=true;setBusy(true);setError('');
    const request=activeRequest.current;
    try {
      const value=await action();
      if(request===activeRequest.current){setReview(value);setSectionKey(value.sectionKey??'object');setRank(String(value.rankInSection??0));setReason(value.status==='proposed'?value.reason:'');}
    }catch(e){if(request===activeRequest.current)setError(e instanceof Error?e.message:String(e));}
    finally{locked.current=false;if(request===activeRequest.current)setBusy(false);}
  };
  return <section className="contract-type-detail" aria-label="Classement contractuel de la version">
    <h4>Rubrique juridique — classement éditorial 05C</h4>
    <p className="muted">Le classement est propre à cette version. Une proposition de GPT n'est jamais publiée automatiquement. Une approbation éditoriale ne vaut pas validation juridique du texte.</p>
    {!review&&<p role="status">Lecture du classement…</p>}
    {review&&<p role="status">{review.status==='unclassified'?'À classer — aucun rang confirmé':review.status==='proposed'?'Proposition — validation humaine nécessaire':`Classement approuvé par ${review.reviewer} le ${new Date(review.reviewedAt).toLocaleDateString('fr-FR')}`}</p>}
    {review?.status==='approved'
      ? <p>{CONTRACT_SECTION_LABELS[review.sectionKey]} · rang {review.rankInSection}. Pour changer le classement, préparer une nouvelle version.</p>
      : <fieldset disabled={busy||review===null}>
          <label>Rubrique<select aria-label="Rubrique de la version" value={sectionKey} onChange={e=>setSectionKey(e.target.value as ContractSectionKey)}>{CONTRACT_SECTION_ORDER.map(key=><option key={key} value={key}>{CONTRACT_SECTION_LABELS[key]}</option>)}</select></label>
          <label>Rang dans la rubrique<input aria-label="Rang de la version" type="number" min="0" step="1" value={rank} onChange={e=>setRank(e.target.value)}/></label>
          <label>Motif de proposition<textarea aria-label="Motif du classement" value={reason} onChange={e=>setReason(e.target.value)}/></label>
          <button type="button" disabled={busy||!reason.trim()||!Number.isSafeInteger(Number(rank))||Number(rank)<0} onClick={()=>void act(()=>window.atoumweb.contractTerms.sectionReviews.propose(versionId,sectionKey,Number(rank),reason))}>Enregistrer la proposition</button>
          {review?.status==='proposed'&&<>
            <label>Identité du valideur humain<input aria-label="Valideur du classement" value={reviewer} onChange={e=>setReviewer(e.target.value)}/></label>
            <button type="button" disabled={busy||dirty||!reviewer.trim()} onClick={()=>void act(()=>window.atoumweb.contractTerms.sectionReviews.approve(versionId,reviewer))}>Approuver le classement proposé</button>
          </>}
        </fieldset>}
    {error&&<p role="alert" className="form-error">{error}</p>}
  </section>;
}
