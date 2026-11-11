'use strict';
// Lot 3 du référentiel interne : les 121 clauses contractuelles en texte intégral, classées par famille, et la matrice offres / clauses.
//   node scripts/referentiel/model-lot3.cjs --data <dataset.json> --out <modele-lot3.json>
const fs = require('node:fs');
const {cleanName, groupByFamily, NB} = require('./common.cjs');
const arg = k => { const i = process.argv.indexOf(k); return i < 0 ? null : process.argv[i + 1]; };
const data = JSON.parse(fs.readFileSync(arg('--data'), 'utf8'));
const families = groupByFamily(data.offres);
const famOf = new Map(); for (const f of families) for (const o of f.offres) famOf.set(o.code, f);
const clauseByCode = new Map(data.clauses.map(c => [c.code, c]));
const users = new Map(); // code clause -> offres
for (const o of data.offres) for (const c of o.clauses) (users.get(c.code) ?? users.set(c.code, []).get(c.code)).push(o);

const dash = s => String(s).replace(/ [—–] /g, ', ');
const paragraphs = body => String(body).split(/\n\s*\n/).map(x => dash(x.replace(/\s+/g, ' ').trim())).filter(Boolean);

// ---------- sections : socle, publics, facultatives, puis familles
const SECTIONS = [
  {title: 'Socle commun à tous les devis', lead: 'Ces 13 clauses sont jointes à chaque devis, quelle que soit l’offre.', pick: c => c.scope === 'base' && c.audience === 'all'},
  {title: 'Clauses propres aux clients particuliers', lead: 'Information précontractuelle, rétractation, début anticipé et médiation : elles s’ajoutent au socle quand le client est un consommateur. La convention d’adhésion au médiateur (CM2C) doit être conclue avant tout devis à un particulier.', pick: c => /^CONS-/.test(c.code)},
  {title: 'Clauses propres aux clients professionnels', lead: 'Paiement, retard et litiges : elles s’ajoutent au socle quand le client est un professionnel.', pick: c => /^PRO-/.test(c.code)},
  {title: 'Clauses facultatives ou en réserve', lead: 'Elles ne sont attachées à aucune offre : l’une est proposée au client à part, l’autre est conservée pour un service qui n’est pas au catalogue.', pick: c => ['BASE-REFERENCES-AGENCE', 'LANDING-GESTION'].includes(c.code)},
  {title: 'Sites vitrines et options', lead: 'Clauses du site vitrine, de ses options, du blog et des newsletters.', pick: c => /^(WEB|BLOG)-/.test(c.code)},
  {title: 'Boutiques WooCommerce', lead: 'Catalogue, paiement, livraison, stock et obligations du commerçant.', pick: c => /^ECOM-/.test(c.code)},
  {title: 'Landing pages', lead: 'Périmètre et formulaire d’une landing page.', pick: c => /^LANDING-/.test(c.code) && c.code !== 'LANDING-GESTION'},
  {title: 'Maintenance, hébergement et interventions techniques', lead: 'Maintenance mensuelle et annuelle, hébergement isolé, migrations, packs d’heures, audit et reprise.', pick: c => /^(MAINT|TECH|SERVICE|REPRISE|AUDIT)-/.test(c.code)},
  {title: 'Contenu et rédaction', lead: 'Brief, corrections, droits et recherche pour les rédactions.', pick: c => /^CONTENT-/.test(c.code)},
  {title: 'Identité visuelle et marque', lead: 'Propositions, corrections, droits et ressources de tiers pour le logo, la charte et les supports.', pick: c => /^(BRAND|DESIGN)-/.test(c.code)},
  {title: 'Photographie et retouche', lead: 'Séances, retouches, livrables, droits d’utilisation et report.', pick: c => /^PHOTO-/.test(c.code)},
  {title: 'Référencement (SEO) et Google Business Profile', lead: 'Accès, délais, moyens et limites des prestations de référencement.', pick: c => /^SEO-/.test(c.code)},
  {title: 'Statistiques et mesure d’audience', lead: 'Accès, consentement, mesure, suivi et tableaux de bord.', pick: c => /^DATA-/.test(c.code)},
  {title: 'Développement WordPress et applications', lead: 'Cadrage, prototype, recette, garantie, propriété intellectuelle et maintenance applicative.', pick: c => /^(APP|DEVWP)-/.test(c.code)},
  {title: 'Sites de mariage', lead: 'Durée de mise en ligne, contenus, RSVP, galerie privée et renouvellement. Clauses destinées aux particuliers.', pick: c => /^MARIAGE-/.test(c.code)},
];

function appliesTo(c) {
  if (c.scope === 'base' && c.audience === 'all') return 'Tous les devis.';
  if (c.audience === 'consumer' && c.scope === 'base') return 'Tout devis à un client particulier (consommateur).';
  if (c.audience === 'professional') return 'Tout devis à un client professionnel.';
  if (c.code === 'BASE-REFERENCES-AGENCE') return 'Proposée au client à la livraison, jamais précochée, distincte de tout devis.';
  if (c.code === 'LANDING-GESTION') return 'Aucune offre actuelle (clause en réserve).';
  const us = users.get(c.code) ?? [];
  if (!us.length) return 'Aucune offre.';
  const byFam = new Map(); for (const o of us) byFam.set(famOf.get(o.code).name, (byFam.get(famOf.get(o.code).name) || 0) + 1);
  const fams = [...byFam].map(([n, k]) => `${n} (${k})`).join(', ');
  const head = `${us.length} offre${us.length > 1 ? 's' : ''}`;
  if (us.length <= 6) return `${head} : ${us.map(o => cleanName(o.name)).join(', ')}.`;
  return `${head}. ${fams}.`;
}

const blocks = [];
blocks.push({t: 'cover', tagline: 'Création de sites web à Dijon', title: 'Référentiel interne V1', subtitle: 'Lot 3 : contrats et clauses', date: '11 novembre 2026',
  stats: [{n: data.clauses.length, label: 'clauses contractuelles'}, {n: SECTIONS.length, label: 'sections'}, {n: data.offres.length, label: 'offres reliées'}],
  note: 'Le texte intégral de chaque clause, classé par famille métier, avec les offres auxquelles elle s’applique, puis la matrice qui relie chaque offre à ses clauses.'});
blocks.push({t: 'toc', title: 'Sommaire'});
blocks.push({t: 'h1', text: 'Comment lire ce lot'});
blocks.push({t: 'bullets', items: [
  'Le texte de chaque clause est celui publié dans le Manager : il fait foi. Ce document ne reformule rien.',
  'Trois niveaux : le socle commun (joint à tous les devis), les clauses propres au public (particulier ou professionnel), puis les clauses de catalogue, attachées aux offres.',
  'Sous chaque titre, la ligne « Code » donne l’identifiant de la clause dans le Manager et la ligne « S’applique à » dit à quels devis ou à quelles offres elle se rattache.',
  'La matrice en fin de document donne, pour chaque offre, la liste de ses clauses de catalogue. Le socle s’y ajoute toujours.',
  'Ce document n’est pas un avis juridique : la portée exacte de chaque clause dépend du devis, du public et du parcours de vente.']});

for (const s of SECTIONS) {
  const list = data.clauses.filter(s.pick);
  blocks.push({t: 'pagebreak'});
  blocks.push({t: 'h1', text: s.title});
  blocks.push({t: 'lead', text: `${list.length} clause${list.length > 1 ? 's' : ''}. ${s.lead}`});
  for (const c of list) {
    blocks.push({t: 'h3', text: dash(c.title)});
    blocks.push({t: 'small', text: `Code : ${c.code}${NB}·${NB}S’applique à : ${appliesTo(c)}`});
    for (const p of paragraphs(c.body)) blocks.push({t: 'p', text: p});
  }
}
const placed = new Set(SECTIONS.flatMap(s => data.clauses.filter(s.pick).map(c => c.code)));
const missing = data.clauses.filter(c => !placed.has(c.code));
if (missing.length) throw Error('Clauses sans section : ' + missing.map(c => c.code).join(', '));
const dup = SECTIONS.flatMap(s => data.clauses.filter(s.pick).map(c => c.code)).filter((c, i, a) => a.indexOf(c) !== i);
if (dup.length) throw Error('Clauses en double : ' + dup.join(', '));

// ---------- matrice offres / clauses
blocks.push({t: 'pagebreak'});
blocks.push({t: 'h1', text: 'Matrice offres et clauses'});
blocks.push({t: 'lead', text: 'Pour chaque offre, ses clauses de catalogue. Le socle commun et, selon le public, les clauses particuliers ou professionnels s’ajoutent toujours.'});
for (const f of families) {
  blocks.push({t: 'h2', text: f.name});
  blocks.push({t: 'table', cols: [{h: 'Offre', w: 30}, {h: 'Clauses de catalogue', w: 70}],
    rows: f.offres.map(o => [cleanName(o.name) + '\n' + o.code, o.clauses.map(c => dash(clauseByCode.get(c.code)?.title ?? c.title)).join(' · ') || ' '])});
}

const model = {header: 'AtoumWeb  ·  Référentiel interne V1  ·  Contrats et clauses', footer: 'Document interne : ne pas diffuser', blocks};
fs.writeFileSync(arg('--out'), JSON.stringify(model, null, 1));
console.log(JSON.stringify({blocs: blocks.length, sections: SECTIONS.map(s => [s.title, data.clauses.filter(s.pick).length]), clauses: data.clauses.length}));
