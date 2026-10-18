import {describe,expect,it} from 'vitest';
import {validateEc04MigrationLedger} from './WorkspacePortableArchive';

describe('EC04 migration ledger validator: real IDs, not array indices',()=>{
  it('accepts gaps while preserving exact identifiers and names',()=>{
    expect(validateEc04MigrationLedger([{id:1,name:'base'},{id:3,name:'module'},{id:71,name:'transmission'}]))
      .toEqual([{id:1,name:'base'},{id:3,name:'module'},{id:71,name:'transmission'}]);
  });
  it('refuses duplicate IDs, duplicate names, reverse order and zero/negative IDs',()=>{
    for(const bad of [
      [{id:1,name:'base'},{id:1,name:'again'}],
      [{id:1,name:'base'},{id:2,name:'base'}],
      [{id:3,name:'module'},{id:1,name:'base'}],
      [{id:0,name:'base'}],[{id:-2,name:'base'}],
      [{id:1.5,name:'base'}],[{id:1,name:'  '}],
    ])expect(()=>validateEc04MigrationLedger(bad)).toThrow(/migration invalide/);
  });
  it('refuses empty or oversized lists',()=>{
    expect(()=>validateEc04MigrationLedger([])).toThrow();
    expect(()=>validateEc04MigrationLedger(Array(1001).fill({id:1,name:'x'}))).toThrow();
  });
});
