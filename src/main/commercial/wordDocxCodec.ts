import { deflateRawSync, inflateRawSync } from 'node:zlib';
import { Buffer } from 'node:buffer';
import type { ClauseDraftSource, WordDraftManifest } from './wordDraftReview';

// Strict bounded subset of OOXML. No third-party ZIP dependency, macros,
// network relationships, XML entities, ZIP64, or unbounded decompression.
const MAX_FILE=6*1024*1024,MAX_ENTRY=2*1024*1024,MAX_TOTAL=10*1024*1024;
const MAX_FILES=240,MAX_RATIO=250;
const crcTable=Array.from({length:256},(_,n)=>{
 let c=n;for(let i=0;i<8;i++)c=c&1?0xedb88320^(c>>>1):c>>>1;
 return c>>>0;
});
const crc32=(data:Buffer)=>{let c=0xffffffff;for(const b of data)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;};
function safeName(name:string){
 if(!name||name.startsWith('/')||name.includes('\\')||name.includes('\0')||
    name.split('/').some(part=>part==='..'||part==='.')||/^[A-Za-z]:/.test(name))
  throw Error('Archive Word : chemin interne interdit.');
}
function writeZip(files:Record<string,Buffer|string>):Buffer{
 const local:Buffer[]=[],centers:Buffer[]=[];
 let offset=0;
 for(const [name,content] of Object.entries(files)){
  safeName(name);
  const file=Buffer.isBuffer(content)?content:Buffer.from(content,'utf8');
  if(file.length>MAX_ENTRY)throw Error('Archive Word : partie trop volumineuse.');
  const data=deflateRawSync(file),key=Buffer.from(name);
  const crc=crc32(file);
  const head=Buffer.alloc(30);
  head.writeUInt32LE(0x04034b50,0);head.writeUInt16LE(20,4);
  head.writeUInt16LE(0x800,6);head.writeUInt16LE(8,8);
  head.writeUInt32LE(crc,14);head.writeUInt32LE(data.length,18);head.writeUInt32LE(file.length,22);
  head.writeUInt16LE(key.length,26);
  local.push(head,key,data);
  const center=Buffer.alloc(46);
  center.writeUInt32LE(0x02014b50,0);center.writeUInt16LE(20,4);
  center.writeUInt16LE(20,6);center.writeUInt16LE(0x800,8);center.writeUInt16LE(8,10);
  center.writeUInt32LE(crc,16);center.writeUInt32LE(data.length,20);
  center.writeUInt32LE(file.length,24);center.writeUInt16LE(key.length,28);
  center.writeUInt32LE(offset,42);centers.push(center,key);
  offset+=head.length+key.length+data.length;
 }
 const centerData=Buffer.concat(centers);
 const end=Buffer.alloc(22);
 end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(Object.keys(files).length,8);
 end.writeUInt16LE(Object.keys(files).length,10);
 end.writeUInt32LE(centerData.length,12);end.writeUInt32LE(offset,16);
 const data=Buffer.concat([...local,centerData,end]);
 if(data.length>MAX_FILE)throw Error('Archive Word trop volumineuse.');
 return data;
}
export function readSafeDocx(zip:Buffer):Map<string,Buffer>{
 if(!Buffer.isBuffer(zip)||zip.length>MAX_FILE||zip.length<22)throw Error('Fichier DOCX absent ou trop volumineux.');
 // EOCD is within the final 64 KiB, as mandated by ZIP.
 let end=-1;
 for(let p=zip.length-22;p>=Math.max(0,zip.length-65557);p--){
  if(zip.readUInt32LE(p)===0x06054b50&&p+22+zip.readUInt16LE(p+20)===zip.length){end=p;break;}
 }
 if(end<0)throw Error('DOCX ZIP incomplet.');
 if(zip.readUInt16LE(end+4)!==0||zip.readUInt16LE(end+6)!==0)throw Error('ZIP multi-volumes interdit.');
 const count=zip.readUInt16LE(end+10),length=zip.readUInt32LE(end+12),start=zip.readUInt32LE(end+16);
 if(count>MAX_FILES||count!==zip.readUInt16LE(end+8)||start+length!==end)
  throw Error('Structure ZIP invalide ou trop grande.');
 const files=new Map<string,Buffer>();let p=start,total=0;
 for(let i=0;i<count;i++){
  if(p+46>end||zip.readUInt32LE(p)!==0x02014b50)throw Error('Entrée ZIP invalide.');
  const flag=zip.readUInt16LE(p+8),method=zip.readUInt16LE(p+10);
  const expected=zip.readUInt32LE(p+16),compressed=zip.readUInt32LE(p+20),size=zip.readUInt32LE(p+24);
  const namelen=zip.readUInt16LE(p+28),extra=zip.readUInt16LE(p+30),comment=zip.readUInt16LE(p+32);
  const off=zip.readUInt32LE(p+42);
  if(p+46+namelen+extra+comment>end)throw Error('Nom ZIP tronqué.');
  const name=zip.subarray(p+46,p+46+namelen).toString('utf8');p+=46+namelen+extra+comment;
  safeName(name);
  if(files.has(name))throw Error('DOCX avec entrées ZIP dupliquées.');
  if((flag&1)||(flag&0x40)||!(method===0||method===8)||size>MAX_ENTRY||compressed>MAX_FILE||
     size===0xffffffff||off===0xffffffff||size>Math.max(1,compressed)*MAX_RATIO)
   throw Error('Compression DOCX non prise en charge ou potentiellement dangereuse.');
  total+=size;if(total>MAX_TOTAL)throw Error('DOCX décompressé trop volumineux.');
  if(off+30>start||zip.readUInt32LE(off)!==0x04034b50)throw Error('En-tête local ZIP invalide.');
  const locName=zip.readUInt16LE(off+26),locExtra=zip.readUInt16LE(off+28);
  const begin=off+30+locName+locExtra;
  if(begin+compressed>start)throw Error('Partie DOCX tronquée.');
  if(zip.subarray(off+30,off+30+locName).toString('utf8')!==name)
   throw Error('Chemin ZIP incohérent.');
  const raw=zip.subarray(begin,begin+compressed);
  let value:Buffer;
  try{value=method===0?Buffer.from(raw):inflateRawSync(raw,{maxOutputLength:MAX_ENTRY+1});}
  catch{throw Error('DOCX compressé illisible ou dangereux.');}
  if(value.length!==size||crc32(value)!==expected)throw Error('DOCX corrompu (taille ou CRC).');
  const lower=name.toLowerCase();
  if(/vbaproject|\.bin$|activex|embeddings\//.test(lower))
   throw Error('DOCX contenant des macros ou objets actifs interdit.');
  if(lower.endsWith('.xml')||lower.endsWith('.rels')){
   const x=value.toString('utf8');
   if(/<!DOCTYPE|<!ENTITY/i.test(x)||/TargetMode\s*=\s*["']External["']/i.test(x))
    throw Error('DOCX avec entité XML ou lien externe interdit.');
  }
  files.set(name,value);
 }
 if(p!==end)throw Error('Répertoire central ZIP non conforme.');
 return files;
}
const esc=(t:string)=>t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const unesc=(t:string)=>t.replace(/&(amp|lt|gt|quot|apos|#x[0-9a-f]+|#[0-9]+);/gi,(m,k:string)=>{
 if(k[0]==='#'){const n=k[1].toLowerCase()==='x'?parseInt(k.slice(2),16):parseInt(k.slice(1),10);return n>=32&&n<=0x10ffff?String.fromCodePoint(n):'';}
 return ({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"} as Record<string,string>)[k]??m;
});
const xml=(buffer:Buffer|undefined,part:string)=>{if(!buffer)throw Error('DOCX sans '+part);
 const s=buffer.toString('utf8');if(/<!DOCTYPE|<!ENTITY/i.test(s))throw Error('Entité XML non autorisée.');
 return s;
};
export interface ImportedWordDraft {
 manifest:WordDraftManifest;
 text:string;
 warnings:string[];
 unsupported:boolean;
}
export function makeWordDraftDocx(source:ClauseDraftSource,manifest:WordDraftManifest,title:string):Buffer{
 if(source.status!=='draft'||manifest.versionId!==source.versionId||manifest.clauseId!==source.clauseId)
  throw Error('Le manifeste ne correspond pas à un brouillon.');
 const paragraphs=source.body.replace(/\r\n?/g,'\n').split('\n');
 if(paragraphs.length>300||source.body.length>250000)throw Error('Brouillon trop volumineux.');
 const body=paragraphs.map(line=>'<w:p><w:r><w:t xml:space="preserve">'+esc(line)+'</w:t></w:r></w:p>').join('');
 const document='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
 '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+
 body+'<w:sectPr/></w:body></w:document>';
 const manifestXml='<?xml version="1.0" encoding="UTF-8"?>'+
 '<atoumwebManifest xmlns="urn:atoumweb:draft:1">'+
 Buffer.from(JSON.stringify(manifest)).toString('base64')+'</atoumwebManifest>';
 return writeZip({
  '[Content_Types].xml':'<?xml version="1.0" encoding="UTF-8"?>'+
   '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+
   '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'+
   '<Default Extension="xml" ContentType="application/xml"/>'+
   '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'+
   '</Types>',
  '_rels/.rels':'<?xml version="1.0" encoding="UTF-8"?>'+
   '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
   '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
  'word/document.xml':document,
  'word/_rels/document.xml.rels':'<?xml version="1.0" encoding="UTF-8"?>'+
   '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
   '<Relationship Id="rIdAw1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/customXml" Target="../customXml/item1.xml"/></Relationships>',
  'customXml/item1.xml':manifestXml,
  'docProps/core.xml':'<?xml version="1.0" encoding="UTF-8"?>'+
   '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties">'+
   '<dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">'+esc(title.slice(0,200))+'</dc:title></cp:coreProperties>',
 });
}
export function parseWordDraftDocx(buffer:Buffer):ImportedWordDraft{
 const files=readSafeDocx(buffer);
 const manifestSource=xml(files.get('customXml/item1.xml'),'manifest de provenance');
 const match=manifestSource.match(/<atoumwebManifest\b[^>]*>([A-Za-z0-9+/=\s]+)<\/atoumwebManifest>/);
 if(!match)throw Error('Provenance AtoumWeb absente ou supprimée par Word : réexport nécessaire.');
 let manifest:WordDraftManifest;
 try{manifest=JSON.parse(Buffer.from(match[1].replace(/\s/g,''),'base64').toString('utf8'));}
 catch{throw Error('Provenance Word illisible.');}
 if(manifest.schema!==1||manifest.sourceKind!=='contract_clause_draft'||
    manifest.textFormat!=='paragraphs-v1'||!manifest.clauseId||!manifest.versionId||
    !/^[a-f0-9]{64}$/.test(manifest.sourceSha256)||!manifest.exportId)
  throw Error('Manifeste Word non reconnu ou incomplet.');
 const d=xml(files.get('word/document.xml'),'texte word/document.xml');
 if(!/<w:document\b/.test(d)||!/<w:body\b/.test(d))throw Error('Corps Word non reconnu.');
 const unsafe=/<w:(?:tbl|drawing|object|pict|ins|del|altChunk|smartTag)\b/i.test(d);
 if(unsafe)throw Error('Word contient des tableaux, dessins ou révisions non supportés ; aucune importation possible sans conversion explicite.');
 const style=/<w:(?:b|i|u|numPr|pStyle|hyperlink|fldChar|instrText)\b/.test(d);
 const sections=[...d.matchAll(/<w:p(?:\s[^>]*)?>([\s\S]*?)<\/w:p>/g)].map(x=>x[1]);
 if(sections.length>300)throw Error('DOCX : trop de paragraphes.');
 const lines=sections.map(fragment=>{
  let out='';
  const parts=/<w:t\b[^>]*>[\s\S]*?<\/w:t>|<w:br\s*\/>|<w:tab\s*\/>/g;
  for(const part of fragment.match(parts)??[]){
   if(part.startsWith('<w:br'))out+='\n';
   else if(part.startsWith('<w:tab'))out+='\t';
   else out+=unesc(part.replace(/^<w:t\b[^>]*>/,'').replace(/<\/w:t>$/,''));
  }
  return out;
 });
 const warnings=['DOCX éditable : seuls les paragraphes et caractères Word simples sont comparés.',
 'Styles, listes numérotées et mise en page non réimportés dans la clause.'];
 if(style)warnings.push('Styles ou fonctions Word détectés : leur mise en forme ne sera pas conservée.');
 if(lines.length===0)throw Error('DOCX sans paragraphes éditables.');
 if(lines.join('\n').length>250000)throw Error('Texte Word importé trop volumineux.');
 return {manifest,text:lines.join('\n'),warnings,unsupported:style};
}
