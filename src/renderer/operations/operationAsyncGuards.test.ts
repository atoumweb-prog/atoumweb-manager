import { describe, expect, it, vi } from 'vitest';
import type { Intervention } from '../../shared/operations';
import { isCurrentOperationsRefresh, resolveInterventionCompletion } from './operationAsyncGuards';

const item = (status: Intervention['status']) => ({ id: 'intervention-test', number: 'INT-TEST', status }) as Intervention;

describe('résolution de clôture après réponse IPC incertaine', () => {
  it('confirme le retour nominal sans seconde lecture ni seconde écriture', async () => {
    const complete = vi.fn().mockResolvedValue(item('completed'));
    const get = vi.fn();
    const result = await resolveInterventionCompletion('intervention-test', complete, get);
    expect(result).toMatchObject({ kind: 'confirmed', recovered: false, intervention: { status: 'completed' } });
    expect(complete).toHaveBeenCalledExactlyOnceWith('intervention-test');
    expect(get).not.toHaveBeenCalled();
  });

  it('retrouve une clôture réellement validée après perte de réponse sans réémettre la mutation', async () => {
    const complete = vi.fn().mockRejectedValue(new Error('IPC disconnected after commit'));
    const get = vi.fn().mockResolvedValue(item('completed'));
    expect(await resolveInterventionCompletion('intervention-test', complete, get))
      .toMatchObject({ kind: 'confirmed', recovered: true, intervention: { status: 'completed' } });
    expect(complete).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledExactlyOnceWith('intervention-test');
  });

  it('ne confirme pas une intervention encore en cours', async () => {
    const complete = vi.fn().mockRejectedValue(new Error('validation refused'));
    const get = vi.fn().mockResolvedValue(item('to_validate'));
    expect(await resolveInterventionCompletion('intervention-test', complete, get))
      .toMatchObject({ kind: 'not_confirmed', intervention: { status: 'to_validate' } });
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it('classe la double panne écriture/relecture comme inconnue, sans nouvelle clôture', async () => {
    const complete = vi.fn().mockRejectedValue(new Error('timeout'));
    const get = vi.fn().mockRejectedValue(new Error('offline'));
    expect(await resolveInterventionCompletion('intervention-test', complete, get)).toEqual({ kind: 'unknown' });
    expect(complete).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledTimes(1);
  });
});

describe('fraîcheur des listes Operations', () => {
  it('accepte uniquement la lecture de génération courante sans écriture intermédiaire', () => {
    expect(isCurrentOperationsRefresh(4, 4, 7, 7)).toBe(true);
    expect(isCurrentOperationsRefresh(3, 4, 7, 7)).toBe(false);
    expect(isCurrentOperationsRefresh(4, 4, 6, 7)).toBe(false);
    expect(isCurrentOperationsRefresh(3, 4, 6, 7)).toBe(false);
  });

  it('empêche une réponse de liste antérieure à une clôture de remplacer le statut confirmé', async () => {
    let resolveOld!: (value: Intervention[]) => void;
    const old = new Promise<Intervention[]>((resolve) => { resolveOld = resolve; });
    let generation = 1;
    let write = 0;
    let visible = item('in_progress');
    const oldResult = old.then((items) => {
      if (isCurrentOperationsRefresh(1, generation, 0, write)) visible = items[0];
    });
    write++;
    visible = item('completed');
    generation++;
    resolveOld([item('in_progress')]);
    await oldResult;
    expect(visible.status).toBe('completed');
  });
});
