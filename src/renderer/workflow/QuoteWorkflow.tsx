import {useEffect,useState} from 'react';
import type {QuoteDetail} from '../../shared/commercial';
import type {ProjectSummary,ProjectTemplateSummary} from '../../shared/projects';
import {ContractTermsBuilder} from '../commercial/ContractTermsBuilder';
import {changed,openEntity} from './DossierPanel';
export function QuoteProjectPanel({quote}:{quote:QuoteDetail}){
  const [templates,setTemplates]=useState<ProjectTemplateSummary[]>([]),[project,setProject]=useState<ProjectSummary|null>(null),[template,setTemplate]=useState(''),[date,setDate]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  useEffect(()=>{setTemplate('');setError('');Promise.all([window.atoumweb.projects.templates.list(),window.atoumweb.projects.projects.list()]).then(([t,p])=>{setTemplates(t.filter(t=>t.currentVersion?.status==='published'));setProject(p.find(p=>p.sourceQuoteId===quote.id)??null);}).catch(e=>setError(e instanceof Error?e.message:String(e)));},[quote.id]);
  async function create(){
    setBusy(true);setError('');
    try{
      const p=await window.atoumweb.projects.projects.transformQuote({quoteId:quote.id,templateVersionId:template||null,targetDate:date||null});
      setProject(p);changed();
    }catch(e){
      setError(e instanceof Error?e.message:String(e));
    }finally{setBusy(false);}
  }
  return <section className="workflow-fields quote-project-create">
    <h3>Projet du devis accepté</h3>
    {project
      ? <button type="button" className="primary-button" onClick={()=>openEntity({entityType:'project',entityId:project.id,title:project.name})}>Ouvrir {project.name}</button>
      : <>
          <p>Le Manager peut construire automatiquement le plan de production depuis les prestations du devis figé. Un modèle manuel reste disponible uniquement en remplacement.</p>
          <label>Plan de production<select value={template} onChange={e=>{setTemplate(e.target.value);setError('');}}>
            <option value="">Automatique depuis le devis (recommandé)</option>
            {templates.map(t=><option key={t.id} value={t.currentVersion!.id}>Forcer · {t.name}</option>)}
          </select></label>
          <label>Fin prévisionnelle<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
          <button className="primary-button" type="button" disabled={busy} onClick={()=>void create()}>{busy?'Création du projet…':'Confirmer et créer le projet'}</button>
          {error&&<p className="form-error quote-project-error" role="alert">{error}</p>}
        </>}
  </section>;
}
export function QuoteConditions({quote,onSave}:{quote:QuoteDetail;onSave:(q:QuoteDetail)=>void}){
  const [prerequisites,setPrerequisites]=useState(quote.prerequisitesText??''),[deposit,setDeposit]=useState(String(quote.depositPercent??0)),[error,setError]=useState('');
  useEffect(()=>{setPrerequisites(quote.prerequisitesText??'');setDeposit(String(quote.depositPercent??0));},[quote.id,quote.prerequisitesText,quote.depositPercent]);
  const editable=quote.status==='draft'&&!quote.finalizedAt;
  return <>
    {editable
      ? <form className="workflow-fields" onSubmit={e=>{e.preventDefault();window.atoumweb.quotes.updateConditions(quote.id,{prerequisitesText:prerequisites,depositPercent:Number(deposit)}).then(q=>{onSave(q);changed();}).catch(e=>setError(String(e)));}}>
          <h3>Paramètres du devis</h3>
          <label>Prérequis<textarea value={prerequisites} onChange={e=>setPrerequisites(e.target.value)}/></label>
          <label>Acompte (%)<input type="number" min="0" max="100" value={deposit} onChange={e=>setDeposit(e.target.value)}/></label>
          <button className="secondary-button">Enregistrer les paramètres</button>
          {error&&<p role="alert">{error}</p>}
        </form>
      : <section className="workflow-fields">
          <h3>Paramètres du devis</h3>
          <p><strong>Acompte :</strong> {quote.depositPercent??0} %</p>
          {quote.prerequisitesText&&<p style={{whiteSpace:'pre-wrap'}}><strong>Prérequis :</strong> {quote.prerequisitesText}</p>}
        </section>}
    <ContractTermsBuilder quote={quote}/>
  </>;
}
