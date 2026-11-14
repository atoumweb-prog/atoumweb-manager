import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/** R4 : câblage de la page Devis, vérifié par lecture du source (même méthode que `crm/prospectR3Wiring.test.ts`). */
const read = (name: string) => readFileSync(resolve(__dirname, name), 'utf8');

describe('R4 : liste des devis', () => {
  const page = read('QuotesPage.tsx');

  it('la colonne « Décision » n’a plus de bouton jaune : « Confirmer accepté dans Abby » est secondaire', () => {
    const column = page.match(/\{id:'decision'[\s\S]*?\n        \}\},/)![0];
    expect(column).not.toContain('primary-button');
    expect(column).toMatch(/secondary-button compact-button[^>]*disabled=\{acceptanceBusyIds\.includes\(quote\.id\)\}/);
    expect(column).toContain('Confirmer accepté dans Abby');
  });

  it('« À négocier » est rangé dans un menu « Plus » dont le conteneur arrête la propagation du clic', () => {
    const column = page.match(/\{id:'decision'[\s\S]*?\n        \}\},/)![0];
    expect(column).toContain('<MoreMenu');
    expect(column).toContain("label: 'À négocier'");
    expect(column).toMatch(/onClick=\{\(event\) => event\.stopPropagation\(\)\}/);
    expect(column).toContain('quoteDecisionActions(');
  });

  it('les statuts et les badges passent par StatusPill, plus par les classes maison', () => {
    expect(page).toContain('<StatusPill tone={quoteStatusTone(quote.status)}>');
    expect(page).not.toMatch(/quote-status quote-/);
    expect(page).not.toContain('<span className="status-pill">En négociation</span>');
  });

  it('l’assistant n’a que deux portes : la page Devis et l’onglet Devis de la fiche prospect', () => {
    const renderers = ['QuotesPage.tsx', '../crm/ProspectQuoteWorkspace.tsx', '../crm/ProspectQuotePanel.tsx', '../home/HomeDashboard.tsx'].filter((file) => /<QuoteWizard\b/.test(read(file)));
    expect(renderers).toEqual(['QuotesPage.tsx', '../crm/ProspectQuoteWorkspace.tsx']);
  });
});

describe('R4 : éditeur du devis', () => {
  const journey = read('QuoteJourney.tsx');
  const documents = read('QuoteDocumentActions.tsx');

  it('la barre d’outils de l’éditeur n’a plus trois boutons au même niveau : un menu « Plus »', () => {
    expect(journey).toContain('<MoreMenu');
    expect(journey).not.toMatch(/<button type="button" className="secondary-button" disabled=\{pdfBusy\}/);
    for (const label of ['Afficher l’aperçu paginé', 'Actualiser l’aperçu paginé', 'Reprendre le modèle enregistré', 'Réglages de l’entreprise et du modèle']) expect(journey).toContain(label);
  });

  it('les gestionnaires sont ceux d’avant : aperçu, reprise du modèle, ouverture des Réglages derrière la garde de sortie', () => {
    expect(journey).toMatch(/id:\s*'preview'/);
    expect(journey).toMatch(/onSelect=\{[^}]*preview\(true\)/);
    expect(journey).toContain("sessionStorage.setItem('settings-focus-company','1')");
    expect(journey).toContain('Enregistre ou annule les modifications avant de reprendre le modèle ou actualiser l’aperçu.');
  });

  it('la dernière étape s’appelle « Vérifier et envoyer »', () => {
    expect(journey).toContain("review:'Vérifier et envoyer'");
    expect(journey).not.toContain('Vérifier et sortir');
  });

  it('copie, PDF, Word et modèle sont rangés dans « Plus », avec les mêmes garde-fous', () => {
    expect(documents).toContain('<MoreMenu');
    expect(documents).not.toMatch(/<button type="button" className="secondary-button" disabled=\{busy\} onClick=\{\(\)=>void run\('copy'\)\}/);
    for (const label of ['Aperçu du devis et des CGV', 'Copier toutes les clauses', 'Créer le PDF', 'Créer le fichier Word', 'Modèle d’accord RGPD (PDF)']) expect(documents).toContain(label);
    expect(documents).toContain('Enregistre ou annule les modifications avant l’aperçu.');
    expect(documents).toContain('Enregistre ou annule les modifications avant de copier ou exporter.');
  });
});

describe('R4 : assistant de nouveau devis', () => {
  const wizard = read('QuoteWizard.tsx');

  it('à l’étape « Pour qui », « Suivant » est inactif et dit pourquoi', () => {
    expect(wizard).toMatch(/const blockedReason = step === 'owner' \? validate\('owner'\) : null;/);
    expect(wizard).toMatch(/<button className="primary-button" type="button" disabled=\{Boolean\(blockedReason\)\} onClick=\{next\}>Suivant →<\/button>/);
    expect(wizard).toMatch(/\{blockedReason && <span className="quote-wizard-hint" role="status">Choisis un prospect ou un client pour continuer\.<\/span>\}/);
  });

  it('les autres étapes gardent le message d’erreur après tentative (aucun blocage a priori)', () => {
    expect(wizard).toContain('function next(): void {');
    expect(wizard).toMatch(/const problem = validate\(step\);\s*setError\(problem\);/);
  });

  it('l’outil « Créer un faux dossier TEST » est replié sous « Recette », en mode développement seulement', () => {
    expect(wizard).toMatch(/\{developmentMode && <details className="quote-wizard-recipe"><summary>Recette<\/summary>[\s\S]*?Créer un faux dossier TEST[\s\S]*?<\/details>\}/);
  });
});

describe('R4 : les menus « Plus » restent visibles dans le panneau du devis', () => {
  it('ils s’ouvrent vers la droite (align="start") : le panneau latéral coupe un menu ouvert vers la gauche', () => {
    expect(read('QuoteJourney.tsx')).toMatch(/<MoreMenu align="start"/);
    expect(read('QuoteDocumentActions.tsx')).toMatch(/<MoreMenu align="start"/);
  });
});
