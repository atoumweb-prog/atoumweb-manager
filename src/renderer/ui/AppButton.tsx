import { useRef, useState } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type AppButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger';

type ButtonContent =
  | { children: ReactNode; icon?: ReactNode; 'aria-label'?: string }
  | { children?: never; icon: ReactNode; 'aria-label': string };

export type AppButtonProps =
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'type' | 'children' | 'aria-label'> & {
    variant?: AppButtonVariant;
    /** User action only. No service or business transitions in this component. */
    onAction?: () => void | Promise<void>;
    onActionError?: (error: unknown) => void;
    /** An externally tracked pending operation also disables the control. */
    pending?: boolean;
  } & ButtonContent;

/**
 * 01B presentational button pilot.
 * Defaults to type=button to avoid submitting legacy forms by accident.
 * Prevents double activation while a returned Promise is pending.
 * Never claims success. If an action rejects, a visible generic error is shown.
 */
export function AppButton({
  variant = 'secondary',
  icon,
  onAction,
  onActionError,
  pending = false,
  children,
  disabled,
  className,
  ...rest
}: AppButtonProps) {
  const lock = useRef(false);
  const [running, setRunning] = useState(false);
  const [failed, setFailed] = useState(false);
  const busy = pending || running;

  async function activate() {
    if (!onAction || busy || disabled || lock.current) return;
    lock.current = true;
    setFailed(false);
    try {
      const result = onAction();
      if (result && typeof (result as Promise<void>).then === 'function') {
        setRunning(true);
        await result;
      }
    } catch (error) {
      setFailed(true);
      onActionError?.(error);
    } finally {
      lock.current = false;
      setRunning(false);
    }
  }

  return <span className="aw-ui-button-wrap">
    <button
      {...rest}
      type="button"
      className={['aw-ui-button', `aw-ui-button--${variant}`, className].filter(Boolean).join(' ')}
      disabled={Boolean(disabled || busy)}
      aria-busy={busy ? true : undefined}
      aria-label={rest['aria-label']}
      onClick={() => void activate()}
    >
      {icon && <span className="aw-ui-button-icon" aria-hidden="true">{icon}</span>}
      {children && <span className="aw-ui-button-label">{children}</span>}
      {busy && <span className="aw-ui-button-progress" aria-hidden="true">…</span>}

    </button>
    {failed && <span className="aw-ui-control-error" role="alert">L’action n’a pas abouti.</span>}
  </span>;
}
