import type { ProspectStage } from './crm';

/**
 * Sections repliables de la fiche de travail (R3) : Besoins (4 sections) et Préparer l'échange (2 sections).
 * Fonctions pures : l'écran lit ces règles, aucune donnée métier n'est ici.
 */
export const NEEDS_SECTION_IDS = ['qualification', 'brief', 'commercial', 'services'] as const;
export type NeedsSectionId = (typeof NEEDS_SECTION_IDS)[number];
export const PREPARATION_SECTION_IDS = ['research', 'preparation'] as const;
export type PreparationSectionId = (typeof PREPARATION_SECTION_IDS)[number];
export type SavedSectionState = 'open' | 'closed' | null | undefined;

export function defaultOpenNeedsSection(stage: ProspectStage | null | undefined): NeedsSectionId {
  return stage === 'new' || stage === 'qualifying' ? 'qualification' : 'brief';
}

/** Une préférence enregistrée (choix explicite de l'utilisateur) l'emporte sur la valeur par défaut. */
export function initialNeedsOpen(stage: ProspectStage | null | undefined, saved: Partial<Record<NeedsSectionId, SavedSectionState>>): Record<NeedsSectionId, boolean> {
  const fallback = defaultOpenNeedsSection(stage);
  return Object.fromEntries(NEEDS_SECTION_IDS.map((id) => [id, saved[id] === 'open' ? true : saved[id] === 'closed' ? false : id === fallback])) as Record<NeedsSectionId, boolean>;
}

export function initialPreparationOpen(saved: Partial<Record<PreparationSectionId, SavedSectionState>>): Record<PreparationSectionId, boolean> {
  return Object.fromEntries(PREPARATION_SECTION_IDS.map((id) => [id, saved[id] === 'open' ? true : saved[id] === 'closed' ? false : id === 'research'])) as Record<PreparationSectionId, boolean>;
}

/** Section qui contient l'information à compléter ; `null` quand elle est ailleurs (ex. onglet Contacts). */
export function sectionForMissingTab(tab: string): NeedsSectionId | null {
  return (NEEDS_SECTION_IDS as readonly string[]).includes(tab) ? (tab as NeedsSectionId) : null;
}

const SUMMARY_MAX = 80;

export function needsSectionSummary(id: NeedsSectionId, input: { qualificationGaps?: number; projectSummary?: string | null; budgetStatus?: string | null; timelineStatus?: string | null; informationCount?: number; openInformationCount?: number; blockingInformationCount?: number }): string {
  if (id === 'qualification') {
    const gaps = input.qualificationGaps ?? 0;
    return gaps === 0 ? 'Complète' : `${gaps} information${gaps > 1 ? 's' : ''} à compléter`;
  }
  if (id === 'brief') {
    const text = (input.projectSummary ?? '').trim();
    if (!text) return 'À préciser';
    return text.length > SUMMARY_MAX ? `${text.slice(0, SUMMARY_MAX - 1).trimEnd()}…` : text;
  }
  if (id === 'commercial') return input.budgetStatus && input.timelineStatus ? 'Renseigné' : 'À renseigner';
  // P3a (F4) : « Prestations et points à confirmer » résume les points à confirmer et ceux qui bloquent le devis.
  if (!input.informationCount) return 'À préciser';
  const open = input.openInformationCount ?? 0;
  if (open === 0) return 'Tout est confirmé';
  const blocking = input.blockingInformationCount ?? 0;
  const base = `${open} point${open > 1 ? 's' : ''} à confirmer`;
  return blocking > 0 ? `${base} · ${blocking} bloquant${blocking > 1 ? 's' : ''}` : base;
}
