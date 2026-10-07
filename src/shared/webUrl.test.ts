import { describe, expect, it } from 'vitest';
import { displayWebUrl, normalizeWebUrl } from './webUrl';

describe('webUrl', () => {
  it('ajoute https par défaut', () => {
    expect(normalizeWebUrl('atoumweb.fr')).toBe('https://atoumweb.fr');
    expect(normalizeWebUrl('www.atoumweb.fr/contact')).toBe('https://www.atoumweb.fr/contact');
  });

  it('respecte http lorsqu il est saisi explicitement', () => {
    expect(normalizeWebUrl('http://ancien-site.fr')).toBe('http://ancien-site.fr');
  });

  it('refuse les protocoles non web', () => {
    expect(() => normalizeWebUrl('ftp://example.fr')).toThrow(/http:\/\/ ou https:\/\//i);
  });

  it('affiche les URL https sans imposer le protocole dans les champs', () => {
    expect(displayWebUrl('https://atoumweb.fr/')).toBe('atoumweb.fr');
    expect(displayWebUrl('http://ancien-site.fr/')).toBe('http://ancien-site.fr');
  });
});
