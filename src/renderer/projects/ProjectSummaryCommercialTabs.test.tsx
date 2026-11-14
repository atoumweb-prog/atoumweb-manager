import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ProjectDetail } from '../../shared/projects';
import { ProjectCommercialTab } from './ProjectCommercialTab';
import { ProjectSummaryTab } from './ProjectSummaryTab';

const base = {
  id: 'p1', name: 'TEST Boutique en ligne', projectType: 'ecommerce', commercialMode: 'normal', status: 'to_prepare', progressPercent: 0,
  estimatedMinutes: 1710, estimationIncomplete: false, targetDate: '2026-12-14', createdAt: '2026-11-14T08:00:00.000Z', notes: null,
  sourceQuoteId: 'q1', commercialState: 'frozen', commercialValueCents: 149000, contractValueCents: 149000,
  nodes: [{ id: 'n1', type: 'task', required: true, status: 'todo' }, { id: 'n2', type: 'task', required: true, status: 'done' }, { id: 'n3', type: 'lot', required: true, status: 'todo' }],
  prerequisites: [
    { id: 'a', label: 'Logo', status: 'validated', required: true },
    { id: 'b', label: 'Photos', status: 'received', required: true },
    { id: 'c', label: 'Option', status: 'requested', required: false },
  ],
  services: [{ id: 's1', label: 'Boutique WooCommerce', catalogVersionId: 'v1', contractValueCents: 149000 }, { id: 's2', label: 'Retouches', catalogVersionId: null, contractValueCents: 0 }],
};
const project = (over: Record<string, unknown> = {}) => ({ ...base, ...over }) as unknown as ProjectDetail;
const summary = (over: Record<string, unknown> = {}) => renderToStaticMarkup(createElement(ProjectSummaryTab, { project: project(over), onShowPrerequisites: () => undefined }));
const commercial = (over: Record<string, unknown> = {}) => renderToStaticMarkup(createElement(ProjectCommercialTab, { project: project(over) }));

describe('R5b : onglet Résumé', () => {
  it('type et tarif en français, jamais les valeurs brutes', () => {
    const markup = summary();
    expect(markup).toContain('Boutique en ligne');
    expect(markup).toContain('Tarif normal');
    expect(markup).not.toContain('ecommerce');
    expect(markup).not.toContain('Normal<');
  });

  it('la tuile Progression (répétée dans l’en-tête) a disparu', () => {
    expect(summary()).not.toContain('Progression');
  });

  it('prérequis manquants : même compte que la ligne « En ce moment », bouton seulement s’il y en a', () => {
    const withMissing = summary();
    expect(withMissing).toContain('Prérequis manquants');
    expect(withMissing).toContain('<button');
    const none = summary({ prerequisites: [{ id: 'a', label: 'Logo', status: 'validated', required: true }] });
    expect(none).not.toContain('<button');
  });

  it('tâches restantes : compte les tâches obligatoires non terminées, pas les phases', () => {
    expect(summary()).toContain('<strong>1</strong>');
  });

  it('projet interne sans devis : pas de ligne « Origine »', () => {
    expect(summary({ sourceQuoteId: null, commercialMode: 'internal' })).not.toContain('Origine');
    expect(summary()).toContain('Origine');
  });

  it('notes affichées seulement s’il y en a', () => {
    expect(summary()).not.toContain('Notes');
    expect(summary({ notes: 'À rappeler jeudi' })).toContain('À rappeler jeudi');
  });

  it('aucun style de capitales ni de texte minuscule dans le balisage', () => {
    expect(summary()).not.toContain('text-transform');
    expect(summary()).not.toContain('font-size');
  });
});

describe('R5b : onglet Commercial', () => {
  it('valeurs commerciale et contractuelle, « Valeur offerte » masquée quand il n’y a pas d’écart', () => {
    const markup = commercial();
    expect(markup).toContain('Valeur commerciale');
    expect(markup).toContain('Montant contractuel');
    expect(markup).not.toContain('Valeur offerte');
  });

  it('« Valeur offerte » affichée quand la valeur commerciale dépasse le contrat', () => {
    expect(commercial({ commercialValueCents: 159000 })).toContain('Valeur offerte');
  });

  it('un contrat supérieur à la valeur commerciale n’affiche jamais de valeur offerte négative', () => {
    const markup = commercial({ commercialValueCents: 100000, contractValueCents: 149000 });
    expect(markup).not.toContain('Valeur offerte');
    expect(markup).not.toMatch(/-\d/);
  });

  it('prestation figée ou ligne libre', () => {
    const markup = commercial();
    expect(markup).toContain('Version du catalogue figée');
    expect(markup).toContain('Ligne libre');
  });

  it('messages vides qui disent pourquoi', () => {
    expect(commercial({ services: [], commercialMode: 'internal', sourceQuoteId: null })).toContain('Projet interne : pas de devis, donc pas de valeur commerciale.');
    expect(commercial({ services: [], sourceQuoteId: null })).toContain('Ce projet n’est pas lié à un devis');
    expect(commercial({ services: [] })).toContain('Aucune prestation rattachée à ce projet.');
  });
});
