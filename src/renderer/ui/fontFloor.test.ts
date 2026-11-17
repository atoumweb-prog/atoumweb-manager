import { readdirSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { countSmallFontDeclarations } from './fontFloor';
import baseline from './fontFloorBaseline.json';

const RENDERER = resolve(__dirname, '..');
const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');

function cssFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(dir, entry.name);
    return entry.isDirectory() ? cssFiles(path) : entry.name.endsWith('.css') ? [path] : [];
  });
}

describe('plancher de 14 px : compteur', () => {
  it('compte seulement les font-size en px inférieurs à 14', () => {
    expect(countSmallFontDeclarations('.a{font-size:12px}.b{font-size:14px}.c{font-size:max(14px,1em)}.d{font-size:13.5px!important}')).toBe(2);
  });

  it('ignore les commentaires et les propriétés personnalisées', () => {
    expect(countSmallFontDeclarations('/* .x{font-size:9px} */.y{--aw-font-size:8px;font-size:var(--aw-font-functional)}')).toBe(0);
  });
});

describe('plancher de 14 px : budget par fichier (ne peut que baisser)', () => {
  const files = cssFiles(RENDERER);

  it('aucun fichier ne dépasse sa valeur de référence', () => {
    const over: string[] = [];
    for (const file of files) {
      const key = relative(RENDERER, file).split('\\').join('/');
      const allowed = (baseline.files as Record<string, number>)[key] ?? 0;
      const actual = countSmallFontDeclarations(readFileSync(file, 'utf8'));
      if (actual > allowed) over.push(`${key}: ${actual} > ${allowed}`);
    }
    expect(over).toEqual([]);
  });

  it('le total de référence est la somme des fichiers', () => {
    const sum = Object.values(baseline.files as Record<string, number>).reduce((a, b) => a + b, 0);
    expect(baseline.total).toBe(sum);
  });
});

describe('plancher de 14 px : en-têtes du tableau partagé', () => {
  it('aucune règle ne met un en-tête de .aw-data-table sous 14 px', () => {
    const offenders: string[] = [];
    for (const file of cssFiles(RENDERER)) {
      const css = strip(readFileSync(file, 'utf8'));
      for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        const selector = rule[1].trim();
        if (selector.includes('.aw-data-table') && /(^|[\s>,(])th([\s>,.:)[]|$)/.test(selector) && countSmallFontDeclarations(rule[2]) > 0) {
          offenders.push(`${relative(RENDERER, file).split('\\').join('/')} : ${selector.slice(0, 90)}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe('plancher de 14 px : .quote-line small', () => {
  it('la règle de ui-consistency-v2.css ne descend pas sous 14 px', () => {
    const css = strip(readFileSync(resolve(RENDERER, 'ui-consistency-v2.css'), 'utf8'));
    const rule = css.match(/\.quote-line small\s*\{([^}]*)\}/);
    expect(rule).not.toBeNull();
    expect(countSmallFontDeclarations(rule![1])).toBe(0);
  });
});
