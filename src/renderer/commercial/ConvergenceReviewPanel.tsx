import { useEffect, useMemo, useState } from 'react';
import type { ConvergenceReview } from '../../shared/convergenceReview';

const value = (input:unknown) => Array.isArray(input) ? input.join('\n• ') : input == null ? 'Non renseigné' : String(input);

export function ConvergenceReviewPanel({onPrepared}:{onPrepared:()=>Promise<void>}) {
  const [review,setReview]=useState<ConvergenceReview|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[query,setQuery]=useState('');
  const [selected,setSelected]=useState<string[]>([]),[reviewer,setReviewer]=useState(''),[note,setNote]=useState('');
  async function simulate(){setBusy(true);setError('');try{setReview(await window.atoumweb.convergenceReview.simulate());}catch(e){setError(e instanceof Error?e.message:String(e));}finally{setBusy(false);}}
  async function prepare(kind:'contract'|'catalog'){
    if(!review)return;setBusy(true);setError('');
    try{
      const next=kind==='contract'
        ?await window.atoumweb.convergenceReview.prepareContractDrafts(review.contract.planSha256)
        :await window.atoumweb.convergenceReview.prepareCatalogDrafts(review.catalog.rows.map(row=>row.requestId));
      setReview(next);await onPrepared();
    }catch(e){setError(e instanceof Error?e.message:String(e));}finally{setBusy(false);}
  }
  async function decide(decision:'approved_for_publication'|'needs_revision'){
    if(!review)return;setBusy(true);setError('');
    try{setReview(await window.atoumweb.convergenceReview.decideContractDrafts({codes:selected,decision,reviewer,note,expectedPlanSha256:review.contract.planSha256}));setSelected([]);setNote('');}
    catch(e){setError(e instanceof Error?e.message:String(e));}finally{setBusy(false);}
  }
  useEffect(()=>{void simulate();},[]);
  const contractRows=useMemo(()=>review?.contract.rows.filter(row=>[row.code,row.title,row.proposedTitle].join(' ').toLocaleLowerCase('fr').includes(query.toLocaleLowerCase('fr')))??[],[review,query]);
  const riskCounts=useMemo(()=>review?.contract.rows.reduce<Record<string,number>>((counts,row)=>({...counts,[row.risk]:(counts[row.risk]??0)+1}),{})??{},[review]);
  return <details className="convergence-review" open>
    <summary>Revue avant préparation — 118 clauses et 6 modifications Catalogue</summary>
    <p>La simulation est sans écriture. La préparation crée uniquement des versions brouillon après confirmation explicite ; aucune publication n’est effectuée.</p>
    {error&&<p role="alert" className="form-error">{error}</p>}
    {!review?<p>Simulation en cours…</p>:<>
      <div className="convergence-review-actions">
        <button type="button" className="secondary-button" disabled={busy} onClick={()=>void simulate()}>Relancer la simulation</button>
        <button type="button" disabled={busy||!!review.contract.anomalies.length||review.contract.counts.draftsToCreate===0} onClick={()=>void prepare('contract')}>Préparer {review.contract.counts.draftsToCreate} brouillons contractuels</button>
        <button type="button" disabled={busy||!!review.catalog.anomalies.length||review.catalog.rows.every(row=>row.draftPrepared)} onClick={()=>void prepare('catalog')}>Préparer les brouillons Catalogue</button>
      </div>
      <div className="convergence-review-summary">
        <span><strong>{review.contract.counts.draftsToCreate}</strong> clauses à préparer</span><span><strong>{review.contract.counts.draftsKept}</strong> déjà préparées</span><span><strong>{review.contract.counts.conflicts+review.catalog.anomalies.length}</strong> anomalie(s)</span><span><strong>{review.catalog.rows.filter(row=>row.draftPrepared).length}/6</strong> brouillons Catalogue</span>
      </div>
      <p><strong>Lecture humaine :</strong> {Object.entries(riskCounts).map(([risk,count])=>`${risk} : ${count}`).join(' · ')}. Les niveaux signalent une priorité de revue, jamais une validation juridique.</p>
      <div className="convergence-review-actions"><label>Relecteur<input value={reviewer} onChange={e=>setReviewer(e.target.value)} placeholder="Nom du responsable"/></label><label>Note de décision<input value={note} onChange={e=>setNote(e.target.value)} placeholder="Motif ou réserve éventuelle"/></label><button type="button" disabled={busy||!reviewer.trim()||!selected.length} onClick={()=>void decide('approved_for_publication')}>Marquer prêtes à soumettre ({selected.length})</button><button type="button" className="secondary-button" disabled={busy||!reviewer.trim()||!selected.length} onClick={()=>void decide('needs_revision')}>Demander une révision ({selected.length})</button></div>
      {(review.contract.anomalies.length>0||review.catalog.anomalies.length>0)&&<details open><summary>Anomalies bloquantes</summary><ul>{[...review.contract.anomalies,...review.catalog.anomalies].map(item=><li key={item}>{item}</li>)}</ul></details>}
      <details><summary>6 modifications Catalogue — publié / proposé</summary>{review.catalog.rows.map(row=><article key={row.canonicalCode} className="convergence-diff-card"><h4>{row.name} · {row.canonicalCode} {row.draftPrepared&&<small>Brouillon préparé</small>}</h4>{row.differences.map(diff=><div className="convergence-diff" key={diff.field}><strong>{diff.field}</strong><pre><b>Publié</b>{'\n'}{value(diff.published)}</pre><pre><b>Proposé</b>{'\n'}{value(diff.proposed)}</pre></div>)}</article>)}</details>
      <details><summary>118 propositions contractuelles — publié / proposé</summary><label>Rechercher une clause<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Code ou titre…"/></label><button type="button" className="secondary-button" onClick={()=>setSelected(contractRows.filter(row=>row.draftVersionId).map(row=>row.code))}>Sélectionner les brouillons affichés</button>{contractRows.map(row=><details key={row.code} className="convergence-clause"><summary><input type="checkbox" disabled={!row.draftVersionId} checked={selected.includes(row.code)} onChange={e=>setSelected(current=>e.target.checked?[...current,row.code]:current.filter(code=>code!==row.code))} onClick={e=>e.stopPropagation()}/> {row.code} · {row.proposedTitle} · {row.risk} · {row.decision==='approved_for_publication'?'Prête à soumettre':row.decision==='needs_revision'?'Révision demandée':row.action==='create'?'À préparer':row.action==='keep'?'Brouillon préparé':'Conflit'}</summary><p><strong>Famille :</strong> {row.family}</p>{row.decidedBy&&<p><strong>Dernière décision :</strong> {row.decidedBy} · {row.decidedAt&&new Date(row.decidedAt).toLocaleString('fr-FR')}{row.decisionNote&&` · ${row.decisionNote}`}</p>}{row.defect&&<p><strong>Point corrigé :</strong> {row.defect}</p>}{row.legalAssessment&&<p><strong>Vigilance :</strong> {row.legalAssessment}</p>}{row.externalReview&&<p><strong>Revue externe :</strong> {row.externalReview}</p>}{row.dependencies.length>0&&<p>Dépendances Catalogue : {row.dependencies.join(', ')}</p>}<div className="convergence-diff"><pre><b>Version publiée v{row.publishedVersion} — {row.title}</b>{'\n\n'}{row.publishedBody}</pre><pre><b>Nouvelle proposition — {row.proposedTitle}</b>{'\n\n'}{row.proposedBody}</pre></div></details>)}</details>
      <details><summary>Journal de traçabilité ({review.trace.length})</summary>{review.trace.length?<ul>{review.trace.map((entry,index)=><li key={entry.createdAt+index}>{new Date(entry.createdAt).toLocaleString('fr-FR')} — {entry.summary}</li>)}</ul>:<p>Aucune préparation enregistrée.</p>}</details>
    </>}
  </details>;
}
