import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {describe,it,expect} from 'vitest';
import {APPROVED_PACK,approvedCatalogSource} from './ApprovedPackSource';
describe('Intégrité du pack documentaire approuvé',()=>{
 it('pins the original Word files and every retained machine extraction',()=>{const folder='data/approved/2026-11-08/',manifest=JSON.parse(readFileSync(folder+'MANIFESTE-SOURCES.json','utf8'));for(const [file,hash] of Object.entries(manifest))expect(createHash('sha256').update(readFileSync(folder+file)).digest('hex'),file).toBe(hash);});
 it('preserves all 130 displayed prices and every converted numeric amount, with actual-cost registrar kept explicit',()=>{
  for(const record of approvedCatalogSource().records){const source=APPROVED_PACK.catalogue.references.find(r=>r.code_source===record.canonicalCode)!;
   expect(record.version.commercialParameters?.sourcePriceLabel).toBe(source.prix_affiche);
   const words=source.prix_affiche.split('€')[0],matches=words.match(/\d[\d\s\u00a0\u202f]*(?:,\d{1,2})?$/);
   if(source.prix_affiche.includes('€'))expect(record.version.priceCents,source.code_source).toBe(Math.round(Number(matches![0].replace(/\s/g,'').replace(',','.'))*100));
   else expect(record.version.priceCents).toBeNull();
  }
  expect(approvedCatalogSource().records.find(r=>r.canonicalCode==='V39-HOST-DOMAINE')!.version.commercialParameters?.sourcePriceLabel).toContain('registrar');
 });
 it('keeps all 119 codes in source order and the liability/mediation/maintenance/Lune/consent texts intact',()=>{expect(APPROVED_PACK.library.clauses.map(c=>c.numero)).toEqual(Array.from({length:119},(_,i)=>i+1));expect(new Set(APPROVED_PACK.library.clauses.map(c=>c.code_contractuel)).size).toBe(119);for(const n of [19,22,33,69,102,119])expect(APPROVED_PACK.library.clauses[n-1].paragraphes_contractuels.length).toBeGreaterThan(0);});
});
