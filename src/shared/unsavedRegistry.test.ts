import {describe,it,expect} from 'vitest';
import {UnsavedRegistry,type UnsavedEntry} from './unsavedRegistry';
const entry=(id:string,group='q',dirty=true,pending=false,discard=()=>{}):UnsavedEntry=>({id,group,label:id,dirty,pending,discard});
describe('protection des sorties par scope',()=>{
 it('navigation libre sans saisie',()=>{const r=new UnsavedRegistry();let calls=0;r.request(()=>calls++,()=>{throw Error('unexpected')});expect(calls).toBe(1);});
 it('Rester garde toutes les entrées et ne déclenche aucun abandon',()=>{const r=new UnsavedRegistry();let calls=0;r.update(entry('a','q',true,false,()=>calls++));expect(r.request(()=>calls++,()=>false)).toBe(false);expect(calls).toBe(0);expect(r.active()).toHaveLength(1);});
 it('abandon limité à la section quittée, autres brouillons préservés',()=>{const r=new UnsavedRegistry();let discarded:string[]=[];r.update(entry('a','q/a',true,false,()=>discarded.push('a')));r.update(entry('b','q/b',true,false,()=>discarded.push('b')));r.request(()=>{},()=>true,'q/a');expect(discarded).toEqual(['a']);expect(r.active().map(e=>e.id)).toEqual(['b']);});
 it('un seul dialogue pour plusieurs sous-sections',()=>{const r=new UnsavedRegistry();let calls=0;r.update(entry('a','q/a'));r.update(entry('b','q/b'));r.request(()=>{},labels=>{calls++;expect(labels).toEqual(['a','b']);return true;},'q');expect(calls).toBe(1);expect(r.active()).toHaveLength(0);});
 it('ne considère pas un save en cours comme enregistré même si le dialogue accepte',()=>{const r=new UnsavedRegistry();let exited=false,discarded=false;r.update(entry('a','q',false,true,()=>{discarded=true}));expect(r.request(()=>{exited=true},(_,pending)=>{expect(pending).toBe(true);return true})).toBe(false);expect(exited||discarded).toBe(false);});
 it('un save échoué reste modifié, un save confirmé libère la sortie',()=>{const r=new UnsavedRegistry();r.update(entry('a'));expect(r.active()).toHaveLength(1);r.update(entry('a','q',false,false));expect(r.request(()=>{},()=>{throw Error('unexpected')})).toBe(true);});
 it('la sélection par ID ne nettoie pas tout le groupe',()=>{const r=new UnsavedRegistry();r.update(entry('a'));r.update(entry('b'));r.request(()=>{},()=>true,['a']);expect(r.active().map(e=>e.id)).toEqual(['b']);});
 it('n’ouvre pas un second dialogue réentrant',()=>{const r=new UnsavedRegistry();r.update(entry('a'));let calls=0;r.request(()=>{},()=>{calls++;expect(r.request(()=>{},()=>{calls++;return true})).toBe(false);return false});expect(calls).toBe(1);});
 it('les scopes démontés sont retirés',()=>{const r=new UnsavedRegistry();r.update(entry('a'));r.remove('a');expect(r.active()).toEqual([]);});
 it('l’archivage cible les sous-groupes de la fiche sans toucher un autre prospect',()=>{const r=new UnsavedRegistry();r.update(entry('qualification','prospect:one/desk'));r.update(entry('identity','prospect:one/panel'));r.update(entry('other','prospect:two/desk'));expect(r.request(()=>{throw Error('mutation interdite')},()=>false,'prospect:one')).toBe(false);r.request(()=>{},()=>true,'prospect:one');expect(r.active().map(e=>e.id)).toEqual(['other']);});
});

describe('07A composition : brouillons et commande de Page indépendants',()=>{
 it('une commande pending bloque toute sortie et tout abandon malgré confirmation',()=>{
  const r=new UnsavedRegistry();let mutations=0,discarded=0,confirmations=0;
  r.update(entry('html-css-js-note','project-composition',true,false,()=>discarded++));
  r.update(entry('page-operation','project-composition',false,true));
  expect(r.request(()=>mutations++,(_,pending)=>{confirmations++;expect(pending).toBe(true);return true;},'project-composition')).toBe(false);
  expect([mutations,discarded,confirmations]).toEqual([0,0,1]);
  r.update(entry('page-operation','project-composition',false,false));
  expect(r.request(()=>mutations++,()=>true,'project-composition')).toBe(true);
  expect([mutations,discarded]).toEqual([1,1]);
 });
 it('fermer la création sur Rester conserve aussi les réglages montés',()=>{
  const r=new UnsavedRegistry();let changes=0;
  r.update(entry('settings','project-composition',true,false,()=>changes++));
  r.update(entry('create','project-composition',true,false,()=>changes++));
  expect(r.request(()=>changes++,()=>false,['create'])).toBe(false);
  expect(changes).toBe(0);expect(r.active().map(e=>e.id)).toEqual(['settings','create']);
  expect(r.request(()=>changes++,()=>true,['create'])).toBe(true);
  expect(changes).toBe(2);expect(r.active().map(e=>e.id)).toEqual(['settings']);
 });
});
