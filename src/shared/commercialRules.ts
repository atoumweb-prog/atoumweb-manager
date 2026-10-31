/** Explicit, versioned business configuration. Never resolve rules by a label. */
export interface CommercialVersionRules {
  schemaVersion: 1;
  minimumLineCents?: number;
  minimumBilledQuantityMilli?: number;
  particularTerms?: { title: string; body: string };
  attachment?: { kind: 'priority' | 'document'; compatibleCodes: string[]; allowIntervention?: boolean };
}

export interface QuoteLineParameters {
  contractNature?:'one_off'|'continuous'|null;
  contractEvent?:string|null;
  serviceDuration?:string|null;
  renewalTerms?:string|null;
  scopeExclusions?:string|null;
  productCount?:{kind:'included'|'additional';count:number}|null;
  scopeReference?:{versionId:string;label:string;versionNumber:number}|null;
  parentLineId?: string | null;
  parentInterventionId?: string | null;
  requestedDeadline?: string | null;
  availabilityConfirmed?: boolean;
  acceptedDeadline?: string | null;
  scope?: string | null;
  currentEstimateMinutes?: number | null;
  productionPlan?: string | null;
  serviceStartDate?: string | null;
  serviceEndDate?: string | null;
  siteId?: string | null;
  contextNodeId?: string | null;
  setupEstimateMinutes?: number | null;
  operationalProjectId?: string | null;
  parentOperationalSaleId?: string | null;
  periodAlignment?: 'calendar' | 'anniversary';
}

export interface OperationalSalePolicy {
  schemaVersion: 1;
  kind: 'hour_pack' | 'maintenance' | 'recurring' | 'recurring_addon' | 'intervention' | 'hosting';
  cadence: 'monthly' | 'yearly' | 'once';
  billingPeriod: 'monthly' | 'yearly' | 'once';
  creditMinutes?: number;
  validityMonths?: number;
  minorInterventions?: number;
  maximumMinorMinutes?: number;
  minimumBillableMinutes?: number;
  setupEstimateRequired?: boolean;
  targetRequirement?: 'none' | 'site' | 'context';
  requires?: string[];
  quantityMode?: 'whole_units' | 'hours';
  quantityMeaning?: 'credits' | 'hours' | 'billing_periods' | 'additional_targets';
  parentCodes?: string[];
  periodAlignment?: 'calendar' | 'anniversary';
}

export function validateOperationalSalePolicy(policy:OperationalSalePolicy):void {
  if(policy.schemaVersion!==1||!['hour_pack','maintenance','recurring','recurring_addon','intervention','hosting'].includes(policy.kind)
    ||!['monthly','yearly','once'].includes(policy.cadence)||!['monthly','yearly','once'].includes(policy.billingPeriod))throw Error('Politique opérationnelle 8B invalide.');
  for(const value of [policy.creditMinutes,policy.validityMonths,policy.minorInterventions,policy.maximumMinorMinutes,policy.minimumBillableMinutes])if(value!=null&&(!Number.isSafeInteger(value)||value<0))throw Error('Valeur opérationnelle 8B invalide.');
  if(policy.kind==='hour_pack'&&(!policy.creditMinutes||!policy.validityMonths||policy.cadence!=='once'))throw Error('Crédit de temps et validité requis.');
  if(policy.kind==='recurring_addon'&&!policy.parentCodes?.length)throw Error('Abonnement principal compatible requis.');
}

export function validateCommercialRules(rules: CommercialVersionRules): void {
  if (rules.schemaVersion !== 1) throw Error('Version de règles commerciales inconnue.');
  if (rules.minimumLineCents != null && (!Number.isSafeInteger(rules.minimumLineCents) || rules.minimumLineCents < 0)) throw Error('Minimum de facturation invalide.');
  if (rules.minimumBilledQuantityMilli != null && (!Number.isSafeInteger(rules.minimumBilledQuantityMilli) || rules.minimumBilledQuantityMilli < 1)) throw Error('Quantité minimale facturée invalide.');
  if (rules.particularTerms && (!rules.particularTerms.title.trim() || !rules.particularTerms.body.trim())) throw Error('Conditions particulières incomplètes.');
  if (rules.attachment && (!['priority', 'document'].includes(rules.attachment.kind) || !rules.attachment.compatibleCodes.length
    || rules.attachment.compatibleCodes.some(code => !/^AW-[A-Z0-9-]+$/.test(code)))) throw Error('Règle de rattachement incomplète.');
}
