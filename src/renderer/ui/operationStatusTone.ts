import type { StatusTone } from './StatusPill';

/** Ton de la pastille d'un statut de demande, d'intervention, de maintenance ou de pack d'heures. Un statut inconnu reste neutre : le libellé reste affiché. */
const TONES: Record<string, StatusTone> = {
  // Demandes
  new: 'info', to_qualify: 'warning', waiting_client: 'warning', planned: 'info', converted: 'success', closed: 'neutral',
  // Interventions
  to_plan: 'neutral', in_progress: 'info', blocked: 'danger', to_validate: 'accent', completed: 'success', cancelled: 'neutral',
  // Maintenance et packs d'heures
  active: 'success', suspended: 'warning', ended: 'neutral', exhausted: 'danger', expired: 'danger',
  archived: 'neutral',
};

export function operationStatusTone(status: string): StatusTone {
  return TONES[status] ?? 'neutral';
}
