import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/** R7 : câblage des écrans Gestion, vérifié par lecture du source (même méthode que `home/homeR6Wiring.test.ts`). */
const read = (relative: string) => readFileSync(resolve(__dirname, '..', relative), 'utf8');
const countOf = (source: string, needle: string) => source.split(needle).length - 1;

describe('R7 : le rail ouvre le groupe de la page active sans écrire la préférence', () => {
  const rail = read('ui/NavigationRail.tsx');

  it('l’affichage du groupe passe par isGroupExpanded', () => {
    expect(rail).toContain('isGroupExpanded(');
    expect(rail).toContain("from '../../shared/navigationRail'");
  });

  it('la préférence de repli n’est écrite que par le clic sur l’en-tête du groupe', () => {
    expect(countOf(rail, 'collapsedGroups:')).toBe(1);
  });

  it('le corps du groupe n’est plus caché par la seule préférence', () => {
    expect(rail).not.toContain('hidden={collapsed||preference.collapsedGroups?.includes(group)}');
  });
});
