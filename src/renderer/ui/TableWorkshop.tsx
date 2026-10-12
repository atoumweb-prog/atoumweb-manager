import { useEffect, useRef, useState } from 'react';
import type { VisualPreferenceStore } from '../../shared/panelLayout';
import { TABLE_WORKSHOP_RECORDS, TABLE_DEMO_CATEGORIES, TABLE_DEMO_STATUSES, type TableWorkshopRecord } from '../../shared/tableWorkshopFixtures';
import { nextTableSort, normalizeTableColumns } from '../../shared/tablePresentation';
import { LatestTableRequest, loadWorkshop, type WorkshopResult } from '../../shared/tableWorkshopSource';
import { defaultTableView, readTableView, tableViewKey, writeTableView, moveColumn, type TableViewPreference } from '../../shared/tableViewPreference';
import { readPersonalViews, writePersonalViews, type PersonalTableView } from '../../shared/personalTableViews';
import { SavedViewPicker } from './SavedViewPicker';
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

export function TableWorkshop({ store = localStorage, manageLifecycle = true }: { store?: VisualPreferenceStore; manageLifecycle?: boolean } = {}) {
  const [view, setView] = useState('dossiers'), [query, setQuery] = useState(''), [selectedId, setSelectedId] = useState<string | null>(null), [expanded, setExpanded] = useState(false);
  const [options, setOptions] = useState<TableViewPreference>(defaultTableView), optionsRef = useRef(options), [error, setError] = useState('');
  const [personal, setPersonal] = useState<PersonalTableView[]>([]), personalRef = useRef(personal), [personalId, setPersonalId] = useState('standard');
  const [mode, setMode] = useState<'complete' | 'paged'>('complete'), [page, setPage] = useState(1), [pageSize, setPageSize] = useState(20);
  const [result, setResult] = useState<WorkshopResult | null>(null), [loading, setLoading] = useState(true), [sourceError, setSourceError] = useState('');
  const [slow, setSlow] = useState(false), [fail, setFail] = useState(false), [retry, setRetry] = useState(0), latest = useRef(new LatestTableRequest());
  const group = `table-workshop:${view}`, key = tableViewKey(view);
  useEffect(() => manageLifecycle ? installUnsavedLifecycleBridge() : undefined, [manageLifecycle]);
  useEffect(() => {
    setLoading(true); setSourceError(''); setResult(null);
    const gate = latest.current;
    void gate.run(() => loadWorkshop({ query, status: options.status, category: options.category, sort: options.sort, mode, page, pageSize }, slow ? 400 : 20, fail),
      value => { setResult(value); setLoading(false); }, error => { setSourceError(error instanceof Error ? error.message : 'Source indisponible.'); setLoading(false); });
    return () => gate.invalidate();
  }, [query, options.status, options.category, options.sort?.columnId, options.sort?.direction, mode, page, pageSize, slow, fail, retry]);
  useEffect(() => {
    setPersonalId('standard');
    try { const next = readTableView(store, key, TABLE_DEMO_STATUSES, TABLE_DEMO_CATEGORIES); optionsRef.current = next; setOptions(next); setError(''); }
    catch { const next = defaultTableView(); optionsRef.current = next; setOptions(next); setError('Préférences non lues ; vue par défaut affichée.'); }
    try { const next = readPersonalViews(store, view, TABLE_DEMO_STATUSES, TABLE_DEMO_CATEGORIES); personalRef.current = next; setPersonal(next); }
    catch { personalRef.current = []; setPersonal([]); setError('Vues personnelles non lues ; vue standard disponible.'); }
  }, [key, store]);
  function update(updater: (current: TableViewPreference) => TableViewPreference) {
    const next = updater(optionsRef.current); optionsRef.current = next; setOptions(next);
    try {
      if (personalId === 'standard') writeTableView(store, key, next);
      else persistPersonal(personalRef.current.map(saved => saved.id === personalId ? { ...saved, preference: next } : saved));
      setError('');
    } catch { setError('Préférences non mémorisées ; le dossier et ses saisies sont conservés.'); }
  }
  function persistPersonal(next: PersonalTableView[]) { writePersonalViews(store, view, next, TABLE_DEMO_STATUSES, TABLE_DEMO_CATEGORIES); personalRef.current = next; setPersonal(next); }
  useEffect(() => {
    const external = (event: StorageEvent) => {
      if (event.key !== null && event.key !== key && event.key !== `atoumweb:table-workshop:${encodeURIComponent(view)}:personal:v1`) return;
      try {
        const saved = readPersonalViews(store, view, TABLE_DEMO_STATUSES, TABLE_DEMO_CATEGORIES); personalRef.current = saved; setPersonal(saved);
        const selected = saved.find(item => item.id === personalId);
        const next = selected?.preference ?? readTableView(store, key, TABLE_DEMO_STATUSES, TABLE_DEMO_CATEGORIES);
        if (!selected) setPersonalId('standard'); optionsRef.current = next; setOptions(next); setError('');
      } catch { setError('Préférences externes non lues ; fiche et brouillon conservés.'); }
    };
    window.addEventListener('storage', external); return () => window.removeEventListener('storage', external);
  }, [store, key, view, personalId]);
  function choosePersonal(id: string) {
    try { const next = id === 'standard' ? readTableView(store, key, TABLE_DEMO_STATUSES, TABLE_DEMO_CATEGORIES) : personalRef.current.find(saved => saved.id === id)?.preference;
      if (!next) return; setPersonalId(id); optionsRef.current = next; setOptions(next); setError('');
    } catch { setError('Préférences non lues ; fiche et brouillon conservés.'); }
  }
  function editPersonal(action: 'create' | 'duplicate' | 'rename' | 'delete', name = '') {
    if (action !== 'delete' && (!name.trim() || personalRef.current.some(saved => saved.name.toLocaleLowerCase('fr-FR') === name.toLocaleLowerCase('fr-FR') && !(action === 'rename' && saved.id === personalId)))) { setError('Choisis un nom de vue personnel distinct.'); return; }
    try {
      if (action === 'delete') { persistPersonal(personalRef.current.filter(saved => saved.id !== personalId)); choosePersonal('standard'); }
      else if (action === 'rename') persistPersonal(personalRef.current.map(saved => saved.id === personalId ? { ...saved, name } : saved));
      else { const id = `personal-${crypto.randomUUID()}`, preference = action === 'duplicate' ? optionsRef.current : defaultTableView(); persistPersonal([...personalRef.current, { id, name, preference }]); setPersonalId(id); optionsRef.current = preference; setOptions(preference); }
      setError('');
    } catch { setError('Vue personnelle non mémorisée ; fiche et brouillon conservés.'); }
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
  const ordered = options.columnOrder.map(id => columns.find(column => column.id === id)!).filter(Boolean);
  const rows = result?.rows ?? [];
  // The detail is resolved from the complete immutable source, NEVER the filtered/sorted rows.
  const record = TABLE_WORKSHOP_RECORDS.find(row => row.id === selectedId);
  const filteredOut = !!record && !rows.some(row => row.id === record.id);
  return <><h1>Atelier 01D — tableaux et fiches</h1><AppNotice level="info">120 dossiers synthétiques. Aucun service métier, devis ou contrat n’est modifié.</AppNotice>
    <label>Vue de démonstration<select id="table-view" value={view} onChange={e => { const next = e.target.value; requestUnsavedExit(() => { setView(next); setQuery(''); setSelectedId(null); setExpanded(false); }, group); }}><option value="dossiers">Dossiers</option><option value="autre-vue">Autre vue isolée</option></select></label>
    <SavedViewPicker views={personal} selected={personalId} onSelect={choosePersonal} onCreate={(name, duplicate) => editPersonal(duplicate ? 'duplicate' : 'create', name)} onRename={name => editPersonal('rename', name)} onDelete={() => editPersonal('delete')} onReset={() => { setPersonalId('standard'); const next = defaultTableView(); optionsRef.current = next; setOptions(next); try { writeTableView(store, key, next); setError(''); } catch { setError('Préférences non mémorisées ; fiche conservée.'); } }}/>
    <section className="aw-table-source" aria-label="Source asynchrone synthétique"><label>Portée de la source<select id="table-source-mode" value={mode} onChange={e => { setMode(e.target.value as 'complete' | 'paged'); setPage(1); }}><option value="complete">Source complète</option><option value="paged">Page partielle de la source</option></select></label>
      <label>Taille de page<select id="table-page-size" value={pageSize} disabled={mode === 'complete'} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}><option value="10">10</option><option value="20">20</option><option value="40">40</option></select></label>
      <label><input id="table-slow" type="checkbox" checked={slow} onChange={e => setSlow(e.target.checked)}/>Simuler une réponse lente</label>
      <label><input id="table-fail" type="checkbox" checked={fail} onChange={e => setFail(e.target.checked)}/>Simuler une erreur de source</label>
    </section>
    <TableFilterBar query={query} status={options.status} category={options.category} statuses={TABLE_DEMO_STATUSES} categories={TABLE_DEMO_CATEGORIES} onQuery={value => { setQuery(value); setPage(1); }} onStatus={status => { setPage(1); update(current => ({ ...current, status })); }} onCategory={category => { setPage(1); update(current => ({ ...current, category })); }} onReset={() => { setQuery(''); setPage(1); update(current => ({ ...current, status: '', category: '' })); }} count={result?.total ?? 0} total={TABLE_WORKSHOP_RECORDS.length} loading={loading} unavailable={!!sourceError}/>
    <TableColumnManager columns={ordered} visible={visible} onMove={(id, target) => update(current => ({ ...current, columnOrder: moveColumn(current.columnOrder, id, target) }))} onToggle={id => update(current => ({ ...current, visibleColumnIds: normalizeTableColumns(current.visibleColumnIds.includes(id) ? current.visibleColumnIds.filter(value => value !== id) : [...current.visibleColumnIds, id], columns) }))} onReset={() => update(current => ({ ...current, visibleColumnIds: columns.map(column => column.id), columnOrder: columns.map(column => column.id), widths: {} }))}/>
    {options.sort && <p>Tri de présentation : {columns.find(column => column.id === options.sort?.columnId)?.label} · {options.sort.direction === 'asc' ? 'croissant' : 'décroissant'}</p>}
    {error && <AppNotice level="error">{error}</AppNotice>}
    {loading && <p role="status" id="table-loading">Chargement des dossiers synthétiques… La fiche ouverte reste disponible.</p>}
    {sourceError && <AppNotice level="error"><span id="table-source-error">{sourceError}</span><AppButton onAction={() => setRetry(value => value + 1)}>Réessayer le chargement</AppButton></AppNotice>}
    {result && <p id="table-source-scope" role="status">{result.scope === 'complete' ? 'Source complète' : 'Page partielle'} · Tri et filtres sur toute la source synthétique ({result.sourceTotal} dossiers). {result.total ? `${result.offset + 1}–${result.offset + rows.length}` : '0'} affichés sur {result.total} résultats.</p>}
    {mode === 'paged' && <nav className="aw-table-pagination" aria-label="Pagination des dossiers"><AppButton disabled={loading || !result || result.page <= 1} onAction={() => setPage((result?.page ?? 1) - 1)}>Page précédente</AppButton><span id="table-page">{result ? `Page ${result.page} / ${result.pageCount}` : 'Page en attente'}</span><AppButton disabled={loading || !result || result.page >= result.pageCount} onAction={() => setPage((result?.page ?? 1) + 1)}>Page suivante</AppButton></nav>}
    <ResizableSplitView module={`table-demo:${view}`} view="list" defaultPercent={60} store={store} selected={!!record} expanded={expanded} list={<DataTable preferenceScope={`${view}:${personalId}`} rows={rows} columns={ordered.filter(column => visible.includes(column.id))} widths={options.widths} onWidth={(id, width) => update(current => ({ ...current, widths: { ...current.widths, [id]: width } }))} selectedId={selectedId} getId={row => row.id} sort={options.sort} onSort={id => { setPage(1); update(current => ({ ...current, sort: nextTableSort(current.sort, id) })); }} caption={mode === 'complete' ? 'Source complète — tri global des dossiers synthétiques' : 'Page partielle — tri global avant pagination'} loading={loading} unavailable={!!sourceError}/> }>
      <UnsavedGroup name={group}>{record && <RecordPane title={`${record.name} · ${record.id}`} expanded={expanded} onExpand={() => setExpanded(value => !value)} onClose={() => open(null)}>
        {filteredOut && <p className="aw-table-outside" role="status">{loading || sourceError ? 'La liste est temporairement indisponible.' : 'Ce dossier est hors du filtre ou de la page actuelle.'} Sa fiche et son brouillon restent ouverts.</p>}
        <TableRecordEditor key={record.id} record={record}/>
      </RecordPane>}</UnsavedGroup>
    </ResizableSplitView>
  </>;
}
