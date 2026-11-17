import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/** F71a : les champs facultatifs vides d'Offres & Tarifs ne s'affichent plus (aucune donnée touchée). */
const page = readFileSync(resolve(__dirname, 'CatalogPage.tsx'), 'utf8');

describe('F71a : champs vides d’Offres & Tarifs', () => {
  it('la vue standard du tableau n’a plus la colonne « Prix conseillé » (toujours disponible dans « Colonnes et vues »)', () => {
    expect(page).toContain("defaultVisibleColumnIds={['category','identity','type','price','priceMode','status','public','version','open']}");
    expect(page).toContain("{id:'recommendedPrice',label:'Prix conseillé'");
  });

  it.each([
    ['Prix conseillé', 'displayedVersion.recommendedPriceCents != null && <Summary label="Prix conseillé"'],
    ['Acompte par défaut', 'displayedVersion.defaultDepositPercent != null && <Summary label="Acompte par défaut"'],
    ['Délai recommandé', 'displayedVersion.recommendedDelayDays != null && <Summary label="Délai recommandé"'],
    ['Ancien libellé contractuel', 'displayedVersion.contractType && <Summary label="Ancien libellé contractuel (legacy)"'],
  ])('dans la fiche, « %s » ne s’affiche que s’il est renseigné', (_label, expected) => {
    expect(page).toContain(expected);
  });
});
