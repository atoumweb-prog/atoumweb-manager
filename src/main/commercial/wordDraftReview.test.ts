import { describe, expect, it } from 'vitest';
import {
  compareWordDraftText, prepareWordDraftManifest, type ClauseDraftSource,
} from './wordDraftReview';

const original: ClauseDraftSource = {
  kind: 'contract_clause', clauseId: 'clause-09e', versionId: 'version-09e',
  status: 'draft', body: 'Titre CGV\nPremier paragraphe\nDeuxième paragraphe',
};

describe('09E — provenance et diff texte brouillon, sans import DOCX', () => {
  it('réimport texte identique : aucun diff, aucun nouveau brouillon', () => {
    const manifest = prepareWordDraftManifest(original);
    const before = structuredClone(original);
    const review = compareWordDraftText(manifest, original, original.body);
    expect(review.changed).toBe(false);
    expect(review.paragraphs.map(row => row.kind)).toEqual(['unchanged', 'unchanged', 'unchanged']);
    expect(review.warnings).toContain('Aucune clause, version contractuelle ou preuve officielle n’a été modifiée.');
    expect(original).toEqual(before);
  });

  it('signale un paragraphe modifié et l’ajout d’une nouvelle rubrique', () => {
    const manifest = prepareWordDraftManifest(original);
    const review = compareWordDraftText(manifest, original,
      'Titre CGV\nPremier paragraphe corrigé\nDeuxième paragraphe\nAnnexe ajoutée');
    expect(review.changed).toBe(true);
    expect(review.paragraphs.filter(row => row.kind === 'removed').map(row => row.text))
      .toEqual(['Premier paragraphe']);
    expect(review.paragraphs.filter(row => row.kind === 'added').map(row => row.text))
      .toEqual(['Premier paragraphe corrigé', 'Annexe ajoutée']);
    expect(review.paragraphs.find(row => row.text === 'Annexe ajoutée')?.afterIndex).toBe(3);
  });

  it('repère une suppression de rubrique sans supprimer le texte source', () => {
    const manifest = prepareWordDraftManifest(original);
    const before = original.body;
    const review = compareWordDraftText(manifest, original, 'Titre CGV\nDeuxième paragraphe');
    expect(review.paragraphs.filter(row => row.kind === 'removed').map(row => row.text))
      .toEqual(['Premier paragraphe']);
    expect(original.body).toBe(before);
  });

  it('refuse une source modifiée, une version différente et un ID différent', () => {
    const manifest = prepareWordDraftManifest(original);
    expect(() => compareWordDraftText(manifest,
      { ...original, body: original.body + '\nModifié entretemps' }, 'Texte externe'))
      .toThrow(/Conflit de version/);
    expect(() => compareWordDraftText(manifest,
      { ...original, versionId: 'version-09e-v2' }, 'Texte externe'))
      .toThrow(/Conflit de version/);
    expect(() => compareWordDraftText(manifest,
      { ...original, clauseId: 'autre-clause' }, 'Texte externe'))
      .toThrow(/Conflit de version/);
  });

  it.each(['published', 'retired', 'frozen', 'historical_missing'] as const)(
    'refuse toute révision directe d’une version %s',
    status => expect(() => prepareWordDraftManifest({ ...original, status }))
      .toThrow(/Seule une version brouillon/),
  );

  it('borne la taille et les paragraphes, sans jamais écrire en base', () => {
    const manifest = prepareWordDraftManifest(original);
    expect(() => compareWordDraftText(manifest, original, 'X\n'.repeat(301))).toThrow(/Trop de paragraphes/);
    expect(() => compareWordDraftText(manifest, original, 'X'.repeat(250_001))).toThrow(/trop volumineux/);
    expect(() => prepareWordDraftManifest({ ...original, body: 'X'.repeat(250_001) }))
      .toThrow(/trop volumineux/);
  });

  it('déclare explicitement la non-fidélité des styles et listes Word', () => {
    const review = compareWordDraftText(prepareWordDraftManifest(original), original, original.body);
    expect(review.warnings[0]).toMatch(/styles, listes automatiques, tableaux/);
  });
});
