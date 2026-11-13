import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (name: string) => readFileSync(resolve(__dirname, name), 'utf8');

/** Pile de polices de l'application : lue dans la regle racine de styles.css. */
function rootFontFamily(): string[] {
  const match = /:root,\s*:root\[data-theme='atoumweb'\]\s*\{[^}]*?font-family:\s*([^;]+);/.exec(read('styles.css'));
  expect(match, 'font-family du bloc racine de styles.css').not.toBeNull();
  return match![1].split(',').map((family) => family.trim().replace(/^["']|["']$/g, ''));
}

describe('police de l\'application', () => {
  it('puts Segoe UI first in the font stack', () => {
    expect(rootFontFamily()[0]).toBe('Segoe UI');
  });

  it('keeps the system fallbacks after Segoe UI', () => {
    const stack = rootFontFamily();
    expect(stack).toContain('system-ui');
    expect(stack[stack.length - 1]).toBe('sans-serif');
  });

  it('does not ship or load any embedded font file', () => {
    expect(existsSync(resolve(__dirname, 'fonts'))).toBe(false);
    expect(existsSync(resolve(__dirname, 'fonts.css'))).toBe(false);
    expect(read('main.tsx')).not.toContain('fonts.css');
    expect(read('tokens.css')).not.toMatch(/@font-face/);
  });
});
