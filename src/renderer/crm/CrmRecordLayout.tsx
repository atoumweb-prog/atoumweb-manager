import {useEffect,useRef,useState,type ReactNode,type CSSProperties} from 'react';
import {CRM_RECORD_KEYS,defaultCrmRecordPresentation,normalizeCrmRecordPresentation,clientPaneDisplay,type CrmRecordPresentation} from '../../shared/crmRecordPresentation';
import {OperationIcon} from '../operations/OperationIcon';
import './crm-record-layout.css';
import {CrmPaneSeparator} from './CrmPaneSeparator';
/** Presentation-only frame. Every region stays mounted, including folded/narrow regions. */
export function CrmRecordLayout({kind,full,identity,context,children,defaultLeftWidth,defaultRightWidth}:{defaultLeftWidth?:number;defaultRightWidth?:number;kind:'client'|'prospect';full:boolean;identity:ReactNode;context:ReactNode;children:ReactNode}){
 const key=CRM_RECORD_KEYS[kind==='client'?0:1],store=window.atoumweb.visualPreferences;
 const defaults=()=>({...defaultCrmRecordPresentation(kind),...(defaultLeftWidth?{leftWidth:defaultLeftWidth}:{}),...(defaultRightWidth?{rightWidth:defaultRightWidth}:{})});
 const [value,setValue]=useState(defaults),[error,setError]=useState('');
 const root=useRef<HTMLDivElement>(null);
 const [available,setAvailable]=useState(0),[opened,setOpened]=useState({left:false,right:false}),[preview,setPreview]=useState<{side:'left'|'right';width:number}|null>(null);
 useEffect(()=>{const node=root.current;if(!node)return;const read=()=>setAvailable(node.clientWidth);read();const observer=new ResizeObserver(read);observer.observe(node);return()=>observer.disconnect();},[]);
 const current=useRef(value),persisted=useRef('');current.current=value;
 useEffect(()=>{const read=()=>{try{const raw=store.getItem(key);const next=raw?normalizeCrmRecordPresentation(JSON.parse(raw),kind):defaults();setValue(next);persisted.current=JSON.stringify(next);setError('');}catch{setValue(defaults());setError('Disposition non lue ; réglages par défaut, saisies conservées.');}};read();const changed=(e:StorageEvent)=>{if(e.key===key||e.key===null)read();};window.addEventListener('storage',changed);return()=>window.removeEventListener('storage',changed);},[key,store,kind,defaultLeftWidth,defaultRightWidth]);
 function save(next:CrmRecordPresentation){setValue(next);const raw=JSON.stringify(next);if(persisted.current===raw)return;try{store.setItem(key,raw);persisted.current=raw;setError('');}catch{setError('Disposition non mémorisée ; saisies conservées.');}}
 function side(which:'left'|'right',label:string,content:ReactNode){
  const closed=full&&(compact?!opened[which]:(which==='left'?value.leftClosed:value.rightClosed));
  return <section className={'crm-record-side crm-record-'+which} data-folded={closed} aria-label={label}>
   <button type="button" className="crm-record-side-toggle" aria-expanded={!closed} aria-label={(closed?'Afficher ':'Replier ')+label} onClick={()=>compact?setOpened({...opened,[which]:!opened[which]}):save({...current.current,[which+'Closed']:!closed})}><OperationIcon name={closed?'rail-open':'rail-close'}/><span>{label}</span></button>
   <div className="crm-record-side-body" hidden={closed&&!(compact&&which==='left')}>{content}</div>
  </section>;
 }
 const baseDisplay=kind==='client'&&full&&available>0?clientPaneDisplay(available,value):{leftWidth:value.leftWidth,rightWidth:value.rightWidth,compact:available>0&&available<1050};
 const compact=baseDisplay.compact;
 const display=kind==='client'&&full&&available>0?clientPaneDisplay(available,{...value,...(preview?{[preview.side+'Width']:preview.width}:{})}):{leftWidth:preview?.side==='left'?preview.width:value.leftWidth,rightWidth:preview?.side==='right'?preview.width:value.rightWidth};
 const width=(side:'left'|'right')=>side==='left'?display.leftWidth:display.rightWidth;
 const separator=(side:'left'|'right')=>{const min=kind==='client'?(side==='left'?300:240):220;const other=side==='left'?baseDisplay.rightWidth:baseDisplay.leftWidth;return <CrmPaneSeparator side={side} minWidth={min} maxWidth={kind==='client'?Math.max(min,Math.min(380,available-other-656)):380} width={side==='left'?baseDisplay.leftWidth:baseDisplay.rightWidth} onPreview={width=>setPreview(width===null?null:{side,width})} onCommit={width=>save({...current.current,[side+'Width']:width})}/>;};
 return <div ref={root} className="crm-record-layout" data-kind={kind} data-full={full} data-compact={compact} data-left-closed={value.leftClosed} data-right-closed={value.rightClosed} style={{'--crm-left':(value.leftClosed?52:width('left'))+'px','--crm-right':(value.rightClosed?52:width('right'))+'px'} as CSSProperties}>
 {side('left','Identité',identity)}{full&&!compact&&!value.leftClosed&&separator('left')}<div className="crm-record-work" aria-label="Travail CRM">{error&&<p role="alert">{error}</p>}{children}</div>{full&&!compact&&!value.rightClosed&&separator('right')}{side('right','Associations',context)}</div>;
}
