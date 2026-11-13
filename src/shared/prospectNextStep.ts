import type { ProspectStage } from './crm';

/**
 * Règles de présentation de la fiche de travail du prospect (R3).
 * Fonctions pures : elles reprennent les libellés et les enchaînements qui existaient déjà dans l'écran,
 * sans aucune règle métier nouvelle. L'appelant branche chaque `kind` sur le gestionnaire existant.
 */
export type NextStepKind = 'start' | 'validate_qualification' | 'complete_qualification' | 'prepare_quote' | 'continue_quote' | 'closed';
export type DeskTab = 'company' | 'contacts' | 'preparation' | 'needs' | 'actions' | 'quotes' | 'history';

interface DossierState { stage: ProspectStage; clientAccountId?: string | null; archivedAt?: string | null }

const QUOTE_STAGES: readonly ProspectStage[] = ['quote_to_prepare', 'quote_to_send', 'quote_sent', 'follow_up', 'negotiation', 'waiting'];

function isClosed(state: DossierState): boolean {
  return Boolean(state.clientAccountId) || Boolean(state.archivedAt) || state.stage === 'won' || state.stage === 'lost';
}

function closedLabel(state: DossierState): string {
  if (state.clientAccountId) return 'Dossier converti en client';
  if (state.archivedAt) return 'Dossier archivé';
  return state.stage === 'won' ? 'Dossier gagné' : 'Dossier perdu';
}

export function prospectNextStep(input: DossierState & { qualificationGaps: number }): { kind: NextStepKind; primaryLabel: string | null; closedLabel: string | null } {
  if (isClosed(input)) return { kind: 'closed', primaryLabel: null, closedLabel: closedLabel(input) };
  if (input.stage === 'new') return { kind: 'start', primaryLabel: 'Démarrer la prospection', closedLabel: null };
  if (input.stage === 'qualifying') {
    return input.qualificationGaps > 0
      ? { kind: 'complete_qualification', primaryLabel: 'Compléter la qualification avant l’étape Besoins', closedLabel: null }
      : { kind: 'validate_qualification', primaryLabel: 'Valider la qualification et passer à Besoins', closedLabel: null };
  }
  if (input.stage === 'need_identified') return { kind: 'prepare_quote', primaryLabel: 'Préparer le devis', closedLabel: null };
  return { kind: 'continue_quote', primaryLabel: 'Poursuivre le devis', closedLabel: null };
}

export function prospectOpeningTab(input: DossierState & { initialAction?: boolean; initialTab?: 'commercial' | 'reference' }): DeskTab {
  if (input.initialAction) return 'actions';
  if (input.initialTab === 'reference') return 'preparation';
  if (isClosed(input)) return 'history';
  if (input.stage === 'new') return 'company';
  if (input.stage === 'qualifying') return 'preparation';
  if (QUOTE_STAGES.includes(input.stage)) return 'quotes';
  return 'needs';
}
