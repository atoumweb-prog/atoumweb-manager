import {useEffect,useRef,useState,type ReactNode,type CSSProperties} from 'react';
import {CRM_RECORD_KEYS,defaultCrmRecordPresentation,normalizeCrmRecordPresentation,type CrmRecordPresentation} from '../../shared/crmRecordPresentation';
import {OperationIcon} from '../operations/OperationIcon';
import './crm-record-layout.css';
import {CrmPaneSeparator} from './CrmPaneSeparator';
/** Presentation-only frame. Every region stays mounted, including folded/narrow regions. */
export function CrmRecordLayout({kind,full,identity,context,children}:{kind:'client'|'prospect';full:boolean;identity:ReactNode;context:ReactNode;children:ReactNode}){
 const key=CRM_RECORD_KEYS[kind==='client'?0:1],store=window.atoumweb.visualPreferences;
 const [value,setValue]=useState(defaultCrmRecordPresentation),[error,setError]=useState('');
 const root=useRef<HTMLDivElement>(null);
 const [compact,setCompact]=useState(false),[opened,setOpened]=useState({left:false,right:false}),[preview,setPreview]=useState<{side:'left'|'right';width:number}|null>(null);
 useEffect(()=>{const node=root.current;if(!node)return;const read=()=>setCompact(node.clientWidth<1050);read();const observer=new ResizeObserver(read);observer.observe(node);return()=>observer.disconnect();},[]);
 const current=useRef(value),persisted=useRef('');current.current=value;
 useEffect(()=>{const read=()=>{try{const raw=store.getItem(key);const next=raw?normalizeCrmRecordPresentation(JSON.parse(raw)):defaultCrmRecordPresentation();setValue(next);persisted.current=JSON.stringify(next);setError('');}catch{setValue(defaultCrmRecordPresentation());setError('Disposition non lue ; réglages par défaut, saisies conservées.');}};read();const changed=(e:StorageEvent)=>{if(e.key===key||e.key===null)read();};window.addEventListener('storage',changed);return()=>window.removeEventListener('storage',changed);},[key,store]);
 function save(next:CrmRecordPresentation){setValue(next);const raw=JSON.stringify(next);if(persisted.current===raw)return;try{store.setItem(key,raw);persisted.current=raw;setError('');}catch{setError('Disposition non mémorisée ; saisies conservées.');}}
 function side(which:'left'|'right',label:string,content:ReactNode){
  const closed=full&&(compact?!opened[which]:(which==='left'?value.leftClosed:value.rightClosed));
  return <section className={'crm-record-side crm-record-'+which} data-folded={closed} aria-label={label}>
   <button type="button" className="crm-record-side-toggle" aria-expanded={!closed} aria-label={(closed?'Afficher ':'Replier ')+label} onClick={()=>compact?setOpened({...opened,[which]:!opened[which]}):save({...current.current,[which+'Closed']:!closed})}><OperationIcon name={closed?'rail-open':'rail-close'}/><span>{label}</span></button>
   <div className="crm-record-side-body" hidden={closed&&!(compact&&which==='left')}>{content}</div>
  </section>;
 }
 const separator=(side:'left'|'right')=><CrmPaneSeparator side={side} width={side==='left'?value.leftWidth:value.rightWidth} onPreview={width=>setPreview(width===null?null:{side,width})} onCommit={width=>save({...current.current,[side+'Width']:width})}/>;
 const width=(side:'left'|'right')=>preview?.side===side?preview.width:(side==='left'?value.leftWidth:value.rightWidth);

 return <div ref={root} className="crm-record-layout" data-full={full} data-compact={compact} data-left-closed={value.leftClosed} data-right-closed={value.rightClosed} style={{'--crm-left':(value.leftClosed?52:width('left'))+'px','--crm-right':(value.rightClosed?52:width('right'))+'px'} as CSSProperties}>
 {side('left','Identité',identity)}{full&&!compact&&!value.leftClosed&&separator('left')}<div className="crm-record-work" aria-label="Travail CRM">{error&&<p role="alert">{error}</p>}{children}</div>{full&&!compact&&!value.rightClosed&&separator('right')}{side('right','Associations',context)}</div>;
}
