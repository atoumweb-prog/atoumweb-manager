import type { StatusTone } from './StatusPill';

/** Ton de la pastille de statut d'un devis (six rôles de couleur). Un statut inconnu retombe sur « neutre » : le libellé reste affiché. */
const TONES: Record<string, StatusTone> = {
  draft: 'neutral', sent: 'info', viewed: 'info', accepted: 'success', refused: 'danger', expired: 'warning', cancelled: 'neutral',
};

export function quoteStatusTone(status: string): StatusTone {
  return TONES[status] ?? 'neutral';
}
