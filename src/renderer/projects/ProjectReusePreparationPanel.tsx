import { useRef, useState } from 'react';
import { useUnsavedDraft } from '../unsaved/unsaved';
import type { ProjectTechnicalCategory, ProjectTechnicalContentType, ProjectTechnicalItemDetail } from '../../shared/projects';
import {
  ATOUMWEB_LIBRARY_CATEGORIES, ATOUMWEB_REUSE_STATUSES,
  type AtoumWebLibraryCategory, type AtoumWebReuseStatus,
  type AtoumWebTechnicalItemDetail, type ReusePreparationResult,
} from '../../shared/referentials';

const CATEGORY_MAP: Record<ProjectTechnicalCategory, AtoumWebLibraryCategory> = {
  header:'header', footer:'footer', hero:'hero', page:'page', section:'section',
  css:'css', javascript:'code_snippet', php:'code_snippet', acf:'acf', divi:'divi',
  woocommerce:'woocommerce', plugin:'app', config:'note', note:'note', other:'note',
};
const CATEGORY_LABELS: Record<AtoumWebLibraryCategory,string> = {
  header:'Header', footer:'Footer', hero:'Hero', page:'Page', section:'Section', form:'Formulaire',
  gallery:'Galerie', carousel:'Carrousel', navigation:'Navigation', code_snippet:'Snippet de code',
  css:'CSS', javascript:'JavaScript', php:'PHP', woocommerce:'WooCommerce', acf:'ACF', divi:'Divi',
  app:'Application / Extension', note:'Note technique',
};
const STATUS_LABELS: Record<AtoumWebReuseStatus,string> = {adapt:'À adapter',ready:'Prêt à réutiliser',reference:'Référence'};

export function ProjectReusePreparationPanel({detail,onClose,onMessage}: {
  detail:ProjectTechnicalItemDetail; onClose:()=>void; onMessage:(message:string)=>void;
}) {
  const initial=detail.stableVersion??detail.currentVersion??detail.versions[0];
  const [versionId,setVersionId]=useState(initial?.id??'');
  const [preparation,setPreparation]=useState<ReusePreparationResult|null>(null);
  const [busy,setBusy]=useState(false),inFlight=useRef(false);
  const [error,setError]=useState<string|null>(null);
  const [adaptationNotes,setAdaptationNotes]=useState('');
  const [name,setName]=useState(`${detail.name} — générique`);
  const [category,setCategory]=useState<AtoumWebLibraryCategory>(CATEGORY_MAP[detail.category]);
  const [reuseStatus,setReuseStatus]=useState<AtoumWebReuseStatus>('adapt');
  const [description,setDescription]=useState(detail.description??'');
  const [tags,setTags]=useState((detail.tags??[]).join(', '));
  const [vertical,setVertical]=useState('');
  const [contentType,setContentType]=useState<ProjectTechnicalContentType>(initial?.contentType??'text');
  const [language,setLanguage]=useState(initial?.language??'');
  const [content,setContent]=useState(initial?.contentText??'');
  const [notes,setNotes]=useState(initial?.notes??'');
  const [reviewed,setReviewed]=useState(false);
  const [created,setCreated]=useState<AtoumWebTechnicalItemDetail|null>(null);

  // Register the actual form with the existing UX-01 guard. A prepared
  // package is not a saved global component: edits remain local until the
  // explicit human-approved promotion succeeds.
  const draft = useUnsavedDraft('Adaptation de réutilisation', {
    adaptationNotes, name, category, reuseStatus, description, tags, vertical,
    contentType, language, content, notes, reviewed,
  }, {
    group: 'project-reuse', resetKey: versionId,
    ready: !created, pending: busy,
  });

  function chooseVersion(id:string):void {
    if(id===versionId)return;
    draft.request(()=>{
      const version=detail.versions.find(v=>v.id===id);
      setVersionId(id);setPreparation(null);setReviewed(false);setError(null);
      setContentType(version?.contentType??'text');setLanguage(version?.language??'');
      setContent(version?.contentText??'');setNotes(version?.notes??'');
    });
  }
  function changed():void {setReviewed(false);}
  async function prepare():Promise<void> {
    if(inFlight.current||!versionId||created)return;
    inFlight.current=true;setBusy(true);setError(null);setReviewed(false);
    try {
      const result=await window.atoumweb.referentials.reuse.prepareProjectItem({
        itemId:detail.id,versionId,adaptationNotes:adaptationNotes.trim()||null,
      });
      setPreparation(result);
      onMessage(`Copie de travail indépendante préparée depuis « ${detail.name} » v${result.versionNumber}.`);
    }catch(e){setError(e instanceof Error?e.message:'Préparation impossible.');}
    finally{inFlight.current=false;setBusy(false);}
  }
  async function openPackage():Promise<void> {
    if(!preparation||inFlight.current)return;
    inFlight.current=true;setBusy(true);setError(null);
    try {
      const result=await window.atoumweb.referentials.reuse.openPackage(preparation.packageDirectory);
      if(!result.ok)setError(result.error??'Impossible d’ouvrir le paquet.');
    }catch(e){setError(e instanceof Error?e.message:'Impossible d’ouvrir le paquet.');}
    finally{inFlight.current=false;setBusy(false);}
  }
  async function createGlobal():Promise<void> {
    if(inFlight.current||!preparation||!reviewed||!name.trim()||created)return;
    inFlight.current=true;setBusy(true);setError(null);
    try {
      const result=await window.atoumweb.referentials.reuse.createGlobal({
        preparation,
        item:{name:name.trim(),category,reuseStatus,description:description.trim()||null,
          tags:tags.split(',').map(t=>t.trim()).filter(Boolean),vertical:vertical.trim()||null},
        version:{contentType,language:language.trim()||null,contentText:contentType==='reference'?null:content,notes:notes.trim()||null},
      });
      setCreated(result);
      onMessage(`Brique AtoumWeb « ${result.name} » créée volontairement depuis « ${detail.name} » v${preparation.versionNumber}.`);
    }catch(e){setError((e instanceof Error?e.message:'Création non confirmée.')+' Vérifiez la Bibliothèque avant une nouvelle tentative.');}
    finally{inFlight.current=false;setBusy(false);}
  }

  return <section className="reuse-preparation-panel" aria-label="Réutilisation guidée">
    <div className="technical-detail-heading"><div><span className="eyebrow">Copie indépendante</span><h3>Préparer pour réutilisation</h3></div>
      <button type="button" className="secondary-button" disabled={busy} onClick={()=>draft.request(onClose)}>Fermer la préparation</button></div>
    <p className="technical-safety-note">Le Projet client et ses versions restent inchangés. Aucun code n’est exécuté ni généralisé automatiquement. Le journal trace les étapes effectuées.</p>
    {error&&<p className="form-error" role="alert">{error}</p>}
    <fieldset disabled={busy||!!created} className="reuse-fields">
      <label>Version Projet source<select aria-label="Version Projet source" value={versionId} onChange={e=>chooseVersion(e.target.value)}>
        {!detail.versions.length&&<option value="">Aucune version disponible</option>}
        {detail.versions.map(v=><option key={v.id} value={v.id}>v{v.versionNumber}{v.stable?' · stable':''}{v.current?' · actuelle':''}</option>)}
      </select></label>
      <label>Notes de préparation<textarea aria-label="Notes de préparation" rows={3} value={adaptationNotes} onChange={e=>setAdaptationNotes(e.target.value)} placeholder="Dépendances client à retirer, paramètres à rendre configurables…"/></label>
      <button type="button" className="primary-button" disabled={!versionId} onClick={()=>void prepare()}>{preparation?'Recréer la copie de travail':'Créer la copie de travail'}</button>
    </fieldset>
    {preparation&&<>
      <div className="reuse-package-summary" role="status"><strong>Copie de travail indépendante · v{preparation.versionNumber}</strong>
        <span>{preparation.copiedFiles.filter(f=>f.copied).length} fichier(s) source copié(s). Aucune brique globale créée par cette préparation.</span>
        {preparation.copiedFiles.some(f=>f.missing)&&<p role="alert">Des fichiers source manquent : vérifiez le paquet avant de créer la brique.</p>}
        <details><summary>Dossier et fichiers du paquet</summary><p>{preparation.packageDirectory}</p><p>{preparation.manifestPath}</p><p>{preparation.adaptationNotesPath}</p>
          {preparation.copiedFiles.map(f=><p key={f.resourceId}>{f.fileName} · {f.copied?'copié':'absent'}</p>)}</details>
        <button type="button" className="secondary-button" disabled={busy} onClick={()=>void openPackage()}>Ouvrir la copie de travail</button></div>
      {!created&&<fieldset disabled={busy} className="reuse-fields">
        <legend>Adapter, puis créer volontairement la brique AtoumWeb</legend>
        <p>Relisez le contenu et les fichiers du paquet. Retirez les informations privées et adaptez les dépendances propres au client. Les fichiers du paquet seront joints à la nouvelle brique.</p>
        <div className="technical-editor-grid">
          <label>Nom générique<input aria-label="Nom générique" value={name} onChange={e=>{setName(e.target.value);changed();}}/></label>
          <label>Catégorie<select aria-label="Catégorie de la brique" value={category} onChange={e=>{setCategory(e.target.value as AtoumWebLibraryCategory);changed();}}>{ATOUMWEB_LIBRARY_CATEGORIES.map(c=><option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}</select></label>
          <label>État de réutilisation<select aria-label="État de réutilisation" value={reuseStatus} onChange={e=>{setReuseStatus(e.target.value as AtoumWebReuseStatus);changed();}}>{ATOUMWEB_REUSE_STATUSES.map(s=><option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select></label>
          <label>Verticale facultative<input aria-label="Verticale facultative" value={vertical} onChange={e=>{setVertical(e.target.value);changed();}}/></label>
          <label>Description<input aria-label="Description générique" value={description} onChange={e=>{setDescription(e.target.value);changed();}}/></label>
          <label>Tags<input aria-label="Tags génériques" value={tags} onChange={e=>{setTags(e.target.value);changed();}}/></label>
          <label>Type de contenu<select aria-label="Type générique" value={contentType} onChange={e=>{setContentType(e.target.value as ProjectTechnicalContentType);changed();}}><option value="code">Code</option><option value="json">JSON / Export</option><option value="text">Texte / Documentation</option><option value="reference">Référence fichier</option></select></label>
          <label>Langage<input aria-label="Langage générique" value={language} onChange={e=>{setLanguage(e.target.value);changed();}}/></label>
        </div>
        {contentType!=='reference'&&<label>Contenu générique adapté<textarea className="technical-code-input" aria-label="Contenu générique adapté" rows={8} spellCheck={false} value={content} onChange={e=>{setContent(e.target.value);changed();}}/></label>}
        <label>Notes de version<textarea aria-label="Notes de version générique" rows={3} value={notes} onChange={e=>{setNotes(e.target.value);changed();}}/></label>
        <label className="reuse-review"><input type="checkbox" aria-label="Adaptation relue" checked={reviewed} onChange={e=>setReviewed(e.target.checked)}/>J’ai relu le contenu et les fichiers du paquet, vérifié leur adaptation et les données client avant création.</label>
        <button type="button" className="primary-button" disabled={!reviewed||!name.trim()} onClick={()=>void createGlobal()}>Créer la brique AtoumWeb</button>
      </fieldset>}
      {created&&<div className="reuse-package-summary" role="status"><strong>Brique créée : {created.name}</strong>
        <span>Origine conservée : {detail.name} · v{preparation.versionNumber}. Le Projet source reste inchangé.</span>
        <button type="button" className="secondary-button" onClick={()=>window.dispatchEvent(new CustomEvent('atoumweb:navigate',{detail:{entityType:'atoumweb_library',entityId:created.id,title:created.name}}))}>Ouvrir la brique AtoumWeb</button></div>}
    </>}
  </section>;
}
