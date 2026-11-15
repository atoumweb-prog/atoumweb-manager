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
}

/** Une carte de chiffre clé : article simple, ou bouton quand une action est fournie. */
export function KeyFigureCard({ item }: { item: KeyFigureItem }) {
  const body = (
    <>
      <strong>{item.label}</strong>
      <span>{item.value}</span>
      {item.helper && <small>{item.helper}</small>}
      {item.onAction && <span className="aw-keyfigure-cue" aria-hidden="true">{item.expanded ? 'Masquer le détail' : 'Voir le détail'} ›</span>}
    </>
  );
  if (!item.onAction) return <article className="aw-keyfigure">{body}</article>;
  return (
    <button
      type="button"
      className="aw-keyfigure aw-keyfigure--action"
      aria-label={item.actionLabel ? `${item.label} : ${item.actionLabel}` : item.label}
      aria-expanded={item.expanded}
      aria-controls={item.controls}
      onClick={item.onAction}
    >
      {body}
    </button>
  );
}

/** Chiffres clés d'un écran de liste : libellé, valeur en grand, aide courte. Sans icône, 14 px minimum. */
export function KeyFigures({ items, ariaLabel }: { items: KeyFigureItem[]; ariaLabel: string }) {
  return (
    <section className="aw-keyfigures" aria-label={ariaLabel}>
      {items.map((item) => <KeyFigureCard key={item.key} item={item} />)}
    </section>
  );
}
