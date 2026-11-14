import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { countSmallFontDeclarations } from './fontFloor';
import { KeyFigures } from './KeyFigures';
import { ListToolbar } from './ListToolbar';

const css = readFileSync(resolve(__dirname, 'list-page.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

describe('R7 : chiffres clés partagés', () => {
  const render = (items: Array<{ key: string; label: string; value: string | number; helper?: string }>) =>
    renderToStaticMarkup(createElement(KeyFigures, { items, ariaLabel: 'Synthèse' }));

  it('une carte par élément, avec libellé, valeur et aide', () => {
    const markup = render([{ key: 'a', label: 'À facturer', value: 3, helper: '1 200 € prêts' }, { key: 'b', label: 'Offerts', value: '0 €' }]);
    expect(markup).toContain('aria-label="Synthèse"');
    expect(markup).toContain('À facturer');
    expect(markup).toContain('1 200 € prêts');
    expect(markup.split('aw-keyfigure"').length - 1).toBe(2);
  });

  it('l’aide absente n’ajoute aucune balise vide, et aucune icône n’est rendue', () => {
    const markup = render([{ key: 'a', label: 'Offerts', value: 0 }]);
    expect(markup).not.toContain('<small');
    expect(markup).not.toContain('<svg');
  });

  it('la valeur zéro est affichée, jamais masquée', () => {
    expect(render([{ key: 'a', label: 'Urgentes', value: 0 }])).toContain('>0<');
  });
});

describe('R7 : barre d’outils partagée', () => {
  const render = (props: Partial<Parameters<typeof ListToolbar>[0]> = {}) =>
    renderToStaticMarkup(createElement(ListToolbar, { countLabel: '11 demandes', ...props }));

  it('le compteur est rendu tel que fourni, sans « (s) »', () => {
    const markup = render();
    expect(markup).toContain('11 demandes');
    expect(markup).not.toContain('(s)');
  });

  it('Actualiser n’apparaît que si une action est fournie', () => {
    expect(render()).not.toContain('Actualiser');
    expect(render({ onRefresh: () => undefined })).toContain('Actualiser');
  });

  it('la recherche porte son nom accessible, son texte d’aide et peut être désactivée', () => {
    const markup = render({ search: { value: 'abc', onChange: () => undefined, placeholder: 'Rechercher une demande…', ariaLabel: 'Rechercher une demande', disabled: true } });
    expect(markup).toContain('aria-label="Rechercher une demande"');
    expect(markup).toContain('placeholder="Rechercher une demande…"');
    expect(markup).toContain('disabled=""');
    expect(markup).toContain('value="abc"');
  });

  it('l’ordre est : début, compteur, Actualiser, recherche, filtres, action principale', () => {
    const markup = render({
      leading: createElement('span', null, 'ONGLETS'),
      onRefresh: () => undefined,
      search: { value: '', onChange: () => undefined, placeholder: 'Rechercher', ariaLabel: 'Rechercher' },
      filters: createElement('span', null, 'FILTRES'),
      primary: createElement('button', { className: 'primary-button' }, '+ Action'),
    });
    const order = ['ONGLETS', '11 demandes', 'Actualiser', 'Rechercher', 'FILTRES', '+ Action'].map((text) => markup.indexOf(text));
    expect(order.every((index) => index >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });
});

describe('R7 : feuille list-page.css', () => {
  it('aucun !important, aucune couleur en dur, aucun texte sous 14 px', () => {
    expect(css).not.toContain('!important');
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(countSmallFontDeclarations(css)).toBe(0);
  });

  it('la barre d’outils passe à la ligne au lieu de déborder', () => {
    const rule = css.match(/\.aw-list-toolbar\s*\{([^}]*)\}/);
    expect(rule).not.toBeNull();
    expect(rule![1]).toContain('flex-wrap: wrap');
  });

  it('les deux composants importent la feuille', () => {
    expect(readFileSync(resolve(__dirname, 'KeyFigures.tsx'), 'utf8')).toContain("import './list-page.css';");
    expect(readFileSync(resolve(__dirname, 'ListToolbar.tsx'), 'utf8')).toContain("import './list-page.css';");
  });
});
