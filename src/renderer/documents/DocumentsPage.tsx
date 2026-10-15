import {ConfiguredDataTable} from '../ui/ConfiguredDataTable';
import {useSearchTargetConfirmation,type EntityReady} from '../ui/useSearchTargetConfirmation';
import { ContractLibraryPage } from '../commercial/ContractLibraryPage';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ClientSummary } from '../../shared/crm';
import {
  CLIENT_DOCUMENT_CATEGORIES,
  type ClientDocument,
  type ClientDocumentCategory,
  type ClientDocumentInput,
} from '../../shared/clientDocuments';
import { OperationIcon, type OperationIconName } from '../operations/OperationIcon';
import { useUnsavedDraft } from '../unsaved/unsaved';
import './DocumentsPage.css';

const CATEGORY_LABELS: Record<ClientDocumentCategory, string> = {
  contract: 'Contrats',
  quote: 'Devis',
  invoice: 'Factures',
  brief: 'Briefs',
  content: 'Contenus',
  technical: 'Technique',
  legal: 'Juridique',
  other: 'Autres',
};

const CATEGORY_ICONS: Record<ClientDocumentCategory, OperationIconName> = {
  contract: 'file-text',
  quote: 'receipt',
  invoice: 'file-text',
  brief: 'file-text',
  content: 'image',
  technical: 'code',
  legal: 'archive',
  other: 'folder',
};

interface DocumentWithClient extends ClientDocument {
  clientLabel: string;
}

interface DocumentForm {
  category: ClientDocumentCategory;
  title: string;
  retentionCode: string;
  retentionReason: string;
  retentionUntil: string;
  notes: string;
}

function emptyForm(): DocumentForm {
  return {
    category: 'other',
    title: '',
    retentionCode: '',
    retentionReason: '',
    retentionUntil: '',
    notes: '',
  };
}

function formFromDocument(item: ClientDocument): DocumentForm {
  return {
    category: item.category,
    title: item.title,
    retentionCode: item.retentionCode ?? '',
    retentionReason: item.retentionReason ?? '',
    retentionUntil: item.retentionUntil ? item.retentionUntil.slice(0, 10) : '',
    notes: item.notes ?? '',
  };
}

function asInput(form: DocumentForm): ClientDocumentInput {
  return {
    category: form.category,
    title: form.title.trim(),
    retentionCode: form.retentionCode.trim() || null,
    retentionReason: form.retentionReason.trim() || null,
    retentionUntil: form.retentionUntil || null,
    notes: form.notes.trim() || null,
  };
}

function dateLabel(value?: string | null): string {
  return value ? new Date(value).toLocaleDateString('fr-FR') : '—';
}

function sizeLabel(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 Ko';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
  return `${(bytes / 1024 / 1024).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo`;
}

function retentionNeedsAttention(item: ClientDocument): boolean {
  if (item.missing) return true;
  if (!item.retentionUntil) return false;
  const limit = new Date();
  limit.setDate(limit.getDate() + 30);
  return new Date(item.retentionUntil).getTime() <= limit.getTime();
}

export function DocumentsPage({ onEntityReady, onMessage, initialDocumentId, initialRequest, initialContractTypeId }: { onMessage: (message: string) => void; initialDocumentId?: string | null;initialRequest?:number; initialContractTypeId?: string | null;onEntityReady?:EntityReady }) {
  const [libraryOpen,setLibraryOpen]=useState(!!initialContractTypeId);
  useEffect(()=>{if(initialContractTypeId)setLibraryOpen(true);},[initialContractTypeId]);
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [items, setItems] = useState<DocumentWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(initialDocumentId ?? '');
  const [expanded, setExpanded] = useState(false);
  const [splitPercent, setSplitPercent] = useState(38);
  const [query, setQuery] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | ClientDocumentCategory>('all');
  const [archiveFilter, setArchiveFilter] = useState<'active' | 'archived' | 'all'>('active');
  const [createOpen, setCreateOpen] = useState(false);
  const [createClientId, setCreateClientId] = useState('');
  const [createForm, setCreateForm] = useState<DocumentForm>(() => emptyForm());
  const [editForm, setEditForm] = useState<DocumentForm>(() => emptyForm());
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const refreshEpoch=useRef(0);useEffect(()=>()=>{refreshEpoch.current++;},[]);
  async function refresh(preferredId?: string): Promise<void> {
    const epoch=++refreshEpoch.current;
    setLoading(true);
    try {
      const nextClients = await window.atoumweb.crm.clients.list({ includeArchived: true });
      const batches = await Promise.all(nextClients.map(async (client) => {
        const docs = await window.atoumweb.clientDocuments.list(client.id, true);
        return docs.map<DocumentWithClient>((document) => ({ ...document, clientLabel: client.displayName }));
      }));
      const nextItems = batches.flat().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      if(epoch!==refreshEpoch.current)return;
      setClients(nextClients);
      setItems(nextItems);
      const requested = preferredId ?? selectedId ?? initialDocumentId ?? '';
      if (requested && nextItems.some((item) => item.id === requested)) setSelectedId(requested);
      else if (requested) {setSelectedId('');onEntityReady?.('client_document',requested,'Document introuvable.');}
      const firstImportable = nextClients.find((client) => !client.archivedAt && client.status !== 'archived');
      if (!createClientId && firstImportable) setCreateClientId(firstImportable.id);
    } catch (error) {
      if(epoch!==refreshEpoch.current)return;
      if(preferredId)onEntityReady?.('client_document',preferredId,error instanceof Error?error.message:'Documents indisponibles.');
      onMessage(error instanceof Error ? error.message : 'Impossible de charger les documents.');
    } finally {
      if(epoch===refreshEpoch.current)setLoading(false);
    }
  }

  useEffect(() => { if(initialDocumentId){setLibraryOpen(false);setCreateOpen(false);} void refresh(initialDocumentId ?? undefined); }, [initialDocumentId,initialRequest]);

  const selected = items.find((item) => item.id === selectedId) ?? null;
  const draft = useUnsavedDraft('Documents : métadonnées non enregistrées', createOpen ? createForm : editForm, {
    group: 'Documents',
    ready: createOpen || (!!selected && editing),
    resetKey: createOpen ? 'new-document' : selected?.id ?? null,
    pending: busy,
    dirty: createOpen
      ? JSON.stringify(createForm) !== JSON.stringify(emptyForm())
      : !!selected && editing && JSON.stringify(editForm) !== JSON.stringify(formFromDocument(selected)),
    discard: (baseline) => {
      if (createOpen) setCreateForm(baseline);
      else setEditForm(baseline);
    },
  });
  useSearchTargetConfirmation('client_document',libraryOpen||createOpen?null:selected?.id,loading,onEntityReady);


  useEffect(() => {
    if (!selected) return;
    setEditForm(formFromDocument(selected));
    setEditing(false);
  }, [selected?.id]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('fr-FR');
    return items.filter((item) => {
      if (clientFilter !== 'all' && item.clientAccountId !== clientFilter) return false;
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (archiveFilter === 'active' && item.archivedAt) return false;
      if (archiveFilter === 'archived' && !item.archivedAt) return false;
      if (!needle) return true;
      return [
        item.title,
        item.fileName,
        item.clientLabel,
        CATEGORY_LABELS[item.category],
        item.notes ?? '',
        item.retentionReason ?? '',
      ].some((value) => value.toLocaleLowerCase('fr-FR').includes(needle));
    });
  }, [items, query, clientFilter, categoryFilter, archiveFilter]);

  const importableClients = clients.filter((client) => !client.archivedAt && client.status !== 'archived');
  const activeItems = items.filter((item) => !item.archivedAt);
  const contractCount = activeItems.filter((item) => item.category === 'contract').length;
  const invoiceCount = activeItems.filter((item) => item.category === 'invoice').length;
  const attentionCount = activeItems.filter(retentionNeedsAttention).length;

  function beginResize(): void {
    const workspace = document.querySelector<HTMLElement>('.documents-workspace.with-detail');
    if (!workspace) return;
    document.body.classList.add('documents-resizing');
    const onMove = (event: PointerEvent) => {
      const rect = workspace.getBoundingClientRect();
      if (!rect.width) return;
      const ratio = ((event.clientX - rect.left) / rect.width) * 100;
      setSplitPercent(Math.max(20, Math.min(58, ratio)));
    };
    const onUp = () => {
      document.body.classList.remove('documents-resizing');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
  }

  async function importDocument(): Promise<void> {
    if (!createClientId) {
      onMessage('Choisis d’abord un client.');
      return;
    }
    if (!createForm.title.trim()) {
      onMessage('Le titre du document est requis.');
      return;
    }
    setBusy(true);
    try {
      const before = new Set(items.map((item) => item.id));
      const next = await window.atoumweb.clientDocuments.importFiles(createClientId, asInput(createForm));
      const created = next.find((item) => !before.has(item.id));
      if (!created) {
        onMessage('Import annulé.');
        return;
      }
      await refresh(created.id);
      setSelectedId(created.id);
      setCreateOpen(false);
      setExpanded(false);
      setCreateForm(emptyForm());
      onMessage('Document importé et classé dans le dossier client.');
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible d’importer le document.');
    } finally {
      setBusy(false);
    }
  }

  async function saveDocument(): Promise<void> {
    if (!selected) return;
    if (!editForm.title.trim()) {
      onMessage('Le titre du document est requis.');
      return;
    }
    setBusy(true);
    try {
      await window.atoumweb.clientDocuments.update(selected.id, asInput(editForm));
      await refresh(selected.id);
      setEditing(false);
      onMessage('Document mis à jour.');
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de modifier le document.');
    } finally {
      setBusy(false);
    }
  }

  async function openSelectedDocument(): Promise<void> {
    if (!selected || selected.missing) return;
    try {
      await window.atoumweb.clientDocuments.openFile(selected.id);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible d’ouvrir le document. Vérifie sa présence et son empreinte.');
    }
  }

  async function toggleArchive(): Promise<void> {
    if (!selected) return;
    setBusy(true);
    try {
      await window.atoumweb.clientDocuments.archive(selected.id, !selected.archivedAt);
      await refresh(selected.id);
      onMessage(selected.archivedAt ? 'Document restauré.' : 'Document archivé.');
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de modifier l’archivage.');
    } finally {
      setBusy(false);
    }
  }

  async function deletePermanently(): Promise<void> {
    if (!selected?.archivedAt) return;
    setBusy(true);
    try {
      const result = await window.atoumweb.clientDocuments.deletePermanently(selected.id);
      if (!result.cancelled) {
        setSelectedId('');
        setExpanded(false);
        await refresh();
        onMessage('Document supprimé définitivement.');
      }
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de supprimer le document.');
    } finally {
      setBusy(false);
    }
  }

  const showDetail = Boolean(selected || createOpen);

  if(libraryOpen)return <ContractLibraryPage onClose={()=>draft.request(() => setLibraryOpen(false))} initialTypeId={initialContractTypeId==='all'?null:initialContractTypeId} onMessage={onMessage}/>;
  return <div className="documents-page-stack">
    <div className="documents-entry-grid" aria-label="Accès aux espaces documentaires">
      <button type="button" className="documents-entry" onClick={() => draft.request(() => setLibraryOpen(true))}>
        <OperationIcon name="file-text" size={22} />
        <strong>Bibliothèque contractuelle</strong>
        <small>Types, clauses et versions canoniques existants</small>
      </button>
      <button type="button" className="documents-entry" onClick={() => draft.request(() => setLibraryOpen(true))}>
        <OperationIcon name="code" size={22} />
        <strong>Éditeur contractuel</strong>
        <small>Brouillons et modules dans la bibliothèque existante</small>
      </button>
      <button type="button" className="documents-entry" onClick={() => draft.request(() => document.querySelector('.documents-toolbar')?.scrollIntoView({ block: 'start', behavior: 'smooth' }))}>
        <OperationIcon name="folder" size={22} />
        <strong>Documents clients</strong>
        <small>Fichiers réels et archives, classés par client</small>
      </button>
      <div className="documents-entry documents-entry-unavailable" role="note">
        <OperationIcon name="archive" size={22} />
        <strong>Autres documents</strong>
        <small>Dépôt général hors Client non encore disponible : aucun stockage implicite</small>
      </div>
    </div>
    <div className="documents-kpi-grid">
      <DocumentKpi icon="folder" label="Documents actifs" value={activeItems.length} helper="Tous les fichiers clients" />
      <DocumentKpi icon="file-text" label="Contrats" value={contractCount} helper="Documents contractuels" />
      <DocumentKpi icon="receipt" label="Factures actives" value={invoiceCount} helper="Documents de facture non archivés, sans statut de paiement" />
      <DocumentKpi icon={attentionCount ? 'alert' : 'check-circle'} label="À surveiller" value={attentionCount} helper={attentionCount ? 'Conservation ou fichier manquant' : 'Aucun point documentaire'} />
    </div>

    <div className="documents-toolbar">
      <div><strong>{filtered.length}</strong><span> document{filtered.length > 1 ? 's' : ''}</span></div>
      <div className="toolbar-controls">
        <button className="secondary-button" type="button" onClick={() => draft.request(() => { void refresh(); })}><OperationIcon name="refresh" size={16} /> Actualiser</button>
        <input className="inline-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher document, client, fichier…" />
        <select value={clientFilter} onChange={(event) => setClientFilter(event.target.value)}>
          <option value="all">Tous les clients</option>
          {importableClients.map((client) => <option key={client.id} value={client.id}>{client.displayName}</option>)}
        </select>
        <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as 'all' | ClientDocumentCategory)}>
          <option value="all">Tous les types</option>
          {CLIENT_DOCUMENT_CATEGORIES.map((category) => <option key={category} value={category}>{CATEGORY_LABELS[category]}</option>)}
        </select>
        <select value={archiveFilter} onChange={(event) => setArchiveFilter(event.target.value as 'active' | 'archived' | 'all')}>
          <option value="active">Actifs</option>
          <option value="archived">Archivés</option>
          <option value="all">Tous les statuts</option>
        </select>
        <button className="primary-button" type="button" onClick={() => draft.request(() => { setCreateOpen(true); setSelectedId(''); setExpanded(false); setEditing(false); })}><OperationIcon name="upload" size={16} /> + Document</button>
      </div>
    </div>

    <div
      className={`documents-workspace ${showDetail ? 'with-detail' : ''} ${expanded ? 'detail-expanded' : ''}`}
      style={showDetail && !expanded ? { gridTemplateColumns: `${splitPercent}% 8px minmax(0, 1fr)` } : undefined}
    >
      {!expanded && <article className="panel documents-list-panel">
        {loading ? <p className="muted documents-loading">Chargement des documents…</p> : showDetail ? <div className="documents-compact-list">
          {filtered.map((item) => <button key={item.id} type="button" className={`documents-compact-item ${selectedId === item.id ? 'selected' : ''}`} onClick={() => draft.request(() => { setCreateOpen(false); setSelectedId(item.id); })}>
            <div className="documents-compact-heading"><span className="documents-type-icon"><OperationIcon name={CATEGORY_ICONS[item.category]} size={15} /></span><strong>{item.title}</strong>{item.archivedAt && <span className="status-pill">Archivé</span>}</div>
            <span>{item.clientLabel}</span>
            <small>{CATEGORY_LABELS[item.category]} · {sizeLabel(item.sizeBytes)}{item.missing ? ' · Fichier introuvable' : ''}</small>
          </button>)}
          {!filtered.length && <p className="muted documents-empty">Aucun document dans cette vue.</p>}
        </div> : <div className="documents-table-wrap">
          <ConfiguredDataTable<(typeof filtered)[number]> scope="documents-list" store={window.atoumweb.visualPreferences} rows={filtered} selectedId={selectedId} getId={item=>item.id} onSelect={item=>draft.request(() => setSelectedId(item.id))} className="documents-table" caption="Document · Client · Type · Fichier · Mise à jour · État · source complète des résultats filtrés" columns={[
{id:"identity",label:"Document",required:true,sortValue:item=>item.title??null,render:item=><><div className="documents-table-title"><span className="documents-type-icon"><OperationIcon name={CATEGORY_ICONS[item.category]} size={16} /></span><strong>{item.title}</strong></div></>},
{id:"client",label:"Client",sortValue:item=>item.clientLabel??null,render:item=><>{item.clientLabel}</>},
{id:"category",label:"Type",sortValue:item=>item.category??null,render:item=><>{CATEGORY_LABELS[item.category]}</>},
{id:"file",label:"Fichier",sortValue:item=>item.fileName??null,render:item=><><span>{item.fileName}</span><small>{sizeLabel(item.sizeBytes)}</small></>},
{id:"updated",label:"Mise à jour",sortValue:item=>item.updatedAt??null,render:item=><>{dateLabel(item.updatedAt)}</>},
{id:"status",label:"État",render:item=><>{item.archivedAt ? <span className="status-pill">Archivé</span> : item.missing ? <span className="status-pill danger">Fichier manquant</span> : <span className="status-pill success">Disponible</span>}</>},
{id:'open',label:'Ouvrir',required:true,render:item=><button type="button" className="link-button" aria-label={'Ouvrir '+String(item.title??item.id)} onClick={event=>{event.stopPropagation();((item:(typeof filtered)[number])=>draft.request(() => setSelectedId(item.id)))(item);}}><OperationIcon name="record-open"/></button>}
]}/>
          {!filtered.length && <p className="muted documents-empty">Aucun document dans cette vue.</p>}
        </div>}
      </article>}

      {showDetail && !expanded && <div className="documents-splitter" role="separator" aria-orientation="vertical" aria-label="Redimensionner la liste et la fiche" tabIndex={0} onPointerDown={beginResize} onDoubleClick={() => setSplitPercent(38)} onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') setSplitPercent((value) => Math.max(20, value - 3));
        if (event.key === 'ArrowRight') setSplitPercent((value) => Math.min(58, value + 3));
      }}><span /></div>}

      {createOpen && <article className="panel documents-detail-panel">
        <div className="documents-detail-header">
          <div><span className="eyebrow">Nouveau document</span><h2>Importer et classer</h2><p>Le fichier sera copié dans le dossier Documents du client.</p></div>
          <div className="documents-detail-actions"><button className="operation-detail-expand" type="button" title={expanded ? 'Réduire' : 'Agrandir'} onClick={() => setExpanded((value) => !value)}><OperationIcon name={expanded ? 'collapse' : 'expand'} size={18} /></button><button className="close-detail" type="button" title="Fermer" onClick={() => draft.request(() => { setCreateOpen(false); setExpanded(false); })}><OperationIcon name="close" size={18} /></button></div>
        </div>
        <div className="documents-form">
          <label>Client<select value={createClientId} onChange={(event) => setCreateClientId(event.target.value)}>{clients.map((client) => <option key={client.id} value={client.id}>{client.displayName}</option>)}</select></label>
          <label>Type<select value={createForm.category} onChange={(event) => setCreateForm((current) => ({ ...current, category: event.target.value as ClientDocumentCategory }))}>{CLIENT_DOCUMENT_CATEGORIES.map((category) => <option key={category} value={category}>{CATEGORY_LABELS[category]}</option>)}</select></label>
          <label className="documents-form-wide">Titre<input value={createForm.title} onChange={(event) => setCreateForm((current) => ({ ...current, title: event.target.value }))} placeholder="Ex. Contrat de maintenance 2026" /></label>
          <label>Conservation jusqu’au<input type="date" value={createForm.retentionUntil} onChange={(event) => setCreateForm((current) => ({ ...current, retentionUntil: event.target.value }))} /></label>
          <label>Code de conservation<input value={createForm.retentionCode} onChange={(event) => setCreateForm((current) => ({ ...current, retentionCode: event.target.value }))} placeholder="Facultatif" /></label>
          <label className="documents-form-wide">Motif de conservation<input value={createForm.retentionReason} onChange={(event) => setCreateForm((current) => ({ ...current, retentionReason: event.target.value }))} placeholder="Facultatif" /></label>
          <label className="documents-form-wide">Notes<textarea value={createForm.notes} onChange={(event) => setCreateForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Informations utiles sur le document…" /></label>
        </div>
        <div className="documents-form-footer"><span className="muted">Le sélecteur de fichier s’ouvrira à l’étape suivante.</span><button className="primary-button" type="button" disabled={busy || !createClientId || !createForm.title.trim()} onClick={() => void importDocument()}><OperationIcon name="upload" size={16} /> {busy ? 'Import…' : 'Choisir le fichier et importer'}</button></div>
      </article>}

      {selected && !createOpen && <article className={`panel documents-detail-panel ${expanded ? 'expanded' : ''}`}>
        <div className="documents-detail-header">
          <div><span className="eyebrow">{CATEGORY_LABELS[selected.category]}</span><h2>{selected.title}</h2><p>{selected.clientLabel}</p></div>
          <div className="documents-detail-actions"><button className="operation-detail-expand" type="button" title={expanded ? 'Réduire' : 'Agrandir'} onClick={() => setExpanded((value) => !value)}><OperationIcon name={expanded ? 'collapse' : 'expand'} size={18} /></button><button className="close-detail" type="button" title="Fermer" onClick={() => draft.request(() => { setSelectedId(''); setExpanded(false); setEditing(false); })}><OperationIcon name="close" size={18} /></button></div>
        </div>

        <div className="documents-status-row">
          <span className="documents-category-pill"><OperationIcon name={CATEGORY_ICONS[selected.category]} size={15} /> {CATEGORY_LABELS[selected.category]}</span>
          {selected.archivedAt ? <span className="status-pill">Archivé</span> : selected.missing ? <span className="status-pill danger">Fichier introuvable</span> : <span className="status-pill success">Disponible</span>}
          {retentionNeedsAttention(selected) && !selected.missing && <span className="status-pill warning">Conservation à vérifier</span>}
        </div>

        <div className="documents-meta-grid">
          <div><span>Nom du fichier</span><strong>{selected.fileName}</strong></div>
          <div><span>Taille</span><strong>{sizeLabel(selected.sizeBytes)}</strong></div>
          <div><span>Ajouté le</span><strong>{dateLabel(selected.createdAt)}</strong></div>
          <div><span>Mis à jour le</span><strong>{dateLabel(selected.updatedAt)}</strong></div>
        </div>

        <div className="documents-primary-actions">
          <button className="primary-button" type="button" disabled={selected.missing} onClick={() => { void openSelectedDocument(); }}><OperationIcon name="external-link" size={16} /> Ouvrir le document</button>
          <button className="secondary-button" type="button" onClick={() => void window.atoumweb.clientDocuments.openFolder(selected.clientAccountId)}><OperationIcon name="folder" size={16} /> Ouvrir le dossier client</button>
          <button className="secondary-button" type="button" onClick={() => draft.request(() => setEditing((value) => !value))}>{editing ? 'Annuler' : 'Modifier'}</button>
        </div>

        {editing ? <div className="documents-form documents-edit-form">
          <label>Type<select value={editForm.category} onChange={(event) => setEditForm((current) => ({ ...current, category: event.target.value as ClientDocumentCategory }))}>{CLIENT_DOCUMENT_CATEGORIES.map((category) => <option key={category} value={category}>{CATEGORY_LABELS[category]}</option>)}</select></label>
          <label className="documents-form-wide">Titre<input value={editForm.title} onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))} /></label>
          <label>Conservation jusqu’au<input type="date" value={editForm.retentionUntil} onChange={(event) => setEditForm((current) => ({ ...current, retentionUntil: event.target.value }))} /></label>
          <label>Code de conservation<input value={editForm.retentionCode} onChange={(event) => setEditForm((current) => ({ ...current, retentionCode: event.target.value }))} /></label>
          <label className="documents-form-wide">Motif de conservation<input value={editForm.retentionReason} onChange={(event) => setEditForm((current) => ({ ...current, retentionReason: event.target.value }))} /></label>
          <label className="documents-form-wide">Notes<textarea value={editForm.notes} onChange={(event) => setEditForm((current) => ({ ...current, notes: event.target.value }))} /></label>
          <div className="documents-form-wide documents-form-footer"><span /><button className="primary-button" type="button" disabled={busy || !editForm.title.trim()} onClick={() => void saveDocument()}>Enregistrer</button></div>
        </div> : <div className="documents-info-sections">
          <section><div><span>Conservation</span><strong>{selected.retentionUntil ? dateLabel(selected.retentionUntil) : 'Aucune échéance renseignée'}</strong></div>{selected.retentionCode && <p><b>Code :</b> {selected.retentionCode}</p>}{selected.retentionReason && <p><b>Motif :</b> {selected.retentionReason}</p>}</section>
          <section><div><span>Notes</span><strong>{selected.notes || 'Aucune note'}</strong></div></section>
          <section><div><span>Empreinte SHA-256</span><strong>{selected.sha256 ? 'Empreinte enregistrée' : 'Absente — intégrité historique non certifiée'}</strong></div>{selected.sha256 && <p className="documents-sha256" title={selected.sha256}>{selected.sha256}</p>}{selected.importedFrom && <p><b>Provenance :</b> {selected.importedFrom}</p>}</section>
          <section><div><span>Classement local</span><strong>{selected.relativePath}</strong></div></section>
        </div>}

        <div className="documents-danger-zone">
          <button className="secondary-button" type="button" disabled={busy} onClick={() => draft.request(() => { void toggleArchive(); })}><OperationIcon name="archive" size={16} /> {selected.archivedAt ? 'Restaurer' : 'Archiver'}</button>
          {selected.archivedAt && <button className="secondary-button danger-outline" type="button" disabled={busy} onClick={() => draft.request(() => { void deletePermanently(); })}>Supprimer définitivement</button>}
        </div>
      </article>}
    </div>
  </div>;
}

function DocumentKpi({ icon, label, value, helper }: { icon: OperationIconName; label: string; value: number; helper: string }) {
  return <article><span className="documents-kpi-icon"><OperationIcon name={icon} size={27} /></span><div><strong>{label}</strong><span>{value}</span><small>{helper}</small></div></article>;
}
