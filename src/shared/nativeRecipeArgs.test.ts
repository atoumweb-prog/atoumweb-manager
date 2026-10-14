import {createRequire} from 'node:module';
import {describe,it,expect} from 'vitest';
const parse=createRequire(process.cwd()+'/package.json')('./scripts/fixtures/native-recipe-args.cjs');
describe('combined native recipe modes C01',()=>{
 for(const [args,mode] of [ [[],{searchOnly:false,lot03b:false,lot09c:false,captureFolder:null}], [['--search-only'],{searchOnly:true,lot03b:false,lot09c:false,captureFolder:null}], [['--lot03b'],{searchOnly:false,lot03b:true,lot09c:false,captureFolder:null}], [['--lot09c'],{searchOnly:false,lot03b:false,lot09c:true,captureFolder:null}], [['--captures','C:/TEMP/new'],{searchOnly:false,lot03b:false,lot09c:false,captureFolder:'C:/TEMP/new'}], [['--lot03b','--captures','C:/TEMP/new'],{searchOnly:false,lot03b:true,lot09c:false,captureFolder:'C:/TEMP/new'}] ] as const){
  it('selects exactly one fixture '+args.join(' '),()=>expect(parse(args)).toEqual(mode));
 }
 for(const args of [['--search-only','--lot03b'],['--lot03b','--search-only'],['--lot09c','--lot03b'],['--lot09c','--captures','C:/TEMP/new'],['--search-only','--captures','C:/TEMP/new'],['--captures'],['--lot03b','--captures'],['--unknown'],['--lot03b','--captures','C:/TEMP/new','--captures','other']]){
  it('rejects ambiguous/incomplete command '+args.join(' '),()=>expect(()=>parse(args)).toThrow(/Usage/));
 }
});
