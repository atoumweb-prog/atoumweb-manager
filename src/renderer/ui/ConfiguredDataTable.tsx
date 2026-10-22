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
export function ConfiguredDataTable<T>({scope,columns,rows,selectedId,getId,onSelect,store,caption,className,rowAttributes,fitAvailable=true}:{
 fitAvailable?:boolean;scope:string;columns:readonly TableColumn<T>[];rows:readonly T[];selectedId:string|null;
 getId:(row:T)=>string;onSelect?:(row:T)=>void;store:VisualPreferenceStore;caption:string;className?:string;
 rowAttributes?:(row:T)=>{className?:string;[key:`data-${string}`]:string|undefined};
}){
 const schema=columns.map(({id,required})=>({id,required})),schemaKey=JSON.stringify(schema),key=tableViewKey(scope);
 const [options,setOptions]=useState<TableViewPreference>(()=>defaultTableView(schema)),latest=useRef(options);
 const [views,setViews]=useState<PersonalTableView[]>([]),saved=useRef(views),[viewId,setViewId]=useState('standard'),[error,setError]=useState('');
 function apply(next:TableViewPreference){latest.current=next;setOptions(next);}
 function saveViews(next:PersonalTableView[]){writePersonalViews(store,scope,next,[],[],schema);saved.current=next;setViews(next);}
 function update(next:TableViewPreference){apply(next);try{if(viewId==='standard')writeTableView(store,key,next,schema);else saveViews(saved.current.map(v=>v.id===viewId?{...v,preference:next}:v));setError('');}catch{setError('Préférence non mémorisée. La fiche et ses saisies sont conservées.');}}
 useEffect(()=>{
  const read=()=>{try{
   const all=readPersonalViews(store,scope,[],[],schema);saved.current=all;setViews(all);
   const personal=all.find(v=>v.id===viewId);apply(personal?.preference??readTableView(store,key,[],[],schema));
   if(!personal)setViewId('standard');setError('');
  }catch{apply(defaultTableView(schema));setError('Préférences illisibles : vue standard disponible, fiche conservée.');}};
  read();const changed=(event:StorageEvent)=>{if(event.key===null||event.key===key||event.key===personalViewsKey(scope))read();};
  window.addEventListener('storage',changed);return()=>window.removeEventListener('storage',changed);
 },[store,key,schemaKey,viewId]);
 function choose(id:string){try{const next=id==='standard'?readTableView(store,key,[],[],schema):saved.current.find(v=>v.id===id)?.preference;if(next){setViewId(id);apply(next);}}catch{setError('Vue non lue ; la fiche et les saisies sont conservées.');}}
 function edit(action:'create'|'duplicate'|'rename'|'delete',name=''){
  try{
   if(action!=='delete'&&(!name.trim()||saved.current.some(v=>v.name.toLocaleLowerCase('fr-FR')===name.toLocaleLowerCase('fr-FR')&&!(action==='rename'&&v.id===viewId))))throw Error('Choisis un nom de vue distinct.');
   if(action==='delete'){saveViews(saved.current.filter(v=>v.id!==viewId));choose('standard');}
   else if(action==='rename')saveViews(saved.current.map(v=>v.id===viewId?{...v,name}:v));
   else{const id='personal-'+crypto.randomUUID(),preference=action==='duplicate'?latest.current:defaultTableView(schema);saveViews([...saved.current,{id,name,preference}]);setViewId(id);apply(preference);}
   setError('');
  }catch(e){setError(e instanceof Error?e.message:'Vue non mémorisée.');}
 }
 const ordered=options.columnOrder.map(id=>columns.find(c=>c.id===id)).filter((c):c is TableColumn<T>=>!!c);
 const visible=normalizeTableColumns(options.visibleColumnIds,schema);
 return <section className="aw-configured-table" data-table-scope={scope}>
  <details className="aw-table-preferences"><summary><OperationIcon name="columns"/> Colonnes et vues <span>{rows.length} résultats · source complète</span></summary>
   <TableColumnManager columns={ordered} visible={visible} onToggle={id=>update({...latest.current,visibleColumnIds:visible.includes(id)?visible.filter(c=>c!==id):[...visible,id]})} onMove={(id,target)=>update({...latest.current,columnOrder:moveColumn(latest.current.columnOrder,id,target,schema)})} onReset={()=>update({...latest.current,visibleColumnIds:schema.map(c=>c.id),columnOrder:schema.map(c=>c.id),widths:{}})}/>
   <SavedViewPicker views={views} selected={viewId} onSelect={choose} onCreate={(name,duplicate)=>edit(duplicate?'duplicate':'create',name)} onRename={name=>edit('rename',name)} onDelete={()=>edit('delete')} onReset={()=>{try{const next=defaultTableView(schema);writeTableView(store,key,next,schema);setViewId('standard');apply(next);setError('');}catch{setError('Réinitialisation non mémorisée ; fiche conservée.');}}}/>
  </details>
  {error&&<p role="alert">{error}</p>}
  <DataTable fitAvailable={fitAvailable} className={className} rowAttributes={rowAttributes} rows={sortTableRows(rows,columns,options.sort,getId)} columns={ordered.filter(c=>visible.includes(c.id))} selectedId={selectedId} getId={getId} onRowActivate={onSelect} sort={options.sort} onSort={id=>update({...latest.current,sort:nextTableSort(latest.current.sort,id)})} widths={options.widths} onWidth={(id,width)=>update({...latest.current,widths:{...latest.current.widths,[id]:width}})} caption={caption} preferenceScope={scope+':'+viewId}/>
 </section>;
}
