import { describe, expect, it } from 'vitest';
import type { QuoteDetail } from './commercial';
import { canAccessQuoteProject, findCurrentQuoteProject } from './quoteProjectEligibility';
import type { ProjectSummary } from './projects';

function quote(status: QuoteDetail['status'], lines = 1): Pick<QuoteDetail, 'status' | 'lines'> {
  return { status, lines: Array.from({ length: lines }, () => ({} as QuoteDetail['lines'][number])) };
}

describe('03B.4 — accès au Projet depuis le Devis courant', () => {
  it('ouvre le parcours sur les devis contenant des lignes et préparables', () => {
    for (const status of ['draft', 'sent', 'viewed', 'accepted'] as const) {
      expect(canAccessQuoteProject(quote(status))).toBe(true);
    }
  });

  it('interdit le lancement sans ligne, sur devis refusé, caduc ou annulé', () => {
    expect(canAccessQuoteProject(quote('draft', 0))).toBe(false);
    for (const status of ['refused', 'expired', 'cancelled'] as const) {
      expect(canAccessQuoteProject(quote(status))).toBe(false);
    }
  });
  it('réutilise directement le Projet lié et évite tout nouveau diagnostic réseau', async () => {
    const linked = { id: 'project-1', sourceQuoteId: 'old-quote' } as ProjectSummary;
    let queried = 0;
    const found = await findCurrentQuoteProject(
      { id: 'quote-1', projectId: 'project-1', prospectId: 'prospect-1', clientAccountId: null },
      [linked], async () => { queried++; return null; },
    );
    expect(found?.id).toBe('project-1');
    expect(queried).toBe(0);
  });

  it('retrouve le même Projet via la révision commerciale courante', async () => {
    const provisional = { id: 'project-1', prospectId: 'prospect-1', sourceQuoteId: 'old-quote', commercialDossierId: 'dossier-1' } as ProjectSummary;
    const found = await findCurrentQuoteProject(
      { id: 'new-quote', projectId: null, prospectId: 'prospect-1', clientAccountId: null },
      [provisional], async (id) => id === 'project-1' ? 'new-quote' : null,
    );
    expect(found?.id).toBe('project-1');
  });

  it('ne réutilise jamais un autre Projet du même Prospect sur une ancienne révision', async () => {
    const other = { id: 'project-old', prospectId: 'prospect-1', commercialDossierId: 'dossier-old', sourceQuoteId: 'quote-old' } as ProjectSummary;
    const unrelated = { id: 'project-other', prospectId: 'prospect-2', commercialDossierId: 'dossier-other' } as ProjectSummary;
    const lookedUp: string[] = [];
    const found = await findCurrentQuoteProject(
      { id: 'new-quote', projectId: null, prospectId: 'prospect-1', clientAccountId: null },
      [other, unrelated], async (id) => { lookedUp.push(id); return 'quote-old'; },
    );
    expect(found).toBeNull();
    expect(lookedUp).toEqual(['project-old']);
  });

});
