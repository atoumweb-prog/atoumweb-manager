import { describe, expect, it } from 'vitest';
import seed from '../../../data/catalogue/atoumweb-catalogue-v1.json';

const normalize=(text:string)=>text.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toLocaleLowerCase('fr-FR').replace(/\s+/g,' ');

/** 04A — a reference-fixture audit, not a check of a live customer database. */
describe('04A — integrity of the bundled Catalogue V1 reference',()=>{
  it('keeps stable identities and required business data without collisions',()=>{
    const records=seed.records;
    expect(records.length).toBeGreaterThan(0);
    const codes=records.map(record=>normalize(record.canonicalCode));
    expect(new Set(codes).size).toBe(records.length);
    expect(records.every(record=>record.name.trim()&&record.category.trim()
      &&(record.type==='offer'||record.type==='service'))).toBe(true);
  });
  it('has no category label collision after French normalization',()=>{
    const distinct=[...new Set(seed.records.map(record=>record.category))];
    expect(new Set(distinct.map(normalize)).size).toBe(distinct.length);
    expect(seed.records.some(record=>record.type==='offer')).toBe(true);
    expect(seed.records.some(record=>record.type==='service')).toBe(true);
  });
  it('does not confuse reference identity with commercial version or customer data',()=>{
    expect(seed.source.reference).toMatch(/Catalogue/i);
    expect(seed.source.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(seed.records.every(record=>Boolean(record.version))).toBe(true);
  });
});
