import type { ReactNode } from 'react';
import './list-page.css';

export interface KeyFigureItem {
  key: string;
  label: string;
  value: string | number;
  /** Aide courte sous la valeur (ex. « 1 200 € prêts »). Absente : aucune balise. */
  helper?: string;
  /** R8 : carte cliquable (ex. Statistiques : ouvrir le détail exact). Absente : la carte reste un article, comme en R7. */
  onAction?: () => void;
  /** Ce que fait le clic, dit au lecteur d'écran : « {label} : {actionLabel} ». */
  actionLabel?: string;
  expanded?: boolean;
  /** Identifiant du panneau que la carte ouvre (`aria-controls`). */
  controls?: string;
  /** P5d (F27) : icône facultative (une `OperationIcon` ou un glyphe), affichée avant le libellé, cachée aux lecteurs d'écran. */
  icon?: ReactNode;
  /** P5d (F27) : couleur d'état facultative, par les jetons sémantiques de R0. */
  tone?: 'success' | 'warning' | 'danger' | 'info' | 'accent';
}

/** Une carte de chiffre clé : article simple, ou bouton quand une action est fournie. */
export function KeyFigureCard({ item }: { item: KeyFigureItem }) {
  const body = (
    <>
      {item.icon != null && <span className="aw-keyfigure-icon" aria-hidden="true">{item.icon}</span>}
      <strong>{item.label}</strong>
      <span className="aw-keyfigure-value">{item.value}</span>
      {item.helper && <small>{item.helper}</small>}
      {item.onAction && <span className="aw-keyfigure-cue" aria-hidden="true">{item.expanded ? 'Masquer le détail' : 'Voir le détail'} ›</span>}
    </>
  );
  const variants = [item.icon != null ? 'aw-keyfigure--with-icon' : '', item.tone ? `aw-keyfigure--tone-${item.tone}` : ''].filter(Boolean).join(' ');
  const base = variants ? `aw-keyfigure ${variants}` : 'aw-keyfigure';
  if (!item.onAction) return <article className={base}>{body}</article>;
  return (
    <button
      type="button"
      className={`${base} aw-keyfigure--action`}
      aria-label={item.actionLabel ? `${item.label} : ${item.actionLabel}` : item.label}
      aria-expanded={item.expanded}
      aria-controls={item.controls}
      onClick={item.onAction}
    >
      {body}
    </button>
  );
}

/**
 * Chiffres clés d'un écran : libellé, valeur en grand, aide courte, 14 px minimum.
 * P5d (F27) : seul composant de chiffres clés ; `className` garde la grille propre à un écran, `children` ajoute
 * un élément dans la même grille (ex. le champ « Estimation actuelle » d'une intervention).
 */
export function KeyFigures({ items, ariaLabel, className, children }: { items: KeyFigureItem[]; ariaLabel: string; className?: string; children?: ReactNode }) {
  return (
    <section className={className ? `aw-keyfigures ${className}` : 'aw-keyfigures'} aria-label={ariaLabel}>
      {items.map((item) => <KeyFigureCard key={item.key} item={item} />)}
      {children}
    </section>
  );
}
