import {describe,expect,it} from 'vitest';
import {buildWordDraftWorkingPdfHtml} from './wordDraftPdf';
import type {ClauseDraftSource} from './wordDraftReview';
const source:ClauseDraftSource={
 kind:'contract_clause',clauseId:'test',versionId:'draft',status:'draft',
 body:'Conditions électricité & test\n<script>alert("danger")</script>',
};
describe('09E — PDF de consultation NON OFFICIEL',()=>{
 it('imprime un brouillon avec bannière non signé/non facture et échappe le texte',()=>{
  const html=buildWordDraftWorkingPdfHtml(source,'À vérifier <test>');
  expect(html).toContain('NON SIGNÉ, NON PUBLIÉ, NON FACTURE ABBY');
  expect(html).toContain('Conditions électricité &amp; test');
  expect(html).toContain('&lt;script&gt;alert');
  expect(html).not.toContain('<script>alert');
  expect(html).not.toContain('<test>');
 });
 it.each(['published','retired','frozen','historical_missing'] as const)(
  'interdit une copie PDF de travail depuis une version %s',status=>{
   expect(()=>buildWordDraftWorkingPdfHtml({...source,status},'Publié')).toThrow(/réservé aux brouillons/);
  },
 );
});
