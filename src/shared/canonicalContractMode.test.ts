import {describe,it,expect} from 'vitest';
import {decideCanonicalContractMode} from './canonicalContractMode';
describe('05C contract compilation mode',()=>{
 it('retains legacy compilation for historical incomplete review',()=>expect(decideCanonicalContractMode({explicitOptIn:false,hasApprovedClassification:true,assemblyReady:false})).toBe('legacy'));
 it('requires complete human-reviewed classification when explicit mode is requested',()=>expect(decideCanonicalContractMode({explicitOptIn:true,hasApprovedClassification:true,assemblyReady:false})).toBe('requires_review'));
 it('requires actual approval rather than an empty draft',()=>expect(decideCanonicalContractMode({explicitOptIn:true,hasApprovedClassification:false,assemblyReady:true})).toBe('requires_review'));
 it('selects canonical rendering only for a complete reviewed contract',()=>expect(decideCanonicalContractMode({explicitOptIn:true,hasApprovedClassification:true,assemblyReady:true})).toBe('canonical'));
});
