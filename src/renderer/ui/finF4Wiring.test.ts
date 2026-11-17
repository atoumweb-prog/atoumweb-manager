import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/** Fin de refonte, lot F4 : densités Compact et Confort +. */
const root = resolve(__dirname, '..');
const cssFiles = (dir: string): string[] => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? cssFiles(path) : name.endsWith('.css') ? [path] : [];
});
const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');

describe('F4 : le style d’un thème ne dépend pas de la densité', () => {
  it('aucune règle ne vise la seule densité Confort (la palette du Noir vaut en Compact et en Confort +)', () => {
    const found = cssFiles(root).flatMap((file) => {
      const hits = strip(readFileSync(file, 'utf8')).match(/\[data-density=['"]?comfort['"]?\]/g) ?? [];
      return hits.length ? [`${relative(root, file)} (${hits.length})`] : [];
    });
    expect(found).toEqual([]);
  });

  it('seule la feuille des densités vise Compact ou Confort + par leur nom', () => {
    const found = cssFiles(root).filter((file) => !file.endsWith('display-density.css'))
      .filter((file) => /\[data-density=['"]?(compact|comfort_plus)['"]?\]/.test(strip(readFileSync(file, 'utf8'))))
      .map((file) => relative(root, file));
    expect(found).toEqual([]);
  });
});

describe('F4 : les noms des tableaux passent sur deux lignes au lieu d’être coupés (Confort +)', () => {
  it.each([
    ['documents/DocumentsPage.css', '.documents-table-title strong'],
    ['directory/DirectoryPage.css', '.directory-name-cell strong'],
  ])('%s : %s sur deux lignes au plus', (file, selector) => {
    const css = strip(readFileSync(join(root, file), 'utf8'));
    expect(css).toContain(`:root[data-theme][data-density] ${selector}{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;white-space:normal;overflow-wrap:break-word}`);
  });
});
