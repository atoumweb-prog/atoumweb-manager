import {useEffect,useState} from 'react';
import {ResizableSplitView} from './ResizableSplitView';
import {RecordPane} from './RecordPane';
import {AppTextField} from './AppTextField';
import {AppButton} from './AppButton';
import {UnsavedGroup,useUnsavedDraft,requestUnsavedExit,installUnsavedLifecycleBridge} from '../unsaved/unsaved';
const records=[{id:'flowers',name:'TEST — Toutes les Fleurs'},{id:'studio',name:'TEST — Studio Dijon'}];
function WorkshopEditor(){
  const [text,setText]=useState(''),[tab,setTab]=useState('summary'),[pending,setPending]=useState(false);
  const draft=useUnsavedDraft('Note du dossier fictif',text,{pending,discard:setText});
  async function save(){setPending(true);try{await new Promise(r=>setTimeout(r,300));draft.saved();}finally{setPending(false);}}
  return <><nav className="aw-record-tabs" aria-label="Onglets de la fiche"><AppButton aria-pressed={tab==='summary'} onAction={()=>setTab('summary')}>Résumé</AppButton><AppButton aria-pressed={tab==='notes'} onAction={()=>setTab('notes')}>Notes</AppButton></nav>
    <section hidden={tab!=='summary'}><p>Dossier de démonstration uniquement. Aucun enregistrement métier.</p></section>
    <section hidden={tab!=='notes'}><AppTextField id="workshop-note" label="Note de travail fictive" value={text} disabled={pending} onChange={e=>setText(e.target.value)}/><AppButton pending={pending} onAction={save}>Confirmer la note fictive</AppButton>{Array.from({length:24},(_,i)=><p key={i}>Contexte fictif {i+1} — exemple de lecture et de défilement de la fiche.</p>)}</section>
    <p role="status">{pending?'Confirmation fictive en cours':draft.dirty?'Brouillon non enregistré':'Aucune saisie en attente'}</p>
  </>;
}
export function RecordWorkshop(){
  const [selected,setSelected]=useState<string|null>(null),[expanded,setExpanded]=useState(false),[module,setModule]=useState('prospection');
  useEffect(()=>installUnsavedLifecycleBridge(),[]);
  const group='workshop:'+module,record=records.find(r=>r.id===selected);
  const choose=(id:string|null)=>{if(id===selected)return;requestUnsavedExit(()=>{setSelected(id);setExpanded(false);},group);};
  return <><h1>Atelier 01C — fiches et panneaux</h1><p>Environnement fictif isolé — aucune donnée client ni opération réelle.</p>
    <label>Module de démonstration<select value={module} onChange={e=>{const next=e.target.value;requestUnsavedExit(()=>{setModule(next);setSelected(null);setExpanded(false);},group);}}><option value="prospection">Prospection</option><option value="interventions">Interventions</option></select></label>
    <ResizableSplitView module={module} view="records" defaultPercent={module==='prospection'?66:38} store={window.localStorage} selected={!!selected} expanded={expanded} list={<div><h2>Dossiers fictifs</h2>{records.map(r=><p key={r.id}><AppButton aria-pressed={selected===r.id} onAction={()=>choose(r.id)}>{r.name}</AppButton></p>)}</div>}>
      <UnsavedGroup name={group}>{record&&<RecordPane title={record.name} expanded={expanded} onExpand={()=>setExpanded(v=>!v)} onClose={()=>choose(null)}><WorkshopEditor key={record.id}/></RecordPane>}</UnsavedGroup>
    </ResizableSplitView>
    <WorkshopEscape close={()=>choose(null)}/>
  </>;
}
function WorkshopEscape({close}:{close:()=>void}){useEffect(()=>{const key=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();close();}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[close]);return null;}
