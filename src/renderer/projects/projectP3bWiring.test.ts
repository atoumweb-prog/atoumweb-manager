import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * P3b : finitions du plan de production et des onglets d'un projet, vérifiées par lecture du source
 * (même méthode que `crm/prospectR3Wiring.test.ts`). Aucune règle métier ici.
 */
const read = (name: string) => readFileSync(resolve(__dirname, name), 'utf8');
const rule = (css: string, selector: string) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return css.match(new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{[^}]*\\}`, 'm'))?.[0] ?? null;
};

describe('P3b F17 : un nom de tâche tient sur deux lignes au plus', () => {
  const css = read('../projects.css');

  it('la règle du nom de tâche ne coupe plus à la première ligne', () => {
    const block = rule(css, '.project-step-content strong');
    expect(block, 'règle .project-step-content strong').not.toBeNull();
    expect(block).not.toMatch(/white-space:\s*nowrap/);
    expect(block).toMatch(/-webkit-line-clamp:\s*2/);
    expect(block).toMatch(/overflow:\s*hidden/);
    expect(block).not.toContain('!important');
  });
});

describe('P3b F15 : la barre d’avancement d’une phase ne sort plus de sa ligne', () => {
  const css = read('../projects.css');

  it('la ligne de phase masque la barre selon sa propre largeur (requête de conteneur) au lieu de la laisser déborder', () => {
    const row = rule(css, '.project-phase-row');
    expect(row, 'règle .project-phase-row').not.toBeNull();
    expect(row).toMatch(/container-type:\s*inline-size/);
    const query = css.match(/@container \(max-width: \d+px\) \{[\s\S]*?\r?\n\}/);
    expect(query, 'requête @container sur la ligne de phase').not.toBeNull();
    expect(query![0]).toMatch(/\.project-phase-main\s*\{[^}]*grid-template-columns:\s*24px 68px minmax\(110px, 1fr\) auto/);
    expect(query![0]).toMatch(/\.project-phase-progress\s*\{[^}]*display:\s*none/);
    expect(query![0]).not.toContain('!important');
  });
});

describe('P3b F13 et F14 : plan et en-tête du projet plus courts', () => {
  const page = read('ProjectsPage.tsx');
  const css = read('../projects.css');

  it('F13 : la boîte « Plan issu du modèle d’origine » disparaît, l’information tient dans la ligne du plan', () => {
    expect(page).not.toContain('project-legacy-plan-note');
    expect(page).not.toContain('Ce plan garde la structure du modèle');
    expect(page).toMatch(/!detailUsesBlueprint && <span className="project-plan-origin"> · plan issu du modèle d’origine<\/span>/);
    expect(css).not.toContain('.project-legacy-plan-note');
    const origin = rule(css, '.project-plan-origin');
    expect(origin, 'règle .project-plan-origin').not.toBeNull();
    expect(origin).toMatch(/font-weight:\s*400/);
    expect(origin).not.toContain('!important');
  });

  it('F18 : un projet sans Site ni Page affiche un seul bloc d’état vide, sans bouton, à la place des deux volets', () => {
    const tab = read('ProjectSitesTab.tsx');
    expect(tab).toMatch(/v2 && sites\.length === 0 && pages\.length === 0 \? <section className="panel project-sites-empty-state"/);
    const block = tab.match(/<section className="panel project-sites-empty-state"[\s\S]*?<\/section>/);
    expect(block, 'bloc d’état vide').not.toBeNull();
    expect(block![0]).toContain('Aucun Site ni Page pour le moment');
    expect(block![0]).toContain('Compléter depuis le modèle');
    expect(block![0]).toContain('+ Site');
    expect(block![0]).toContain('+ Page');
    expect(block![0]).not.toContain('<button');
    // Les deux volets (et leurs flèches) ne sont rendus que dans l'autre branche.
    expect(tab.indexOf('project-sites-empty-state')).toBeLessThan(tab.indexOf('className={`project-sites-workspace'));
    expect(tab).toMatch(/<\/section> : <div\s+className=\{`project-sites-workspace/);
    const v2css = read('sites-pages-v2.css');
    const emptyRule = rule(v2css, '.project-sites-empty-state');
    expect(emptyRule, 'règle .project-sites-empty-state').not.toBeNull();
    expect(emptyRule).not.toContain('!important');
  });

  it('F14 : « Devis source associé » et son bouton sont sur la ligne du client', () => {
    expect(page).toMatch(/<p>\{detail\.commercialState === 'provisional' && !detail\.clientAccountId \? 'Prospect : ' : 'Client \/ contact : '\}\{detail\.clientLabel\}\{detail\.sourceQuoteId && <> · Devis source associé <button className="secondary-button"[\s\S]*?>Ouvrir le devis<\/button><\/>\}<\/p>/);
    expect(page).not.toMatch(/<p className="muted">Devis source associé/);
  });
});
