import {useState} from 'react';
import type {ContributionTargetView,ContributionTargetChoices as Choices,ContributionTargetInput} from '../../shared/contributionTargets';

export function ContributionTargetChoices({target,choices,busy,onAssign}:{target:ContributionTargetView;choices:Choices;busy:boolean;onAssign:(input:ContributionTargetInput)=>Promise<void>}) {
  const [site,setSite]=useState(''),[node,setNode]=useState(''),[author,setAuthor]=useState('');
  const siteChoices=choices.sites.filter(s=>target.requires.every(r=>s.provides.includes(r)));
  const selected=siteChoices.find(s=>JSON.stringify([s.id,s.ownerOrigin,s.ownerSlot])===site);
  const nodes=target.kind==='page'?choices.pages.filter(p=>p.siteId===selected?.id):choices.contexts;
  const currentSite=choices.sites.find(s=>s.id===target.siteId&&s.ownerOrigin===target.siteOwnerOrigin&&s.ownerSlot===target.siteOwnerSlot);
  const currentNode=(target.kind==='page'?choices.pages:choices.contexts).find(n=>n.id===(target.pageNodeId??target.contextNodeId));
  return <fieldset disabled={busy||target.state==='out_of_scope'||target.locked&&target.selectionMode==='explicit'} className="project-target-choice">
    <legend>{target.code} · {target.slot} · unité {target.unitIndex}</legend>
    <p>{target.issue??'Cible conservée'} · {target.selectionMode==='auto_unique'?'Occurrence compatible unique':target.selectionMode==='explicit'?'Choix explicite':'En attente'}</p>
    {target.state==='active'&&<p>Cible enregistrée : {currentSite?.label??target.siteId}{currentSite&&` · ${target.siteId}`}{currentNode&&` / ${currentNode.label} · ${currentNode.id}`}</p>}
    {target.requires.length>0&&<p>Capacités requises : {target.requires.join(', ')}</p>}
    {target.locked&&<p>Cible déjà utilisée : changement par un nouveau parcours explicite.</p>}
    {target.kind!=='context'&&<label>Site cible<select aria-label={'Site cible '+target.slot} value={site} onChange={e=>{setSite(e.target.value);setNode('');}}>
      <option value="">Choisir une occurrence Site</option>
      {siteChoices.map((s,i)=><option key={i} value={JSON.stringify([s.id,s.ownerOrigin,s.ownerSlot])}>{s.label} · {s.ownerOrigin?'Base configurée':'Site manuel / historique'}{s.provides.length?' · '+s.provides.join(', '):''}</option>)}
    </select></label>}
    {target.kind!=='site'&&<label>{target.kind==='page'?'Page parente':'Contexte du Projet'}<select aria-label={target.kind==='page'?'Page parente':'Contexte du Projet'} value={node} onChange={e=>setNode(e.target.value)}>
      <option value="">Choisir explicitement</option>{nodes.map(n=><option key={n.id} value={n.id}>{n.label}</option>)}
    </select></label>}
    <label>Auteur de la décision<input value={author} onChange={e=>setAuthor(e.target.value)} /></label>
    {target.allowsCreateSite&&<button className="secondary-button" disabled={!author.trim()} onClick={()=>void onAssign({lineOrigin:target.lineOrigin,slot:target.slot,unitIndex:target.unitIndex,author:author.trim(),createSite:true})}>Créer le Site de cette occurrence</button>}
    <button className="secondary-button" disabled={!author.trim()||(target.kind!=='context'&&!selected)||(target.kind!=='site'&&!node)} onClick={()=>void onAssign({lineOrigin:target.lineOrigin,slot:target.slot,unitIndex:target.unitIndex,author:author.trim(),siteId:selected?.id??null,siteOwnerOrigin:selected?.ownerOrigin??null,siteOwnerSlot:selected?.ownerSlot??null,pageNodeId:target.kind==='page'?node:null,contextNodeId:target.kind==='context'?node:null})}>Affecter la cible</button>
  </fieldset>;
}
