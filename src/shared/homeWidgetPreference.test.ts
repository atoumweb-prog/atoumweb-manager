import {describe,it,expect} from 'vitest';
import {defaultHomeWidgets,normalizeHomeWidgets,moveHomeWidget,dropHomeWidget,HOME_WIDGET_KEYS} from './homeWidgetPreference';
describe('02D visual widget preferences only',()=>{
 it('pins Today, restores missing widgets, drops unknown/duplicates',()=>{expect(normalizeHomeWidgets({version:1,order:['time','unknown','time'],hidden:['today','time','unknown']})).toEqual({version:1,order:['today','time','kpis','pipeline','watch','actions'],hidden:['time']});});
 it.each([null,{}, {version:0},{version:99}])('rejects incompatible schema %j',raw=>expect(()=>normalizeHomeWidgets(raw)).toThrow());
 it('never stores identity, note, query or snapshot',()=>{const result=normalizeHomeWidgets({...defaultHomeWidgets(),selectedId:'private',notes:'secret',query:'client',sources:{alerts:7}});expect(JSON.stringify(result)).not.toMatch(/private|secret|query|sources|selectedId/);});
 it('reorders by keyboard with Today pinned',()=>{const before=defaultHomeWidgets(),next=moveHomeWidget(before,'time',-1);expect(next.order).toEqual(['today','kpis','time','pipeline','watch','actions']);expect(before.order).toEqual(HOME_WIDGET_KEYS);expect(moveHomeWidget(before,'kpis',-1)).toBe(before);expect(moveHomeWidget(before,'today',1)).toBe(before);});
 it('drop is one deterministic presentation change',()=>{const before=defaultHomeWidgets(),next=dropHomeWidget(before,'actions','kpis');expect(next.order).toEqual(['today','actions','kpis','pipeline','time','watch']);expect(dropHomeWidget(before,'time','today')).toBe(before);});
});

describe('Home collapsible presentation',()=>{
 it('keeps Today accessible while allowing its content to fold',()=>{const p=normalizeHomeWidgets({version:1,collapsed:['today','time','time','private'],hidden:['today']});expect(p.collapsed).toEqual(['today','time']);expect(p.hidden).toEqual([]);expect(p.order[0]).toBe('today');});
 it('roundtrips folds across ordering without retaining form content',()=>{const p=normalizeHomeWidgets({...defaultHomeWidgets(),collapsed:['watch'],notes:'private'});expect(moveHomeWidget(p,'time',-1).collapsed).toEqual(['watch']);expect(JSON.stringify(p)).not.toContain('private');});
});
