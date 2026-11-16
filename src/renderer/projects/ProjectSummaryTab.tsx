import type { ProjectDetail } from '../../shared/projects';
import { countMissingPrerequisites } from '../../shared/projectOverview';
import { commercialModeLabel } from '../../shared/projectTabs';
import { projectTypeLabel } from '../../shared/projectTypeLabel';
import { KeyFigures } from '../ui/KeyFigures';
import { dateLabel, duration } from './projectFormat';

/** Résumé du projet : où il en est (quatre chiffres), puis ses informations. La progression reste dans l'en-tête, elle n'est pas répétée ici. */
export function ProjectSummaryTab({ project, onShowPrerequisites }: { project: ProjectDetail; onShowPrerequisites: () => void }) {
  const missing = countMissingPrerequisites(project.prerequisites);
  // F58 : un projet terminé présente ce qui restait comme « non fait à la clôture », sans alerte.
  const closed = project.status === 'completed';
  const openTasks = project.nodes.filter((node) => ['task', 'checklist'].includes(node.type) && node.required && node.status !== 'done').length;
  const origin = project.sourceQuoteId
    ? project.commercialState === 'provisional' ? 'Devis non accepté' : project.commercialState === 'frozen' ? 'Devis accepté' : 'Devis source (historique)'
    : null;
  return (
    <div className="project-tab-content">
      <KeyFigures ariaLabel="Où en est le projet" items={[
        { key: 'estimate', label: `Temps estimé${project.estimationIncomplete ? ' (incomplet)' : ''}`, value: duration(project.estimatedMinutes) },
        { key: 'tasks', label: closed ? 'Tâches non faites à la clôture' : 'Tâches restantes', value: openTasks },
        missing > 0 && !closed
          ? { key: 'prerequisites', label: 'Prérequis manquants', value: missing, onAction: onShowPrerequisites, actionLabel: 'ouvrir l’onglet Prérequis', tone: 'warning' as const }
          : { key: 'prerequisites', label: closed ? 'Prérequis non faits à la clôture' : 'Prérequis manquants', value: missing },
        { key: 'target', label: 'Date cible', value: project.targetDate ? dateLabel(project.targetDate) : 'Non définie' },
      ]} />
      <strong className="project-section-title">Informations</strong>
      <dl className="project-facts">
        <div><dt>Type</dt><dd>{projectTypeLabel(project.projectType)}</dd></div>
        <div><dt>Tarif</dt><dd>{commercialModeLabel(project.commercialMode)}</dd></div>
        <div><dt>Créé le</dt><dd>{dateLabel(project.createdAt)}</dd></div>
        {origin && <div><dt>Origine</dt><dd>{origin}</dd></div>}
      </dl>
      {project.notes && <div className="project-note"><strong className="project-section-title">Notes</strong><p>{project.notes}</p></div>}
    </div>
  );
}
