import { useState } from 'react';
import type { SearchResult } from '../../shared/crm';
import type { TodoItem } from '../../shared/homeTodo';
import { limitItems } from '../../shared/projectTabs';
import { StatusPill } from '../ui/StatusPill';

export const TODO_VISIBLE = 7;

export interface HomeTodoCardProps {
  items: TodoItem[];
  /** Faux quand la source des dossiers n'a pas été confirmée : on ne prétend jamais que « tout va bien ». */
  ready: boolean;
  onOpen: (target: SearchResult) => void;
  initiallyExpanded?: boolean;
}

/** « À faire maintenant » : ce qu'il faut faire d'abord, avec le nom du dossier et un bouton Ouvrir. Sept lignes, le reste se déplie sur place. */
export function HomeTodoCard({ items, ready, onOpen, initiallyExpanded = false }: HomeTodoCardProps) {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const { shown, hidden } = limitItems(items, TODO_VISIBLE);
  const rows = expanded ? items : shown;
  return (
    <article className="home-card home-todo-card" aria-label="À faire maintenant">
      {items.length > 0 && (
        <ul className="home-todo-list">
          {rows.map((item) => (
            <li key={item.key} className="home-todo-row">
              <StatusPill tone={item.tone}>{item.label}</StatusPill>
              <span className="home-todo-copy">
                <strong>{item.title}</strong>
                {(item.subtitle || item.detail) && <small>{[item.subtitle, item.detail].filter(Boolean).join(' · ')}</small>}
              </span>
              <button type="button" className="secondary-button" aria-label={`Ouvrir ${item.title}`} onClick={() => onOpen(item.target)}>Ouvrir</button>
            </li>
          ))}
        </ul>
      )}
      {hidden > 0 && (
        <button type="button" className="home-todo-more" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
          {expanded ? 'Replier' : hidden === 1 ? 'Afficher l’autre élément' : `Afficher les ${hidden} autres éléments`}
        </button>
      )}
      {items.length === 0 && (
        <div className="home-todo-empty">
          {ready
            ? <><strong>Rien d’urgent pour le moment.</strong><span>Prépare un devis ou fais avancer un prospect.</span></>
            : <><strong>Dossiers du jour indisponibles</strong><span>Actualisation non confirmée ; consultez le détail des sources.</span></>}
        </div>
      )}
    </article>
  );
}
