import {describe,expect,it} from 'vitest';
import {isCurrentContractRequest} from './contractRequestGuard';
describe('05D request isolation',()=>{
  it('accepts the latest result for the selected quote',()=>expect(isCurrentContractRequest('A','A',3,3)).toBe(true));
  it('rejects a late A response once B is selected',()=>expect(isCurrentContractRequest('A','B',3,3)).toBe(false));
  it('rejects an older request from the same quote',()=>expect(isCurrentContractRequest('A','A',2,3)).toBe(false));
  it('rejects a failed load from a quote that is no longer selected',()=>{
    const error=new Error('Delayed loading failure');
    expect(isCurrentContractRequest('A','B',1,1)).toBe(false);
    expect(error.message).toBe('Delayed loading failure');
  });
  it('rejects the result after a request is invalidated by cleanup',()=>expect(isCurrentContractRequest('A','A',4,5)).toBe(false));
});
