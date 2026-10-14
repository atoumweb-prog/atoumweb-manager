import { describe,expect,it } from 'vitest';
import { mergeContractClauseDrafts } from './contractClauseDraftMerge';

const previous=[
  {id:'a',title:'Clause A',body:'A initial'},
  {id:'b',title:'Clause B',body:'B initial'},
];
describe('05D.4 — brouillons indépendants lors de la synchronisation',()=>{
  it('conserve deux modifications simultanées après synchronisation inchangée',()=>{
    const local={a:{title:'Clause A',body:'A local'},b:{title:'B local',body:'B initial'}};
    const result=mergeContractClauseDrafts(previous,local,previous);
    expect(result).toEqual(local);
    expect(previous[0].body).toBe('A initial');
  });
  it('enregistre une clause sans perdre les modifications de la seconde',()=>{
    const local={a:{title:'Clause A',body:'A local'},b:{title:'Clause B',body:'B local'}};
    const updated=[{...previous[0],body:'A local'},previous[1]];
    const result=mergeContractClauseDrafts(previous,local,updated,{id:'a',draft:local.a});
    expect(result.a.body).toBe('A local');
    expect(result.b.body).toBe('B local');
  });
  it('intègre la mise à jour distante d’un champ indépendant',()=>{
    const local={a:{title:'Clause A',body:'A local'}};
    const updated=[{...previous[0],title:'Titre distant'}];
    expect(mergeContractClauseDrafts(previous,local,updated).a).toEqual({title:'Titre distant',body:'A local'});
  });
  it('retire les clauses absentes du résultat canonique sans les recréer',()=>{
    expect(Object.keys(mergeContractClauseDrafts(previous,{a:{title:'X',body:'Y'}},[previous[1]]))).toEqual(['b']);
  });
});
