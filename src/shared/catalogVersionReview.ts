import type { CatalogItemDetail, CatalogVersion, OfferComponent } from './commercial';

/** 04C/E101: descriptive review only. This never certifies legal/CGV compliance. */
export interface CatalogVersionDifference {
  field: string;
  label: string;
  previous: string;
  proposed: string;
}

type ComparableKey =
  | 'nature' | 'description' | 'inclusions' | 'exclusions' | 'prerequisites'
  | 'priceMode' | 'priceCents' | 'recommendedPriceCents' | 'priceBasis'
  | 'defaultDepositPercent' | 'estimatedMinutes' | 'recommendedDelayDays'
  | 'commercialKind' | 'familyCode' | 'abbyLabel' | 'unit' | 'periodicity'
  | 'contractType' | 'specialTerms' | 'internalAdvice' | 'commercialParameters'
  | 'provenance';

const FIELDS: readonly [ComparableKey, string][] = [
  ['nature','Nature'],['description','Description client'],
  ['inclusions','Prestations incluses'],['exclusions','Exclusions'],['prerequisites','Prérequis'],
  ['priceMode','Mode tarifaire'],['priceCents','Prix catalogue (centimes)'],
  ['recommendedPriceCents','Prix conseillé (centimes)'],['priceBasis','Base de prix'],
  ['defaultDepositPercent','Acompte (%)'],['estimatedMinutes','Durée estimée (minutes)'],
  ['recommendedDelayDays','Délai recommandé (jours)'],['commercialKind','Nature commerciale'],
  ['familyCode','Famille'],['abbyLabel','Libellé Abby'],['unit','Unité'],
  ['periodicity','Périodicité'],['contractType','Ancien libellé contractuel'],
  ['specialTerms','Conditions commerciales'],['internalAdvice','Conseils internes'],
  ['commercialParameters','Paramètres commerciaux'],['provenance','Provenance'],
];

function stable(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (Array.isArray(value)) return value.length ? value.map(stable).join(' ; ') : '—';
  if (typeof value === 'object') {
    const fields=Object.entries(value as Record<string,unknown>)
      .filter(([,field]) => field !== null && field !== undefined && field !== '')
      .sort(([a],[b])=>a.localeCompare(b,'fr'));
    return fields.length ? fields.map(([key,field])=>key+' : '+stable(field)).join(' ; ') : '—';
  }
  return String(value);
}

export function compareCatalogVersions(
  previous: CatalogVersion | null | undefined,
  draft: CatalogVersion,
): CatalogVersionDifference[] {
  return FIELDS.flatMap(([field,label]) => {
    const before=stable(previous?.[field]),after=stable(draft[field]);
    return before===after ? [] : [{field,label,previous:before,proposed:after}];
  });
}

/** Separate blockers from advisory checks. No contract/blueprint is assumed mandatory. */
export function reviewCatalogPrepublication(
  item: CatalogItemDetail,
  version: CatalogVersion,
  components: readonly OfferComponent[] | null = null,
): { blocking: string[]; warnings: string[] } {
  const blocking: string[]=[];
  const warnings: string[]=[];
  if (version.itemId!==item.id || !item.versions.some(row=>row.id===version.id))
    blocking.push('La version sélectionnée ne correspond pas à cette fiche.');
  if (version.status!=='draft') blocking.push('Seul un brouillon peut être publié.');
  if (version.priceBasis==='actual_cost' && (version.priceMode!=='quote_only'||version.priceCents!=null))
    blocking.push('Un coût tiers réel doit rester sur devis sans prix fixe.');
  if (!['quote_only','free'].includes(version.priceMode) &&
    (version.priceCents==null||!Number.isSafeInteger(version.priceCents)||version.priceCents<0))
    blocking.push('Le montant de la prestation doit être un nombre entier de centimes valide.');
  if (version.priceMode==='free' && version.priceCents!==0 && version.priceCents!=null)
    blocking.push('Une prestation gratuite ne doit pas comporter de montant payant.');
  if (!version.nature?.trim()) warnings.push('Nature de la prestation non renseignée : à vérifier.');
  if (!version.description?.trim()) warnings.push('Description client non renseignée : à vérifier.');
  if (!version.inclusions?.length) warnings.push('Périmètre inclus non renseigné : à vérifier.');
  if (item.type==='offer' && components!==null && components.length===0)
    warnings.push('Aucun service associé à cette offre : vérifier si elle est autonome.');
  warnings.push('Vérifier séparément les clauses CGV, références contractuelles et modèles de production applicables. Aucun contrôle juridique automatique.');
  return {blocking,warnings};
}
