/**
 * Messages des listes vides des écrans Gestion (R7). Fonctions pures : elles disent POURQUOI la liste est vide
 * (période, filtre exact de Statistiques, documents archivés) sans introduire aucune règle métier.
 */

export type TimePeriod = 'today' | 'week' | 'month';

const PERIOD_WORDS: Record<TimePeriod, string> = { today: 'aujourd’hui', week: 'cette semaine', month: 'ce mois' };

/** `empty` : aucun filtre actif ; `filtered` : au moins un filtre actif. Le filtre exact de Statistiques l'emporte sur la période. */
export function timeEmptyTexts(input: { period: TimePeriod; drilldown: boolean }): { empty: string; filtered: string } {
  if (input.drilldown) {
    const text = 'Aucune des sessions de ce filtre n’est encore disponible.';
    return { empty: text, filtered: text };
  }
  const when = PERIOD_WORDS[input.period];
  return {
    empty: `Aucune session ${when}. Lance le chrono ou ajoute du temps avec « + Temps manuel ».`,
    filtered: `Aucune session pour ces filtres ${when}.`,
  };
}

/**
 * Un seul message pour Documents. `filtersActive` ne compte QUE la recherche, le client et le type : le filtre
 * d'archives par défaut (« Actifs ») n'est pas un filtre actif. `total` et `archived` viennent de la liste complète.
 */
export function documentsEmptyText(input: { total: number; archived: number; archiveFilter: 'active' | 'archived' | 'all'; filtersActive: boolean }): string {
  if (input.filtersActive) return 'Aucun résultat pour ces filtres.';
  if (input.total === 0) return 'Aucun document pour l’instant. Ajoute-en un avec « + Document ».';
  if (input.archiveFilter === 'active' && input.archived === input.total) return `Tous les documents sont archivés (${input.archived}). Choisis « Archivés » pour les retrouver.`;
  if (input.archiveFilter === 'archived') return 'Aucun document archivé.';
  return 'Aucun document dans cette vue.';
}

export function billingEmptyText(): string {
  return 'Rien à facturer pour l’instant. Les éléments apparaissent quand un acompte, un solde, une intervention, un pack ou un abonnement est à facturer.';
}

export function expensesEmptyText(): string {
  return 'Aucune dépense enregistrée. Ajoute-en une avec « + Dépense ».';
}

export function operationsEmptyText(view: 'requests' | 'interventions'): string {
  return view === 'requests'
    ? 'Aucune demande. Ajoute-en une avec « + Nouvelle demande ».'
    : 'Aucune intervention. Ajoute-en une depuis une demande ou avec « + Intervention ».';
}
