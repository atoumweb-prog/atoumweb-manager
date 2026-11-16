import type { CatalogService } from './CatalogService';
import type { CommercialRulesService } from './CommercialRulesService';
import type { CatalogVersionInput } from '../../shared/commercial';
import type { CommercialVersionRules } from '../../shared/commercialRules';

type ApprovedPack = NonNullable<CommercialVersionRules['approvedPack']>;

/**
 * Change une règle du pack approuvé d'une offre publiée par le chemin normal : nouvelle version brouillon au contenu
 * identique, règle modifiée, publication (l'ancienne version est retirée, les devis existants gardent la leur).
 * Rend null si la règle est déjà celle demandée (rejouable).
 */
export function reviseApprovedPackRule(catalog: CatalogService, rules: CommercialRulesService, canonicalCode: string, patch: Partial<ApprovedPack>, reason: string): {previousVersionId: string; newVersionId: string} | null {
  const item = catalog.list({status: 'active'}).find(entry => entry.canonicalCode === canonicalCode);
  const current = item && catalog.getItem(item.id).versions.find(version => version.status === 'published');
  if (!item || !current) throw Error('Offre publiée introuvable : ' + canonicalCode);
  const currentRules = rules.rules(current.id);
  if (!currentRules?.approvedPack) throw Error('Règles du pack approuvé absentes : ' + canonicalCode);
  if (Object.entries(patch).every(([key, value]) => (currentRules.approvedPack as Record<string, unknown>)[key] === value)) return null;
  const input: CatalogVersionInput = {
    nature: current.nature, description: current.description, inclusions: current.inclusions, exclusions: current.exclusions, prerequisites: current.prerequisites,
    priceMode: current.priceMode!, priceCents: current.priceCents, recommendedPriceCents: current.recommendedPriceCents, estimatedMinutes: current.estimatedMinutes,
    recommendedDelayDays: current.recommendedDelayDays, defaultDepositPercent: current.defaultDepositPercent, contractType: current.contractType,
    internalAdvice: current.internalAdvice, specialTerms: current.specialTerms,
  };
  const draft = catalog.createVersion(item.id, input);
  rules.configure(draft.id, {...currentRules, approvedPack: {...currentRules.approvedPack, ...patch}}, {reason, previousVersionId: current.id});
  catalog.publishVersion(draft.id);
  return {previousVersionId: current.id, newVersionId: draft.id};
}
