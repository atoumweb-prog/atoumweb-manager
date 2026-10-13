import type { ProspectStage } from './crm';
import type { QuoteSummary } from './commercial';

/** Same current-quote ordering in the Home and CRM projections. Read-only. */
export function withCurrentQuoteSignal<T extends PipelineProspectProjection>(prospects:readonly T[],quotes:readonly Pick<QuoteSummary,'id'|'prospectId'|'createdAt'|'principleAgreementAt'>[]) {
  const latest=new Map<string,typeof quotes[number]>();
  for(const quote of [...quotes].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id))){
    if(quote.prospectId&&!latest.has(quote.prospectId))latest.set(quote.prospectId,quote);
  }
  return prospects.map(prospect=>({...prospect,finalizationQuoteId:latest.get(prospect.id)?.principleAgreementAt?latest.get(prospect.id)!.id:null}));
}

/**
 * Lot 03B — projection visuelle uniquement. Ne modifie jamais le statut CRM.
 * La Finalisation reste non attribuable tant que le marqueur E73 n'existe pas.
 */
export const PROSPECT_PIPELINE_COLUMNS = [
  { id: 'qualify', label: 'À qualifier', stages: ['qualifying'] },
  { id: 'needs', label: 'Besoins', stages: ['need_identified'] },
  { id: 'quote', label: 'Préparer le devis', stages: ['quote_to_prepare', 'quote_to_send'] },
  { id: 'reply', label: 'Attente du retour', stages: ['quote_sent', 'follow_up', 'waiting'] },
  { id: 'negotiation', label: 'Négociation', stages: ['negotiation'] },
  { id: 'finalization', label: 'Finalisation', stages: [] },
] as const satisfies ReadonlyArray<{ id: string; label: string; stages: readonly ProspectStage[] }>;

export interface PipelineProspectProjection {
  id: string;
  stage?: ProspectStage | null;
  archivedAt?: string | null;
  clientAccountId?: string | null;
  /** Signal E73 lié au devis commercial courant ; jamais un nouveau ProspectStage. */
  finalizationQuoteId?: string | null;
}

/** Une seule destination au plus ; 'new', perdu, archivé et gagné restent exclus. */
export function activePipelineColumn(prospect: PipelineProspectProjection): string | null {
  if (prospect.archivedAt || prospect.clientAccountId || prospect.stage === 'won' || prospect.stage === 'lost') return null;
  if (prospect.finalizationQuoteId && ['quote_sent','follow_up','waiting','negotiation'].includes(prospect.stage ?? 'new')) return 'finalization';
  return PROSPECT_PIPELINE_COLUMNS.find((column) =>
    (column.stages as readonly ProspectStage[]).includes(prospect.stage ?? 'new'),
  )?.id ?? null;
}

/** Conversion = Prospect lié à un véritable compte Client, non colonne de drag & drop. */
export function isHistoricalConversion(prospect: PipelineProspectProjection): boolean {
  return Boolean(prospect.clientAccountId);
}

export function projectPipeline<T extends PipelineProspectProjection>(prospects: readonly T[]) {
  const columns = PROSPECT_PIPELINE_COLUMNS.map((column) => ({
    id: column.id,
    label: column.label,
    prospects: prospects.filter((prospect) => activePipelineColumn(prospect) === column.id),
  }));
  const conversions = prospects.filter(isHistoricalConversion);
  return { columns, conversions };
}

/** Libellé historique basé sur le lien Client réel, sans assimiler l'archivage à une vente. */
export function historyOutcome(prospect: PipelineProspectProjection): { label: string; kind: 'converted' | 'lost' | 'won' | 'archived' } {
  if (prospect.clientAccountId) return { label: 'Converti en client', kind: 'converted' };
  if (prospect.stage === 'lost') return { label: 'Perdu', kind: 'lost' };
  if (prospect.stage === 'won') return { label: 'Gagné (sans compte client)', kind: 'won' };
  return { label: 'Archivé', kind: 'archived' };
}
