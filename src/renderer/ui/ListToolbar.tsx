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

/**
 * Barre d'outils commune des listes (P4a, F25). Deux zones côte à côte : la zone qui passe à la ligne (onglets, compteur,
 * Actualiser, recherche, filtres) et l'action principale, qui reste en haut à droite. Quand les listes déroulantes
 * prennent la largeur, ce sont les filtres qui descendent d'une rangée, jamais l'action principale qui reste seule sur
 * une ligne ; quand tout tient, la barre garde une seule rangée. L'ordre du DOM (donc du clavier) ne change pas.
 */
export function ListToolbar({ countLabel, onRefresh, search, leading, filters, primary }: ListToolbarProps) {
  return (
    <div className="aw-list-toolbar">
      <div className="aw-list-toolbar-main">
        {leading && <div className="aw-list-toolbar-leading">{leading}</div>}
        <strong className="aw-list-toolbar-count">{countLabel}</strong>
        {onRefresh && <button className="secondary-button" type="button" onClick={onRefresh}><OperationIcon name="refresh" size={16} /> Actualiser</button>}
        {search && <input className="inline-search" type="search" value={search.value} disabled={search.disabled} placeholder={search.placeholder} aria-label={search.ariaLabel} onChange={(event) => search.onChange(event.target.value)} />}
        {filters && <div className="aw-list-toolbar-filters">{filters}</div>}
      </div>
      {primary && <div className="aw-list-toolbar-primary">{primary}</div>}
    </div>
  );
}
