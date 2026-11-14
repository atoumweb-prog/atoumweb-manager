import './list-page.css';

export interface KeyFigureItem {
  key: string;
  label: string;
  value: string | number;
  /** Aide courte sous la valeur (ex. « 1 200 € prêts »). Absente : aucune balise. */
  helper?: string;
}

/** Chiffres clés d'un écran de liste : libellé, valeur en grand, aide courte. Sans icône, 14 px minimum. */
export function KeyFigures({ items, ariaLabel }: { items: KeyFigureItem[]; ariaLabel: string }) {
  return (
    <section className="aw-keyfigures" aria-label={ariaLabel}>
      {items.map((item) => (
        <article key={item.key} className="aw-keyfigure">
          <strong>{item.label}</strong>
          <span>{item.value}</span>
          {item.helper && <small>{item.helper}</small>}
        </article>
      ))}
    </section>
  );
}
