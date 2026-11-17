import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '..');

function cssFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return cssFiles(path);
    return entry.name.endsWith('.css') ? [path] : [];
  });
}

const withoutComments = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, '');

/** Sélecteurs retirés en P2 (M7) : plus aucun élément de l'application ne porte ces classes. */
const REMOVED_SELECTORS = ['.database-chip', '.health-dot'];
/** Feuilles dont une liste de sélecteurs ou une règle a été amputée par ce retrait. */
const PRUNED_FILES = ['styles.css', 'display-density.css', 'ui-typography-consistency.css'];

describe('CSS mort retiré (P2, M7)', () => {
  it('les sélecteurs retirés ne reviennent dans aucune feuille et aucune règle n’est laissée vide', () => {
    const offenders = cssFiles(ROOT).flatMap(file => {
      const source = withoutComments(readFileSync(file, 'utf8'));
      return REMOVED_SELECTORS.filter(selector => source.includes(selector)).map(selector => `${relative(ROOT, file)} : ${selector}`);
    });
    expect(offenders).toEqual([]);

    for (const name of PRUNED_FILES) {
      const source = withoutComments(readFileSync(join(ROOT, name), 'utf8'));
      // Une liste de sélecteurs ne se termine pas par une virgule juste avant l'accolade, et aucun bloc n'est vide.
      expect(source.match(/,\s*\{/g) ?? [], `${name} : liste de sélecteurs terminée par une virgule`).toEqual([]);
      expect(source.match(/\{\s*\}/g) ?? [], `${name} : bloc vide`).toEqual([]);
    }
  });
});
