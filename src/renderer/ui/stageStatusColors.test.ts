import { readdirSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const RENDERER = resolve(__dirname, '..');
const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');
function cssFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(dir, entry.name);
    return entry.isDirectory() ? cssFiles(path) : entry.name.endsWith('.css') ? [path] : [];
  });
}

/** Toutes les règles dont un sélecteur vise encore une pastille d'étape de prospect maison (`.prospect-directory-status-<étape>`). */
function stageRules() {
  const found: string[] = [];
  for (const file of cssFiles(RENDERER)) {
    const css = strip(readFileSync(file, 'utf8'));
    for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (rule[1].split(',').some((s) => /\.prospect-directory-status(-[a-z_]+)?(?![\w-])/.test(s))) found.push(relative(RENDERER, file).split('\\').join('/'));
    }
  }
  return found;
}

describe('R3 : les pastilles d’étape de prospect passent par StatusPill', () => {
  it('plus aucune règle CSS ne peint une pastille d’étape à la main : la couleur vient de prospectStatusTone (table testée dans prospectStatusTone.test.ts)', () => {
    expect(stageRules()).toEqual([]);
  });
});
