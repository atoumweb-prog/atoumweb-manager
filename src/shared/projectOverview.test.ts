import { describe, expect, it } from 'vitest';
import type { ProjectNode, ProjectNodeStatus, ProjectNodeType, ProjectPrerequisite, ProjectPrerequisiteStatus, ProjectStatus } from './projects';
import { defaultTaskToOpen, filterActionNodes, phaseDisplayName, projectNowSummary, projectOpeningTab, rootAncestorId, scopeFoldedSummary } from './projectOverview';

let seq = 0;
const node = (name: string, status: ProjectNodeStatus, parentId: string | null = null, sortOrder = 0, type: ProjectNodeType = 'task'): ProjectNode =>
  ({ id: `n${++seq}-${name}`, projectId: 'p', name, type, status, parentId, sortOrder, required: true, paused: false, sources: [], createdAt: '', updatedAt: '' }) as unknown as ProjectNode;
const prerequisite = (label: string, status: ProjectPrerequisiteStatus, required = true): ProjectPrerequisite =>
  ({ id: label, projectId: 'p', label, status, required, createdAt: '' }) as unknown as ProjectPrerequisite;

function sample() {
  const lot1 = node('Cadrage', 'in_progress', null, 0, 'lot'), lot2 = node('Conception', 'todo', null, 1, 'lot');
  const a = node('Textes', 'done', lot1.id, 0), b = node('Arborescence', 'in_progress', lot1.id, 1);
  const c = node('Maquette', 'to_validate', lot2.id, 0), d = node('Retour client', 'waiting_client', lot2.id, 1), e = node('Formulaire', 'blocked', lot2.id, 2);
  return { nodes: [lot2, e, c, lot1, d, b, a], lot1, lot2, a, b, c, d, e };
}

describe('R5a : compteurs « En ce moment »', () => {
  it('ne compte que les nœuds qui ne sont pas des phases, et les prérequis obligatoires non validés', () => {
    const { nodes } = sample();
    const prerequisites = [prerequisite('Logo', 'validated'), prerequisite('Accès', 'requested'), prerequisite('Textes', 'incomplete'), prerequisite('Domaine', 'received'), prerequisite('Option', 'to_request', false), prerequisite('Sans objet', 'not_applicable')];
    expect(projectNowSummary(nodes, prerequisites, null)).toEqual({ blocked: 1, waitingClient: 1, toValidate: 1, prerequisitesMissing: 3, overdue: false, clear: false });
  });

  it('« clear » seulement quand tout est à zéro', () => {
    expect(projectNowSummary([node('Fait', 'done')], [prerequisite('Logo', 'validated')], null)).toEqual({ blocked: 0, waitingClient: 0, toValidate: 0, prerequisitesMissing: 0, overdue: false, clear: true });
  });

  it('une date cible passée signale un retard et empêche « clear »', () => {
    const now = new Date('2026-11-14T10:00:00Z');
    expect(projectNowSummary([], [], '2026-11-01', now)).toMatchObject({ overdue: true, clear: false });
    expect(projectNowSummary([], [], '2026-12-24', now)).toMatchObject({ overdue: false, clear: true });
    expect(projectNowSummary([], [], null, now).overdue).toBe(false);
  });
});

describe('R5a : première tâche à ouvrir', () => {
  it('en cours avant bloqué avant à valider, dans l’ordre du plan, jamais une phase', () => {
    const { nodes, b } = sample();
    expect(defaultTaskToOpen(nodes)).toBe(b.id);
  });

  it('sans tâche en cours : bloqué, puis en attente client, puis à valider, puis à faire', () => {
    const lot = node('Lot', 'todo', null, 0, 'lot');
    const todo = node('A faire', 'todo', lot.id, 0), validate = node('A valider', 'to_validate', lot.id, 1), wait = node('Attente', 'waiting_client', lot.id, 2), blocked = node('Bloquée', 'blocked', lot.id, 3);
    expect(defaultTaskToOpen([lot, todo, validate, wait, blocked])).toBe(blocked.id);
    expect(defaultTaskToOpen([lot, todo, validate, wait])).toBe(wait.id);
    expect(defaultTaskToOpen([lot, todo, validate])).toBe(validate.id);
    expect(defaultTaskToOpen([lot, todo])).toBe(todo.id);
  });

  it('plan vide ou entièrement terminé : rien à ouvrir', () => {
    expect(defaultTaskToOpen([])).toBeNull();
    const lot = node('Lot', 'todo', null, 0, 'lot');
    expect(defaultTaskToOpen([lot, node('Fait', 'done', lot.id)])).toBeNull();
  });
});

describe('R5a : onglet d’ouverture', () => {
  const tab = (status: ProjectStatus, prerequisitesMissing = 0) => projectOpeningTab({ status, prerequisitesMissing });
  it('un projet en cours s’ouvre sur le plan', () => {
    for (const status of ['in_progress', 'waiting_client', 'blocked', 'to_validate'] as ProjectStatus[]) expect(tab(status)).toBe('plan');
  });
  it('un projet à préparer s’ouvre sur les prérequis s’il en manque, sinon sur le plan', () => {
    expect(tab('to_prepare', 2)).toBe('prerequisites');
    expect(tab('to_prepare', 0)).toBe('plan');
  });
  it('un projet terminé ou archivé s’ouvre sur le résumé', () => {
    expect(tab('completed')).toBe('summary');
    expect(tab('archived', 3)).toBe('summary');
  });
});

describe('R5a : filtre « Ce qui demande une action »', () => {
  it('garde les nœuds bloqués, en attente client ou à valider et leurs phases, retire le reste', () => {
    const { nodes, lot1, lot2, a, b, c, d, e } = sample();
    const ids = filterActionNodes(nodes).map((n) => n.id).sort();
    expect(ids).toEqual([lot2.id, c.id, d.id, e.id].sort());
    expect(ids).not.toContain(lot1.id);
    expect(ids).not.toContain(a.id);
    expect(ids).not.toContain(b.id);
  });
  it('un plan sans action à mener renvoie une liste vide', () => {
    expect(filterActionNodes([node('Fait', 'done')])).toEqual([]);
  });
});

describe('R5a : nom de phase', () => {
  it('retire le numéro écrit dans le nom (« 1. » ou « 1) »), laisse le reste intact', () => {
    expect(phaseDisplayName('1. Cadrage et contenus')).toBe('Cadrage et contenus');
    expect(phaseDisplayName('12) Mise en ligne')).toBe('Mise en ligne');
    expect(phaseDisplayName('Cadrage')).toBe('Cadrage');
    expect(phaseDisplayName('2024 refonte')).toBe('2024 refonte');
  });
});

describe('R5a : ligne de résumé du périmètre figé', () => {
  it('accorde versions et prestations au singulier et au pluriel', () => {
    expect(scopeFoldedSummary(1, 0)).toBe('Périmètre figé · 1 version · 0 prestation à placer');
    expect(scopeFoldedSummary(3, 1)).toBe('Périmètre figé · 3 versions · 1 prestation à placer');
    expect(scopeFoldedSummary(2, 4)).toBe('Périmètre figé · 2 versions · 4 prestations à placer');
  });
});

describe('R5a : phase qui contient une tâche', () => {
  it('remonte jusqu’à la phase (nœud sans parent), ou rend le nœud lui-même s’il est une phase', () => {
    const { nodes, lot1, lot2, b, e } = sample();
    expect(rootAncestorId(nodes, b.id)).toBe(lot1.id);
    expect(rootAncestorId(nodes, e.id)).toBe(lot2.id);
    expect(rootAncestorId(nodes, lot1.id)).toBe(lot1.id);
  });
  it('un identifiant inconnu ne renvoie rien', () => {
    expect(rootAncestorId(sample().nodes, 'inconnu')).toBeNull();
  });
});
