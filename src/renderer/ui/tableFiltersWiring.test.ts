import { readdirSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const RENDERER = resolve(__dirname, '..');

function tsxFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) return tsxFiles(path);
    return entry.name.endsWith('.tsx') && !entry.name.includes('.test.') && !entry.name.includes('Workshop') ? [path] : [];
  });
}

describe('R2 : tout tableau configuré d’un écran dit s’il a des filtres actifs', () => {
  it('chaque <ConfiguredDataTable> d’un écran reçoit filtersActive', () => {
    const missing: string[] = [];
    for (const file of tsxFiles(RENDERER)) {
      const key = relative(RENDERER, file).split('\\').join('/');
      if (key.startsWith('ui/')) continue;
      const source = readFileSync(file, 'utf8');
      const tables = (source.match(/<ConfiguredDataTable\b/g) ?? []).length;
      const wired = (source.match(/\bfiltersActive=/g) ?? []).length;
      if (wired < tables) missing.push(`${key}: ${wired} filtersActive pour ${tables} tableau(x)`);
    }
    expect(missing).toEqual([]);
  });
});
