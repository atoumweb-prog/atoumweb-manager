import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { countSmallFontDeclarations } from '../ui/fontFloor';

/** R5b : câblage et styles des onglets du projet, vérifiés par lecture du source (même méthode que `projectR5aWiring.test.ts`). */
const readSource = (file: string) => readFileSync(resolve(__dirname, file), 'utf8');
const css = (file: string) => readSource(file).replace(/\/\*[\s\S]*?\*\//g, '');
const body = (source: string, selector: string) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\>]/g, '\\$&');
  const match = source.match(new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`));
  return match ? match[1].replace(/\s+/g, ' ').trim() : null;
};

describe('R5b : styles des onglets du projet', () => {
  const r5b = css('project-r5b.css');
  const operations = css('ProjectOperationsTab.css');

  it('aucun !important, aucune couleur en dur, aucun texte sous 14 px', () => {
    for (const source of [r5b, operations]) {
      expect(source).not.toContain('!important');
      expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(countSmallFontDeclarations(source)).toBe(0);
    }
  });

  it('un onglet secondaire « à hauteur de contenu » ne remplit plus la fenêtre', () => {
    const rule = body(r5b, '.project-production-page > .project-production-secondary.project-production-secondary--fit');
    expect(rule).not.toBeNull();
    expect(rule).toContain('flex: 0 1 auto');
  });

  it('la feuille est importée par la page projet', () => {
    expect(readSource('ProjectsPage.tsx')).toContain("import './project-r5b.css';");
  });
});

describe('R5b : câblage de la page projet', () => {
  const page = readSource('ProjectsPage.tsx');

  it('les onglets Résumé, Commercial, Prérequis et Interventions sont à hauteur de contenu, pas les autres', () => {
    expect(page).toContain("['summary', 'commercial', 'prerequisites', 'operations'].includes(detailTab)");
    expect(page).toContain('project-production-secondary--fit');
  });

  it('Résumé et Commercial viennent de leurs composants ; le compteur de prérequis ouvre l’onglet Prérequis', () => {
    expect(page).toContain("import { ProjectSummaryTab } from './ProjectSummaryTab';");
    expect(page).toContain("import { ProjectCommercialTab } from './ProjectCommercialTab';");
    expect(page).toContain("onShowPrerequisites={() => selectProjectTab('prerequisites')}");
    expect(page).not.toContain('function ProjectSummaryTab');
    expect(page).not.toContain('function ProjectCommercialTab');
  });

  it('Prérequis : composant branché sur l’ajout et le changement de statut existants, « Marquer reçu » passe par le même statut', () => {
    expect(page).toContain('<ProjectPrerequisitesTab prerequisites={detail.prerequisites}');
    expect(page).toContain('onAdd={() => void addPrerequisite()}');
    expect(page).toContain('onStatus={(id, status) => void updatePrerequisiteStatus(id, status)}');
    expect(page).not.toContain('PREREQUISITE_STATUS_LABELS');
    expect(readSource('ProjectPrerequisitesTab.tsx')).toContain("onStatus(item.id, 'received')");
  });

  it('les anciennes règles du Résumé et du Commercial ont quitté projects.css', () => {
    const projects = css('../projects.css');
    for (const selector of ['.project-kpis', '.project-summary-list', '.project-commercial-values', '.project-services ']) {
      expect(projects, selector).not.toContain(selector);
    }
  });
});
