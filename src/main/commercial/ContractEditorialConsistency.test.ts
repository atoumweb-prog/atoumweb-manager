import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/** Editorial guardrails only: published SQLite versions are deliberately not touched. */
const proposals = JSON.parse(readFileSync(resolve(__dirname, '../../../docs/ux-v2/bibliotheque-humaine-118-20261025/PROPOSITIONS.json'), 'utf8')) as {
  clauses: Array<{ code: string; proposal: string; publication: boolean; adoption: boolean }>;
};
const text = (code: string): string => {
  const entry = proposals.clauses.find(row => row.code === code);
  if (!entry) throw new Error('Clause manquante : ' + code);
  return entry.proposal;
};

describe('cohérence éditoriale des contrats AtoumWeb', () => {
  it('conserve exactement 118 propositions non adoptées et un seul champ nominatif à renseigner', () => {
    expect(proposals.clauses).toHaveLength(118);
    expect(new Set(proposals.clauses.map(row => row.code)).size).toBe(118);
    expect(proposals.clauses.every(row => !row.publication && !row.adoption)).toBe(true);
    const markers = proposals.clauses.flatMap(row => [...row.proposal.matchAll(/\[[^\]\n]+\]/g)].map(hit => ({code: row.code, marker: hit[0]})));
    expect(markers).toEqual([{code:'CONS-RETRACTATION',marker:'[COORDONNÉES DU DESTINATAIRE À RENSEIGNER]'}]);
  });

  it('exclut les notes internes du texte des sauvegardes', () => {
    const clause = text('MAINT-SAUVEGARDE');
    expect(clause).toContain('une sauvegarde par semaine');
    expect(clause).toContain('une sauvegarde par jour');
    expect(clause).toContain('30 jours');
    expect(clause).toContain('selon les conditions de votre contrat');
    expect(clause).not.toMatch(/avant publication|reste à préciser|note interne/i);
  });

  it('applique la même règle de Lune obligatoire après résiliation, avec liberté de quitter AtoumWeb', () => {
    for (const code of ['WEB-HEBERGEMENT','TECH-HEBERGEMENT','MAINT-PERIMETRE','MAINT-RENOUVELLEMENT']) {
      const clause = text(code);
      expect(clause).toMatch(/souscription|souscrire/);
      expect(clause).toMatch(/nécessaire|devez/);
      expect(clause).toMatch(/autre hébergeur|choisir un autre hébergeur/);
    }
  });

  it('conserve la décision cPanel identique dans les deux clauses d’hébergement', () => {
    for (const code of ['WEB-HEBERGEMENT','TECH-HEBERGEMENT']) {
      const clause = text(code);
      expect(clause).toContain('Sur votre demande');
      expect(clause).toMatch(/cPanel/);
      expect(clause).toMatch(/sécurisé[e]?/);
      expect(clause).toMatch(/traçable/);
      expect(clause).not.toContain('L’accès éventuel');
    }
  });
});
