import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ProjectPrerequisite, ProjectPrerequisiteStatus } from '../../shared/projects';
import { ProjectPrerequisitesTab } from './ProjectPrerequisitesTab';

const item = (label: string, status: ProjectPrerequisiteStatus, extra: Record<string, unknown> = {}): ProjectPrerequisite =>
  ({ id: label, projectId: 'p', label, status, required: true, createdAt: '', ...extra }) as unknown as ProjectPrerequisite;

const render = (prerequisites: ProjectPrerequisite[], initialOnlyMissing = false) =>
  renderToStaticMarkup(createElement(ProjectPrerequisitesTab, { prerequisites, newLabel: '', onNewLabelChange: () => undefined, onAdd: () => undefined, onStatus: () => undefined, initialOnlyMissing }));

const BOULANGERIE = [item('Logo', 'validated'), item('Textes', 'validated'), item('Photos', 'validated'), item('Domaine', 'not_applicable')];
const ATELIER = [
  item('Logo', 'validated'), item('Photos', 'received'), item('Liste des produits', 'incomplete'), item('Accès hébergement', 'to_request'),
  item('Mentions légales', 'requested', { required: false }),
];

describe('R5b : onglet Prérequis', () => {
  it('compteur « N validés sur M · P manquants », le total exclut « sans objet »', () => {
    expect(render(BOULANGERIE)).toContain('3 validés sur 3');
    const markup = render(ATELIER);
    expect(markup).toContain('1 validé sur 5');
    expect(markup).toContain('3 manquants');
  });

  it('tout est validé : le filtre « seulement ce qui manque » le dit', () => {
    expect(render(BOULANGERIE, true)).toContain('Tous les prérequis sont validés.');
  });

  it('le filtre ne garde que les prérequis manquants (les facultatifs n’y sont pas)', () => {
    const markup = render(ATELIER, true);
    expect(markup).toContain('Photos');
    expect(markup).toContain('Liste des produits');
    expect(markup).toContain('Accès hébergement');
    expect(markup).not.toContain('Mentions légales');
    expect(markup).not.toContain('>Logo<');
  });

  it('un prérequis facultatif est marqué, une seule fois', () => {
    expect((render(ATELIER).match(/facultatif/g) ?? []).length).toBe(1);
  });

  it('« Marquer reçu » seulement sur les lignes à demander ou demandées', () => {
    expect((render(ATELIER).match(/Marquer reçu/g) ?? []).length).toBe(2);
    expect(render(BOULANGERIE)).not.toContain('Marquer reçu');
  });

  it('chaque ligne a un sélecteur avec les six statuts en français', () => {
    const markup = render([item('Logo', 'validated')]);
    for (const label of ['À demander', 'Demandé', 'Reçu', 'Incomplet', 'Validé', 'Non applicable']) expect(markup).toContain(`>${label}<`);
  });

  it('liste vide : explique à quoi servent les prérequis', () => {
    expect(render([])).toContain('Aucun prérequis. Ajoute ce que le client doit fournir ou valider avant de démarrer.');
  });

  it('tous « sans objet » : jamais « 0 validé sur 0 »', () => {
    const markup = render([item('Domaine', 'not_applicable')]);
    expect(markup).toContain('Aucun prérequis à suivre');
    expect(markup).not.toContain('0 validé sur 0');
  });

  it('un libellé très long n’est ni tronqué ni coupé par des points de suspension', () => {
    const long = 'Texte d’accroche principal de la page validé par la direction du client avant toute maquette '.repeat(2).trim();
    const markup = render([item(long, 'incomplete', { description: 'Le client a transmis trois versions différentes' })]);
    expect(markup).toContain(long);
    expect(markup).not.toContain('text-overflow');
    expect(markup).not.toContain('…</');
  });

  it('le champ d’ajout reste en tête', () => {
    expect(render(ATELIER)).toContain('Ajouter un prérequis…');
  });
});
