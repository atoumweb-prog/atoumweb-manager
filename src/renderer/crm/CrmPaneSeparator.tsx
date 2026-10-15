import {useEffect,useRef} from 'react';

/** One visual preference commit per gesture; cancellation never persists. */
export function CrmPaneSeparator({side,width,onPreview,onCommit}:{side:'left'|'right';width:number;onPreview:(width:number|null)=>void;onCommit:(width:number)=>void}) {
 const dispose=useRef<()=>void>(()=>{});
 const callbacks=useRef({onPreview,onCommit});callbacks.current={onPreview,onCommit};
 useEffect(()=>()=>dispose.current(),[side,width]);
 const bound=(n:number)=>Math.min(380,Math.max(220,n));
 return <div className={'crm-pane-separator crm-pane-separator-'+side} role="separator" tabIndex={0} aria-label={'Largeur '+(side==='left'?'Identité':'Associations')} aria-orientation="vertical" aria-valuenow={width} aria-valuemin={220} aria-valuemax={380}
  onKeyDown={e=>{if(!['ArrowLeft','ArrowRight','Home','End','Escape'].includes(e.key))return;e.preventDefault();if(e.key==='Escape'){dispose.current();return;}const next=e.key==='Home'?220:e.key==='End'?380:bound(width+(e.key==='ArrowRight'?10:-10)*(side==='left'?1:-1));if(next!==width)onCommit(next);}}
  onPointerDown={e=>{if(e.button!==0)return;e.preventDefault();e.currentTarget.focus();dispose.current();const start=e.clientX,pointer=e.pointerId;let latest=width,done=false;
   const cleanup=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',cancel);window.removeEventListener('blur',cancel);dispose.current=()=>{};};
   const end=(commit:boolean)=>{if(done)return;done=true;cleanup();callbacks.current.onPreview(null);if(commit&&latest!==width)callbacks.current.onCommit(latest);};
   const move=(event:PointerEvent)=>{if(event.pointerId!==pointer)return;latest=bound(width+(event.clientX-start)*(side==='left'?1:-1));callbacks.current.onPreview(latest);};
   const up=(event:PointerEvent)=>{if(event.pointerId===pointer)end(true);};
   const cancel=()=>end(false);dispose.current=cancel;
   window.addEventListener('pointermove',move);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',cancel);window.addEventListener('blur',cancel);
  }}/ >;
}
