import type { ProjectDetail } from '../../shared/projects';
import { commercialEmptyMessage, offeredValueCents } from '../../shared/projectTabs';
import { money } from './projectFormat';

/** Commercial : combien et pour quoi. « Valeur offerte » n'apparaît que s'il y a un écart ; le message vide dit pourquoi. */
export function ProjectCommercialTab({ project }: { project: ProjectDetail }) {
  const offered = offeredValueCents(project.commercialValueCents, project.contractValueCents);
  return (
    <div className="project-tab-content">
      <div className="project-keyfigures">
        <div className="project-keyfigure"><span>Valeur commerciale</span><strong>{money(project.commercialValueCents)}</strong></div>
        <div className="project-keyfigure"><span>Montant contractuel</span><strong>{money(project.contractValueCents)}</strong></div>
        {offered > 0 && <div className="project-keyfigure"><span>Valeur offerte</span><strong>{money(offered)}</strong></div>}
      </div>
      <strong className="project-section-title">Prestations figées depuis le devis</strong>
      {project.services.length > 0
        ? <div className="project-services-list">{project.services.map((service) => <div key={service.id}><div><strong>{service.label}</strong><small>{service.catalogVersionId ? 'Version du catalogue figée' : 'Ligne libre'}</small></div><span>{money(service.contractValueCents)}</span></div>)}</div>
        : <p className="project-empty">{commercialEmptyMessage({ commercialMode: project.commercialMode, sourceQuoteId: project.sourceQuoteId })}</p>}
    </div>
  );
}
