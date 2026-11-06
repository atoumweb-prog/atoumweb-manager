import {expect,it} from 'vitest';
import {INTERVENTION_STATUSES,HOUR_PACK_STATUSES} from '../../shared/operations';
import {clientOperationCounts} from './ClientOperationsTab';

it('distinguishes actual operational states from open records and excludes unusable packs',()=>{
  const interventions=INTERVENTION_STATUSES.map(status=>({status}));
  const packs=HOUR_PACK_STATUSES.map(status=>({status}));
  expect(clientOperationCounts(interventions,packs)).toEqual({inProgress:1,toPlan:1,completed:1,activePacks:1});
});
it('does not promote archived records to active; empty sources have zero counts',()=>{
  expect(clientOperationCounts([{status:'in_progress',archivedAt:'2026-11-01'},{status:'to_plan',archivedAt:'2026-11-01'}],[{status:'active',archivedAt:'2026-11-01'}])).toEqual({inProgress:0,toPlan:0,completed:0,activePacks:0});
  expect(clientOperationCounts([],[])).toEqual({inProgress:0,toPlan:0,completed:0,activePacks:0});
});
