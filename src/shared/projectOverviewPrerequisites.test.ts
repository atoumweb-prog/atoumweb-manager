import { describe, expect, it } from 'vitest';
import type { ProjectPrerequisite, ProjectPrerequisiteStatus } from './projects';
import { PROJECT_PREREQUISITE_STATUSES } from './projects';
import { canMarkReceived, countMissingPrerequisites, filterMissingPrerequisites, prerequisiteProgress, projectNowSummary } from './projectOverview';

const prerequisite = (label: string, status: ProjectPrerequisiteStatus, required = true): ProjectPrerequisite =>
  ({ id: label, projectId: 'p', label, status, required, createdAt: '' }) as unknown as ProjectPrerequisite;

const ATELIER = [
  prerequisite('Logo', 'validated'),
  prerequisite('Photos', 'received'),
  prerequisite('Liste des produits', 'incomplete'),
  prerequisite('Accès hébergement', 'to_request'),
  prerequisite('Mentions légales', 'requested', false),
];

describe('R5b : prérequis, une seule définition de « manquant »', () => {
  it('les obligatoires non validés et non « sans objet » sont manquants, pas les facultatifs', () => {
    expect(countMissingPrerequisites(ATELIER)).toBe(3);
    expect(filterMissingPrerequisites(ATELIER).map((item) => item.label)).toEqual(['Photos', 'Liste des produits', 'Accès hébergement']);
  });

  it('la ligne « En ce moment » compte exactement comme l’onglet Prérequis', () => {
    expect(projectNowSummary([], ATELIER, null).prerequisitesMissing).toBe(countMissingPrerequisites(ATELIER));
  });

  it('prerequisiteProgress : le total exclut « sans objet »', () => {
    const items = [prerequisite('A', 'validated'), prerequisite('B', 'received'), prerequisite('C', 'requested', false), prerequisite('D', 'not_applicable')];
    expect(prerequisiteProgress(items)).toEqual({ validated: 1, total: 3, missing: 1 });
  });

  it('tous « sans objet » : total 0, rien de manquant', () => {
    expect(prerequisiteProgress([prerequisite('A', 'not_applicable')])).toEqual({ validated: 0, total: 0, missing: 0 });
    expect(prerequisiteProgress([])).toEqual({ validated: 0, total: 0, missing: 0 });
  });

  it('canMarkReceived : seulement « À demander » et « Demandé »', () => {
    const allowed = PROJECT_PREREQUISITE_STATUSES.filter((status) => canMarkReceived(status));
    expect(allowed).toEqual(['to_request', 'requested']);
  });
});
