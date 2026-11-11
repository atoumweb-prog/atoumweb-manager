import type {PaymentMilestone} from './quoteContractPreparation';
import {isApprovedSiteCode} from './approvedPaymentPlans';

/**
 * Règles de facturation d'un devis qui mélange une création (échéancier OFF-007) et des abonnements
 * (maintenance, etc.). Décisions de Carlos du 11/11/2026 :
 *  - l'échéancier 40/60 (ou 30/40/30) ne porte QUE sur la création ;
 *  - un abonnement annuel est payable d'avance, au début de sa période, pour sa période distincte ;
 *  - la maintenance d'un site créé commence après les 30 jours de test suivant la livraison officielle.
 * Tout est calculé à partir du code source de l'offre (jamais de son libellé) et ne s'applique qu'à un
 * devis en brouillon : aucun devis envoyé ou accepté n'est modifié.
 */
export interface BillingLine { id: string; snapshot?: Record<string, unknown> | null }
export type BillingKind = 'monthly' | 'yearly' | 'one_off';

export const MAINTENANCE_START_AFTER_SITE = 'À l’issue des 30 jours de test qui suivent la livraison officielle du site';

/** Code source de l'offre (pack V3.9.4), ou code canonique à défaut. */
export function lineCode(snapshot?: Record<string, unknown> | null): string {
  const provenance = snapshot?.provenance as {recordKey?: unknown} | null | undefined;
  return String(provenance?.recordKey ?? snapshot?.canonicalCode ?? '').trim().toUpperCase();
}

export function billingKind(snapshot?: Record<string, unknown> | null): BillingKind {
  const period = String(snapshot?.periodicity || snapshot?.priceMode || '');
  return ['mensuelle', 'monthly'].includes(period) ? 'monthly' : ['annuelle', 'yearly'].includes(period) ? 'yearly' : 'one_off';
}

export const isMaintenanceLine = (snapshot?: Record<string, unknown> | null): boolean =>
  String(snapshot?.familyCode ?? '').toUpperCase() === 'MAINT' || lineCode(snapshot).startsWith('AW-MAINT');

export const hasSiteCreation = (lines: BillingLine[]): boolean => lines.some(l => isApprovedSiteCode(lineCode(l.snapshot)));

/** Création + abonnement dans le même devis : les échéances ne peuvent plus être communes. */
export function isMixedBilling(lines: BillingLine[]): boolean {
  const kinds = new Set(lines.map(l => billingKind(l.snapshot)));
  return kinds.has('one_off') && (kinds.has('yearly') || kinds.has('monthly'));
}

/** Échéance unique d'une ligne d'abonnement. */
export function recurringMilestones(line: BillingLine, afterSite: boolean): PaymentMilestone[] {
  const afterTest = afterSite && isMaintenanceLine(line.snapshot);
  const kind = billingKind(line.snapshot);
  if (kind === 'yearly') {
    return [{label: 'Période annuelle, payable d’avance', percent: 100, dueDate: null,
      event: afterTest ? `Au début de la maintenance, ${MAINTENANCE_START_AFTER_SITE.charAt(0).toLowerCase()}${MAINTENANCE_START_AFTER_SITE.slice(1)}` : 'Au début de la période annuelle'}];
  }
  return [{label: 'Chaque mois', percent: 100, dueDate: null,
    event: afterTest ? `Chaque mois, à partir du début de la maintenance (${MAINTENANCE_START_AFTER_SITE.charAt(0).toLowerCase()}${MAINTENANCE_START_AFTER_SITE.slice(1)})` : 'Chaque mois, à partir du début du service'}];
}

export interface LineSchedule { lineId: string; milestones: PaymentMilestone[] }

/**
 * Échéances par ligne d'un devis brouillon. Renvoie :
 *  - `undefined` : rien à changer ;
 *  - `null` : retirer les échéances par ligne (le devis redevient simple) ;
 *  - un tableau : nouvelles échéances par ligne. Les choix existants sont toujours conservés.
 */
export function reconcileLineSchedules(lines: BillingLine[], base: PaymentMilestone[], existing?: LineSchedule[]): LineSchedule[] | null | undefined {
  const mixed = isMixedBilling(lines), afterSite = hasSiteCreation(lines);
  const fresh = (l: BillingLine): PaymentMilestone[] => billingKind(l.snapshot) === 'one_off' ? structuredClone(base) : recurringMilestones(l, afterSite);
  if (!existing) return mixed ? lines.map(l => ({lineId: l.id, milestones: fresh(l)})) : undefined;
  const byId = new Map(existing.map(s => [s.lineId, s]));
  const next = lines.map(l => byId.get(l.id) ?? {lineId: l.id, milestones: fresh(l)});
  if (!mixed && next.every(s => JSON.stringify(s.milestones) === JSON.stringify(base))) return null;
  const same = next.length === existing.length && next.every((s, i) => existing[i] === s);
  return same ? undefined : next;
}

// ---------------------------------------------------------------------------------------------
// Quantités déjà comprises dans une offre composée (grille V3.9.4 / règle de Carlos du 11/11/2026 :
// « 3 pages rédigées incluses dans Business + 5 supplémentaires = 8 pages »).
// ---------------------------------------------------------------------------------------------
const AVIS = {'AW-WEB-AVIS-GOOGLE': 1}, GA = {'AW-DATA-GA-SC': 1};
export const INCLUDED_IN_OFFER: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  'V39-WEB-BUSINESS': {'AW-CONT-PAGE': 3, ...AVIS, ...GA},
  'V39-WEB-VISIBILITE': {'AW-CONT-PAGE': 3, ...AVIS, ...GA, 'AW-WEB-BLOG': 1, 'AW-CONT-ART-SEO': 1},
  'V39-ECOM-BUSINESS': {'AW-WEB-NEWSLETTER': 1, ...AVIS, ...GA},
  'V39-ECOM-VISIBILITE': {'AW-WEB-NEWSLETTER': 1, ...AVIS, ...GA, 'AW-WEB-BLOG': 1, 'AW-CONT-ART-SEO': 1},
};

export interface IncludedQuantity { offerLabel: string; includedQuantity: number; soldQuantity: number; total: number }
export interface QuantityLine extends BillingLine { label: string; quantityMilli?: number | null }

/** Quantité déjà comprise dans une autre offre du même devis, ou `null`. */
export function includedQuantityFor(line: QuantityLine, all: QuantityLine[]): IncludedQuantity | null {
  const code = lineCode(line.snapshot);
  if (!code) return null;
  let included = 0, offerLabel = '';
  for (const other of all) {
    if (other.id === line.id) continue;
    const qty = INCLUDED_IN_OFFER[lineCode(other.snapshot)]?.[code];
    if (qty) { included += qty * ((other.quantityMilli ?? 1000) / 1000); offerLabel = offerLabel ? `${offerLabel} + ${other.label}` : other.label; }
  }
  if (!included) return null;
  const sold = (line.quantityMilli ?? 1000) / 1000;
  return {offerLabel, includedQuantity: included, soldQuantity: sold, total: included + sold};
}

/** Pluriel simple d'une unité commerciale (« page » → « pages »). */
export function pluralUnit(unit: string, quantity: number): string {
  const word = unit.trim();
  if (!word || quantity <= 1 || /[sxz]$/i.test(word) || /\s/.test(word)) return word;
  return `${word}s`;
}

const number = (n: number) => n.toLocaleString('fr-FR');
/** Phrase affichée sur le devis, neutre (pas d'accord de genre). */
export function includedQuantityNote(q: IncludedQuantity, unit: string): string {
  const u = pluralUnit(unit || '', q.total);
  return `Total : ${number(q.total)}${u ? ` ${u}` : ''} (${number(q.includedQuantity)} dans « ${q.offerLabel} » + ${number(q.soldQuantity)} en supplément).`;
}
