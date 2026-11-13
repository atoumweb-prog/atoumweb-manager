import { readdirSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findPrimaryMisuse } from './buttonHierarchy';

describe('hiérarchie des boutons : une action principale par vue', () => {
  it('repère un bouton principal dont le libellé ferme, annule, retourne ou actualise', () => {
    expect(findPrimaryMisuse('<button className="primary-button">Fermer</button>')).toEqual(['Fermer']);
    expect(findPrimaryMisuse('<button className="primary-button" onClick={() => setOpen(false)}>Annuler la saisie</button>')).toEqual(['Annuler la saisie']);
    expect(findPrimaryMisuse('<AppButton variant="primary" onAction={reload}>Actualiser</AppButton>')).toEqual(['Actualiser']);
  });

  it('repère aussi un bouton principal dont une branche de libellé ferme', () => {
    expect(findPrimaryMisuse(`<button className="primary-button">{open ? 'Fermer' : '+ Nouveau client'}</button>`)).toEqual(['Fermer']);
  });

  it('accepte un bouton qui redevient secondaire quand son libellé ferme (état ouvert)', () => {
    expect(findPrimaryMisuse(`<button className={open ? 'secondary-button' : 'primary-button'}>{open ? 'Fermer' : '+ Nouveau client'}</button>`)).toEqual([]);
    expect(findPrimaryMisuse(`<button className={open ? 'secondary-button compact-button' : 'primary-button compact-button'}>{open ? 'Fermer le formulaire' : '+ Ajouter'}</button>`)).toEqual([]);
  });

  it('laisse passer les boutons secondaires et les vraies actions principales', () => {
    expect(findPrimaryMisuse('<button className="secondary-button">Fermer</button>')).toEqual([]);
    expect(findPrimaryMisuse('<AppButton variant="quiet">Annuler</AppButton>')).toEqual([]);
    expect(findPrimaryMisuse('<AppButton variant="primary">Enregistrer</AppButton>')).toEqual([]);
    expect(findPrimaryMisuse('<button className="primary-button" onClick={() => go()}>Créer le devis</button>')).toEqual([]);
  });
});

describe('hiérarchie des boutons : code de l’application', () => {
  const RENDERER = resolve(__dirname, '..');
  function tsxFiles(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = resolve(dir, entry.name);
      if (entry.isDirectory()) return tsxFiles(path);
      return entry.name.endsWith('.tsx') && !entry.name.includes('.test.') && !entry.name.includes('Workshop') ? [path] : [];
    });
  }

  it('aucun bouton principal ne s’appelle Fermer, Annuler, Retour, Réduire, Replier ou Actualiser', () => {
    const offenders: string[] = [];
    for (const file of tsxFiles(RENDERER)) {
      for (const label of findPrimaryMisuse(readFileSync(file, 'utf8'))) offenders.push(`${relative(RENDERER, file).split('\\').join('/')} : ${label}`);
    }
    expect(offenders).toEqual([]);
  });
});
