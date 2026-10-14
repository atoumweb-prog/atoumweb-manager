import { describe, expect, it } from 'vitest';
import { settingsSectionMatches } from './settingsSearch';

describe('settings section search', () => {
  it('affiche toutes les rubriques pour une requête vide', () => {
    expect(settingsSectionMatches('', 'Sauvegarde et sécurité')).toBe(true);
    expect(settingsSectionMatches('   ', 'Apparence')).toBe(true);
  });
  it('trouve une rubrique sans dépendre des accents ou des majuscules', () => {
    expect(settingsSectionMatches('SECURITE', 'Sauvegarde et sécurité SQLite')).toBe(true);
    expect(settingsSectionMatches('densite theme', 'Thème de l’interface densité')).toBe(true);
    expect(settingsSectionMatches('intervention', 'Workspace et thèmes')).toBe(false);
  });
  it('ne supprime pas d information lorsque plusieurs termes sont recherchés', () => {
    expect(settingsSectionMatches('aide survol', 'Aide contextuelle au survol')).toBe(true);
    expect(settingsSectionMatches('base wordpress', 'Sauvegarde de la base SQLite')).toBe(false);
  });
});
