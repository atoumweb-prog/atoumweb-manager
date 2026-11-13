import {describe,it,expect} from 'vitest';
import {adaptiveTableWidths} from './adaptiveTableWidths';
describe('adaptive defaults without rewriting user preferences',()=>{
 it('fits available width when all minimums fit',()=>{const w=adaptiveTableWidths(['identity','contact','status','open'],900,{});expect(Object.values(w).reduce((s,n)=>s+n,0)).toBeCloseTo(900);expect(w.open).toBe(88);expect(w.identity).toBeGreaterThan(w.status);});
 it('preserves exact explicit widths and keeps a necessary overflow',()=>{const saved={identity:500,open:140},w=adaptiveTableWidths(['identity','status','open'],400,saved);expect(w).toEqual({identity:500,status:110,open:140});expect(saved).toEqual({identity:500,open:140});});
 it('R2 : honours per-column minimums (header words) and still fills the available width when they fit',()=>{
  const ids=['num','dest','objet','statut','decision','open'],minimums={num:106,dest:148,objet:88,statut:94,decision:112,open:94};
  const w=adaptiveTableWidths(ids,1100,{},minimums);
  for(const id of ids)expect(w[id]).toBeGreaterThanOrEqual(minimums[id as keyof typeof minimums]);
  expect(Object.values(w).reduce((s,n)=>s+n,0)).toBeCloseTo(1100);
 });
 it('R2 : keeps a necessary overflow when the minimums do not fit, and ignores minimums for explicit widths',()=>{
  const w=adaptiveTableWidths(['a','b','open'],300,{b:50},{a:200,b:400,open:94});
  expect(w).toEqual({a:200,b:50,open:94});
 });
 it('has finite safe widths even before layout or with no columns',()=>{expect(adaptiveTableWidths([],0,{})).toEqual({});expect(adaptiveTableWidths(['identity','open'],0,{})).toEqual({identity:180,open:88});});
});
