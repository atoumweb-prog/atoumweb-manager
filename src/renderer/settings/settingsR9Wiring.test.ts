import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/** R9 : câblage de Réglages, vérifié par lecture du source (même méthode que `ui/ressourcesR8Wiring.test.ts`). */
const read = (relative: string) => readFileSync(resolve(__dirname, '..', relative), 'utf8');
const countOf = (source: string, needle: string) => source.split(needle).length - 1;

const IDS = [
  'settings-quick-search', 'settings-theme-atoumweb', 'settings-density-compact', 'settings-nav-collapse', 'settings-hover-help',
  'settings-open-documents', 'settings-read-diagnostics', 'settings-choose-workspace', 'settings-create-backup',
];

describe('R9 : SettingsPage sort d’App.tsx sans changer de comportement', () => {
  const app = read('App.tsx');
  const page = read('settings/SettingsPage.tsx');

  it('App.tsx importe la page et ne la définit plus', () => {
    expect(app).toContain("from './settings/SettingsPage'");
    expect(app).not.toContain('function SettingsPage(');
  });

  it('la page exporte SettingsPage, THEMES et DENSITIES et garde ses identifiants', () => {
    expect(page).toContain('export function SettingsPage(');
    expect(page).toContain('export const THEMES');
    expect(page).toContain('export const DENSITIES');
    expect(page).toContain('settings-grid');
    for (const id of IDS) expect(page, id).toContain(id);
  });
});

describe('R9 : six sections dans l’ordre, recherche sur une ligne, textes', () => {
  const page = read('settings/SettingsPage.tsx');
  const app = read('App.tsx');

  it('les sections suivent SETTINGS_SECTION_ORDER', () => {
    expect(page).toContain("from '../../shared/settingsSections'");
    expect(page).toContain('SETTINGS_SECTION_ORDER.map(');
    for (const key of ['company', 'appearance', 'navigation', 'data', 'diagnostic', 'recette']) expect(page, key).toContain(`${key}:`);
  });

  it('Navigation et aide et Données et sauvegarde réunissent les anciens blocs', () => {
    expect(page).toContain('<h2>Navigation et aide</h2>');
    expect(page).toContain('<h2>Données et sauvegarde</h2>');
    expect(page).toContain('settings-help-row');
    expect(page).toContain('clic/clavier');
    expect(page).toContain('Sauvegarde de la base Manager');
    expect(page).toContain('settings-navigation-confirm');
  });

  it('Diagnostic est replié par défaut et s’ouvre quand la recherche correspond', () => {
    expect(page).toContain('settings-advanced');
    expect(page).toMatch(/<details[^>]*open=\{search\.trim\(\) \? true : undefined\}/);
  });

  it('plus de sur-titre en capitales, favoris accordés, bouton de Documents court', () => {
    expect(page).not.toContain('eyebrow');
    expect(page).toContain("plural(navigationPreference.favoriteModuleKeys.length, 'favori', 'favoris')");
    expect(page).not.toContain('favori(s)');
    expect(page).toContain('Ouvrir Documents & Contrats');
    expect(page).not.toContain('sans changer les règles');
  });

  it('un seul bouton principal hors confirmation ; Choisir un autre dossier est secondaire', () => {
    expect(countOf(page, 'primary-button')).toBe(1);
    const choose = page.slice(page.indexOf('id="settings-choose-workspace"') - 80, page.indexOf('id="settings-choose-workspace"') + 160);
    expect(choose).toContain('secondary-button');
  });

  it('la recherche tient sur une ligne et son aide passe en info-bulle', () => {
    expect(page).toContain('className="settings-toolbar"');
    expect(page).toContain("from '../ui/FieldHelp'");
    expect(page).not.toContain('<article className="panel panel-large">\n        <label htmlFor="settings-quick-search"');
    expect(page).toContain('search.trim() && shortcuts.length > 0');
  });

  it('App.tsx ne rend plus les données de démonstration en tête de Réglages', () => {
    expect(app).not.toContain('<DemoPanel');
    expect(app).not.toContain("from './workflow/DemoPanel'");
  });

  it('le thème de départ n’utilise plus de tiret long', () => {
    expect(page).not.toMatch(/[—–]/);
  });
});

describe('R9 : Recette repliée', () => {
  const demo = read('workflow/DemoPanel.tsx');
  const page = read('settings/SettingsPage.tsx');

  it('DemoPanel est une section repliée dont le titre porte le compte de données de test', () => {
    expect(demo).toContain('<details');
    expect(demo).toContain('Recette · ');
    expect(demo).toContain("plural(summary.total, 'enregistrement de test', 'enregistrements de test')");
    expect(demo).not.toContain('<h2>Données de démonstration</h2>');
  });

  it('les actions et leur sécurité restent', () => {
    expect(demo).toContain('Créer un parcours test complet');
    expect(demo).toContain('className="danger-button"');
    expect(demo).toContain('disabled={busy||summary.total===0}');
    expect(demo).toContain('role="status"');
    expect(demo).toContain('Confirmation et sauvegarde SQLite obligatoires');
  });

  it('la page rend la Recette en dernier, ouverte quand la recherche correspond', () => {
    expect(page).toContain("import { DemoPanel } from '../workflow/DemoPanel'");
    expect(page).toMatch(/recette: [^\n]*<DemoPanel open=\{/);
  });
});

describe('R9 : Mon entreprise dit où elle en est', () => {
  const component = read('commercial/CompanyQuoteSettings.tsx');
  const css = read('commercial/company-quote-settings.css').replace(/\/\*[\s\S]*?\*\//g, '');

  it('la ligne d’état lit les états existants sur les onglets Mon entreprise et Conditions seulement', () => {
    expect(component).toContain("from '../../shared/settingsSections'");
    expect(component).toContain("companyStatus({scope:tab==='company'?'company':'terms'");
    expect(component).toContain('<p className="company-status" role="status" data-tone={status.tone}>{status.text}</p>');
    // la ligne est rendue dans le bloc des onglets « company » et « terms » (pas dans « style » ni « defaults »)
    const block = component.slice(component.indexOf("(tab==='company'||tab==='terms')&&"), component.indexOf("{tab==='style'&&"));
    expect(block).toContain('company-status');
  });

  it('l’onglet actif est un repère calme : plus de jaune écrit en dur', () => {
    expect(css).not.toMatch(/#ffda/i);
    expect(css).toMatch(/nav button\[aria-selected=true\]\{[^}]*var\(--accent\)/);
  });

  it('le bouton d’enregistrement reste l’action principale et l’acompte n’est pas touché', () => {
    expect(component).toContain('className="primary-button"');
    expect(component).toContain('Enregistrer et actualiser l’aperçu');
    expect(component).toContain("number('depositPercent','Acompte proposé (%)',0,100)");
  });
});

describe('P6b (F42) : la recherche de Réglages garde sa largeur de 380 px', () => {
  const page = read('settings/SettingsPage.tsx');
  const styles = read('styles.css');
  const r9 = read('settings/settings-r9.css');
  const rule = (source: string, selector: string) => {
    const start = source.indexOf(`${selector} {`);
    return start < 0 ? '' : source.slice(start, source.indexOf('}', start));
  };

  it('le champ porte l’identifiant et la classe visés par les deux feuilles', () => {
    expect(page).toMatch(/<input id="settings-quick-search" className="settings-search" type="search"/);
  });

  it('styles.css et settings-r9.css fixent 380 px, bornés à la largeur disponible', () => {
    for (const [source, selector] of [[styles, '.settings-grid #settings-quick-search'], [r9, '.settings-search']] as const) {
      const body = rule(source, selector);
      expect(body, selector).toMatch(/width:\s*380px/);
      expect(body, selector).toMatch(/max-width:\s*100%/);
      expect(body, selector).not.toContain('!important');
    }
  });
});
