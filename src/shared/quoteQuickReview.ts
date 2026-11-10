import type { QuoteContractParameters } from './quoteContractPreparation';

/**
 * Lot 4 — vérification rapide avant envoi.
 * Les six contrôles qui bloquaient un devis neuf (canal, nature et livraison, calendrier, garantie,
 * droits, renouvellement) deviennent six questions pré-remplies. Rien n'est enregistré tant que
 * l'utilisateur n'a pas validé : une réponse proposée n'est jamais une qualification silencieuse.
 * Une valeur déjà enregistrée dans le devis l'emporte toujours sur la proposition.
 *
 * Réponses proposées, tirées du référentiel métier V1.5 :
 *  - OFF-013 : garantie corrective commerciale de 30 jours à partir de la livraison officielle documentée ;
 *  - OFF-005 : indiquer une date estimée de livraison ;
 *  - MAINT-003 / CL-03 : maintenance mensuelle résiliable en fin de période payée, maintenance annuelle
 *    renouvelée seulement sur accord exprès (proposition 30 jours avant) ;
 *  - SQ-30 : export et conservation 30 jours après la sortie.
 */
export type QuickChannel = 'distance' | 'on_premises' | 'off_premises' | 'other';
export type QuickKind = QuoteContractParameters['digital']['kinds'][number];
export type QuickRenewal = 'none' | 'monthly' | 'annual_express' | 'custom';
export type QuickWarrantyDays = 30 | 60 | 90 | null;

export interface QuickReviewLine { id: string; label: string; periodicity?: string | null; }
export interface QuickReviewInput { subject: string; needSummary: string | null; estimatedDelay: string | null; lines: QuickReviewLine[]; }

export interface QuickAnswers {
  channel: QuickChannel; context: string; purpose: string;
  kinds: QuickKind[]; delivery: string;
  milestoneLabel: string; milestoneDate: string; milestoneEvent: string;
  warranties: { lineId: string; days: QuickWarrantyDays }[];
  specificRights: boolean;
  renewal: QuickRenewal;
}

/** Codes de contrôle couverts par la vérification rapide (les autres restent dans le réglage détaillé). */
export const QUICK_REVIEW_CODES: readonly string[] = ['CONCLUSION', 'DIGITAL_QUALIFICATION', 'DELIVERY_MILESTONE', 'WARRANTY_COVERAGE', 'WARRANTY_START', 'RIGHTS_REVIEW', 'RENEWAL_REVIEW', 'RENEWAL'];

export const QUICK_CHANNEL_LABELS: Record<QuickChannel, string> = {
  distance: 'À distance (e-mail, téléphone, visio)',
  on_premises: 'Dans mes locaux, en présence du client',
  off_premises: 'Chez le client ou ailleurs que dans mes locaux',
  other: 'Autrement',
};
export const QUICK_KIND_LABELS: Record<QuickKind, string> = {
  classical_service: 'Une prestation de service (création de site, maintenance, rédaction…)',
  digital_content: 'Un contenu numérique livré (fichiers, visuels, textes prêts à l’emploi)',
  digital_service: 'Un service en ligne fourni dans la durée (hébergement, outil en ligne)',
};
export const QUICK_RENEWAL_LABELS: Record<QuickRenewal, string> = {
  none: 'Non, c’est une prestation réalisée une fois',
  monthly: 'Oui, au mois : le client peut arrêter à tout moment, à la fin du mois payé',
  annual_express: 'Oui, à l’année : pas de reconduction automatique, seulement sur accord du client',
  custom: 'Autre cas (à régler dans le détail)',
};

const WARRANTY_KIND = { 30: 'small_adjustment', 60: 'wordpress_custom', 90: 'business_app' } as const;
const WARRANTY_START = 'Livraison officielle documentée';
const RESTITUTION = 'Export des données sur demande et conservation 30 jours après la fin du service';
const RENEWAL_TERMS: Record<'monthly' | 'annual_express', Pick<QuoteContractParameters['renewal'], 'mode' | 'period' | 'notice' | 'termination' | 'restitution'>> = {
  monthly: { mode: 'monthly_no_commitment', period: 'Mensuelle', notice: 'Aucun préavis', termination: 'Résiliable à tout moment, avec effet à la fin de la période payée', restitution: RESTITUTION },
  annual_express: { mode: 'express', period: 'Annuelle', notice: 'Proposition de renouvellement 30 jours avant l’échéance', termination: 'Aucune reconduction automatique : une nouvelle période exige l’accord exprès du client', restitution: RESTITUTION },
};

const text = (value?: string | null) => value?.trim() ?? '';
const isMonthly = (line: QuickReviewLine) => ['mensuelle', 'monthly'].includes(text(line.periodicity).toLowerCase());
const isYearly = (line: QuickReviewLine) => ['annuelle', 'yearly'].includes(text(line.periodicity).toLowerCase());
const isContinuous = (line: QuickReviewLine) => isMonthly(line) || isYearly(line);

function proposedRenewal(p: QuoteContractParameters, lines: QuickReviewLine[]): QuickRenewal {
  if (p.renewal.reviewed) {
    if (!p.renewal.applicable) return 'none';
    return p.renewal.mode === 'monthly_no_commitment' ? 'monthly' : p.renewal.mode === 'express' && p.renewal.period === RENEWAL_TERMS.annual_express.period ? 'annual_express' : 'custom';
  }
  const monthly = lines.some(isMonthly), yearly = lines.some(isYearly);
  return monthly && yearly ? 'custom' : monthly ? 'monthly' : yearly ? 'annual_express' : 'none';
}

/** Réponses à afficher : ce qui est déjà enregistré, sinon la proposition tirée du devis et du référentiel. */
export function proposeQuickAnswers(input: QuickReviewInput, p: QuoteContractParameters): QuickAnswers {
  const continuousOnly = input.lines.length > 0 && input.lines.every(isContinuous);
  const milestone = p.milestones[0];
  const delay = text(input.estimatedDelay);
  return {
    channel: p.conclusion.channel ?? 'distance',
    context: text(p.conclusion.context) || 'Échanges par e-mail et téléphone, devis transmis par e-mail',
    purpose: text(p.conclusion.purchasePurpose) || text(input.needSummary) || text(input.subject),
    kinds: p.digital.kinds.length ? [...p.digital.kinds] : ['classical_service'],
    delivery: text(p.digital.delivery) || (continuousOnly ? 'Service fourni en continu pendant la période souscrite' : 'Mise en ligne du site et remise des accès au client'),
    milestoneLabel: text(milestone?.label) || (continuousOnly ? 'Début du service' : 'Livraison'),
    milestoneDate: text(milestone?.date),
    milestoneEvent: text(milestone?.event) || (milestone ? '' : continuousOnly ? 'À la prise en charge du site, après acceptation du devis' : delay ? `Livraison estimée sous ${delay} après réception de l’acompte et des contenus` : ''),
    warranties: input.lines.map(line => {
      const saved = p.warranties.find(w => w.lineId === line.id);
      return { lineId: line.id, days: saved ? saved.days : isContinuous(line) ? null : 30 };
    }),
    specificRights: p.rights.reviewed && p.rights.applicable,
    renewal: proposedRenewal(p, input.lines),
  };
}

/** Ce qui empêche d'enregistrer les réponses ; vide = prêt. */
export function quickAnswersProblems(answers: QuickAnswers): string[] {
  const problems: string[] = [];
  if (!text(answers.context)) problems.push('Dis en quelques mots comment vous avez échangé.');
  if (!text(answers.purpose)) problems.push('Indique ce que le client achète.');
  if (!answers.kinds.length) problems.push('Coche au moins une nature de prestation.');
  if (!text(answers.delivery)) problems.push('Indique comment la prestation est remise au client.');
  if (!text(answers.milestoneLabel) || !(text(answers.milestoneDate) || text(answers.milestoneEvent))) problems.push('Indique une date ou un repère de livraison.');
  return problems;
}

/**
 * Paramètres contractuels à enregistrer. Ne touche qu'aux six sujets de la vérification rapide ;
 * paiement, annexes, règles consommateur et tout le reste sont rendus tels quels.
 */
export function applyQuickAnswers(p: QuoteContractParameters, answers: QuickAnswers, input: QuickReviewInput): QuoteContractParameters {
  const next = structuredClone(p);
  const lines = input.lines;
  next.conclusion = { ...next.conclusion, channel: answers.channel, context: text(answers.context), purchasePurpose: text(answers.purpose) };

  const kinds = [...new Set(answers.kinds)];
  const continuous = lines.some(isContinuous), oneOff = lines.some(line => !isContinuous(line));
  const mixed = kinds.length > 1 || continuous && oneOff;
  next.digital = {
    ...next.digital, kinds, mixed, supply: continuous && oneOff ? next.digital.supply : continuous ? 'continuous' : 'one_off', delivery: text(answers.delivery),
    qualificationReason: text(next.digital.qualificationReason) || `Nature confirmée par le prestataire lors de la vérification avant envoi : ${kinds.map(kind => QUICK_KIND_LABELS[kind]).join(' ; ')}`,
  };

  const milestone = { label: text(answers.milestoneLabel), date: text(answers.milestoneDate), event: text(answers.milestoneEvent) };
  next.milestones = [milestone, ...next.milestones.slice(1)];

  next.warranties = lines.map(line => {
    const days = answers.warranties.find(w => w.lineId === line.id)?.days ?? null;
    const saved = p.warranties.find(w => w.lineId === line.id);
    return days === null
      ? { lineId: line.id, kind: 'not_applicable' as const, days: null, startEvent: '', statutoryRightsUnaffected: true as const }
      : { lineId: line.id, kind: WARRANTY_KIND[days], days, startEvent: saved?.days === days && text(saved.startEvent) ? saved.startEvent : WARRANTY_START, statutoryRightsUnaffected: true as const };
  });

  // « Oui » ouvre le détail (usages, durée, territoire, sources) ; « non » clôt la question.
  next.rights = { ...next.rights, reviewed: true, applicable: answers.specificRights };

  if (answers.renewal === 'none') next.renewal = { ...next.renewal, reviewed: true, applicable: false };
  else if (answers.renewal === 'custom') next.renewal = { ...next.renewal, reviewed: true, applicable: true };
  else next.renewal = { ...next.renewal, reviewed: true, applicable: true, ...RENEWAL_TERMS[answers.renewal] };
  return next;
}
