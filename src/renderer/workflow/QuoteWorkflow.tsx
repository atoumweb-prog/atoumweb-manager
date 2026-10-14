import {useDraftSection} from '../unsaved/useDraftSection';
import {useUnsavedDraft} from '../unsaved/unsaved';
import {ProjectCommercialScopePanel} from '../projects/ProjectCommercialScopePanel';
import { QuoteContractPreparationPanel } from '../commercial/QuoteContractPreparationPanel';
import {useEffect,useRef,useState} from 'react';
import type {QuoteDetail} from '../../shared/commercial';
import { findCurrentQuoteProject } from '../../shared/quoteProjectEligibility';
import type {ProjectSummary,ProjectTemplateSummary,ProjectCommercialPreview} from '../../shared/projects';
import {ContractTermsBuilder} from '../commercial/ContractTermsBuilder';
import {changed,openEntity} from './DossierPanel';
export function QuoteProjectPanel({quote,requirePreviewBeforePrepare=false}:{quote:QuoteDetail;requirePreviewBeforePrepare?:boolean}){
  const [templates,setTemplates]=useState<ProjectTemplateSummary[]>([]),[project,setProject]=useState<ProjectSummary|null>(null),[template,setTemplate]=useState(''),[date,setDate]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [preview,setPreview]=useState<ProjectCommercialPreview|null>(null);
  const [loadingProject,setLoadingProject]=useState(true),[lookupFailed,setLookupFailed]=useState(false);
  useUnsavedDraft('Préparation du Projet depuis le devis', {template,date}, {
    group:'quote:'+quote.id+'/project', ready:!project, pending:busy,
    discard:()=>{setTemplate('');setDate('');setPreview(null);},
  });
  useEffect(()=>{
    let current=true;
    setTemplate('');setError('');setPreview(null);setProject(null);setLoadingProject(true);setLookupFailed(false);
    Promise.all([window.atoumweb.projects.templates.list(),window.atoumweb.projects.projects.list()])
      .then(async ([t,p])=>{
        if(!current)return;
        const linked=await findCurrentQuoteProject(quote,p,async id=>(await window.atoumweb.projects.projects.commercialScope(id)).currentQuoteId);
        if(!current)return;
        setTemplates(t.filter(item=>item.currentVersion?.status==='published'));
        setProject(linked);
      })
      .catch(e=>{if(current){setLookupFailed(true);setError(e instanceof Error?e.message:String(e));}})
      .finally(()=>{if(current)setLoadingProject(false);});
    return ()=>{current=false;};
  },[quote.id,quote.projectId,quote.status,quote.updatedAt]);
  async function create(){
    if(loadingProject||lookupFailed||project)return;
    if(requirePreviewBeforePrepare&&quote.status!=='accepted'&&!preview){setError('Vérifie le plan avant de confirmer la préparation du Projet.');return;}
    setBusy(true);setError('');
    try{
      const input={quoteId:quote.id,templateVersionId:template||null,targetDate:date||null},api=window.atoumweb.projects.projects;
      const checked=quote.status==='accepted'?null:preview??await api.previewQuote(input);
      const p=quote.status==='accepted'?await api.transformQuote(input):await api.prepareQuote({...input,previewSHA256:checked!.sha256});
      setProject(p);changed();
    }catch(e){
      setError(e instanceof Error?e.message:String(e));
    }finally{setBusy(false);}
  }
  async function inspectPlan(){setBusy(true);setError('');try{setPreview(await window.atoumweb.projects.projects.previewQuote({quoteId:quote.id,templateVersionId:template||null,targetDate:date||null}));}catch(e){setPreview(null);setError(e instanceof Error?e.message:String(e));}finally{setBusy(false);}}
  return <section className="workflow-fields quote-project-create">
    <h3>{quote.status==='accepted'?'Projet du devis accepté':'Préparer le Projet'}</h3>
    {loadingProject ? <p role="status">Vérification du Projet déjà lié au devis…</p> : lookupFailed ? <p className="form-error" role="alert">Vérification du Projet impossible : {error}. Aucun nouveau Projet ne sera créé tant que le lien existant n'est pas vérifié.</p> : project
      ? <>{project.commercialState==='provisional'&&quote.status!=='accepted'&&<p role="status">Projet en préparation — devis non signé.</p>}<button type="button" className="primary-button" onClick={()=>openEntity({entityType:'project',entityId:project.id,title:project.name})}>Ouvrir {project.name}</button><ProjectCommercialScopePanel key={project.id+project.commercialState+quote.status} projectId={project.id} onChanged={setProject}/></>
      : <>
          <p>Préparer les étapes, Sites, Pages et prérequis depuis les lignes du devis. Les options seulement disponibles ne contribuent pas. L’acceptation activera et figera le même Projet.</p>
          <label>Plan de production<select value={template} onChange={e=>{setTemplate(e.target.value);setError('');setPreview(null);}}>
            <option value="">Automatique depuis le devis (recommandé)</option>
            {templates.map(t=><option key={t.id} value={t.currentVersion!.id}>Forcer · {t.name}</option>)}
          </select></label>
          <label>Fin prévisionnelle<input type="date" value={date} onChange={e=>{setDate(e.target.value);setPreview(null);}}/></label>
          {quote.status!=='accepted'&&<button className="secondary-button" type="button" disabled={busy} onClick={()=>void inspectPlan()}>Vérifier le plan sans créer de Projet</button>}
          {preview&&<div role="status"><p>{preview.baseCount} occurrence(s) de base · {preview.operations.actions.filter(a=>a.action).length} action(s) · {preview.destinations.filter(t=>t.state==='pending').length} cible(s) à choisir</p>
            {preview.operations.links.map(l=><p key={l.lineOrigin}>{preview.operations.actions.find(a=>a.lineOrigin===l.lineOrigin)?.code} · {l.configuration?.structureClass??'Historique'} · origine {l.lineOrigin}</p>)}
          </div>}
          <button className="primary-button" type="button" disabled={busy||(requirePreviewBeforePrepare&&quote.status!=='accepted'&&!preview)} onClick={()=>void create()}>{busy?'Préparation…':quote.status==='accepted'?'Confirmer et créer le projet':requirePreviewBeforePrepare?'Confirmer et préparer le Projet':'Préparer le Projet'}</button>
          {error&&<p className="form-error quote-project-error" role="alert">{error}</p>}
        </>}
  </section>;
}
export function QuoteConditions({quote,onSave}:{quote:QuoteDetail;onSave:(q:QuoteDetail)=>void}){
  const draft=useDraftSection(quote.id,quote.prerequisitesText??'');
  const prerequisites=draft.value,setPrerequisites=draft.section.set.bind(draft.section);
  const [error,setError]=useState(''),[saving,setSaving]=useState(false);
  const savingRef=useRef(false); // Empêche un second submit avant que React désactive le bouton.
  useUnsavedDraft('Prérequis du devis',prerequisites,{dirty:draft.section.dirty,pending:saving,discard:()=>draft.section.discard()});
  useEffect(()=>draft.section.receive(quote.prerequisitesText??''),[quote.id,quote.prerequisitesText]);

  async function savePrerequisites(): Promise<void> {
    if(savingRef.current)return;
    savingRef.current=true;
    setSaving(true);setError('');
    const submitted=prerequisites;
    try{
      const next=await window.atoumweb.quotes.updateConditions(quote.id,{prerequisitesText:submitted});
      draft.section.receive(next.prerequisitesText??'',{value:submitted});
      onSave(next);changed();
    }catch(caught){
      setError(caught instanceof Error?caught.message:String(caught));
    }finally{
      savingRef.current=false;setSaving(false);
    }
  }
  const editable=quote.status==='draft'&&!quote.finalizedAt;
  return <>
    {editable?<form className="workflow-fields quote-prerequisites-form" onSubmit={event=>{event.preventDefault();void savePrerequisites();}}>
      <label>Prérequis<textarea value={prerequisites} onChange={event=>setPrerequisites(event.target.value)}/></label>
      <button className="secondary-button" disabled={saving}>{saving?'Enregistrement…':'Enregistrer les prérequis'}</button>
      {error&&<p role="alert">{error}</p>}
    </form>:quote.prerequisitesText&&<p>{quote.prerequisitesText}</p>}
    <QuoteContractPreparationPanel quote={quote} onSave={onSave}/>
    <ContractTermsBuilder quote={quote}/>
  </>;
}
