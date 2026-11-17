import type { ReactNode } from 'react';
import { FieldHelp } from './FieldHelp';

/**
 * En-tête de page unique (R2) : icône et titre dans un seul `h1`, aide `?` à côté, compteur facultatif,
 * actions à droite. Garde la classe `page-heading` lue par les scripts de recette. Aucune donnée technique
 * (le détail des migrations est dans Réglages, rubrique diagnostic). Présentation seule.
 */
export function PageHeader({ icon, title, help, meta, actions }: { icon: ReactNode; title: string; help?: string; meta?: ReactNode; actions?: ReactNode }) {
  return <div className="page-heading aw-page-header">
    <div className="aw-page-header-title"><h1>{icon}{title}</h1>{help && <FieldHelp text={help} />}{meta && <span className="aw-page-header-meta">{meta}</span>}</div>
    {actions && <div className="aw-page-header-actions">{actions}</div>}
  </div>;
}
