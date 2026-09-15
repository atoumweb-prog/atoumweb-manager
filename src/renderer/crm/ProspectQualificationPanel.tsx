import {useMemo,useState} from 'react';
import type {ProspectInput,ProspectSummary} from '../../shared/crm';

export function FieldHelp({text}:{text:string}){return <span className="field-help" tabIndex={0} role="note" aria-label={text} title={text}>?</span>}
export function ProspectQualificationPanel({prospect,onSaved}:{prospect:ProspectSummary;onSaved:()=>void}){
  const [draft,setDraft]=useState<Partial<ProspectInput>>({...prospect}),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const readiness=useMemo(()=>[
    {label:'Résumé du projet',ok:Boolean(draft.projectSummary?.trim())},{label:'Décisionnaire',ok:Boolean(draft.decisionStatus)},
    {label:'Budget',ok:Boolean(draft.budgetStatus)},{label:'Calendrier',ok:Boolean(draft.timelineStatus)},
    {label:'Existant',ok:Boolean(draft.existingStatus)},
  ],[draft]);
  async function save(){setBusy(true);setError('');try{await window.atoumweb.crm.prospects.updateQualification(prospect.id,draft);onSaved();}catch(e){setError(e instanceof Error?e.message:String(e));}finally{setBusy(false);}}
  return <section className="prospect-work-section"><div className="work-section-heading"><div><span className="eyebrow">Qualification</span><strong>{readiness.filter(x=>x.ok).length}/{readiness.length} informations clés</strong></div></div>
    <div className="qualification-readiness" aria-label="État de préparation">{readiness.map(x=><span key={x.label} className={x.ok?'ready':'missing'}>{x.ok?'✓':'○'} {x.label}</span>)}</div>
    <div className="workflow-fields">
      <label>Résumé du projet <FieldHelp text="Décris le résultat attendu en quelques phrases."/><textarea value={draft.projectSummary??''} onChange={e=>setDraft({...draft,projectSummary:e.target.value})}/></label>
      <label>Contexte <FieldHelp text="Contexte métier, problème actuel et contraintes connues."/><textarea value={draft.projectContext??''} onChange={e=>setDraft({...draft,projectContext:e.target.value})}/></label>
      <label>Décisionnaire<select value={draft.decisionStatus??''} onChange={e=>setDraft({...draft,decisionStatus:(e.target.value||null) as ProspectInput['decisionStatus']})}><option value="">À préciser</option><option value="yes">Oui</option><option value="no">Non</option><option value="unknown">Inconnu</option></select></label>
      <label>Précisions décision<input value={draft.decisionMakerDetails??''} onChange={e=>setDraft({...draft,decisionMakerDetails:e.target.value})}/></label>
      <label>Budget<select value={draft.budgetStatus??''} onChange={e=>setDraft({...draft,budgetStatus:(e.target.value||null) as ProspectInput['budgetStatus']})}><option value="">À préciser</option><option value="known">Connu</option><option value="range">Fourchette</option><option value="not_disclosed">Non communiqué</option></select></label>
      <label>Calendrier<select value={draft.timelineStatus??''} onChange={e=>setDraft({...draft,timelineStatus:(e.target.value||null) as ProspectInput['timelineStatus']})}><option value="">À préciser</option><option value="date">Date</option><option value="note">Indication libre</option><option value="not_disclosed">Non communiqué</option></select></label>
      <label>Précision calendrier<input value={draft.timelineNote??''} onChange={e=>setDraft({...draft,timelineNote:e.target.value})}/></label>
      <label>Existant<select value={draft.existingStatus??''} onChange={e=>setDraft({...draft,existingStatus:(e.target.value||null) as ProspectInput['existingStatus']})}><option value="">À préciser</option><option value="yes">Oui</option><option value="no">Non</option><option value="unknown">Inconnu</option></select></label>
      <label>URL existante<input type="url" value={draft.existingUrl??''} onChange={e=>setDraft({...draft,existingUrl:e.target.value})}/></label>
      <label>Informations manquantes<textarea value={draft.missingInformation??''} onChange={e=>setDraft({...draft,missingInformation:e.target.value})}/></label>
      {error&&<p className="form-error" role="alert">{error}</p>}<button type="button" className="primary-button" disabled={busy} onClick={()=>void save()}>{busy?'Enregistrement…':'Enregistrer la qualification'}</button>
    </div>
  </section>;
}
