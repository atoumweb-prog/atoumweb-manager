import type { QuoteSummary } from './commercial';
import type { BillingItem } from './billing';
import type { TimeSession } from './time';
import type { ClientSummary } from './crm';

export type StatisticsEvidenceKey = 'signed' | 'invoiced' | 'time' | 'clients';
export type StatisticsEvidenceUnit = 'cents' | 'seconds' | 'count';

export interface StatisticsEvidenceRow {
  id: string;
  label: string;
  detail: string;
  businessDate: string | null;
  value: number;
  unit: StatisticsEvidenceUnit;
}

/**
 * Cohortes de détail issues exactement des éléments déjà retenus par le calcul
 * de la vue simple (statut courant et date métier). Aucune navigation externe
 * ne peut être présentée comme un filtre équivalent sans contrat de routeur.
 */
export function buildStatisticsEvidence(input: {
  acceptedQuotes: ReadonlyArray<Pick<QuoteSummary, 'id' | 'number' | 'subject' | 'contractValueCents' | 'acceptedAt'>>;
  invoices: ReadonlyArray<Pick<BillingItem, 'id' | 'description' | 'invoiceReference' | 'expectedAmountCents' | 'invoicedAt'>>;
  sessions: ReadonlyArray<Pick<TimeSession, 'id' | 'activityLabel' | 'category' | 'durationSeconds' | 'startedAt'>>;
  newClients: ReadonlyArray<Pick<ClientSummary, 'id' | 'displayName' | 'becameClientAt'>>;
}): Record<StatisticsEvidenceKey, StatisticsEvidenceRow[]> {
  return {
    signed: input.acceptedQuotes.map((quote) => ({
      id: quote.id, label: quote.number,
      detail: quote.subject,
      businessDate: quote.acceptedAt ?? null,
      value: quote.contractValueCents, unit: 'cents',
    })),
    invoiced: input.invoices.map((invoice) => ({
      id: invoice.id,
      label: invoice.invoiceReference || invoice.description,
      detail: invoice.description,
      businessDate: invoice.invoicedAt ?? null,
      value: invoice.expectedAmountCents, unit: 'cents',
    })),
    time: input.sessions.map((session) => ({
      id: session.id,
      label: session.activityLabel || session.category.replace(/_/g, ' '),
      detail: session.category.replace(/_/g, ' '),
      businessDate: session.startedAt,
      value: session.durationSeconds, unit: 'seconds',
    })),
    clients: input.newClients.map((client) => ({
      id: client.id, label: client.displayName, detail: 'Nouvelle fiche Client',
      businessDate: client.becameClientAt, value: 1, unit: 'count',
    })),
  };
}

export function statisticsEvidenceTotal(rows: readonly StatisticsEvidenceRow[]): number {
  return rows.reduce((sum, row) => sum + row.value, 0);
}
