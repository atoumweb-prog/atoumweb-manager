import type { ReactNode } from 'react';

export const STATUS_TONES = ['neutral', 'success', 'warning', 'danger', 'info', 'accent'] as const;
export type StatusTone = (typeof STATUS_TONES)[number];

/** Un ton inconnu retombe sur « neutral » : jamais d'état affiché avec une couleur trompeuse. */
export function toneOrNeutral(value: unknown): StatusTone {
  return (STATUS_TONES as readonly unknown[]).includes(value) ? (value as StatusTone) : 'neutral';
}

/**
 * Pastille d'état alignée sur les tokens de la refonte (`--aw-*-soft-bg` / `--aw-*-soft-fg`).
 * Le libellé est toujours affiché : la couleur ne porte jamais seule l'information.
 */
export function StatusPill({ tone = 'neutral', children, className }: { tone?: StatusTone; children: ReactNode; className?: string }) {
  return <span className={['aw-status-pill', `aw-status-pill--${toneOrNeutral(tone)}`, className].filter(Boolean).join(' ')}>{children}</span>;
}
