import type { QuoteContractAudience } from './contractTerms';

export const ADMIN_CONTRACT_KEYS = ['identity','administrative','vat','complaints','mediator','withdrawalRecipient','providers','gdpr'] as const;
export type AdminContractKey = typeof ADMIN_CONTRACT_KEYS[number];
export type InformationState = 'filled' | 'missing' | 'not_applicable' | 'verify';
export interface ContractInformation { state: InformationState; value: string; reason: string; }
export type ContractAdministration = Record<AdminContractKey, ContractInformation>;
export const DOCUMENT_ROLES = ['accepted_pdf','withdrawal_form','early_request','early_acknowledgement','acceptance','data_processing','rights','licenses','image_permission','other'] as const;
export type ContractDocumentRole = typeof DOCUMENT_ROLES[number];
export interface ContractDocumentLink {
  id: string; quoteId: string; documentId: string | null; role: ContractDocumentRole;
  sha256: string | null; statement: string | null; occurredAt: string | null; attachedAt: string; provenance: string; supersedesId: string | null;
  replacementReason: string | null; relativePath: string | null; fileName: string | null;
}
export interface ContractDocumentLinkInput { documentId: string; role: ContractDocumentRole; provenance: string; replacementReason?: string; }
export interface PaymentMilestone { label: string; percent: number; dueDate: string | null; event: string; }
export type PaymentPreset = 'order_100' | '30_70' | '30_40_30' | 'custom';
export interface QuoteContractParameters {
  schemaVersion: 1;
  audience: QuoteContractAudience;
  initialPayment: { qualification: 'acompte' | 'arrhes'; dueDate: string | null };
  payment: { preset: PaymentPreset; milestones: PaymentMilestone[]; professionalTerms: { extraDelay: string; lateRate: 'three_times_legal'; recoveryIndemnityCents: 4000 } | null };
  milestones: { label: string; date: string }[];
  conclusion: { channel: 'distance' | 'off_premises' | 'on_premises' | 'other' | null; context: string; purchasePurpose: string; professionalConsumerRegime: 'unknown' | 'applicable' | 'not_applicable'; offPremisesControlsVerified: boolean; otherChannelReason: string };
  digital: { kinds: ('digital_content' | 'digital_service' | 'classical_service')[]; mixed: boolean; supply: 'one_off' | 'continuous' | null; delivery: string; hosting: boolean; associatedServices: string; qualificationReason: string };
  warranties: { lineId: string; kind: 'small_adjustment' | 'wordpress_custom' | 'business_app' | 'not_applicable'; days: 30 | 60 | 90 | null; startEvent: string; statutoryRightsUnaffected: true }[];
  acceptance: { mode: 'explicit'; silenceHasEffect: false };
  rights: { reviewed: boolean; applicable: boolean; uses: string; duration: string; territory: string; sourceDelivery: string; exclusivity: string };
  renewal: { reviewed: boolean; applicable: boolean; mode: 'express' | 'monthly_no_commitment'; period: string; notice: string; termination: string; restitution: string };
  consumer: { informationDelivered: boolean; withdrawal: 'applicable' | 'not_applicable' | 'unknown'; exceptionReason: string; earlyStartRequested: boolean; onlineWithdrawal: 'not_applicable' | 'verified' | 'unconfigured'; onlineWithdrawalReason: string };
  annexes: { role: ContractDocumentRole; required: boolean; documentId: string | null }[];
  rsvp: { applicable: boolean; mode: 'minimal'; sensitiveEnabled: false; sensitiveRoute: 'disabled' | 'direct_caterer'; roles: string };
}
export interface ContractIssue { code: string; severity: 'blocking' | 'warning'; message: string; }
export interface QuoteContractPreparation { parameters: QuoteContractParameters | null; state: 'draft' | 'frozen' | 'historical_missing'; issues: ContractIssue[]; documents: ContractDocumentLink[]; snapshot: Record<string, unknown> | null; }
export interface QuoteContractPreparationApi {
  get(id: string): Promise<QuoteContractPreparation>;
  save(id: string, parameters: QuoteContractParameters): Promise<QuoteContractPreparation>;
  administration(): Promise<ContractAdministration>;
  saveAdministration(input: ContractAdministration): Promise<ContractAdministration>;
  attach(id: string, input: ContractDocumentLinkInput): Promise<QuoteContractPreparation>;
  importDocument(id: string, role: ContractDocumentRole, provenance: string): Promise<QuoteContractPreparation | null>;
  recordAcceptance(id: string, statement: string, occurredAt: string, provenance: string): Promise<QuoteContractPreparation>;
  openDocument(linkId: string): Promise<void>;
}
export function emptyAdministration(): ContractAdministration {
  return Object.fromEntries(ADMIN_CONTRACT_KEYS.map(key => [key, { state: 'missing', value: '', reason: '' }])) as ContractAdministration;
}
export function paymentMilestones(preset: PaymentPreset): PaymentMilestone[] {
  const percentages = preset === 'order_100' ? [100] : preset === '30_70' ? [30,70] : preset === '30_40_30' ? [30,40,30] : [];
  return percentages.map((percent, index) => ({ label: index === 0 ? 'Commande' : index === percentages.length - 1 ? 'Livraison' : 'Jalon intermédiaire', percent, dueDate: null, event: '' }));
}
export function emptyContractParameters(audience: QuoteContractAudience, depositPercent = 30): QuoteContractParameters {
  return {
    schemaVersion: 1, audience, initialPayment: { qualification: 'acompte', dueDate: null },
    payment: { preset: depositPercent === 100 ? 'order_100' : depositPercent === 30 ? '30_70' : 'custom', milestones: depositPercent === 30 || depositPercent === 100 ? paymentMilestones(depositPercent === 100 ? 'order_100' : '30_70') : [{ label: 'Commande', percent: depositPercent, dueDate: null, event: '' },{ label: 'Solde', percent: 100-depositPercent, dueDate: null, event: '' }], professionalTerms: audience==='professional'?{extraDelay:'',lateRate:'three_times_legal',recoveryIndemnityCents:4000}:null },
    milestones: [], conclusion: { channel: null, context: '', purchasePurpose: '', professionalConsumerRegime: 'unknown', offPremisesControlsVerified: false, otherChannelReason: '' },
    digital: { kinds: [], mixed: false, supply: null, delivery: '', hosting: false, associatedServices: '', qualificationReason: '' },
    warranties: [], acceptance: { mode: 'explicit', silenceHasEffect: false },
    rights: { reviewed: false, applicable: false, uses: '', duration: '', territory: '', sourceDelivery: '', exclusivity: '' },
    renewal: { reviewed: false, applicable: false, mode: 'express', period: '', notice: '', termination: '', restitution: '' },
    consumer: { informationDelivered: false, withdrawal: 'unknown', exceptionReason: '', earlyStartRequested: false, onlineWithdrawal: 'unconfigured', onlineWithdrawalReason: '' },
    annexes: [], rsvp: { applicable: false, mode: 'minimal', sensitiveEnabled: false, sensitiveRoute: 'disabled', roles: '' },
  };
}

export function withContractAudience(p:QuoteContractParameters,audience:QuoteContractAudience):QuoteContractParameters {
  return {...p,audience,payment:{...p.payment,professionalTerms:audience==='professional'?p.payment.professionalTerms??{extraDelay:'',lateRate:'three_times_legal',recoveryIndemnityCents:4000}:null}};
}