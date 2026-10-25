import {useEffect,useRef,useState} from 'react';
import {getDocument,GlobalWorkerOptions} from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
GlobalWorkerOptions.workerSrc=workerUrl;
export function QuotePdfPages({base64}:{base64:string}){
 const root=useRef<HTMLDivElement>(null),[error,setError]=useState(''),[count,setCount]=useState(0),[zoom,setZoom]=useState(90);
 useEffect(()=>{let active=true;setError('');setCount(0);root.current?.replaceChildren();const bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));const task=getDocument({data:bytes,useSystemFonts:true});
 void task.promise.then(async pdf=>{if(!active)return;setCount(pdf.numPages);for(let i=1;i<=pdf.numPages&&active;i++){const page=await pdf.getPage(i);if(!active)break;const viewport=page.getViewport({scale:1.25}),canvas=document.createElement('canvas'),holder=document.createElement('figure'),caption=document.createElement('figcaption');canvas.width=viewport.width;canvas.height=viewport.height;canvas.setAttribute('aria-label','Page '+i);holder.append(canvas);caption.textContent='Page '+i+' / '+pdf.numPages;holder.append(caption);root.current?.append(holder);await page.render({canvas,viewport}).promise;}}).catch(e=>{if(active)setError(String(e));});return()=>{active=false;void task.destroy();};
 },[base64]);
 return <section className="quote-pdf-pages"><div className="pdf-pages-controls"><span>{count?count+' pages':'Rendu des pages…'}</span><label>Zoom <select value={zoom} onChange={e=>setZoom(Number(e.target.value))}>{[60,75,90,100,125].map(n=><option key={n} value={n}>{n} %</option>)}</select></label></div>{error&&<p role="alert">{error}</p>}<div ref={root} className="pdf-pages-canvas" style={{'--pdf-zoom':zoom/100} as React.CSSProperties}/></section>;
}
