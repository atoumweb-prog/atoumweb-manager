import {useEffect,useRef,useState} from 'react';
import {CLIENT_DOCUMENT_CATEGORIES,type ClientDocument,type ClientDocumentCategory} from '../../shared/clientDocuments';
import {useUnsavedDraft} from '../unsaved/unsaved';
import {AppButton} from '../ui/AppButton';
import {OperationIcon} from '../operations/OperationIcon';
import './ClientDocumentsPanel.css';

const labels:Record<ClientDocumentCategory,string>={contract:'Contrats',quote:'Devis',invoice:'Factures',brief:'Briefs',content:'Contenus',technical:'Technique',legal:'Juridique',other:'Autres'};
const message=(reason:unknown)=>reason instanceof Error?reason.message:String(reason);
const date=(value:string)=>Number.isFinite(Date.parse(value))?new Date(value).toLocaleDateString('fr-FR'):value;

export function ClientDocumentsPanel({clientId,onChanged}:{clientId:string;onChanged?:()=>void}) {
  const [items,setItems]=useState<ClientDocument[]>([]);
  const [includeArchived,setIncludeArchived]=useState(false),[query,setQuery]=useState('');
  const [filterCategory,setFilterCategory]=useState<'all'|ClientDocumentCategory>('all');
  const [importCategory,setImportCategory]=useState<ClientDocumentCategory>('other');
  const [loading,setLoading]=useState(true),[loadError,setLoadError]=useState(''),[actionError,setActionError]=useState(''),[busy,setBusy]=useState(false);
  const [editor,setEditor]=useState<{item:ClientDocument;title:string;retentionUntil:string;retentionReason:string}|null>(null);
  const editorGuard=useUnsavedDraft('Titre et conservation du document',editor,{ready:!!editor,pending:busy&&!!editor,resetKey:editor?.item.id,discard:()=>setEditor(null)});
  const generation=useRef(0),currentClient=useRef(clientId),actionLock=useRef(false);
  currentClient.current=clientId;

  async function load() {
    const current=++generation.current;
    setLoading(true);setLoadError('');
    try {
      // All records are needed for honest totals. Consultation filters never write data.
      const next=await window.atoumweb.clientDocuments.list(clientId,true);
      if(current!==generation.current)return;
      setItems(next);onChanged?.();
    } catch(reason) {if(current===generation.current)setLoadError(message(reason));}
    finally {if(current===generation.current)setLoading(false);}
  }
  useEffect(()=>{setActionError('');void load();return()=>{generation.current++;};},[clientId]);

  async function run(action:()=>Promise<void>) {
    if(actionLock.current)return;
    actionLock.current=true;setBusy(true);setActionError('');const owner=clientId;
    try {await action();}catch(reason){if(currentClient.current===owner)setActionError(message(reason));}
    finally {actionLock.current=false;setBusy(false);}
  }
  async function importFiles() {
    const owner=clientId;
    await window.atoumweb.clientDocuments.importFiles(owner,{category:importCategory,title:'Document client'});
    if(currentClient.current===owner)await load();
  }
  function edit(item:ClientDocument) {editorGuard.request(()=>{setActionError('');setEditor({item,title:item.title,retentionUntil:item.retentionUntil?.slice(0,10)??'',retentionReason:item.retentionReason??''});});}
  async function saveEditor() {
    if(!editor)return;
    const {item,title,retentionUntil,retentionReason}=editor;
    await window.atoumweb.clientDocuments.update(item.id,{category:item.category,title,retentionCode:item.retentionCode,retentionUntil:retentionUntil===(item.retentionUntil?.slice(0,10)??'')?item.retentionUntil:retentionUntil||null,retentionReason:retentionReason||null,notes:item.notes});
    editorGuard.saved(editor);setEditor(null);
    if(currentClient.current===item.clientAccountId)await load();
  }
  async function archive(item:ClientDocument) {
    await window.atoumweb.clientDocuments.archive(item.id,!item.archivedAt);
    if(currentClient.current===item.clientAccountId)await load();
  }
  async function remove(item:ClientDocument) {
    const result=await window.atoumweb.clientDocuments.deletePermanently(item.id);
    if(!result.cancelled&&currentClient.current===item.clientAccountId)await load();
  }
  const unavailable=loading||!!loadError;
  const archivedCount=items.filter(item=>item.archivedAt).length;
  const needle=query.trim().toLocaleLowerCase('fr-FR');
  const visible=items.filter(item=>(includeArchived||!item.archivedAt)&&(filterCategory==='all'||item.category===filterCategory)&&(!needle||[item.title,item.fileName].some(value=>value.toLocaleLowerCase('fr-FR').includes(needle))));
  return <div className="client-documents-tab">
    <header className="client-documents-heading"><OperationIcon name="folder"/><div><h3>Documents du client</h3><p>Fichiers du client : contrats, devis, factures, briefs, contenus, technique et juridique.</p></div><span className="client-documents-count">{unavailable?'—':`${items.length} document${items.length===1?'':'s'}`}</span></header>
    <div className="client-documents-indicators" aria-label="Situation des documents">{[{label:'Documents au total',value:items.length,icon:'folder' as const},{label:'Non archivés',value:items.length-archivedCount,icon:'file-text' as const},{label:'Archivés',value:archivedCount,icon:'archive' as const}].map(item=><div key={item.label}><OperationIcon name={item.icon}/><strong>{unavailable?'—':item.value}</strong><span>{item.label}</span></div>)}</div>
    <div className="client-documents-toolbar">
      <label className="client-documents-search">Rechercher<em><OperationIcon name="search"/><input type="search" aria-label="Rechercher un document" placeholder="Titre ou nom de fichier…" value={query} onChange={event=>setQuery(event.target.value)}/></em></label>
      <label>Filtrer par catégorie<select aria-label="Filtrer les documents par catégorie" value={filterCategory} onChange={event=>setFilterCategory(event.target.value as typeof filterCategory)}><option value="all">Toutes les catégories</option>{CLIENT_DOCUMENT_CATEGORIES.map(category=><option key={category} value={category}>{labels[category]}</option>)}</select></label>
      <label>Catégorie du prochain import<select aria-label="Catégorie à importer" value={importCategory} disabled={busy} onChange={event=>setImportCategory(event.target.value as ClientDocumentCategory)}>{CLIENT_DOCUMENT_CATEGORIES.map(category=><option key={category} value={category}>{labels[category]}</option>)}</select></label>
      <AppButton variant="primary" icon={<OperationIcon name="upload"/>} disabled={busy||loading||!!editor} onAction={()=>run(importFiles)}>Importer</AppButton>
    </div>
    <div className="client-documents-view-tools"><label><input type="checkbox" checked={includeArchived} onChange={event=>setIncludeArchived(event.target.checked)}/> Afficher les archives</label><AppButton icon={<OperationIcon name="folder"/>} disabled={busy} onAction={()=>run(()=>window.atoumweb.clientDocuments.openFolder(clientId))}>Ouvrir le dossier client</AppButton></div>
    {editor&&<form className="client-document-editor" aria-label="Modifier le titre et la conservation" onSubmit={event=>{event.preventDefault();void run(saveEditor);}}><h4>Modifier le document</h4><p>{editor.item.fileName} · {labels[editor.item.category]}</p><fieldset disabled={busy}><label>Titre<input autoFocus required value={editor.title} onChange={event=>setEditor({...editor,title:event.target.value})}/></label><label>Conserver jusqu’au<input type="date" value={editor.retentionUntil} onChange={event=>setEditor({...editor,retentionUntil:event.target.value})}/></label><label>Motif de conservation<input value={editor.retentionReason} onChange={event=>setEditor({...editor,retentionReason:event.target.value})}/></label></fieldset><div><AppButton variant="primary" disabled={busy||!editor.title.trim()} onAction={()=>run(saveEditor)}>Enregistrer</AppButton><AppButton disabled={busy} onAction={()=>{editorGuard.request(()=>setEditor(null));}}>Annuler</AppButton></div></form>}
    {actionError&&<p className="client-documents-error" role="alert">{actionError}</p>}
    {loading?<p role="status">Chargement des documents…</p>:loadError?<div className="client-documents-error" role="alert"><p>Documents indisponibles : {loadError}</p><AppButton onAction={()=>load()}>Réessayer</AppButton></div>:!items.length?<div className="client-documents-empty"><OperationIcon name="folder"/><h4>Aucun document rattaché à ce client</h4><p>Choisissez la catégorie du prochain import, puis « Importer » pour sélectionner un ou plusieurs fichiers.</p></div>:!visible.length?<div className="client-documents-empty"><h4>Aucun document dans cette vue</h4><p>Vérifiez la recherche, la catégorie et l’option « Afficher les archives ».</p></div>:<>
      <p className="client-documents-results" role="status">{visible.length} document(s) affiché(s) sur {items.length}</p>
      <div className="client-documents-table-scroll" role="region" aria-label="Documents du client" tabIndex={0}><table className="client-documents-table"><thead><tr><th scope="col">Document</th><th scope="col">Catégorie</th><th scope="col">Conservation</th><th scope="col">État</th><th scope="col">Actions</th></tr></thead><tbody>{visible.map(item=><tr key={item.id} data-document-id={item.id}>
        <td><div className="client-document-identity"><OperationIcon name="file-text"/><div><strong>{item.title}</strong><span>{item.fileName}</span></div></div></td>
        <td><span className="client-document-category">{labels[item.category]}</span></td>
        <td>{item.retentionUntil?<span><OperationIcon name="calendar"/>{date(item.retentionUntil)}</span>:'Non renseignée'}{item.retentionReason&&<small>{item.retentionReason}</small>}</td>
        <td><div className="client-document-states"><span className="client-document-state" data-state={item.archivedAt?'archived':'current'}>{item.archivedAt?'Archivé':'Non archivé'}</span><span className="client-document-availability" data-missing={item.missing}>{item.missing?'Fichier introuvable':'Fichier présent'}</span></div></td>
        <td><div className="client-document-actions"><AppButton icon={<OperationIcon name="edit"/>} disabled={busy} onAction={()=>{edit(item);}}>Modifier</AppButton><AppButton icon={<OperationIcon name="external-link"/>} disabled={busy||item.missing} onAction={()=>run(()=>window.atoumweb.clientDocuments.openFile(item.id))}>Ouvrir</AppButton><AppButton icon={<OperationIcon name="archive"/>} disabled={busy||!!editor} onAction={()=>run(()=>archive(item))}>{item.archivedAt?'Restaurer':'Archiver'}</AppButton>{item.archivedAt&&<AppButton variant="danger" disabled={busy||!!editor} onAction={()=>run(()=>remove(item))}>Supprimer définitivement</AppButton>}</div></td>
      </tr>)}</tbody></table></div>
    </>}
    <aside className="client-documents-info"><OperationIcon name="shield-check"/><div><h4>À propos des documents</h4><p>Les fichiers sont stockés dans le dossier client. L’ouverture contrôle le chemin et l’empreinte lorsqu’elle est enregistrée ; celle-ci ne certifie pas une signature. Les preuves de devis et factures liées ou protégées par l’historique ne peuvent pas être supprimées. Une date de conservation ne crée pas de verrou automatique. Le versionnement des fichiers clients n’est pas géré.</p></div></aside>
  </div>;
}
