import { BrowserWindow } from 'electron';
import { writeFileSync } from 'node:fs';
import type { ClauseDraftSource } from './wordDraftReview';

const htmlEscape=(text:string)=>text.replaceAll('&','&amp;').replaceAll('<','&lt;')
  .replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');

/** A working copy, not an invoice, signature or official contract evidence. */
export function buildWordDraftWorkingPdfHtml(source:ClauseDraftSource,title:string):string{
 if(source.status!=='draft'||source.kind!=='contract_clause')
  throw Error('Le PDF de travail est réservé aux brouillons de clauses.');
 if(source.body.length>250000)throw Error('Texte trop volumineux.');
 const paragraphs=source.body.replace(/\r\n?/g,'\n').split('\n')
  .map(p=>'<p>'+htmlEscape(p||'\u00a0')+'</p>').join('');
 return '<!doctype html><html lang="fr"><head><meta charset="utf-8"/>'+
 '<title>DOCUMENT DE TRAVAIL — '+htmlEscape(title)+'</title><style>'+
 '@page{size:A4;margin:18mm}body{font:12pt/1.55 Arial,sans-serif;color:#222;}'+
 'h1{font-size:18pt}h2{font-size:12pt;color:#7a241e}p{white-space:pre-wrap;overflow-wrap:anywhere}'+
 '.watermark{padding:12px;border:2px solid #7a241e;font-weight:bold;color:#7a241e;margin-bottom:16px}'+
 'footer{margin-top:26px;font-size:9pt;color:#555;border-top:1px solid #aaa;padding-top:8px}'+
 '</style></head><body><div class="watermark">DOCUMENT DE TRAVAIL — NON SIGNÉ, NON PUBLIÉ, NON FACTURE ABBY</div>'+
 '<h1>'+htmlEscape(title)+'</h1><h2>Brouillon contractuel — consultation interne uniquement</h2>'+
 paragraphs+'<footer>Prévisualisation produite depuis un brouillon de clause. Ne remplace pas les preuves ni les PDF officiels.</footer>'+
 '</body></html>';
}

export async function saveWordDraftWorkingPdf(source:ClauseDraftSource,title:string,path:string):Promise<void>{
 const html=buildWordDraftWorkingPdfHtml(source,title);
 const window=new BrowserWindow({show:false,width:900,height:1200,webPreferences:{sandbox:true}});
 window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 try{
  await window.loadURL('data:text/html;charset=utf-8,'+encodeURIComponent(html));
  const pdf=await window.webContents.printToPDF({pageSize:'A4',printBackground:true,preferCSSPageSize:true});
  if(!pdf.subarray(0,5).toString('ascii').startsWith('%PDF-'))throw Error('Le PDF de travail est invalide.');
  writeFileSync(path,pdf);
 }finally{if(!window.isDestroyed())window.destroy();}
}
