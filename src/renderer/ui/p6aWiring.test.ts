import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/** P6a : gardes de source du lot (même méthode que `p4aWiring.test.ts`). Les bancs natifs 01b, 01d et 01f portent la preuve de comportement. */
const read = (relative: string) => readFileSync(resolve(__dirname, '..', relative), 'utf8');
const readRepo = (relative: string) => readFileSync(resolve(__dirname, '..', '..', '..', relative), 'utf8');

describe('P6a (F50, F51) : le redimensionnement de colonne à la souris n’est pas annulé par son propre aperçu', () => {
  const table = read('ui/DataTable.tsx');

  it('widthOf sait se passer de l’aperçu', () => {
    expect(table).toContain('const widthOf = (id: string, withPreview = true) =>');
    expect(table).toContain('withPreview && preview?.id === id');
  });

  it('la poignée reçoit la largeur enregistrée, sans l’aperçu (sinon son effet de nettoyage annule le geste au premier mouvement)', () => {
    expect(table).toMatch(/<ColumnSizer[^>]*width=\{widthOf\(column\.id, false\)\}/);
    expect(table).not.toMatch(/<ColumnSizer[^>]*width=\{widthOf\(column\.id\)\}/);
  });

  it('la colonne et la largeur totale du tableau suivent bien l’aperçu', () => {
    expect(table).toContain('<col key={column.id} style={{ width: widthOf(column.id) }}/>');
    expect(table).toContain('total + widthOf(column.id)');
  });
});

describe('P6a (F47) : la page Annuaire rend le focus au champ de recherche de la barre commune', () => {
  const directory = read('directory/DirectoryPage.tsx');

  it('le focus de repli vise la barre commune (R8), pas l’ancienne barre .directory-toolbar qui n’existe plus', () => {
    expect(directory).not.toContain('.directory-toolbar');
    expect(directory).toContain(".aw-list-toolbar .inline-search");
  });
});

describe('P6a (F49) : le banc 01b n’exige plus un nombre figé de feuilles CSS', () => {
  const bench = readRepo('scripts/check-ux-v2-lot01b-workshop.cjs');
  const main = read('main.tsx');

  it('plus de « === 31 », mais un plancher et des règles d’ordre', () => {
    expect(bench).not.toContain('files.length===31');
    expect(bench).toContain('files.length>=31');
    for (const sheet of ['tokens.css', 'styles.css', 'ui-typography-consistency.css', 'ui-consistency-v2.css']) expect(bench, sheet).toContain(sheet);
  });

  it('main.tsx respecte l’ordre des couches que le banc exige', () => {
    const at = (sheet: string) => main.indexOf(`import './${sheet}';`);
    expect(at('tokens.css')).toBeGreaterThan(-1);
    expect(at('styles.css')).toBeGreaterThan(at('tokens.css'));
    expect(at('ui-typography-consistency.css')).toBeGreaterThan(at('styles.css'));
    expect(at('ui-consistency-v2.css')).toBeGreaterThan(at('ui-typography-consistency.css'));
  });
});
