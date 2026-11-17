import { describe, expect, it } from 'vitest';
import { operationStatusTone } from './operationStatusTone';

describe('R5b : ton de pastille des statuts d’opérations', () => {
  it('chaque statut a le ton de son sens', () => {
    const expected: Record<string, string> = {
      new: 'info', to_qualify: 'warning', waiting_client: 'warning', planned: 'info', converted: 'success', closed: 'neutral',
      to_plan: 'neutral', in_progress: 'info', blocked: 'danger', to_validate: 'accent', completed: 'success', cancelled: 'neutral',
      active: 'success', suspended: 'warning', ended: 'neutral', exhausted: 'danger', expired: 'danger', archived: 'neutral',
    };
    for (const [status, tone] of Object.entries(expected)) expect(operationStatusTone(status), status).toBe(tone);
  });

  it('un statut inconnu reste neutre : jamais une couleur trompeuse', () => {
    expect(operationStatusTone('inconnu')).toBe('neutral');
    expect(operationStatusTone('')).toBe('neutral');
  });
});
