import {useEffect,useRef,type ReactNode} from 'react';
/** Native modal supplies focus containment, Escape and focus restoration. Exit guards stay with the caller. */
export function ProspectDialog({children,label,onClose,className=''}:{children:ReactNode;label:string;onClose:()=>void;className?:string}){
 const ref=useRef<HTMLDialogElement>(null),close=useRef(onClose);close.current=onClose;
 useEffect(()=>{const dialog=ref.current,trigger=document.activeElement as HTMLElement|null;if(dialog&&!dialog.open)dialog.showModal();return()=>{dialog?.close();trigger?.isConnected&&trigger.focus({preventScroll:true});};},[]);
 return <dialog ref={ref} className={'prospect-modal '+className} aria-label={label} onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close.current();}}} onCancel={event=>{event.preventDefault();event.stopPropagation();close.current();}}>{children}</dialog>;
}
