import type { QuoteSummary } from './commercial';
import type { SearchResult } from './crm';
import type { DashboardEntry } from './workflow';

/**
 * Règles de présentation de la liste « À faire maintenant » de l'Accueil (R6).
 * Fonctions pures : elles ne lisent que les entrées déjà calculées par `WorkflowService.dashboard()` et
 * n'introduisent aucune règle métier, seulement un ordre d'affichage validé par Carlos le 14/11/2026.
 */

/** Même ensemble de tons que `StatusTone` (`renderer/ui/StatusPill`) : `shared/` n'importe rien de `renderer/`. */
export type TodoTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent';

export type TodoKind = 'action' | 'relaunch' | 'quote_prepare' | 'quote_send' | 'project_create' | 'project_late' | 'project_blocked' | 'project_validate' | 'request' | 'intervention';

export interface TodoItem {
  key: string;
  kind: TodoKind;
  label: string;
  tone: TodoTone;
  target: SearchResult;
  title: string;
  subtitle: string | null;
  detail: string | null;
}

/** Groupes de `dashboard()` repris dans la liste, du plus urgent au moins urgent. Tout autre groupe est ignoré. */
export const TODO_RANK: readonly string[] = [
  'Aujourd’hui',
  'Prospects à relancer',
  'Devis à préparer',
  'Devis à envoyer',
  'Devis acceptés à démarrer',
  'Projets en retard',
  'Projets bloqués',
  'Projets à valider',
  'Demandes nouvelles',
  'Interventions à valider',
];

const KIND_BY_GROUP: Record<string, { kind: TodoKind; label: string; tone: TodoTone }> = {
  'Aujourd’hui': { kind: 'action', label: 'Aujourd’hui', tone: 'warning' },
  'Prospects à relancer': { kind: 'relaunch', label: 'À relancer', tone: 'warning' },
  'Devis à préparer': { kind: 'quote_prepare', label: 'Devis à préparer', tone: 'info' },
  'Devis à envoyer': { kind: 'quote_send', label: 'Devis à envoyer', tone: 'accent' },
  'Devis acceptés à démarrer': { kind: 'project_create', label: 'Projet à créer', tone: 'success' },
  'Projets en retard': { kind: 'project_late', label: 'Projet en retard', tone: 'danger' },
  'Projets bloqués': { kind: 'project_blocked', label: 'Projet bloqué', tone: 'danger' },
  'Projets à valider': { kind: 'project_validate', label: 'Projet à valider', tone: 'accent' },
  'Demandes nouvelles': { kind: 'request', label: 'Nouvelle demande', tone: 'info' },
  'Interventions à valider': { kind: 'intervention', label: 'Intervention à valider', tone: 'accent' },
};

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

/** Jour local à minuit ; `null` si le texte n'est pas un jour `AAAA-MM-JJ` valide. */
function localDay(value: string | null | undefined): Date | null {
  if (!value || !DAY.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Jours de retard d'un jour d'échéance par rapport à `now` : positif si passé, 0 si aujourd'hui, négatif si futur, `null` si illisible. */
function daysLate(dueDay: string | null | undefined, now: Date): number | null {
  const due = localDay(dueDay);
  if (!due) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((today.getTime() - due.getTime()) / DAY_MS);
}

/** « en retard de 9 jours », « prévue aujourd’hui » ; `null` pour un jour futur, absent ou invalide (jamais « NaN jours »). */
export function lateness(dueDay: string | null | undefined, now: Date = new Date()): string | null {
  const late = daysLate(dueDay, now);
  if (late === null || late < 0) return null;
  if (late === 0) return 'prévue aujourd’hui';
  return `en retard de ${late} ${late > 1 ? 'jours' : 'jour'}`;
}

export function buildTodoList(entries: readonly DashboardEntry[], now: Date = new Date()): TodoItem[] {
  const ranked = entries
    .map((entry, index) => ({ entry, index, rank: TODO_RANK.indexOf(entry.group) }))
    .filter((item) => item.rank >= 0)
    .sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      if (a.rank === 0) {
        const aLate = daysLate(a.entry.target.status, now), bLate = daysLate(b.entry.target.status, now);
        if (aLate !== bLate) return (bLate ?? -Infinity) - (aLate ?? -Infinity);
      }
      return a.index - b.index;
    });
  const seen = new Set<string>();
  const items: TodoItem[] = [];
  for (const { entry } of ranked) {
    const key = `${entry.target.entityType}:${entry.target.entityId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const meta = KIND_BY_GROUP[entry.group];
    const late = meta.kind === 'action' ? daysLate(entry.target.status, now) : null;
    const isLate = late !== null && late > 0;
    items.push({
      key,
      kind: meta.kind,
      label: isLate ? 'En retard' : meta.label,
      tone: isLate ? 'danger' : meta.tone,
      target: entry.target,
      title: entry.target.title,
      subtitle: entry.target.subtitle ? entry.target.subtitle : null,
      detail: meta.kind === 'action' ? lateness(entry.target.status, now) : null,
    });
  }
  return items;
}

/** Devis réellement au statut brouillon : le compteur de l'Accueil dit ce qu'il compte et ouvre la liste qui les contient. */
export function draftQuoteCount(quotes: readonly Pick<QuoteSummary, 'status'>[]): number {
  return quotes.filter((quote) => quote.status === 'draft').length;
}
