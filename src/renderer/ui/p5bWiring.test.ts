import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { countSmallFontDeclarations } from './fontFloor';

/** P5b (listes et en-tête) : plus aucune déclaration sous 14 px sur les écrans du lot. */
const read = (relative: string) => readFileSync(resolve(__dirname, '..', relative), 'utf8');
const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** Sélecteurs (de la liste exacte donnée) dont la règle déclare encore un font-size en px sous 14. */
function smallRules(css: string, selectors: readonly string[]): string[] {
  const wanted = new Set(selectors);
  const found: string[] = [];
  for (const match of strip(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const list = match[1].split(',').map((s) => s.trim().replace(/\s+/g, ' '));
    const hit = list.filter((s) => wanted.has(s));
    if (hit.length && countSmallFontDeclarations(`x{${match[2]}}`) > 0) found.push(...hit);
  }
  return found;
}

describe('P5b : fichiers des écrans du lot au plancher de 14 px', () => {
  for (const file of ['statistics/StatisticsPage.css', 'bridge/BridgeSitesPage.css', 'directory/DirectoryPage.css', 'crm-identity.css', 'crm/client-list-quick-v2.css', 'ui/workspace-header.css']) {
    it(`${file} : aucune déclaration sous 14 px`, () => {
      expect(countSmallFontDeclarations(read(file))).toBe(0);
    });
  }

  it('règles ciblées des feuilles partagées', () => {
    expect(smallRules(read('time.css'), ['.timer-label', '.timer-context', '.timer-actions button', '.timer-popover > div:first-child strong', '.timer-popover label', '.time-clock-mark', '.time-table th', '.time-table td > small'])).toEqual([]);
    expect(smallRules(read('projects.css'), ['.project-table th', '.project-table td', '.project-table td > small', '.project-progress-cell > span'])).toEqual([]);
    expect(smallRules(read('crm.css'), ['.module-toolbar > div:first-child', '.link-button'])).toEqual([]);
    expect(smallRules(read('prospect-workflow.css'), ['.prospect-view-switch button span'])).toEqual([]);
  });
});

describe('P5b : éléments décoratifs (décision de Carlos du 15/11/2026)', () => {
  it('la pastille du nombre d’alertes est agrandie pour tenir 14 px', () => {
    const header = strip(read('ui/workspace-header.css'));
    const rule = header.slice(header.indexOf('.aw-header-alert-count{'), header.indexOf('}', header.indexOf('.aw-header-alert-count{')));
    expect(rule).toContain('min-width:20px');
    expect(rule).toContain('height:20px');
  });

  it('le cadran de l’horloge n’a plus de chiffres : des traits à la place', () => {
    const page = read('time/TimePage.tsx');
    expect(page).not.toMatch(/time-clock-mark mark-\d+">\d+<\/span>/);
    expect(page).toContain('<span className="time-clock-mark mark-12" />');
  });
});
