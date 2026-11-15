import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { shouldRestoreSearchFocus } from './searchFocus';

/**
 * P3a (F44) : à la fermeture de la recherche globale, le focus n'est rendu au champ que s'il n'a pas déjà
 * été donné à la fiche ouverte par le résultat (App.tsx focalise la fiche dans un requestAnimationFrame,
 * dont l'ordre avec celui de `closeSearch` n'est pas garanti).
 */
describe('shouldRestoreSearchFocus', () => {
  const inHeader = { id: 'in-header' } as unknown as Node;
  const onPane = { id: 'on-pane' } as unknown as Node;
  const body = { id: 'body' } as unknown as Element;
  const header = { contains: (node: Node) => node === inHeader };

  it('rend le focus au champ quand personne ne l’a pris (focus nul ou sur le corps de la page)', () => {
    expect(shouldRestoreSearchFocus(null, header, body)).toBe(true);
    expect(shouldRestoreSearchFocus(body, header, body)).toBe(true);
  });

  it('rend le focus au champ quand il est resté dans l’en-tête (Échap, retour au déclencheur)', () => {
    expect(shouldRestoreSearchFocus(inHeader as unknown as Element, header, body)).toBe(true);
  });

  it('ne reprend pas le focus quand il est déjà sur la fiche ouverte par le résultat', () => {
    expect(shouldRestoreSearchFocus(onPane as unknown as Element, header, body)).toBe(false);
  });

  it('sans en-tête connu, ne reprend pas un focus déjà posé ailleurs', () => {
    expect(shouldRestoreSearchFocus(onPane as unknown as Element, null, body)).toBe(false);
  });
});

describe('WorkspaceHeader.closeSearch', () => {
  it('consulte l’assistant avant de redonner le focus au champ de recherche', () => {
    const header = readFileSync(resolve(__dirname, 'WorkspaceHeader.tsx'), 'utf8');
    expect(header).toContain("from './searchFocus'");
    expect(header).toMatch(/function closeSearch\(\)\{[^\n]*shouldRestoreSearchFocus\(document\.activeElement,\s*root\.current,\s*document\.body\)/);
  });
});
