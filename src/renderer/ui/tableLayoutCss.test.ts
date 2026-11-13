import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(__dirname, 'table-layout.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ selector: m[1].trim(), body: m[2].replace(/\s+/g, '') }));
const touchesHeader = (selector: string) => /(^|[\s>,(])th([\s>,.:)[]|$)/.test(selector);

describe('table-layout.css : en-têtes de colonne', () => {
  it('aucune règle d’en-tête ne coupe un mot n’importe où', () => {
    const offenders = rules.filter((r) => touchesHeader(r.selector) && /overflow-wrap:anywhere|word-break:break-all|word-break:break-word/.test(r.body));
    expect(offenders.map((r) => r.selector)).toEqual([]);
  });

  it('une règle plus spécifique que les anciennes classes de tableau fixe la casse et les césures', () => {
    const rule = rules.find((r) => r.selector === '.aw-data-table > thead > tr > th');
    expect(rule).toBeDefined();
    expect(rule!.body).toContain('text-transform:none');
    expect(rule!.body).toContain('overflow-wrap:normal');
    expect(rule!.body).toContain('word-break:normal');
    expect(rule!.body).toContain('hyphens:manual');
    // Même taille que le libellé des colonnes triables (suit la densité : 14 / 16 / 18 px).
    expect(rule!.body).toContain('font-size:var(--ui-font-primary)');
  });

  it('l’écran Clients n’impose pas de taille aux libellés d’en-tête (boutons de tri) : sa règle sur les span ne vise que le corps du tableau', () => {
    const clients = readFileSync(resolve(__dirname, '..', 'crm', 'client-list-quick-v2.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const spanRules = [...clients.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter((m) => m[1].includes('.aw-data-table') && m[1].includes(':is(strong,small,span)'));
    expect(spanRules.length).toBeGreaterThan(0);
    expect(spanRules.filter((m) => !m[1].includes('tbody')).map((m) => m[1].trim())).toEqual([]);
  });

  it('Clients et contacts : le bouton « créer » devenu secondaire (« Fermer ») garde sa place et sa hauteur', () => {
    const read = (file: string) => readFileSync(resolve(__dirname, '..', 'crm', file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const body = (css: string, selectorPart: string) => [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter((m) => m[1].includes(selectorPart)).map((m) => m[2].replace(/\s+/g, '')).join(';');
    // R3 : le bouton de Clients vit dans les actions de PageHeader (à droite par construction), plus dans `.client-heading`.
    expect(readFileSync(resolve(__dirname, '..', 'crm', 'ClientsPage.tsx'), 'utf8')).toMatch(/<PageHeader\b[\s\S]*?actions=\{<button className=\{showForm \? 'secondary-button' : 'primary-button'\}/);
    expect(readFileSync(resolve(__dirname, 'page-header.css'), 'utf8')).toMatch(/\.aw-page-header-actions\s*\{[^}]*display:\s*flex/);
    const contacts = body(read('client-contacts-v2.css'), '.client-contacts-heading>.secondary-button');
    expect(contacts).toContain('min-height:42px');
  });

  it('la colonne « Ouvrir » garde au moins 88 px', () => {
    expect(css).toMatch(/\[data-column-id=open\]\{[^}]*min-width:88px/);
  });

  it('n’introduit aucun !important ni couleur écrite en dur', () => {
    expect(css).not.toMatch(/!important/);
    expect(css.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).toEqual([]);
  });
});
