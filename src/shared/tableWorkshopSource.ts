import { filterWorkshopRecords, TABLE_WORKSHOP_RECORDS, type TableWorkshopRecord } from './tableWorkshopFixtures';
import { sortTableRows, type TableSort } from './tablePresentation';
export interface WorkshopQuery { query: string; status: string; category: string; sort: TableSort | null; mode: 'complete' | 'paged'; page: number; pageSize: number }
export interface WorkshopResult { rows: readonly TableWorkshopRecord[]; total: number; sourceTotal: number; scope: 'complete' | 'partial-page'; sortScope: 'whole-source'; page: number; pageCount: number; offset: number }
const columns = [
  { id: 'identity', sortValue: (row: TableWorkshopRecord) => row.name },
  { id: 'category', sortValue: (row: TableWorkshopRecord) => row.category },
  { id: 'status', sortValue: (row: TableWorkshopRecord) => row.status },
  { id: 'date', sortValue: (row: TableWorkshopRecord) => row.date === null ? null : Date.parse(row.date) },
  { id: 'amount', sortValue: (row: TableWorkshopRecord) => row.amountCents },
];
export function workshopResult(request: WorkshopQuery): WorkshopResult {
  // Simulated server contract: apply filters and global sort BEFORE selecting a page.
  const all = sortTableRows(filterWorkshopRecords(request.query, request.status, request.category), columns, request.sort, row => row.id);
  const size = Number.isFinite(request.pageSize) ? Math.max(1, Math.min(120, Math.floor(request.pageSize))) : 20;
  const pageCount = request.mode === 'complete' ? 1 : Math.max(1, Math.ceil(all.length / size));
  const page = Number.isFinite(request.page) ? Math.max(1, Math.min(pageCount, Math.floor(request.page))) : 1;
  const offset = request.mode === 'complete' ? 0 : (page - 1) * size;
  return { rows: request.mode === 'complete' ? all : all.slice(offset, offset + size), total: all.length, sourceTotal: TABLE_WORKSHOP_RECORDS.length,
    scope: request.mode === 'complete' ? 'complete' : 'partial-page', sortScope: 'whole-source', page, pageCount, offset };
}
export function loadWorkshop(request: WorkshopQuery, delay = 20, fail = false): Promise<WorkshopResult> {
  // Deliberately non-cancellable fixture: the consumer must reject stale successful AND failed responses.
  return new Promise((resolve, reject) => setTimeout(() => fail ? reject(Error('Erreur de source simulée, aucun service client appelé.')) : resolve(workshopResult(request)), delay));
}
export class LatestTableRequest {
  private revision = 0;
  invalidate() { this.revision++; }
  async run<T>(load: () => Promise<T>, success: (value: T) => void, failure: (error: unknown) => void) {
    const revision = ++this.revision;
    try { const result = await load(); if (this.revision === revision) success(result); }
    catch (error) { if (this.revision === revision) failure(error); }
  }
}
