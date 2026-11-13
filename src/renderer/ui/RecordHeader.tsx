import type { ReactNode } from 'react';
import { MoreMenu } from './MoreMenu';
import type { MenuItem } from './moreMenuModel';
import { StatusPill, type StatusTone } from './StatusPill';

/**
 * En-tête de dossier (contact, devis, projet) : titre, sous-titre, état, actions et menu « Plus ».
 * Les enfants forment l'emplacement du bloc « Prochaine étape », sous l'en-tête. Aucune règle métier.
 */
export function RecordHeader({ title, subtitle, status, actions, moreItems, onMore, children, className }: {
  title: string;
  subtitle?: string;
  status?: { label: string; tone?: StatusTone };
  actions?: ReactNode;
  moreItems?: MenuItem[];
  onMore?: (id: string) => void;
  children?: ReactNode;
  className?: string;
}) {
  const hasMore = Boolean(moreItems && moreItems.length > 0);
  return <header className={['aw-record-header', className].filter(Boolean).join(' ')}>
    <div className="aw-record-header-main">
      <h2 className="aw-record-header-title">{title}</h2>
      {subtitle && <p className="aw-record-header-subtitle">{subtitle}</p>}
    </div>
    <div className="aw-record-header-side">
      {status && <StatusPill tone={status.tone}>{status.label}</StatusPill>}
      {actions}
      {hasMore && <MoreMenu items={moreItems as MenuItem[]} onSelect={(id) => onMore?.(id)} />}
    </div>
    {children && <div className="aw-record-header-next">{children}</div>}
  </header>;
}
