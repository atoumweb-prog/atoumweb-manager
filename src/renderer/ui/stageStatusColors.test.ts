import { readdirSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const RENDERER = resolve(__dirname, '..');
const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');
function cssFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(dir, entry.name);
    return entry.isDirectory() ? cssFiles(path) : entry.name.endsWith('.css') ? [path] : [];
  });
}

/** Toutes les règles dont un sélecteur vise une pastille d'étape de prospect (`.prospect-directory-status-<étape>`). */
function stageRules() {
  const found: { file: string; selectors: string[]; body: string }[] = [];
  for (const file of cssFiles(RENDERER)) {
    const css = strip(readFileSync(file, 'utf8'));
    for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const selectors = rule[1].split(',').map((s) => s.trim()).filter((s) => /\.prospect-directory-status-[a-z_]+/.test(s));
      if (selectors.length) found.push({ file: relative(RENDERER, file).split('\\').join('/'), selectors, body: rule[2].replace(/\s+/g, '') });
    }
  }
  return found;
}
const roleOf = (body: string) => {
  const roles = new Set([...body.matchAll(/--aw-(success|warning|danger|info|accent)-soft-(?:bg|fg)/g)].map((m) => m[1]));
  if (roles.size === 1) return [...roles][0];
  return /var\(--surface-soft\)/.test(body) ? 'neutral' : [...roles].join('+') || 'aucun';
};

describe('R2 : les pastilles d’étape de prospect utilisent les six rôles de couleur, pas huit teintes locales', () => {
  const rules = stageRules();

  it('aucune règle de pastille d’étape n’écrit de couleur en dur, de mélange local, ni de !important', () => {
    const offenders = rules.filter((r) => /#[0-9a-fA-F]{3,8}\b|color-mix|rgb\(|--aw-status-|!important/.test(r.body)).map((r) => `${r.file} : ${r.selectors[0]}`);
    expect(offenders).toEqual([]);
  });

  it('chacune des douze étapes a une couleur, parmi neutre, information, alerte, succès, danger et accent', () => {
    const toneOf = new Map<string, string>();
    for (const rule of rules) for (const selector of rule.selectors) toneOf.set(/\.prospect-directory-status-([a-z_]+)/.exec(selector)![1], roleOf(rule.body));
    const expected: Record<string, string> = {
      prepare: 'neutral', ready: 'info', qualifying: 'info', need_identified: 'info', quote_to_prepare: 'warning', quote_to_send: 'warning',
      quote_sent: 'info', follow_up: 'warning', waiting: 'neutral', negotiation: 'accent', won: 'success', lost: 'danger',
    };
    expect(Object.fromEntries([...toneOf.entries()].sort())).toEqual(Object.fromEntries(Object.entries(expected).sort()));
  });
});
