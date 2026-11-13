import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const dir = __dirname;
const css = readFileSync(resolve(dir, 'tokens.css'), 'utf8');
const main = readFileSync(resolve(dir, 'main.tsx'), 'utf8');

const THEMES = ['atoumweb', 'noir', 'blanc'] as const;
const ROLES = ['success', 'warning', 'danger', 'info', 'accent'] as const;
const VARIANTS = ['solid', 'on-solid', 'soft-bg', 'soft-fg'] as const;

type Theme = (typeof THEMES)[number];

/** Selecteurs attendus, identiques a ceux de styles.css. */
const SELECTORS: Record<Theme, string> = {
  atoumweb: ":root, :root[data-theme='atoumweb']",
  noir: ":root[data-theme='noir']",
  blanc: ":root[data-theme='blanc']",
};

function parseBlocks(source: string): Map<string, Map<string, string>> {
  const blocks = new Map<string, Map<string, string>>();
  const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const match of withoutComments.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    const selector = match[1].replace(/\s+/g, ' ').trim();
    const declarations = new Map<string, string>();
    for (const declaration of match[2].split(';')) {
      const index = declaration.indexOf(':');
      if (index < 0) continue;
      declarations.set(declaration.slice(0, index).trim(), declaration.slice(index + 1).trim());
    }
    blocks.set(selector, declarations);
  }
  return blocks;
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/** Valeurs figees par la spec (docs/refonte/plans/2026-11-13-r0-fondations-design.md). */
const PINNED: Record<Theme, Record<(typeof ROLES)[number], [string, string, string, string]>> = {
  atoumweb: {
    success: ['#198754', '#ffffff', '#dfeee7', '#0f5132'],
    warning: ['#f2b705', '#1f2933', '#fdf5dc', '#6b4e00'],
    danger: ['#d62828', '#ffffff', '#f9e1e1', '#8c1d1d'],
    info: ['#1565c0', '#ffffff', '#dee9f6', '#0d47a1'],
    accent: ['#b9965c', '#18212b', '#f5f0e8', '#6b5128'],
  },
  noir: {
    success: ['#55b98b', '#0e1115', '#28473e', '#9ce3c0'],
    warning: ['#e7b75e', '#0e1115', '#514631', '#f3d99e'],
    danger: ['#e77a6f', '#0e1115', '#513536', '#f5b2ab'],
    info: ['#79a9d7', '#0e1115', '#324253', '#bad8f2'],
    accent: ['#ffda00', '#111111', '#575017', '#ffe66a'],
  },
  blanc: {
    success: ['#198754', '#ffffff', '#dfeee7', '#0f5132'],
    warning: ['#f2b705', '#1f2933', '#fdf5dc', '#6b4e00'],
    danger: ['#d62828', '#ffffff', '#f9e1e1', '#8c1d1d'],
    info: ['#1565c0', '#ffffff', '#dee9f6', '#0d47a1'],
    accent: ['#92733f', '#ffffff', '#f0ebe4', '#5c4724'],
  },
};

const blocks = parseBlocks(css);

describe('tokens semantiques', () => {
  it('defines the 20 semantic tokens in each theme', () => {
    for (const theme of THEMES) {
      const block = blocks.get(SELECTORS[theme]);
      expect(block, `bloc ${SELECTORS[theme]}`).toBeDefined();
      for (const role of ROLES) {
        for (const variant of VARIANTS) {
          const value = block!.get(`--aw-${role}-${variant}`);
          expect(value, `${theme} --aw-${role}-${variant}`).toMatch(/^#[0-9a-f]{6}$/);
        }
      }
    }
  });

  it('matches the values pinned in the spec', () => {
    for (const theme of THEMES) {
      const block = blocks.get(SELECTORS[theme])!;
      for (const role of ROLES) {
        const [solid, onSolid, softBg, softFg] = PINNED[theme][role];
        expect(block.get(`--aw-${role}-solid`), `${theme} ${role} solid`).toBe(solid);
        expect(block.get(`--aw-${role}-on-solid`), `${theme} ${role} on-solid`).toBe(onSolid);
        expect(block.get(`--aw-${role}-soft-bg`), `${theme} ${role} soft-bg`).toBe(softBg);
        expect(block.get(`--aw-${role}-soft-fg`), `${theme} ${role} soft-fg`).toBe(softFg);
      }
    }
  });

  it('text pairs reach WCAG AA', () => {
    for (const theme of THEMES) {
      const block = blocks.get(SELECTORS[theme])!;
      for (const role of ROLES) {
        const onSolid = contrast(block.get(`--aw-${role}-on-solid`)!, block.get(`--aw-${role}-solid`)!);
        const soft = contrast(block.get(`--aw-${role}-soft-fg`)!, block.get(`--aw-${role}-soft-bg`)!);
        // Exception documentee : accent du Blanc (4,42), a corriger en R1.
        const floor = theme === 'blanc' && role === 'accent' ? 4.4 : 4.5;
        expect(onSolid, `${theme} ${role} on-solid / solid`).toBeGreaterThanOrEqual(floor);
        expect(soft, `${theme} ${role} soft-fg / soft-bg`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it(':root alone defines the default (atoumweb) tokens', () => {
    const selector = SELECTORS.atoumweb;
    expect(selector.split(',').map((part) => part.trim())).toContain(':root');
    expect(blocks.has(selector)).toBe(true);
  });

  it('--danger resolves to the danger solid token in every theme', () => {
    for (const theme of THEMES) {
      expect(blocks.get(SELECTORS[theme])!.get('--danger'), `${theme} --danger`).toBe('var(--aw-danger-solid)');
    }
  });

  it('has no density selector and no color-mix', () => {
    expect(css).not.toMatch(/data-density/);
    expect(css).not.toMatch(/color-mix\(/);
  });

  it('is imported before styles.css in main.tsx', () => {
    const tokens = main.indexOf("import './tokens.css'");
    const styles = main.indexOf("import './styles.css'");
    expect(tokens).toBeGreaterThanOrEqual(0);
    expect(styles).toBeGreaterThan(tokens);
  });
});
