import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { countSmallFontDeclarations } from './fontFloor';

/** P4b : gardes de source du lot (même méthode que `p4aWiring.test.ts`). */
const read = (relative: string) => readFileSync(resolve(__dirname, '..', relative), 'utf8');
const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const countOf = (source: string, needle: string) => source.split(needle).length - 1;

describe('P4b (F35) : Statistiques, une ligne commune au lieu de quatre « Nouveau sur la période »', () => {
  const page = read('statistics/StatisticsPage.tsx');
  const css = stripComments(read('statistics/StatisticsPage.css'));

  it('un composant de groupe porte la ligne commune et les quatre blocs de chiffres l’utilisent (Vue d’ensemble, Commercial, Projets et temps, Clients)', () => {
    expect(page).toContain('function KpiGroup(');
    expect(page).toContain('allNewComparisons(');
    expect(page).toContain('NO_PREVIOUS_PERIOD_NOTE');
    expect(countOf(page, '<KpiGroup>')).toBe(4);
    expect(countOf(page, '</KpiGroup>')).toBe(4);
  });

  it('la section de chiffres clés n’existe plus qu’une fois, dans le composant de groupe', () => {
    expect(countOf(page, '<section className="aw-keyfigures"')).toBe(1);
  });

  it('la note a sa règle, sans !important ni texte sous 14 px (les 18 déclarations plus anciennes de la feuille sont celles de P5)', () => {
    const rule = css.match(/\.statistics-comparison-note\s*\{([^}]*)\}/);
    expect(rule).not.toBeNull();
    expect(rule![1]).not.toContain('!important');
    expect(countSmallFontDeclarations(`.x{${rule![1]}}`)).toBe(0);
  });
});

describe('P4b (F38) : Sauvegardes sans sur-titres fixes', () => {
  const page = read('backups/BusinessBackupsPage.tsx');

  it('plus aucun sur-titre en capitales devant les quatre titres de bloc', () => {
    for (const text of ['Prévention opérationnelle', 'Vigilance métier', 'Nouvel enregistrement', 'Historique']) {
      expect(page, text).not.toContain(`<span className="eyebrow">${text}</span>`);
    }
  });

  it('les quatre titres de bloc restent', () => {
    for (const title of ['Avant / après intervention', 'Alertes des projets actifs', 'Sauvegarde métier', 'Sauvegardes']) {
      expect(page, title).toContain(`<h2>${title}</h2>`);
    }
  });
});

describe('P4b (F40) : Réglages, Apparence et Navigation côte à côte', () => {
  const page = read('settings/SettingsPage.tsx');
  const css = stripComments(read('settings/settings-r9.css'));
  const company = read('commercial/CompanyQuoteSettings.tsx');

  it('l’article d’Apparence porte sa classe', () => {
    expect(page).toContain('settings-appearance');
  });

  it('deux colonnes seulement quand la grille a la place (requête de conteneur) et seulement si les deux sections se suivent', () => {
    expect(css).toMatch(/\.settings-grid\s*\{[^}]*container-type:\s*inline-size/);
    const query = css.match(/@container\s*\(min-width:\s*(\d+)px\)/);
    expect(query).not.toBeNull();
    const threshold = Number(query![1]);
    expect(threshold).toBeGreaterThanOrEqual(900);
    expect(threshold).toBeLessThanOrEqual(1200);
    expect(css).toMatch(/\.settings-grid\s*>\s*\.settings-appearance:has\(\+\s*\.settings-navigation\)\s*\{[^}]*grid-column:\s*1\b/);
    expect(css).toMatch(/\.settings-grid\s*>\s*\.settings-appearance\s*\+\s*\.settings-navigation\s*\{[^}]*grid-column:\s*2\b/);
  });

  it('les autres sections restent pleine largeur', () => {
    expect(css).toMatch(/\.settings-grid\s*>\s*\.panel\s*\{[^}]*grid-column:\s*1\s*\/\s*-1/);
  });

  it('la feuille n’a ni !important ni texte sous 14 px', () => {
    expect(css).not.toContain('!important');
    expect(countSmallFontDeclarations(css)).toBe(0);
  });

  it('la légende « Informations de l’entreprise » est masquée à l’écran mais gardée pour les lecteurs d’écran', () => {
    expect(company).toContain('Informations de l’entreprise');
    expect(company).toContain('settings-legend-quiet');
    expect(css).toMatch(/\.settings-legend-quiet\s*\{[^}]*clip-path:\s*inset\(50%\)/);
    expect(css).toMatch(/\.settings-legend-quiet\s*\{[^}]*width:\s*1px/);
  });
});

describe('P4b (Temps, option C) : les quatre filtres tiennent sur une ligne', () => {
  const css = stripComments(read('time.css'));

  it('les listes de la barre de Temps ont une largeur fixée (la règle globale annule max-width)', () => {
    const rule = css.match(/\.time-page-stack\s+\.aw-list-toolbar-filters\s+select\s*\{([^}]*)\}/);
    expect(rule).not.toBeNull();
    expect(rule![1]).toMatch(/width:\s*200px/);
    expect(rule![1]).toContain('min-width: 0');
  });

  it('les deux dernières listes (catégorie, facturable) sont assez larges pour que leur texte ne soit pas coupé', () => {
    const third = css.match(/\.time-page-stack\s+\.aw-list-toolbar-filters\s+select:nth-child\(3\)\s*\{([^}]*)\}/);
    const fourth = css.match(/\.time-page-stack\s+\.aw-list-toolbar-filters\s+select:nth-child\(4\)\s*\{([^}]*)\}/);
    expect(third).not.toBeNull();
    expect(fourth).not.toBeNull();
    expect(Number(third![1].match(/width:\s*(\d+)px/)![1])).toBeGreaterThanOrEqual(215);
    expect(Number(fourth![1].match(/width:\s*(\d+)px/)![1])).toBeGreaterThanOrEqual(250);
  });
});
