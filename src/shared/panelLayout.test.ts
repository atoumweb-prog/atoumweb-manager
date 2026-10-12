import {describe,expect,it} from 'vitest';
import {boundedSplit,layoutKey,readLayout,writeLayout} from './panelLayout';
describe('visual panel preferences',()=>{
  it('keeps module/view keys distinct',()=>{expect(layoutKey('prospects','list')).not.toBe(layoutKey('operations','list'));expect(layoutKey('a/b','c')).not.toBe(layoutKey('a','b/c'));});
  it('reserves both columns plus the separator and rejects non finite sizes',()=>{expect(boundedSplit(100,1000)).toBe(67);expect(boundedSplit(0,1000)).toBe(24);expect(boundedSplit(NaN,1000)).toBe(60);expect(boundedSplit(95,400)).toBe(80);});
  it('reads defaults and migrates only known visual formats',()=>{expect(readLayout({getItem:()=>null,setItem(){},removeItem(){}},'x',66)).toBe(66);expect(readLayout({getItem:()=>'{"version":0,"percent":38}',setItem(){},removeItem(){}},'x',66)).toBe(38);});
  it.each(['bad','null','{"version":3,"listPercent":50}','{"version":1,"listPercent":999}'])('refuses corrupt preference %s',(raw)=>{expect(()=>readLayout({getItem:()=>raw,setItem(){},removeItem(){}},'x',66)).toThrow();});
  it('serializes only bounded visual data',()=>{let raw='';writeLayout({getItem:()=>null,setItem:(_k,v)=>{raw=v;},removeItem(){}},'x',120);expect(JSON.parse(raw)).toEqual({version:1,listPercent:80});});
  it('does not hide storage write failure',()=>{expect(()=>writeLayout({getItem:()=>null,setItem(){throw Error('Quota');},removeItem(){}},'x',60)).toThrow('Quota');});
});
