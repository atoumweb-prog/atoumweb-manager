import type { ReactNode } from 'react';
import type { SortColumn, TableSort } from '../../shared/tablePresentation';
import { AppButton } from './AppButton';
import './table-layout.css';
export interface TableColumn<T> extends SortColumn<T> { label: string; required?: boolean; render: (row: T) => ReactNode }
export function DataTable<T>({ rows, columns, selectedId, getId, sort, onSort, caption }: {
  rows: readonly T[]; columns: readonly TableColumn<T>[]; selectedId: string | null;
  getId: (row: T) => string; sort: TableSort | null; onSort: (id: string) => void; caption: string;
}) {
  return <div className="aw-data-table-scroll" tabIndex={0} aria-label="Tableau défilable">
    <table className="aw-data-table"><caption>{caption}</caption><thead><tr>{columns.map(column => <th key={column.id} scope="col" data-column-id={column.id}
      aria-sort={column.sortValue ? sort?.columnId === column.id ? sort.direction === 'asc' ? 'ascending' : 'descending' : 'none' : undefined}>
      {column.sortValue ? <AppButton variant="quiet" aria-label={`Trier par ${column.label}`} onAction={() => onSort(column.id)}>{column.label}{sort?.columnId === column.id ? sort.direction === 'asc' ? ' ↑' : ' ↓' : ''}</AppButton> : column.label}
    </th>)}</tr></thead><tbody>{rows.map(row => <tr key={getId(row)} data-record-id={getId(row)} data-selected={selectedId === getId(row)}>{columns.map(column => <td key={column.id} data-column-id={column.id}>{column.render(row)}</td>)}</tr>)}</tbody></table>
    {!rows.length && <p role="status">Aucun dossier ne correspond aux filtres. Efface les filtres pour retrouver la liste.</p>}
  </div>;
}
