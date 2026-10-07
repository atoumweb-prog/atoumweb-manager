import {useEffect,useRef,useState} from 'react';
import type {RecipeChoice,RecipePreview,RecipeReference,RecipeScenario,RecipeState,OperationalRecipeApi} from '../../../shared/operationalRecipe';
import './operational-recipe.css';
const minutes=(n:number)=>`${Math.floor(n/60)} h ${String(n%60).padStart(2,'0')}`;
export function OperationalRecipePage(){
  const api=window.atoumwebOperationalRecipe as OperationalRecipeApi;
  const [state,setState]=useState<RecipeState|null>(null),[references,setReferences]=useState<RecipeReference[]>([]),[scenarios,setScenarios]=useState<RecipeScenario[]>([]);
  const [scenarioId,setScenarioId]=useState('case-1'),[quantities,setQuantities]=useState<Record<string,number>>({}),[selected,setSelected]=useState<boolean|undefined>();
  const [choices,setChoices]=useState<RecipeChoice[]>([]),[preview,setPreview]=useState<RecipePreview|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[closed,setClosed]=useState(false),[theme,setTheme]=useState('atoumweb');
  const [tab,setTab]=useState('structure'),[filter,setFilter]=useState('');const sequence=useRef(0);
  useEffect(()=>{let alive=true;Promise.all([api.state(),api.references(),api.scenarios()]).then(([s,r,c])=>{if(alive){setState(s);setReferences(r);setScenarios(c);}}).catch(e=>{if(alive)setError(String(e));});return()=>{alive=false;sequence.current++;};},[api]);
  useEffect(()=>{document.documentElement.dataset.theme=theme;},[theme]);
  const scenario=scenarios.find(s=>s.id===scenarioId);
  async function compute(id=scenarioId,q=quantities,opt:boolean|undefined|null=selected,c=choices){
    if(!state||closed)return;
    const requestId=++sequence.current;setBusy(true);setError('');
    try{const p=await api.preview({sessionId:state.sessionId,scenarioId:id,requestId,quantities:q,...(opt==null?{}:{optionSelected:opt}),choices:c});
      if(requestId===sequence.current){setPreview(p);setChoices(p.logicalChoices);}
    }catch(e){if(requestId===sequence.current){setPreview(null);setError(String(e));}}
    finally{if(requestId===sequence.current)setBusy(false);}
  }
  useEffect(()=>{if(state)void compute();},[state]); // Initial recipe only; explicit recompute thereafter.
  function chooseScenario(id:string){sequence.current++;setScenarioId(id);setQuantities({});setSelected(undefined);setChoices([]);setPreview(null);void compute(id,{},null,[]);}
  function pickTarget(lineOrigin:string,slot:string,unitIndex:number,value:string){
    const c=choices.filter(c=>!(c.lineOrigin===lineOrigin&&c.slot===slot&&c.unitIndex===unitIndex));
    if(value){const [siteOwnerOrigin,siteOwnerSlot,parentId]=JSON.parse(value) as string[];
      c.push({lineOrigin,slot,unitIndex,siteOwnerOrigin,siteOwnerSlot,...(parentId?{parentPage:{lineOrigin:siteOwnerOrigin,templateNodeId:parentId}}:{})});}
    setChoices(c);void compute(scenarioId,quantities,selected,c);
  }
  const pending=preview?.targets.filter(t=>t.state==='pending').length??0;
  // Presentation labels only: codes, identities and selection values remain unchanged.
  const name=(code:string)=>references.find(r=>r.code===code)?.name??'Prestation';
  const scenarioLabels:Record<string,string>={
    'case-1':'Site vitrine','case-2':'Landing page','case-3':'Boutique WooCommerce',
    'case-4':'Mariage Essentiel','case-5':'Mariage Grand Jour','case-6':'Mariage Histoire — mini-site 4 Pages',
    'case-7':'Site vitrine + 2 pages + Blog','case-8':'Landing page + section',
    'case-9':'WooCommerce + produit simple','case-10':'WooCommerce + produit variable',
    'case-11':'Deux sites vitrine + page supplémentaire','case-12':'Article SEO',
    'case-13':'Développement WordPress — estimation à compléter','case-14':'Site vitrine — option à sélectionner',
    'case-15':'Pack de 4 articles SEO','case-16':'Application sur mesure — estimation à compléter',
    'case-17':'Logo','case-18':'Audit SEO','case-19':'SEO Performance — destination à choisir',
  };
  const targetLabel=(kind:string)=>kind==='site'?'Site':kind==='page'?'Page':'Contexte de travail';
  const technical=(content:React.ReactNode)=><details className="recipe-technical"><summary>Détails techniques</summary>{content}</details>;
  return <div className="recipe-shell content-area">
    <header className="recipe-banner"><strong>RECETTE — simulation uniquement — aucune donnée enregistrée</strong>
      <div className="recipe-toolbar"><span>Configuration non encore activée</span><label>Thème <select aria-label="Thème" value={theme} onChange={e=>setTheme(e.target.value)}>{['atoumweb','noir','blanc'].map(t=><option key={t} value={t}>{t==='atoumweb'?'AtoumWeb':t==='noir'?'Sombre':'Clair'}</option>)}</select></label>
      <button className="secondary-button" disabled={closed||!state} onClick={async()=>{sequence.current++;try{const r=await api.close(state!.sessionId);setClosed(true);setPreview(null);setError(r.sourceUnchanged&&r.copyDeleted?'Session fermée · copie supprimée · SHA source inchangé':'Session fermée — contrôle source à vérifier.');}catch(e){setError(String(e));}}}>Fermer la recette</button></div>
    </header>
    <section className="recipe-source"><h1>Simulation des prestations</h1><p>Explorez les actions, le temps prévu et la structure proposés. Rien n’est activé ni enregistré dans vos devis ou projets.</p>
      {state&&technical(<><p>{state.models} modèles draft · {state.links} associations draft · {state.profiles} profils inactifs · migrations {state.migrations}</p><code>{state.sourceLabel} · empreinte {state.sourceSHA256}</code></>)}
      <p className="recipe-limits"><strong>Limites de cette recette</strong><br/>Landing sur Site existant : non validé par cette recette V1. Les contextes de travail et les Sites historiques restent en attente de choix : leur ciblage réel n’est pas disponible ici.</p>
    </section>
    <div role="status" aria-live="polite" className="recipe-status">{busy?'Calcul de l’aperçu…':closed?(error==='Session fermée · copie supprimée · SHA source inchangé'?'Simulation fermée. La copie de travail a été supprimée et les données sources sont inchangées.':'Simulation fermée — les contrôles de fermeture sont à vérifier.'):error?'Impossible de calculer cette simulation. Vérifiez les quantités et les destinations choisies.':'Simulation uniquement — aucun enregistrement, aucune activation'}</div>
    {error&&technical(<pre>{error}</pre>)}
    <div className="recipe-layout"><aside className="recipe-panel"><h2>Scénarios de simulation</h2><label>Choisir le scénario<select aria-label="Scénario" disabled={closed||!state} value={scenarioId} onChange={e=>chooseScenario(e.target.value)}>{scenarios.map(s=><option key={s.id} value={s.id}>{scenarioLabels[s.id]??'Simulation de prestations'}</option>)}</select></label>
      <h2>Prestations du catalogue</h2><input aria-label="Filtrer les références" placeholder="Rechercher" value={filter} onChange={e=>setFilter(e.target.value)}/>
      <div className="recipe-references">{references.filter(r=>(r.code+' '+r.name).toLowerCase().includes(filter.toLowerCase())).map(r=><details key={r.modelVersionId}><summary>{r.name}</summary><p>Configuration non encore activée</p><p>{r.lot==='8B'?'Fonctionnement opérationnel prévu dans une étape ultérieure.':r.estimateRequired?'Une estimation spécifique sera nécessaire.':'Temps de référence disponible.'}</p>{technical(<><p>{r.code} · classe {r.policy?.structureClass??'—'} · {r.lot} · draft</p><p>Catalogue v{r.catalogVersion??'—'} · modèle v{r.modelVersion}</p><code>{r.catalogVersionId}<br/>{r.modelVersionId}<br/>{r.linkId}</code><p>Source XLSX ligne {r.sourceRow}</p></>)}</details>)}</div>
    </aside><main className="recipe-main">
      <section className="recipe-panel"><h2>{scenarioLabels[scenarioId]??'Chargement'}</h2><p className="recipe-caption">Simulation de la prestation</p>
      {scenario?.lines.filter(l=>!scenario.option||l.key!==scenario.option.lineKey).map((l,index)=><div className="recipe-line" key={l.key}><span><strong>{name(l.code)}</strong><small>Prestation ajoutée pour cette simulation</small></span><label>Quantité <input aria-label={'Quantité '+name(l.code)+' '+(index+1)} type="number" min="1" max="500" disabled={closed} value={quantities[l.key]??l.quantity} onChange={e=>{setQuantities({...quantities,[l.key]:Number(e.target.value)});setPreview(null);setChoices([]);sequence.current++;setBusy(false);}}/></label></div>)}
      {scenario?.option&&<div className="recipe-option"><label><input type="checkbox" aria-label="Acheter l’option de recette" disabled={closed} checked={selected??scenario.option.selected} onChange={e=>{setSelected(e.target.checked);setChoices([]);setPreview(null);sequence.current++;}}/> {name(scenario.option.code)}</label><small>Option ajoutée uniquement pour ce test, non configurée dans l’offre réelle.</small><p>{(selected??scenario.option.selected)?'Option achetée dans cette simulation uniquement':'Option non achetée — aucun effet sur le résultat'}</p><label>Quantité option <input type="number" min="1" max="500" aria-label="Quantité option" value={quantities[scenario.option.lineKey]??scenario.option.quantity} disabled={closed} onChange={e=>{setQuantities({...quantities,[scenario.option!.lineKey]:Number(e.target.value)});setPreview(null);setChoices([]);sequence.current++;setBusy(false);}}/></label></div>}
      <button className="primary-button" disabled={closed||busy||!state} onClick={()=>void compute()}>Recalculer l’aperçu</button></section>
      {preview&&<><section className="recipe-panel" aria-label="Synthèse" data-scenario={preview.scenarioId} data-pending={pending}><h2>Résultat prévu</h2><div className="recipe-metrics">
        {[['Actions prévues',preview.metrics.actions],['Temps prévu',minutes(preview.metrics.referenceMinutes)],['Sites',preview.metrics.sites],['Pages',preview.metrics.pages],['Modules',preview.metrics.modules]].map(([label,value])=><div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
        <p>{preview.metrics.finalEstimate===null?'Estimation finale incomplète — le temps affiché couvre le cadrage uniquement. Une estimation spécifique reste nécessaire.':`Estimation complète : ${minutes(preview.metrics.finalEstimate)}`}</p>
        <p className={pending?'recipe-decision':'recipe-caption'}>{pending?`Destination à choisir — ${pending} choix restant${pending>1?'s':''}. Les actions qui en dépendent attendent ce choix.`:preview.targets.length?'Destinations définies pour cette simulation.':'Aucune destination nécessaire pour cette simulation.'}</p>
        {preview.targets.some(t=>t.state==='pending'&&t.kind==='site')&&!preview.structures.length&&<p>Cette prestation doit être rattachée à un site avant de pouvoir être utilisée. Aucun site n’est sélectionné dans cette simulation.</p>}
        {technical(<><p>{pending} destination(s) pending · runtime normal refuse draft · actions non exécutables</p><pre>{JSON.stringify(preview.lines,null,2)}</pre></>)}
      </section>
        <section className="recipe-panel"><nav aria-label="Vues de l’aperçu" className="recipe-toolbar">{([['structure','Sites, Pages et modules'],['actions','Actions prévues'],['destinations','Destinations'],['provenance','Origine des prestations']] as const).map(([t,label])=><button key={t} data-recipe-tab={t} className={tab===t?'primary-button':'secondary-button'} aria-pressed={tab===t} onClick={()=>setTab(t)}>{label}</button>)}</nav>
        {tab==='structure'&&<div aria-label="Structure projetée">{!preview.structures.length?<p>Aucun Site ni Page à créer pour cette simulation. Seules les actions de la prestation sont prévues.</p>:preview.structures.map(s=><article className="recipe-structure" key={s.origin}><h3>{name(s.code)}</h3><p>{s.role==='base'?'Structure de la prestation':'Ajout à un Site cible'} · quantité {s.units}</p><ul>{Array.from({length:s.units},(_,u)=>s.contract.pages.map(p=><li key={u+p.templateNodeId}>{s.nodes.find(n=>n.id===p.templateNodeId)?.name}{s.units>1?` · exemplaire ${u+1}`:''}<small>{s.nodes.find(n=>n.id===p.templateNodeId)?.desiredPath}</small><small>{s.nodes.find(n=>n.id===p.templateNodeId)?.description}</small></li>))}{s.contract.modules.map(m=><li key={m.templateNodeId}>Module : {s.nodes.find(n=>n.id===m.templateNodeId)?.name} · quantité {s.units}</li>)}</ul>
        {technical(<><p>{s.code} · {s.role} · origine {s.origin} · version {s.versionId}</p><pre>{JSON.stringify(s.contract,null,2)}</pre></>)}</article>)}</div>}
        {tab==='actions'&&<div aria-label="Actions projetées">{[...new Set(preview.actions.map(a=>a.phase))].map(phase=><section key={phase}><h3>{phase}</h3>{preview.actions.filter(a=>a.phase===phase).map(a=><details className="recipe-action" key={a.key}><summary>{a.action!.name} · {a.referenceMinutes===null?"À estimer":minutes(a.referenceMinutes)}{a.quantityMilli>1000?` · exemplaire ${a.unitIndex}`:''}</summary><p>{a.action!.category} · temps de référence</p><pre>{a.action!.checklist}</pre><p>{a.targetRequirement?.target==='none'?'Aucune destination nécessaire pour cette action':preview.targets.some(t=>t.lineOrigin===a.lineOrigin&&t.slot===a.targetRequirement?.slot&&t.unitIndex===a.unitIndex&&t.state==='pending')?'Destination à choisir avant de pouvoir utiliser cette action':'Destination définie pour cette simulation'}</p>{a.optionPurchase&&<p>Option achetée · quantité {a.quantityMilli/1000}</p>}
          {technical(<><p>{a.targetRequirement?.target??'none'} / {a.targetRequirement?.requiredAt??'preparation'} · aucune exécution en recette</p><code>{a.action!.key}<br/>{a.modelVersionId}<br/>{a.catalogVersionId}<br/>{a.lineOrigin}</code></>)}</details>)}</section>)}</div>}
        {tab==='destinations'&&<div aria-label="Destinations projetées">{!preview.targets.length&&<p>Aucune destination requise pour ces actions.</p>}{preview.targets.map(t=>{
          const policy=preview.policies.find(p=>p.origin===t.lineOrigin)?.policy;
          const bases=preview.structures.filter(s=>s.role==='base');
          const options=bases.flatMap((b,bi)=>b.contract.sites.filter(s=>policy?.requires.every(c=>s.provides.includes(c))&&(policy.structureClass!=='A'||b.origin===t.lineOrigin)).flatMap(s=>t.kind==='page'?b.contract.pages.filter(p=>p.siteSlotKey===s.slotKey).map(p=>({value:JSON.stringify([b.origin,s.slotKey,p.templateNodeId]),label:`${name(b.code)}${bases.length>1?` · Site ${bi+1}`:''} → ${b.nodes.find(n=>n.id===p.templateNodeId)?.name}`})):[{value:JSON.stringify([b.origin,s.slotKey]),label:`${name(b.code)}${bases.length>1?` · Site ${bi+1}`:''}`} ]));
          const chosen=choices.find(c=>c.lineOrigin===t.lineOrigin&&c.slot===t.slot&&c.unitIndex===t.unitIndex);
          const code=preview.lines.find(l=>l.origin===t.lineOrigin)?.code;
          return <article key={t.lineOrigin+t.slot+t.unitIndex} className="recipe-structure"><h3>{code?name(code):'Prestation'} · {targetLabel(t.kind)}</h3><h4>{t.state==='pending'?'Destination à choisir':'Destination définie'}</h4>
            {t.state==='pending'&&t.kind==='site'&&options.length===0?<p>Cette prestation doit être rattachée à un site avant de pouvoir être utilisée. Aucun site n’est sélectionné dans cette simulation.</p>:t.state==='pending'?<p>{t.kind==='page'?'Choisissez la Page dans laquelle ajouter ce module.':t.kind==='context'?'Le contexte de travail reste à définir. Aucun choix enregistré.':'Plusieurs Sites sont possibles. Choisissez le Site destiné à cette prestation.'}</p>:<p>{t.selectionMode==='auto_unique'?'Une seule destination compatible : elle est retenue pour cette simulation.':'Votre choix est utilisé pour cette simulation uniquement.'}</p>}
            {t.kind!=='context'&&options.length>0?<label>{targetLabel(t.kind)} de destination<select aria-label={'Cible '+(code?name(code):'Prestation')+' '+targetLabel(t.kind)+' '+t.unitIndex} value={chosen?JSON.stringify([chosen.siteOwnerOrigin,chosen.siteOwnerSlot,...(chosen.parentPage?[chosen.parentPage.templateNodeId]:[])]):''} onChange={e=>pickTarget(t.lineOrigin,t.slot,t.unitIndex,e.target.value)}><option value="">{t.state==='active'&&t.selectionMode==='auto_unique'?'Destination choisie automatiquement':'Aucun choix enregistré'}</option>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label>:<p>La sélection de Sites historiques ou de contextes de travail n’est pas disponible dans cette recette.</p>}
            <small>{chosen?.parentPage?'Page sélectionnée pour cette simulation uniquement':'Aucun choix enregistré dans le Projet'}</small>
            {technical(<><p>{code} · {t.kind} · unité {t.unitIndex} · {t.state} · {t.selectionMode} · requires {policy?.requires.join(', ')||'aucune capacité spéciale'}</p><pre>{JSON.stringify(t,null,2)}</pre></>)}</article>;})}</div>}
        {tab==='provenance'&&<div aria-label="Provenance"><h3>Prestations utilisées dans cette simulation</h3>{preview.lines.map(l=><article className="recipe-structure" key={l.origin}><h4>{name(l.code)} · quantité {l.quantity}</h4><p>{l.purchasedOption?'Option achetée uniquement pour ce test':'Prestation ajoutée pour cette simulation'}</p><p>Prix catalogue {l.priceCents===null?'non renseigné':`${l.priceCents/100} €`} · aucune facturation</p>
          {technical(<><p>{l.code} · origine {l.origin}</p><code>Catalogue {l.catalogVersionId}<br/>Modèle {l.modelVersionId}</code></>)}</article>)}<h3>Prérequis</h3><ul>{preview.prerequisites.map((p,i)=><li key={i}>{p.label}</li>)}</ul>{technical(<pre>{JSON.stringify(preview.policies,null,2)}</pre>)}</div>}
        </section></>}
    </main></div>
  </div>;
}
