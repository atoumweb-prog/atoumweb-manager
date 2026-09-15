import { describe, expect, it } from 'vitest';
import { isDisplayDensity, isThemeName } from './contracts';

describe('réglages d’apparence', () => {
  it('accepte les trois thèmes V1', () => {
    expect(isThemeName('atoumweb')).toBe(true);
    expect(isThemeName('noir')).toBe(true);
    expect(isThemeName('blanc')).toBe(true);
  });

  it('refuse un thème inconnu', () => {
    expect(isThemeName('bleu')).toBe(false);
    expect(isThemeName(null)).toBe(false);
  });

  it('accepte Compact, Confort et Confort +', () => {
    expect(isDisplayDensity('compact')).toBe(true);
    expect(isDisplayDensity('comfort')).toBe(true);
    expect(isDisplayDensity('comfort_plus')).toBe(true);
  });

  it('refuse une densité inconnue', () => {
    expect(isDisplayDensity('large')).toBe(false);
    expect(isDisplayDensity(null)).toBe(false);
  });
});
