import { useEffect, useMemo, useState } from 'react';
import {
  BILLING_ITEM_SOURCE_TYPES,
  BILLING_ITEM_STATUSES,
  type BillingItem,
  type BillingItemSourceType,
  type BillingItemStatus,
} from '../../shared/billing';
import { OperationIcon, type OperationIconName } from '../operations/OperationIcon';

const STATUS_LABELS: Record<BillingItemStatus, string> = {
  planned: 'Prévu',
  ready: 'À facturer',
  invoiced: 'Facturé',
  cancelled: 'Annulé',
  offered: 'Offert',
};

const SOURCE_LABELS: Record<BillingItemSourceType, string> = {
  quote_deposit: 'Acompte devis',
  project_balance: 'Solde projet',
  intervention: 'Intervention',
  maintenance_overage: 'Dépassement maintenance',
  hour_pack: 'Pack d’heures',
  subscription: 'Abonnement',
  other: 'Autre',
};

const SOURCE_ICONS: Record<BillingItemSourceType, OperationIconName> = {
  quote_deposit: 'file-text',
  project_balance: 'wallet',
  intervention: 'wrench',
  maintenance_overage: 'maintenance',
  hour_pack: 'clock',
  subscription: 'repeat',
  other: 'receipt',
};

function money(cents: number): string {
  return `${(cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;
}

function dateLabel(value?: string | null): string {
  return value ? new Date(value).toLocaleDateString('fr-FR') : '—';
}

function dateInput(value?: string | null): string {
  if (!value) return new Date().toISOString().slice(0, 10);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function invoiceDateIso(value: string): string | null {
  if (!value) return null;
  return new Date(`${value}T12:00:00`).toISOString();
}

export function BillingPage({ onMessage }: { onMessage: (message: string) => void }) {
  const [items, setItems] = useState<BillingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | BillingItemStatus>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | BillingItemSourceType>('all');
  const [splitPercent, setSplitPercent] = useState(38);
  const [expanded, setExpanded] = useState(false);
  const [invoiceReference, setInvoiceReference] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => dateInput());
  const [busy, setBusy] = useState(false);

  async function refresh(): Promise<void> {
    setLoading(true);
    try {
      const next = await window.atoumweb.billing.list();
      setItems(next);
      if (selectedId && !next.some((item) => item.id === selectedId)) {
        setSelectedId('');
        setExpanded(false);
      }
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de charger la facturation.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  const selected = items.find((item) => item.id === selectedId) ?? null;

  useEffect(() => {
    setInvoiceReference(selected?.invoiceReference ?? '');
    setInvoiceDate(dateInput(selected?.invoicedAt));
  }, [selected?.id, selected?.invoiceReference, selected?.invoicedAt]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('fr-FR');
    return items.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (sourceFilter !== 'all' && item.sourceType !== sourceFilter) return false;
      if (!needle) return true;
      return [
        item.clientLabel,
        item.projectLabel ?? '',
        item.description,
        item.invoiceReference ?? '',
        item.invoiceFileName ?? '',
        SOURCE_LABELS[item.sourceType],
        STATUS_LABELS[item.status],
      ].some((value) => value.toLocaleLowerCase('fr-FR').includes(needle));
    });
  }, [items, query, sourceFilter, statusFilter]);

  const readyItems = items.filter((item) => item.status === 'ready' || item.status === 'planned');
  const invoicedItems = items.filter((item) => item.status === 'invoiced');
  const offeredItems = items.filter((item) => item.status === 'offered');
  const amountToPrepare = readyItems.reduce((sum, item) => sum + item.expectedAmountCents, 0);

  async function changeStatus(status: BillingItemStatus): Promise<void> {
    if (!selected || status === 'invoiced') return;
    setBusy(true);
    try {
      const updated = await window.atoumweb.billing.changeStatus(selected.id, status);
      await refresh();
      setSelectedId(updated.id);
      onMessage(`Statut mis à jour : ${STATUS_LABELS[updated.status]}.`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de modifier le statut.');
    } finally {
      setBusy(false);
    }
  }

  async function importInvoice(): Promise<void> {
    if (!selected) return;
    setBusy(true);
    try {
      const updated = await window.atoumweb.billing.importInvoice(selected.id, {
        reference: invoiceReference.trim() || null,
        invoicedAt: invoiceDateIso(invoiceDate),
      });
      if (!updated) return;
      await refresh();
      setSelectedId(updated.id);
      onMessage('Facture PDF importée : l’élément est maintenant marqué « Facturé ».');
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible d’importer la facture PDF.');
    } finally {
      setBusy(false);
    }
  }

  async function saveInvoiceMetadata(): Promise<void> {
    if (!selected?.invoiceDocumentId) return;
    setBusy(true);
    try {
      const updated = await window.atoumweb.billing.updateInvoiceMetadata(selected.id, {
        reference: invoiceReference.trim() || null,
        invoicedAt: invoiceDateIso(invoiceDate),
      });
      await refresh();
      setSelectedId(updated.id);
      onMessage('Informations de facture mises à jour.');
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de modifier les informations de facture.');
    } finally {
      setBusy(false);
    }
  }

  async function openInvoice(): Promise<void> {
    if (!selected?.invoiceDocumentId) return;
    try {
      await window.atoumweb.billing.openInvoice(selected.id);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible d’ouvrir la facture PDF.');
    }
  }

  function beginResize(): void {
    const workspace = document.querySelector<HTMLElement>('.billing-workspace.with-detail');
    if (!workspace) return;
    document.body.classList.add('billing-resizing');
    const onMove = (event: PointerEvent) => {
      const rect = workspace.getBoundingClientRect();
      if (!rect.width) return;
      const ratio = ((event.clientX - rect.left) / rect.width) * 100;
      setSplitPercent(Math.max(20, Math.min(58, ratio)));
    };
    const onUp = () => {
      document.body.classList.remove('billing-resizing');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
  }

  return <div className="billing-page-stack">
    <section className="billing-guidance-strip">
      <div className="billing-guidance-icon" aria-hidden="true"><OperationIcon name="file-text" size={27} /></div>
      <div>
        <span className="eyebrow">Facturation sans API</span>
        <strong>Abby crée la facture · AtoumWeb Manager conserve le suivi et le PDF client</strong>
        <p>Quand la facture est créée dans Abby, importe simplement son PDF ici. Il sera aussi classé dans le dossier Factures du client.</p>
      </div>
    </section>

    <section className="billing-kpi-grid" aria-label="Synthèse facturation">
      <article><span className="billing-kpi-icon" aria-hidden="true"><OperationIcon name="receipt" size={27} /></span><div><strong>À facturer</strong><span>{readyItems.length}</span><small>{money(amountToPrepare)} à préparer</small></div></article>
      <article><span className="billing-kpi-icon" aria-hidden="true"><OperationIcon name="check-circle" size={27} /></span><div><strong>Facturé</strong><span>{invoicedItems.length}</span><small>PDF rattaché et archivé</small></div></article>
      <article><span className="billing-kpi-icon" aria-hidden="true"><OperationIcon name="gift" size={27} /></span><div><strong>Offert</strong><span>{offeredItems.length}</span><small>Gestes commerciaux / valeur offerte</small></div></article>
      <article><span className="billing-kpi-icon" aria-hidden="true"><OperationIcon name="euro" size={28} /></span><div><strong>Montant à préparer</strong><span>{money(amountToPrepare)}</span><small>Éléments prévus ou prêts</small></div></article>
    </section>

    <div className="module-toolbar billing-toolbar">
      <div><strong>{filtered.length}</strong><span> élément(s)</span></div>
      <div className="toolbar-controls">
        <button className="secondary-button" type="button" onClick={() => void refresh()}><OperationIcon name="refresh" size={16} /> Actualiser</button>
        <input className="inline-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher client, projet, facture…" />
        <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value as typeof sourceFilter)}>
          <option value="all">Toutes les origines</option>
          {BILLING_ITEM_SOURCE_TYPES.map((source) => <option key={source} value={source}>{SOURCE_LABELS[source]}</option>)}
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
          <option value="all">Tous les statuts</option>
          {BILLING_ITEM_STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
        </select>
      </div>
    </div>

    {loading ? <section className="panel"><p className="muted">Chargement de la facturation…</p></section> : <div
      className={selected ? `billing-workspace with-detail ${expanded ? 'detail-expanded' : ''}` : 'billing-workspace'}
      style={selected && !expanded ? { gridTemplateColumns: `${splitPercent}% 8px minmax(0, 1fr)` } : undefined}
    >
      {!expanded && <section className="panel billing-list-panel">
        {selected ? <div className="billing-compact-list" role="list" aria-label="Éléments de facturation">
          {filtered.map((item) => <button key={item.id} type="button" role="listitem" className={`billing-compact-item ${item.id === selected.id ? 'selected' : ''}`} onClick={() => setSelectedId(item.id)}>
            <span className="billing-compact-heading"><strong>{item.clientLabel}</strong><span className={`billing-status status-${item.status}`}>{STATUS_LABELS[item.status]}</span></span>
            <span className="billing-compact-description">{item.description}</span>
            <span className="billing-compact-meta"><span><OperationIcon name={SOURCE_ICONS[item.sourceType]} size={15} /> {SOURCE_LABELS[item.sourceType]}</span><span>{money(item.expectedAmountCents)}</span></span>
            <span className="billing-compact-project">{item.projectLabel || 'Sans projet dédié'}</span>
          </button>)}
          {filtered.length === 0 && <div className="empty-table">Aucun élément de facturation.</div>}
        </div> : <div className="billing-table-wrap"><table className="billing-table"><thead><tr><th>Client</th><th>Origine</th><th>Description</th><th>Projet</th><th>Montant</th><th>Statut</th><th>Facture</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id} onClick={() => { setSelectedId(item.id); setExpanded(false); }}><td><strong>{item.clientLabel}</strong></td><td><span className="billing-source-pill"><OperationIcon name={SOURCE_ICONS[item.sourceType]} size={15} />{SOURCE_LABELS[item.sourceType]}</span></td><td>{item.description}</td><td>{item.projectLabel || '—'}</td><td>{money(item.expectedAmountCents)}</td><td><span className={`billing-status status-${item.status}`}>{STATUS_LABELS[item.status]}</span></td><td>{item.invoiceFileName ? <span className="billing-pdf-present"><OperationIcon name="file-text" size={14} /> PDF</span> : <span className="muted">—</span>}</td></tr>)}{filtered.length === 0 && <tr><td colSpan={7}><div className="empty-table">Aucun élément de facturation.</div></td></tr>}</tbody></table></div>}
      </section>}

      {selected && !expanded && <div className="billing-splitter" role="separator" aria-orientation="vertical" aria-label="Redimensionner la liste et la fiche" tabIndex={0} onPointerDown={beginResize} onDoubleClick={() => setSplitPercent(38)} onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') setSplitPercent((value) => Math.max(20, value - 3));
        if (event.key === 'ArrowRight') setSplitPercent((value) => Math.min(58, value + 3));
      }}><span /></div>}

      {selected && <aside className={`panel billing-detail-panel ${expanded ? 'expanded' : ''}`}>
        <div className="detail-panel-heading billing-detail-heading">
          <div><span className="eyebrow">Facturation</span><h2>{selected.description}</h2><p className="muted">{selected.clientLabel}{selected.projectLabel ? ` · ${selected.projectLabel}` : ''}</p></div>
          <div className="billing-detail-heading-actions"><button className="operation-detail-expand" type="button" title={expanded ? 'Réduire la fiche' : 'Agrandir la fiche'} aria-label={expanded ? 'Réduire la fiche' : 'Agrandir la fiche'} onClick={() => setExpanded((value) => !value)}><OperationIcon name={expanded ? 'collapse' : 'expand'} size={18} /></button><button className="close-detail" type="button" title="Fermer" aria-label="Fermer" onClick={() => { setSelectedId(''); setExpanded(false); }}><OperationIcon name="close" size={18} /></button></div>
        </div>

        <div className="billing-detail-badges">
          <span className={`billing-status status-${selected.status}`}>{STATUS_LABELS[selected.status]}</span>
          <span className="billing-source-pill"><OperationIcon name={SOURCE_ICONS[selected.sourceType]} size={15} />{SOURCE_LABELS[selected.sourceType]}</span>
        </div>

        <div className="billing-summary-grid">
          <div><strong>Montant attendu</strong><span>{money(selected.expectedAmountCents)}</span></div>
          <div><strong>Valeur théorique</strong><span>{money(selected.theoreticalValueCents)}</span></div>
          <div><strong>Échéance</strong><span>{dateLabel(selected.dueAt)}</span></div>
          <div><strong>Projet</strong><span>{selected.projectLabel || 'Aucun projet'}</span></div>
        </div>

        <details className="billing-section" open>
          <summary><span><strong>Facture PDF Abby</strong><small>Le PDF client est la preuve documentaire conservée dans AtoumWeb Manager</small></span></summary>
          <div className="billing-section-body">
            <div className={`billing-invoice-state ${selected.invoiceDocumentId ? 'attached' : ''}`}>
              <span className="billing-invoice-icon" aria-hidden="true"><OperationIcon name="file-text" size={25} /></span>
              <div><strong>{selected.invoiceFileName || 'Aucune facture PDF rattachée'}</strong><small>{selected.invoiceDocumentId ? `Importée le ${dateLabel(selected.invoicedAt)} · classée dans Documents client / Factures` : 'Crée d’abord la facture dans Abby, puis importe le PDF téléchargé.'}</small></div>
            </div>

            <div className="billing-invoice-fields">
              <label>Référence facture<input value={invoiceReference} onChange={(event) => setInvoiceReference(event.target.value)} placeholder="Ex. FA-2026-001" /></label>
              <label>Date de facture<input type="date" value={invoiceDate} onChange={(event) => setInvoiceDate(event.target.value)} /></label>
            </div>

            <div className="button-row billing-invoice-actions">
              <button className="primary-button" type="button" disabled={busy} onClick={() => void importInvoice()}>{selected.invoiceDocumentId ? <><OperationIcon name="upload" size={16} /> Remplacer le PDF</> : <><OperationIcon name="upload" size={16} /> Importer la facture PDF</>}</button>
              {selected.invoiceDocumentId && <button className="secondary-button" type="button" onClick={() => void openInvoice()}><OperationIcon name="external-link" size={16} /> Ouvrir la facture</button>}
              {selected.invoiceDocumentId && <button className="secondary-button" type="button" disabled={busy} onClick={() => void saveInvoiceMetadata()}>Enregistrer les informations</button>}
            </div>
          </div>
        </details>

        <details className="billing-section" open>
          <summary><span><strong>Pilotage</strong><small>Changer l’état tant qu’aucune facture PDF n’est rattachée</small></span></summary>
          <div className="billing-section-body">
            {selected.invoiceDocumentId ? <p className="billing-locked-status">✓ Facturé · le statut est verrouillé par la présence de la facture PDF.</p> : <label className="billing-status-field">Statut<select value={selected.status} disabled={busy} onChange={(event) => void changeStatus(event.target.value as BillingItemStatus)}>{BILLING_ITEM_STATUSES.filter((status) => status !== 'invoiced').map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}</select></label>}
          </div>
        </details>

        <details className="billing-section">
          <summary><span><strong>Origine & notes</strong><small>Contexte ayant créé cet élément de facturation</small></span></summary>
          <div className="billing-section-body">
            <div className="billing-origin-line"><strong>Origine</strong><span>{SOURCE_LABELS[selected.sourceType]}</span></div>
            <div className="billing-origin-line"><strong>Référence source</strong><span>{selected.sourceKey}</span></div>
            {selected.notes ? <div className="billing-note"><strong>Notes</strong><p>{selected.notes}</p></div> : <p className="muted">Aucune note complémentaire.</p>}
          </div>
        </details>

        <div className="billing-meta">
          <span>Créé : {dateLabel(selected.createdAt)}</span>
          <span>Mis à jour : {dateLabel(selected.updatedAt)}</span>
          {selected.invoicedAt && <span>Facturé : {dateLabel(selected.invoicedAt)}</span>}
        </div>
      </aside>}
    </div>}
  </div>;
}
