import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (name: string) => readFileSync(resolve(__dirname, name), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);

describe('R2 : bouton principal lisible en Noir (mesuré à 1,37 pour 1 : blanc sur jaune, 14 écrans)', () => {
  it('shared-controls.css impose le texte sombre du jeton d’accent à tout bouton principal en Noir, sans !important', () => {
    const rules = [...read('shared-controls.css').matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ selector: m[1].trim(), body: m[2].replace(/\s+/g, '') }));
    // Fin de refonte (F2) : la règle vaut pour tous les thèmes ; le jeton --aw-accent-on-solid a sa valeur par thème.
    const rule = rules.find((r) => r.selector === ':root[data-theme] :is(.primary-button,.primary-button:disabled)');
    expect(rule).toBeDefined();
    expect(rule!.body).toContain('color:var(--aw-accent-on-solid)');
    expect(rule!.body).toContain('-webkit-text-fill-color:currentColor');
    expect(rule!.body).not.toContain('!important');
  });

  it('le texte sombre de Noir tient AA (4,5) sur chacun des jaunes et ors que les écrans utilisent comme fond', () => {
    const tokens = read('../tokens.css');
    const noir = tokens.slice(tokens.indexOf("[data-theme='noir']") >= 0 ? tokens.indexOf("[data-theme='noir']") : tokens.indexOf('noir'));
    const onSolid = /--aw-accent-on-solid:\s*(#[0-9a-fA-F]{6})/.exec(noir)![1];
    for (const background of ['#ffda00', '#ffda29', '#ffda39', '#ffd326', '#dfbd83', '#c6a46c']) {
      expect(contrast(onSolid, background), `${onSolid} sur ${background}`).toBeGreaterThanOrEqual(4.5);
    }
  });
});
