import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { countSmallFontDeclarations } from './fontFloor';

/** P5a (Offres & Tarifs) : plus aucune déclaration sous 14 px dans les feuilles du catalogue. */
const read = (relative: string) => readFileSync(resolve(__dirname, '..', relative), 'utf8');
const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** Règles d'une feuille dont le sélecteur correspond à `pattern` et qui déclarent un font-size en px sous 14. */
function smallCatalogRules(css: string, pattern: RegExp): string[] {
  const found: string[] = [];
  for (const match of strip(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = match[1].trim();
    if (!pattern.test(selector)) continue;
    if (countSmallFontDeclarations(`x{${match[2]}}`) > 0) found.push(selector);
  }
  return found;
}

describe('P5a : feuilles du catalogue au plancher de 14 px', () => {
  it('catalog-workspace-v2.css ne déclare plus aucun texte sous 14 px', () => {
    expect(countSmallFontDeclarations(read('commercial/catalog-workspace-v2.css'))).toBe(0);
  });

  it('catalog-editor-v2.css ne déclare plus aucun texte sous 14 px', () => {
    expect(countSmallFontDeclarations(read('commercial/catalog-editor-v2.css'))).toBe(0);
  });

  it('fenêtre étroite : les actions de l’en-tête d’une fiche d’article passent à la ligne au lieu de déborder', () => {
    const css = strip(read('commercial.css'));
    const start = css.indexOf('.catalog-detail-heading-actions {');
    const body = css.slice(start, css.indexOf('}', start));
    expect(body).toMatch(/flex-wrap:\s*wrap/);
    expect(body).toMatch(/min-width:\s*0/);
  });

  it('commercial.css : plus aucune règle du catalogue ou des offres sous 14 px (celles du devis restent pour P5c)', () => {
    expect(smallCatalogRules(read('commercial.css'), /\.(catalog|offer)-/)).toEqual([]);
  });
});
