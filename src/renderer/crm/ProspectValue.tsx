import {useState} from 'react';
import {normalizeWebUrl} from '../../shared/webUrl';
/** No send/call action: email opens a composer; telephone copies only on click. */
export function ProspectValue({value,kind}:{value:string;kind:'web'|'email'|'phone'}){
 const [message,setMessage]=useState('');
 async function activate(){try{if(kind==='phone'){await window.atoumweb.contractTerms.copyText(value);setMessage('Numéro copié');}else{await window.atoumweb.app.openExternalUrl(kind==='email'?'mailto:'+value:normalizeWebUrl(value)!);setMessage('');}}catch(e){setMessage(e instanceof Error?e.message:'Ouverture impossible.');}}
 return <span className="prospect-value"><button type="button" className="prospect-value-button" title={kind==='web'?'Ouvrir le site':kind==='email'?'Préparer un email':'Copier le numéro'} onClick={()=>void activate()}>{value}</button>{message&&<small role="status">{message}</small>}</span>;
}
