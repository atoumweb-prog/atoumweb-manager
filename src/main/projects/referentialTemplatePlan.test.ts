import { describe, expect, it } from 'vitest';
import { natureOf, tasksFromSteps, templateKey } from './referentialTemplatePlan';

/** Modèles de projet du référentiel (fiche validée par Carlos le 16/11/2026) : conversion des étapes en lots et tâches. */
const VITRINE = [
  'Qualifier le besoin : activité, objectif du site, pages utiles, textes et photos déjà disponibles, date souhaitée.',
  'Chiffrer au devis la formule et les options, avec l’échéancier : 40 % à la commande, 60 % avant la mise en ligne.',
  'Faire accepter le devis par signature ou écrit explicite, puis encaisser l’acompte de 40 %.',
  'Contrôler avant de démarrer : contenus, droits sur les images, accès au domaine et à l’hébergement, date prévisionnelle et jalons.',
  'Livrer la maquette et demander un retour sous 10 jours ouvrés (à titre indicatif). Relancer vers J+7. Jamais de validation tacite.',
  'Premier cycle de corrections après la maquette.',
  'Réaliser le site, tester sur ordinateur et sur mobile, intégrer les mentions légales standard.',
  'Second cycle de corrections avant la livraison.',
  'Encaisser le solde de 60 % avant la mise en ligne.',
  'Livraison officielle constatée par écrit (signature ou e-mail explicite), avec la formation et la remise des accès. Cette date lance la garantie corrective de 30 jours.',
];
const P = 'Proposé, à valider : le référentiel ne décrit pas de procédure pour cette prestation.';
const LOTS = ['Démarrage', 'Réalisation', 'Corrections et validation', 'Livraison'];

describe('natureOf : base, complément ou service récurrent', () => {
  it.each([
    ['AW-WEB-VITRINE', 'base'], ['V39-WEB-BUSINESS', 'base'], ['AW-ECOM-BASE', 'base'], ['AW-LP-BASE', 'base'],
    ['AW-CONT-PAGE', 'base'], ['AW-BRAND-LOGO', 'base'], ['AW-PHOTO-SHOOT-ESS', 'base'], ['AW-MARIAGE-ESS', 'base'],
    ['V39-NL-PONCT-SIMPLE', 'base'], ['AW-DATA-GA-SC', 'base'], ['AW-APP-CADRAGE', 'base'],
    ['AW-WEB-BLOG', 'addon'], ['AW-WEB-BILINGUE', 'addon'], ['AW-ECOM-PROD-VAR', 'addon'], ['AW-LP-SECTION', 'addon'], ['AW-MARIAGE-DOMAINE', 'addon'],
    ['AW-MAINT-WP-M', 'recurring'], ['AW-SEO-GBP-A', 'recurring'], ['V39-GBP-ESS-M', 'recurring'], ['AW-DATA-SUIVI-M', 'recurring'],
    ['V39-STAT-ESS-A', 'recurring'], ['V39-NL-1-M', 'recurring'], ['V39-NL-2-A', 'recurring'], ['V39-HOST-LUNE', 'recurring'],
    ['V39-HOST-DOMAINE', 'recurring'], ['AW-TECH-HEBERG-WP', 'recurring'], ['AW-MARIAGE-RENOUV', 'recurring'], ['AW-TECH-PACK-5H', 'recurring'],
    ['AW-APP-MAINT', 'recurring'],
  ])('%s → %s', (code, nature) => { expect(natureOf(code)).toBe(nature); });
});

describe('tasksFromSteps : avant-vente, encaissements, lots', () => {
  const tasks = tasksFromSteps(VITRINE, P);

  it('exclut la qualification, le chiffrage et l’acceptation, mais garde le contrôle de l’acompte', () => {
    expect(tasks.some(t => /^(Qualifier|Chiffrer|Faire accepter)/.test(t.name))).toBe(false);
    expect(tasks[0]).toMatchObject({lot: 'Démarrage', name: 'Vérifier dans Abby l’encaissement de l’acompte de 40 %'});
  });

  it('transforme un encaissement en tâche de contrôle Abby, texte complet en description', () => {
    const solde = tasks.find(t => t.description.startsWith('Encaisser le solde de 60 %'));
    expect(solde?.name).toBe('Vérifier dans Abby l’encaissement : le solde de 60 % avant la mise en ligne.');
  });

  it('range les étapes dans les quatre lots sans jamais revenir en arrière', () => {
    const order = tasks.map(t => LOTS.indexOf(t.lot));
    expect(order.every(i => i >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(tasks.find(t => t.name.startsWith('Contrôler avant de démarrer'))?.lot).toBe('Démarrage');
    expect(tasks.find(t => t.name.startsWith('Livraison officielle'))?.lot).toBe('Livraison');
    expect(tasks.find(t => t.name.startsWith('Premier cycle de corrections'))?.lot).toBe('Corrections et validation');
  });

  it('reprend la provenance en fin de description', () => {
    expect(tasks.every(t => t.description.endsWith(P))).toBe(true);
  });

  it('une étape sans mot-clé reste en Réalisation', () => {
    expect(tasksFromSteps(['Réaliser la prestation décrite dans la fiche.'], P)[0].lot).toBe('Réalisation');
  });
});

describe('templateKey : regroupe les offres aux étapes identiques', () => {
  it('même liste, même clé ; liste différente, clé différente', () => {
    expect(templateKey(VITRINE)).toBe(templateKey([...VITRINE]));
    expect(templateKey(VITRINE)).not.toBe(templateKey(VITRINE.slice(1)));
  });
});
