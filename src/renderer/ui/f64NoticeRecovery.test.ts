import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { noticeClearedByRecovery } from './noticeLifetime';

/** F64 : après un « Réessayer » réussi, l'avis d'erreur de la page ne reste plus affiché. */
const read = (file: string) => readFileSync(resolve(__dirname, file), 'utf8');

describe('F64 : avis d’erreur levé quand la liste se recharge', () => {
  it('l’avis est levé seulement s’il montre la même erreur que celle de la liste rétablie', () => {
    expect(noticeClearedByRecovery('Actualisation des devis impossible.', 'Actualisation des devis impossible.')).toBe(true);
    expect(noticeClearedByRecovery("Error invoking remote method 'quotes:list': Error: Base occupée", 'Error: Base occupée')).toBe(true);
    expect(noticeClearedByRecovery('Devis DEV-2026-004 enregistré.', 'Actualisation des devis impossible.')).toBe(false);
    expect(noticeClearedByRecovery(null, 'Actualisation des devis impossible.')).toBe(false);
  });

  it('le tableau signale le rétablissement de sa liste, l’application l’écoute', () => {
    const table = read('DataTable.tsx'), app = read('../App.tsx');
    expect(table).toContain("new CustomEvent('atoumweb:list-recovered'");
    expect(app).toContain("addEventListener('atoumweb:list-recovered'");
    expect(app).toMatch(/noticeClearedByRecovery\(/);
  });
});
