import type {CatalogItemSummary, CatalogRecommendationLink, CatalogVersion, OfferComponent} from '../../shared/commercial';
import type {ProspectSummary} from '../../shared/crm';
import type {OperationIconName} from '../operations/OperationIcon';
import {APPROVED_FAMILY_LABELS} from '../../shared/approvedFamilies';
import {beforeQuoteMissing, qualificationMissing, type ProspectMissing} from '../../shared/prospectProgress';
import {catalogueCategoryName, catalogueFamilyCode, catalogueFamilyIcon} from './catalogDisplay';

/** Lot 3 — règles d'affichage de l'assistant de devis. Aucune donnée métier n'est créée ici. */

export interface WizardFamily {
  key: string;
  name: string;
  icon: OperationIconName;
  offers: CatalogItemSummary[];
  services: CatalogItemSummary[];
}

const LABEL_TO_CODE = new Map(Object.entries(APPROVED_FAMILY_LABELS).map(([code, label]) => [label, code]));

function familyOf(item: CatalogItemSummary): {key: string; name: string} {
  const stored = item.currentVersion?.familyCode?.trim() || item.category?.trim() || '';
  if (!stored) return {key: 'AUTRE', name: 'Autres prestations'};
  // Deux libellés d'une même famille (« E-commerce » et « E-commerce WooCommerce ») = une seule tuile.
  const code = LABEL_TO_CODE.get(stored) ?? catalogueFamilyCode(stored) ?? stored;
  return {key: code, name: APPROVED_FAMILY_LABELS[code] ?? catalogueCategoryName(stored)};
}

/** Familles à présenter : celles qui contiennent une offre d'abord, puis ordre alphabétique. */
export function wizardFamilies(items: readonly CatalogItemSummary[]): WizardFamily[] {
  const families = new Map<string, WizardFamily>();
  for (const item of items) {
    if (!item.currentVersion) continue;
    const {key, name} = familyOf(item);
    const family = families.get(key) ?? {key, name, icon: catalogueFamilyIcon(name), offers: [], services: []};
    (item.type === 'offer' ? family.offers : family.services).push(item);
    families.set(key, family);
  }
  const byName = (a: CatalogItemSummary, b: CatalogItemSummary) => a.name.localeCompare(b.name, 'fr-FR');
  for (const family of families.values()) { family.offers.sort(byName); family.services.sort(byName); }
  return [...families.values()].sort((a, b) => Number(b.offers.length > 0) - Number(a.offers.length > 0) || a.name.localeCompare(b.name, 'fr-FR'));
}

export function wizardMoney(cents: number): string {
  return `${(cents / 100).toLocaleString('fr-FR', {minimumFractionDigits: 0, maximumFractionDigits: 2})} €`;
}

/** Prix lisible, sans code ni numéro de version. */
export function wizardPriceLabel(version: Pick<CatalogVersion, 'priceMode' | 'priceCents'> | null | undefined): string {
  if (!version) return 'Sur devis';
  if (version.priceMode === 'free') return 'Offert';
  if (version.priceCents == null || version.priceMode === 'quote_only') return 'Sur devis';
  const amount = wizardMoney(version.priceCents);
  switch (version.priceMode) {
    case 'starting_from': return `À partir de ${amount}`;
    case 'hourly': return `${amount} / heure`;
    case 'monthly': return `${amount} / mois`;
    case 'yearly': return `${amount} / an`;
    default: return amount;
  }
}

/** Code source de la fiche (jamais montré) : sert uniquement à retrouver l'échéancier prévu par le pack. */
export function catalogSourceCode(item: CatalogItemSummary | null | undefined): string | null {
  return item?.canonicalCode?.trim() || item?.currentVersion?.provenance?.recordKey?.trim() || null;
}

export interface WizardSuggestion { versionId: string; name: string; priceCents: number | null; priceLabel: string; reason: string; }

/**
 * Options à proposer avec une offre : ses compléments recommandés actifs et ses composants facultatifs.
 * Le lien du Catalogue désigne une version précise de la prestation ; l'assistant propose toujours la
 * version publiée ACTUELLE de cette prestation. Publier une nouvelle version d'une option ne demande
 * donc aucun rattachement. Une prestation désactivée ou sans version publiée n'est pas proposée.
 */
export function resolveSuggestions(
  links: ReadonlyArray<Pick<CatalogRecommendationLink, 'targetItemId' | 'status' | 'reason'>>,
  components: ReadonlyArray<Pick<OfferComponent, 'serviceItemId' | 'isOptional'>>,
  catalog: readonly CatalogItemSummary[],
): WizardSuggestion[] {
  const suggestions = new Map<string, WizardSuggestion>();
  const add = (itemId: string, reason: string) => {
    const item = catalog.find(candidate => candidate.id === itemId), version = item?.currentVersion;
    if (!item || !version || item.status !== 'active' || version.status !== 'published' || suggestions.has(item.id)) return;
    suggestions.set(item.id, {versionId: version.id, name: item.name, priceCents: version.priceCents ?? null, priceLabel: wizardPriceLabel(version), reason});
  };
  for (const link of links) if (link.status !== 'paused') add(link.targetItemId, link.reason?.trim() ?? '');
  for (const component of components) if (component.isOptional) add(component.serviceItemId, '');
  return [...suggestions.values()];
}

export interface QuoteStart { subject: string; needSummary: string; estimatedDelay: string; }

/**
 * Ce qui est déjà connu du prospect, repris tel quel dans le devis et modifiable ensuite.
 * L'objet n'est repris que s'il tient en une ligne courte ; sinon il suivra le nom de l'offre.
 */
export function quoteStartFromProspect(prospect: ProspectSummary): QuoteStart {
  const text = (value?: string | null) => value?.trim() || '';
  const need = text(prospect.projectSummary) || text(prospect.initialRequest) || text(prospect.primaryNeed);
  const short = [text(prospect.projectSummary), text(prospect.primaryNeed)].find(value => value && value.length <= 80 && !value.includes('\n')) ?? '';
  return {
    subject: short,
    needSummary: [need, text(prospect.projectContext)].filter(Boolean).join('\n\n'),
    estimatedDelay: text(prospect.targetDate) || text(prospect.timelineNote),
  };
}

/** Conseils avant devis : la même liste qu'avant, mais elle ne bloque plus rien. */
export function quoteAdvice(prospect: ProspectSummary, hasNeeds: boolean): ProspectMissing[] {
  const early = ['new', 'qualifying'].includes(prospect.stage ?? 'new');
  const seen = new Set<string>();
  return [...(early ? qualificationMissing(prospect) : []), ...beforeQuoteMissing(prospect, hasNeeds)]
    .filter(item => !seen.has(item.key) && Boolean(seen.add(item.key)));
}

/** Un devis ne se crée pas pour un dossier clos, archivé ou déjà devenu client (passer par le client). */
export function prospectAcceptsQuote(prospect: ProspectSummary): boolean {
  return !prospect.archivedAt && !prospect.clientAccountId && !['won', 'lost'].includes(prospect.stage ?? 'new');
}
