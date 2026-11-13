import type { StatusTone } from './StatusPill';

/**
 * Ton de la pastille d'étape d'un prospect : six rôles de couleur décidés en R2 (neutre, information, alerte,
 * succès, danger, accent). Un nom inconnu retombe sur « neutre » : le libellé reste toujours affiché à côté.
 */
const TONES: Record<string, StatusTone> = {
  prepare: 'neutral', ready: 'info', qualifying: 'info', need_identified: 'info',
  quote_to_prepare: 'warning', quote_to_send: 'warning', quote_sent: 'info', follow_up: 'warning',
  waiting: 'neutral', negotiation: 'accent', won: 'success', lost: 'danger', client: 'success', archived: 'neutral',
};

export function prospectStatusTone(key: string): StatusTone {
  return TONES[key] ?? 'neutral';
}
