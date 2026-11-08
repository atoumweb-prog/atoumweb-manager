import type {CatalogDraftEntry} from './commercial';
const words=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr').split(/[^a-z0-9]+/).filter(w=>w.length>2&&!['test','copie','offre','service','pour','avec','une','des','les'].includes(w));
/** Advisory only: never merge, reserve a name, or create a record. */
export function similarCatalogDrafts(rows:readonly CatalogDraftEntry[],name:string,type:'offer'|'service',excludeItemId?:string){
 const needle=new Set(words(name));if(!needle.size)return [];
 return rows.filter(r=>!r.version.abandonedAt&&r.item.id!==excludeItemId&&r.item.type===type).map(row=>{const candidate=new Set(words(row.item.name)),shared=[...needle].filter(w=>candidate.has(w)).length;return {row,score:shared/Math.max(needle.size,candidate.size)};}).filter(r=>r.score>=.5).sort((a,b)=>b.score-a.score||a.row.item.name.localeCompare(b.row.item.name,'fr')).slice(0,5).map(r=>r.row);
}
