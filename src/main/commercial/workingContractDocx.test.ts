import {describe,it,expect} from 'vitest';
import {createWorkingContractDocx} from './workingContractDocx';
describe('05E DOCX working export',()=>{
 it('creates a ZIP-based Word document with the required Office package parts',()=>{
   const file=createWorkingContractDocx('Contrat & CGV\nMontant < 100 €');
   expect(file.readUInt32LE(0)).toBe(0x04034b50);
   expect(file.includes(Buffer.from('word/document.xml'))).toBe(true);
   expect(file.includes(Buffer.from('Montant &lt; 100 €'))).toBe(true);
   expect(file.includes(Buffer.from('Contrat &amp; CGV'))).toBe(true);
   expect(file.readUInt32LE(file.length-22)).toBe(0x06054b50);
 });
 it('rejects empty and oversized documents',()=>{
   expect(()=>createWorkingContractDocx(' ')).toThrow();
   expect(()=>createWorkingContractDocx('a'.repeat(1000001))).toThrow();
 });
});
