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
  it('suppresses a delayed success after switching A to B',async()=>{
    let release!: (value:string)=>void;
    const pending=new Promise<string>(resolve=>{release=resolve;});
    let active='A',latest=1,visible='unchanged';
    const task=pending.then(value=>{
      if(isCurrentContractRequest('A',active,1,latest))visible=value;
    });
    active='B';latest=2;release('A old preview');
    await task;expect(visible).toBe('unchanged');
  });
  it('suppresses a delayed rejection without overriding the new quote error state',async()=>{
    let reject!: (reason:Error)=>void;
    const pending=new Promise<void>((_,fail)=>{reject=fail;});
    let active='A',latest=1,error='B current error';
    const task=pending.catch(reason=>{
      if(isCurrentContractRequest('A',active,1,latest))error=reason.message;
    });
    active='B';latest=2;reject(new Error('A late failure'));
    await task;expect(error).toBe('B current error');
  });
  it('prevents an old library refresh from replacing the new quote library',async()=>{
    let release!: (items:string[])=>void;
    const oldLibrary=new Promise<string[]>(resolve=>{release=resolve;});
    let active='A',sequence=1,visible=['B fresh'];
    const delayed=oldLibrary.then(items=>{
      if(isCurrentContractRequest('A',active,1,sequence))visible=items;
    });
    active='B';sequence+=1;release(['A obsolete']);await delayed;
    expect(visible).toEqual(['B fresh']);
  });
  it('rejects older overlapping refreshes even while quote id remains constant',async()=>{
    let release!: (items:string[])=>void;
    const oldLibrary=new Promise<string[]>(resolve=>{release=resolve;});
    let sequence=1,visible=['newer'];
    const delayed=oldLibrary.then(items=>{
      if(isCurrentContractRequest('A','A',1,sequence))visible=items;
    });
    sequence=2;release(['older']);await delayed;
    expect(visible).toEqual(['newer']);
  });
  it('rejects the result after a request is invalidated by cleanup',()=>expect(isCurrentContractRequest('A','A',4,5)).toBe(false));
});
