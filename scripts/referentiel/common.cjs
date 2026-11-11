'use strict';
// Fonctions communes aux lots du référentiel interne : familles métier, prix, temps, nettoyage des textes.
const NB = ' ';

/** 13 familles métier, dans l'ordre de vente. `premiers` : les formules principales, affichées en tête. */
const FAMILIES = [
  {id: 'vitrines', name: 'Sites vitrines et options', test: c => /^(AW-WEB-|V39-WEB-)/.test(c), premiers: ['AW-WEB-VITRINE', 'V39-WEB-BUSINESS', 'V39-WEB-VISIBILITE']},
  {id: 'boutiques', name: 'Boutiques WooCommerce et options', test: c => /^(AW-ECOM-|V39-ECOM-)/.test(c), premiers: ['AW-ECOM-BASE', 'V39-ECOM-BUSINESS', 'V39-ECOM-VISIBILITE']},
  {id: 'landing', name: 'Landing pages', test: c => /^AW-LP-/.test(c), premiers: ['AW-LP-BASE']},
  {id: 'maintenance', name: 'Maintenance, hébergement et domaines', test: c => /^(AW-MAINT-|V39-HOST-)/.test(c), premiers: ['AW-MAINT-WP-M', 'AW-MAINT-WP-A', 'AW-MAINT-WC-M', 'AW-MAINT-WC-A', 'V39-HOST-LUNE', 'V39-HOST-DOMAINE']},
  {id: 'techniques', name: 'Interventions techniques et packs d’heures', test: c => /^AW-TECH-/.test(c), premiers: ['AW-TECH-DEPANNAGE', 'AW-TECH-PACK-3H', 'AW-TECH-PACK-5H', 'AW-TECH-PACK-10H']},
  {id: 'contenu', name: 'Contenu et rédaction', test: c => /^AW-CONT-/.test(c), premiers: ['AW-CONT-PAGE', 'AW-CONT-ART-ESS', 'AW-CONT-ART-SEO', 'AW-CONT-PACK4-SEO']},
  {id: 'identite', name: 'Identité visuelle et marque', test: c => /^(AW-BRAND-|V39-BRAND-)/.test(c), premiers: ['AW-BRAND-LOGO', 'V39-BRAND-CHARTE', 'V39-BRAND-DUO']},
  {id: 'photo', name: 'Photographie et retouche', test: c => /^AW-PHOTO-/.test(c), premiers: ['AW-PHOTO-SHOOT-ESS', 'AW-PHOTO-SHOOT-ACT']},
  {id: 'seo', name: 'Référencement (SEO) et Google Business Profile', test: c => /^(AW-SEO-|V39-GBP-)/.test(c), premiers: ['AW-SEO-LOCAL', 'AW-SEO-ESSENTIEL', 'AW-SEO-AVANCE', 'AW-SEO-PREMIUM']},
  {id: 'statistiques', name: 'Statistiques et mesure d’audience', test: c => /^(AW-DATA-|V39-STAT-)/.test(c), premiers: ['AW-DATA-GA-SC']},
  {id: 'newsletters', name: 'Newsletters', test: c => /^V39-NL-/.test(c), premiers: ['V39-NL-PONCT-SIMPLE', 'V39-NL-PONCT-COMPLETE']},
  {id: 'developpement', name: 'Développement WordPress et applications', test: c => /^(AW-DEVWP-|AW-APP-)/.test(c), premiers: ['AW-DEVWP-AJUST', 'AW-APP-CADRAGE']},
  {id: 'mariage', name: 'Sites de mariage', test: c => /^AW-MARIAGE-/.test(c), premiers: ['AW-MARIAGE-ESS', 'AW-MARIAGE-GRAND', 'AW-MARIAGE-HISTOIRE']},
];

function groupByFamily(offres) {
  const out = FAMILIES.map(f => ({...f, offres: []}));
  for (const o of offres) {
    const f = out.find(x => x.test(o.code));
    if (!f) throw Error('Offre sans famille : ' + o.code);
    f.offres.push(o);
  }
  const key = o => o.priceMode === 'quote_only' ? 1e12 : (o.priceCents ?? 1e12);
  for (const f of out) f.offres.sort((a, b) => {
    const ia = f.premiers.indexOf(a.code), ib = f.premiers.indexOf(b.code);
    if (ia >= 0 || ib >= 0) return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    return key(a) - key(b) || a.name.localeCompare(b.name, 'fr');
  });
  return out;
}

const eur = c => (c / 100).toLocaleString('fr-FR', {minimumFractionDigits: c % 100 ? 2 : 0, maximumFractionDigits: 2}).replace(/[  ]/g, NB) + NB + '€';
const SUFFIX = {photo: '/photo', page: '/page', langue: '/langue', article: '/article', produit: '/produit', section: '/section', 'séance': '/séance', 'établissement': '/établissement'};

function fmtPrice(o) {
  if (o.priceMode === 'quote_only' || o.priceCents == null) return 'Sur devis';
  const p = eur(o.priceCents);
  if (o.priceMode === 'starting_from') return 'dès' + NB + p;
  if (o.priceMode === 'monthly') return p + '/mois';
  if (o.priceMode === 'yearly') return p + '/an';
  if (o.code === 'AW-PHOTO-DETOUR') return p + '/photo (minimum 45' + NB + '€)';
  if (/PACK/.test(o.code)) return p;
  return p + (SUFFIX[o.unit] ?? '');
}

function fmtMinutes(min) {
  const h = Math.floor(min / 60), m = min % 60;
  return h === 0 ? `${m} min` : m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')}`;
}
function fmtTime(o) {
  if (o.minutes == null) return '—';
  const period = o.periodicity === 'mensuelle' ? ' par mois' : o.periodicity === 'annuelle' ? ' par an' : '';
  return fmtMinutes(o.minutes) + period;
}

/** Nettoie une liste d'inclusions : majuscule, apostrophe typographique, plus de points doublés. */
function cleanItem(s) {
  let t = String(s).replace(/\s+/g, ' ').replace(/ [—–] /g, ', ').trim().replace(/\.+$/, '').replace(/'/g, '’');
  if (!t) return '';
  return t.charAt(0).toUpperCase() + t.slice(1);
}
const cleanList = a => (Array.isArray(a) ? a : []).map(cleanItem).filter(Boolean);
const joinList = (a, sep = ' · ') => cleanList(a).join(sep);

module.exports = {FAMILIES, groupByFamily, fmtPrice, fmtTime, fmtMinutes, cleanItem, cleanList, joinList, eur, NB};
