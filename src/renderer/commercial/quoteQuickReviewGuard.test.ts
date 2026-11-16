import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * F88 (relevé le 16/11/2026 pendant la recette F85) : après un changement du devis (ligne ajoutée, envoi…),
 * « Vérification avant envoi » recharge ses réponses proposées ; le garde gardait l’ancienne référence et
 * signalait des « Modifications non enregistrées » sans aucune saisie. La référence doit suivre chaque rechargement.
 */
const source = readFileSync(resolve(__dirname, 'QuoteQuickReview.tsx'), 'utf8');

describe('F88 : garde de « Vérification avant envoi »', () => {
  it('la référence du garde est réinitialisée à chaque rechargement du devis (même clé que le rechargement)', () => {
    const guard = source.match(/useUnsavedDraft\('Vérification avant envoi'[^;]*;/)?.[0] ?? '';
    expect(guard).toMatch(/resetKey:\s*reloadKey/);
    // La référence n’est prise qu’une fois arrivées les réponses du rechargement courant (pas les anciennes encore affichées).
    expect(guard).toMatch(/ready:\s*!!answers && loadedKey === reloadKey/);
    expect(source).toMatch(/setAnswers\(proposeQuickAnswers\(input, preparation\.parameters\)\); setLoadedKey\(key\);/);
    expect(source).toMatch(/const reloadKey = \[quote\.id, quote\.updatedAt, lineKey\]\.join\('\|'\);/);
    expect(source).toMatch(/\}, \[reloadKey\]\);/);
  });
});
