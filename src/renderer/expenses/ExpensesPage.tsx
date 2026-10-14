
import { useEffect, useMemo, useState } from 'react';
import type { ClientSummary } from '../../shared/crm';
import {
  EXPENSE_CATEGORIES,
  EXPENSE_FREQUENCIES,
  EXPENSE_STATUSES,
  type Expense,
  type ExpenseReceiptVersion,
  type ExpenseCategory,
  type ExpenseFrequency,
  type ExpenseInput,
  type ExpenseStatus,
} from '../../shared/expenses';
import type { ProjectSummary } from '../../shared/projects';
import { OperationIcon, type OperationIconName } from '../operations/OperationIcon';

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  hosting: 'Hébergement',
  domain: 'Nom de domaine',
  software: 'Logiciel / SaaS',
  license: 'Licence',
  subcontracting: 'Sous-traitance',
  advertising: 'Publicité',
  travel: 'Déplacement',
  equipment: 'Matériel',
  banking: 'Banque / frais',
  tax: 'Taxe / contribution',
  office: 'Bureau',
  other: 'Autre',
};

const CATEGORY_ICONS: Record<ExpenseCategory, OperationIconName> = {
  hosting: 'server',
  domain: 'external-link',
  software: 'code',
  license: 'file-text',
  subcontracting: 'external-link',
  advertising: 'alert',
  travel: 'external-link',
  equipment: 'package',
  banking: 'euro',
  tax: 'receipt',
  office: 'folder',
  other: 'receipt',
};

const STATUS_LABELS: Record<ExpenseStatus, string> = {
  planned: 'Prévu',
  committed: 'Engagé',
  paid: 'Payé',
  cancelled: 'Annulé',
};

const FREQUENCY_LABELS: Record<ExpenseFrequency, string> = {
  none: 'Ponctuelle',
  monthly: 'Mensuelle',
  quarterly: 'Trimestrielle',
  yearly: 'Annuelle',
};

function money(cents: number): string {
  return (cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' €';
}

function dateLabel(value?: string | null): string {
  return value ? new Date(value).toLocaleDateString('fr-FR') : '—';
}

function dateInput(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function toIso(value: string): string | null {
  if (!value) return null;
  return new Date(value + 'T12:00:00').toISOString();
}

function todayInput(): string {
  return dateInput(new Date().toISOString());
}

interface ExpenseFormState {
  clientAccountId: string;
  projectId: string;
  category: ExpenseCategory;
  supplier: string;
  label: string;
  amount: string;
  vat: string;
  status: ExpenseStatus;
  expenseDate: string;
  dueAt: string;
  paidAt: string;
  frequency: ExpenseFrequency;
  nextDueAt: string;
  notes: string;
}

function emptyForm(): ExpenseFormState {
  return {
    clientAccountId: '',
    projectId: '',
    category: 'software',
    supplier: '',
    label: '',
    amount: '',
    vat: '',
    status: 'committed',
    expenseDate: todayInput(),
    dueAt: '',
    paidAt: '',
    frequency: 'none',
    nextDueAt: '',
    notes: '',
  };
}

function formFromExpense(item: Expense): ExpenseFormState {
  return {
    clientAccountId: item.clientAccountId ?? '',
    projectId: item.projectId ?? '',
    category: item.category,
    supplier: item.supplier ?? '',
    label: item.label,
    amount: String(item.amountCents / 100).replace('.', ','),
    vat: item.vatCents == null ? '' : String(item.vatCents / 100).replace('.', ','),
    status: item.status,
    expenseDate: dateInput(item.expenseDate),
    dueAt: dateInput(item.dueAt),
    paidAt: dateInput(item.paidAt),
    frequency: item.frequency ?? 'none',
    nextDueAt: dateInput(item.nextDueAt),
    notes: item.notes ?? '',
  };
}

export function ExpensesPage({ onMessage }: { onMessage: (message: string) => void }) {
  const [items, setItems] = useState<Expense[]>([]);
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [splitPercent, setSplitPercent] = useState(38);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | ExpenseCategory>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ExpenseStatus>('all');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'project' | 'client' | 'internal'>('all');
  const [form, setForm] = useState<ExpenseFormState>(() => emptyForm());
  const [busy, setBusy] = useState(false);
  const [receiptVersions, setReceiptVersions] = useState<ExpenseReceiptVersion[]>([]);

  async function refresh(): Promise<void> {
    setLoading(true);
    try {
      const [nextItems, nextClients, nextProjects] = await Promise.all([
        window.atoumweb.expenses.list(),
        window.atoumweb.crm.clients.list(),
        window.atoumweb.projects.projects.list(),
      ]);
      setItems(nextItems);
      setClients(nextClients);
      setProjects(nextProjects);
      if (selectedId && !nextItems.some((item) => item.id === selectedId)) {
        setSelectedId('');
        setExpanded(false);
      }
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de charger les dépenses.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  const selected = items.find((item) => item.id === selectedId) ?? null;
  useEffect(() => {
    let active = true;
    setReceiptVersions([]);
    if (!selectedId) return () => { active = false; };
    void window.atoumweb.expenses.listReceiptVersions(selectedId)
      .then((versions) => { if (active) setReceiptVersions(versions); })
      .catch((error) => { if (active) onMessage(error instanceof Error ? error.message : 'Historique indisponible.'); });
    return () => { active = false; };
  }, [selectedId, items.find((item) => item.id === selectedId)?.updatedAt]);


  useEffect(() => {
    if (selected && !createOpen) setForm(formFromExpense(selected));
  }, [selected?.id, selected?.updatedAt, createOpen]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('fr-FR');
    return items.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (scopeFilter === 'project' && !item.projectId) return false;
      if (scopeFilter === 'client' && (!item.clientAccountId || item.projectId)) return false;
      if (scopeFilter === 'internal' && item.clientAccountId) return false;
      if (!needle) return true;
      return [
        item.label,
        item.supplier ?? '',
        item.clientLabel ?? '',
        item.projectLabel ?? '',
        item.projectNumber ?? '',
        CATEGORY_LABELS[item.category],
        STATUS_LABELS[item.status],
      ].some((value) => value.toLocaleLowerCase('fr-FR').includes(needle));
    });
  }, [items, query, categoryFilter, statusFilter, scopeFilter]);

  const monthStart = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  }, []);
  const monthEnd = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
  }, []);

  const monthItems = items.filter((item) => {
    const value = new Date(item.expenseDate).getTime();
    return value >= monthStart && value < monthEnd && (item.status === 'committed' || item.status === 'paid');
  });
  const committedThisMonth = monthItems.reduce((sum, item) => sum + item.amountCents, 0);
  const toPay = items.filter((item) => item.status === 'committed').reduce((sum, item) => sum + item.amountCents, 0);
  const paidThisMonth = items.filter((item) => {
    if (item.status !== 'paid' || !item.paidAt) return false;
    const value = new Date(item.paidAt).getTime();
    return value >= monthStart && value < monthEnd;
  }).reduce((sum, item) => sum + item.amountCents, 0);
  const recurring = items.filter((item) => item.frequency !== 'none' && item.status !== 'cancelled');
  const recurringMonthlyEquivalent = recurring.reduce((sum, item) => {
    if (item.frequency === 'monthly') return sum + item.amountCents;
    if (item.frequency === 'quarterly') return sum + Math.round(item.amountCents / 3);
    if (item.frequency === 'yearly') return sum + Math.round(item.amountCents / 12);
    return sum;
  }, 0);

  const availableProjects = form.clientAccountId
    ? projects.filter((project) => project.clientAccountId === form.clientAccountId && project.status !== 'archived')
    : projects.filter((project) => project.status !== 'archived');

  function updateForm<K extends keyof ExpenseFormState>(key: K, value: ExpenseFormState[K]): void {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function buildInput(): ExpenseInput {
    const amount = Number(form.amount.replace(',', '.'));
    const vat = form.vat.trim() ? Number(form.vat.replace(',', '.')) : null;
    if (!Number.isFinite(amount) || amount < 0) throw new Error('Renseigne un montant valide.');
    if (vat != null && (!Number.isFinite(vat) || vat < 0)) throw new Error('Renseigne une TVA valide.');
    return {
      clientAccountId: form.clientAccountId || null,
      projectId: form.projectId || null,
      category: form.category,
      supplier: form.supplier.trim() || null,
      label: form.label.trim(),
      amountCents: Math.round(amount * 100),
      vatCents: vat == null ? null : Math.round(vat * 100),
      status: form.status,
      expenseDate: toIso(form.expenseDate) || new Date().toISOString(),
      dueAt: toIso(form.dueAt),
      paidAt: form.status === 'paid' ? toIso(form.paidAt) : null,
      frequency: form.frequency,
      nextDueAt: form.frequency === 'none' ? null : toIso(form.nextDueAt),
      notes: form.notes.trim() || null,
    };
  }

  async function saveExpense(): Promise<void> {
    setBusy(true);
    try {
      const input = buildInput();
      const saved = createOpen
        ? await window.atoumweb.expenses.create(input)
        : selected
          ? await window.atoumweb.expenses.update(selected.id, input)
          : null;
      if (!saved) return;
      await refresh();
      setSelectedId(saved.id);
      setCreateOpen(false);
      setExpanded(false);
      onMessage(createOpen ? 'Dépense créée.' : 'Dépense mise à jour.');
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible d’enregistrer la dépense.');
    } finally {
      setBusy(false);
    }
  }

  async function markPaid(): Promise<void> {
    if (!selected) return;
    setBusy(true);
    try {
      const updated = await window.atoumweb.expenses.changeStatus(selected.id, 'paid');
      await refresh();
      setSelectedId(updated.id);
      onMessage('Dépense marquée comme payée.');
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de modifier le statut.');
    } finally {
      setBusy(false);
    }
  }

  async function importReceipt(): Promise<void> {
    if (!selected) return;
    setBusy(true);
    try {
      const updated = await window.atoumweb.expenses.importReceipt(selected.id);
      if (!updated) return;
      await refresh();
      setSelectedId(updated.id);
      setReceiptVersions(await window.atoumweb.expenses.listReceiptVersions(updated.id));
      onMessage('Justificatif importé.');
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible d’importer le justificatif.');
    } finally {
      setBusy(false);
    }
  }

  async function openReceipt(): Promise<void> {
    if (!selected?.receiptRelativePath) return;
    try {
      await window.atoumweb.expenses.openReceipt(selected.id);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible d’ouvrir le justificatif.');
    }
  }

  function openCreate(): void {
    setCreateOpen(true);
    setSelectedId('');
    setExpanded(false);
    setForm(emptyForm());
  }

  function beginResize(): void {
    const workspace = document.querySelector<HTMLElement>('.expenses-workspace.with-detail');
    if (!workspace) return;
    document.body.classList.add('expenses-resizing');
    const onMove = (event: PointerEvent) => {
      const rect = workspace.getBoundingClientRect();
      if (!rect.width) return;
      const ratio = ((event.clientX - rect.left) / rect.width) * 100;
      setSplitPercent(Math.max(20, Math.min(58, ratio)));
    };
    const onUp = () => {
      document.body.classList.remove('expenses-resizing');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
  }

  const detailOpen = Boolean(selected || createOpen);

  return <div className="expenses-page-stack">
    <section className="expenses-kpi-grid" aria-label="Synthèse des dépenses">
      <article><span className="expenses-kpi-icon" aria-hidden="true"><OperationIcon name="euro" size={28} /></span><div><strong>Engagé ce mois</strong><span>{money(committedThisMonth)}</span><small>{monthItems.length} dépense(s)</small></div></article>
      <article><span className="expenses-kpi-icon" aria-hidden="true"><OperationIcon name="clock" size={27} /></span><div><strong>À payer</strong><span>{money(toPay)}</span><small>Dépenses engagées non réglées</small></div></article>
      <article><span className="expenses-kpi-icon" aria-hidden="true"><OperationIcon name="check-circle" size={27} /></span><div><strong>Payé ce mois</strong><span>{money(paidThisMonth)}</span><small>Règlements enregistrés</small></div></article>
      <article><span className="expenses-kpi-icon" aria-hidden="true"><OperationIcon name="repeat" size={27} /></span><div><strong>Récurrent mensuel</strong><span>{money(recurringMonthlyEquivalent)}</span><small>{recurring.length} dépense(s) récurrente(s)</small></div></article>
    </section>

    <div className="module-toolbar expenses-toolbar">
      <div><strong>{filtered.length}</strong><span> dépense(s)</span></div>
      <div className="toolbar-controls">
        <button className="secondary-button" type="button" onClick={() => void refresh()}><OperationIcon name="refresh" size={16} /> Actualiser</button>
        <input className="inline-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher fournisseur, client, projet…" />
        <select value={scopeFilter} onChange={(event) => setScopeFilter(event.target.value as typeof scopeFilter)}>
          <option value="all">Tous les rattachements</option>
          <option value="project">Liées à un projet</option>
          <option value="client">Liées à un client</option>
          <option value="internal">AtoumWeb interne</option>
        </select>
        <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as typeof categoryFilter)}>
          <option value="all">Toutes les catégories</option>
          {EXPENSE_CATEGORIES.map((category) => <option key={category} value={category}>{CATEGORY_LABELS[category]}</option>)}
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
          <option value="all">Tous les statuts</option>
          {EXPENSE_STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
        </select>
        <button className="primary-button" type="button" onClick={openCreate}>+ Dépense</button>
      </div>
    </div>

    {loading ? <section className="panel"><p className="muted">Chargement des dépenses…</p></section> : <div
      className={detailOpen ? 'expenses-workspace with-detail' + (expanded ? ' detail-expanded' : '') : 'expenses-workspace'}
      style={detailOpen && !expanded ? { gridTemplateColumns: String(splitPercent) + '% 8px minmax(0, 1fr)' } : undefined}
    >
      {!expanded && <section className="panel expenses-list-panel">
        {detailOpen ? <div className="expenses-compact-list" role="list" aria-label="Dépenses">
          {filtered.map((item) => <button key={item.id} type="button" role="listitem" className={'expenses-compact-item' + (selected?.id === item.id ? ' selected' : '')} onClick={() => { setCreateOpen(false); setSelectedId(item.id); }}>
            <span className="expenses-compact-heading"><strong>{item.label}</strong><span className={'expense-status status-' + item.status}>{STATUS_LABELS[item.status]}</span></span>
            <span className="expenses-compact-meta"><span><OperationIcon name={CATEGORY_ICONS[item.category]} size={15} /> {CATEGORY_LABELS[item.category]}</span><span>{money(item.amountCents)}</span></span>
            <span className="expenses-compact-scope">{item.projectNumber ? item.projectNumber + ' · ' + item.projectLabel : item.clientLabel || 'AtoumWeb interne'}</span>
            <span className="expenses-compact-supplier">{item.supplier || 'Fournisseur non renseigné'}</span>
          </button>)}
          {filtered.length === 0 && <div className="empty-table">Aucune dépense dans cette vue.</div>}
        </div> : <div className="expenses-table-wrap"><table className="expenses-table"><thead><tr><th>Date</th><th>Dépense</th><th>Catégorie</th><th>Client / Projet</th><th>Montant</th><th>Statut</th><th>Justificatif</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id} onClick={() => { setSelectedId(item.id); setCreateOpen(false); setExpanded(false); }}><td>{dateLabel(item.expenseDate)}</td><td><strong>{item.label}</strong><small>{item.supplier || '—'}</small></td><td><span className="expense-category-pill"><OperationIcon name={CATEGORY_ICONS[item.category]} size={15} /> {CATEGORY_LABELS[item.category]}</span></td><td>{item.projectNumber ? item.projectNumber + ' · ' + item.projectLabel : item.clientLabel || 'AtoumWeb interne'}</td><td>{money(item.amountCents)}</td><td><span className={'expense-status status-' + item.status}>{STATUS_LABELS[item.status]}</span></td><td>{item.receiptFileName ? <span className="expense-receipt-present"><OperationIcon name="file-text" size={14} /> Oui</span> : <span className="muted">—</span>}</td></tr>)}{filtered.length === 0 && <tr><td colSpan={7}><div className="empty-table">Aucune dépense.</div></td></tr>}</tbody></table></div>}
      </section>}

      {detailOpen && !expanded && <div className="expenses-splitter" role="separator" aria-orientation="vertical" aria-label="Redimensionner la liste et la fiche" tabIndex={0} onPointerDown={beginResize} onDoubleClick={() => setSplitPercent(38)} onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') setSplitPercent((value) => Math.max(20, value - 3));
        if (event.key === 'ArrowRight') setSplitPercent((value) => Math.min(58, value + 3));
      }}><span /></div>}

      {detailOpen && <aside className={'panel expenses-detail-panel' + (expanded ? ' expanded' : '')}>
        <div className="detail-panel-heading">
          <div><span className="eyebrow">{createOpen ? 'Nouvelle dépense' : 'Dépense'}</span><h2>{createOpen ? 'Enregistrer un frais' : selected?.label}</h2><p className="muted">{createOpen ? 'AtoumWeb interne, client ou projet.' : selected?.projectNumber ? selected.projectNumber + ' · ' + selected.projectLabel : selected?.clientLabel || 'AtoumWeb interne'}</p></div>
          <div className="expenses-detail-heading-actions"><button className="operation-detail-expand" type="button" title={expanded ? 'Réduire la fiche' : 'Agrandir la fiche'} aria-label={expanded ? 'Réduire la fiche' : 'Agrandir la fiche'} onClick={() => setExpanded((value) => !value)}><OperationIcon name={expanded ? 'collapse' : 'expand'} size={18} /></button><button className="close-detail" type="button" title="Fermer" aria-label="Fermer" onClick={() => { setCreateOpen(false); setSelectedId(''); setExpanded(false); }}><OperationIcon name="close" size={18} /></button></div>
        </div>

        {!createOpen && selected && <div className="expenses-detail-badges">
          <span className={'expense-status status-' + selected.status}>{STATUS_LABELS[selected.status]}</span>
          <span className="expense-category-pill">{CATEGORY_ICONS[selected.category]} {CATEGORY_LABELS[selected.category]}</span>
          {selected.frequency !== 'none' && <span className="status-pill"><OperationIcon name="repeat" size={14} /> {FREQUENCY_LABELS[selected.frequency]}</span>}
        </div>}

        {!createOpen && selected && <div className="expenses-summary-grid">
          <div><strong>Montant</strong><span>{money(selected.amountCents)}</span></div>
          <div><strong>TVA</strong><span>{selected.vatCents == null ? '—' : money(selected.vatCents)}</span></div>
          <div><strong>Date</strong><span>{dateLabel(selected.expenseDate)}</span></div>
          <div><strong>Échéance</strong><span>{dateLabel(selected.dueAt)}</span></div>
        </div>}

        <details className="expense-section" open>
          <summary><span><strong>Informations</strong><small>Nature, montant, fournisseur et dates</small></span></summary>
          <div className="expense-section-body expenses-form-grid">
            <label className="wide">Libellé<input value={form.label} onChange={(event) => updateForm('label', event.target.value)} placeholder="Ex. Licence Divi annuelle" /></label>
            <label>Catégorie<select value={form.category} onChange={(event) => updateForm('category', event.target.value as ExpenseCategory)}>{EXPENSE_CATEGORIES.map((category) => <option key={category} value={category}>{CATEGORY_LABELS[category]}</option>)}</select></label>
            <label>Fournisseur<input value={form.supplier} onChange={(event) => updateForm('supplier', event.target.value)} placeholder="Ex. Elegant Themes" /></label>
            <label>Montant TTC (€)<input type="number" min="0" step="0.01" value={form.amount.replace(',', '.')} onChange={(event) => updateForm('amount', event.target.value)} /></label>
            <label>TVA incluse (€)<input type="number" min="0" step="0.01" value={form.vat.replace(',', '.')} onChange={(event) => updateForm('vat', event.target.value)} placeholder="Facultatif" /></label>
            <label>Date de dépense<input type="date" value={form.expenseDate} onChange={(event) => updateForm('expenseDate', event.target.value)} /></label>
            <label>Échéance<input type="date" value={form.dueAt} onChange={(event) => updateForm('dueAt', event.target.value)} /></label>
            <label>Statut<select value={form.status} onChange={(event) => updateForm('status', event.target.value as ExpenseStatus)}>{EXPENSE_STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}</select></label>
            {form.status === 'paid' && <label>Date de paiement<input type="date" value={form.paidAt} onChange={(event) => updateForm('paidAt', event.target.value)} /></label>}
          </div>
        </details>

        <details className="expense-section" open>
          <summary><span><strong>Rattachement</strong><small>Associer le frais à un client ou à un projet pour suivre sa rentabilité</small></span></summary>
          <div className="expense-section-body expenses-form-grid">
            <label>Client<select value={form.clientAccountId} onChange={(event) => { updateForm('clientAccountId', event.target.value); updateForm('projectId', ''); }}><option value="">AtoumWeb interne / aucun client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.displayName}</option>)}</select></label>
            <label>Projet<select value={form.projectId} onChange={(event) => {
              const projectId = event.target.value;
              const project = projects.find((candidate) => candidate.id === projectId);
              setForm((current) => ({ ...current, projectId, clientAccountId: project?.clientAccountId ?? current.clientAccountId }));
            }}><option value="">Aucun projet</option>{availableProjects.map((project) => <option key={project.id} value={project.id}>{project.number} · {project.name}</option>)}</select></label>
          </div>
        </details>

        <details className="expense-section">
          <summary><span><strong>Récurrence & notes</strong><small>Abonnements, renouvellements et contexte interne</small></span></summary>
          <div className="expense-section-body expenses-form-grid">
            <label>Fréquence<select value={form.frequency} onChange={(event) => updateForm('frequency', event.target.value as ExpenseFrequency)}>{EXPENSE_FREQUENCIES.map((frequency) => <option key={frequency} value={frequency}>{FREQUENCY_LABELS[frequency]}</option>)}</select></label>
            {form.frequency !== 'none' && <label>Prochaine échéance<input type="date" value={form.nextDueAt} onChange={(event) => updateForm('nextDueAt', event.target.value)} /></label>}
            <label className="wide">Notes<textarea rows={4} value={form.notes} onChange={(event) => updateForm('notes', event.target.value)} placeholder="Informations utiles, conditions, motif…" /></label>
          </div>
        </details>

        {!createOpen && selected && <details className="expense-section" open>
          <summary><span><strong>Justificatif</strong><small>Facture fournisseur, ticket ou preuve du frais</small></span></summary>
          <div className="expense-section-body">
            <div className={'expense-receipt-card' + (selected.receiptFileName ? ' attached' : '')}>
              <span className="expense-receipt-icon" aria-hidden="true"><OperationIcon name="file-text" size={24} /></span>
              <div><strong>{selected.receiptFileName || 'Aucun justificatif rattaché'}</strong><small>{selected.receiptFileName ? (selected.receiptMissing ? 'Fichier introuvable · à relocaliser manuellement.' : 'Document conservé dans le workspace AtoumWeb.') : 'PDF ou image : facture fournisseur, reçu ou ticket.'}</small></div>
            </div>
            <div className="button-row">
              <button className="primary-button" type="button" disabled={busy} onClick={() => void importReceipt()}>{selected.receiptFileName ? '▤ Remplacer le justificatif' : '▤ Importer un justificatif'}</button>
              {selected.receiptFileName && !selected.receiptMissing && <button className="secondary-button" type="button" onClick={() => void openReceipt()}>↗ Ouvrir</button>}
            </div>
            {receiptVersions.length > 0 && (
              <section aria-label="Historique des justificatifs">
                <strong>Versions enregistrées ({receiptVersions.length})</strong>
                <ul>
                  {receiptVersions.map((version, index) => (
                    <li key={version.relativePath + index}>
                      {version.fileName} — {({
                        verified: 'Intégrité vérifiée',
                        unknown: 'Intégrité non certifiée',
                        missing: 'Fichier manquant',
                        modified: 'Fichier modifié',
                      } as const)[version.integrity]}
                      {version.integrity === 'verified' && selected && (
                        <button type="button" className="secondary-button" onClick={() => {
                          void window.atoumweb.expenses.openReceiptVersion(selected.id, version.relativePath)
                            .catch((error) => onMessage(error instanceof Error ? error.message : 'Ouverture impossible.'));
                        }}>Ouvrir la version</button>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </details>}

        <div className="expenses-detail-actions">
          <button className="primary-button" type="button" disabled={busy || !form.label.trim() || !form.amount.trim()} onClick={() => void saveExpense()}>{createOpen ? 'Créer la dépense' : 'Enregistrer'}</button>
          {!createOpen && selected && selected.status !== 'paid' && selected.status !== 'cancelled' && <button className="secondary-button" type="button" disabled={busy} onClick={() => void markPaid()}>✓ Marquer payé</button>}
        </div>

        {!createOpen && selected && <div className="expenses-meta"><span>Créée : {dateLabel(selected.createdAt)}</span><span>Mise à jour : {dateLabel(selected.updatedAt)}</span>{selected.paidAt && <span>Payée : {dateLabel(selected.paidAt)}</span>}</div>}
      </aside>}
    </div>}
  </div>;
}
