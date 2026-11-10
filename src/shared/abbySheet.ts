import type { QuoteDetail } from './commercial';
import type { QuoteContractParameters } from './quoteContractPreparation';
import { quotePaymentSchedule } from './quotePaymentSchedule';

/**
 * Lot 4 — fiche « À recopier dans Abby ».
 * Abby reste la source des factures : cette fiche reprend seulement ce que prévoit le devis
 * (client, lignes, total, échéances). Elle ne dit jamais qu'une somme a été payée.
 */
export interface AbbySheetLine { label: string; quantity: string; unitPrice: string; total: string; }
export interface AbbySheetPayment { label: string; amount: string; when: string; }
export interface AbbySheet {
  reference: string;
  client: string[];
  lines: AbbySheetLine[];
  total: string;
  payments: AbbySheetPayment[];
  /** Blocs de texte prêts à coller, dans l'ordre d'affichage. */
  text: { client: string; lines: string; payments: string };
}

const money = (cents: number) => `${(cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const quantity = (milli: number | undefined, unit: unknown) => `${((milli ?? 1000) / 1000).toLocaleString('fr-FR')}${typeof unit === 'string' && unit.trim() && unit !== 'unité' ? ' ' + unit.trim() : ''}`;

export function abbySheet(quote: QuoteDetail, parameters: QuoteContractParameters | null): AbbySheet {
  const r = quote.recipient;
  const client = (r ? [
    r.name, r.contactName ? `À l’attention de ${r.contactName}` : '', r.addressLine1 ?? '', r.addressLine2 ?? '',
    [r.postalCode, r.city].filter(Boolean).join(' '), r.country ?? '', r.identification ?? '', r.contactEmail || r.email || '',
  ] : [quote.ownerLabel]).map(value => value.trim()).filter(Boolean);

  const lines = quote.lines.map(line => ({
    label: (typeof line.snapshot?.abbyLabel === 'string' && line.snapshot.abbyLabel.trim()) || line.label,
    quantity: quantity(line.quantityMilli, line.snapshot?.unit),
    unitPrice: money(line.proposedUnitPriceCents ?? 0),
    total: money(line.contractLineValueCents),
  }));

  const schedule = parameters
    ? quotePaymentSchedule(parameters, quote.lines.map(line => ({ id: line.id, label: line.label, contractLineValueCents: line.contractLineValueCents, snapshot: line.snapshot ?? null })), quote.contractValueCents)
    : [];
  const payments = schedule.map(m => ({
    label: `${m.lineLabel ? m.lineLabel + ' — ' : ''}${m.label} (${m.percent} %)`,
    amount: money(m.amountCents),
    when: m.dueDate ? new Date(m.dueDate).toLocaleDateString('fr-FR') : m.event.trim() || 'À convenir',
  }));

  return {
    reference: `${quote.number} — ${quote.subject}`,
    client, lines, total: money(quote.contractValueCents), payments,
    text: {
      client: client.join('\n'),
      lines: [...lines.map(l => `${l.label}\t${l.quantity}\t${l.unitPrice}\t${l.total}`), `Total\t\t\t${money(quote.contractValueCents)}`].join('\n'),
      payments: payments.map(p => `${p.label} : ${p.amount} — ${p.when}`).join('\n'),
    },
  };
}
