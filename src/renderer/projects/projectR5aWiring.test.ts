import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/** R5a : câblage de la fiche Projet, vérifié par lecture du source (même méthode que `crm/prospectR3Wiring.test.ts`). */
const readSource = (file: string) => readFileSync(resolve(__dirname, file), 'utf8');
const css = (file: string) => readSource(file).replace(/\/\*[\s\S]*?\*\//g, '');
const body = (source: string, selector: string) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\>]/g, '\\$&');
  const match = source.match(new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`));
  return match ? match[1].replace(/\s+/g, ' ').trim() : null;
};

describe('R5a : mise en page de la page projet (cause des onglets étirés)', () => {
  const projects = css('../projects.css');

  it('la page projet est une colonne flex, plus une grille à trois rangées fixes', () => {
    const rule = body(projects, '.project-production-page');
    expect(rule).not.toBeNull();
    expect(rule).toContain('display: flex');
    expect(rule).toContain('flex-direction: column');
    expect(rule).not.toContain('grid-template-rows');
  });

  it('le dernier enfant (le contenu de l’onglet) remplit la hauteur restante', () => {
    const rule = body(projects, '.project-production-page > :last-child');
    expect(rule).not.toBeNull();
    expect(rule).toContain('flex: 1 1 auto');
    expect(rule).toContain('min-height: 0');
  });

  it('la barre d’onglets ne s’étire jamais : sa hauteur est celle de ses boutons', () => {
    const rule = body(projects, '.project-production-nav');
    expect(rule).toContain('flex: 0 0 auto');
    expect(rule).toContain('align-items: flex-start');
  });

  it('l’en-tête, le bloc de périmètre et la barre d’onglets gardent leur hauteur naturelle', () => {
    const rule = body(projects, '.project-production-page > :not(:last-child)');
    expect(rule).not.toBeNull();
    expect(rule).toContain('flex: 0 0 auto');
  });

  it('les règles de Sites et pages ne visent plus de grille sur cette page', () => {
    expect(css('sites-pages-v2.css')).not.toMatch(/\.project-production-page:has\(\.atelier-focus\)\s*\{[^}]*grid-template-rows/);
  });
});

describe('R5a : périmètre figé replié, périmètre prévisionnel intact', () => {
  const panel = readSource('ProjectCommercialScopePanel.tsx');

  it('l’état figé se replie sur une ligne de résumé', () => {
    expect(panel).toContain("scope.state==='frozen'");
    expect(panel).toContain('project-commercial-scope--folded');
    expect(panel).toContain('scopeFoldedSummary(');
    expect(panel).toMatch(/<summary className="project-commercial-scope-summary">/);
  });

  it('les intitulés techniques sont remplacés par des intitulés clairs', () => {
    expect(panel).toContain('Versions du périmètre');
    expect(panel).toContain('Prestations à placer dans le plan');
    expect(panel).not.toContain('Historique du périmètre');
    expect(panel).not.toContain('Affectation des prestations');
  });

  it('le périmètre prévisionnel garde ses boutons, hors de tout repli', () => {
    expect(panel).toMatch(/isCurrentProvisional && <>[\s\S]*?Synchroniser le périmètre commercial[\s\S]*?Examiner « Repartir de zéro »/);
    expect(panel).toContain('Confirmer la régénération du Projet');
  });

  it('un conflit, une prestation à placer ou une erreur déplie le résumé', () => {
    expect(panel).toMatch(/open=\{[^}]*conflicts\.length[^}]*\}/);
  });
});

describe('R5a : Production lisible', () => {
  const page = readSource('ProjectsPage.tsx');
  const projects = css('../projects.css');

  it('le nom de phase n’écrit plus le numéro deux fois et la méta se lit en toutes lettres', () => {
    expect(page).toContain('phaseDisplayName(phase.name)');
    expect(page).toMatch(/completedSteps\} sur \{trackableSteps\.length\} \{trackableSteps\.length > 1 \? 'tâches' : 'tâche'\} · Temps estimé/);
  });

  it('le nom de phase peut passer sur deux lignes au lieu d’être coupé', () => {
    const rule = body(projects, '.project-phase-name');
    expect(rule).not.toBeNull();
    expect(rule).not.toContain('text-overflow: ellipsis');
    expect(rule).not.toContain('white-space: nowrap');
  });

  it('la note « ancien plan » n’a plus l’air d’une alerte', () => {
    expect(page).not.toContain('Ce projet utilise un ancien plan');
    // P3b (F13) : la note devient une simple mention dans la ligne du plan, sans boîte ni ton d'alerte.
    expect(page).toContain('plan issu du modèle d’origine');
    expect(page).not.toContain('project-legacy-plan-note');
  });

  it('le statut d’une tâche passe par la pastille commune', () => {
    expect(page).toContain('<StatusPill tone={projectStatusTone(node.status)}>{NODE_STATUS_LABELS[node.status]}</StatusPill>');
    expect(page).not.toContain('<span className={`status-${node.status}`}>');
  });

  it('à l’ouverture, la première tâche à faire est sélectionnée et sa phase dépliée, sans écraser un retour de contexte', () => {
    expect(page).toMatch(/else \{[^}]*defaultTaskToOpen\(next\.nodes\)[^}]*rootAncestorId\(next\.nodes,/);
    expect(page).toMatch(/if \(returnContext\?\.projectId === id\) \{[\s\S]*?\} else \{/);
  });
});

describe('R5a : ligne « En ce moment » et filtre d’action', () => {
  const page = readSource('ProjectsPage.tsx');

  it('l’en-tête rend la ligne « En ce moment », calculée sur les données du projet, sans date cible pour un projet clos', () => {
    expect(page).toContain('<ProjectNowLine');
    // G2 (F58) : un projet terminé affiche le bandeau ProjectClosedLine ; la ligne « En ce moment » ne sert plus qu'aux projets non terminés.
    expect(page).toContain("{detail.status === 'completed' ? <ProjectClosedLine");
    expect(page).toContain("projectNowSummary(detail.nodes, detail.prerequisites, detail.status === 'archived' ? null : detail.targetDate)");
  });

  it('les compteurs d’action ouvrent le plan filtré, les prérequis ouvrent leur onglet', () => {
    expect(page).toMatch(/onShowPrerequisites=\{\(\) => selectProjectTab\('prerequisites'\)\}/);
    expect(page).toMatch(/onShowAction=\{\(\) => \{[^}]*setActionOnly\(true\)/);
  });

  it('le plan propose le filtre « Ce qui demande une action », sans rien enregistrer en base', () => {
    expect(page).toContain('Ce qui demande une action');
    expect(page).toContain('filterActionNodes(detail.nodes)');
    expect(page).toMatch(/const \[actionOnly, setActionOnly\] = useState\(false\)/);
  });

  it('annuler et rétablir ont un nom lisible', () => {
    expect(page).toContain('aria-label="Annuler la dernière modification"');
    expect(page).toContain('aria-label="Rétablir la modification"');
  });
});

describe('R5a : liste des projets', () => {
  const page = readSource('ProjectsPage.tsx');

  it('le type est en français sous le nom, plus la valeur brute', () => {
    expect(page).toContain('<small>{projectTypeLabel(project.projectType)}</small>');
    expect(page).not.toContain('<small>{project.projectType}</small>');
  });

  it('le statut passe par la pastille commune', () => {
    expect(page).toContain('<StatusPill tone={projectStatusTone(project.status)}>{PROJECT_STATUS_LABELS[project.status]}</StatusPill>');
    expect(page).not.toContain('project-status status-');
  });

  it('les colonnes utiles sont affichées par défaut, les autres restent disponibles dans « Colonnes et vues »', () => {
    expect(page).toContain("defaultVisibleColumnIds={['identity','client','name','status','progress','target','open']}");
    for (const id of ['commercial', 'estimated']) expect(page).toContain(`{id:"${id}"`);
  });

  it('le message vide dit quoi faire', () => {
    expect(page).toContain('emptyText="Aucun projet pour l’instant. Crée-en un depuis un devis accepté."');
  });
});

describe('R5a : onglet d’ouverture selon l’état du projet', () => {
  const page = readSource('ProjectsPage.tsx');

  it('sans contexte de retour, l’onglet vient de l’état du projet, plus d’un « plan » fixe', () => {
    expect(page).toContain("setDetailTab(returnContext?.projectId === id ? returnContext.detailTab : projectOpeningTab({ status: next.status, prerequisitesMissing: projectNowSummary(next.nodes, next.prerequisites, null).prerequisitesMissing }));");
    expect(page).not.toContain("returnContext.detailTab : 'plan');");
  });

  it('le retour sur un projet garde son onglet (le contexte de retour l’emporte)', () => {
    expect(page).toMatch(/returnContext\?\.projectId === id \? returnContext\.detailTab :/);
  });
});

describe('R5a : en-tête du plan sans coupure de boutons', () => {
  const r5a = css('project-r5a.css');
  it('le filtre et « + Ajouter » ne se coupent pas sur deux lignes ; l’en-tête du plan passe à la ligne plutôt que d’écraser', () => {
    expect(body(r5a, '.project-tree-filter-button')).toContain('white-space: nowrap');
    expect(body(r5a, '.project-production-add > summary')).toContain('white-space: nowrap');
    expect(body(r5a, '.project-production-tree-head')).toContain('flex-wrap: wrap');
  });
});
