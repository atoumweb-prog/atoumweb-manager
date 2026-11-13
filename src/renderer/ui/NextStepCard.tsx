import type { ReactNode } from 'react';
import { AppButton } from './AppButton';

export type NextStepTone = 'default' | 'warning' | 'danger' | 'success';
export type NextStepAlertTone = 'warning' | 'danger' | 'success' | 'info';

export interface NextStepAction {
  label: string;
  onAction: () => void | Promise<void>;
  disabled?: boolean;
}

export interface NextStepAlert {
  tone: NextStepAlertTone;
  text: string;
}

/**
 * Bloc d'action « Prochaine étape » : une action principale, des actions secondaires, des alertes.
 * Surcouche : il réutilise `AppButton` et ne décide d'aucune règle métier ; l'appelant fournit le contenu.
 * Le libellé « Prochaine étape » est un préfixe en ligne du titre, jamais un surtitre.
 */
export function NextStepCard({ title, reason, tone = 'default', primary, secondary = [], alerts = [], children, className }: {
  title: string;
  reason?: string;
  tone?: NextStepTone;
  primary?: NextStepAction;
  secondary?: NextStepAction[];
  alerts?: NextStepAlert[];
  children?: ReactNode;
  className?: string;
}) {
  const hasActions = Boolean(primary) || secondary.length > 0;
  return <section className={['aw-next-step', `aw-next-step--${tone}`, className].filter(Boolean).join(' ')} aria-label="Prochaine étape">
    <h3 className="aw-next-step-title"><span className="aw-next-step-prefix">Prochaine étape</span> <span className="aw-next-step-text">{title}</span></h3>
    {reason && <p className="aw-next-step-reason">{reason}</p>}
    {alerts.map((alert, index) => <p key={index} role={alert.tone === 'danger' ? 'alert' : 'status'} className={`aw-next-step-alert aw-next-step-alert--${alert.tone}`}>{alert.text}</p>)}
    {children}
    {hasActions && <div className="aw-next-step-actions">
      {primary && <AppButton variant="primary" disabled={primary.disabled} onAction={primary.onAction}>{primary.label}</AppButton>}
      {secondary.map((action, index) => <AppButton key={`${index}-${action.label}`} variant="secondary" disabled={action.disabled} onAction={action.onAction}>{action.label}</AppButton>)}
    </div>}
  </section>;
}
