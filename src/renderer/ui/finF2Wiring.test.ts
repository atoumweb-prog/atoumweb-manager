import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Fin de refonte, lot F2 : hors pages Clients, une règle réservée au Noir ne garde que des couleurs écrites en dur
 * (traduites en jetons au lot F3) ; la mise en page vaut pour tous les thèmes et toutes les densités.
 * Les règles `:root:not([data-theme='noir'])` (propres aux autres thèmes) ne sont pas concernées.
 */
const read = (relative: string) => readFileSync(resolve(__dirname, '..', relative), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const COLOR = /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(|\b(white|black)\b/i;
const NOIR = /(:root|html)\[data-theme=['"]?noir['"]?\]/;

const FILES = ['ui-consistency-v2.css', 'home/HomeDashboardV2.css', 'projects/sites-pages-v2.css', 'ui/workspace-header.css', 'time.css', 'projects.css',
  'commercial/catalog-workspace-v2.css', 'convergence-visual-consistency.css', 'ui/navigation-rail.css', 'crm/prospect-workspace-pilot.css', 'crm-identity.css',
  'ui/shared-controls.css', 'directory/DirectoryPage.css', 'crm/prospection-directory-pilot.css', 'crm/prospect-workspace-tabs.css', 'analytics.css'];

describe('F2 : règles réservées au Noir réduites aux couleurs', () => {
  for (const file of FILES) {
    it(`${file}`, () => {
      const layout: string[] = [];
      for (const match of read(file).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        if (!NOIR.test(match[1])) continue;
        for (const decl of match[2].split(';').map((d) => d.trim()).filter(Boolean)) {
          // Propriétés propres au thème (sombre / clair) : elles restent légitimement réservées au Noir.
          if (/^(color-scheme|filter|backdrop-filter|mix-blend-mode)\s*:/i.test(decl)) continue;
          if (!COLOR.test(decl.slice(decl.indexOf(':') + 1))) layout.push(`${match[1].trim().slice(-70)} { ${decl} }`);
        }
      }
      expect(layout).toEqual([]);
    });
  }
});
