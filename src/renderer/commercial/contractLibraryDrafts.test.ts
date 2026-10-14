import { describe, expect, it } from 'vitest';
import { newModuleDraftChanged, typeDraftChanged } from './contractLibraryDrafts';

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
