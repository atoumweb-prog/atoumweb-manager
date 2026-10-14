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
  it('conserve les deux brouillons lors d’une réponse distante tardive',()=>{
    const local={a:{title:'Clause A',body:'Édition récente A'},b:{title:'Clause B',body:'Édition récente B'}};
    const response=[{...previous[0],body:'Ancienne réponse A'},{...previous[1],body:'Ancienne réponse B'}];
    const merged=mergeContractClauseDrafts(previous,local,response);
    expect(merged.a.body).toBe('Édition récente A');
    expect(merged.b.body).toBe('Édition récente B');
  });
  it('une réponse à la sauvegarde ne doit pas effacer la saisie effectuée après envoi',()=>{
    const submitted={title:'Clause A',body:'Version envoyée'};
    const local={a:{title:'Clause A',body:'Correction après envoi'},b:{title:'Clause B',body:'B local'}};
    const response=[{...previous[0],body:'Version envoyée'},previous[1]];
    const merged=mergeContractClauseDrafts(previous,local,response,{id:'a',draft:submitted});
    expect(merged.a.body).toBe('Correction après envoi');
    expect(merged.b.body).toBe('B local');
  });
  it('ne mélange pas les brouillons de deux devis lorsque la liste locale est réinitialisée',()=>{
    const quoteA={a:{title:'Clause A',body:'Brouillon propre au devis A'}};
    const quoteB=[{id:'a',title:'Clause A',body:'Texte du devis B'}];
    const result=mergeContractClauseDrafts([],{},quoteB);
    expect(result.a.body).toBe('Texte du devis B');
    expect(result.a.body).not.toBe(quoteA.a.body);
  });
  it('ne modifie ni les entrées distantes ni les brouillons locaux',()=>{
    const local={a:{title:'Clause A',body:'Local A'},b:{title:'Clause B',body:'Local B'}};
    const snapshot=JSON.stringify({previous,local});
    const result=mergeContractClauseDrafts(previous,local,previous);
    result.a.body='Changement uniquement dans le résultat';
    expect(JSON.stringify({previous,local})).toBe(snapshot);
  });
  it('retire les clauses absentes du résultat canonique sans les recréer',()=>{
    expect(Object.keys(mergeContractClauseDrafts(previous,{a:{title:'X',body:'Y'}},[previous[1]]))).toEqual(['b']);
  });
});
