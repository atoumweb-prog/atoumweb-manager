import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { countSmallFontDeclarations } from './fontFloor';

/** R7 : câblage des cinq écrans Gestion, vérifié par lecture du source (même méthode que `home/homeR6Wiring.test.ts`). */
const read = (relative: string) => readFileSync(resolve(__dirname, '..', relative), 'utf8');
const css = (relative: string) => read(relative).replace(/\/\*[\s\S]*?\*\//g, '');
const countOf = (source: string, needle: string) => source.split(needle).length - 1;

describe('R7 : Dépenses', () => {
  const page = read('expenses/ExpensesPage.tsx');

  it('chiffres clés et barre d’outils partagés, compteurs accordés, message vide qui dit quoi faire', () => {
    expect(page).toContain('<KeyFigures');
    expect(page).toContain('<ListToolbar');
    expect(page).toContain('expensesEmptyText()');
    expect(page).toContain("plural(filtered.length, 'dépense', 'dépenses')");
    expect(page).not.toContain('expenses-kpi-grid');
    expect(page).not.toContain('dépense(s)');
    expect(page).not.toContain('échéance(s)');
  });

  it('« + Dépense » reste l’unique action principale de la barre d’outils', () => {
    expect(page).toContain('primary={<button className="primary-button" type="button" onClick={() => draft.request(openCreate)}>+ Dépense</button>}');
  });
});

describe('R7 : Facturation', () => {
  const page = read('billing/BillingPage.tsx');

  it('chiffres clés et barre d’outils partagés, message vide qui décrit l’origine des éléments', () => {
    expect(page).toContain('<KeyFigures');
    expect(page).toContain('<ListToolbar');
    expect(page).toContain('billingEmptyText()');
    expect(page).toContain("plural(filtered.length, 'élément', 'éléments')");
    expect(page).not.toContain('billing-kpi-grid');
    expect(page).not.toContain('élément(s)');
  });

  it('le rappel qu’Abby crée la facture et les filtres complémentaires sont conservés, sans capitales espacées ni tiret long', () => {
    expect(page).toContain('Abby crée la facture');
    expect(page).toContain('Filtres complémentaires : client, projet, PDF, référence et échéance');
    expect(page).not.toContain('<span className="eyebrow">Facturation sans API</span>');
    expect(page).not.toContain('Filtres complémentaires —');
  });

  it('le filtre exact de Statistiques désactive toujours la recherche et les filtres de la barre', () => {
    expect(page).toContain('disabled: !!drilldown');
    expect(countOf(page, 'disabled={!!drilldown}')).toBeGreaterThanOrEqual(2);
  });
});

describe('R7 : Documents', () => {
  const page = read('documents/DocumentsPage.tsx');

  it('un seul bouton pour la bibliothèque et l’éditeur, plus de carte « Documents clients » ni de doublon', () => {
    expect(page).toContain('Bibliothèque et éditeur contractuels');
    expect(page).not.toContain('Éditeur contractuel');
    expect(page).not.toContain('Bibliothèque contractuelle');
    expect(page).not.toContain('documents-entry');
    expect(page).not.toContain('<strong>Documents clients</strong>');
    expect(countOf(page, 'draft.request(() => setLibraryOpen(true))')).toBe(1);
    expect(page).toContain('if(initialContractTypeId)setLibraryOpen(true);');
  });

  it('« Autres documents » devient une ligne grisée, sans jargon', () => {
    expect(page).toContain('Dépôt général hors client : pas encore disponible.');
    expect(page).not.toContain('stockage implicite');
  });

  it('un seul message vide, calculé par la règle pure à partir de la liste complète', () => {
    expect(page).toContain('documentsEmptyText({ total: items.length, archived: items.length - activeItems.length, archiveFilter, filtersActive: hasActiveFilters([query, clientFilter, categoryFilter]) })');
    expect(page).toContain('emptyText={documentsEmpty}');
    expect(page).toContain('emptyFilteredText={documentsEmpty}');
    expect(page).not.toContain('Aucun document dans cette vue.');
    expect(countOf(page, 'documents-empty')).toBe(1);
  });

  it('chiffres clés et barre d’outils partagés, compteur accordé, « + Document » seul bouton principal', () => {
    expect(page).toContain('<KeyFigures');
    expect(page).toContain('<ListToolbar');
    expect(page).toContain("plural(filtered.length, 'document', 'documents')");
    expect(page).toContain('primary={<button className="primary-button"');
    expect(page).not.toContain('DocumentKpi');
    expect(page).not.toContain('documents-kpi-grid');
  });
});

describe('R7 : Temps', () => {
  const page = read('time/TimePage.tsx');

  it('le message vide dit la période, avec ou sans filtre', () => {
    expect(page).toContain('timeEmptyTexts({ period, drilldown: !!drilldown })');
    expect(page).toContain('emptyText={timeEmpty.empty}');
    expect(page).toContain('emptyFilteredText={timeEmpty.filtered}');
  });

  it('barre d’outils et chiffres clés partagés, onglets de période en tête, un seul bouton principal', () => {
    expect(page).toContain('<ListToolbar');
    expect(page).toContain('leading={<div className="time-period-tabs">');
    expect(page).toContain('<KeyFigures');
    expect(page).toContain("plural(sessions.length, 'session', 'sessions')");
    expect(page).toContain('primary={<button className="primary-button" type="button" onClick={() => { setEditing(null); setManualOpen((value) => !value); }}>+ Temps manuel</button>}');
    expect(page).not.toContain('time-kpi-grid');
    expect(page).not.toContain('time-toolbar');
    expect(page).not.toContain('session(s)');
  });

  it('les filtres de la barre restent désactivés par le filtre exact de Statistiques', () => {
    expect(countOf(page, 'disabled={!!drilldown}')).toBeGreaterThanOrEqual(7);
  });

  it('une session sans fin reste affichée « En cours » (avec « pause » le cas échéant)', () => {
    expect(page).toContain('En cours{session.paused');
  });

  it('le bandeau « Maintenant » n’est plus en capitales espacées', () => {
    expect(page).not.toContain('eyebrow">Maintenant');
  });
});

describe('R7 : styles de Temps', () => {
  const time = css('time.css');

  it('les onglets de période passent à la ligne, sans défilement ni texte sous 14 px', () => {
    const rule = time.match(/\.time-period-tabs\s*\{([^}]*)\}/);
    expect(rule).not.toBeNull();
    expect(rule![1]).toContain('flex-wrap: wrap');
    expect(rule![1]).not.toContain('overflow');
    const button = time.match(/\.time-period-tabs button\s*\{([^}]*)\}/);
    expect(countSmallFontDeclarations(button![0])).toBe(0);
  });

  it('les règles des anciennes cartes et de l’ancienne barre ont quitté time.css', () => {
    for (const selector of ['.time-kpi-grid', '.time-kpi-card', '.time-kpi-icon', '.time-toolbar', '.time-filters']) expect(time, selector).not.toContain(selector);
  });
});

/** Corps (sans commentaires) des règles dont la liste de sélecteurs contient exactement `selector`. */
const ruleBodies = (source: string, selector: string): string[] => {
  const bodies: string[] = [];
  for (const match of source.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (match[1].split(',').map((part) => part.trim().replace(/\s+/g, ' ')).includes(selector)) bodies.push(match[2]);
  }
  return bodies;
};

describe('R7 : Interventions', () => {
  const page = read('operations/OperationsPage.tsx');

  it('chiffres clés et barre d’outils partagés, compteurs accordés, messages vides qui disent quoi faire', () => {
    expect(page).toContain('<KeyFigures');
    expect(page).toContain('<ListToolbar');
    expect(page).toContain("plural(filteredRequests.length, 'demande', 'demandes')");
    expect(page).toContain("plural(filteredInterventions.length, 'intervention', 'interventions')");
    expect(page).toContain("operationsEmptyText('requests')");
    expect(page).toContain("operationsEmptyText('interventions')");
    expect(page).not.toContain('operations-kpi-grid');
    expect(page).not.toContain('operations-toolbar');
    expect(page).not.toContain('demande(s)');
    expect(page).not.toContain('intervention(s)');
  });

  it('l’action principale change avec la vue mais reste la seule de la barre', () => {
    expect(page).toContain("primary={view === 'requests' ? <button className=\"primary-button\"");
    expect(page).toContain('+ Nouvelle demande</button>');
    expect(page).toContain('+ Intervention</button>');
  });

  it('les quatre onglets (Demandes, Interventions, Maintenance, Packs d’heures) sont conservés', () => {
    for (const label of ['Demandes <span>', 'Interventions <span>', '>Maintenance</button>', 'Packs d’heures</button>']) expect(page, label).toContain(label);
  });
});

describe('R7 : styles de la liste d’Interventions', () => {
  const ops = css('operations.css');

  it('sans fiche ouverte, la liste ne porte plus de boîte à défilement interne (un seul ascenseur)', () => {
    for (const selector of ['.request-workspace:not(.with-detail) .request-list-panel', '.intervention-workspace:not(.with-detail) .intervention-list-panel']) {
      const bodies = ruleBodies(ops, selector);
      expect(bodies.length, selector).toBeGreaterThan(0);
      expect(bodies.join(' ')).toContain('max-height: none');
      expect(bodies.join(' ')).toContain('overflow: visible');
    }
  });

  it('avec une fiche ouverte, le comportement historique est conservé', () => {
    expect(ruleBodies(ops, '.request-list-panel').join(' ')).toContain('max-height: calc(100dvh - 250px)');
    expect(ruleBodies(ops, '.intervention-list-panel').join(' ')).toContain('max-height: calc(100dvh - 250px)');
  });

  it('panneau de suivi et onglets de vue : 14 px minimum, sans capitales espacées', () => {
    for (const selector of ['.operations-alert-severity', '.operations-alert strong', '.operations-alert small', '.operations-alert p', '.operations-alerts-more', '.operations-alert-thresholds', '.operations-view-tabs button', '.operations-view-tabs button span']) {
      const bodies = ruleBodies(ops, selector);
      expect(bodies.length, selector).toBeGreaterThan(0);
      for (const body of bodies) {
        expect(countSmallFontDeclarations(`.x{${body}}`), selector).toBe(0);
        expect(body, selector).not.toContain('uppercase');
      }
    }
  });

  it('les intitulés du panneau de suivi ne sont plus en capitales espacées', () => {
    const body = ruleBodies(ops, '.operations-alerts-panel .eyebrow').join(' ');
    expect(body).toContain('text-transform: none');
    expect(body).toContain('letter-spacing: normal');
    expect(body).toContain('font-size: var(--aw-font-functional)');
  });

  it('les anciennes cartes et l’ancienne barre ont quitté operations.css', () => {
    for (const selector of ['.operations-kpi-grid', '.operations-kpi-icon', '.operations-toolbar']) expect(ops, selector).not.toContain(selector);
  });
});

describe('R7 : un seul ascenseur et textes lisibles dans les listes Gestion', () => {
  const listPage = css('ui/list-page.css');

  it('le tableau n’a plus de boîte à défilement vertical propre dans les cinq écrans', () => {
    for (const stack of ['operations-stack', 'billing-page-stack', 'expenses-page-stack', 'documents-page-stack', 'time-page-stack']) {
      expect(ruleBodies(listPage, `.${stack} .aw-data-table-scroll`).join(' '), stack).toContain('max-height: none');
    }
  });

  it('les listes déroulantes de la barre d’outils ont une largeur bornée, pour que l’action principale reste sur la ligne', () => {
    expect(ruleBodies(listPage, '.aw-list-toolbar select').join(' ')).toContain('max-width: 190px');
  });

  it('« Corriger » (Temps) et les pastilles de priorité (Interventions) respectent le plancher de 14 px', () => {
    expect(ruleBodies(css('time.css'), '.time-page-stack .text-button').join(' ')).toContain('font-size: var(--aw-font-functional)');
    for (const body of ruleBodies(css('operations.css'), '.operation-priority')) expect(countSmallFontDeclarations(`.x{${body}}`)).toBe(0);
  });

  it('le panneau de suivi accorde son compteur (plus de « point(s) »)', () => {
    const panel = read('operations/OperationsAlertsPanel.tsx');
    expect(panel).not.toContain('point(s)');
    expect(panel).toContain("plural(attentionCount, 'point', 'points')");
  });
});

// FIN
