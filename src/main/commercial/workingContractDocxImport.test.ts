import {describe,it,expect} from 'vitest';
import {createWorkingContractDocx} from './workingContractDocx';
import {extractWorkingDocxText} from './workingContractDocxImport';
describe('05E safe DOCX text import',()=>{
 it('roundtrips a generated DOCX without treating it as an accepted document',()=>{
   const input='CGV & contrat\nClause <importante>\nLigne 3';
   expect(extractWorkingDocxText(createWorkingContractDocx(input))).toBe(input);
 });
 it('rejects malformed archives, blank files and missing Word parts',()=>{
   expect(()=>extractWorkingDocxText(Buffer.from('not a DOCX'))).toThrow();
   expect(()=>extractWorkingDocxText(Buffer.alloc(6_000_000))).toThrow();
 });
});
