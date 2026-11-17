import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/** F81 (décision de Carlos du 16/11/2026) : toutes les confirmations passent par la boîte de la page (usePageConfirm). */
const root = resolve(__dirname, '..');
const sources = (dir: string): string[] => readdirSync(dir).flatMap(name => {
  const path = join(dir, name);
  if (statSync(path).isDirectory()) return sources(path);
  return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
});

describe('F81 : aucune boîte native dans l’interface', () => {
  it('plus aucun window.confirm, window.prompt ni window.alert dans le code de l’interface', () => {
    const found = sources(root).flatMap(file => (readFileSync(file, 'utf8').match(/window\.(confirm|prompt|alert)\(/g) ?? []).map(call => `${relative(root, file)} : ${call}`));
    expect(found).toEqual([]);
  });

  it('la boîte de la page sait aussi demander un texte (attestation d’envoi du devis)', () => {
    const hook = readFileSync(join(root, 'ui/usePageConfirm.tsx'), 'utf8');
    expect(hook).toContain('askText');
    expect(readFileSync(join(root, 'commercial/QuotesPage.tsx'), 'utf8')).toContain('await askText({');
  });
});
