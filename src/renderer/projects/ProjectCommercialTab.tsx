import type { ProjectDetail } from '../../shared/projects';
import { commercialEmptyMessage, offeredValueCents } from '../../shared/projectTabs';
import { KeyFigures } from '../ui/KeyFigures';
import { money } from './projectFormat';

/** Commercial : combien et pour quoi. « Valeur offerte » n'apparaît que s'il y a un écart ; le message vide dit pourquoi. */
export function ProjectCommercialTab({ project }: { project: ProjectDetail }) {
  const offered = offeredValueCents(project.commercialValueCents, project.contractValueCents);
  return (
    <div className="project-tab-content">
      <KeyFigures ariaLabel="Montants du projet" items={[
        { key: 'commercial', label: 'Valeur commerciale', value: money(project.commercialValueCents) },
        { key: 'contract', label: 'Montant contractuel', value: money(project.contractValueCents) },
        ...(offered > 0 ? [{ key: 'offered', label: 'Valeur offerte', value: money(offered) }] : []),
      ]} />
      <strong className="project-section-title">Prestations figées depuis le devis</strong>
      {project.services.length > 0
        ? <div className="project-services-list">{project.services.map((service) => <div key={service.id}><div><strong>{service.label}</strong><small>{service.catalogVersionId ? 'Version du catalogue figée' : 'Ligne libre'}</small></div><span>{money(service.contractValueCents)}</span></div>)}</div>
        : <p className="project-empty">{commercialEmptyMessage({ commercialMode: project.commercialMode, sourceQuoteId: project.sourceQuoteId })}</p>}
    </div>
  );
}
