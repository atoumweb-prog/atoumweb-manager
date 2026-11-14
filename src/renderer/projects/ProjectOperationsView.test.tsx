import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { HourPack, Intervention, MaintenanceSubscription, ServiceRequest } from '../../shared/operations';
import { ProjectOperationsView } from './ProjectOperationsTab';

const request = (n: number, over: Record<string, unknown> = {}) => ({ id: `r${n}`, subject: `Demande ${n}`, source: 'email', priority: 'normal', status: 'new', ...over }) as unknown as ServiceRequest;
const intervention = (n: number, over: Record<string, unknown> = {}) => ({ id: `i${n}`, number: `INT-${n}`, subject: `Intervention ${n}`, type: 'correction', status: 'in_progress', coverageMode: 'included_project', totalTimeSeconds: 5400, ...over }) as unknown as Intervention;
const subscription = { id: 'm1', planName: 'TEST Maintenance mensuelle', includedInterventions: 2, status: 'active' } as unknown as MaintenanceSubscription;
const pack = { id: 'h1', name: 'TEST Pack 5 heures', balanceSeconds: 18000, consumedSeconds: 0, status: 'active' } as unknown as HourPack;

const render = (props: Partial<{ requests: ServiceRequest[]; interventions: Intervention[]; maintenance: MaintenanceSubscription[]; packs: HourPack[] }>) =>
  renderToStaticMarkup(createElement(ProjectOperationsView, { requests: [], interventions: [], maintenance: [], packs: [], onRefresh: () => undefined, ...props }));

describe('R5b : onglet Interventions', () => {
  it('tout est vide : un seul message, ni compteurs ni sections', () => {
    const markup = render({});
    expect(markup).toContain('Aucune demande ni intervention sur ce projet pour l’instant.');
    expect(markup).not.toContain('Demandes ouvertes');
    expect(markup).not.toContain('Aucune demande pour ce projet');
    expect(markup).not.toContain('<section');
    expect(markup).toContain('Actualiser');
  });

  it('seulement des demandes : une seule section, avec son compte dans le titre', () => {
    const markup = render({ requests: [request(1, { status: 'waiting_client', priority: 'high' }), request(2, { status: 'closed' })] });
    expect(markup).toContain('Demandes · 1 ouverte');
    expect(markup).not.toContain('Interventions ·');
    expect(markup).not.toContain('Maintenance');
    expect(markup).toContain('En attente client');
    expect(markup).toContain('Haute');
    expect(markup).not.toContain('waiting_client');
  });

  it('statuts, types et couverture en français, jamais les valeurs internes', () => {
    const markup = render({ interventions: [intervention(1), intervention(2, { status: 'completed', type: 'training', coverageMode: 'out_of_scope' })], maintenance: [subscription], packs: [pack] });
    for (const label of ['En cours', 'Terminée', 'Correction', 'Formation', 'Inclus projet', 'Hors forfait facturable', 'Active', 'Actif']) expect(markup, label).toContain(label);
    for (const raw of ['in_progress', 'completed', 'included_project', 'out_of_scope', 'training']) expect(markup, raw).not.toContain(raw);
  });

  it('la durée n’est affichée que si du temps a été saisi (jamais « 0 min »)', () => {
    const none = render({ interventions: [intervention(1, { totalTimeSeconds: 0 })] });
    expect(none).not.toContain('0 min');
    expect(none).toContain('Correction · Inclus projet');
    expect(render({ interventions: [intervention(1)] })).toContain('Correction · 1 h 30 · Inclus projet');
  });

  it('la priorité normale n’est pas répétée', () => {
    expect(render({ requests: [request(1)] })).not.toContain('Normale');
  });

  it('plus de 6 demandes : 6 lignes et le nombre non affiché', () => {
    const markup = render({ requests: Array.from({ length: 8 }, (_, index) => request(index + 1)) });
    expect(markup).toContain('Demande 6');
    expect(markup).not.toContain('Demande 7');
    expect(markup).toContain('+ 2 autres demandes non affichées');
  });

  it('plus de 8 interventions : 8 lignes et le nombre non affiché, au singulier', () => {
    const markup = render({ interventions: Array.from({ length: 9 }, (_, index) => intervention(index + 1)) });
    expect(markup).toContain('Intervention 8');
    expect(markup).not.toContain('Intervention 9');
    expect(markup).toContain('+ 1 autre intervention non affichée');
  });

  it('un statut inconnu s’affiche lisible, sans trait de soulignement', () => {
    const markup = render({ requests: [request(1, { status: 'nouveau_statut' })] });
    expect(markup).toContain('Nouveau statut');
    expect(markup).not.toContain('nouveau_statut');
  });

  it('aucun texte minuscule ni compteur à zéro dans le balisage', () => {
    const markup = render({ requests: [request(1)], interventions: [intervention(1)] });
    expect(markup).not.toContain('font-size');
    expect(markup).not.toContain('project-operation-kpis');
  });
});
