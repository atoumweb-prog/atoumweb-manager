import type { ReactNode } from 'react';
import { OperationIcon } from '../operations/OperationIcon';
import './list-page.css';

export interface ListToolbarProps {
  /** Compteur déjà accordé par l'appelant (`plural(11, 'demande', 'demandes')`) : jamais « (s) ». */
  countLabel: string;
  onRefresh?: () => void;
  search?: { value: string; onChange: (value: string) => void; placeholder: string; ariaLabel: string; disabled?: boolean };
  /** Avant le compteur : onglets de période, choix de vue. */
  leading?: ReactNode;
  filters?: ReactNode;
  /** Action principale de l'écran (le seul bouton jaune), toujours à droite. */
  primary?: ReactNode;
}

/** Barre d'outils commune des listes Gestion : une seule rangée qui passe à la ligne quand la place manque. */
export function ListToolbar({ countLabel, onRefresh, search, leading, filters, primary }: ListToolbarProps) {
  return (
    <div className="aw-list-toolbar">
      {leading && <div className="aw-list-toolbar-leading">{leading}</div>}
      <strong className="aw-list-toolbar-count">{countLabel}</strong>
      {onRefresh && <button className="secondary-button" type="button" onClick={onRefresh}><OperationIcon name="refresh" size={16} /> Actualiser</button>}
      {search && <input className="inline-search" type="search" value={search.value} disabled={search.disabled} placeholder={search.placeholder} aria-label={search.ariaLabel} onChange={(event) => search.onChange(event.target.value)} />}
      {filters && <div className="aw-list-toolbar-filters">{filters}</div>}
      {primary && <div className="aw-list-toolbar-primary">{primary}</div>}
    </div>
  );
}
