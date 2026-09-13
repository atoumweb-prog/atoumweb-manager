import { describe, expect, it } from 'vitest';
import { isThemeName } from './contracts';

describe('isThemeName', () => {
  it('accepte les trois thèmes V1', () => {
    expect(isThemeName('atoumweb')).toBe(true);
    expect(isThemeName('noir')).toBe(true);
    expect(isThemeName('blanc')).toBe(true);
  });

  it('refuse une valeur inconnue', () => {
    expect(isThemeName('bleu')).toBe(false);
    expect(isThemeName(null)).toBe(false);
  });
});
