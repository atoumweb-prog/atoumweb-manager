import {describe,expect,it} from 'vitest';
import {assessContractEvidence,type ContractDocumentEvidence} from './contractDocumentEvidence';
const evidence=(overrides:Partial<ContractDocumentEvidence>={}):ContractDocumentEvidence=>({
  kind:'abby_accepted_pdf',fileId:'file-1',sha256:'a'.repeat(64),
  abbyReference:'ABBY-1',acceptedAt:'2026-10-14T12:00:00Z',...overrides,
});
describe('05E — contract document provenance is not acceptance',()=>{
  it('never upgrades a working DOCX, imported DOCX or PDF to accepted evidence',()=>{
    for(const kind of ['working_docx','imported_docx','working_pdf'] as const){
      expect(assessContractEvidence(evidence({kind}))).toBe('working_copy');
    }
  });
  it('rejects missing or malformed proof identifiers',()=>{
    for(const item of [
      evidence({sha256:null}),evidence({sha256:'bad'}),evidence({fileId:' '}),
      evidence({abbyReference:null}),evidence({acceptedAt:'not a date'}),
    ])expect(assessContractEvidence(item)).toBe('acceptance_unverified');
  });
  it('rejects ambiguous dates without timezone and impossible timestamps',()=>{
    expect(assessContractEvidence(evidence({acceptedAt:'2026-10-14'}))).toBe('acceptance_unverified');
    expect(assessContractEvidence(evidence({acceptedAt:'2026-10-14T12:00:00'}))).toBe('acceptance_unverified');
    expect(assessContractEvidence(evidence({acceptedAt:'invalid'}))).toBe('acceptance_unverified');
  });
  it('recognizes a complete evidence record without mutating it',()=>{
    const record=evidence();const snapshot=JSON.stringify(record);
    expect(assessContractEvidence(record)).toBe('evidence_metadata_complete');
    expect(JSON.stringify(record)).toBe(snapshot);
  });
});
