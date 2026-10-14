import { describe, expect, it } from 'vitest';
import { makeWordDraftDocx, parseWordDraftDocx, readSafeDocx } from './wordDocxCodec';
import { compareWordDraftText, prepareWordDraftManifest, type ClauseDraftSource } from './wordDraftReview';
const source:ClauseDraftSource={
 kind:'contract_clause',clauseId:'c09e',versionId:'v09e',status:'draft',
 body:'CGV & conditions\nObjet <spécial> "école" — été\nLigne finale',
};
function exported(){
 const manifest=prepareWordDraftManifest(source);
 return {manifest,docx:makeWordDraftDocx(source,manifest,'AtoumWeb — CGV test')};
}
describe('09E — vrai DOCX OpenXML hors réseau',()=>{
 it('ouvre un DOCX produit en ZIP Office, retrouve la provenance et les paragraphes français',()=>{
  const {manifest,docx}=exported();
  expect(docx.subarray(0,2).toString()).toBe('PK');
  const files=readSafeDocx(docx);
  expect(files.has('[Content_Types].xml')).toBe(true);
  expect(files.has('word/document.xml')).toBe(true);
  const imported=parseWordDraftDocx(docx);
  expect(imported.manifest).toEqual(manifest);
  expect(imported.text).toBe(source.body);
  expect(compareWordDraftText(imported.manifest,source,imported.text).changed).toBe(false);
 });
 it('refuse ZIP tronqué et fichier non ZIP sans modifier la source',()=>{
  const {docx}=exported();
  for(const data of [Buffer.alloc(10),docx.subarray(0,docx.length-10)]){
   expect(()=>parseWordDraftDocx(data)).toThrow();
  }
  expect(source.body).toContain('Objet <spécial>');
 });
 it('refuse une empreinte CRC falsifiée et des limites de taille',()=>{
  const {docx}=exported();
  const damaged=Buffer.from(docx);
  const p=damaged.indexOf(Buffer.from('word/document.xml'));
  // Local file payload starts immediately after its variable-length header.
  expect(p).toBeGreaterThan(0);
  const start=p+'word/document.xml'.length;
  damaged[start+5]^=1;
  expect(()=>readSafeDocx(damaged)).toThrow(/corrompu|compressé|invalide/i);
  expect(()=>readSafeDocx(Buffer.alloc(6*1024*1024+1))).toThrow(/volumineux/);
 });
 it('détecte un conflit si le texte source a changé après export',()=>{
  const {docx}=exported();
  const imported=parseWordDraftDocx(docx);
  expect(()=>compareWordDraftText(imported.manifest,{...source,body:source.body+' modifié'},imported.text))
   .toThrow(/Conflit de version/);
 });
 it('rejette les versions publiées et les autres sources non éditables',()=>{
  const m=prepareWordDraftManifest(source);
  expect(()=>makeWordDraftDocx({...source,status:'published'},m,'Publié')).toThrow(/brouillon/);
 });
 it('déclare les limites de fidélité au retour depuis Word',()=>{
  const {docx}=exported();
  const result=parseWordDraftDocx(docx);
  expect(result.warnings.join(' ')).toContain('listes numérotées');
  expect(result.unsupported).toBe(false);
 });
});