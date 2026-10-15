import {useEffect,useRef,useState,type ReactNode,type CSSProperties} from 'react';
import {CRM_RECORD_KEYS,defaultCrmRecordPresentation,normalizeCrmRecordPresentation,type CrmRecordPresentation} from '../../shared/crmRecordPresentation';
import {OperationIcon} from '../operations/OperationIcon';
import './crm-record-layout.css';
/** Presentation-only frame. Every region stays mounted, including folded/narrow regions. */
export function CrmRecordLayout({kind,full,identity,context,children}:{kind:'client'|'prospect';full:boolean;identity:ReactNode;context:ReactNode;children:ReactNode}){
 const key=CRM_RECORD_KEYS[kind==='client'?0:1],store=window.atoumweb.visualPreferences;
 const [value,setValue]=useState(defaultCrmRecordPresentation),[error,setError]=useState('');
 const current=useRef(value),persisted=useRef('');current.current=value;
 useEffect(()=>{const read=()=>{try{const raw=store.getItem(key);const next=raw?normalizeCrmRecordPresentation(JSON.parse(raw)):defaultCrmRecordPresentation();setValue(next);persisted.current=JSON.stringify(next);setError('');}catch{setValue(defaultCrmRecordPresentation());setError('Disposition non lue ; réglages par défaut, saisies conservées.');}};read();const changed=(e:StorageEvent)=>{if(e.key===key||e.key===null)read();};window.addEventListener('storage',changed);return()=>window.removeEventListener('storage',changed);},[key,store]);
 function save(next:CrmRecordPresentation){setValue(next);const raw=JSON.stringify(next);if(persisted.current===raw)return;try{store.setItem(key,raw);persisted.current=raw;setError('');}catch{setError('Disposition non mémorisée ; saisies conservées.');}}
 function side(which:'left'|'right',label:string,content:ReactNode){const closed=full&&(which==='left'?value.leftClosed:value.rightClosed);const width=which==='left'?value.leftWidth:value.rightWidth;return <section className={'crm-record-side crm-record-'+which} data-folded={closed} aria-label={label}>
  <button type="button" className="crm-record-side-toggle" aria-expanded={!closed} aria-label={(closed?'Afficher ':'Replier ')+label} onClick={()=>save({...current.current,[which+'Closed']:!closed})}><OperationIcon name={closed?'rail-open':'rail-close'}/><span>{label}</span></button>
  <div className="crm-record-side-body" hidden={closed}>{content}<label className="crm-record-width">Largeur {label}<input type="range" min="220" max="380" step="10" value={width} onChange={e=>setValue({...current.current,[which+'Width']:Number(e.target.value)})} onPointerUp={()=>save(current.current)} onKeyUp={()=>save(current.current)} onBlur={()=>save(current.current)} onPointerCancel={()=>{try{setValue(normalizeCrmRecordPresentation(JSON.parse(persisted.current)));}catch{setValue(defaultCrmRecordPresentation());}}}/></label></div>
 </section>;}
 return <div className="crm-record-layout" data-full={full} data-left-closed={value.leftClosed} data-right-closed={value.rightClosed} style={{'--crm-left':(value.leftClosed?52:value.leftWidth)+'px','--crm-right':(value.rightClosed?52:value.rightWidth)+'px'} as CSSProperties}>
 {side('left','Identité',identity)}<div className="crm-record-work" aria-label="Travail CRM">{error&&<p role="alert">{error}</p>}{children}</div>{side('right','Associations',context)}</div>;
}
