import type { Intervention } from '../../shared/operations';

export type CompletionResolution =
  | { kind: 'confirmed'; intervention: Intervention; recovered: boolean }
  | { kind: 'not_confirmed'; intervention: Intervention }
  | { kind: 'unknown' };

/** Reconciliation is read-only after an uncertain IPC response: never retry a mutation. */
export async function resolveInterventionCompletion(
  id: string,
  complete: (id: string) => Promise<Intervention>,
  get: (id: string) => Promise<Intervention>,
): Promise<CompletionResolution> {
  try {
    return { kind: 'confirmed', intervention: await complete(id), recovered: false };
  } catch {
    try {
      const intervention = await get(id);
      if (intervention.status === 'completed') return { kind: 'confirmed', intervention, recovered: true };
      return { kind: 'not_confirmed', intervention };
    } catch {
      return { kind: 'unknown' };
    }
  }
}

/** Both newer reads and a successful write invalidate a pending list snapshot. */
export function isCurrentOperationsRefresh(
  generation: number,
  currentGeneration: number,
  writeGenerationAtStart: number,
  currentWriteGeneration: number,
): boolean {
  return generation === currentGeneration && writeGenerationAtStart === currentWriteGeneration;
}

/** Synchronous lock: a second click cannot issue another mutation while the first is pending. */
export function acquireCompletionLock(inFlight: Set<string>, interventionId: string): (() => void) | null {
  if (inFlight.has(interventionId)) return null;
  inFlight.add(interventionId);
  return () => { inFlight.delete(interventionId); };
}
