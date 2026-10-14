import { describe, expect, it } from 'vitest';
import { buildStatisticsEvidence, statisticsEvidenceTotal } from './statisticsEvidence';

describe('statistiques : preuve détaillée des KPI', () => {
  it('restitue exactement les mêmes identifiants et unités sans inventer un encaissement', () => {
    const rows = buildStatisticsEvidence({
      acceptedQuotes: [
        { id: 'q2', number: 'DEV-2', subject: 'Site', contractValueCents: 52999, acceptedAt: '2026-10-10' },
        { id: 'q3', number: 'DEV-3', subject: 'Support', contractValueCents: 1001, acceptedAt: '2026-10-11' },
      ],
      invoices: [
        { id: 'b4', invoiceReference: 'ABBY-4', description: 'Facture suivie', expectedAmountCents: 45050, invoicedAt: '2026-10-12' },
      ],
      sessions: [
        { id: 's1', activityLabel: 'Intervention', category: 'development', durationSeconds: 3600, startedAt: '2026-10-10T08:00:00' },
        { id: 's2', activityLabel: 'Appel', category: 'meeting', durationSeconds: 600, startedAt: '2026-10-11T18:00:00' },
      ],
      newClients: [{ id: 'c1', displayName: 'Client réel', becameClientAt: '2026-10-10' }],
    });
    expect(rows.signed.map((row) => row.id)).toEqual(['q2', 'q3']);
    expect(rows.invoiced.map((row) => row.id)).toEqual(['b4']);
    expect(rows.time.map((row) => row.id)).toEqual(['s1', 's2']);
    expect(rows.clients.map((row) => row.id)).toEqual(['c1']);
    expect(statisticsEvidenceTotal(rows.signed)).toBe(54000);
    expect(statisticsEvidenceTotal(rows.invoiced)).toBe(45050);
    expect(statisticsEvidenceTotal(rows.time)).toBe(4200);
    expect(statisticsEvidenceTotal(rows.clients)).toBe(1);
    expect(rows.signed[0].businessDate).toBe('2026-10-10');
    expect(rows.invoiced[0].businessDate).toBe('2026-10-12');
    expect(rows.time[0].businessDate).toBe('2026-10-10T08:00:00');
  });

  it('différencie explicitement une cohorte vide dun chiffre indisponible', () => {
    const rows = buildStatisticsEvidence({ acceptedQuotes: [], invoices: [], sessions: [], newClients: [] });
    expect(statisticsEvidenceTotal(rows.signed)).toBe(0);
    expect(rows.invoiced).toEqual([]);
  });
});
