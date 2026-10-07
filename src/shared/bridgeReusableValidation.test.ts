import { describe, expect, it } from 'vitest';
import { assessBridgeReusableValidation } from './bridgeReusableValidation';

describe('assessBridgeReusableValidation', () => {
  it('autorise une décision humaine lorsque les contrôles automatiques sont propres', () => {
    expect(assessBridgeReusableValidation({
      generalized: true,
      remoteAssetUrls: [],
      javascript: '',
      dependencies: [],
    })).toEqual({
      automaticChecksPassed: true,
      blockers: [],
      warnings: [],
    });
  });

  it('bloque une généralisation incomplète', () => {
    const result = assessBridgeReusableValidation({
      generalized: false,
      remoteAssetUrls: [],
    });
    expect(result.automaticChecksPassed).toBe(false);
    expect(result.blockers.join(' ')).toMatch(/généralisation/i);
  });

  it('bloque les ressources distantes encore présentes', () => {
    const result = assessBridgeReusableValidation({
      generalized: true,
      remoteAssetUrls: ['https://example.test/a.png', 'https://example.test/a.png', 'https://example.test/b.webp'],
    });
    expect(result.automaticChecksPassed).toBe(false);
    expect(result.blockers).toEqual(['2 ressource(s) distante(s) doivent être localisées avant validation.']);
  });

  it('transforme JavaScript et dépendances en contrôles humains sans les valider automatiquement', () => {
    const result = assessBridgeReusableValidation({
      generalized: true,
      remoteAssetUrls: [],
      javascript: 'console.log("test");',
      dependencies: [{ name: 'Divi' }],
    });
    expect(result.automaticChecksPassed).toBe(true);
    expect(result.blockers).toEqual([]);
    expect(result.warnings).toHaveLength(2);
    expect(result.warnings.join(' ')).toMatch(/JavaScript/);
    expect(result.warnings.join(' ')).toMatch(/dépendance/i);
  });
});
