import {describe,it,expect} from 'vitest';
import {similarCatalogDrafts} from './catalogDraftSuggestions';
import type {CatalogDraftEntry} from './commercial';
const row=(name:string,type='service',abandonedAt:string|null=null)=>({item:{id:name,name,type},version:{id:name,abandonedAt}} as CatalogDraftEntry);
describe('OT-35 suggestions consultatives',()=>{
 it('matches meaningful words across accents without treating TEST/copie as similarity',()=>{const rows=[row('TEST — Référencement local'),row('TEST — Autre prestation')];expect(similarCatalogDrafts(rows,'Referencement local copie','service').map(r=>r.item.name)).toEqual(['TEST — Référencement local']);expect(similarCatalogDrafts(rows,'TEST','service')).toEqual([]);});
 it('excludes abandoned, other types and the current article without mutating rows',()=>{const rows=[row('Audit local'),row('Audit local copie','offer'),row('Audit local ancien','service','date')],before=JSON.stringify(rows);expect(similarCatalogDrafts(rows,'Audit local','service','Audit local')).toEqual([]);expect(JSON.stringify(rows)).toBe(before);});
});
