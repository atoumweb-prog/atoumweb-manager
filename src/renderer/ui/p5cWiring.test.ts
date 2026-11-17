import { readdirSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { countSmallFontDeclarations } from './fontFloor';

/**
 * P5c : plancher de 14 px atteint partout. Seule exception (décision de Carlos du 15/11/2026) :
 * l'aperçu du devis « côté client » garde les tailles du document PDF (règles `.quote-document-*`).
 */
const RENDERER = resolve(__dirname, '..');
const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');

function cssFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(dir, entry.name);
    return entry.isDirectory() ? cssFiles(path) : entry.name.endsWith('.css') ? [path] : [];
  });
}

describe('P5c : adaptations mesurées', () => {
  it('fiche projet : l’unité « min » du temps estimé ne se coupe plus à 14 px', () => {
    const css = strip(readFileSync(resolve(RENDERER, 'projects.css'), 'utf8'));
    const start = css.indexOf('.project-workbench-estimate label > div > span {');
    expect(css.slice(start, css.indexOf('}', start))).toMatch(/white-space:\s*nowrap/);
  });
});

describe('P5c : plus aucun texte d’interface sous 14 px', () => {
  const counts = cssFiles(RENDERER).map((file) => [relative(RENDERER, file).split('\\').join('/'), countSmallFontDeclarations(readFileSync(file, 'utf8'))] as const).filter(([, n]) => n > 0);

  it('seul l’aperçu du document client garde des tailles sous 14 px', () => {
    expect(counts).toEqual([['quote-client-preview.css', 12]]);
  });

  it('ces tailles appartiennent toutes aux règles du document (.quote-document-*)', () => {
    const css = strip(readFileSync(resolve(RENDERER, 'quote-client-preview.css'), 'utf8'));
    const offenders: string[] = [];
    for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (countSmallFontDeclarations(`x{${match[2]}}`) === 0) continue;
      const selectors = match[1].split(',').map((s) => s.trim());
      if (!selectors.every((s) => s.startsWith('.quote-document'))) offenders.push(match[1].trim());
    }
    expect(offenders).toEqual([]);
  });
});
