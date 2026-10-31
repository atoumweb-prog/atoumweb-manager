import {adaptiveTableWidths} from '../../shared/adaptiveTableWidths';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { columnWidth } from '../../shared/tableViewPreference';
import type { SortColumn, TableSort } from '../../shared/tablePresentation';
import { AppButton } from './AppButton';
import './table-layout.css';
export interface TableColumn<T> extends SortColumn<T> { label: string; fixedWidth?: number; required?: boolean; render: (row: T) => ReactNode }
function ColumnSizer({ id, width, onPreview, onCommit }: { id: string; width: number; onPreview: (width: number | null) => void; onCommit: (width: number) => void }) {
  const dispose = useRef<(() => void) | null>(null);
  useEffect(() => () => dispose.current?.(), [id, width]);
  return <span className="aw-column-sizer" role="separator" aria-orientation="vertical" tabIndex={0} aria-label={`Largeur ${id}`} aria-valuemin={Math.min(width,columnWidth(id, 0))} aria-valuemax={600} aria-valuenow={width}
    onKeyDown={event => { if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return; event.preventDefault(); onCommit(columnWidth(id, event.key === 'Home' ? 0 : event.key === 'End' ? 600 : width + (event.key === 'ArrowLeft' ? -20 : 20))); }}
    onPointerDown={event => {
      if (event.button !== 0) return; event.preventDefault(); dispose.current?.();
      const start = event.clientX, pointer = event.pointerId; let latest = width, finished = false;
      const cleanup = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', finish); window.removeEventListener('pointercancel', cancel); window.removeEventListener('blur', cancel); dispose.current = null; };
      const end = (commit: boolean) => { if (finished) return; finished = true; cleanup(); onPreview(null); if (commit && latest !== width) onCommit(latest); };
      const move = (next: PointerEvent) => { if (next.pointerId !== pointer) return; latest = columnWidth(id, width + next.clientX - start); onPreview(latest); };
      const finish = (next: PointerEvent) => { if (next.pointerId === pointer) end(true); };
      const cancel = () => end(false);
      dispose.current = cancel;
      window.addEventListener('pointermove', move); window.addEventListener('pointerup', finish); window.addEventListener('pointercancel', cancel); window.addEventListener('blur', cancel);
    }}/ >;
}
export function DataTable<T>({ rows, columns, selectedId, getId, sort, onSort, caption, widths = {}, onWidth, preferenceScope = '', loading = false, unavailable = false, onRowActivate, className='', rowAttributes, fitAvailable=false }: {
  rows: readonly T[]; columns: readonly TableColumn<T>[]; selectedId: string | null;
  getId: (row: T) => string; sort: TableSort | null; onSort: (id: string) => void; caption: string;
  widths?: Readonly<Record<string, number>>; onWidth?: (id: string, width: number) => void;
  preferenceScope?: string;
  loading?: boolean; unavailable?: boolean;
  onRowActivate?: (row:T)=>void;
  className?:string;fitAvailable?:boolean;
  rowAttributes?:(row:T)=>{className?:string;[key:`data-${string}`]:string|undefined};
}) {
  const scrollRef=useRef<HTMLDivElement>(null),[available,setAvailable]=useState(0);
  useEffect(()=>{const node=scrollRef.current;if(!node)return;const read=()=>setAvailable(node.clientWidth);read();const observer=new ResizeObserver(read);observer.observe(node);return()=>observer.disconnect();},[]);
  const adaptive=fitAvailable?adaptiveTableWidths(columns.map(c=>c.id),Math.max(0,available-4),widths):widths;
  const [preview, setPreview] = useState<{ id: string; width: number } | null>(null);
  useEffect(() => setPreview(null), [preferenceScope]);
  const widthOf = (id: string) => columns.find(column => column.id === id)?.fixedWidth ?? (preview?.id === id ? preview.width : adaptive[id] ?? columnWidth(id, id === 'identity' ? 260 : 180));
  return <div ref={scrollRef} className="aw-data-table-scroll" tabIndex={0} aria-label="Tableau défilable" aria-busy={loading}>
    <table className={`aw-data-table ${className}`} style={onWidth ? { tableLayout: 'fixed', width: columns.reduce((total, column) => total + widthOf(column.id), 0) } : undefined}><caption>{caption}</caption>{onWidth && <colgroup>{columns.map(column => <col key={column.id} style={{ width: widthOf(column.id) }}/>)}</colgroup>}<thead><tr>{columns.map(column => <th key={column.id} scope="col" data-column-id={column.id}
      aria-sort={column.sortValue ? sort?.columnId === column.id ? sort.direction === 'asc' ? 'ascending' : 'descending' : 'none' : undefined}>
      {column.sortValue ? <AppButton variant="quiet" aria-label={`Trier par ${column.label}`} onAction={() => onSort(column.id)}>{column.label}{sort?.columnId === column.id ? sort.direction === 'asc' ? ' ↑' : ' ↓' : ''}</AppButton> : column.label}
      {onWidth && !column.fixedWidth && <ColumnSizer key={`${preferenceScope}:${column.id}`} id={column.id} width={widthOf(column.id)} onPreview={width => setPreview(width === null ? null : { id: column.id, width })} onCommit={width => onWidth(column.id, width)}/>}
    </th>)}</tr></thead><tbody>{rows.map(row => {const attributes=rowAttributes?.(row);return <tr key={getId(row)} {...attributes} className={[attributes?.className,selectedId===getId(row)?'selected-row':''].filter(Boolean).join(' ')} data-record-id={getId(row)} data-selected={selectedId === getId(row)} tabIndex={onRowActivate?0:undefined} onClick={onRowActivate?()=>onRowActivate(row):undefined} onKeyDown={onRowActivate?event=>{if(event.target===event.currentTarget&&['Enter',' '].includes(event.key)){event.preventDefault();onRowActivate(row);}}:undefined}>{columns.map(column => <td key={column.id} data-column-id={column.id}>{column.render(row)}</td>)}</tr>;})}</tbody></table>
    {!rows.length && !loading && !unavailable && <p role="status">Aucun dossier ne correspond aux filtres. Efface les filtres pour retrouver la liste.</p>}
  </div>;
}
