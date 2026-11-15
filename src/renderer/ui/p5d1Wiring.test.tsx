import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { KeyFigures } from './KeyFigures';

/** P5d1 (F27) : un seul composant de chiffres clés, enrichi d'une icône et d'une couleur d'état facultatives. */
const read = (relative: string) => readFileSync(resolve(__dirname, '..', relative), 'utf8');

describe('P5d1 : KeyFigures enrichi', () => {
  it('une icône facultative est rendue avant le libellé, cachée aux lecteurs d’écran', () => {
    const markup = renderToStaticMarkup(createElement(KeyFigures, { ariaLabel: 'Synthèse', items: [{ key: 'a', label: 'Plans actifs', value: 3, icon: '▤' }] }));
    expect(markup).toMatch(/<span class="aw-keyfigure-icon" aria-hidden="true">▤<\/span><strong>Plans actifs<\/strong>/);
    expect(markup).toContain('aw-keyfigure--with-icon');
  });

  it('une couleur d’état facultative devient une classe de ton', () => {
    const markup = renderToStaticMarkup(createElement(KeyFigures, { ariaLabel: 'Synthèse', items: [{ key: 'a', label: 'Restant', value: '-2 h', tone: 'warning' }] }));
    expect(markup).toContain('aw-keyfigure--tone-warning');
  });

  it('la valeur porte un repère durable, la classe et les éléments en plus sont relayés', () => {
    const markup = renderToStaticMarkup(createElement(KeyFigures, { ariaLabel: 'Synthèse', className: 'client-operations-kpis', items: [{ key: 'a', label: 'En cours', value: 1 }] }, createElement('label', null, 'Estimation')));
    expect(markup).toContain('class="aw-keyfigures client-operations-kpis"');
    expect(markup).toContain('<span class="aw-keyfigure-value">1</span>');
    expect(markup).toMatch(/<\/article><label>Estimation<\/label><\/section>/);
  });

  it('sans icône ni ton, la carte reste celle des listes', () => {
    const markup = renderToStaticMarkup(createElement(KeyFigures, { ariaLabel: 'Synthèse', items: [{ key: 'a', label: 'Offerts', value: 0 }] }));
    expect(markup).toContain('<article class="aw-keyfigure">');
    expect(markup).not.toContain('aw-keyfigure-icon');
  });

  it('la valeur garde sa taille même sous une règle générique de page (« .project-production-page span »)', () => {
    const css = read('ui/list-page.css').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(css).toMatch(/\.aw-keyfigure > \.aw-keyfigure-value \{ font-size: 22px;/);
  });

  it('les tons utilisent les jetons sémantiques, sans couleur en dur', () => {
    const css = read('ui/list-page.css').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const tone of ['success', 'warning', 'danger', 'info', 'accent']) expect(css, tone).toContain(`.aw-keyfigure--tone-${tone}`);
    expect(css).toContain('var(--aw-warning-soft-bg)');
    const toneRules = css.match(/\.aw-keyfigure--tone-[^{]*\{[^}]*\}/g) ?? [];
    expect(toneRules.join('')).not.toMatch(/#[0-9a-f]{3,6}|!important/i);
  });
});

describe('P5d1 : les six variantes passent par KeyFigures', () => {
  const cases: Array<[string, string]> = [
    ['projects/ProjectCommercialTab.tsx', 'project-keyfigure'],
    ['projects/ProjectSummaryTab.tsx', 'project-keyfigure'],
    ['operations/MaintenancePanel.tsx', 'maintenance-dashboard-icon'],
    ['operations/HourPacksPanel.tsx', '<div className="hour-pack-kpi-grid">'],
    ['operations/OperationsPage.tsx', '<div className="intervention-kpi-grid">'],
    ['statistics/StatisticsPage.tsx', 'className="statistics-snapshot"'],
    ['crm/ClientOperationsTab.tsx', 'client-operation-kpi'],
  ];
  for (const [file, old] of cases) {
    it(`${file} : KeyFigures, plus de « ${old} »`, () => {
      const source = read(file);
      expect(source).toContain('<KeyFigures');
      expect(source).not.toContain(old);
    });
  }

  it('le pack d’heures garde l’alerte quand le restant est négatif', () => {
    expect(read('operations/HourPacksPanel.tsx')).toContain("tone: selected.balanceSeconds < 0 ? 'warning' : undefined");
  });

  it('la recette de la fiche client vise le repère durable de la valeur', () => {
    const recipe = readFileSync(resolve(__dirname, '../../../scripts/check-client-interventions.cjs'), 'utf8');
    expect(recipe).toContain('.client-operations-kpis .aw-keyfigure-value');
    expect(recipe).not.toContain('client-operation-kpi strong');
  });
});
