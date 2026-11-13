import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = (name: string) => readFileSync(resolve(__dirname, name), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const count = (source: string, pattern: RegExp) => (source.match(pattern) ?? []).length;

/** Fichiers CSS ecrits pour la refonte : aucune surcharge forcee, aucune couleur ecrite en dur. */
const REFONTE_FILES = ['next-step.css'];

describe('refonte : discipline CSS des fichiers nouveaux', () => {
  for (const file of REFONTE_FILES) {
    it(`${file} has no !important`, () => {
      expect(count(css(file), /!important/g)).toBe(0);
    });

    it(`${file} has no hard-coded color`, () => {
      const source = css(file);
      expect(source.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).toEqual([]);
      expect(source.match(/\b(?:rgb|rgba|hsl|hsla)\(/g) ?? []).toEqual([]);
    });
  }

  it('main.tsx imports next-step.css after styles.css', () => {
    const main = readFileSync(resolve(__dirname, '..', 'main.tsx'), 'utf8');
    const styles = main.indexOf("import './styles.css'");
    const next = main.indexOf("import './ui/next-step.css'");
    expect(next).toBeGreaterThan(styles);
  });
});
