import {useEffect,useRef,useState,type ReactNode} from 'react';
import {boundedSplit,layoutKey,readLayout,writeLayout,type VisualPreferenceStore} from '../../shared/panelLayout';
import './record-layout.css';
import {AppButton} from './AppButton';

export function ResizableSplitView({module,view,defaultPercent=60,store,list,children,expanded=false,selected=false}:{
  module:string;view:string;defaultPercent?:number;store:VisualPreferenceStore;
  list:ReactNode;children:ReactNode;expanded?:boolean;selected?:boolean;
}) {
  const ref=useRef<HTMLDivElement>(null),cleanup=useRef<()=>void>(()=>{});
  const [width,setWidth]=useState(0),[percent,setPercent]=useState(defaultPercent),[error,setError]=useState('');
  const key=layoutKey(module,view);
  useEffect(()=>{const read=()=>{try{setPercent(readLayout(store,key,defaultPercent));setError('');}catch{setPercent(defaultPercent);setError('Disposition non lue ; valeur par défaut utilisée.');}};read();const external=(event:StorageEvent)=>{if(event.key===key||event.key===null){cleanup.current();read();}};window.addEventListener('storage',external);return()=>window.removeEventListener('storage',external);},[store,key,defaultPercent]);
  useEffect(()=>{const element=ref.current;if(!element)return;const observer=new ResizeObserver(()=>setWidth(element.getBoundingClientRect().width));observer.observe(element);return()=>{observer.disconnect();cleanup.current();};},[]);
  useEffect(()=>()=>cleanup.current(),[key,store]);
  const effective=boundedSplit(percent,width,defaultPercent),narrow=width>0&&width<760;
  function persist(next:number){try{writeLayout(store,key,next);setError('');}catch{setError('Disposition non mémorisée ; les saisies restent intactes.');}}
  function change(value:number){const next=boundedSplit(value,width,defaultPercent);setPercent(next);persist(next);}
  function reset(){try{store.removeItem(key);setPercent(defaultPercent);setError('');}catch{setError('Réinitialisation impossible ; les saisies restent intactes.');}}
  function start(){
    cleanup.current();
    let latest=effective,moved=false,finished=false;
    const move=(event:PointerEvent)=>{
      const rect=ref.current?.getBoundingClientRect();
      if(!rect?.width)return;
      const next=boundedSplit((event.clientX-rect.left)/rect.width*100,rect.width,defaultPercent);
      if(next!==latest){latest=next;moved=true;setPercent(next);}
    };
    const dispose=()=>{finished=true;window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',end);window.removeEventListener('blur',end);window.removeEventListener('pointercancel',cancel);cleanup.current=()=>{};};
    const end=()=>{if(finished)return;dispose();if(moved)persist(latest);};
    const cancel=()=>{dispose();setPercent(effective);};
    // Disposal on unmount/module change must never write an old module's preference.
    cleanup.current=dispose;
    window.addEventListener('pointermove',move);window.addEventListener('pointerup',end,{once:true});window.addEventListener('blur',end,{once:true});window.addEventListener('pointercancel',cancel,{once:true});
  }
  return <section className="aw-record-workspace">
    <div className="aw-record-layout-tools"><AppButton onAction={reset}>Réinitialiser les largeurs</AppButton>{error&&<span role="alert">{error}</span>}</div>
    <div ref={ref} className={`aw-record-split ${expanded?'is-expanded':''} ${narrow?'is-narrow':''} ${selected?'has-selection':''}`} style={{gridTemplateColumns:selected&&!expanded&&!narrow?`${effective}% 10px minmax(0,1fr)`:'1fr'}}>
      <div className="aw-record-list">{list}</div>
      <div hidden={!selected||expanded||narrow} className="aw-record-separator" role="separator" tabIndex={0} aria-label="Largeur de la liste" aria-orientation="vertical" aria-valuenow={Math.round(effective)} aria-valuemin={Math.ceil(240/Math.max(width,760)*100)} aria-valuemax={Math.ceil((Math.max(width,760)-330)/Math.max(width,760)*100)} onPointerDown={event=>{event.preventDefault();event.currentTarget.focus();start();}} onDoubleClick={reset} onKeyDown={event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();change(event.key==='Home'?0:event.key==='End'?100:effective+(event.key==='ArrowLeft'?-3:3));}}}/>
      <div className="aw-record-detail" hidden={!selected}>{children}</div>
    </div>
  </section>;
}
