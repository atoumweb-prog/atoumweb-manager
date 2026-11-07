/** Catalogue-only saved filters. Presentation data, never a record or a draft. */
export const CATALOG_CONTEXT_SCOPE = 'catalog-administration';
export interface CatalogTableContext {
  query: string;
  type: 'all' | 'service' | 'offer';
  itemStatus: 'all' | 'active' | 'inactive' | 'archived';
  versionState: 'all' | 'draft' | 'published' | 'retired' | 'none';
  visibility: 'all' | 'public' | 'internal';
  category: string;
  family: string;
  pageSize: 25 | 50 | 100;
}
export const defaultCatalogContext = (): CatalogTableContext => ({query:'',type:'all',itemStatus:'all',versionState:'all',visibility:'all',category:'all',family:'all',pageSize:25});
export function normalizeCatalogContext(value: unknown): CatalogTableContext {
  const d = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const one = <T extends string>(key:string, choices:readonly T[], fallback:T):T => choices.includes(d[key] as T) ? d[key] as T : fallback;
  const text = (key:string, fallback:string, max:number) => typeof d[key] === 'string' ? (d[key] as string).slice(0,max) : fallback;
  return {query:text('query','',200),type:one('type',['all','service','offer'],'all'),itemStatus:one('itemStatus',['all','active','inactive','archived'],'all'),versionState:one('versionState',['all','draft','published','retired','none'],'all'),visibility:one('visibility',['all','public','internal'],'all'),category:text('category','all',200),family:text('family','all',200),pageSize:d.pageSize===50?50:d.pageSize===100?100:25};
}
export function paginateRows<T>(rows: readonly T[], requestedPage:number, pageSize:number) {
  const pages=Math.max(1,Math.ceil(rows.length/pageSize));
  const page=Math.max(1,Math.min(pages,Number.isFinite(requestedPage)?Math.floor(requestedPage):1));
  return {page,pages,total:rows.length,start:rows.length?(page-1)*pageSize+1:0,end:Math.min(page*pageSize,rows.length),rows:rows.slice((page-1)*pageSize,page*pageSize)};
}
