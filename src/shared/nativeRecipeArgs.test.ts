import {createRequire} from 'node:module';
import {describe,it,expect} from 'vitest';
const parse=createRequire(process.cwd()+'/package.json')('./scripts/fixtures/native-recipe-args.cjs');
describe('combined native recipe modes C01',()=>{
 for(const [args,mode] of [ [[],{searchOnly:false,lot03b:false,captureFolder:null}], [['--search-only'],{searchOnly:true,lot03b:false,captureFolder:null}], [['--lot03b'],{searchOnly:false,lot03b:true,captureFolder:null}], [['--captures','C:/TEMP/new'],{searchOnly:false,lot03b:false,captureFolder:'C:/TEMP/new'}], [['--lot03b','--captures','C:/TEMP/new'],{searchOnly:false,lot03b:true,captureFolder:'C:/TEMP/new'}] ] as const){
  it('selects exactly one fixture '+args.join(' '),()=>expect(parse(args)).toEqual(mode));
 }
 for(const args of [['--search-only','--lot03b'],['--lot03b','--search-only'],['--search-only','--captures','C:/TEMP/new'],['--captures'],['--lot03b','--captures'],['--unknown'],['--lot03b','--captures','C:/TEMP/new','--captures','other']]){
  it('rejects ambiguous/incomplete command '+args.join(' '),()=>expect(()=>parse(args)).toThrow(/Usage/));
 }
});
