import {describe,it,expect} from 'vitest';
import {adaptiveTableWidths} from './adaptiveTableWidths';
describe('adaptive defaults without rewriting user preferences',()=>{
 it('fits available width when all minimums fit',()=>{const w=adaptiveTableWidths(['identity','contact','status','open'],900,{});expect(Object.values(w).reduce((s,n)=>s+n,0)).toBeCloseTo(900);expect(w.open).toBe(88);expect(w.identity).toBeGreaterThan(w.status);});
 it('preserves exact explicit widths and keeps a necessary overflow',()=>{const saved={identity:500,open:140},w=adaptiveTableWidths(['identity','status','open'],400,saved);expect(w).toEqual({identity:500,status:110,open:140});expect(saved).toEqual({identity:500,open:140});});
 it('has finite safe widths even before layout or with no columns',()=>{expect(adaptiveTableWidths([],0,{})).toEqual({});expect(adaptiveTableWidths(['identity','open'],0,{})).toEqual({identity:180,open:88});});
});
