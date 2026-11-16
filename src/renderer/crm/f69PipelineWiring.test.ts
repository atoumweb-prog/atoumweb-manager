import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/** F69 (fiche validée par Carlos le 16/11/2026) : vue « Parcours commercial » en tableau compact. */
const page = readFileSync(resolve(__dirname, 'ProspectsPageV2.tsx'), 'utf8');
const cssPath = resolve(__dirname, 'prospect-pipeline-compact.css');
const css = existsSync(cssPath) ? readFileSync(cssPath, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '') : '';
const P = ':root[data-theme][data-density] .app-shell .prospects-v2 .pipeline-layout';

describe('F69 : carte du parcours commercial', () => {
  it('« Ouvrir la fiche » est retiré : la carte entière ouvre la fiche', () => {
    expect(page).not.toContain('pipeline-card-summary');
    expect(page).toContain("aria-label={'Ouvrir '+prospect.displayName}");
  });

  it('l’icône d’étape, qui répétait la colonne, n’est plus sur la carte', () => {
    expect(page).not.toContain('pipeline-state-icon');
  });

  it('« Rappel et étape » devient un bouton « ⋯ » nommé, avec le même contenu', () => {
    expect(page).toContain("<details className=\"pipeline-card-tools\"><summary aria-label={'Rappel et étape de '+prospect.displayName} title=\"Rappel et étape\"><span aria-hidden=\"true\">⋯</span></summary>");
    expect(page).toContain('<div className="quick-followups">');
  });

  it('une colonne vide est marquée pour se réduire, et reste une cible du dépôt', () => {
    expect(page).toContain("${groupProspects.length === 0 ? 'is-empty' : ''}");
    expect(page).toContain('onDrop={(e) => { if (!targetStage || !draggingId) return;');
  });
});

describe('F69 : plateau compact (règles communes à tous les thèmes et densités)', () => {
  it('la feuille est chargée par la page, après les anciennes couches', () => {
    expect(page).toMatch(/import '\.\/prospection-ux\.css';\r?\nimport '\.\/prospect-pipeline-compact\.css';/);
  });

  it.each([
    ['les colonnes se partagent la largeur', `${P} .kanban-board{display:flex;`],
    ['seul le plateau défile en largeur quand les colonnes ne tiennent plus', 'overflow-x:auto;overflow-y:visible;'],
    ['largeur minimale de lecture d’une colonne', `${P} .pipeline-step-column{flex:1 1 0;min-width:170px;`],
    ['colonne vide réduite', `${P} .pipeline-step-column.is-empty{flex:0 0 160px;min-width:160px;`],
    ['colonne vide : en-tête sans icône décorative', `${P} .pipeline-step-column.is-empty>header>svg{display:none;}`],
    ['pas de défilement interne des cartes', `${P} .kanban-cards{overflow:visible;`],
    ['nom complet sur plusieurs lignes, un mot n’est coupé que s’il ne tient pas', `${P} .prospect-card-identity strong{display:block;-webkit-line-clamp:unset;overflow:visible;white-space:normal;overflow-wrap:break-word;word-break:normal;`],
    ['« ⋯ » en haut à droite de la carte, sans ligne à lui', `${P} .pipeline-card-tools>summary{position:absolute;top:6px;right:6px;`],
    ['l’avatar et le « ⋯ » sur la première ligne, le nom dessous sur toute la largeur', `${P} .prospect-card-identity{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;min-width:0;}`],
    ['le nom prend toute la largeur de la carte', `${P} .prospect-card-identity strong{flex:1 0 100%;`],
    ['prochaine action sur deux lignes au plus', `${P} .prospection-card-preview>span{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;`],
    ['menu ouvert : les champs restent dans la carte', `${P} .pipeline-card-tools :is(select,input){width:100%;max-width:100%;min-width:0;box-sizing:border-box;}`],
    ['la page porte la hauteur, plus le plateau', `${P} .pipeline-flow{overflow:visible;`],
  ])('%s', (_label, rule) => {
    expect(css).toContain(rule);
  });

  it('hors Noir, la date en retard d’une carte prend le ton danger (le rose du Noir fait 2,6:1 sur blanc)', () => {
    expect(css).toContain(":root:not([data-theme='noir'])[data-density] .app-shell .prospects-v2 .pipeline-layout .prospection-card-preview time.is-overdue{color:var(--aw-danger-soft-fg);}");
  });

  it('aucune coupure de mot arbitraire (overflow-wrap:anywhere) dans la nouvelle feuille', () => {
    expect(css).not.toContain('anywhere');
  });

  it('aucune couleur en dur dans la nouvelle feuille', () => {
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(/i);
  });
});
