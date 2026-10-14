import { describe, expect, it } from 'vitest';
import { filterContractClauses, matchingContractClauses, newModuleDraftChanged, typeDraftChanged } from './contractLibraryDrafts';

const saved={name:'Maintenance WordPress',description:'Contrat courant',moduleIds:['a','b']};

describe('05B — protections de brouillons de bibliothèque',()=>{
  it('le formulaire fidèle à la version chargée reste propre',()=>expect(typeDraftChanged({...saved},saved)).toBe(false));
  it('un ordre de modules changé est une modification, pas une simple préférence',()=>expect(typeDraftChanged({...saved,moduleIds:['b','a']},saved)).toBe(true));
  it('un nom, une description ou un module retiré exige une garde',()=>{
    expect(typeDraftChanged({...saved,name:'Autre nom'},saved)).toBe(true);
    expect(typeDraftChanged({...saved,description:'Autre texte'},saved)).toBe(true);
    expect(typeDraftChanged({...saved,moduleIds:['a']},saved)).toBe(true);
  });
  it('le nouveau module vide est propre, un simple espace reste un brouillon à protéger',()=>{
    const blank={newCode:'',newTitle:'',newBody:'',newScope:'catalog' as const,newAudience:'all' as const};
    expect(newModuleDraftChanged(blank)).toBe(false);
    expect(newModuleDraftChanged({...blank,newBody:' '})).toBe(true);
    expect(newModuleDraftChanged({...blank,newCode:'AW-CGV-1'})).toBe(true);
    expect(newModuleDraftChanged({...blank,newAudience:'consumer'})).toBe(true);
  });
});

describe('05B.2 — navigation lecture seule des clauses',()=>{
  const clauses=[
    {id:'b',title:'Rétractation et information précontractuelle',code:'CGV-CONS',scope:'base' as const,audience:'consumer'},
    {id:'a',title:'Maintenance WordPress',code:'AW-MAINT',scope:'catalog' as const,audience:'professional'}
  ];
  it('sans recherche, conserve les références et leur ordre',()=>expect(matchingContractClauses(clauses,'').map(c=>c.id)).toEqual(['b','a']));
  it('recherche insensible aux accents et à la casse',()=>{
    expect(matchingContractClauses(clauses,'RETRACTATION').map(c=>c.id)).toEqual(['b']);
    expect(matchingContractClauses(clauses,'wordpress').map(c=>c.id)).toEqual(['a']);
  });
  it('retrouve une clause par code et catégorie sans mutation',()=>{
    const original=JSON.stringify(clauses);
    expect(matchingContractClauses(clauses,'CGV-CONS').map(c=>c.id)).toEqual(['b']);
    expect(matchingContractClauses(clauses,'spécifiques').map(c=>c.id)).toEqual(['a']);
    expect(JSON.stringify(clauses)).toBe(original);
  });
});

describe('05C — filtres de consultation des clauses',()=>{
  const clauses=[
    {id:'a',scope:'base' as const,audience:'all',status:'active'},
    {id:'b',scope:'catalog' as const,audience:'professional',status:'active'},
    {id:'c',scope:'catalog' as const,audience:'consumer',status:'archived'},
  ];
  it('conserve références, ordre et données sans mutation',()=>{
    const snapshot=JSON.stringify(clauses);
    expect(filterContractClauses(clauses,{scope:'all',audience:'all'}).map(c=>c.id)).toEqual(['a','b']);
    expect(JSON.stringify(clauses)).toBe(snapshot);
  });
  it('inclut les clauses tous publics pour chaque audience',()=>{
    expect(filterContractClauses(clauses,{audience:'professional'}).map(c=>c.id)).toEqual(['a','b']);
    expect(filterContractClauses(clauses,{audience:'consumer',includeArchived:true}).map(c=>c.id)).toEqual(['a','c']);
  });
  it('combine famille, public et archivage sans modifier le stockage',()=>{
    expect(filterContractClauses(clauses,{scope:'catalog',audience:'consumer'})).toEqual([]);
    expect(filterContractClauses(clauses,{scope:'catalog',audience:'consumer',includeArchived:true}).map(c=>c.id)).toEqual(['c']);
  });
});
