import{describe,expect,it}from'vitest';
import{HEADER_PREFERENCE_KEY,normalizeHeaderPreference,readHeaderPreference,writeHeaderPreference}from'./headerPresentation';
import{NAVIGATION_PREFERENCE_KEY}from'./navigationRail';
describe('02B header presentation without business state',()=>{
 it('keeps header and rail preference keys independent',()=>expect(HEADER_PREFERENCE_KEY).not.toBe(NAVIGATION_PREFERENCE_KEY));
 it('defaults to expanded when absent',()=>expect(readHeaderPreference({getItem:()=>null,setItem(){},removeItem(){}})).toEqual({version:1,compact:false}));
 it('normalizes flags without storing session, query, note or library state',()=>expect(normalizeHeaderPreference({version:1,compact:true,session:{id:'private'},query:'secret',note:'secret',libraryCollapsed:true})).toEqual({version:1,compact:true}));
 it.each(['bad','null','{"version":99}'])('rejects invalid format %s',raw=>expect(()=>readHeaderPreference({getItem:()=>raw,setItem(){},removeItem(){}})).toThrow());
 it('does not announce persistence when store refuses',()=>expect(()=>writeHeaderPreference({getItem:()=>null,setItem(){throw Error('disk');},removeItem(){}},{version:1,compact:true})).toThrow('disk'));
});
