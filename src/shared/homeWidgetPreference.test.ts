import {describe,it,expect} from 'vitest';
import {defaultHomeWidgets,normalizeHomeWidgets,moveHomeWidget,dropHomeWidget,HOME_WIDGET_KEYS} from './homeWidgetPreference';
describe('02D visual widget preferences only',()=>{
 it('pins Today, restores missing widgets, drops unknown/duplicates',()=>{expect(normalizeHomeWidgets({version:1,order:['time','unknown','time'],hidden:['today','time','unknown']})).toEqual({version:1,order:['today','time','kpis','pipeline','watch','actions'],hidden:['time']});});
 it.each([null,{}, {version:0},{version:99}])('rejects incompatible schema %j',raw=>expect(()=>normalizeHomeWidgets(raw)).toThrow());
 it('never stores identity, note, query or snapshot',()=>{const result=normalizeHomeWidgets({...defaultHomeWidgets(),selectedId:'private',notes:'secret',query:'client',sources:{alerts:7}});expect(JSON.stringify(result)).not.toMatch(/private|secret|query|sources|selectedId/);});
 it('reorders by keyboard with Today pinned',()=>{const before=defaultHomeWidgets(),next=moveHomeWidget(before,'time',-1);expect(next.order).toEqual(['today','kpis','time','pipeline','watch','actions']);expect(before.order).toEqual(HOME_WIDGET_KEYS);expect(moveHomeWidget(before,'kpis',-1)).toBe(before);expect(moveHomeWidget(before,'today',1)).toBe(before);});
 it('drop is one deterministic presentation change',()=>{const before=defaultHomeWidgets(),next=dropHomeWidget(before,'actions','kpis');expect(next.order).toEqual(['today','actions','kpis','pipeline','time','watch']);expect(dropHomeWidget(before,'time','today')).toBe(before);});
});
