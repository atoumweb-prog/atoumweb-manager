import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { countSmallFontDeclarations } from './fontFloor';

/** P4a : gardes de source du lot (même méthode que `gestionR7Wiring.test.ts`). */
const read = (relative: string) => readFileSync(resolve(__dirname, '..', relative), 'utf8');

describe('P4a (F43, F23) : en-tête et blocs de tête de l’Accueil', () => {
  const homeR6 = read('home/home-r6.css').replace(/\/\*[\s\S]*?\*\//g, '');
  const dashboard = read('home/HomeDashboard.tsx');

  it('F43 : la rangée d’actions de l’en-tête passe à la ligne au lieu de dépasser la zone en fenêtre étroite', () => {
    const rule = homeR6.match(/\.home-heading-actions\s*\{([^}]*)\}/);
    expect(rule).not.toBeNull();
    expect(rule![1]).toContain('flex-wrap: wrap');
    expect(rule![1]).toContain('min-width: 0');
  });

  it('F23 : « À faire maintenant » et « À surveiller » prennent toute la largeur, sans vide à côté', () => {
    const rule = homeR6.match(/\.home-widget-today\s*,\s*\.home-widget-watch\s*\{([^}]*)\}/);
    expect(rule).not.toBeNull();
    expect(rule![1]).toMatch(/grid-column:\s*1\s*\/\s*-1/);
  });

  it('la feuille home-r6.css est importée après la feuille V2, dont elle corrige la règle grid-column: auto', () => {
    expect(dashboard.indexOf("import './HomeDashboardV2.css';")).toBeGreaterThan(-1);
    expect(dashboard.indexOf("import './home-r6.css';")).toBeGreaterThan(dashboard.indexOf("import './HomeDashboardV2.css';"));
  });

  it('aucun !important ni texte sous 14 px dans la feuille', () => {
    expect(homeR6).not.toContain('!important');
    expect(countSmallFontDeclarations(homeR6)).toBe(0);
  });
});

describe('P4a (F28) : les listes compactes parlent comme le reste de Gestion', () => {
  const expenses = read('expenses/ExpensesPage.tsx');
  const billing = read('billing/BillingPage.tsx');
  const operations = read('operations/OperationsPage.tsx');

  it('plus aucun message vide local', () => {
    expect(expenses).not.toContain('Aucune dépense dans cette vue.');
    expect(billing).not.toContain('Aucun élément de facturation.');
    expect(operations).not.toContain('Aucune demande dans cette vue.');
    expect(operations).not.toContain('Aucune intervention dans cette vue.');
  });

  it('chaque liste compacte passe par compactListEmptyText avec le message de son écran', () => {
    expect(expenses).toContain('compactListEmptyText(expensesEmptyText(),');
    expect(billing).toContain('compactListEmptyText(billingEmptyText(),');
    expect(operations).toContain("compactListEmptyText(operationsEmptyText('requests'),");
    expect(operations).toContain("compactListEmptyText(operationsEmptyText('interventions'),");
  });
});
