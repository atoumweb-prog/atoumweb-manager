import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = (name: string) => readFileSync(resolve(__dirname, name), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const count = (source: string, pattern: RegExp) => (source.match(pattern) ?? []).length;

/** Fichiers CSS ecrits pour la refonte : aucune surcharge forcee, aucune couleur ecrite en dur. */
const REFONTE_FILES = ['next-step.css', 'shared-controls.css'];

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

  it('next-step.css keeps text readable : no --muted on a tinted surface, non-breaking colon, focus ring on --accent-strong', () => {
    const source = css('next-step.css');
    expect(source).not.toMatch(/var\(--muted\)/);
    expect(source).toContain(String.raw`\00a0:`);
    expect(source).toMatch(/\.aw-more-menu-item:focus-visible\s*\{[^}]*var\(--accent-strong\)/);
  });

  it('budget : ui-consistency-v2.css has at most 99 !important (104 before R1)', () => {
    expect(count(readFileSync(resolve(__dirname, '..', 'ui-consistency-v2.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''), /!important/g)).toBeLessThanOrEqual(99);
  });

  it('the shared aw-ui-* controls live in shared-controls.css, not in ui-consistency-v2.css', () => {
    const legacy = readFileSync(resolve(__dirname, '..', 'ui-consistency-v2.css'), 'utf8');
    expect(legacy).not.toMatch(/\.aw-ui-(button|field|notice|control-error)/);
    expect(css('shared-controls.css')).toMatch(/\.aw-ui-button--danger/);
  });

  it('main.tsx imports shared-controls.css right after ui-consistency-v2.css', () => {
    const main = readFileSync(resolve(__dirname, '..', 'main.tsx'), 'utf8');
    const legacy = main.indexOf("import './ui-consistency-v2.css'");
    const shared = main.indexOf("import './ui/shared-controls.css'");
    expect(legacy).toBeGreaterThanOrEqual(0);
    expect(shared).toBeGreaterThan(legacy);
    const between = main.slice(legacy, shared).split(String.fromCharCode(10)).filter((line) => line.startsWith('import ') && !line.includes('ui-consistency-v2.css') && !line.includes('shared-controls.css'));
    expect(between).toEqual([]);
  });

  it('main.tsx imports next-step.css after styles.css', () => {
    const main = readFileSync(resolve(__dirname, '..', 'main.tsx'), 'utf8');
    const styles = main.indexOf("import './styles.css'");
    const next = main.indexOf("import './ui/next-step.css'");
    expect(next).toBeGreaterThan(styles);
  });
});
