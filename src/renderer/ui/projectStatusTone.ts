import type { StatusTone } from './StatusPill';

/** Ton de la pastille de statut d'un projet (six rôles de couleur). Un statut inconnu retombe sur « neutre » : le libellé reste affiché. */
const TONES: Record<string, StatusTone> = {
  to_prepare: 'neutral', in_progress: 'info', waiting_client: 'warning', blocked: 'danger',
  to_validate: 'accent', completed: 'success', archived: 'neutral',
  // Statuts d'un nœud du plan (mêmes couleurs pour les mêmes sens).
  todo: 'neutral', done: 'success',
};

export function projectStatusTone(status: string): StatusTone {
  return TONES[status] ?? 'neutral';
}
