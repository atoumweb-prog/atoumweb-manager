import type {AdminContractKey} from './quoteContractPreparation';

/** Libellés en français simple des informations de l'entreprise (écran « Mon entreprise » et vérifications du devis). */
export const ADMIN_LABELS: Readonly<Record<AdminContractKey, string>> = {
  identity: 'Nom et statut de l’entreprise',
  administrative: 'Adresse, SIRET et coordonnées',
  vat: 'TVA',
  complaints: 'Contact pour les réclamations',
  mediator: 'Médiateur de la consommation',
  withdrawalRecipient: 'Contact pour les rétractations',
  providers: 'Prestataires et sous-traitants',
  gdpr: 'Données personnelles',
};

/** Exemples affichés dans les champs vides. */
export const ADMIN_EXAMPLES: Readonly<Partial<Record<AdminContractKey, string>>> = {
  identity: 'Ex. : Prénom Nom EI — Nom commercial\nEntrepreneur individuel (EI) · Micro-entreprise',
  administrative: 'Ex. :\nAdresse\nSIREN · SIRET · Code APE\nE-mail · Téléphone · Site internet',
  complaints: 'Ex. : support@… — réponse sous 48 h',
};

/** Mention obligatoire pour une micro-entreprise en franchise en base de TVA. */
export const MICRO_VAT_MENTION = 'TVA non applicable, article 293 B du CGI';

/** Ligne fixe affichée au devis quand le service touche des données personnelles : l'accord RGPD reste distinct du devis, propre à chaque site. */
export const GDPR_QUOTE_LINE = 'Accord de protection des données (RGPD) distinct du devis, à signer avant toute opération sur des données personnelles ; le modèle peut être consulté avant l’acceptation du devis.';

/** Offres dont la réalisation ou l'exploitation touche des données personnelles du client : sites, boutiques, landing pages, hébergement, maintenance, interventions techniques, newsletters, mariage, développement WordPress. */
const DATA_PROCESSING_CODES = /^(AW-WEB-|V39-WEB-|AW-ECOM-|V39-ECOM-|AW-LP-|AW-MAINT-|V39-HOST-|AW-TECH-|V39-NL-|AW-MARIAGE-|AW-DEVWP-)/;
export const involvesPersonalData = (catalogueCodes: readonly (string | null | undefined)[]): boolean => catalogueCodes.some(code => !!code && DATA_PROCESSING_CODES.test(code));

export const isMicroVatMention = (value: string): boolean => value.trim() === MICRO_VAT_MENTION;

/** Message de la liste de vérification du devis, en clair et avec l'endroit où corriger. */
export function adminChecklistLabel(key: AdminContractKey): string {
  return `Mon entreprise : « ${ADMIN_LABELS[key]} » à renseigner (Réglages › Mon entreprise et devis)`;
}
