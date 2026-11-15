import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Fin de refonte, lot F1 (pages Clients) : la mise en page vaut pour tous les thèmes et toutes les densités.
 * Une règle réservée au Noir ne garde que des couleurs écrites en dur (traduites en jetons au lot F3).
 */
const read = (relative: string) => readFileSync(resolve(__dirname, '..', relative), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const COLOR = /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(|\b(white|black)\b/i;
const NOIR = /:root\[data-theme=['"]?noir['"]?\]/;

const FILES = ['crm/client-expanded-v2.css', 'crm/client-list-quick-v2.css', 'crm/client-contacts-v2.css', 'crm/client-contracts-v2.css', 'crm/client-commercial-v2.css', 'crm/ClientsPageV2.css'];

describe('F1 : pages Clients communes à tous les thèmes', () => {
  for (const file of FILES) {
    it(`${file} : une règle réservée au Noir ne porte plus que des couleurs`, () => {
      const layout: string[] = [];
      for (const match of read(file).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        if (!NOIR.test(match[1])) continue;
        for (const decl of match[2].split(';').map((d) => d.trim()).filter(Boolean)) {
          if (!COLOR.test(decl.slice(decl.indexOf(':') + 1))) layout.push(`${match[1].trim().slice(0, 80)} { ${decl} }`);
        }
      }
      expect(layout).toEqual([]);
    });
  }

  it('la mise en page passe par un préfixe commun de même spécificité', () => {
    const total = FILES.map(read).join('\n');
    expect((total.match(/:root\[data-theme\]\[data-density\]/g) ?? []).length).toBeGreaterThan(200);
  });
});
