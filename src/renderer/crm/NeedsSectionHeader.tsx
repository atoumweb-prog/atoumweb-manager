/**
 * En-tête d'une section repliable de la fiche de travail (R3). Le contenu de la section reste monté
 * (attribut `hidden`) : replier ne perd jamais un brouillon. Réutilise le style `prospect-work-accordion-*`.
 */
export function NeedsSectionHeader({ id, title, summary, open, onToggle }: { id: string; title: string; summary?: string; open: boolean; onToggle: (id: string) => void }) {
  return <button type="button" className="prospect-work-accordion-trigger needs-section-trigger" aria-expanded={open} aria-controls={`needs-section-${id}`} onClick={() => onToggle(id)}>
    <span className="prospect-work-accordion-arrow" aria-hidden="true">{open ? '▾' : '▸'}</span>
    <span className="prospect-work-accordion-title">{title}</span>
    {!open && summary && <span className="prospect-work-accordion-summary">{summary}</span>}
  </button>;
}
