import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { countSmallFontDeclarations } from '../ui/fontFloor';

/** R6 : câblage de l'Accueil, vérifié par lecture du source (même méthode que `projects/projectR5bWiring.test.ts`). */
const readSource = (file: string) => readFileSync(resolve(__dirname, file), 'utf8');
const css = (file: string) => readSource(file).replace(/\/\*[\s\S]*?\*\//g, '');
const countOf = (source: string, needle: string) => source.split(needle).length - 1;

describe('R6 : le bloc « À faire maintenant » remplace « Aujourd’hui »', () => {
  const page = readSource('HomeDashboard.tsx');

  it('la liste est construite par la règle pure et affichée par le composant', () => {
    expect(page).toContain("import { HomeTodoCard } from './HomeTodoCard';");
    expect(page).toContain("import { buildTodoList, draftQuoteCount } from '../../shared/homeTodo';");
    expect(page).toContain('const todoItems = useMemo(() => buildTodoList(data.entries ?? []), [data.entries]);');
    expect(page).toContain("<HomeTodoCard items={todoItems} ready={has('entries')} onOpen={openEntity} />");
  });

  it('la clé de disposition « today » est conservée, seul le libellé change', () => {
    expect(page).toContain("today:'À faire maintenant'");
    expect(page).toContain("today:'calendar'");
    expect(page).toContain('todoItems.length');
    expect(page).not.toContain('todayEntries');
  });

  it('l’ancien balisage « Aujourd’hui » a disparu et « Voir tout » n’est plus proposé pour ce bloc', () => {
    expect(page).not.toContain('home-today-item');
    expect(page).not.toContain('home-today-card');
    expect(page).toContain("!['kpis','time','today'].includes(key)");
  });
});

describe('R6 : compteur honnête', () => {
  const page = readSource('HomeDashboard.tsx');

  it('« Devis en brouillon » compte de vrais devis et ouvre la liste des devis', () => {
    expect(page).toContain('label="Devis en brouillon"');
    expect(page).toContain('draftQuoteCount(data.quotes ?? [])');
    expect(page).toContain('has("quotes")');
    expect(page).toContain("onClick={() => openPage('Devis')}");
    expect(page).not.toContain('Compteur issu des Prospects');
    expect(page).not.toContain('label="Devis à préparer"');
    expect(page).not.toContain('quotePrepareCount');
  });
});

describe('R6 : en-tête et noms', () => {
  const page = readSource('HomeDashboard.tsx');

  it('« + Devis » est le seul bouton principal, « + Prospect » et « + Demande » sont secondaires', () => {
    expect(countOf(page, 'className="primary-button"')).toBe(1);
    expect(page).toContain(`className="primary-button" onClick={()=>quickCreate('Devis','quote')}`);
    expect(page).toContain(`className="secondary-button" onClick={()=>quickCreate('Prospects','prospect')}`);
    expect(page).toContain(`className="secondary-button" onClick={()=>quickCreate('Interventions & Maintenance','request')}`);
  });

  it('la carte des projets récents porte le nom de son bloc', () => {
    expect(page).toContain('<strong>Projets récents</strong>');
    expect(page).not.toContain('<strong>Actions rapides</strong>');
    expect(page).toContain('Accès rapides');
  });
});

describe('R6 : styles', () => {
  const r6 = css('home-r6.css');

  it('home-r6.css : aucun !important, aucune couleur en dur, aucun texte sous 14 px', () => {
    expect(r6).not.toContain('!important');
    expect(r6).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(countSmallFontDeclarations(r6)).toBe(0);
  });

  it('la feuille est importée après les feuilles historiques de l’Accueil', () => {
    const page = readSource('HomeDashboard.tsx');
    expect(page.indexOf("import './home-r6.css';")).toBeGreaterThan(page.indexOf("import './HomeDashboardV2.css';"));
  });

  it('les règles de l’ancien bloc « Aujourd’hui » ont quitté la feuille historique', () => {
    expect(css('HomeDashboard.css')).not.toContain('.home-today-item');
    expect(css('HomeDashboardV2.css')).not.toContain('.home-today-item');
  });
});
