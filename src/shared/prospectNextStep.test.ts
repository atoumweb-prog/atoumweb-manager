import { describe, expect, it } from 'vitest';
import type { ProspectStage } from './crm';
import { prospectNextStep, prospectOpeningTab } from './prospectNextStep';

const open = { clientAccountId: null, archivedAt: null };

describe('R3 : règles de la carte « Prochaine étape »', () => {
  it('un nouveau contact propose de démarrer la prospection', () => {
    expect(prospectNextStep({ stage: 'new', ...open, qualificationGaps: 0 })).toEqual({ kind: 'start', primaryLabel: 'Démarrer la prospection', closedLabel: null });
  });

  it('à qualifier : valider quand rien ne manque, compléter sinon', () => {
    expect(prospectNextStep({ stage: 'qualifying', ...open, qualificationGaps: 0 })).toEqual({ kind: 'validate_qualification', primaryLabel: 'Valider la qualification et passer à Besoins', closedLabel: null });
    expect(prospectNextStep({ stage: 'qualifying', ...open, qualificationGaps: 2 })).toEqual({ kind: 'complete_qualification', primaryLabel: 'Compléter la qualification avant l’étape Besoins', closedLabel: null });
  });

  it('besoin identifié : préparer le devis', () => {
    expect(prospectNextStep({ stage: 'need_identified', ...open, qualificationGaps: 0 })).toEqual({ kind: 'prepare_quote', primaryLabel: 'Préparer le devis', closedLabel: null });
  });

  it.each(['quote_to_prepare', 'quote_to_send', 'quote_sent', 'follow_up', 'negotiation', 'waiting'] as ProspectStage[])('%s : poursuivre le devis', (stage) => {
    expect(prospectNextStep({ stage, ...open, qualificationGaps: 0 })).toEqual({ kind: 'continue_quote', primaryLabel: 'Poursuivre le devis', closedLabel: null });
  });

  it.each(['won', 'lost'] as ProspectStage[])('%s : dossier clos, aucune action principale', (stage) => {
    const result = prospectNextStep({ stage, ...open, qualificationGaps: 0 });
    expect(result.kind).toBe('closed');
    expect(result.primaryLabel).toBeNull();
    expect(result.closedLabel).toBeTruthy();
  });

  it('un dossier converti ou archivé est clos quelle que soit l’étape', () => {
    expect(prospectNextStep({ stage: 'quote_sent', clientAccountId: 'c1', archivedAt: null, qualificationGaps: 0 }).kind).toBe('closed');
    expect(prospectNextStep({ stage: 'qualifying', clientAccountId: null, archivedAt: '2026-11-01T00:00:00Z', qualificationGaps: 0 })).toMatchObject({ kind: 'closed', primaryLabel: null });
  });

  it('les libellés de dossier clos distinguent client, archivé, gagné et perdu', () => {
    const labels = [
      prospectNextStep({ stage: 'won', clientAccountId: 'c1', archivedAt: null, qualificationGaps: 0 }).closedLabel,
      prospectNextStep({ stage: 'lost', ...open, qualificationGaps: 0 }).closedLabel,
      prospectNextStep({ stage: 'qualifying', clientAccountId: null, archivedAt: '2026-11-01', qualificationGaps: 0 }).closedLabel,
    ];
    expect(new Set(labels).size).toBe(3);
  });
});

describe('R3 : onglet d’ouverture de la fiche de travail', () => {
  const tab = (stage: ProspectStage, extra: Partial<Parameters<typeof prospectOpeningTab>[0]> = {}) => prospectOpeningTab({ stage, ...open, ...extra });

  it('suit l’étape du dossier', () => {
    expect(tab('new')).toBe('company');
    expect(tab('qualifying')).toBe('preparation');
    expect(tab('need_identified')).toBe('needs');
    for (const stage of ['quote_to_prepare', 'quote_to_send', 'quote_sent', 'follow_up', 'negotiation', 'waiting'] as ProspectStage[]) expect(tab(stage)).toBe('quotes');
    expect(tab('won')).toBe('history');
    expect(tab('lost')).toBe('history');
  });

  it('un dossier converti ou archivé s’ouvre sur l’historique', () => {
    expect(tab('quote_sent', { clientAccountId: 'c1' })).toBe('history');
    expect(tab('qualifying', { archivedAt: '2026-11-01' })).toBe('history');
  });

  it('une demande explicite l’emporte sur l’étape', () => {
    expect(tab('quote_sent', { initialAction: true })).toBe('actions');
    expect(tab('quote_sent', { initialTab: 'reference' })).toBe('preparation');
    expect(tab('won', { initialAction: true })).toBe('actions');
  });
});
