import type { ProjectCompletionReview } from '../../shared/projects';

const STATE_ICON = {
  ok: '✓',
  warning: '!',
  check: '?',
} as const;

export function ProjectCompletionReviewPanel({ review, busy, onConfirm, onCancel }: {
  review: ProjectCompletionReview;
  busy: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}) {
  return (
    <section className="project-completion-review" aria-label="Contrôles de fin de projet">
      <div className="project-completion-heading">
        <div>
          <span className="eyebrow">Avant de terminer</span>
          <strong>Checklist de fin de projet</strong>
          <small>
            {review.warningCount > 0
              ? `${review.warningCount} alerte${review.warningCount > 1 ? 's' : ''} automatique${review.warningCount > 1 ? 's' : ''}`
              : 'Aucune alerte automatique'}
            {review.checkCount > 0 ? ` · ${review.checkCount} point${review.checkCount > 1 ? 's' : ''} à vérifier` : ''}
          </small>
        </div>
        <button className="close-detail" type="button" onClick={onCancel} aria-label="Fermer">×</button>
      </div>

      <p className="project-completion-note">
        Ces contrôles sont des avertissements. Ils ne bloquent pas la clôture si tu décides que le projet peut être terminé.
      </p>

      <div className="project-completion-items">
        {review.items.map((item) => (
          <div key={item.key} className={`project-completion-item state-${item.state}`}>
            <span className="project-completion-icon">{STATE_ICON[item.state]}</span>
            <div>
              <strong>{item.label}</strong>
              <small>{item.detail}</small>
            </div>
            <span className="project-completion-source">{item.automatic ? 'Auto' : 'À vérifier'}</span>
          </div>
        ))}
      </div>

      <div className="button-row project-completion-actions">
        <button className="primary-button" type="button" disabled={busy} onClick={() => void onConfirm()}>
          {busy ? 'Clôture…' : 'Terminer malgré les avertissements'}
        </button>
        <button className="secondary-button" type="button" disabled={busy} onClick={onCancel}>Revenir au projet</button>
      </div>
    </section>
  );
}
