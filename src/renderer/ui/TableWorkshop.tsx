import { useEffect, useRef, useState } from 'react';
import { TABLE_WORKSHOP_RECORDS, TABLE_DEMO_CATEGORIES, TABLE_DEMO_STATUSES, filterWorkshopRecords, type TableWorkshopRecord } from '../../shared/tableWorkshopFixtures';
import { nextTableSort, sortTableRows, normalizeTableColumns } from '../../shared/tablePresentation';
import { defaultTableView, readTableView, tableViewKey, writeTableView, type TableViewPreference } from '../../shared/tableViewPreference';
import { DataTable, type TableColumn } from './DataTable';
import { TableFilterBar, TableColumnManager } from './TableControls';
import { ResizableSplitView } from './ResizableSplitView';
import { RecordPane } from './RecordPane';
import { AppButton } from './AppButton';
import { AppTextField } from './AppTextField';
import { FieldHelp } from './FieldHelp';
import { AppNotice } from './AppNotice';
import { UnsavedGroup, useUnsavedDraft, requestUnsavedExit, installUnsavedLifecycleBridge } from '../unsaved/unsaved';

function TableRecordEditor({ record }: { record: TableWorkshopRecord }) {
  const [tab, setTab] = useState('summary'), [note, setNote] = useState('');
  const token = useRef(crypto.randomUUID());
  useUnsavedDraft('Note du dossier fictif', note, { discard: setNote });
  return <div data-editor-instance={token.current} data-record-id={record.id}>
    <nav className="aw-record-tabs" aria-label="Onglets de la fiche"><AppButton aria-pressed={tab === 'summary'} onAction={() => setTab('summary')}>Résumé</AppButton><AppButton aria-pressed={tab === 'notes'} onAction={() => setTab('notes')}>Notes</AppButton></nav>
    <section hidden={tab !== 'summary'}><p><strong>{record.id}</strong> · {record.category} · {record.status}</p><p>Dossier TEST, indépendant de toute base client.</p></section>
    <section hidden={tab !== 'notes'}><AppTextField id="table-record-note" label="Brouillon de démonstration" value={note} onChange={e => setNote(e.target.value)} help={<FieldHelp text="Cette note reste en mémoire." detail="Le tri, les filtres et les préférences ne sauvegardent ni ne suppriment ce brouillon."/>}/><p>Aucun enregistrement métier dans cet atelier.</p></section>
  </div>;
}

export function TableWorkshop() {
  const [view, setView] = useState('dossiers'), [query, setQuery] = useState(''), [selectedId, setSelectedId] = useState<string | null>(null), [expanded, setExpanded] = useState(false);
  const [options, setOptions] = useState<TableViewPreference>(defaultTableView), optionsRef = useRef(options), [error, setError] = useState('');
  const group = `table-workshop:${view}`, key = tableViewKey(view);
  useEffect(() => installUnsavedLifecycleBridge(), []);
  useEffect(() => {
    try { const next = readTableView(localStorage, key, TABLE_DEMO_STATUSES, TABLE_DEMO_CATEGORIES); optionsRef.current = next; setOptions(next); setError(''); }
    catch { const next = defaultTableView(); optionsRef.current = next; setOptions(next); setError('Préférences non lues ; vue par défaut affichée.'); }
  }, [key]);
  function update(updater: (current: TableViewPreference) => TableViewPreference) {
    const next = updater(optionsRef.current); optionsRef.current = next; setOptions(next);
    try { writeTableView(localStorage, key, next); setError(''); } catch { setError('Préférences non mémorisées ; le dossier et ses saisies sont conservés.'); }
  }
  function open(id: string | null) { if (id === selectedId) return; requestUnsavedExit(() => { setSelectedId(id); setExpanded(false); }, group); }
  useEffect(() => { const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); open(null); } }; window.addEventListener('keydown', escape); return () => window.removeEventListener('keydown', escape); });
  const columns: TableColumn<TableWorkshopRecord>[] = [
    { id: 'identity', label: 'Identité', required: true, sortValue: row => row.name, render: row => <><strong className="aw-table-identity">{row.name}</strong><span className="aw-table-id">{row.id}</span></> },
    { id: 'category', label: 'Catégorie', sortValue: row => row.category, render: row => row.category },
    { id: 'status', label: 'Statut', sortValue: row => row.status, render: row => row.status },
    { id: 'date', label: 'Date', sortValue: row => row.date === null ? null : Date.parse(row.date), render: row => row.date ?? '—' },
    { id: 'amount', label: 'Montant fictif', sortValue: row => row.amountCents, render: row => (row.amountCents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) },
    { id: 'open', label: 'Fiche', required: true, render: row => <AppButton variant="quiet" data-open-record={row.id} aria-label={`Ouvrir ${row.id}`} aria-pressed={selectedId === row.id} onAction={() => open(row.id)}>Ouvrir</AppButton> },
  ];
  const visible = normalizeTableColumns(options.visibleColumnIds, columns);
  const rows = sortTableRows(filterWorkshopRecords(query, options.status, options.category), columns, options.sort, row => row.id);
  // The detail is resolved from the complete immutable source, NEVER the filtered/sorted rows.
  const record = TABLE_WORKSHOP_RECORDS.find(row => row.id === selectedId);
  const filteredOut = !!record && !rows.some(row => row.id === record.id);
  return <><h1>Atelier 01D — tableaux et fiches</h1><AppNotice level="info">120 dossiers synthétiques. Aucun service métier, devis ou contrat n’est modifié.</AppNotice>
    <label>Vue de démonstration<select id="table-view" value={view} onChange={e => { const next = e.target.value; requestUnsavedExit(() => { setView(next); setQuery(''); setSelectedId(null); setExpanded(false); }, group); }}><option value="dossiers">Dossiers</option><option value="autre-vue">Autre vue isolée</option></select></label>
    <TableFilterBar query={query} status={options.status} category={options.category} statuses={TABLE_DEMO_STATUSES} categories={TABLE_DEMO_CATEGORIES} onQuery={setQuery} onStatus={status => update(current => ({ ...current, status }))} onCategory={category => update(current => ({ ...current, category }))} onReset={() => { setQuery(''); update(current => ({ ...current, status: '', category: '' })); }} count={rows.length} total={TABLE_WORKSHOP_RECORDS.length}/>
    <TableColumnManager columns={columns} visible={visible} onToggle={id => update(current => ({ ...current, visibleColumnIds: normalizeTableColumns(current.visibleColumnIds.includes(id) ? current.visibleColumnIds.filter(value => value !== id) : [...current.visibleColumnIds, id], columns) }))} onReset={() => update(current => ({ ...current, visibleColumnIds: columns.map(column => column.id) }))}/>
    {options.sort && <p>Tri de présentation : {columns.find(column => column.id === options.sort?.columnId)?.label} · {options.sort.direction === 'asc' ? 'croissant' : 'décroissant'}</p>}
    {error && <AppNotice level="error">{error}</AppNotice>}
    <ResizableSplitView module={`table-demo:${view}`} view="list" defaultPercent={60} store={localStorage} selected={!!record} expanded={expanded} list={<DataTable rows={rows} columns={columns.filter(column => visible.includes(column.id))} selectedId={selectedId} getId={row => row.id} sort={options.sort} onSort={id => update(current => ({ ...current, sort: nextTableSort(current.sort, id) }))} caption="Liste complète des dossiers synthétiques filtrés"/>}>
      <UnsavedGroup name={group}>{record && <RecordPane title={`${record.name} · ${record.id}`} expanded={expanded} onExpand={() => setExpanded(value => !value)} onClose={() => open(null)}>
        {filteredOut && <p className="aw-table-outside" role="status">Ce dossier est hors du filtre actuel. Sa fiche et son brouillon restent ouverts.</p>}
        <TableRecordEditor key={record.id} record={record}/>
      </RecordPane>}</UnsavedGroup>
    </ResizableSplitView>
  </>;
}
