import {ContractSectionReviewPanel} from './ContractSectionReviewPanel';
import { ContractReadPanel } from './ContractReadPanel';
import type { ContractPresentation } from '../../shared/contractPresentation';
import { useEffect, useId, useState } from 'react';
import { requestUnsavedExit, useUnsavedDraft } from '../unsaved/unsaved';
import { filterContractClauses, matchingContractClauses, newModuleDraftChanged, typeDraftChanged } from './contractLibraryDrafts';
import type { ContractType, ContractTypeVersionInput } from '../../shared/contractTypes';
import type { ContractClauseTemplate, ContractClauseScope, ContractClauseAudience, WordDraftPreview } from '../../shared/contractTerms';
import type { CatalogItemSummary } from '../../shared/commercial';
import './contract-library.css';
import { ConvergenceReviewPanel } from './ConvergenceReviewPanel';

const empty:ContractTypeVersionInput={name:'',description:'',moduleIds:[]};
const statusLabel=(status:string)=>({draft:'Brouillon',published:'Publiée',retired:'Retirée',active:'Actif',inactive:'Inactif',archived:'Archivé'}[status]??status);
const label=(t:ContractType)=>(t.currentVersion??t.versions[0])?.name??t.code;

export function ContractLibraryPage({onClose,initialTypeId,onMessage}:{onClose:()=>void;initialTypeId?:string|null;onMessage:(s:string)=>void}) {
  const [types,setTypes]=useState<ContractType[]>([]),[clauses,setClauses]=useState<ContractClauseTemplate[]>([]),[catalog,setCatalog]=useState<CatalogItemSummary[]>([]);
  const [query,setQuery]=useState(''),[clauseQuery,setClauseQuery]=useState(''),[clauseScope,setClauseScope]=useState<'all'|'base'|'catalog'>('all'),[clauseAudience,setClauseAudience]=useState<'all'|'professional'|'consumer'>('all'),[includeArchivedClauses,setIncludeArchivedClauses]=useState(false),[archived,setArchived]=useState(false),[id,setId]=useState(initialTypeId??''),[versionId,setVersionId]=useState('');
  const [input,setInput]=useState<ContractTypeVersionInput>(empty),[creating,setCreating]=useState(false),[code,setCode]=useState('');
  const [moduleId,setModuleId]=useState(''),[moduleVersionId,setModuleVersionId]=useState(''),[moduleTitle,setModuleTitle]=useState(''),[body,setBody]=useState('');
  const [wordPreview,setWordPreview]=useState<WordDraftPreview|null>(null);
  const [wordLimitsAccepted,setWordLimitsAccepted]=useState(false);
  const [showNewModule,setShowNewModule]=useState(false),[newCode,setNewCode]=useState(''),[newTitle,setNewTitle]=useState(''),[newBody,setNewBody]=useState('');
  const [newScope,setNewScope]=useState<ContractClauseScope>('catalog'),[newAudience,setNewAudience]=useState<ContractClauseAudience>('all');
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const [previewOpen,setPreviewOpen]=useState(false),[referenceId,setReferenceId]=useState(''),[previewAudience,setPreviewAudience]=useState<'professional'|'consumer'>('professional'),[preview,setPreview]=useState<ContractPresentation|null>(null);
  const [editServices,setEditServices]=useState(false),[serviceQuery,setServiceQuery]=useState('');
  const type=types.find(t=>t.id===id),version=type?.versions.find(v=>v.id===versionId)??type?.currentVersion??type?.versions[0];
  const editable=creating||!!(version?.status==='draft'&&type?.status!=='archived');
  const module=clauses.find(c=>c.id===moduleId),moduleVersion=module?.versions.find(v=>v.id===moduleVersionId)??module?.currentVersion??module?.versions[0];
  const shownClauses=filterContractClauses(matchingContractClauses(clauses,clauseQuery),{scope:clauseScope,audience:clauseAudience,includeArchived:includeArchivedClauses});
  // Le périmètre est propre à cette instance : aucun abandon d'un brouillon d'un autre écran.
  const unsavedScope='contract-library/'+useId();
  const typeGuard=useUnsavedDraft('Type de contrat',{code,input},{
    group:unsavedScope,ready:creating||!!version,resetKey:creating?'new-type':version?.id,pending:busy,
    dirty:creating?!!(code||input.name||input.description||input.moduleIds.length):!!(editable&&version&&typeDraftChanged(input,version)),
    discard:()=>{setCode('');setInput(creating?empty:version?{name:version.name,description:version.description,moduleIds:[...version.moduleIds]}:empty);}
  });
  const moduleGuard=useUnsavedDraft('Texte de clause',{moduleTitle,body},{
    group:unsavedScope,ready:!!moduleVersion,resetKey:moduleVersion?.id,pending:busy,
    dirty:!!moduleVersion&&(body!==moduleVersion.body||moduleTitle!==(moduleVersion.title??module?.title??'')),discard:()=>{setModuleTitle(moduleVersion?.title??module?.title??'');setBody(moduleVersion?.body??'');}
  });
  const newModuleGuard=useUnsavedDraft('Nouveau module de clause',{newCode,newTitle,newBody,newScope,newAudience},{
    group:unsavedScope,ready:showNewModule,pending:busy,
    dirty:showNewModule&&newModuleDraftChanged({newCode,newTitle,newBody,newScope,newAudience}),
    discard:()=>{setNewCode('');setNewTitle('');setNewBody('');setNewScope('catalog');setNewAudience('all');setShowNewModule(false);}
  });
  const wordGuard=useUnsavedDraft('Comparaison Word non approuvée',{sessionId:wordPreview?.sessionId??''},{
    group:unsavedScope,ready:!!wordPreview,pending:busy,dirty:!!wordPreview?.changed,
    discard:discardWordPreview
  });
  const guardedNavigation=(run:()=>void)=>requestUnsavedExit(run,unsavedScope);
  async function refresh(select?:ContractType) {
    const [typesResult,clausesResult,catalogResult]=await Promise.allSettled([
      window.atoumweb.contractTypes.list(true),
      window.atoumweb.contractTerms.library.list(true),
      window.atoumweb.catalog.list(),
    ]);
    if(typesResult.status==='fulfilled') {
      setTypes(typesResult.value);
      if(select){setId(select.id);setVersionId(select.versions[0]?.id??'');setCreating(false);}
    }
    if(clausesResult.status==='fulfilled')setClauses([...clausesResult.value].sort((a,b)=>a.title.localeCompare(b.title,'fr')));
    if(catalogResult.status==='fulfilled')setCatalog([...catalogResult.value].sort((a,b)=>a.name.localeCompare(b.name,'fr')));
    const failures=[
      typesResult.status==='rejected'?'types de contrats':null,
      clausesResult.status==='rejected'?'clauses':null,
      catalogResult.status==='rejected'?'prestations Catalogue':null,
    ].filter(Boolean);
    if(failures.length)throw new Error(`Chargement incomplet : ${failures.join(', ')}. Les autres rubriques restent disponibles.`);
  }
  useEffect(()=>{void refresh().catch(e=>setError(String(e)));},[]);
  useEffect(()=>{if(initialTypeId){setId(initialTypeId);setCreating(false);}},[initialTypeId]);
  useEffect(()=>{if(version&&!creating)setInput({name:version.name,description:version.description,moduleIds:[...version.moduleIds]});},[version?.id,creating]);
  useEffect(()=>{if(moduleVersion){setModuleTitle(moduleVersion.title??module?.title??'');setBody(moduleVersion.body);}},[moduleVersion?.id,module?.title]);
  useEffect(()=>{
    setPreviewOpen(false);setPreview(null);
    const links=type?.catalogLinks??[];
    const principal=links.find(l=>catalog.find(c=>c.id===l.itemId)?.type==='offer')??links.find(l=>catalog.find(c=>c.id===l.itemId)?.currentVersion?.commercialKind!=='option')??links[0];
    setReferenceId(principal?.catalogVersionId??'');
  },[type?.id]);
  useEffect(()=>{let active=true;setPreview(null);if(previewOpen&&type&&version&&type.catalogLinks.some(l=>l.catalogVersionId===referenceId))void window.atoumweb.contractTerms.previewReference(type.id,version.id,referenceId,previewAudience).then(p=>{if(active)setPreview(p);}).catch(e=>{if(active)setError(String(e));});return()=>{active=false;};},[previewOpen,type?.id,version?.id,referenceId,previewAudience]);
  async function run(action:()=>Promise<unknown>) {
    setBusy(true);setError('');try {const result=await action();await refresh(result&&typeof result==='object'&&'catalogLinks' in result?result as ContractType:undefined);}
    catch(e){setError(e instanceof Error?e.message:String(e));}finally{setBusy(false);}
  }
  function move(index:number,delta:number){const ids=[...input.moduleIds];[ids[index],ids[index+delta]]=[ids[index+delta],ids[index]];setInput({...input,moduleIds:ids});}
  function discardWordPreview(){
    if(wordPreview)void window.atoumweb.contractTerms.library.cancelWordDraft(wordPreview.sessionId);
    setWordPreview(null);setWordLimitsAccepted(false);
  }
  function openModule(id:string){
    discardWordPreview();setModuleId(id);setModuleVersionId('');
    setEditServices(false);setServiceQuery('');
  }
  function openCatalogItem(itemId:string){
    guardedNavigation(()=>window.dispatchEvent(new CustomEvent('atoumweb:open-catalog-item',{detail:itemId})));
  }
  return <section className="contract-library">
    <div className="contract-toolbar"><button type="button" className="secondary-button" disabled={busy} onClick={()=>guardedNavigation(onClose)}>Retour aux documents</button><h2>Bibliothèque contractuelle</h2>
      <button type="button" className="primary-button" disabled={busy} onClick={()=>guardedNavigation(()=>{setCreating(true);setId('');setVersionId('');setInput(empty);setCode('');})}>Nouveau type de contrat</button>
      <button type="button" className="secondary-button" disabled={busy} onClick={()=>showNewModule?newModuleGuard.request(()=>setShowNewModule(false)):setShowNewModule(true)}>Nouveau module</button>
      <button type="button" className="secondary-button" disabled={busy} onClick={()=>void run(async()=>{const r=await window.atoumweb.contractTypes.initialize();onMessage(`${r.created} type(s) créés en brouillon, ${r.linked} rattachement(s), ${r.unchanged} inchangé(s).`);})}>Initialiser depuis le Catalogue</button>
    </div>
    <p>Les textes restent dans la bibliothèque de clauses existante. Le type organise les modules ; seules les prestations vendues déclenchent leurs clauses. Aucune validation juridique globale.</p>
    <ConvergenceReviewPanel onPrepared={()=>refresh()}/>
    {error&&<p role="alert" className="form-error">{error}</p>}
    {(typeGuard.dirty||moduleGuard.dirty||newModuleGuard.dirty||wordGuard.dirty)&&<p role="status" className="contract-library-unsaved">Brouillon non enregistré — confirme l'abandon avant de quitter ou de changer de fiche.</p>}
    {showNewModule&&<fieldset disabled={busy} className="contract-type-detail"><legend>Nouveau module — brouillon uniquement</legend>
      <label>Code du module<input aria-label="Code du module" value={newCode} onChange={e=>setNewCode(e.target.value)}/></label>
      <label>Titre du module<input aria-label="Titre du module" value={newTitle} onChange={e=>setNewTitle(e.target.value)}/></label>
      <label>Scope<select aria-label="Scope du module" value={newScope} onChange={e=>setNewScope(e.target.value as ContractClauseScope)}><option value="catalog">Prestation</option><option value="base">CGV communes</option></select></label>
      <label>Audience<select value={newAudience} onChange={e=>setNewAudience(e.target.value as ContractClauseAudience)}><option value="all">Tous</option><option value="professional">Professionnels</option><option value="consumer">Consommateurs</option></select></label>
      <label>Texte du nouveau module<textarea aria-label="Texte du nouveau module" value={newBody} onChange={e=>setNewBody(e.target.value)}/></label>
      <button type="button" onClick={()=>void run(async()=>{const c=await window.atoumweb.contractTerms.library.create({code:newCode,title:newTitle,scope:newScope,audience:newAudience},{body:newBody});openModule(c.id);setNewCode('');setNewTitle('');setNewBody('');setNewScope('catalog');setNewAudience('all');setShowNewModule(false);})}>Enregistrer le module en brouillon</button>
    </fieldset>}
    <div className="contract-toolbar"><input aria-label="Rechercher un type de contrat" placeholder="Rechercher un type de contrat…" value={query} onChange={e=>setQuery(e.target.value)}/><label><input type="checkbox" checked={archived} onChange={e=>setArchived(e.target.checked)}/> Inclure les types archivés</label></div>
    <div className="contract-library-grid">
      <div className="contract-library-navigation">
      <aside className="contract-type-list" aria-label="Types de contrats par ordre alphabétique">
        {types.filter(t=>(archived||t.status!=='archived')&&[t.code,label(t)].join(' ').toLocaleLowerCase('fr').includes(query.toLocaleLowerCase('fr'))).map(t=><button type="button" key={t.id} className={id===t.id?'active':''} disabled={busy} onClick={()=>guardedNavigation(()=>{setId(t.id);setVersionId(t.currentVersionId??t.versions[0]?.id??'');setCreating(false);setModuleId('');})}><strong>{label(t)}</strong><span>{t.code} · {statusLabel(t.status)} · v{(t.currentVersion??t.versions[0])?.versionNumber} · {statusLabel((t.currentVersion??t.versions[0])?.status??'draft')}</span></button>)}
        {!types.length&&<p>Aucun type structuré. L’initialisation proposée utilise les familles du Catalogue, jamais le libellé legacy.</p>}
      </aside>
      <section className="contract-clause-navigation" aria-label="Accès direct aux clauses contractuelles">
        <h3>Clauses de la bibliothèque</h3>
        <label>Rechercher une clause<input aria-label="Rechercher une clause" value={clauseQuery} onChange={e=>setClauseQuery(e.target.value)} placeholder="Titre, code ou public…" /></label>
        <div className="contract-toolbar"><label>Famille de clauses<select aria-label="Filtrer famille de clauses" value={clauseScope} onChange={e=>setClauseScope(e.target.value as typeof clauseScope)}><option value="all">Toutes</option><option value="base">CGV communes</option><option value="catalog">Clauses spécifiques</option></select></label><label>Public applicable<select aria-label="Filtrer public de clauses" value={clauseAudience} onChange={e=>setClauseAudience(e.target.value as typeof clauseAudience)}><option value="all">Tous les publics</option><option value="professional">Professionnels</option><option value="consumer">Consommateurs</option></select></label><label><input type="checkbox" checked={includeArchivedClauses} onChange={e=>setIncludeArchivedClauses(e.target.checked)}/> Inclure les clauses archivées</label></div>
        {([
          {scope:'base',title:'CGV communes'},
          {scope:'catalog',title:'Clauses spécifiques aux prestations'}
        ] as const).map(group=><div className="contract-clause-navigation-group" key={group.scope}>
          <h4>{group.title} <span>({shownClauses.filter(c=>c.scope===group.scope).length})</span></h4>
          {shownClauses.filter(c=>c.scope===group.scope).map(c=><button type="button" key={c.id} className="contract-clause-navigation-entry" data-contract-clause-id={c.id} aria-current={moduleId===c.id?'true':undefined} disabled={busy}
            onClick={()=>guardedNavigation(()=>openModule(c.id))}>
            <strong>{c.title}</strong><span>{c.code} · {statusLabel(c.status)} · {c.audience==='all'?'Tous publics':c.audience==='consumer'?'Consommateurs':'Professionnels'}</span>
          </button>)}
          {!shownClauses.some(c=>c.scope===group.scope)&&<p>Aucune clause correspondante.</p>}
        </div>)}
      </section>
      </div>
      <div className="contract-type-detail">
        {(type||creating)&&<>
          <h3>{creating?'Nouveau type de contrat':label(type!)}</h3>
          {creating?<label>Code du type<input aria-label="Code du type" value={code} onChange={e=>setCode(e.target.value)}/></label>:<>
            <p>{type!.code} · {statusLabel(type!.status)}</p>
            <label>Version du type<select aria-label="Version du type" value={version?.id??''} onChange={e=>{const next=e.target.value;guardedNavigation(()=>setVersionId(next));}}>{type!.versions.map(v=><option key={v.id} value={v.id}>v{v.versionNumber} — {v.name} — {statusLabel(v.status)}</option>)}</select></label>
            <div className="contract-toolbar"><button type="button" disabled={busy||type!.status==='archived'} onClick={()=>void run(()=>window.atoumweb.contractTypes.createVersion(type!.id,input))}>Nouvelle version du type</button>
              <button type="button" disabled={busy} onClick={()=>void run(()=>window.atoumweb.contractTypes.setStatus(type!.id,type!.status==='archived'?'active':'archived'))}>{type!.status==='archived'?'Réactiver le type':'Archiver le type'}</button></div>
          </>}
          {type&&<section className="contract-type-preview">
            <button type="button" className="primary-button" onClick={()=>setPreviewOpen(v=>!v)}>{previewOpen?'Fermer l’aperçu du contrat type':'Voir le contrat type assemblé'}</button>
            {previewOpen&&<><p>Choisis la prestation de base à consulter. Les options disponibles ne sont pas ajoutées automatiquement. Les données propres au client seront complétées dans son devis.</p>
              <label>Prestation de référence<select aria-label="Prestation du contrat type" value={referenceId} onChange={e=>setReferenceId(e.target.value)}>{type.catalogLinks.map(l=><option key={l.catalogVersionId} value={l.catalogVersionId}>{l.name} · {l.canonicalCode} · v{l.versionNumber}</option>)}</select></label>
              <label>Client contractuel<select aria-label="Client du contrat type" value={previewAudience} onChange={e=>setPreviewAudience(e.target.value as typeof previewAudience)}><option value="professional">Professionnel</option><option value="consumer">Particulier / consommateur</option></select></label>
              {preview?<ContractReadPanel presentation={preview} copy={false}/>:<p>{referenceId?'Chargement du contrat type…':'Associe une prestation Catalogue pour consulter ses clauses applicables.'}</p>}
            </>}
          </section>}
          <fieldset disabled={busy}><legend>Identité et composition</legend>
            <label>Nom du type<input aria-label="Nom du type" disabled={!editable} value={input.name} onChange={e=>setInput({...input,name:e.target.value})}/></label>
            <label>Description du type<textarea aria-label="Description du type" disabled={!editable} value={input.description} onChange={e=>setInput({...input,description:e.target.value})}/></label>
            <h4>Modules ordonnés — applicables selon les prestations vendues</h4>
            {input.moduleIds.map((mid,index)=>{const c=clauses.find(x=>x.id===mid);return <div className="contract-module-row" key={mid}><button type="button" onClick={()=>guardedNavigation(()=>openModule(mid))} disabled={busy}>{index+1}. {c?.title??mid}</button><div><button type="button" aria-label={`Monter ${c?.code}`} disabled={!editable||index===0} onClick={()=>move(index,-1)}>↑</button><button type="button" aria-label={`Descendre ${c?.code}`} disabled={!editable||index===input.moduleIds.length-1} onClick={()=>move(index,1)}>↓</button><button type="button" disabled={!editable} onClick={()=>setInput({...input,moduleIds:input.moduleIds.filter(x=>x!==mid)})}>Retirer de la composition</button></div></div>;})}
            <label>Rattacher un module existant<select aria-label="Rattacher un module existant" disabled={!editable} value="" onChange={e=>{if(e.target.value)setInput({...input,moduleIds:[...input.moduleIds,e.target.value]});}}><option value="">Choisir un module…</option>{clauses.filter(c=>c.scope==='catalog'&&c.status!=='archived'&&!input.moduleIds.includes(c.id)).map(c=><option key={c.id} value={c.id}>{c.title} · {c.code}</option>)}</select></label>
            <p>Ajouter ici ne modifie pas les liens de prestations déclenchantes. Retirer ne supprime jamais la clause globale.</p>
          </fieldset>
          {editable&&<button type="button" className="primary-button" disabled={busy} onClick={()=>void run(()=>creating?window.atoumweb.contractTypes.create(code,input):window.atoumweb.contractTypes.updateDraft(version!.id,input))}>Enregistrer le type en brouillon</button>}
          {version?.status==='draft'&&type&&<button type="button" disabled={busy||JSON.stringify(input)!==JSON.stringify({name:version.name,description:version.description,moduleIds:version.moduleIds})} onClick={()=>void run(()=>window.atoumweb.contractTypes.publish(version.id))}>Publier la version du type</button>}
          <details open><summary>CGV communes — socle automatique selon le client</summary>{clauses.filter(c=>c.scope==='base'&&c.status!=='archived').map(c=><button className="secondary-button" type="button" key={c.id} onClick={()=>guardedNavigation(()=>openModule(c.id))}>{c.title} · {c.audience==='all'?'Tous clients':c.audience==='consumer'?'Particuliers':'Professionnels'}</button>)}</details>
          {type&&<section className="contract-associated-services"><h4>Prestations concernées — versions Catalogue</h4>{type.catalogLinks.map(l=><button key={l.catalogVersionId} type="button" className="secondary-button" onClick={()=>openCatalogItem(l.itemId)}>{l.name} · {l.canonicalCode} · v{l.versionNumber} · {statusLabel(l.status)}</button>)}</section>}
        </>}
        <details open={!type&&!creating}><summary>Tous les modules de la bibliothèque</summary><select aria-label="Consulter un module" value={moduleId} onChange={e=>{const next=e.target.value;guardedNavigation(()=>openModule(next));}}><option value="">Choisir un paragraphe…</option>{clauses.map(c=><option key={c.id} value={c.id}>{c.title} · {c.code} · {statusLabel(c.status)}</option>)}</select></details>
        {module&&<section className="contract-type-detail contract-module-editor">
          <h3>{module.title}</h3><p>{module.code} · {module.scope==='base'?'CGV communes':'Clause de prestation'} · {statusLabel(module.status)}</p>
          <label>Version du module<select aria-label="Version du module" value={moduleVersion?.id??''} onChange={e=>{const next=e.target.value;guardedNavigation(()=>{discardWordPreview();setModuleVersionId(next);});}}>{module.versions.map(v=><option key={v.id} value={v.id}>v{v.versionNumber} — {v.title??module.title} — {statusLabel(v.status)}</option>)}</select></label>
          <div className="contract-module-text contract-paragraph">{moduleVersion?.body}</div>
          {moduleVersion&&<ContractSectionReviewPanel key={moduleVersion.id} versionId={moduleVersion.id} group={unsavedScope}/>}
          <section className="aw-word-draft-panel">
            <h4>Aller-retour Word — brouillon de clause</h4>
            <p>Exporte une version brouillon éditable, modifie-la dans Word puis réimporte-la pour comparer. La validation crée <strong>une nouvelle version brouillon</strong> ; elle ne publie rien.</p>
            {moduleVersion?.status!=='draft'||module.status==='archived'
              ? <p className="muted">Version publiée, retirée ou archivée : aucune modification Word directe. Crée d'abord un brouillon distinct.</p>
              : <>
              {body!==moduleVersion.body&&<p className="form-error">Enregistre d'abord les changements du champ texte local dans un nouveau brouillon avant d'utiliser Word.</p>}
              <div className="contract-toolbar">
                <button type="button" disabled={busy||body!==moduleVersion.body||module.versions[0]?.id!==moduleVersion.id} onClick={()=>void run(async()=>{
                  const out=await window.atoumweb.contractTerms.library.exportWordDraft(module.id,moduleVersion.id);
                  if(!out.cancelled)onMessage('Brouillon Word exporté : '+out.fileName);
                })}>Exporter ce brouillon en Word (.docx)</button>
                <button type="button" disabled={busy||body!==moduleVersion.body||module.versions[0]?.id!==moduleVersion.id} onClick={()=>void run(async()=>{
                  const out=await window.atoumweb.contractTerms.library.exportWorkingPdf(module.id,moduleVersion.id);
                  if(!out.cancelled)onMessage('PDF de travail non officiel exporté : '+out.fileName);
                })}>PDF de travail (non signé)</button>
                <button type="button" disabled={busy||body!==moduleVersion.body||module.versions[0]?.id!==moduleVersion.id} onClick={()=>void run(async()=>{
                  discardWordPreview();
                  const preview=await window.atoumweb.contractTerms.library.importWordDraft(module.id,moduleVersion.id);
                  if(preview){setWordPreview(preview);setWordLimitsAccepted(false);}
                })}>Réimporter un Word et comparer</button>
              </div>
              {wordPreview&&wordPreview.clauseId===module.id&&wordPreview.sourceVersionId===moduleVersion.id&&
                <div className="aw-word-review">
                  <h4>Comparaison : {wordPreview.importedFileName}</h4>
                  <p>{wordPreview.changed?'Modifications textuelles proposées — aucune écriture effectuée.':'Aucune modification textuelle détectée : il n’y a rien à enregistrer.'}</p>
                  <div className="aw-word-diff" aria-label="Différences Word avant validation">
                    {wordPreview.paragraphs.map((p,i)=><div key={i} className={'aw-word-diff-'+p.kind}>
                      <strong>{p.kind==='added'?'+ Ajout':p.kind==='removed'?'− Suppression':'= Inchangé'} :</strong> {p.text||'(paragraphe vide)'}
                    </div>)}
                  </div>
                  <p className="muted">Limites de restitution :</p>
                  <ul>{wordPreview.warnings.map((warning,i)=><li key={i}>{warning}</li>)}</ul>
                  <label><input type="checkbox" checked={wordLimitsAccepted} onChange={e=>setWordLimitsAccepted(e.target.checked)}/> J'ai examiné toutes les différences et accepte les limites de mise en forme.</label>
                  <div className="contract-toolbar">
                    <button type="button" disabled={busy||!wordPreview.changed||!wordLimitsAccepted} onClick={()=>void run(async()=>{
                      const result=await window.atoumweb.contractTerms.library.approveWordDraft(wordPreview.sessionId);
                      setModuleVersionId(result.id);
                      setWordPreview(null);setWordLimitsAccepted(false);
                      onMessage('Révision Word approuvée : une nouvelle version brouillon a été créée, sans publication.');
                    })}>Valider et créer une nouvelle version brouillon</button>
                    <button type="button" disabled={busy} onClick={()=>discardWordPreview()}>Annuler sans enregistrer</button>
                  </div>
                </div>}
              </>}
          </section>
          {moduleVersion?.review&&<details><summary>Revue documentaire et réserves — {moduleVersion.review.level}</summary><p>Aucune validation juridique globale. Publication et revue documentaire sont distinctes.</p><dl><dt>Sources conservées</dt><dd className="contract-paragraph">{moduleVersion.review.sources??'Non renseignées'}</dd><dt>Dernière vérification documentée</dt><dd>{moduleVersion.review.verifiedAt??'À vérifier pour cette rédaction'}</dd><dt>Réserves</dt><dd>{moduleVersion.review.reserve??'Non renseignées'}</dd><dt>Provenance</dt><dd className="contract-paragraph">{moduleVersion.review.provenance.reference} · {moduleVersion.review.provenance.sha256}</dd></dl></details>}
          <label>Titre à préparer dans la nouvelle version<input aria-label="Titre du module à versionner" value={moduleTitle} onChange={e=>setModuleTitle(e.target.value)}/></label>
          <label>Texte à préparer dans une nouvelle version<textarea aria-label="Texte du module à versionner" value={body} onChange={e=>setBody(e.target.value)}/></label>
          <button type="button" disabled={busy||module.status==='archived'} onClick={()=>void run(async()=>{const previousReview=moduleVersion?.review;
            const review=previousReview&&body!==moduleVersion?.body?{...previousReview,level:'Incertitude résiduelle' as const,verifiedAt:null,reserve:[previousReview.reserve,'Texte modifié manuellement : la revue documentaire antérieure ne valide pas cette nouvelle rédaction.'].filter(Boolean).join(' '),editorialStatus:'Nouvelle rédaction en brouillon — revue à actualiser'}:previousReview??undefined;
            const v=await window.atoumweb.contractTerms.library.createVersion(module.id,{title:moduleTitle,body,review});setModuleVersionId(v.id);})}>Créer la nouvelle version du module</button>
          {moduleVersion?.status==='draft'&&<button type="button" disabled={busy||module.status==='archived'} onClick={()=>void run(()=>window.atoumweb.contractTerms.library.publishVersion(moduleVersion.id))}>Publier la version du module</button>}
          <button type="button" disabled={busy} onClick={()=>void run(()=>window.atoumweb.contractTerms.library.setStatus(module.id,module.status==='archived'?'active':'archived'))}>{module.status==='archived'?'Réactiver le module':'Archiver le module'}</button>
          {module.scope==='catalog'&&<details open><summary>Prestations qui déclenchent ce module ({module.catalogItemIds.length})</summary><p>Ces références existantes déterminent l’application au devis, indépendamment de la composition des types.</p><button type="button" disabled={busy} onClick={()=>setEditServices(v=>!v)}>{editServices?'Terminer la modification des liens':'Modifier les prestations liées'}</button>{editServices&&<input aria-label="Rechercher une prestation liée" placeholder="Rechercher une prestation…" value={serviceQuery} onChange={e=>setServiceQuery(e.target.value)}/>} {catalog.filter(item=>(editServices||module.catalogItemIds.includes(item.id))&&[item.name,item.canonicalCode].join(' ').toLocaleLowerCase('fr').includes(serviceQuery.toLocaleLowerCase('fr'))).map(item=><label key={item.id}><input type="checkbox" disabled={!editServices||busy||module.status==='archived'} checked={module.catalogItemIds.includes(item.id)} onChange={()=>void run(()=>window.atoumweb.contractTerms.library.setCatalogLinks(module.id,module.catalogItemIds.includes(item.id)?module.catalogItemIds.filter(x=>x!==item.id):[...module.catalogItemIds,item.id]))}/>{item.name} · {item.canonicalCode}<button type="button" onClick={()=>openCatalogItem(item.id)}>Ouvrir la prestation</button></label>)}</details>}
          <p>La version d’un type conserve sa composition. Le texte de chaque module possède ses propres versions ; les devis figés conservent le texte exact utilisé.</p>
        </section>}
      </div>
    </div>
  </section>;
}
