import {mergeContractClauseDrafts} from './contractClauseDraftMerge';
import {compareClauseField} from './contractClauseFieldDiff';
import {compareDraftContractClauses} from './contractDraftImpact';
import {planDraftContractAssembly} from '../../shared/draftContractAssemblyPlan';
import type {ContractSectionReview} from '../../shared/contractSectionPolicy';
import {isCurrentContractRequest} from './contractRequestGuard';
import {useUnsavedDraft} from '../unsaved/unsaved';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CatalogItemSummary, QuoteDetail } from '../../shared/commercial';
import { commercialAbbyBlock } from '../../shared/commercialAbby';
import { ContractReadPanel } from './ContractReadPanel';
import type { ContractPresentation } from '../../shared/contractPresentation';
import type {
  ContractClauseAudience,
  ContractClauseScope,
  ContractClauseTemplate,
  QuoteContractBuild,
  QuoteContractClause,
} from '../../shared/contractTerms';

interface ClauseDraft {
  title: string;
  body: string;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function sourceLabel(clause: QuoteContractClause): string {
  if (clause.sourceKind === 'base') return 'Socle AtoumWeb';
  if (clause.sourceKind === 'catalog') return 'Prestation';
  return 'Particulière';
}

export function ContractTermsBuilder({ quote }: { quote: QuoteDetail }) {
  const [build, setBuild] = useState<QuoteContractBuild | null>(null);
  const [templates, setTemplates] = useState<ContractClauseTemplate[]>([]);
  const [catalog, setCatalog] = useState<CatalogItemSummary[]>([]);
  const [drafts, setDrafts] = useState<Record<string, ClauseDraft>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const presentationRequest=useRef(0);
  const currentQuoteId=useRef(quote.id);
  currentQuoteId.current=quote.id;
  const loadRequest=useRef(0);
  const libraryRequest=useRef(0);
  const contractActionPending=useRef(false);
  const loadedQuoteId=useRef(quote.id);
  const [presentation,setPresentation]=useState<ContractPresentation|null>(null);
  const [sectionReviewStatus,setSectionReviewStatus]=useState<{loading:boolean;approved:number;pending:number;unresolved:number;error:string}|null>(null);
  const sectionRequest=useRef(0);
  const clauseEditorRef=useRef<HTMLDetailsElement|null>(null);
  const clauseDetailsRefs=useRef<Record<string,HTMLDetailsElement>>({});
  const [showLibrary, setShowLibrary] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [templateCode, setTemplateCode] = useState('');
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateScope, setTemplateScope] = useState<ContractClauseScope>('base');
  const [templateAudience, setTemplateAudience] = useState<ContractClauseAudience>('all');
  const [templateBody, setTemplateBody] = useState('');
  const [versionEditors, setVersionEditors] = useState<Record<string, string | undefined>>({});

  const editable = quote.status === 'draft' && !quote.finalizedAt && !quote.contractCompiledAt && quote.contractTextSnapshot == null && quote.contractSnapshotJson == null;
  const changedClauseIds=build?.clauses.filter(c=>drafts[c.id]&&(drafts[c.id].title!==c.title||drafts[c.id].body!==c.body)).map(c=>c.id)??[];
  const unsaved=changedClauseIds.length>0;

  useUnsavedDraft('Clauses du contrat',drafts,{ready:!!build,dirty:unsaved,pending:busy,discard:()=>setDrafts(Object.fromEntries((build?.clauses??[]).map(c=>[c.id,{title:c.title,body:c.body}])))});
  const customGuard=useUnsavedDraft('Nouvelle clause',{customTitle,customBody},{pending:busy,discard:s=>{setCustomTitle(s.customTitle);setCustomBody(s.customBody);}});
  const templateGuard=useUnsavedDraft('Modèle ou version de clause',{templateCode,templateTitle,templateScope,templateAudience,templateBody},{pending:busy,discard:s=>{setTemplateCode(s.templateCode);setTemplateTitle(s.templateTitle);setTemplateScope(s.templateScope);setTemplateAudience(s.templateAudience);setTemplateBody(s.templateBody);}});
  const changedVersionEditors=Object.fromEntries(Object.entries(versionEditors).filter(([id,body])=>body!==undefined&&body!==templates.flatMap(t=>t.versions).find(v=>v.id===id)?.body));
  useUnsavedDraft('Version de clause',changedVersionEditors,{pending:busy,discard:()=>setVersionEditors(Object.fromEntries(Object.keys(versionEditors).map(id=>[id,templates.flatMap(t=>t.versions).find(v=>v.id===id)?.body])))});
  const clauseOverview = useMemo(() => {
    const clauses=build?.clauses??[];
    return {
      included:clauses.filter(c=>c.enabled&&!c.isOrphaned),
      excluded:clauses.filter(c=>!c.enabled&&!c.isOrphaned),
      orphaned:clauses.filter(c=>c.isOrphaned),
    };
  },[build]);

  function showClause(clauseId:string):void {
    const clause=clauseDetailsRefs.current[clauseId];
    if(!clause)return;
    if(clauseEditorRef.current)clauseEditorRef.current.open=true;
    clause.open=true;
    clause.scrollIntoView({behavior:'smooth',block:'center'});
    clause.querySelector('summary')?.focus();
  }

  const clauseChanges=useMemo(()=> (build?.clauses??[]).flatMap(clause=>{
    const draft=drafts[clause.id];
    if(!draft)return [];
    const titleChanged=draft.title!==clause.title;
    const bodyChanged=draft.body!==clause.body;
    return titleChanged||bodyChanged?[{id:clause.id,title:clause.title,titleChanged,bodyChanged,titleDiff:compareClauseField(clause.title,draft.title),bodyDiff:compareClauseField(clause.body,draft.body)}]:[];
  }),[build,drafts]);

  const localImpact=useMemo(()=>{
    const saved=build?.clauses??[];
    const projected=saved.map(clause=>({...clause,
      title:drafts[clause.id]?.title??clause.title,
      body:drafts[clause.id]?.body??clause.body,
    }));
    try {return {changes:compareDraftContractClauses(saved,projected),error:''};}
    catch(cause){return {changes:[],error:errorMessage(cause)};}
  },[build,drafts]);

  const counts = useMemo(() => {
    const clauses = build?.clauses ?? [];
    return {
      base: clauses.filter((clause) => clause.sourceKind === 'base' && clause.enabled).length,
      catalog: clauses.filter((clause) => clause.sourceKind === 'catalog' && clause.enabled).length,
      custom: clauses.filter((clause) => clause.sourceKind === 'custom' && clause.enabled).length,
    };
  }, [build]);

  function setBuildAndDrafts(next: QuoteContractBuild,saved?:{id:string;draft:ClauseDraft}): void {
    if(currentQuoteId.current!==quote.id)return;
    setBuild(next);
    const request=++presentationRequest.current;
    setPresentation(null);
    void window.atoumweb.contractTerms.quotes.presentation(quote.id).then(value=>{if(isCurrentContractRequest(quote.id,currentQuoteId.current,request,presentationRequest.current))setPresentation(value);}).catch(e=>{if(request===presentationRequest.current&&currentQuoteId.current===quote.id)setError(errorMessage(e));});
    setDrafts(current=>mergeContractClauseDrafts(build?.clauses??[],current,next.clauses,saved));
  }

  async function refreshLibrary(): Promise<void> {
    const quoteId = quote.id;
    const request = ++libraryRequest.current;
    const [nextTemplates, nextCatalog] = await Promise.all([
      window.atoumweb.contractTerms.library.list(),
      window.atoumweb.catalog.list({ status: 'active' }),
    ]);
    if (!isCurrentContractRequest(quoteId, currentQuoteId.current, request, libraryRequest.current)) return;
    setTemplates(nextTemplates);
    setCatalog(nextCatalog);
  }

  async function load(): Promise<void> {
    const quoteId=quote.id;
    const request=++loadRequest.current;
    const isCurrent=()=>isCurrentContractRequest(quoteId,currentQuoteId.current,request,loadRequest.current);
    setLoading(true);
    setError('');
    try {
      const next = editable
        ? await window.atoumweb.contractTerms.quotes.sync(quoteId)
        : await window.atoumweb.contractTerms.quotes.get(quoteId);
      if(!isCurrent())return;
      setBuildAndDrafts(next);
      const [nextTemplates,nextCatalog]=await Promise.all([
        window.atoumweb.contractTerms.library.list(),
        window.atoumweb.catalog.list({status:'active'}),
      ]);
      if(!isCurrent())return;
      setTemplates(nextTemplates);
      setCatalog(nextCatalog);
    } catch (cause) {
      if(isCurrent())setError(errorMessage(cause));
    } finally {
      if(isCurrent())setLoading(false);
    }
  }

  useEffect(() => {
    const request=++sectionRequest.current;
    if(!editable||build?.snapshotState!=='draft'||build.quoteId!==quote.id){
      setSectionReviewStatus(null);
      return ()=>{sectionRequest.current++;};
    }
    const selected=build.clauses.filter(clause=>clause.enabled&&!clause.isOrphaned);
    const versioned=selected.filter(clause=>!!clause.sourceClauseVersionId);
    setSectionReviewStatus({loading:true,approved:0,pending:0,unresolved:0,error:''});
    void Promise.all(versioned.map(async clause=>({
      clause,review:await window.atoumweb.contractTerms.sectionReviews.get(clause.sourceClauseVersionId!),
    }))).then(entries=>{
      if(request!==sectionRequest.current||currentQuoteId.current!==quote.id)return;
      const plan=planDraftContractAssembly(entries.map(({clause,review})=>({
        id:clause.id,versionId:clause.sourceClauseVersionId!,section:review,
      })),{audience:build.audience},[]);
      setSectionReviewStatus({
        loading:false,approved:plan.included.length,
        pending:plan.unreviewed.length+selected.length-versioned.length,
        unresolved:plan.unresolved.length,error:'',
      });
    }).catch(error=>{
      if(request===sectionRequest.current&&currentQuoteId.current===quote.id)
        setSectionReviewStatus({loading:false,approved:0,pending:0,unresolved:0,error:errorMessage(error)});
    });
    return ()=>{sectionRequest.current++;};
  },[quote.id,editable,build]);

  useEffect(() => {
    // A previous quote's responses must not repaint the newly selected quote.
    presentationRequest.current+=1;
    libraryRequest.current+=1;
    if(loadedQuoteId.current!==quote.id){
      loadedQuoteId.current=quote.id;
      setBuild(null);
      setPresentation(null);
      setBusy(false);
      setDrafts({});
      setTemplates([]);
      setCatalog([]);
      setVersionEditors({});
    }
    void load();
    return ()=>{loadRequest.current+=1;presentationRequest.current+=1;libraryRequest.current+=1;};
  }, [quote.id, quote.status, quote.finalizedAt, quote.contractCompiledAt, quote.updatedAt]);

  async function run(action: () => Promise<QuoteContractBuild>,saved?:{id:string;draft:ClauseDraft}): Promise<boolean> {
    // Synchronous lock: a second click can arrive before React commits busy=true.
    if(contractActionPending.current)return false;
    contractActionPending.current=true;
    const quoteId=quote.id;
    setBusy(true);
    setError('');
    try {
      const result=await action();
      if(currentQuoteId.current!==quoteId)return false;
      setBuildAndDrafts(result,saved);return true;
    } catch (cause) {
      if(currentQuoteId.current===quoteId)setError(errorMessage(cause));
      return false;
    } finally {
      contractActionPending.current=false;
      if(currentQuoteId.current===quoteId)setBusy(false);
    }
  }

  async function sync(): Promise<void> {
    await run(() => window.atoumweb.contractTerms.quotes.sync(quote.id));
  }

  async function saveClause(clause: QuoteContractClause): Promise<void> {
    const draft = drafts[clause.id];
    if (!draft) return;
    await run(() => window.atoumweb.contractTerms.quotes.updateClause(clause.id, {
      title: draft.title,
      body: draft.body,
    }),{id:clause.id,draft});
  }

  async function toggleClause(clause: QuoteContractClause): Promise<void> {
    await run(() => window.atoumweb.contractTerms.quotes.updateClause(clause.id, { enabled: !clause.enabled }));
  }

  async function resetClause(clause: QuoteContractClause): Promise<void> {
    await run(() => window.atoumweb.contractTerms.quotes.resetClause(clause.id));
  }

  async function removeCustom(clause: QuoteContractClause): Promise<void> {
    await run(() => window.atoumweb.contractTerms.quotes.removeCustom(clause.id));
  }

  async function moveClause(clauseId: string, direction: -1 | 1): Promise<void> {
    if (!build) return;
    const ids = build.clauses.map((clause) => clause.id);
    const index = ids.indexOf(clauseId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    await run(() => window.atoumweb.contractTerms.quotes.reorder(quote.id, ids));
  }

  async function addCustom(): Promise<void> {
    if (!customTitle.trim()) {
      setError('Renseigne le titre de la clause particulière.');
      return;
    }
    if(!await run(() => window.atoumweb.contractTerms.quotes.addCustom(quote.id, {
      title: customTitle,
      body: customBody,
    })))return;
    setCustomTitle('');
    setCustomBody('');
    setShowCustom(false);
  }

  async function createTemplate(): Promise<void> {
    if (!templateCode.trim() || !templateTitle.trim() || !templateBody.trim()) {
      setError('Code, titre et texte sont requis pour créer une clause.');
      return;
    }
    if(contractActionPending.current)return;
    contractActionPending.current=true;
    setBusy(true);
    setError('');
    try {
      await window.atoumweb.contractTerms.library.create(
        { code: templateCode, title: templateTitle, scope: templateScope, audience: templateAudience },
        { body: templateBody },
      );
      setTemplateCode('');
      setTemplateTitle('');
      setTemplateBody('');
      setTemplateScope('base');
      setTemplateAudience('all');
      setShowCreateTemplate(false);
      await refreshLibrary();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      contractActionPending.current=false;
      setBusy(false);
    }
  }

  async function saveDraftVersion(template: ContractClauseTemplate): Promise<void> {
    const body = versionEditors[template.id];
    if (!body?.trim()) {
      setError('Le texte de la nouvelle version est vide.');
      return;
    }
    if(contractActionPending.current)return;
    contractActionPending.current=true;
    setBusy(true);
    setError('');
    try {
      await window.atoumweb.contractTerms.library.createVersion(template.id, { body });
      setVersionEditors((current) => ({ ...current, [template.id]: undefined }));
      await refreshLibrary();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      contractActionPending.current=false;
      setBusy(false);
    }
  }

  async function publishDraft(versionId: string): Promise<void> {
    if(contractActionPending.current)return;
    contractActionPending.current=true;
    setBusy(true);
    setError('');
    try {
      await window.atoumweb.contractTerms.library.publishVersion(versionId);
      await refreshLibrary();
      if (editable) setBuildAndDrafts(await window.atoumweb.contractTerms.quotes.sync(quote.id));
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      contractActionPending.current=false;
      setBusy(false);
    }
  }

  async function toggleCatalogLink(template: ContractClauseTemplate, itemId: string): Promise<void> {
    const next = template.catalogItemIds.includes(itemId)
      ? template.catalogItemIds.filter((id) => id !== itemId)
      : [...template.catalogItemIds, itemId];
    if(contractActionPending.current)return;
    contractActionPending.current=true;
    setBusy(true);
    setError('');
    try {
      await window.atoumweb.contractTerms.library.setCatalogLinks(template.id, next);
      await refreshLibrary();
      if (editable) setBuildAndDrafts(await window.atoumweb.contractTerms.quotes.sync(quote.id));
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      contractActionPending.current=false;
      setBusy(false);
    }
  }

  async function changeTemplateAudience(template: ContractClauseTemplate, audience: ContractClauseAudience): Promise<void> {
    if(contractActionPending.current)return;
    contractActionPending.current=true;
    setBusy(true);
    setError('');
    try {
      await window.atoumweb.contractTerms.library.setAudience(template.id, audience);
      await refreshLibrary();
      if (editable) setBuildAndDrafts(await window.atoumweb.contractTerms.quotes.sync(quote.id));
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      contractActionPending.current=false;
      setBusy(false);
    }
  }

  async function toggleTemplateStatus(template: ContractClauseTemplate): Promise<void> {
    if(contractActionPending.current)return;
    contractActionPending.current=true;
    setBusy(true);
    setError('');
    try {
      await window.atoumweb.contractTerms.library.setStatus(
        template.id,
        template.status === 'active' ? 'inactive' : 'active',
      );
      await refreshLibrary();
      if (editable) setBuildAndDrafts(await window.atoumweb.contractTerms.quotes.sync(quote.id));
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      contractActionPending.current=false;
      setBusy(false);
    }
  }

  if (loading) {
    return <section className="cgv-builder"><p className="muted">Préparation des CGV du devis…</p></section>;
  }

  return (
    <section className="cgv-builder">
      <div className="cgv-builder-heading">
        <div>
          <span className="eyebrow">Devis contractuel</span>
          <h3>Contrat & CGV du devis</h3>
          <p className="muted">Le socle AtoumWeb et les clauses liées aux prestations sont assemblés ici, puis copiés dans le champ CGV d’Abby.</p>
        </div>
        <div className="cgv-builder-heading-actions">
          {editable && <button className="secondary-button" type="button" disabled={busy} onClick={() => void sync()}>↻ Synchroniser</button>}
          <button className="secondary-button" type="button" onClick={() => setShowLibrary((value) => !value)}>{showLibrary ? 'Masquer la bibliothèque' : 'Bibliothèque CGV'}</button>
        </div>
      </div>

      <div className="cgv-builder-summary">
        <span><strong>{counts.base}</strong> socle</span>
        <span><strong>{counts.catalog}</strong> prestation(s)</span>
        <span><strong>{counts.custom}</strong> particulière(s)</span>
        <span className="status-pill">{build?.audience === 'professional' ? 'Client professionnel' : 'Client particulier'}</span>
        {build?.snapshotState === 'frozen' && <span className="status-pill">Snapshot figé{build.snapshotText === '' ? ' · vide' : ''}</span>}
        {build?.snapshotState === 'historical_missing' && <span className="status-pill">Absence historique de snapshot</span>}
      </div>

      {build?.snapshotState === 'draft' && sectionReviewStatus && <p role="status" className="muted">
        Classement 05C (lecture seule) : {sectionReviewStatus.loading ? 'vérification des versions…' :
          sectionReviewStatus.error ? 'classement indisponible — '+sectionReviewStatus.error :
          sectionReviewStatus.approved+' version(s) approuvée(s), '+sectionReviewStatus.pending+' à examiner'+
          (sectionReviewStatus.unresolved ? ', '+sectionReviewStatus.unresolved+' conditions non résolues' : '')}.
        Cette indication ne modifie ni l’ordre actuel, ni le texte, ni la finalisation du devis.
      </p>}
      {build?.snapshotState === 'draft' && <p className="muted" role="status">Contrat en préparation : les clauses peuvent encore évoluer tant que le devis reste modifiable. La version contractuelle sera figée lors de la finalisation.</p>}
      {build?.snapshotState === 'frozen' && <p className="muted" role="status">Contrat figé : le contenu conservé avec ce devis fait foi dans le Manager. Les changements ultérieurs de la bibliothèque ne modifient pas cette version{build.snapshotText === '' ? ', même lorsque son texte est vide' : ''}.</p>}
      {build?.snapshotState === 'historical_missing' && <p className="cgv-warning" role="status">Devis historique sans snapshot contractuel conservé : aucune reconstitution automatique à partir des CGV actuelles. Vérifier les pièces contractuelles originales avant toute utilisation.</p>}
      {build?.warnings.map((warning) => <div className="cgv-warning" key={warning}>{warning}</div>)}
      {error && <p className="form-error" role="alert">{error}</p>}

      {build?.snapshotState==='draft' && <details className="cgv-editing">
        <summary>Sommaire et points de vigilance du brouillon ({clauseOverview.included.length} incluse(s))</summary>
        <p className="muted">Vue informative basée sur les clauses actuellement enregistrées. Le classement canonique 05C reste en préparation ; aucun nouvel ordre n’est appliqué au contrat.</p>
        <ol>
          {clauseOverview.included.map(clause=><li key={clause.id}><button type="button" className="secondary-button compact-button" onClick={()=>showClause(clause.id)}>Voir : {clause.title}</button>{clause.isCustomized?' · adaptée pour ce devis':''}</li>)}
        </ol>
        {clauseOverview.excluded.length>0 && <div className="cgv-warning"><p>{clauseOverview.excluded.length} clause(s) exclue(s) du devis — contrôler leur pertinence.</p><ul>{clauseOverview.excluded.map(clause=><li key={clause.id}><button type="button" className="secondary-button compact-button" onClick={()=>showClause(clause.id)}>Examiner : {clause.title}</button></li>)}</ul></div>}
        {clauseOverview.orphaned.length>0 && <div className="cgv-warning"><p>{clauseOverview.orphaned.length} clause(s) orpheline(s) : prestation retirée — contrôler avant finalisation.</p><ul>{clauseOverview.orphaned.map(clause=><li key={clause.id}><button type="button" className="secondary-button compact-button" onClick={()=>showClause(clause.id)}>Examiner : {clause.title}</button></li>)}</ul></div>}
        {localImpact.error && <p className="cgv-warning" role="alert">Comparaison d’impact indisponible : {localImpact.error}</p>}
        {localImpact.changes.length>0 && <p className="muted" role="status">Analyse d’impact du brouillon : {localImpact.changes.length} clause(s) modifiée(s) par rapport aux valeurs enregistrées. Aucun changement n’est appliqué automatiquement.</p>}
        {unsaved && <div role="status" className="cgv-warning">
          <strong>{clauseChanges.length} clause(s) modifiée(s) non enregistrée(s).</strong>
          <p>Comparaison indicative avec la dernière version enregistrée (sans diffusion ni sauvegarde automatique).</p>
          <ul>{clauseChanges.map(change=><li key={change.id}>
            <button type="button" className="secondary-button compact-button" onClick={()=>showClause(change.id)}>Examiner : {change.title}</button> : {change.titleChanged?'titre modifié':''}{change.titleChanged&&change.bodyChanged?' et ':''}{change.bodyChanged?'texte modifié':''}
            <div className="muted">
              {change.titleChanged&&<p>Titre : retrait «{change.titleDiff.removedExcerpt}», ajout «{change.titleDiff.addedExcerpt}»{change.titleDiff.truncated?' (extrait limité)':''}</p>}
              {change.bodyChanged&&<p>Texte : retrait «{change.bodyDiff.removedExcerpt}», ajout «{change.bodyDiff.addedExcerpt}»{change.bodyDiff.truncated?' (extrait limité)':''}</p>}
            </div>
          </li>)}</ul>
        </div>}
      </details>}
      {presentation&&<ContractReadPanel presentation={presentation} commercial={commercialAbbyBlock(quote)} unsaved={unsaved}/>}
      <details className="cgv-editing" ref={clauseEditorRef}><summary>Adapter les clauses de ce devis ({build?.clauses.length ?? 0})</summary>
      <p className="muted">Les clauses sont présentées dans l’ordre contractuel du devis. Socle : commun et non modifiable ici ; prestation : déclenchée par une prestation ; particulière : propre à ce devis. Les clauses exclues et orphelines restent visibles pour contrôle.</p>
      {unsaved && <p role="status" className="cgv-warning">{changedClauseIds.length} clause(s) modifiée(s) non enregistrée(s) : enregistre chaque clause concernée avant la finalisation ou la sortie.</p>}
      <div className="cgv-clause-list">
        {build?.clauses.map((clause, index) => {
          const draft = drafts[clause.id] ?? { title: clause.title, body: clause.body };
          const clauseClass = 'cgv-clause' + (clause.enabled ? '' : ' disabled') + (clause.isOrphaned ? ' orphaned' : '');
          return (
            <details className={clauseClass} key={clause.id} ref={node=>{if(node)clauseDetailsRefs.current[clause.id]=node;else delete clauseDetailsRefs.current[clause.id];}}>
              <summary>
                <div>
                  <span className={'cgv-source source-' + clause.sourceKind}>{sourceLabel(clause)}</span>
                  <strong>{clause.title}</strong>
                  {clause.isCustomized && <small>Modifiée pour ce devis</small>}
                  {changedClauseIds.includes(clause.id) && <small>Modifications non enregistrées</small>}
                  {clause.isOrphaned && <small>Prestation retirée · clause désactivée automatiquement</small>}
                </div>
                <div className="cgv-clause-summary-actions">
                  <span>{clause.enabled ? 'Incluse' : 'Exclue'}</span>
                  <span>#{index + 1}</span>
                </div>
              </summary>
              <div className="cgv-clause-editor">
                <label>Titre<input disabled={!editable || clause.sourceKind === 'base'} value={draft.title} onChange={(event) => setDrafts((current) => ({ ...current, [clause.id]: { ...draft, title: event.target.value } }))} /></label>
                <label>Texte<textarea disabled={!editable || clause.sourceKind === 'base'} value={draft.body} onChange={(event) => setDrafts((current) => ({ ...current, [clause.id]: { ...draft, body: event.target.value } }))} /></label>
                {editable && <div className="cgv-clause-actions">
                  {clause.sourceKind === 'base'
                    ? <span className="status-pill">Socle fixe</span>
                    : <>
                        <button className="primary-button compact-button" type="button" disabled={busy} onClick={() => void saveClause(clause)}>Enregistrer</button>
                        <button className="secondary-button compact-button" type="button" disabled={busy} onClick={() => void toggleClause(clause)}>{clause.enabled ? 'Exclure du devis' : 'Inclure dans le devis'}</button>
                      </>}
                  {clause.sourceClauseId && clause.isCustomized && <button className="secondary-button compact-button" type="button" disabled={busy} onClick={() => void resetClause(clause)}>Revenir au modèle</button>}
                  {clause.sourceKey.startsWith('custom:') && <button className="secondary-button compact-button danger-outline" type="button" disabled={busy} onClick={() => void removeCustom(clause)}>Supprimer</button>}
                  <span className="cgv-spacer" />
                  <button className="secondary-button compact-button" type="button" disabled={busy || index === 0} title="Monter la clause" onClick={() => void moveClause(clause.id, -1)}>↑</button>
                  <button className="secondary-button compact-button" type="button" disabled={busy || index === (build?.clauses.length ?? 1) - 1} title="Descendre la clause" onClick={() => void moveClause(clause.id, 1)}>↓</button>
                </div>}
              </div>
            </details>
          );
        })}
        {build?.clauses.length === 0 && <div className="empty-table">{build.locked ? 'Aucune clause conservée pour ce devis. La bibliothèque actuelle ne sera pas appliquée rétroactivement.' : 'Aucune clause configurée. Ouvre la Bibliothèque CGV pour préparer le socle AtoumWeb.'}</div>}
      </div>

      {editable && <div className="cgv-particular">
        {!showCustom
          ? <button className="secondary-button" type="button" onClick={() => setShowCustom(true)}>+ Ajouter une clause particulière</button>
          : <div className="cgv-custom-form">
              <label>Titre<input value={customTitle} onChange={(event) => setCustomTitle(event.target.value)} placeholder="Ex. Livraison en deux phases" /></label>
              <label>Texte<textarea value={customBody} onChange={(event) => setCustomBody(event.target.value)} /></label>
              <div><button className="primary-button" type="button" disabled={busy} onClick={() => void addCustom()}>Ajouter au devis</button><button className="secondary-button" type="button" onClick={() => {customGuard.discard();setShowCustom(false);}}>Annuler</button></div>
            </div>}
      </div>}

      </details>
      {showLibrary && <div className="cgv-library">
        <div className="cgv-library-heading">
          <div><strong>Bibliothèque CGV AtoumWeb</strong><span>Les versions publiées alimentent les devis brouillons. Les devis déjà finalisés ne changent jamais.</span></div>
          <button className="primary-button" type="button" onClick={() => setShowCreateTemplate((value) => !value)}>{showCreateTemplate ? 'Fermer' : '+ Nouvelle clause'}</button>
        </div>

        {showCreateTemplate && <div className="cgv-template-form">
          <div className="cgv-template-fields">
            <label>Code<input value={templateCode} onChange={(event) => setTemplateCode(event.target.value)} placeholder="CGV-PAIEMENT" /></label>
            <label>Titre<input value={templateTitle} onChange={(event) => setTemplateTitle(event.target.value)} placeholder="Modalités de paiement" /></label>
            <label>Type<select value={templateScope} onChange={(event) => setTemplateScope(event.target.value as ContractClauseScope)}><option value="base">Socle commun</option><option value="catalog">Liée aux prestations</option></select></label>
            <label>Public<select value={templateAudience} onChange={(event) => setTemplateAudience(event.target.value as ContractClauseAudience)}><option value="all">Tous les clients</option><option value="professional">Professionnels</option><option value="consumer">Particuliers</option></select></label>
          </div>
          <label>Texte de la version 1<textarea value={templateBody} onChange={(event) => setTemplateBody(event.target.value)} /></label>
          <p className="muted">L’enregistrement crée un brouillon. Seule une publication explicite le rend disponible dans les devis.</p>
          <button className="primary-button" type="button" disabled={busy} onClick={() => void createTemplate()}>Enregistrer le brouillon</button>
        </div>}

        <div className="cgv-template-list">
          {templates.map((template) => (
            <details className="cgv-template" key={template.id}>
              <summary>
                <div><strong>{template.title}</strong><span>{template.code} · {template.scope === 'base' ? 'Socle commun' : 'Clause prestation'} · {template.audience === 'all' ? 'Tous clients' : template.audience === 'professional' ? 'Professionnels' : 'Particuliers'} · {template.currentVersion ? `v${template.currentVersion.versionNumber} publiée` : 'Brouillon · non publié'}</span></div>
                <span className={'catalog-status status-' + template.status}>{template.status === 'active' ? 'Active' : template.status === 'inactive' ? 'Inactive' : 'Archivée'}</span>
              </summary>
              <div className="cgv-template-body">
                <label>Public d'application<select value={template.audience} disabled={busy || template.status === 'archived'} onChange={(event) => void changeTemplateAudience(template, event.target.value as ContractClauseAudience)}><option value="all">Tous les clients</option><option value="professional">Professionnels</option><option value="consumer">Particuliers / consommateurs</option></select></label>
                <label>Version publiée<textarea readOnly value={template.currentVersion?.body ?? 'Aucune version publiée.'} /></label>
                {template.versions.filter((version) => version.status === 'draft').map((version) => (
                  <div className="cgv-version-editor" key={version.id}>
                    <label>Brouillon · v{version.versionNumber}<textarea readOnly value={version.body} /></label>
                    {version.review && <details className="cgv-review">
                      <summary>Revue documentaire · {version.review.level}</summary>
                      <p className="muted">Le niveau de revue décrit le brouillon ; il ne constitue ni une publication ni une déclaration de conformité juridique.</p>
                      <dl>
                        <dt>Dernière vérification documentée</dt><dd>{version.review.verifiedAt ?? 'Non renseignée'}</dd>
                        <dt>Sources officielles</dt><dd style={{ whiteSpace: 'pre-wrap' }}>{version.review.sources ?? 'Non renseignées'}</dd>
                        <dt>Réserves</dt><dd>{version.review.reserve ?? 'Non renseignées'}</dd>
                        <dt>Risque et précautions</dt><dd>{version.review.risk} {version.review.prudence}</dd>
                        <dt>Revue finale / appui externe</dt><dd>{version.review.finalReview} {version.review.externalSupport}</dd>
                        <dt>Paramètres du devis</dt><dd>{version.review.parameters}</dd>
                        <dt>Dépendances documentaires</dt><dd>{version.review.dependencies}</dd>
                        <dt>Décisions métier</dt><dd>{version.review.businessDecisions}</dd>
                        <dt>Suivi rédactionnel</dt><dd>{version.review.editorialDecision} · {version.review.editorialStatus}</dd>
                        <dt>Provenance</dt><dd>{version.review.provenance.reference} · {version.review.provenance.bodyCell}</dd>
                        <dt>Empreinte du référentiel</dt><dd style={{ overflowWrap: 'anywhere' }}>{version.review.provenance.sha256}</dd>
                      </dl>
                    </details>}
                    <button className="primary-button compact-button" type="button" disabled={busy || template.status === 'archived'} onClick={() => void publishDraft(version.id)}>Publier le brouillon v{version.versionNumber}</button>
                  </div>
                ))}
                <div className="cgv-template-actions">
                  <button className="secondary-button compact-button" type="button" disabled={busy || template.status === 'archived'} onClick={() => setVersionEditors((current) => ({ ...current, [template.id]: current[template.id] === undefined ? (template.currentVersion?.body ?? '') : undefined }))}>{versionEditors[template.id] === undefined ? 'Nouvelle version' : 'Annuler la version'}</button>
                  {template.status !== 'archived' && <button className="secondary-button compact-button" type="button" disabled={busy} onClick={() => void toggleTemplateStatus(template)}>{template.status === 'active' ? 'Désactiver' : 'Réactiver'}</button>}
                </div>
                {versionEditors[template.id] !== undefined && <div className="cgv-version-editor">
                  <label>Nouvelle version<textarea value={versionEditors[template.id] ?? ''} onChange={(event) => setVersionEditors((current) => ({ ...current, [template.id]: event.target.value }))} /></label>
                  <button className="primary-button compact-button" type="button" disabled={busy} onClick={() => void saveDraftVersion(template)}>Enregistrer la version en brouillon</button>
                </div>}
                {template.scope === 'catalog' && <div className="cgv-catalog-links">
                  <strong>Prestations qui déclenchent cette clause ({template.catalogItemIds.length})</strong>
                  <div>{catalog.map((item) => <label key={item.id}><input type="checkbox" checked={template.catalogItemIds.includes(item.id)} disabled={busy} onChange={() => void toggleCatalogLink(template, item.id)} /><span>{item.type === 'offer' ? 'Offre' : 'Service'} · {item.name}</span></label>)}</div>
                </div>}
              </div>
            </details>
          ))}
          {templates.length === 0 && <p className="muted">La bibliothèque est vide. Commence par créer les clauses du socle commun.</p>}
        </div>
      </div>}
    </section>
  );
}
