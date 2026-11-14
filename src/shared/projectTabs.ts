import type { ProjectCommercialMode } from './projects';

/**
 * Règles de présentation des onglets Résumé, Commercial, Interventions et Prérequis d'un projet (R5b).
 * Fonctions pures : aucune donnée ni règle métier n'est créée, seulement des libellés et des découpages d'affichage.
 */

const COMMERCIAL_MODE_DISPLAY: Record<ProjectCommercialMode, string> = {
  normal: 'Tarif normal',
  discounted: 'Tarif remisé',
  free: 'Offert',
  partnership: 'Partenariat',
  internal: 'Interne AtoumWeb',
};

/** Libellé du tarif pour le Résumé. Le formulaire de création garde ses propres libellés de choix. */
export function commercialModeLabel(mode: ProjectCommercialMode): string {
  return COMMERCIAL_MODE_DISPLAY[mode];
}

/** Valeur offerte : écart entre valeur commerciale et valeur contractuelle, jamais négatif. */
export function offeredValueCents(commercialValueCents: number, contractValueCents: number): number {
  return Math.max(0, commercialValueCents - contractValueCents);
}

/** Message de l'onglet Commercial quand aucune prestation figée n'est rattachée : il dit pourquoi. */
export function commercialEmptyMessage(input: { commercialMode: ProjectCommercialMode; sourceQuoteId?: string | null }): string {
  if (input.commercialMode === 'internal') return 'Projet interne : pas de devis, donc pas de valeur commerciale.';
  if (!input.sourceQuoteId) return 'Ce projet n’est pas lié à un devis : aucune prestation à afficher.';
  return 'Aucune prestation rattachée à ce projet.';
}

/** Limite d'affichage d'une liste : dit combien d'éléments ne sont pas montrés. */
export function limitItems<T>(items: readonly T[], limit: number): { shown: T[]; hidden: number } {
  return { shown: items.slice(0, limit), hidden: Math.max(0, items.length - limit) };
}

/** « 1 validé », « 2 validés » : l'accord est toujours fait par l'écran, jamais laissé au hasard. */
export function plural(count: number, one: string, many: string): string {
  return `${count} ${count > 1 ? many : one}`;
}
