import React from 'react';
import type { ProjectBlueprintNodeSource } from '../../shared/projects';

export function ProjectBlueprintOrigins({sources = []}: {sources?: ProjectBlueprintNodeSource[]}) {
  if (!sources.length) return null;
  return <aside className="project-blueprint-origins" aria-label="Origine dans le devis">
    <strong>Préparé depuis le devis</strong>
    <ul>{sources.map(source => <li key={source.contributionKey+':'+source.unitIndex+':'+source.sourceTemplateNodeId}>
      {source.label} · {source.role === 'base' ? 'structure de base' : 'complément'}
      {source.optionPurchase ? ' · option achetée' : ''}
      {' · quantité vendue : '+(source.quantityMilli/1000).toLocaleString('fr-FR')}
      {source.quantityMode === 'per_unit' ? ' · unité '+source.unitIndex : ' · contribution unique'}
    </li>)}</ul>
  </aside>;
}
