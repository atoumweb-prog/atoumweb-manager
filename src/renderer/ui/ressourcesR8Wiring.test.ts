import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/** R8 : câblage des écrans de Ressources, vérifié par lecture du source (même méthode que `gestionR7Wiring.test.ts`). */
const read = (relative: string) => readFileSync(resolve(__dirname, '..', relative), 'utf8');
const countOf = (source: string, needle: string) => source.split(needle).length - 1;

describe('R8 : Offres & Tarifs', () => {
  const page = read('commercial/CatalogPage.tsx');

  it('les six chiffres passent par KeyFigures, sans l’ancien bloc ot-counters', () => {
    expect(page).toContain("from '../ui/KeyFigures'");
    expect(page).toContain('<KeyFigures');
    expect(page).not.toContain('className="ot-counters"');
  });

  it('une seule définition de « filtre actif » (M3) sert le bouton, le tableau et le message vide', () => {
    expect(page).toContain("from './catalogFiltersActive'");
    expect(page).not.toContain("Boolean(query.trim())||typeFilter!=='all'");
    expect(page).not.toContain('JSON.stringify({...filters,pageSize:0})');
    expect(page).toContain('catalogEmptyText({filtersActive:hasFilters})');
  });

  it('l’espace Pilotage n’est plus listé (le code reste, volontairement non atteignable)', () => {
    expect(page).not.toContain("['steering','Pilotage']");
    expect(page).not.toContain('<small>À venir</small>');
    expect(page).toContain("[['catalog','Catalogue'],['administration','Administration']]");
  });

  it('la phrase d’aide sur les compteurs devient une aide au survol', () => {
    expect(page).not.toContain('className="ot-count-help"');
    expect(page).toContain('Publié et brouillon peuvent concerner le même article');
  });
});

describe('R8 : Bibliothèque AtoumWeb', () => {
  const page = read('referentials/AtoumWebLibraryPage.tsx');

  it('chiffres clés, barre d’outils et menu Plus partagés', () => {
    expect(page).toContain("from '../ui/KeyFigures'");
    expect(page).toContain("from '../ui/ListToolbar'");
    expect(page).toContain("from '../ui/MoreMenu'");
    expect(page).toContain('<KeyFigures');
    expect(page).toContain('<ListToolbar');
    expect(page).not.toContain('function Summary(');
    expect(page).not.toContain('<Summary ');
    expect(page).not.toContain('className="aw-library-action-group"');
  });

  it('les trois actions rangées dans Plus gardent leur libellé et leur handler', () => {
    expect(page).toContain("label: 'Importer un retour'");
    expect(page).toContain("label: 'Composer un site'");
    expect(page).toContain("label: 'Importer un composant'");
    expect(page).toContain('void inspectOccurrenceReturn()');
    expect(page).toContain('void inspectPackage()');
  });

  it('« Nouveau composant » reste l’action principale et redevient secondaire quand sa zone est ouverte', () => {
    expect(page).toContain("creating ? 'secondary-button' : 'primary-button'");
    expect(page).toContain("creating ? 'Fermer' : 'Nouveau composant'");
  });

  it('le bouton des retours Bridge reste visible (il porte un compteur à traiter)', () => {
    expect(page).toContain('pendingOccurrenceReturnCount');
    expect(page).toContain('setShowOccurrenceReturns');
  });

  it('un seul message vide, qui dit pourquoi', () => {
    expect(page).toContain('libraryEmptyText(');
    expect(page).not.toContain('Aucun composant ne correspond aux filtres.');
  });

  it('étiquettes d’étape en toutes lettres, sans coches ni abréviation', () => {
    expect(page).not.toContain('Famille ✓');
    expect(page).not.toContain('Réutil. ');
    expect(page).toContain('À réutiliser');
  });
});

describe('R8 : Sites', () => {
  const page = read('bridge/BridgeSitesPage.tsx');

  it('le grand message unique n’apparaît qu’après le chargement et sans aucun site', () => {
    expect(page).toContain('sitesLoaded');
    expect(page).toContain('sitesLoaded && sites.length === 0');
    expect(countOf(page, 'setSitesLoaded(true)')).toBe(1);
  });

  it('le message explique « snapshot » une fois et renvoie au bouton d’import existant', () => {
    expect(page).toContain('Importe la première copie envoyée par AtoumWeb Bridge');
    expect(page).toContain('une photographie lisible du site');
  });

  it('les deux panneaux restent intacts dès qu’il y a un site, et le bouton d’import reste unique', () => {
    expect(page).toContain('className="bridge-sites panel"');
    expect(page).toContain('className="bridge-browser panel"');
    expect(countOf(page, 'primary-button bridge-import-button')).toBe(1);
  });

  it('l’en-tête n’a plus de sur-titre en capitales', () => {
    expect(page).not.toContain('<span className="eyebrow">Sites AtoumWeb</span>');
  });
});

describe('R8 : Sauvegardes', () => {
  const page = read('backups/BusinessBackupsPage.tsx');
  const css = readFileSync(resolve(__dirname, '..', 'backups/BusinessBackupsPage.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

  it('chiffres clés et barre d’outils partagés, plus d’ancienne carte BackupKpi', () => {
    expect(page).toContain("from '../ui/KeyFigures'");
    expect(page).toContain("from '../ui/ListToolbar'");
    expect(page).toContain('<KeyFigures');
    expect(page).toContain('<ListToolbar');
    expect(page).not.toContain('function BackupKpi(');
    expect(page).not.toContain('<BackupKpi');
  });

  it('les alertes de projets montrent trois lignes et se déplient sur place, sans « (s) »', () => {
    expect(page).toContain('limitItems(contextAlerts, 3)');
    expect(page).toContain('showAllAlerts');
    expect(page).not.toContain('contextAlerts.slice(0, 5)');
    expect(page).not.toContain('autre(s) alerte(s)');
    expect(page).toContain('Voir ce projet');
  });

  it('le message vide dit pourquoi : aucune déclaration, ou filtres', () => {
    expect(page).toContain('backupsEmptyText(');
    expect(page).not.toContain('Aucune sauvegarde ne correspond aux filtres.');
  });

  it('la note du registre est en texte normal (14 px minimum, pas de classe de petit texte)', () => {
    expect(page).toContain('className="business-backups-note"');
    expect(css).toMatch(/\.business-backups-note\s*\{[^}]*font-size:\s*var\(--aw-font-functional\)/);
  });

  it('« Déclarer une sauvegarde » reste le seul bouton principal de la barre et se garde en brouillon', () => {
    expect(page).toContain("creating ? 'secondary-button' : 'primary-button'");
    expect(page).toContain('createDraft.request(() => setCreating(false))');
  });
});

describe('R8 : Statistiques', () => {
  const page = read('statistics/StatisticsPage.tsx');
  const css = readFileSync(resolve(__dirname, '..', 'statistics/StatisticsPage.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const cards = read('ui/KeyFigures.tsx');

  it('les cartes de chiffres sont les cartes partagées, cliquables pour le détail exact', () => {
    expect(cards).toContain('export function KeyFigureCard(');
    expect(page).toContain("from '../ui/KeyFigures'");
    expect(page).toContain('<KeyFigureCard');
    expect(page).toContain("controls: onInspect ? 'statistics-evidence-panel' : undefined");
    expect(page).not.toContain('className="link-button statistics-kpi-inspect"');
    expect(page).not.toContain('<div className="statistics-kpis">');
  });

  it('compare vient du module partagé et l’aide ignore la ligne « deux périodes à zéro »', () => {
    expect(page).toContain("from './statisticsComparison'");
    expect(page).toContain('comparisonHelper(comparison)');
    expect(page).not.toContain('function compare(');
  });

  it('le sur-titre des cartes n’est plus en capitales jaunes espacées', () => {
    expect(page).not.toContain('<span className="eyebrow">{eyebrow}</span>');
    expect(page).toContain('className="statistics-card-eyebrow"');
    expect(css).toMatch(/\.statistics-card-eyebrow\s*\{[^}]*font-size:\s*var\(--aw-font-functional\)/);
    expect(css).not.toMatch(/\.statistics-card-eyebrow\s*\{[^}]*text-transform:\s*uppercase/);
  });

  it('la barre de période prend la largeur de son contenu, alignée à gauche', () => {
    const rules = css.match(/\.statistics-period\s*\{[^}]*\}/g) ?? [];
    expect(rules.join(' ')).not.toContain('justify-content: flex-end');
    expect(rules.join(' ')).not.toMatch(/flex:\s*1 1 auto/);
  });

  it('les périodes limites gardent leurs garde-fous (dates incomplètes, toutes les données)', () => {
    expect(page).toContain('Aucun chiffre d\'une autre période n\'est présenté.');
    expect(page).toContain("period.preset === 'all'");
  });
});

describe('R8 : Annuaire', () => {
  const page = read('directory/DirectoryPage.tsx');

  it('chiffres clés et barre d’outils partagés, onglets en tête de barre', () => {
    expect(page).toContain("from '../ui/KeyFigures'");
    expect(page).toContain("from '../ui/ListToolbar'");
    expect(page).toContain('<KeyFigures');
    expect(page).toContain('<ListToolbar');
    expect(page).not.toContain('function DirectoryKpi(');
    expect(page).not.toContain('<DirectoryKpi');
    expect(page).toContain("plural(organizations.length, 'organisation', 'organisations')");
    expect(page).toContain("plural(contacts.length, 'contact', 'contacts')");
  });

  it('une seule action principale : « + Organisation » ou « + Contact »', () => {
    expect(countOf(page, 'className="primary-button" type="button" onClick={() => openCreate(')).toBe(1);
  });

  it('un seul message vide pour la liste compacte et pour les deux tableaux', () => {
    expect(page).toContain('directoryEmptyText(');
    expect(page).not.toContain('Aucun résultat dans cette vue.');
    expect(countOf(page, 'emptyFilteredText={')).toBe(2);
  });

  it('plus de sous-titre répété ni de tiret pour un champ vide', () => {
    expect(page).not.toContain("i.legalName||i.website||'Organisation professionnelle'");
    expect(page).not.toContain("i.preferredChannel||'Contact professionnel'");
    expect(page).not.toContain("||'—'");
    expect(page).toContain('Non renseigné');
  });

  it('le nom complet reste lisible au survol quand il est coupé', () => {
    expect(page).toContain('<strong title={i.name}>{i.name}</strong>');
  });
});
