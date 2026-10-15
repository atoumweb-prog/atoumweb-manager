import {createRequire} from 'node:module';
import {describe,it,expect} from 'vitest';

const parse=createRequire(process.cwd()+'/package.json')('./scripts/fixtures/native-recipe-args.cjs');

describe('combined native recipe modes C01 / 08A',()=>{
  for(const [args,mode] of [
    [[],{searchOnly:false,lot03b:false,lot09b:false,lot09c:false,lot09d:false,lot09e:false,lot08a:false,captureFolder:null}],
    [['--search-only'],{searchOnly:true,lot03b:false,lot09b:false,lot09c:false,lot09d:false,lot09e:false,lot08a:false,captureFolder:null}],
    [['--lot03b'],{searchOnly:false,lot03b:true,lot09b:false,lot09c:false,lot09d:false,lot09e:false,lot08a:false,captureFolder:null}],
    [['--lot08a'],{searchOnly:false,lot03b:false,lot09b:false,lot09c:false,lot09d:false,lot09e:false,lot08a:true,captureFolder:null}],
    [['--captures','C:/TEMP/new'],{searchOnly:false,lot03b:false,lot09b:false,lot09c:false,lot09d:false,lot09e:false,lot08a:false,captureFolder:'C:/TEMP/new'}],
    [['--lot03b','--captures','C:/TEMP/new'],{searchOnly:false,lot03b:true,lot09b:false,lot09c:false,lot09d:false,lot09e:false,lot08a:false,captureFolder:'C:/TEMP/new'}],
  ] as const){
    it('selects exactly one fixture '+args.join(' '),()=>expect(parse(args)).toEqual(mode));
  }
  for(const args of [
    ['--search-only','--lot03b'],
    ['--lot03b','--search-only'],
    ['--search-only','--captures','C:/TEMP/new'],
    ['--captures'],
    ['--lot03b','--captures'],
    ['--lot08a','--lot03b'],
    ['--lot08a','--search-only'],
    ['--lot08a','--captures','C:/TEMP/new'],
    ['--unknown'],
    ['--lot03b','--captures','C:/TEMP/new','--captures','other'],
  ]){
    it('rejects ambiguous/incomplete command '+args.join(' '),()=>expect(()=>parse(args)).toThrow(/Usage/));
  }
});
const flags={searchOnly:false,lot03b:false,lot08a:false,lot09b:false,lot09c:false,lot09d:false,lot09e:false,captureFolder:null};
describe('Lot 09F — 4 suites natives et recettes historiques sans chevauchement',()=>{
 it('accepts global smoke',()=>expect(parse([])).toEqual(flags));
 for(const [arg,key] of [['--search-only','searchOnly'],['--lot03b','lot03b'],
 ['--lot09b','lot09b'],['--lot09c','lot09c'],['--lot09d','lot09d'],['--lot09e','lot09e']] as const){
  it('selects '+arg,()=>expect(parse([arg])).toEqual({...flags,[key]:true}));
 }
 for(const [args,expectation] of [
  [['--captures','C:/TEMP/new'],{...flags,captureFolder:'C:/TEMP/new'}],
  [['--lot03b','--captures','C:/TEMP/new'],{...flags,lot03b:true,captureFolder:'C:/TEMP/new'}],
 ] as const){it('captures '+args.join(' '),()=>expect(parse(args)).toEqual(expectation));}
 for(const args of [['--lot09b','--lot09c'],['--lot09e','--lot09d'],
 ['--lot09d','--captures','C:/TEMP'],['--search-only','--lot09e'],
 ['--captures'],['--lot03b','--captures'],['--unknown'],
 ['--lot03b','--captures','C:/TEMP/a','--captures','C:/TEMP/b']]){
  it('rejects '+args.join(' '),()=>expect(()=>parse(args)).toThrow(/Usage/));
 }
});
