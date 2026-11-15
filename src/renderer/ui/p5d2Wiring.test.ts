import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/** P5d2 (F27) : les tuiles de l'Accueil passent par KeyFigures, icône et couleur d'état gardées (jetons sémantiques). */
const read = (relative: string) => readFileSync(resolve(__dirname, '..', relative), 'utf8');
const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');

describe('P5d2 : tuiles de l’Accueil', () => {
  const home = read('home/HomeDashboard.tsx');

  it('le widget Indicateurs utilise KeyFigures en gardant sa grille', () => {
    expect(home).toMatch(/kpis:<KeyFigures ariaLabel="Indicateurs du jour" className="home-kpi-grid"/);
    expect(home).not.toContain('function HomeKpi');
    expect(home).not.toContain('home-kpi-card');
  });

  it('chaque tuile garde son icône et prend une couleur d’état par les jetons', () => {
    for (const tone of ['danger', 'info', 'success', 'warning']) expect(home, tone).toContain(`tone: '${tone}'`);
    expect((home.match(/icon: <OperationIcon name="(user|file-text|folder|wrench)"/g) ?? []).length).toBe(4);
  });

  it('les règles des anciennes tuiles (et leurs couleurs en dur) ont disparu', () => {
    for (const file of ['home/HomeDashboard.css', 'home/HomeDashboardV2.css']) {
      expect(strip(read(file)), file).not.toMatch(/\.home-kpi-(card|icon|copy|open)\b/);
    }
  });
});
