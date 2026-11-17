import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * P3b F20 : câblage du lien « Voir toutes (N) » de l'onglet Interventions d'un projet vers la page
 * Interventions filtrée par projet, vérifié par lecture du source. La fonction pure est testée dans
 * `shared/operationsProjectFilter.test.ts`. Le filtre vit dans l'état de l'application : rien n'est écrit en base.
 */
const read = (relative: string) => readFileSync(resolve(__dirname, relative), 'utf8');

describe('P3b F20 : de l’onglet Interventions d’un projet à la page filtrée', () => {
  it('l’onglet du projet rend un lien « Voir toutes (N) » qui déclenche l’événement avec le projet et la vue', () => {
    const tab = read('../projects/ProjectOperationsTab.tsx');
    expect(tab).toContain('OPEN_OPERATIONS_PROJECT_EVENT');
    expect(tab).toMatch(/projectLabel: string/);
    expect(tab).toMatch(/Voir toutes \(\{requests\.length\}\)/);
    expect(tab).toMatch(/Voir toutes \(\{interventions\.length\}\)/);
    expect(tab).toMatch(/onClick=\{\(\) => openAll\('requests'\)\}/);
    expect(tab).toMatch(/onClick=\{\(\) => openAll\('interventions'\)\}/);
    expect(tab).toMatch(/const detail: OperationsProjectFilter = \{ projectId, projectLabel: projectLabel \?\? '', view \}/);
    expect(read('../projects/ProjectsPage.tsx')).toMatch(/<ProjectOperationsTab projectId=\{detail\.id\} projectLabel=\{detail\.name\}/);
  });

  it('App.tsx ouvre la page par la garde habituelle des brouillons, mémorise le filtre et l’oublie à toute autre ouverture', () => {
    const app = read('../App.tsx');
    expect(app).toContain('OPEN_OPERATIONS_PROJECT_EVENT');
    expect(app).toMatch(/requestPage\('Interventions & Maintenance',\(\)=>\{[^}]*setOperationsProjectFilter\(detail\)/);
    expect(app).toMatch(/projectFilter=\{operationsProjectFilter\}/);
    expect(app).toMatch(/onClearProjectFilter=\{\(\)\s*=>\s*setOperationsProjectFilter\(null\)\}/);
    // Navigation par le rail et ouverture d'une cible de recherche : jamais un filtre ancien.
    const direct = app.match(/function navigateDirect\(page: PageName\): void \{[\s\S]*?\r?\n  \}/)![0];
    expect(direct).toMatch(/setOperationsProjectFilter\(null\)/);
    const target = app.match(/function openOperationsTargetDirect\(target: OperationsSearchTarget\): void \{[\s\S]*?\r?\n  \}/)![0];
    expect(target).toMatch(/setOperationsProjectFilter\(null\)/);
  });

  it('la page Interventions filtre demandes et interventions, montre une pastille retirable et ouvre la bonne vue', () => {
    const page = read('OperationsPage.tsx');
    expect(page).toContain("from '../../shared/operationsProjectFilter'");
    expect(page).toMatch(/filterByProject\(requests, projectFilter\?\.projectId\)/);
    expect(page).toMatch(/filterByProject\(interventions, projectFilter\?\.projectId\)/);
    expect(page).toMatch(/Projet : \{projectFilter\.projectLabel\}/);
    expect(page).toMatch(/aria-label="Retirer le filtre Projet"/);
    expect(page).toMatch(/setView\(projectFilter\.view\)/);
    // Seules les vues Demandes et Interventions sont filtrées : Maintenance et Packs gardent leur liste complète.
    expect(page).not.toMatch(/filterByProject\((?:maintenance|packs|subscriptions)/);
  });
});
