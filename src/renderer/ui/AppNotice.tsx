import type { ReactNode } from 'react';

export type AppNoticeLevel = 'info' | 'success' | 'warning' | 'error';

export type AppNoticeProps = {
  level: AppNoticeLevel;
  children: ReactNode;
  /** The action must already be available and authorized by the caller. */
  action?: { label: string; onClick: () => void };
  /** Closing a notice never performs an operation or cancels a pending service. */
  onClose?: () => void;
  className?: string;
};

/**
 * UX/UI V2 01B.5 — presentational notice pilot.
 * No message queue, timers, IPC, inferred success, or destructive behavior.
 * The business owner decides the level AFTER its real service responds.
 */
export function AppNotice({ level, children, action, onClose, className }: AppNoticeProps) {
  return <div
    className={['aw-ui-notice', `aw-ui-notice--${level}`, className].filter(Boolean).join(' ')}
    role={level === 'error' ? 'alert' : 'status'}
    aria-live={level === 'error' ? 'assertive' : 'polite'}
  >
    <span className="aw-ui-notice-body">{children}</span>
    {action && <button className="aw-ui-notice-action" type="button"
      onClick={action.onClick}>{action.label}</button>}
    {onClose && <button className="aw-ui-notice-close" type="button"
      aria-label="Fermer la notification" onClick={onClose}>×</button>}
  </div>;
}
