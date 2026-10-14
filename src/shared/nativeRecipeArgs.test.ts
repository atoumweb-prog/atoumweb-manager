import {createRequire} from 'node:module';
import {describe,it,expect} from 'vitest';
const parse=createRequire(process.cwd()+'/package.json')('./scripts/fixtures/native-recipe-args.cjs');
const flags={searchOnly:false,lot03b:false,lot09b:false,lot09c:false,lot09d:false,lot09e:false,lot08a:false,captureFolder:null};
describe('Lot 09F — 4 suites natives et recettes historiques sans chevauchement',()=>{
 it('accepts global smoke',()=>expect(parse([])).toEqual(flags));
 for(const [arg,key] of [['--search-only','searchOnly'],['--lot03b','lot03b'],
 ['--lot09b','lot09b'],['--lot09c','lot09c'],['--lot09d','lot09d'],['--lot09e','lot09e'],['--lot08a','lot08a']] as const){
  it('selects '+arg,()=>expect(parse([arg])).toEqual({...flags,[key]:true}));
 }
 for(const [args,expectation] of [
  [['--captures','C:/TEMP/new'],{...flags,captureFolder:'C:/TEMP/new'}],
  [['--lot03b','--captures','C:/TEMP/new'],{...flags,lot03b:true,captureFolder:'C:/TEMP/new'}],
 ] as const){it('captures '+args.join(' '),()=>expect(parse(args)).toEqual(expectation));}
 for(const args of [['--lot09b','--lot09c'],['--lot09e','--lot09d'],
 ['--lot08a','--lot03b'],['--lot08a','--captures','C:/TEMP'],['--lot09d','--captures','C:/TEMP'],['--search-only','--lot09e'],
 ['--captures'],['--lot03b','--captures'],['--unknown'],
 ['--lot03b','--captures','C:/TEMP/a','--captures','C:/TEMP/b']]){
  it('rejects '+args.join(' '),()=>expect(()=>parse(args)).toThrow(/Usage/));
 }
});
