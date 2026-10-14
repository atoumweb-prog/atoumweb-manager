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

/** Human confirmation based only on the currently returned intervention, without guessed quotas or balances. */
export function interventionCompletionReview(intervention: Intervention, currentCoverageDetails: string[] = []): string {
  const consequence: Record<Intervention['coverageMode'], string> = {
    maintenance: 'Maintenance : le service vérifiera la période, le quota et les éventuels dépassements.',
    hour_pack: 'Pack d’heures : le service débitera le temps réellement terminé une seule fois, sous réserve de validation.',
    out_of_scope: 'Hors forfait : un élément de facturation pourra être préparé ; aucune facture Abby ne sera émise automatiquement.',
    commercial_gesture: 'Geste commercial : la prise en charge sera enregistrée selon les règles du service.',
    included_project: 'Inclus au projet : aucune facturation supplémentaire ne doit être présumée.',
    internal: 'Interne : la clôture sera enregistrée sans supposer une facture client.',
  };
  const time = Math.max(0, Math.floor(intervention.totalTimeSeconds));
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  return [
    'Confirmer la clôture de cette intervention ?',
    `${intervention.number} — ${intervention.subject}`,
    `Client : ${intervention.clientLabel}`,
    `Temps actuellement enregistré : ${hours} h ${minutes} min`,
    consequence[intervention.coverageMode],
    ...currentCoverageDetails,
    'Ces données proviennent de la dernière lecture avant confirmation. Les effets définitifs restent calculés par le service lors de la clôture.',
    'Cette action peut modifier le pack, la maintenance et les éléments de facturation. Continuer ?',
  ].join('\n');
}
