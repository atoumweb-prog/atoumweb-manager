import {createHash} from 'node:crypto';
import type {DatabaseAdapter} from '../database/DatabaseAdapter';
import {CatalogService} from './CatalogService';
import {ContractTermsService} from './ContractTermsService';
import {APPROVED_PACK, approvedVersionRules} from './ApprovedPackSource';
import {reviewCatalogPrepublication} from '../../shared/catalogVersionReview';

/**
 * Lot 2 (décision de Carlos du 09/11/2026) : rendre les CGV disponibles pour les premières offres.
 * Publie, avec les services existants : les versions V3.9.4 de 8 offres, le socle CGV (sauf exclusions),
 * les clauses de prestation de ces offres, et leurs rattachements. Rien d'autre n'est publié.
 */
export const STARTER_OFFERS = [
  'AW-WEB-VITRINE', 'V39-WEB-BUSINESS', 'V39-WEB-VISIBILITE',
  'AW-ECOM-BASE', 'V39-ECOM-BUSINESS', 'V39-ECOM-VISIBILITE',
  'AW-MAINT-WP-M', 'AW-MAINT-WP-A',
] as const;

/** Clauses du socle volontairement NON publiées, avec la raison montrée à l'utilisateur. */
export const EXCLUDED_BASE_CLAUSES: Readonly<Record<string, string>> = {
  'BASE-REFERENCES-AGENCE': 'Clause 119 : l’autorisation de citer le client en référence doit rester distincte, facultative et révocable ; publiée dans le socle, elle entrerait dans chaque devis.',
  'CONS-MEDIATION': 'Clause 033 : contient « À COMPLÉTER AVANT COMMERCIALISATION AUX CONSOMMATEURS » tant qu’aucune convention de médiation n’est conclue.',
};

/** Extraits de la cartographie proposée (docs/integration-v394-v15-20261108/CARTOGRAPHIE-HISTORIQUE-PROPOSEE-409.csv). */
const MAPPED: Readonly<Record<string, readonly string[]>> = {
  'AW-WEB-VITRINE': ['WEB-OFFRE-5P-PERIMETRE', 'WEB-CONTENUS', 'WEB-AR', 'WEB-VALIDATION', 'WEB-MISE-EN-LIGNE', 'WEB-HEBERGEMENT', 'WEB-LICENCES', 'WEB-COMPATIBILITE'],
  'AW-ECOM-BASE': ['WEB-CONTENUS', 'WEB-AR', 'WEB-VALIDATION', 'WEB-MISE-EN-LIGNE', 'WEB-HEBERGEMENT', 'WEB-LICENCES', 'WEB-COMPATIBILITE', 'ECOM-CATALOGUE', 'ECOM-PAIEMENT', 'ECOM-LIVRAISON', 'ECOM-STOCK', 'ECOM-LEGAL', 'SERVICE-TIERS'],
  'AW-MAINT-WP-M': ['MAINT-PERIMETRE', 'MAINT-MAJ', 'MAINT-SAUVEGARDE', 'MAINT-INTERVENTIONS', 'MAINT-URGENCE', 'MAINT-RENOUVELLEMENT'],
  'AW-MAINT-WP-A': ['MAINT-PERIMETRE', 'MAINT-MAJ', 'MAINT-SAUVEGARDE', 'MAINT-INTERVENTIONS', 'MAINT-URGENCE', 'MAINT-RENOUVELLEMENT'],
  'AW-WEB-NEWSLETTER': ['WEB-NEWSLETTER-PERIMETRE', 'DATA-CONSENTEMENT', 'SERVICE-TIERS'],
  'AW-DATA-GA-SC': ['DATA-MESURE', 'DATA-ACCES', 'DATA-CONSENTEMENT', 'SERVICE-TIERS'],
  'AW-WEB-AVIS-GOOGLE': ['SERVICE-TIERS', 'DATA-ACCES'],
  'AW-CONT-PAGE': ['CONTENT-BRIEF', 'CONTENT-CORRECTIONS', 'CONTENT-DROITS'],
  'AW-WEB-BLOG': ['BLOG-PERIMETRE', 'BLOG-ROLES-CONTENUS', 'WEB-CONTENUS', 'WEB-VALIDATION', 'WEB-LICENCES'],
  'AW-CONT-ART-SEO': ['CONTENT-BRIEF', 'CONTENT-CORRECTIONS', 'CONTENT-DROITS', 'CONTENT-SEO'],
};

/**
 * Formules V39 sans cartographie : clauses de leur formule de base + clauses des services que la
 * grille V3.9.4 dit inclus (texte « Inclus » de chaque formule ; includedCodes pour WooCommerce).
 * Proposition fondée sur la grille, à valider par Carlos.
 */
const INHERITS: Readonly<Record<string, {base: string; inclus: readonly string[]}>> = {
  // « Socle vitrine Essentiel / Rédaction de 3 pages / Avis Google, GA4 et Search Console »
  'V39-WEB-BUSINESS': {base: 'AW-WEB-VITRINE', inclus: ['AW-CONT-PAGE', 'AW-WEB-AVIS-GOOGLE', 'AW-DATA-GA-SC']},
  // « Socle Business / Blog technique / 1 article SEO »
  'V39-WEB-VISIBILITE': {base: 'AW-WEB-VITRINE', inclus: ['AW-CONT-PAGE', 'AW-WEB-AVIS-GOOGLE', 'AW-DATA-GA-SC', 'AW-WEB-BLOG', 'AW-CONT-ART-SEO']},
  'V39-ECOM-BUSINESS': {base: 'AW-ECOM-BASE', inclus: []},
  // « Tous les éléments de WooCommerce Business … / Blog technique / article SEO »
  'V39-ECOM-VISIBILITE': {base: 'AW-ECOM-BASE', inclus: ['AW-WEB-BLOG', 'AW-CONT-ART-SEO']},
};

export function starterClauseCodes(offer: string): string[] {
  const rule = INHERITS[offer];
  const own = MAPPED[offer] ?? (rule ? MAPPED[rule.base] : []) ?? [];
  const included = rule ? [...(approvedVersionRules(offer, 'VALIDE_RECENT').approvedPack?.includedCodes ?? []), ...rule.inclus] : [];
  return [...new Set([...own, ...included.flatMap(code => MAPPED[code] ?? [])])];
}

type VersionRef = {id: string; status: string};
export type StarterPlan = {
  offers: {code: string; itemId: string; versionId: string; action: 'publier' | 'déjà publiée'}[];
  clauses: {code: string; versionId: string; scope: string; action: 'publier' | 'déjà publiée'}[];
  links: {clause: string; offers: string[]}[];
  excluded: {code: string; raison: string}[];
  blockers: string[]; planSha256: string;
};

function packOfferVersion(db: DatabaseAdapter, code: string): {item_id: string; id: string; status: string} | undefined {
  return db.get("SELECT item_id,id,status FROM catalog_versions WHERE json_extract(provenance_json,'$.sha256')=? AND json_extract(provenance_json,'$.recordKey')=? ORDER BY version_number DESC LIMIT 1",
    [APPROVED_PACK.catalogue.sha256_word, code]);
}
function packClauseVersion(db: DatabaseAdapter, code: string): {clause_id: string; id: string; status: string; scope: string} | undefined {
  return db.get(`SELECT v.clause_id,v.id,v.status,t.scope FROM contract_clause_versions v JOIN contract_clause_templates t ON t.id=v.clause_id
    WHERE json_extract(v.review_metadata_json,'$.provenance.sha256')=? AND (v.code=? COLLATE NOCASE OR (v.code IS NULL AND t.code=? COLLATE NOCASE))
    ORDER BY v.version_number DESC LIMIT 1`, [APPROVED_PACK.library.sha256_word, code, code]);
}

/** Lecture seule : ce qui serait publié et rattaché. */
export function planStarterPublication(db: DatabaseAdapter): StarterPlan {
  const blockers: string[] = [], catalog = new CatalogService(db);
  const offers: StarterPlan['offers'] = [];
  for (const code of STARTER_OFFERS) {
    const v = packOfferVersion(db, code);
    if (!v) { blockers.push(`${code} : version V3.9.4 introuvable (pack non importé ?).`); continue; }
    if (v.status === 'draft') {
      const item = catalog.getItem(v.item_id), version = item.versions.find(x => x.id === v.id)!;
      const review = reviewCatalogPrepublication(item, version);
      if (review.blocking.length) blockers.push(`${code} : ${review.blocking.join(' ; ')}`);
    } else if (v.status !== 'published') blockers.push(`${code} : version V3.9.4 retirée, aucune republication.`);
    offers.push({code, itemId: v.item_id, versionId: v.id, action: v.status === 'draft' ? 'publier' : 'déjà publiée'});
  }
  const library = APPROVED_PACK.library.clauses.map(c => c.code_contractuel);
  const baseCodes = library.filter(code => /^(BASE|PRO|CONS)-/.test(code) && !EXCLUDED_BASE_CLAUSES[code]);
  const linkMap = new Map<string, string[]>();
  for (const offer of STARTER_OFFERS) for (const clause of starterClauseCodes(offer)) linkMap.set(clause, [...(linkMap.get(clause) ?? []), offer]);
  const clauses: StarterPlan['clauses'] = [];
  for (const code of [...baseCodes, ...linkMap.keys()]) {
    const v = packClauseVersion(db, code);
    if (!v) { blockers.push(`Clause ${code} : version V3.9.4 introuvable.`); continue; }
    const expectedScope = /^(BASE|PRO|CONS)-/.test(code) ? 'base' : 'catalog';
    if (v.scope !== expectedScope) blockers.push(`Clause ${code} : portée « ${v.scope} » inattendue.`);
    if (v.status === 'draft') {
      const body = db.get<{body: string}>('SELECT body FROM contract_clause_versions WHERE id=?', [v.id])!.body;
      if (/\[À RENSEIGNER|À COMPLÉTER/i.test(body)) blockers.push(`Clause ${code} : texte encore à compléter, publication refusée.`);
    }
    clauses.push({code, versionId: v.id, scope: v.scope, action: v.status === 'draft' ? 'publier' : 'déjà publiée'});
  }
  const links = [...linkMap.entries()].map(([clause, offerCodes]) => ({clause, offers: offerCodes}));
  const excluded = Object.entries(EXCLUDED_BASE_CLAUSES).map(([code, raison]) => ({code, raison}));
  const planSha256 = createHash('sha256').update(JSON.stringify({offers, clauses, links, excluded, blockers})).digest('hex');
  return {offers, clauses, links, excluded, blockers, planSha256};
}

/**
 * Application par les services existants (chacun dans sa propre transaction). Rejouable :
 * ce qui est déjà publié est ignoré, les rattachements existants sont conservés et complétés.
 */
export function applyStarterPublication(db: DatabaseAdapter, expectedPlanSha256: string) {
  const plan = planStarterPublication(db);
  if (plan.blockers.length) throw Error('Publication bloquée : ' + plan.blockers.join(' ; '));
  if (plan.planSha256 !== expectedPlanSha256) throw Error('Plan de publication périmé : prévisualiser de nouveau.');
  const catalog = new CatalogService(db), terms = new ContractTermsService(db);
  let offersPublished = 0, clausesPublished = 0, linksSet = 0;
  for (const o of plan.offers) if (o.action === 'publier') {
    const version = catalog.getItem(o.itemId).versions.find(v => v.id === o.versionId)!;
    catalog.publishVersion(o.versionId, version); offersPublished++;
  }
  for (const c of plan.clauses) if (c.action === 'publier') { terms.publishVersion(c.versionId); clausesPublished++; }
  const itemOf = new Map(plan.offers.map(o => [o.code, o.itemId]));
  for (const l of plan.links) {
    const clauseId = packClauseVersion(db, l.clause)!.clause_id;
    const existing = db.all<{catalog_item_id: string}>('SELECT catalog_item_id FROM catalog_contract_clause_links WHERE clause_id=? ORDER BY sort_order', [clauseId]).map(r => r.catalog_item_id);
    const wanted = [...new Set([...existing, ...l.offers.map(code => itemOf.get(code)!)])];
    if (wanted.length !== existing.length) { terms.setCatalogLinks(clauseId, wanted); linksSet++; }
  }
  return {offersPublished, clausesPublished, linksSet, excluded: plan.excluded.map(e => e.code), planSha256: plan.planSha256};
}
