import { describe, expect, it } from 'vitest';
import { headerMinWidth } from './tableHeader';

describe('largeur minimale d’un en-tête de colonne', () => {
  it('garde le plus long mot entier : les en-têtes relevés coupés sur les captures', () => {
    expect(headerMinWidth('Destinataire')).toBeGreaterThanOrEqual(148);
    expect(headerMinWidth('Progression')).toBeGreaterThanOrEqual(139);
    expect(headerMinWidth('Coordonnées')).toBeGreaterThanOrEqual(139);
    expect(headerMinWidth('Description')).toBeGreaterThanOrEqual(139);
    expect(headerMinWidth('Ouvrir')).toBeGreaterThanOrEqual(94);
  });

  it('compte 9 px par lettre (gras à 16 px, Confort) plus 40 px de marges et de bouton de tri', () => {
    expect(headerMinWidth('Destinataire')).toBe(148);
    expect(headerMinWidth('Ouvrir')).toBe(94);
  });

  it('se règle sur le plus long mot, pas sur toute la phrase', () => {
    expect(headerMinWidth('Client / prospect')).toBe(headerMinWidth('prospect'));
  });

  it('reste borné entre 72 et 260 px', () => {
    expect(headerMinWidth('')).toBe(72);
    expect(headerMinWidth('Id')).toBe(72);
    expect(headerMinWidth('Anticonstitutionnellement')).toBe(260);
  });
});
