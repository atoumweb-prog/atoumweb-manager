import { useState } from 'react';
import { PROJECT_PREREQUISITE_STATUSES, type ProjectPrerequisite, type ProjectPrerequisiteStatus } from '../../shared/projects';
import { canMarkReceived, filterMissingPrerequisites, prerequisiteProgress } from '../../shared/projectOverview';
import { plural } from '../../shared/projectTabs';

const PREREQUISITE_STATUS_LABELS: Record<ProjectPrerequisiteStatus, string> = {
  to_request: 'À demander',
  requested: 'Demandé',
  received: 'Reçu',
  incomplete: 'Incomplet',
  validated: 'Validé',
  not_applicable: 'Non applicable',
};

export interface ProjectPrerequisitesTabProps {
  prerequisites: readonly ProjectPrerequisite[];
  newLabel: string;
  onNewLabelChange: (value: string) => void;
  onAdd: () => void;
  onStatus: (id: string, status: ProjectPrerequisiteStatus) => void;
  /** État initial du filtre « Seulement ce qui manque » (désactivé par défaut). */
  initialOnlyMissing?: boolean;
}

/** Prérequis : qu'est-ce qui manque encore ? Le statut se change dans le sélecteur ; « Marquer reçu » est le raccourci d'un clic. */
export function ProjectPrerequisitesTab({ prerequisites, newLabel, onNewLabelChange, onAdd, onStatus, initialOnlyMissing = false }: ProjectPrerequisitesTabProps) {
  const [onlyMissing, setOnlyMissing] = useState(initialOnlyMissing);
  const progress = prerequisiteProgress(prerequisites);
  const shown = onlyMissing ? filterMissingPrerequisites(prerequisites) : prerequisites;
  const count = progress.total === 0
    ? 'Aucun prérequis à suivre'
    : `${plural(progress.validated, 'validé', 'validés')} sur ${progress.total}${progress.missing > 0 ? ` · ${plural(progress.missing, 'manquant', 'manquants')}` : ''}`;
  return (
    <div className="project-tab-content">
      {prerequisites.length > 0 && (
        <div className="project-prerequisites-head">
          <p className="project-prerequisites-count">{count}</p>
          <label className="project-prerequisites-filter"><input type="checkbox" checked={onlyMissing} onChange={(event) => setOnlyMissing(event.target.checked)} />Seulement ce qui manque</label>
        </div>
      )}
      <div className="project-prerequisite-add">
        <input value={newLabel} onChange={(event) => onNewLabelChange(event.target.value)} placeholder="Ajouter un prérequis…" aria-label="Nouveau prérequis" />
        <button className="secondary-button" type="button" onClick={onAdd}>Ajouter</button>
      </div>
      {prerequisites.length === 0 && <p className="project-empty">Aucun prérequis. Ajoute ce que le client doit fournir ou valider avant de démarrer.</p>}
      {prerequisites.length > 0 && shown.length === 0 && <p className="project-empty">Tous les prérequis sont validés.</p>}
      {shown.length > 0 && (
        <table className="project-prerequisites-table">
          <thead><tr><th scope="col">Prérequis</th><th scope="col">Statut</th></tr></thead>
          <tbody>
            {shown.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className="project-prerequisite-label">
                    <strong>{item.label}{item.required === false && <span className="project-prerequisite-optional">facultatif</span>}</strong>
                    {item.description && <small>{item.description}</small>}
                  </div>
                </td>
                <td>
                  <div className="project-prerequisite-status">
                    {canMarkReceived(item.status) && <button className="secondary-button" type="button" onClick={() => onStatus(item.id, 'received')}>Marquer reçu</button>}
                    <select value={item.status} aria-label={`Statut de ${item.label}`} onChange={(event) => onStatus(item.id, event.target.value as ProjectPrerequisiteStatus)}>
                      {PROJECT_PREREQUISITE_STATUSES.map((status) => <option key={status} value={status}>{PREREQUISITE_STATUS_LABELS[status]}</option>)}
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
