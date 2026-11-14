import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  COVERAGE_LABELS,
  HOUR_PACK_STATUS_LABELS,
  INTERVENTION_STATUS_LABELS,
  INTERVENTION_TYPE_LABELS,
  MAINTENANCE_SUBSCRIPTION_STATUS_LABELS,
  PRIORITY_LABELS,
  REQUEST_STATUS_LABELS,
  SOURCE_LABELS,
  readableLabel,
} from './operationLabels';
import {
  HOUR_PACK_STATUSES,
  INTERVENTION_COVERAGE_MODES,
  INTERVENTION_STATUSES,
  INTERVENTION_TYPES,
  MAINTENANCE_SUBSCRIPTION_STATUSES,
  SERVICE_REQUEST_PRIORITIES,
  SERVICE_REQUEST_SOURCES,
  SERVICE_REQUEST_STATUSES,
} from './operations';

const CASES: Array<[string, readonly string[], Record<string, string>]> = [
  ['statuts de demande', SERVICE_REQUEST_STATUSES, REQUEST_STATUS_LABELS],
  ['origines de demande', SERVICE_REQUEST_SOURCES, SOURCE_LABELS],
  ['priorités', SERVICE_REQUEST_PRIORITIES, PRIORITY_LABELS],
  ['types d’intervention', INTERVENTION_TYPES, INTERVENTION_TYPE_LABELS],
  ['statuts d’intervention', INTERVENTION_STATUSES, INTERVENTION_STATUS_LABELS],
  ['modes de couverture', INTERVENTION_COVERAGE_MODES, COVERAGE_LABELS],
  ['statuts de maintenance', MAINTENANCE_SUBSCRIPTION_STATUSES, MAINTENANCE_SUBSCRIPTION_STATUS_LABELS],
  ['statuts de pack d’heures', HOUR_PACK_STATUSES, HOUR_PACK_STATUS_LABELS],
];

describe('R5b : libellés d’opérations partagés', () => {
  for (const [name, values, labels] of CASES) {
    it(`${name} : chaque valeur a un libellé français lisible`, () => {
      for (const value of values) {
        const label = labels[value];
        expect(label, value).toBeTruthy();
        expect(label, value).not.toContain('_');
        expect(label.charAt(0), value).toBe(label.charAt(0).toLocaleUpperCase('fr-FR'));
      }
    });
  }

  it('valeurs exactes reprises de l’écran Opérations', () => {
    expect(INTERVENTION_STATUS_LABELS.in_progress).toBe('En cours');
    expect(REQUEST_STATUS_LABELS.waiting_client).toBe('En attente client');
    expect(PRIORITY_LABELS.high).toBe('Haute');
    expect(HOUR_PACK_STATUS_LABELS.expired).toBe('Expiré');
    expect(MAINTENANCE_SUBSCRIPTION_STATUS_LABELS.ended).toBe('Terminée');
  });

  it('readableLabel : libellé connu, sinon clé lisible', () => {
    expect(readableLabel(HOUR_PACK_STATUS_LABELS, 'expired')).toBe('Expiré');
    expect(readableLabel(REQUEST_STATUS_LABELS, 'in_progress_x')).toBe('In progress x');
  });

  it('OperationsPage importe les libellés au lieu de les redéfinir', () => {
    const page = readFileSync(resolve(__dirname, '../renderer/operations/OperationsPage.tsx'), 'utf8');
    expect(page).not.toContain('const REQUEST_STATUS_LABELS');
    expect(page).not.toContain('const INTERVENTION_STATUS_LABELS');
    expect(page).toContain("from '../../shared/operationLabels'");
  });
});
