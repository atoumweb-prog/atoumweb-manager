import { describe, expect, it } from 'vitest';
import { projectStatusTone } from './projectStatusTone';

describe('R5a : ton de la pastille de statut d’un projet', () => {
  it.each([
    ['to_prepare', 'neutral'], ['in_progress', 'info'], ['waiting_client', 'warning'], ['blocked', 'danger'],
    ['to_validate', 'accent'], ['completed', 'success'], ['archived', 'neutral'],
    ['todo', 'neutral'], ['done', 'success'],
  ])('%s → %s', (status, tone) => {
    expect(projectStatusTone(status)).toBe(tone);
  });
  it('un statut inconnu reste neutre (le libellé est toujours affiché à côté)', () => {
    expect(projectStatusTone('inconnu')).toBe('neutral');
  });
});
