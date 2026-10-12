import { AppButton } from './AppButton';
import { AppTextField } from './AppTextField';
export function TableFilterBar({ query, status, category, statuses, categories, onQuery, onStatus, onCategory, onReset, count, total }: {
  query: string; status: string; category: string; statuses: readonly string[]; categories: readonly string[];
  onQuery: (value: string) => void; onStatus: (value: string) => void; onCategory: (value: string) => void; onReset: () => void; count: number; total: number;
}) {
  return <section className="aw-table-filters" aria-label="Recherche et filtres"><AppTextField id="table-query" label="Rechercher dans les dossiers fictifs" value={query} onChange={e => onQuery(e.target.value)}/>
    <label>Statut de démonstration<select id="table-status" value={status} onChange={e => onStatus(e.target.value)}><option value="">Tous les statuts</option>{statuses.map(value => <option key={value}>{value}</option>)}</select></label>
    <label>Catégorie<select id="table-category" value={category} onChange={e => onCategory(e.target.value)}><option value="">Toutes les catégories</option>{categories.map(value => <option key={value}>{value}</option>)}</select></label>
    <AppButton onAction={onReset}>Effacer les filtres</AppButton><p id="table-counter" role="status">{count} / {total} dossiers fictifs</p>
    {(query || status || category) && <p className="aw-table-active-filters">Filtres actifs : {[query && `Recherche « ${query} »`, status, category].filter(Boolean).join(' · ')}</p>}
  </section>;
}
export function TableColumnManager({ columns, visible, onToggle, onReset, onMove }: {
  columns: readonly { id: string; label: string; required?: boolean }[]; visible: readonly string[]; onToggle: (id: string) => void; onReset: () => void;
  onMove?: (id: string, target: string) => void;
}) {
  return <details className="aw-table-columns"><summary>Colonnes affichées</summary><div>{columns.map((column, index) => <div key={column.id} className="aw-column-control" draggable={!!onMove} data-column-order={column.id} onDragStart={event => event.dataTransfer.setData('text/x-atoumweb-column', column.id)} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); onMove?.(event.dataTransfer.getData('text/x-atoumweb-column'), column.id); }}><label><input type="checkbox" data-column-toggle={column.id} checked={visible.includes(column.id)} disabled={column.required} onChange={() => onToggle(column.id)}/>{column.label}{column.required ? ' (obligatoire)' : ''}</label>{onMove && <><AppButton variant="quiet" aria-label={`Avancer ${column.label}`} disabled={index === 0} onAction={() => onMove(column.id, columns[index - 1].id)}>←</AppButton><AppButton variant="quiet" aria-label={`Reculer ${column.label}`} disabled={index === columns.length - 1} onAction={() => onMove(column.id, columns[index + 1].id)}>→</AppButton></>}</div>)}<AppButton onAction={onReset}>Réinitialiser les colonnes</AppButton></div></details>;
}
