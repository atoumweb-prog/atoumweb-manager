import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { TodoItem } from '../../shared/homeTodo';
import { HomeTodoCard } from './HomeTodoCard';

const item = (n: number, over: Partial<TodoItem> = {}): TodoItem => ({
  key: `prospect:p${n}`, kind: 'action', label: 'En retard', tone: 'danger',
  target: { entityType: 'prospect', entityId: `p${n}`, title: `Dossier ${n}` },
  title: `Dossier ${n}`, subtitle: `Client ${n}`, detail: 'en retard de 9 jours', ...over,
});
const render = (items: TodoItem[], props: { ready?: boolean; initiallyExpanded?: boolean } = {}) =>
  renderToStaticMarkup(createElement(HomeTodoCard, { items, ready: props.ready ?? true, onOpen: () => undefined, initiallyExpanded: props.initiallyExpanded }));
const count = (markup: string, needle: string) => markup.split(needle).length - 1;

describe('R6 : bloc « À faire maintenant »', () => {
  it('3 éléments : 3 lignes, aucun bouton d’affichage', () => {
    const markup = render([item(1), item(2), item(3)]);
    expect(count(markup, 'home-todo-row')).toBeGreaterThanOrEqual(3);
    expect(count(markup, 'Ouvrir Dossier')).toBe(3);
    expect(markup).not.toContain('Afficher');
  });

  it('10 éléments : 7 lignes et « Afficher les 3 autres éléments »', () => {
    const markup = render(Array.from({ length: 10 }, (_, index) => item(index + 1)));
    expect(count(markup, 'Ouvrir Dossier')).toBe(7);
    expect(markup).toContain('Afficher les 3 autres éléments');
    expect(markup).toContain('aria-expanded="false"');
  });

  it('déplié : 10 lignes et « Replier »', () => {
    const markup = render(Array.from({ length: 10 }, (_, index) => item(index + 1)), { initiallyExpanded: true });
    expect(count(markup, 'Ouvrir Dossier')).toBe(10);
    expect(markup).toContain('Replier');
    expect(markup).toContain('aria-expanded="true"');
  });

  it('8 éléments : « Afficher l’autre élément » au singulier', () => {
    const markup = render(Array.from({ length: 8 }, (_, index) => item(index + 1)));
    expect(count(markup, 'Ouvrir Dossier')).toBe(7);
    expect(markup).toContain('Afficher l’autre élément');
  });

  it('sous-titre et détail : séparés seulement quand les deux existent, jamais « undefined »', () => {
    const both = render([item(1)]);
    expect(both).toContain('Client 1 · en retard de 9 jours');
    const subtitleOnly = render([item(1, { detail: null })]);
    expect(subtitleOnly).toContain('Client 1');
    expect(subtitleOnly).not.toContain(' · ');
    const neither = render([item(1, { subtitle: null, detail: null })]);
    expect(neither).not.toContain('undefined');
    expect(neither).not.toContain('<small></small>');
    expect(neither).not.toContain(' · ');
  });

  it('chaque ligne montre le libellé de son type et un bouton Ouvrir nommé', () => {
    const markup = render([item(1, { label: 'Devis à envoyer', tone: 'accent', title: 'DEV-2026-007 · Landing' })]);
    expect(markup).toContain('Devis à envoyer');
    expect(markup).toContain('aria-label="Ouvrir DEV-2026-007 · Landing"');
  });

  it('source indisponible : le dit, et ne prétend jamais que tout va bien', () => {
    const markup = render([], { ready: false });
    expect(markup).toContain('Dossiers du jour indisponibles');
    expect(markup).toContain('Actualisation non confirmée');
    expect(markup).not.toContain('Rien d’urgent');
  });

  it('liste vide et source prête : message de vide qui suggère quoi faire', () => {
    const markup = render([]);
    expect(markup).toContain('Rien d’urgent pour le moment.');
    expect(markup).toContain('Prépare un devis ou fais avancer un prospect.');
    expect(markup).not.toContain('indisponibles');
  });

  it('aucun style en ligne de taille ni de capitales dans le balisage', () => {
    const markup = render([item(1)]);
    expect(markup).not.toContain('font-size');
    expect(markup).not.toContain('text-transform');
  });
});
