import {paginateRows,type CatalogTableContext} from '../../shared/catalogTableContext';
import {createPortal} from 'react-dom';
import {useEffect,useRef,useState} from 'react';
import type {VisualPreferenceStore} from '../../shared/panelLayout';
import {nextTableSort,sortTableRows,normalizeTableColumns} from '../../shared/tablePresentation';
import {defaultTableView,moveColumn,readTableView,writeTableView,tableViewKey,type TableViewPreference} from '../../shared/tableViewPreference';
import {personalViewsKey,readPersonalViews,writePersonalViews,type PersonalTableView} from '../../shared/personalTableViews';
import {DataTable,type TableColumn} from './DataTable';
import {TableColumnManager} from './TableControls';
import {SavedViewPicker} from './SavedViewPicker';
import {OperationIcon} from '../operations/OperationIcon';

/** Ports the tested 01D controls to real lists. No entities or selection in storage. */
export function ConfiguredDataTable<T>({scope,columns,rows,selectedId,getId,onSelect,store,caption,className,rowAttributes,fitAvailable=true,defaultVisibleColumnIds,controlsHost,compactHiddenColumnIds=[],catalogContext,pagination}:{
 catalogContext?:{value:CatalogTableContext;onApply:(context:CatalogTableContext)=>void};
 pagination?:{page:number;pageSize:25|50|100;onPage:(page:number)=>void;onSize:(size:25|50|100)=>void};
 controlsHost?:HTMLElement|null;compactHiddenColumnIds?:readonly string[];
 defaultVisibleColumnIds?:readonly string[];fitAvailable?:boolean;scope:string;columns:readonly TableColumn<T>[];rows:readonly T[];selectedId:string|null;
 getId:(row:T)=>string;onSelect?:(row:T)=>void;store:VisualPreferenceStore;caption:string;className?:string;
 rowAttributes?:(row:T)=>{className?:string;[key:`data-${string}`]:string|undefined};
}){
 const schema=columns.map(({id,required})=>({id,required})),schemaKey=JSON.stringify(schema),key=tableViewKey(scope);
 const initialView=():TableViewPreference=>({...defaultTableView(schema),...(defaultVisibleColumnIds?{visibleColumnIds:normalizeTableColumns([...defaultVisibleColumnIds],schema)}:{})});
 const [options,setOptions]=useState<TableViewPreference>(initialView),latest=useRef(options);
 const [views,setViews]=useState<PersonalTableView[]>([]),saved=useRef(views),[viewId,setViewId]=useState('standard'),[error,setError]=useState('');
 function apply(next:TableViewPreference){latest.current=next;setOptions(next);}
 function saveViews(next:PersonalTableView[]){writePersonalViews(store,scope,next,[],[],schema);saved.current=next;setViews(next);}
 function update(next:TableViewPreference){apply(next);try{if(viewId==='standard')writeTableView(store,key,next,schema);else saveViews(saved.current.map(v=>v.id===viewId?{...v,preference:next}:v));setError('');}catch{setError('Préférence non mémorisée. La fiche et ses saisies sont conservées.');}}
 useEffect(()=>{
  const read=()=>{try{
   const all=readPersonalViews(store,scope,[],[],schema);saved.current=all;setViews(all);
   const personal=all.find(v=>v.id===viewId);apply(personal?.preference??(store.getItem(key)===null?initialView():readTableView(store,key,[],[],schema)));
   if(!personal)setViewId('standard');setError('');
  }catch{apply(initialView());setError('Préférences illisibles : vue standard disponible, fiche conservée.');}};
  read();const changed=(event:StorageEvent)=>{if(event.key===null||event.key===key||event.key===personalViewsKey(scope))read();};
  window.addEventListener('storage',changed);return()=>window.removeEventListener('storage',changed);
 },[store,key,schemaKey,viewId]);
 function choose(id:string){try{const next=id==='standard'?(store.getItem(key)===null?initialView():readTableView(store,key,[],[],schema)):saved.current.find(v=>v.id===id)?.preference;if(next){setViewId(id);apply(next);if(next.catalogContext)catalogContext?.onApply(next.catalogContext);pagination?.onPage(1);}}catch{setError('Vue non lue ; la fiche et les saisies sont conservées.');}}
 function edit(action:'create'|'duplicate'|'rename'|'delete',name=''){
  try{
   if(action!=='delete'&&(!name.trim()||saved.current.some(v=>v.name.toLocaleLowerCase('fr-FR')===name.toLocaleLowerCase('fr-FR')&&!(action==='rename'&&v.id===viewId))))throw Error('Choisis un nom de vue distinct.');
   if(action==='delete'){saveViews(saved.current.filter(v=>v.id!==viewId));choose('standard');}
   else if(action==='rename')saveViews(saved.current.map(v=>v.id===viewId?{...v,name}:v));
   else{const id='personal-'+crypto.randomUUID(),preference=catalogContext?{...latest.current,catalogContext:catalogContext.value}:action==='duplicate'?latest.current:defaultTableView(schema);saveViews([...saved.current,{id,name,preference}]);setViewId(id);apply(preference);}
   setError('');
  }catch(e){setError(e instanceof Error?e.message:'Vue non mémorisée.');}
 }
 // Only Catalogue opts into saved filters; other table domains keep their existing contract.
 const contextSignature=JSON.stringify(catalogContext?.value);
 useEffect(()=>{if(catalogContext&&JSON.stringify(latest.current.catalogContext)!==contextSignature)update({...latest.current,catalogContext:catalogContext.value});},[contextSignature]);
 const sortedRows=sortTableRows(rows,columns,options.sort,getId);
 const page=paginateRows(sortedRows,pagination?.page??1,pagination?.pageSize??Math.max(1,rows.length));
 useEffect(()=>{if(pagination&&pagination.page!==page.page)pagination.onPage(page.page);},[page.page,pagination?.page]);
 const ordered=options.columnOrder.map(id=>columns.find(c=>c.id===id)).filter((c):c is TableColumn<T>=>!!c);
 const visible=normalizeTableColumns(options.visibleColumnIds,schema);
 const controls=(<details className="aw-table-preferences"><summary><OperationIcon name="columns"/> Colonnes et vues <span>{views.find(view=>view.id===viewId)?.name||'Vue standard'} · {rows.length} résultats</span></summary>
   {defaultVisibleColumnIds&&<p className="muted">Les changements sont enregistrés automatiquement dans la vue active. Dupliquer la vue permet de l’enregistrer sous un autre nom ; Rétablir retrouve la présentation compacte.</p>}
   <TableColumnManager columns={ordered} visible={visible} onToggle={id=>update({...latest.current,visibleColumnIds:visible.includes(id)?visible.filter(c=>c!==id):[...visible,id]})} onMove={(id,target)=>update({...latest.current,columnOrder:moveColumn(latest.current.columnOrder,id,target,schema)})} onReset={()=>update({...latest.current,visibleColumnIds:initialView().visibleColumnIds,columnOrder:schema.map(c=>c.id),widths:{}})}/>
   <SavedViewPicker views={views} selected={viewId} onSelect={choose} onCreate={(name,duplicate)=>edit(duplicate?'duplicate':'create',name)} onRename={name=>edit('rename',name)} onDelete={()=>edit('delete')} onReset={()=>{try{const next={...initialView(),...(catalogContext?{catalogContext:catalogContext.value}:{})};writeTableView(store,key,next,schema);setViewId('standard');apply(next);setError('');}catch{setError('Réinitialisation non mémorisée ; fiche conservée.');}}}/>
  </details>);
 return <section className="aw-configured-table" data-table-scope={scope}>
  {controlsHost?createPortal(controls,controlsHost):controls}
  {error&&<p role="alert">{error}</p>}
  <DataTable fitAvailable={fitAvailable} className={className} rowAttributes={rowAttributes} rows={pagination?page.rows:sortedRows} columns={ordered.filter(c=>visible.includes(c.id)&&!(viewId==='standard'&&store.getItem(key)===null&&compactHiddenColumnIds.includes(c.id)))} selectedId={selectedId} getId={getId} onRowActivate={onSelect} sort={options.sort} onSort={id=>{update({...latest.current,sort:nextTableSort(latest.current.sort,id)});pagination?.onPage(1);}} widths={options.widths} onWidth={(id,width)=>update({...latest.current,widths:{...latest.current.widths,[id]:width}})} caption={caption} preferenceScope={scope+':'+viewId}/>
  {pagination&&<nav className="ot-pagination" aria-label="Pagination du catalogue"><span role="status">{page.start}–{page.end} sur {page.total} résultats</span><label>Lignes par page <select aria-label="Lignes par page" value={pagination.pageSize} onChange={event=>{pagination.onSize(Number(event.target.value) as 25|50|100);pagination.onPage(1);}}>{[25,50,100].map(size=><option key={size} value={size}>{size}</option>)}</select></label><button type="button" aria-label="Première page" disabled={page.page===1} onClick={()=>pagination.onPage(1)}>«</button><button type="button" aria-label="Page précédente" disabled={page.page===1} onClick={()=>pagination.onPage(page.page-1)}>‹</button><span>Page {page.page} / {page.pages}</span><button type="button" aria-label="Page suivante" disabled={page.page===page.pages} onClick={()=>pagination.onPage(page.page+1)}>›</button><button type="button" aria-label="Dernière page" disabled={page.page===page.pages} onClick={()=>pagination.onPage(page.pages)}>»</button></nav>}
 </section>;
}
