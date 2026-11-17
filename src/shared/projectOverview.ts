import type { ProjectNode, ProjectNodeStatus, ProjectPrerequisite, ProjectPrerequisiteStatus, ProjectStatus } from './projects';

/**
 * Règles de présentation de la fiche Projet (R5a). Fonctions pures : elles ne lisent que des données existantes
 * (statuts des nœuds et des prérequis) et n'introduisent aucune règle métier.
 */

const ACTION_STATUSES: readonly ProjectNodeStatus[] = ['blocked', 'waiting_client', 'to_validate'];
/** Ordre de priorité de la tâche à ouvrir par défaut : ce qui est en cours d'abord, puis ce qui bloque, attend ou doit être validé. */
const OPEN_PRIORITY: readonly ProjectNodeStatus[] = ['in_progress', 'blocked', 'waiting_client', 'to_validate', 'todo'];

/** Ordre du plan : phases par `sortOrder`, puis leurs enfants (parcours en profondeur). */
function orderedNodes(nodes: readonly ProjectNode[]): ProjectNode[] {
  const children = new Map<string | null, ProjectNode[]>();
  for (const node of nodes) {
    const key = node.parentId ?? null;
    children.set(key, [...(children.get(key) ?? []), node]);
  }
  const out: ProjectNode[] = [];
  const visit = (parent: string | null) => {
    for (const node of [...(children.get(parent) ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)) {
      out.push(node);
      visit(node.id);
    }
  };
  visit(null);
  return out;
}

/** Un prérequis manque quand il est obligatoire et n'est ni validé ni « sans objet » : une seule définition pour la fiche, le Résumé et l'onglet Prérequis. */
function isMissingPrerequisite(item: ProjectPrerequisite): boolean {
  return item.required !== false && item.status !== 'validated' && item.status !== 'not_applicable';
}

export function countMissingPrerequisites(prerequisites: readonly ProjectPrerequisite[]): number {
  return prerequisites.filter(isMissingPrerequisite).length;
}

export function filterMissingPrerequisites(prerequisites: readonly ProjectPrerequisite[]): ProjectPrerequisite[] {
  return prerequisites.filter(isMissingPrerequisite);
}

/** « 1 validé sur 4 » : le total exclut les prérequis « sans objet ». */
export function prerequisiteProgress(prerequisites: readonly ProjectPrerequisite[]): { validated: number; total: number; missing: number } {
  const applicable = prerequisites.filter((item) => item.status !== 'not_applicable');
  return { validated: applicable.filter((item) => item.status === 'validated').length, total: applicable.length, missing: countMissingPrerequisites(prerequisites) };
}

/** Le bouton « Marquer reçu » n'a de sens que pour un prérequis encore à demander ou demandé. */
export function canMarkReceived(status: ProjectPrerequisiteStatus): boolean {
  return status === 'to_request' || status === 'requested';
}

export function projectNowSummary(nodes: readonly ProjectNode[], prerequisites: readonly ProjectPrerequisite[], targetDate?: string | null, now: Date = new Date()): { blocked: number; waitingClient: number; toValidate: number; prerequisitesMissing: number; overdue: boolean; clear: boolean } {
  const work = nodes.filter((node) => node.type !== 'lot');
  const count = (status: ProjectNodeStatus) => work.filter((node) => node.status === status).length;
  const blocked = count('blocked'), waitingClient = count('waiting_client'), toValidate = count('to_validate');
  const prerequisitesMissing = countMissingPrerequisites(prerequisites);
  const overdue = Boolean(targetDate) && new Date(`${String(targetDate).slice(0, 10)}T23:59:59`).getTime() < now.getTime();
  return { blocked, waitingClient, toValidate, prerequisitesMissing, overdue, clear: blocked + waitingClient + toValidate + prerequisitesMissing === 0 && !overdue };
}

export function defaultTaskToOpen(nodes: readonly ProjectNode[]): string | null {
  const work = orderedNodes(nodes).filter((node) => node.type !== 'lot');
  for (const status of OPEN_PRIORITY) {
    const found = work.find((node) => node.status === status);
    if (found) return found.id;
  }
  return null;
}

export function projectOpeningTab(input: { status: ProjectStatus; prerequisitesMissing: number }): 'plan' | 'prerequisites' | 'summary' {
  if (input.status === 'completed' || input.status === 'archived') return 'summary';
  if (input.status === 'to_prepare' && input.prerequisitesMissing > 0) return 'prerequisites';
  return 'plan';
}

/** Nœuds qui demandent une action (bloqué, en attente client, à valider) et leurs ancêtres, pour garder l'arbre lisible. */
export function filterActionNodes(nodes: readonly ProjectNode[]): ProjectNode[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const keep = new Set<string>();
  for (const node of nodes) {
    if (node.type === 'lot' || !ACTION_STATUSES.includes(node.status)) continue;
    for (let current: ProjectNode | undefined = node; current && !keep.has(current.id); current = current.parentId ? byId.get(current.parentId) : undefined) keep.add(current.id);
  }
  return nodes.filter((node) => keep.has(node.id));
}

/** Phase (nœud sans parent) qui contient le nœud donné ; le nœud lui-même s'il est déjà une phase ; `null` s'il est inconnu. */
export function rootAncestorId(nodes: readonly ProjectNode[], nodeId: string): string | null {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  let current = byId.get(nodeId);
  if (!current) return null;
  const seen = new Set<string>();
  while (current.parentId && byId.has(current.parentId) && !seen.has(current.id)) {
    seen.add(current.id);
    current = byId.get(current.parentId)!;
  }
  return current.id;
}

/** « 1. Cadrage » devient « Cadrage » : l'écran écrit déjà « Phase 1 ». */
export function phaseDisplayName(name: string): string {
  return name.replace(/^\s*\d+\s*[.)]\s+/, '');
}

const plural = (count: number, one: string, many: string) => `${count} ${count > 1 ? many : one}`;

/** Ligne repliée du périmètre commercial figé : « Périmètre figé · 1 version · 0 prestation à placer ». */
export function scopeFoldedSummary(revisionCount: number, pendingTargets: number): string {
  return `Périmètre figé · ${plural(revisionCount, 'version', 'versions')} · ${plural(pendingTargets, 'prestation à placer', 'prestations à placer')}`;
}
