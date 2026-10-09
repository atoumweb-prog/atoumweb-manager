import {describe,it,expect} from 'vitest';
import {DraftSection,mergeDraft} from './draftSection';
describe('brouillons indépendants de sections',()=>{
  it.each(['parameters','administration'] as const)('enregistrer %s conserve le brouillon voisin',saved=>{
    const p=new DraftSection({context:''}),a=new DraftSection({identity:{value:'',state:'missing'}});p.receive({context:''});a.receive({identity:{value:'',state:'missing'}});
    p.set({context:'local context'});a.set({identity:{value:'local identity',state:'missing'}});
    if(saved==='parameters'){p.receive({context:'local context'},{value:p.snapshot().value});a.receive({identity:{value:'',state:'missing'}});expect(a.snapshot().value.identity.value).toBe('local identity');expect(a.dirty).toBe(true);expect(p.dirty).toBe(false);}
    else {a.receive(a.snapshot().value,{value:a.snapshot().value});p.receive({context:''});expect(p.snapshot().value.context).toBe('local context');expect(p.dirty).toBe(true);expect(a.dirty).toBe(false);}
  });
  it('fusionne un refresh de champ intact sans écraser un champ édité',()=>{expect(mergeDraft({a:'old',b:'old'},{a:'mine',b:'old'},{a:'old',b:'new'})).toEqual({value:{a:'mine',b:'new'},conflicts:[]});});
  it('signale le conflit de même champ et conserve la saisie',()=>{expect(mergeDraft({a:'old'},{a:'mine'},{a:'theirs'})).toEqual({value:{a:'mine'},conflicts:['a']});});
  it('traite une liste modifiée comme un ensemble indivisible',()=>{expect(mergeDraft({rows:['a']},{rows:['a','b']},{rows:['a','c']}).conflicts).toEqual(['rows']);});
  it('conserve une saisie faite pendant la confirmation d’un save',()=>{const s=new DraftSection({a:''});s.receive({a:''});s.set({a:'submitted'});const sent=s.snapshot().value;s.set({a:'later'});s.receive({a:'submitted'},{value:sent});expect(s.snapshot().value.a).toBe('later');expect(s.dirty).toBe(true);});
  it('accepte la normalisation serveur des seuls champs soumis inchangés',()=>{const s=new DraftSection({a:''});s.receive({a:''});s.set({a:' value '});s.receive({a:'value'},{value:{a:' value '}});expect(s.dirty).toBe(false);});
  it('abandonne uniquement la section choisie',()=>{const a=new DraftSection({v:0}),b=new DraftSection({v:0});a.receive({v:0});b.receive({v:0});a.set({v:1});b.set({v:2});a.discard();expect(a.dirty).toBe(false);expect(b.dirty).toBe(true);});
});
