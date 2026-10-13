import { describe, expect, it } from 'vitest';
import { activePipelineColumn, historyOutcome, isHistoricalConversion, projectPipeline, PROSPECT_PIPELINE_COLUMNS } from './prospectPipelineProjection';

describe('lot 03B — projection CRM sans mutation', () => {
  it('affiche six colonnes actives, dont Finalisation non assignable tant que E73 est ouvert', () => {
    expect(PROSPECT_PIPELINE_COLUMNS.map((column) => column.label)).toEqual([
      'À qualifier', 'Besoins', 'Préparer le devis', 'Attente du retour', 'Négociation', 'Finalisation',
    ]);
    expect(PROSPECT_PIPELINE_COLUMNS[5].stages).toEqual([]);
  });

  it('ne projette pas new, gagné, perdu, archivé ni converti dans les colonnes actives', () => {
    expect(activePipelineColumn({ id: 'new', stage: 'new' })).toBeNull();
    expect(activePipelineColumn({ id: 'won', stage: 'won' })).toBeNull();
    expect(activePipelineColumn({ id: 'lost', stage: 'lost' })).toBeNull();
    expect(activePipelineColumn({ id: 'archive', stage: 'qualifying', archivedAt: '2026-10-13' })).toBeNull();
    expect(activePipelineColumn({ id: 'converted', stage: 'negotiation', clientAccountId: 'client-1' })).toBeNull();
  });

  it('E73 : seule une confirmation explicite sur le devis courant projette en Finalisation, sans convertir', () => {
    const prospect = { id: 'p', stage: 'negotiation' as const };
    expect(activePipelineColumn(prospect)).toBe('negotiation');
    expect(activePipelineColumn({ ...prospect, finalizationQuoteId: 'quote-current' })).toBe('finalization');
    expect(projectPipeline([{ ...prospect, finalizationQuoteId: 'quote-current' }]).columns.map((col) => col.prospects.length))
      .toEqual([0, 0, 0, 0, 0, 1]);
    expect(activePipelineColumn({ id: 'new', stage: 'new', finalizationQuoteId: 'quote' })).toBeNull();
    expect(activePipelineColumn({ id: 'won', stage: 'won', finalizationQuoteId: 'quote' })).toBeNull();
    expect(activePipelineColumn({ id: 'archived', stage: 'quote_sent', archivedAt: '2026-10-13', finalizationQuoteId: 'quote' })).toBeNull();
    expect(activePipelineColumn({ id: 'unprepared', stage: 'qualifying', finalizationQuoteId: 'quote' })).toBe('qualify');
  });

  it('projette les étapes backend existantes sans inventer un statut Finalisation', () => {
    expect(activePipelineColumn({ id: 'a', stage: 'qualifying' })).toBe('qualify');
    expect(activePipelineColumn({ id: 'b', stage: 'need_identified' })).toBe('needs');
    expect(activePipelineColumn({ id: 'c', stage: 'quote_to_send' })).toBe('quote');
    expect(activePipelineColumn({ id: 'd', stage: 'follow_up' })).toBe('reply');
    expect(activePipelineColumn({ id: 'e', stage: 'negotiation' })).toBe('negotiation');
  });

  it('sépare les conversions réellement liées des dossiers perdus, gagnés sans lien et archivés non convertis', () => {
    const prospects = [
      { id: 'converti', stage: 'won' as const, clientAccountId: 'client-01' },
      { id: 'archive-converti', stage: 'won' as const, clientAccountId: 'client-02', archivedAt: '2026-10-10' },
      { id: 'gagne-sans-client', stage: 'won' as const },
      { id: 'perdu', stage: 'lost' as const },
      { id: 'nouveau', stage: 'new' as const },
    ];
    expect(projectPipeline(prospects).conversions.map((prospect) => prospect.id)).toEqual(['converti', 'archive-converti']);
    expect(projectPipeline(prospects).columns.every((column) => column.prospects.length === 0)).toBe(true);
  });

  it('distingue un Client converti, un dossier perdu et un dossier archivé non vendu', () => {
    expect(historyOutcome({ id: 'c', stage: 'won', clientAccountId: 'client-1' })).toEqual({ label: 'Converti en client', kind: 'converted' });
    expect(historyOutcome({ id: 'l', stage: 'lost' })).toEqual({ label: 'Perdu', kind: 'lost' });
    expect(historyOutcome({ id: 'a', stage: 'qualifying', archivedAt: '2026-10-13' })).toEqual({ label: 'Archivé', kind: 'archived' });
    expect(historyOutcome({ id: 'w', stage: 'won' })).toEqual({ label: 'Gagné (sans compte client)', kind: 'won' });
    expect(historyOutcome({ id: 'linked', stage: 'negotiation', clientAccountId: 'client-2' }).kind).toBe('converted');
  });

  it('compte un prospect une seule fois et réserve Conversion aux comptes clients liés', () => {
    const prospects = [
      { id: 'a', stage: 'qualifying' as const },
      { id: 'b', stage: 'negotiation' as const },
      { id: 'c', stage: 'won' as const, clientAccountId: 'client-1' },
      { id: 'd', stage: 'lost' as const },
      { id: 'e', stage: 'new' as const },
      { id: 'f', stage: 'won' as const },
    ];
    const projection = projectPipeline(prospects);
    expect(projection.columns.map((column) => column.prospects.length)).toEqual([1, 0, 0, 0, 1, 0]);
    expect(projection.conversions.map((prospect) => prospect.id)).toEqual(['c']);
    expect(isHistoricalConversion(prospects[5])).toBe(false);
    expect(new Set(projection.columns.flatMap((column) => column.prospects.map((prospect) => prospect.id))).size).toBe(2);
    expect(prospects.map((prospect) => prospect.stage)).toEqual(['qualifying', 'negotiation', 'won', 'lost', 'new', 'won']);
  });
});
