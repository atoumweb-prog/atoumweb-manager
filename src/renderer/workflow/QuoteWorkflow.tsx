import {ProjectCommercialScopePanel} from '../projects/ProjectCommercialScopePanel';
import { QuoteContractPreparationPanel } from '../commercial/QuoteContractPreparationPanel';
import {useEffect,useState} from 'react';
import type {QuoteDetail} from '../../shared/commercial';
import type {ProjectSummary,ProjectTemplateSummary} from '../../shared/projects';
import {ContractTermsBuilder} from '../commercial/ContractTermsBuilder';
import {changed,openEntity} from './DossierPanel';
export function QuoteProjectPanel({quote}:{quote:QuoteDetail}){
  const [templates,setTemplates]=useState<ProjectTemplateSummary[]>([]),[project,setProject]=useState<ProjectSummary|null>(null),[template,setTemplate]=useState(''),[date,setDate]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  useEffect(()=>{setTemplate('');setError('');Promise.all([window.atoumweb.projects.templates.list(),window.atoumweb.projects.projects.list()]).then(([t,p])=>{setTemplates(t.filter(t=>t.currentVersion?.status==='published'));setProject(p.find(p=>p.id===quote.projectId||p.sourceQuoteId===quote.id)??null);}).catch(e=>setError(e instanceof Error?e.message:String(e)));},[quote.id,quote.projectId,quote.status]);
  async function create(){
    setBusy(true);setError('');
    try{
      const action=quote.status==='accepted'?window.atoumweb.projects.projects.transformQuote:window.atoumweb.projects.projects.prepareQuote;
      const p=await action({quoteId:quote.id,templateVersionId:template||null,targetDate:date||null});
      setProject(p);changed();
    }catch(e){
      setError(e instanceof Error?e.message:String(e));
    }finally{setBusy(false);}
  }
  return <section className="workflow-fields quote-project-create">
    <h3>{quote.status==='accepted'?'Projet du devis accepté':'Préparer le Projet'}</h3>
    {project
      ? <><button type="button" className="primary-button" onClick={()=>openEntity({entityType:'project',entityId:project.id,title:project.name})}>Ouvrir {project.name}</button><ProjectCommercialScopePanel key={project.id+project.commercialState+quote.status} projectId={project.id} onChanged={setProject}/></>
      : <>
          <p>Préparer les étapes, Sites, Pages et prérequis depuis les lignes du devis. Les options seulement disponibles ne contribuent pas. L’acceptation activera et figera le même Projet.</p>
          <label>Plan de production<select value={template} onChange={e=>{setTemplate(e.target.value);setError('');}}>
            <option value="">Automatique depuis le devis (recommandé)</option>
            {templates.map(t=><option key={t.id} value={t.currentVersion!.id}>Forcer · {t.name}</option>)}
          </select></label>
          <label>Fin prévisionnelle<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
          <button className="primary-button" type="button" disabled={busy} onClick={()=>void create()}>{busy?'Préparation…':quote.status==='accepted'?'Confirmer et créer le projet':'Préparer le Projet'}</button>
          {error&&<p className="form-error quote-project-error" role="alert">{error}</p>}
        </>}
  </section>;
}
export function QuoteConditions({quote,onSave}:{quote:QuoteDetail;onSave:(q:QuoteDetail)=>void}){
  const [prerequisites,setPrerequisites]=useState(quote.prerequisitesText??''),[error,setError]=useState('');
  useEffect(()=>setPrerequisites(quote.prerequisitesText??''),[quote.id,quote.prerequisitesText]);
  const editable=quote.status==='draft'&&!quote.finalizedAt;
  return <>
    {editable?<form className="workflow-fields" onSubmit={e=>{e.preventDefault();window.atoumweb.quotes.updateConditions(quote.id,{prerequisitesText:prerequisites}).then(q=>{onSave(q);changed();}).catch(e=>setError(String(e)));}}><label>Prérequis<textarea value={prerequisites} onChange={e=>setPrerequisites(e.target.value)}/></label><button className="secondary-button">Enregistrer les prérequis</button>{error&&<p role="alert">{error}</p>}</form>:quote.prerequisitesText&&<p>{quote.prerequisitesText}</p>}
    <QuoteContractPreparationPanel quote={quote} onSave={onSave}/>
    <ContractTermsBuilder quote={quote}/>
  </>;
}