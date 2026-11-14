import type { projectNowSummary } from '../../shared/projectOverview';

type Summary = ReturnType<typeof projectNowSummary>;

/**
 * Ligne « En ce moment » de l'en-tête d'un projet (R5a) : ce qui bloque, attend le client ou demande une validation,
 * et les prérequis manquants. Présentation seule : les compteurs viennent de `projectNowSummary` (données existantes).
 * Chaque compteur non nul est un bouton qui mène à la bonne liste ; rien à signaler = une phrase, sans bouton.
 */
export function ProjectNowLine({ summary, onShowAction, onShowPrerequisites }: { summary: Summary; onShowAction: () => void; onShowPrerequisites: () => void }) {
  if (summary.clear) return <p className="project-now-line project-now-line--clear" role="status">Rien ne bloque ce projet.</p>;
  const items: Array<{ key: string; label: string; onClick: () => void }> = [];
  if (summary.blocked > 0) items.push({ key: 'blocked', label: `${summary.blocked} ${summary.blocked > 1 ? 'tâches bloquées' : 'tâche bloquée'}`, onClick: onShowAction });
  if (summary.waitingClient > 0) items.push({ key: 'waiting', label: `${summary.waitingClient} ${summary.waitingClient > 1 ? 'attendent' : 'attend'} le client`, onClick: onShowAction });
  if (summary.toValidate > 0) items.push({ key: 'validate', label: `${summary.toValidate} à valider`, onClick: onShowAction });
  if (summary.prerequisitesMissing > 0) items.push({ key: 'prerequisites', label: `${summary.prerequisitesMissing} ${summary.prerequisitesMissing > 1 ? 'prérequis manquants' : 'prérequis manquant'}`, onClick: onShowPrerequisites });
  return <p className="project-now-line" role="status">
    <strong>En ce moment :</strong>
    {items.map((item) => <button key={item.key} type="button" className="project-now-line-item" onClick={item.onClick}>{item.label}</button>)}
    {summary.overdue && <span className="project-now-line-overdue">Date cible dépassée</span>}
  </p>;
}
