import { describe, expect, it } from 'vitest';
import { billingEmptyText, compactListEmptyText, documentsEmptyText, expensesEmptyText, operationsEmptyText, timeEmptyTexts } from './gestionEmpty';

describe('P4a : message vide d’une liste compacte', () => {
  it('avec un filtre actif, le message standard des filtres', () => {
    expect(compactListEmptyText(expensesEmptyText(), true)).toBe('Aucun résultat pour ces filtres.');
    expect(compactListEmptyText(billingEmptyText(), true)).toBe('Aucun résultat pour ces filtres.');
  });

  it('sans filtre actif, le message propre à l’écran', () => {
    expect(compactListEmptyText(expensesEmptyText(), false)).toBe(expensesEmptyText());
    expect(compactListEmptyText(billingEmptyText(), false)).toBe(billingEmptyText());
    expect(compactListEmptyText(operationsEmptyText('requests'), false)).toBe(operationsEmptyText('requests'));
  });
});

describe('R7 : messages vides de Temps', () => {
  it('nomme la période, avec ou sans filtre', () => {
    expect(timeEmptyTexts({ period: 'today', drilldown: false })).toEqual({
      empty: 'Aucune session aujourd’hui. Lance le chrono ou ajoute du temps avec « + Temps manuel ».',
      filtered: 'Aucune session pour ces filtres aujourd’hui.',
    });
    expect(timeEmptyTexts({ period: 'week', drilldown: false }).empty).toBe('Aucune session cette semaine. Lance le chrono ou ajoute du temps avec « + Temps manuel ».');
    expect(timeEmptyTexts({ period: 'month', drilldown: false }).filtered).toBe('Aucune session pour ces filtres ce mois.');
  });

  it('avec le filtre exact de Statistiques, le dit, quelle que soit la période', () => {
    const text = 'Aucune des sessions de ce filtre n’est encore disponible.';
    for (const period of ['today', 'week', 'month'] as const) expect(timeEmptyTexts({ period, drilldown: true })).toEqual({ empty: text, filtered: text });
  });
});

describe('R7 : messages vides de Documents (un seul message, quatre cas)', () => {
  const base = { total: 3, archived: 0, archiveFilter: 'active' as const, filtersActive: false };

  it('filtres actifs : message standard', () => {
    expect(documentsEmptyText({ ...base, filtersActive: true })).toBe('Aucun résultat pour ces filtres.');
  });

  it('aucun document du tout', () => {
    expect(documentsEmptyText({ ...base, total: 0 })).toBe('Aucun document pour l’instant. Ajoute-en un avec « + Document ».');
  });

  it('aucun document du tout l’emporte même avec le filtre « Archivés »', () => {
    expect(documentsEmptyText({ ...base, total: 0, archiveFilter: 'archived' })).toBe('Aucun document pour l’instant. Ajoute-en un avec « + Document ».');
  });

  it('tous archivés : le dit avec leur nombre', () => {
    expect(documentsEmptyText({ total: 3, archived: 3, archiveFilter: 'active', filtersActive: false })).toBe('Tous les documents sont archivés (3). Choisis « Archivés » pour les retrouver.');
  });

  it('vue « Archivés » vide alors qu’il existe des documents actifs', () => {
    expect(documentsEmptyText({ total: 2, archived: 0, archiveFilter: 'archived', filtersActive: false })).toBe('Aucun document archivé.');
  });

  it('autre cas : message neutre', () => {
    expect(documentsEmptyText({ total: 2, archived: 1, archiveFilter: 'all', filtersActive: false })).toBe('Aucun document dans cette vue.');
  });
});

describe('R7 : autres écrans', () => {
  it('textes exacts', () => {
    expect(billingEmptyText()).toBe('Rien à facturer pour l’instant. Les éléments apparaissent quand un acompte, un solde, une intervention, un pack ou un abonnement est à facturer.');
    expect(expensesEmptyText()).toBe('Aucune dépense enregistrée. Ajoute-en une avec « + Dépense ».');
    expect(operationsEmptyText('requests')).toBe('Aucune demande. Ajoute-en une avec « + Nouvelle demande ».');
    expect(operationsEmptyText('interventions')).toBe('Aucune intervention. Ajoute-en une depuis une demande ou avec « + Intervention ».');
  });

  it('aucun message ne contient « (s) » ni de tiret long', () => {
    const all = [billingEmptyText(), expensesEmptyText(), operationsEmptyText('requests'), operationsEmptyText('interventions'), timeEmptyTexts({ period: 'today', drilldown: false }).empty];
    for (const text of all) {
      expect(text).not.toContain('(s)');
      expect(text).not.toContain('—');
    }
  });
});
