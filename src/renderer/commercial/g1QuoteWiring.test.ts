import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/** Lot G1 (décisions de Carlos du 16/11/2026) : F55 vue de lecture, F61 boîte de la page, F62 en-tête sur une ligne. */
const read = (file: string) => readFileSync(resolve(__dirname, file), 'utf8');
const page = read('QuotesPage.tsx');
const journey = read('QuoteJourney.tsx');
const css = read('quote-journey.css').replace(/\/\*[\s\S]*?\*\//g, '');

describe('F61 : confirmation d’acceptation Abby dans la boîte de la page', () => {
  it('plus aucune boîte native pour l’acceptation Abby', () => {
    expect(page).not.toMatch(/window\.confirm\(`Confirmer que le devis/);
  });

  it('les deux acceptations (liste et fiche) passent par la boîte de la page', () => {
    expect(existsSync(resolve(__dirname, '../ui/usePageConfirm.tsx'))).toBe(true);
    expect(read('../ui/usePageConfirm.tsx')).toContain('ProspectDialog');
    expect(page).toContain("import {usePageConfirm} from '../ui/usePageConfirm';");
    expect((page.match(/await askConfirm\(abbyAcceptance\(/g) ?? []).length).toBe(2);
  });

  it('« Prolonger la validité » : la fonction sans bouton (code mort, boîte native) est retirée', () => {
    expect(page).not.toContain('async function extendValidity');
    expect(page).not.toContain('Nouvelle date de validité (AAAA-MM-JJ)');
  });
});

describe('F55 : vue de lecture d’un devis envoyé ou accepté', () => {
  it('le parcours reçoit un bandeau d’état hors brouillon', () => {
    expect(page).toContain("record={detail.status==='draft'?undefined:<QuoteStateBanner quote={detail}/>}");
    expect(page).toContain('className="quote-state-banner"');
  });

  it('hors brouillon : onglets sans numéro, ouverts sur le suivi, sans « Continuer » ni pied de parcours', () => {
    expect(journey).toContain("const recordLabels:Record<QuoteJourneyStep,string>={prices:'Prestations et prix',terms:'Conditions et CGV',review:'Suivi et documents'};");
    expect(journey).toContain("{!record&&<footer className=\"quote-journey-footer\">");
    expect(journey).toContain("record?'review'");
    expect(journey).toContain("className={'quote-journey'+(record?' is-record':'')}");
  });

  it('en lecture, l’onglet actif n’est plus un bouton jaune', () => {
    expect(css).toContain('.quote-journey.is-record .quote-journey-tabs [role=tab][aria-selected=true]{background:var(--surface-soft)!important;color:var(--text)!important;-webkit-text-fill-color:var(--text)!important;');
  });
});

describe('F62 : en-tête de la fiche devis sur une ligne', () => {
  it('« Prévisualiser côté client » rejoint la ligne d’outils du parcours, à côté de « Plus »', () => {
    expect(page).toContain('tools={<button className="secondary-button quote-preview-button"');
    expect(journey).toContain('<div className="quote-editor-tools">{tools}<MoreMenu');
  });

  it('la ligne d’outils est une rangée qui ne passe à la ligne qu’en fenêtre étroite', () => {
    expect(css).toContain('.quote-journey .quote-editor-tools{display:flex;flex-wrap:wrap;align-items:center;gap:8px;}');
  });
});
