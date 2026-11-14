import type { ProjectDetail } from '../../shared/projects';
import { countMissingPrerequisites } from '../../shared/projectOverview';
import { commercialModeLabel } from '../../shared/projectTabs';
import { projectTypeLabel } from '../../shared/projectTypeLabel';
import { dateLabel, duration } from './projectFormat';

/** Résumé du projet : où il en est (quatre chiffres), puis ses informations. La progression reste dans l'en-tête, elle n'est pas répétée ici. */
export function ProjectSummaryTab({ project, onShowPrerequisites }: { project: ProjectDetail; onShowPrerequisites: () => void }) {
  const missing = countMissingPrerequisites(project.prerequisites);
  const openTasks = project.nodes.filter((node) => ['task', 'checklist'].includes(node.type) && node.required && node.status !== 'done').length;
  const origin = project.sourceQuoteId
    ? project.commercialState === 'provisional' ? 'Devis non accepté' : project.commercialState === 'frozen' ? 'Devis accepté' : 'Devis source (historique)'
    : null;
  return (
    <div className="project-tab-content">
      <div className="project-keyfigures">
        <div className="project-keyfigure"><span>Temps estimé{project.estimationIncomplete ? ' (incomplet)' : ''}</span><strong>{duration(project.estimatedMinutes)}</strong></div>
        <div className="project-keyfigure"><span>Tâches restantes</span><strong>{openTasks}</strong></div>
        {missing > 0
          ? <button type="button" className="project-keyfigure" onClick={onShowPrerequisites} title="Ouvrir l’onglet Prérequis"><span>Prérequis manquants</span><strong>{missing}</strong></button>
          : <div className="project-keyfigure"><span>Prérequis manquants</span><strong>0</strong></div>}
        <div className="project-keyfigure"><span>Date cible</span><strong>{project.targetDate ? dateLabel(project.targetDate) : 'Non définie'}</strong></div>
      </div>
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
