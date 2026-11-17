import { createHash } from 'node:crypto';

/**
 * Modèles de projet du référentiel (fiche validée par Carlos le 16/11/2026,
 * docs/refonte/plans/2026-11-16-modeles-de-projet-design.md) : conversion pure des « étapes à faire »
 * du référentiel en lots et tâches de modèle de projet. Aucune lecture ni écriture de base ici.
 */
export type OfferNature = 'base' | 'addon' | 'recurring';
export const TEMPLATE_LOTS = ['Démarrage', 'Réalisation', 'Corrections et validation', 'Livraison'] as const;
export type TemplateLot = typeof TEMPLATE_LOTS[number];
export interface PlannedTask { lot: TemplateLot; name: string; description: string }

/** Nature C : contrats et crédits suivis par période, jamais un projet (AGENTS.md). */
const RECURRING = /^(AW-MAINT-|AW-SEO-GBP-|V39-GBP-|AW-DATA-SUIVI-|V39-STAT-|V39-NL-[12]-|V39-HOST-|AW-TECH-HEBERG-WP$|AW-MARIAGE-RENOUV$|AW-TECH-PACK-|AW-APP-MAINT$)/;
/** Nature B : options d'un site, d'une boutique, d'une landing ou d'un site de mariage, ajoutées au projet de base. */
const ADDON = /^(AW-WEB-(?!VITRINE$)|AW-ECOM-(?!BASE$)|AW-LP-(?!BASE$)|AW-MARIAGE-DOMAINE$)/;

export function natureOf(code: string): OfferNature {
  if (RECURRING.test(code)) return 'recurring';
  if (ADDON.test(code)) return 'addon';
  return 'base';
}

const PRE_SALE = /^(Qualifier|Chiffrer|Faire accepter|Ne jamais chiffrer)/;
const DEPOSIT = /encaisser l[’']acompte de (\d+) ?%/i;
const DELIVERY = /^(Livraison officielle|Livrer (?!la maquette)|Mettre en ligne|Remettre|À la livraison|À la fin|Après|Rappeler que la gestion|Proposer la maintenance)/;
const REVIEW = /(corrections?|maquette|valider|validation|^Tester|retour)/i;
const START = /^(Contrôler|Vérifier|Obtenir|Demander|Recevoir|Faire le brief|Cadrer|Définir|Rappeler|Recueillir|Faire une sauvegarde|Faire l[’']atelier|Faire signer|Séparer)/;

function lotOf(text: string): TemplateLot {
  if (DELIVERY.test(text)) return 'Livraison';
  if (REVIEW.test(text)) return 'Corrections et validation';
  if (START.test(text)) return 'Démarrage';
  return 'Réalisation';
}

/** Nom lisible : l'en-tête de l'étape (avant « : » ou la première phrase), le texte complet restant en description. */
function shortName(text: string): string {
  const colon = text.indexOf(' : ');
  let head = colon > 0 && colon <= 70 ? text.slice(0, colon) : text.split(/(?<=\.)\s/)[0];
  head = head.replace(/\.$/, '').trim();
  if (head.length > 90) head = head.slice(0, head.lastIndexOf(' ', 88)) + '…';
  return head;
}

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

export function tasksFromSteps(steps: string[], provenance: string): PlannedTask[] {
  const tasks: PlannedTask[] = [];
  let floor = 0;
  const push = (lot: TemplateLot, name: string, step: string) => {
    const index = Math.max(floor, TEMPLATE_LOTS.indexOf(lot));
    floor = index;
    tasks.push({lot: TEMPLATE_LOTS[index], name, description: `${step}\n\n${provenance}`});
  };
  for (const raw of steps) {
    const step = raw.trim();
    if (!step) continue;
    if (PRE_SALE.test(step)) {
      const deposit = step.match(DEPOSIT);
      if (deposit) push('Démarrage', `Vérifier dans Abby l’encaissement de l’acompte de ${deposit[1]} %`, step);
      continue;
    }
    if (/^Encaisser /.test(step)) { push(lotOf(step.replace(/^Encaisser /, '')), `Vérifier dans Abby l’encaissement : ${lowerFirst(step.replace(/^Encaisser /, ''))}`, step); continue; }
    push(lotOf(step), shortName(step), step);
  }
  return tasks;
}

export function templateKey(steps: string[]): string {
  return createHash('sha256').update(JSON.stringify(steps.map(step => step.trim()))).digest('hex').slice(0, 16);
}
