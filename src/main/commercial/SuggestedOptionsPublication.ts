import {createHash} from 'node:crypto';
import type {DatabaseAdapter} from '../database/DatabaseAdapter';
import type {CatalogVersion, CatalogVersionInput} from '../../shared/commercial';
import {reviewCatalogPrepublication} from '../../shared/catalogVersionReview';
import {CatalogService} from './CatalogService';
import {CatalogRecommendationsService} from './CatalogRecommendationsService';
import {ContractTermsService} from './ContractTermsService';
import {packClauseVersion, packOfferVersion} from './StarterOffersPublication';

/**
 * Lot 3 — options suggérées par offre (liste validée par Carlos le 10/11/2026).
 * Les options sont des « compléments recommandés » du Catalogue : elles sont attachées à une
 * version d'offre. Une version publiée étant figée, chaque offre reçoit une NOUVELLE version
 * (copie de la version publiée + ses options), publiée par les services existants.
 * Aucun devis existant n'est modifié.
 */
export interface SuggestedOption { code: string; /** Phrase montrée sous l'option dans l'assistant. */ reason: string; }
const option = (code: string, reason = ''): SuggestedOption => ({code, reason});
const VITRINE = ['AW-WEB-PAGE-SUP', 'AW-CONT-PAGE', 'AW-CONT-ART-SEO', 'AW-MAINT-WP-M', 'AW-MAINT-WP-A'].map(code => option(code));
const ECOMMERCE = ['AW-ECOM-PROD-SIMPLE', 'AW-ECOM-PROD-VAR', 'AW-ECOM-LIVRAISON-ADV', 'AW-ECOM-PAIEMENT-ADV', 'AW-ECOM-IMPORT', 'AW-MAINT-WC-M'].map(code => option(code));
// Décision de Carlos du 10/11/2026 : rédactions et articles restent vendables EN SUPPLÉMENT dans
// Business et Visibilité ; la phrase rappelle ce que la formule comprend déjà, pour ne pas le refacturer.
const EXTRA_PAGES = 'En supplément uniquement : la formule comprend déjà la rédaction de 3 pages.';
const EXTRA_ARTICLE = 'En supplément uniquement : la formule comprend déjà 1 article SEO.';
const withReasons = (reasons: Record<string, string>) => VITRINE.map(o => option(o.code, reasons[o.code] ?? ''));

export const SUGGESTED_OPTIONS: Readonly<Record<string, readonly SuggestedOption[]>> = {
  'AW-WEB-VITRINE': VITRINE,
  'V39-WEB-BUSINESS': withReasons({'AW-CONT-PAGE': EXTRA_PAGES}),
  'V39-WEB-VISIBILITE': withReasons({'AW-CONT-PAGE': EXTRA_PAGES, 'AW-CONT-ART-SEO': EXTRA_ARTICLE}),
  'AW-ECOM-BASE': ECOMMERCE,
  'V39-ECOM-BUSINESS': ECOMMERCE,
  'V39-ECOM-VISIBILITE': ECOMMERCE,
  'AW-MAINT-WP-M': [option('AW-TECH-AUDIT-REPRISE')],
  'AW-MAINT-WP-A': [option('AW-TECH-AUDIT-REPRISE')],
};

/** Prestations V3.9.4 à publier pour pouvoir les proposer, avec leurs clauses (cartographie proposée 409). */
export const OPTIONS_TO_PUBLISH: Readonly<Record<string, readonly string[]>> = {
  'AW-WEB-PAGE-SUP': ['WEB-PAGE-SUP-PERIMETRE', 'WEB-CONTENUS', 'WEB-AR', 'WEB-VALIDATION'],
  'AW-CONT-PAGE': ['CONTENT-BRIEF', 'CONTENT-CORRECTIONS', 'CONTENT-DROITS'],
};

/** Ancienne fiche sans code, même périmètre que « Page supplémentaire » à 79 € : désactivée (réversible). */
export const LEGACY_PAGE_NAME = 'Création d’une page';
const PROVENANCE = 'Liste validée par Carlos le 10/11/2026';

type Published = {id: string; item_id: string; item_type: string};
export type OptionsPlan = {
  publications: {code: string; itemId: string; versionId: string; action: 'publier' | 'déjà publiée'}[];
  clauses: {code: string; versionId: string; action: 'publier' | 'déjà publiée'}[];
  links: {clause: string; prestations: string[]}[];
  offers: {code: string; itemId: string; versionId: string; options: string[]; reasons: string[]; action: 'nouvelle version' | 'à jour'}[];
  legacy: {itemId: string | null; action: 'désactiver' | 'déjà inactive' | 'absente'};
  blockers: string[]; planSha256: string;
};

function publishedByCode(db: DatabaseAdapter, code: string): Published[] {
  return db.all<Published>(`SELECT v.id,v.item_id,i.item_type FROM catalog_versions v JOIN catalog_items i ON i.id=v.item_id
    WHERE v.status='published' AND i.status='active' AND (i.canonical_code=? OR json_extract(v.provenance_json,'$.recordKey')=?)`, [code, code]);
}

/** Lecture seule : ce qui serait publié, rattaché, versionné et désactivé. */
export function planSuggestedOptions(db: DatabaseAdapter): OptionsPlan {
  const blockers: string[] = [], catalog = new CatalogService(db), recommendations = new CatalogRecommendationsService(db);
  const publications: OptionsPlan['publications'] = [];
  for (const code of Object.keys(OPTIONS_TO_PUBLISH)) {
    const v = packOfferVersion(db, code);
    if (!v) { blockers.push(`${code} : version V3.9.4 introuvable.`); continue; }
    if (v.status === 'draft') {
      const item = catalog.getItem(v.item_id), version = item.versions.find(x => x.id === v.id)!;
      const review = reviewCatalogPrepublication(item, version);
      if (review.blocking.length) blockers.push(`${code} : ${review.blocking.join(' ; ')}`);
      if (item.type !== 'service' || item.status !== 'active') blockers.push(`${code} : doit être un service actif.`);
    } else if (v.status !== 'published') blockers.push(`${code} : version V3.9.4 retirée, aucune republication.`);
    publications.push({code, itemId: v.item_id, versionId: v.id, action: v.status === 'draft' ? 'publier' : 'déjà publiée'});
  }
  const linkMap = new Map<string, string[]>();
  for (const [code, clauseCodes] of Object.entries(OPTIONS_TO_PUBLISH)) for (const clause of clauseCodes) linkMap.set(clause, [...(linkMap.get(clause) ?? []), code]);
  const clauses: OptionsPlan['clauses'] = [];
  for (const code of linkMap.keys()) {
    const v = packClauseVersion(db, code);
    if (!v) { blockers.push(`Clause ${code} : version V3.9.4 introuvable.`); continue; }
    if (v.scope !== 'catalog') blockers.push(`Clause ${code} : portée « ${v.scope} » inattendue.`);
    if (v.status === 'draft' && /\[À RENSEIGNER|À COMPLÉTER/i.test(db.get<{body: string}>('SELECT body FROM contract_clause_versions WHERE id=?', [v.id])!.body))
      blockers.push(`Clause ${code} : texte encore à compléter, publication refusée.`);
    clauses.push({code, versionId: v.id, action: v.status === 'draft' ? 'publier' : 'déjà publiée'});
  }
  // Version qui sera proposée pour chaque option : celle publiée une fois ce plan appliqué.
  const targetItem = (code: string): string | null => {
    const planned = publications.find(p => p.code === code);
    if (planned) return planned.itemId;
    const rows = publishedByCode(db, code);
    if (rows.length !== 1) { blockers.push(`Option ${code} : ${rows.length} version publiée active trouvée, 1 attendue.`); return null; }
    if (rows[0].item_type !== 'service') { blockers.push(`Option ${code} : doit être un service.`); return null; }
    return rows[0].item_id;
  };
  const offers: OptionsPlan['offers'] = [];
  for (const [code, options] of Object.entries(SUGGESTED_OPTIONS)) {
    const rows = publishedByCode(db, code);
    if (rows.length !== 1) { blockers.push(`Offre ${code} : ${rows.length} version publiée active trouvée, 1 attendue.`); continue; }
    const wanted = options.map(o => [targetItem(o.code), o.reason]);
    if (wanted.some(([id]) => id === null)) continue;
    // Comparaison par prestation (et non par version) : l'assistant suit seul la version publiée
    // d'une option, donc une nouvelle version de l'option n'impose pas de refaire l'offre.
    const current = recommendations.list(rows[0].id).map(link => [link.targetItemId, link.reason]);
    const upToDate = JSON.stringify(current) === JSON.stringify(wanted);
    if (!upToDate && db.get(`SELECT id FROM catalog_versions WHERE item_id=? AND status='draft'${catalog.persistenceAvailable() ? ' AND abandoned_at IS NULL' : ''}`, [rows[0].item_id]))
      blockers.push(`Offre ${code} : un brouillon est déjà en cours sur cette fiche.`);
    offers.push({code, itemId: rows[0].item_id, versionId: rows[0].id, options: options.map(o => o.code), reasons: options.map(o => o.reason), action: upToDate ? 'à jour' : 'nouvelle version'});
  }
  const legacyRows = db.all<{id: string; status: string}>('SELECT id,status FROM catalog_items WHERE name=? AND canonical_code IS NULL', [LEGACY_PAGE_NAME]);
  if (legacyRows.length > 1) blockers.push(`« ${LEGACY_PAGE_NAME} » : ${legacyRows.length} fiches sans code, 1 attendue.`);
  const legacyItem = legacyRows[0];
  if (legacyItem?.status === 'active' && db.get(`SELECT c.id FROM offer_components c JOIN catalog_versions s ON s.id=c.service_version_id JOIN catalog_versions o ON o.id=c.offer_version_id
      WHERE s.item_id=? AND o.status='published'`, [legacyItem.id]))
    blockers.push(`« ${LEGACY_PAGE_NAME} » compose encore une offre publiée : désactivation refusée.`);
  const legacy: OptionsPlan['legacy'] = {itemId: legacyItem?.id ?? null, action: !legacyItem ? 'absente' : legacyItem.status === 'active' ? 'désactiver' : 'déjà inactive'};
  const links = [...linkMap.entries()].map(([clause, prestations]) => ({clause, prestations}));
  const planSha256 = createHash('sha256').update(JSON.stringify({publications, clauses, links, offers, legacy, blockers})).digest('hex');
  return {publications, clauses, links, offers, legacy, blockers, planSha256};
}

function versionInput(version: CatalogVersion): CatalogVersionInput {
  const {id: _id, itemId: _itemId, versionNumber: _n, status: _status, publishedAt: _p, createdAt: _c, lastSavedAt: _l, saveRevision: _r, abandonedAt: _a, ...input} = version;
  return input;
}

/** Application par les services existants. Rejouable : ce qui est déjà fait est ignoré. */
export function applySuggestedOptions(db: DatabaseAdapter, expectedPlanSha256: string) {
  const plan = planSuggestedOptions(db);
  if (plan.blockers.length) throw Error('Enregistrement bloqué : ' + plan.blockers.join(' ; '));
  if (plan.planSha256 !== expectedPlanSha256) throw Error('Plan périmé : prévisualiser de nouveau.');
  const catalog = new CatalogService(db), terms = new ContractTermsService(db), recommendations = new CatalogRecommendationsService(db);
  let servicesPublished = 0, clausesPublished = 0, linksSet = 0, offerVersions = 0;
  for (const p of plan.publications) if (p.action === 'publier') {
    catalog.publishVersion(p.versionId, catalog.getItem(p.itemId).versions.find(v => v.id === p.versionId)!); servicesPublished++;
  }
  for (const c of plan.clauses) if (c.action === 'publier') { terms.publishVersion(c.versionId); clausesPublished++; }
  const itemOf = new Map(plan.publications.map(p => [p.code, p.itemId]));
  for (const l of plan.links) {
    const clauseId = packClauseVersion(db, l.clause)!.clause_id;
    const existing = db.all<{catalog_item_id: string}>('SELECT catalog_item_id FROM catalog_contract_clause_links WHERE clause_id=? ORDER BY sort_order', [clauseId]).map(r => r.catalog_item_id);
    const wanted = [...new Set([...existing, ...l.prestations.map(code => itemOf.get(code)!)])];
    if (wanted.length !== existing.length) { terms.setCatalogLinks(clauseId, wanted); linksSet++; }
  }
  const targetOf = (code: string) => plan.publications.find(p => p.code === code)?.versionId ?? publishedByCode(db, code)[0].id;
  // Une prestation qui est elle-même proposée en option (maintenance) reçoit sa nouvelle version
  // en premier : les offres pointent ainsi vers sa version publiée finale, pas vers une version retirée.
  const isOption = (code: string) => Object.values(SUGGESTED_OPTIONS).some(options => options.some(o => o.code === code));
  const ordered = [...plan.offers].sort((a, b) => Number(isOption(b.code)) - Number(isOption(a.code)));
  for (const offer of ordered) if (offer.action === 'nouvelle version') {
    const published = catalog.getItem(offer.itemId).versions.find(v => v.id === offer.versionId)!;
    const draft = catalog.createVersion(offer.itemId, versionInput(published));
    const targets = offer.options.map(targetOf);
    recommendations.replace(draft.id, targets, undefined, targets.map((targetVersionId, index) => ({targetVersionId, reason: offer.reasons[index], status: 'active' as const, conditions: '', provenance: PROVENANCE})));
    catalog.publishVersion(draft.id);
    offerVersions++;
  }
  if (plan.legacy.action === 'désactiver') catalog.setStatus(plan.legacy.itemId!, 'inactive');
  return {servicesPublished, clausesPublished, linksSet, offerVersions, legacy: plan.legacy.action, planSha256: plan.planSha256};
}
