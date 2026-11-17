import { describe, expect, it } from 'vitest';
import { backupsEmptyText, catalogEmptyText, directoryEmptyText, libraryEmptyText } from './ressourcesEmpty';

describe('R8 : messages vides des Ressources', () => {
  it('Catalogue : dit si le catalogue est vide ou si ce sont les filtres', () => {
    expect(catalogEmptyText({ filtersActive: true })).toBe('Aucune offre ou service pour ces filtres.');
    expect(catalogEmptyText({ filtersActive: false })).toBe('Le catalogue est vide. Crée une offre ou un service avec « + Service / Offre ».');
  });

  it('Bibliothèque : la liste est filtrée côté serveur, le message dit si les archivés sont exclus', () => {
    expect(libraryEmptyText({ includeArchived: true, filtersActive: false }))
      .toBe('Aucun composant dans la Bibliothèque. Ajoute-en un avec « Nouveau composant » ou importe un package.');
    const active = libraryEmptyText({ includeArchived: false, filtersActive: false });
    expect(active).toContain('Aucun composant actif');
    expect(active).toContain('Archivés');
    expect(libraryEmptyText({ includeArchived: false, filtersActive: true })).toBe('Aucun composant pour ces filtres.');
  });

  it('Sauvegardes : jamais « ne correspond aux filtres » sans filtre actif', () => {
    expect(backupsEmptyText({ total: 0, filtersActive: false })).toBe('Aucune sauvegarde déclarée. Déclare-en une avec « Déclarer une sauvegarde ».');
    expect(backupsEmptyText({ total: 4, filtersActive: true })).toBe('Aucune sauvegarde pour ces filtres.');
  });

  it('Annuaire : organisations et contacts, avec ou sans filtre', () => {
    expect(directoryEmptyText({ view: 'organizations', filtersActive: false })).toBe('Aucune organisation. Ajoute-en une avec « + Organisation ».');
    expect(directoryEmptyText({ view: 'contacts', filtersActive: false })).toBe('Aucun contact. Ajoute-en un avec « + Contact ».');
    expect(directoryEmptyText({ view: 'organizations', filtersActive: true })).toBe('Aucune organisation pour ces filtres.');
    expect(directoryEmptyText({ view: 'contacts', filtersActive: true })).toBe('Aucun contact pour ces filtres.');
  });

  it('aucun texte ne contient de tiret long ni de « (s) »', () => {
    const all = [
      catalogEmptyText({ filtersActive: false }), catalogEmptyText({ filtersActive: true }),
      libraryEmptyText({ includeArchived: true, filtersActive: false }),
      libraryEmptyText({ includeArchived: false, filtersActive: false }),
      backupsEmptyText({ total: 0, filtersActive: false }), backupsEmptyText({ total: 1, filtersActive: true }),
      directoryEmptyText({ view: 'organizations', filtersActive: false }), directoryEmptyText({ view: 'contacts', filtersActive: true }),
    ];
    for (const text of all) {
      expect(text).not.toMatch(/[—–]/);
      expect(text).not.toContain('(s)');
    }
  });
});
