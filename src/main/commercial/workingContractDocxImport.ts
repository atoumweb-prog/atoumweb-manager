/** Read-only DOCX text extraction for review. No macros, images or external parts are executed. */
import {inflateRawSync} from 'node:zlib';
const MAX_FILE=5_000_000;
const MAX_XML=2_000_000;
const unescapeXml=(s:string)=>s.replace(/&#x([\da-f]+);/gi,(_,value:string)=>String.fromCodePoint(parseInt(value,16)))
 .replace(/&#(\d+);/g,(_,value:string)=>String.fromCodePoint(parseInt(value,10)))
 .replace(/&(?:amp|lt|gt|quot|apos);/g,entity=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'"})[entity]??entity);
export function extractWorkingDocxText(bytes:Buffer):string{
 if(bytes.length>MAX_FILE||bytes.length<22)throw Error('Document DOCX vide ou trop volumineux.');
 let directory=-1;
 for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--){
   if(bytes.readUInt32LE(i)===0x06054b50){directory=i;break;}
 }
 if(directory<0)throw Error('Archive DOCX invalide.');
 const entries=bytes.readUInt16LE(directory+10);
 if(entries>300)throw Error('Archive DOCX trop complexe.');
 let cursor=bytes.readUInt32LE(directory+16),xml:Buffer|undefined;
 for(let i=0;i<entries;i++){
   if(cursor+46>bytes.length||bytes.readUInt32LE(cursor)!==0x02014b50)throw Error('Index DOCX invalide.');
   const method=bytes.readUInt16LE(cursor+10);
   const flags=bytes.readUInt16LE(cursor+8);
   const compressed=bytes.readUInt32LE(cursor+20);
   const expanded=bytes.readUInt32LE(cursor+24);
   const nameLength=bytes.readUInt16LE(cursor+28),extra=bytes.readUInt16LE(cursor+30),comment=bytes.readUInt16LE(cursor+32);
   const offset=bytes.readUInt32LE(cursor+42);
   if(cursor+46+nameLength+extra+comment>bytes.length)throw Error('Index DOCX tronqué.');
   const name=bytes.toString('utf8',cursor+46,cursor+46+nameLength);
   cursor+=46+nameLength+extra+comment;
   if(name!=='word/document.xml')continue;
   if((flags&1)!==0||![0,8].includes(method)||expanded>MAX_XML||compressed>MAX_FILE)throw Error('Partie Word non prise en charge.');
   if(offset+30>bytes.length||bytes.readUInt32LE(offset)!==0x04034b50)throw Error('Document Word introuvable.');
   const start=offset+30+bytes.readUInt16LE(offset+26)+bytes.readUInt16LE(offset+28);
   if(start+compressed>bytes.length)throw Error('Document Word tronqué.');
   const data=bytes.subarray(start,start+compressed);
   xml=method===8?inflateRawSync(data,{maxOutputLength:MAX_XML}):data;
   if(xml.length>MAX_XML||xml.length!==expanded)throw Error('Taille Word incohérente.');
   break;
 }
 if(!xml)throw Error('Aucun texte Word détecté.');
 const raw=xml.toString('utf8');
 if(!/<w:document\b/.test(raw))throw Error('Contenu Word XML invalide.');
 const paragraphs=[...raw.matchAll(/<w:p(?:\s[^>]*)?>([\s\S]*?)<\/w:p>/g)].map((match)=>{
   const parts=[...match[1].matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:tab\s*\/>|<w:br\s*\/>/g)];
   return parts.map(p=>p[1]!==undefined?unescapeXml(p[1]):p[0].startsWith('<w:tab')?'\t':'\n').join('');
 });
 const result=paragraphs.join('\n');
 if(!result.trim()||result.length>1_000_000)throw Error('Texte Word absent ou trop volumineux.');
 return result;
}
