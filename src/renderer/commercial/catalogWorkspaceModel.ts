import type {CatalogItemSummary} from '../../shared/commercial';
import type {CatalogTableContext} from '../../shared/catalogTableContext';
import {catalogAdminFiltered} from './catalogAdminFilters';
import {catalogueFamilyLabel} from './catalogDisplay';

export const versionStatesOf = (item:CatalogItemSummary) => item.versionStates ?? (item.currentVersion ? [item.currentVersion.status] : []);
export function catalogCounts(items:readonly CatalogItemSummary[]) {
  return {total:items.length,active:items.filter(x=>x.status==='active').length,inactive:items.filter(x=>x.status==='inactive').length,archived:items.filter(x=>x.status==='archived').length,published:items.filter(x=>versionStatesOf(x).includes('published')).length,draft:items.filter(x=>versionStatesOf(x).includes('draft')).length};
}
export const catalogFamily = (item:CatalogItemSummary) => catalogueFamilyLabel(item);
export function filterCatalogWorkspace(items:readonly CatalogItemSummary[], filters:CatalogTableContext) {
  return catalogAdminFiltered([...items],{query:filters.query,type:filters.type,status:filters.itemStatus,category:filters.category}).filter(item =>
    (filters.family==='all'||catalogFamily(item)===filters.family)&&
    (filters.visibility==='all'||item.visiblePublic===(filters.visibility==='public'))&&
    (filters.versionState==='all'||(filters.versionState==='none'?versionStatesOf(item).length===0:versionStatesOf(item).includes(filters.versionState))));
}
/** Read-only grouping by the existing commercial-family presentation. No categorisation write. */
export function catalogFamilies(items:readonly CatalogItemSummary[]) {
  const groups=new Map<string,CatalogItemSummary[]>();
  for(const item of items){const key=catalogFamily(item);groups.set(key,[...(groups.get(key)??[]),item]);}
  const priority=['Sites web','E-commerce','Sites mariage','Maintenance'];
  const rank=(name:string)=>priority.includes(name)?priority.indexOf(name):priority.length;
  return [...groups].sort(([a],[b])=>rank(a)-rank(b)||a.localeCompare(b,'fr')).map(([name,rows])=>({id:name,name,items:rows,offers:rows.filter(x=>x.type==='offer').length,services:rows.filter(x=>x.type==='service').length}));
}
/** Display-only price ranges; incompatible types, periods and units never share a range. */
export function familyPriceHints(items:readonly CatalogItemSummary[]):string[] {
  const buckets=new Map<string,number[]>(),other=new Set<string>();
  const clean=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr').trim();
  const money=(value:number)=>(value/100).toLocaleString('fr-FR')+' €';
  for(const item of items){const v=item.currentVersion;if(item.status!=='active'||v?.status!=='published')continue;
    const type=item.type==='offer'?'Offres':'Services';
    if(v.priceBasis==='actual_cost'){other.add(type+' · Coût tiers réel — sur devis');continue;}
    if(v.priceMode==='quote_only'){other.add(type+' · Sur devis');continue;}
    if(v.priceMode==='free'){other.add(type+' · Gratuit');continue;}
    if(v.priceCents==null)continue;
    const unit=v.unit?.trim()??'',periodicity=v.periodicity?.trim()??'';
    const stored=clean(periodicity||unit);
    const period=v.priceMode==='monthly'?'Mensuel':v.priceMode==='yearly'?'Annuel':v.priceMode==='hourly'?'Horaire':
      ['mois','mensuel','mensuelle'].includes(stored)?'Mensuel':['an','annee','annuel','annuelle'].includes(stored)?'Annuel':
      ['h','heure','heures','horaire'].includes(stored)?'Horaire':periodicity&&!['ponctuel','ponctuelle'].includes(clean(periodicity))?'Période : '+periodicity:'Ponctuel';
    const suffix=period==='Mensuel'?'/mois':period==='Annuel'?'/an':period==='Horaire'?'/h':'';
    const periodUnits=['mois','an','annee','h','heure','heures'];
    const billedUnit=unit&&!periodUnits.includes(clean(unit))?unit:'';
    // Preserve exact stored period/unit distinctions even where the heading is normalized.
    const key=JSON.stringify([type,period,suffix,billedUnit,periodicity,unit,v.priceMode==='starting_from']);
    buckets.set(key,[...(buckets.get(key)??[]),v.priceCents]);
  }
  const amounts=[...buckets].map(([key,values])=>{
    const [type,period,suffix,unit,, ,starting]=JSON.parse(key) as [string,string,string,string,string,string,boolean];
    const min=Math.min(...values),max=Math.max(...values);
    const amount=starting?'à partir de '+money(min):min===max?money(min):money(min)+' à '+money(max);
    return `${type} · ${period} — ${amount}${suffix?' '+suffix:''}${unit?' / '+unit:''}`;
  });
  return [...new Set([...amounts,...other])];
}
