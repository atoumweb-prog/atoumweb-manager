import { describe, expect, it } from 'vitest';
import type { DashboardEntry } from './workflow';
import { TODO_RANK, buildTodoList, draftQuoteCount, lateness } from './homeTodo';

const NOW = new Date('2026-11-14T10:00:00');
const entry = (group: string, entityType: string, entityId: string, title: string, extra: Record<string, unknown> = {}): DashboardEntry =>
  ({ group, target: { entityType, entityId, title, ...extra } }) as unknown as DashboardEntry;

describe('R6 : liste « À faire maintenant »', () => {
  it('le rang des groupes est celui validé par Carlos', () => {
    expect(TODO_RANK).toEqual(['Aujourd’hui', 'Prospects à relancer', 'Devis à préparer', 'Devis à envoyer', 'Devis acceptés à démarrer', 'Projets en retard', 'Projets bloqués', 'Projets à valider', 'Demandes nouvelles', 'Interventions à valider']);
  });

  it('trie par rang, quel que soit l’ordre d’entrée', () => {
    const items = buildTodoList([
      entry('Interventions à valider', 'intervention', 'i1', 'Correction'),
      entry('Demandes nouvelles', 'service_request', 'r1', 'Question'),
      entry('Devis à envoyer', 'quote', 'q2', 'DEV-2 · Site'),
      entry('Aujourd’hui', 'prospect', 'p1', 'Relancer', { status: '2026-11-14' }),
      entry('Prospects à relancer', 'prospect', 'p2', 'Atelier'),
    ], NOW);
    expect(items.map((item) => item.kind)).toEqual(['action', 'relaunch', 'quote_send', 'request', 'intervention']);
  });

  it('un dossier n’apparaît qu’une fois, à son rang le plus haut', () => {
    const items = buildTodoList([
      entry('Projets bloqués', 'project', 'pr1', 'Boutique'),
      entry('Projets en retard', 'project', 'pr1', 'Boutique'),
    ], NOW);
    expect(items).toHaveLength(1);
    expect(items[0].kind).toBe('project_late');
    expect(items[0].label).toBe('Projet en retard');
  });

  it('ignore les groupes qui ne sont pas dans la liste', () => {
    const items = buildTodoList(['Interventions en cours', 'Échéances proches', 'RGPD / conservation', 'Devis en attente de retour', 'À venir', 'Projets en cours', 'Projets prévisionnels'].map((group, index) => entry(group, 'project', `x${index}`, 'Autre')), NOW);
    expect(items).toEqual([]);
  });

  it('les actions : la plus ancienne d’abord, en retard ou du jour', () => {
    const items = buildTodoList([
      entry('Aujourd’hui', 'prospect', 'p-today', 'Aujourd’hui même', { status: '2026-11-14' }),
      entry('Aujourd’hui', 'prospect', 'p-late', 'Très en retard', { status: '2026-11-05', subtitle: 'TEST Atelier' }),
    ], NOW);
    expect(items.map((item) => item.target.entityId)).toEqual(['p-late', 'p-today']);
    expect(items[0]).toMatchObject({ label: 'En retard', tone: 'danger', subtitle: 'TEST Atelier', detail: 'en retard de 9 jours' });
    expect(items[1]).toMatchObject({ label: 'Aujourd’hui', tone: 'warning', detail: 'prévue aujourd’hui' });
  });

  it('une action sans date ou avec une date invalide n’a pas de détail, jamais « NaN »', () => {
    const items = buildTodoList([entry('Aujourd’hui', 'prospect', 'a', 'Sans date'), entry('Aujourd’hui', 'prospect', 'b', 'Date cassée', { status: 'n/a' })], NOW);
    for (const item of items) {
      expect(item.detail).toBeNull();
      expect(JSON.stringify(item)).not.toContain('NaN');
    }
  });

  it('sous-titre absent : null, jamais une chaîne vide', () => {
    expect(buildTodoList([entry('Demandes nouvelles', 'service_request', 'r', 'Question', { subtitle: '' })], NOW)[0].subtitle).toBeNull();
  });

  it('lateness', () => {
    expect(lateness('2026-11-05', NOW)).toBe('en retard de 9 jours');
    expect(lateness('2026-11-13', NOW)).toBe('en retard de 1 jour');
    expect(lateness('2026-11-14', NOW)).toBe('prévue aujourd’hui');
    for (const value of ['2026-11-20', 'n/a', '', null, undefined]) expect(lateness(value as string | null | undefined, NOW)).toBeNull();
  });

  it('draftQuoteCount : seuls les brouillons comptent', () => {
    expect(draftQuoteCount([{ status: 'draft' }, { status: 'sent' }, { status: 'draft' }] as never)).toBe(2);
    expect(draftQuoteCount([])).toBe(0);
  });
});
