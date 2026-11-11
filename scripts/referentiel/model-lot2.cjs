'use strict';
// Lot 2 du référentiel interne : fiches de vente (10 offres vedettes en pleine page, les autres en fiches compactes).
//   node scripts/referentiel/model-lot2.cjs --data <dataset.json> --out <modele-lot2.json> [--sans-etapes <liste.md>]
const fs = require('node:fs');
const {cleanName, groupByFamily, fmtPrice, fmtTime, joinList, cleanList, NB} = require('./common.cjs');
const {stepsFor} = require('./etapes.cjs');
const arg = k => { const i = process.argv.indexOf(k); return i < 0 ? null : process.argv[i + 1]; };
const data = JSON.parse(fs.readFileSync(arg('--data'), 'utf8'));
const families = groupByFamily(data.offres);

const VEDETTES = ['AW-WEB-VITRINE', 'V39-WEB-BUSINESS', 'V39-WEB-VISIBILITE', 'AW-ECOM-BASE', 'V39-ECOM-BUSINESS', 'V39-ECOM-VISIBILITE', 'AW-MAINT-WP-M', 'AW-MAINT-WP-A', 'AW-CONT-PAGE', 'AW-WEB-PAGE-SUP'];
const GENERIC_DEVIS = 'Dès que le besoin dépasse les inclusions ou relève des exclusions.';
const ASSURE = /Ne jamais présenter AtoumWeb comme assuré sans souscription effective\.?/;

const NOTES = {
  vitrines: 'Avant d’ajouter une option, relire les inclusions de la formule : page rédigée, avis Google, newsletter, GA4 et Search Console sont déjà compris dans certaines formules. Aucune formule ne comprend la maintenance, à proposer à la livraison.',
  boutiques: 'Le commerçant gère lui-même ses commandes, ses stocks et ses remboursements. Les ajouts de produits après livraison ne font pas partie de la maintenance technique. Paiements et livraisons standards sont testés avant la mise en ligne.',
  landing: 'Une landing page part de contenus fournis par le client ; la rédaction complète est à part. Au-delà de 6 sections ou pour une fonction complexe : devis.',
  maintenance: 'La maintenance comprend l’hébergement et démarre à l’issue des 30 jours de garantie. L’hébergement isolé sur Lune dédiée n’est pas une maintenance. Le domaine reste distinct et ne se renouvelle que sur accord exprès.',
  techniques: 'Toujours annoncer le diagnostic avant de chiffrer la suite, et demander une sauvegarde ou des accès avant d’intervenir. Un pack d’heures couvre le temps de prestation seulement : valable 24 mois plus 3 mois de prolongation, décompte par quarts d’heure.',
  contenu: 'Ne jamais facturer deux fois une intégration déjà incluse dans une offre. Chaque rédaction comprend un cycle de corrections ; la recherche experte ou réglementée est hors périmètre.',
  identite: 'Faire valider la direction avant de décliner. Les droits d’exploitation sont accordés après paiement intégral. Fichiers natifs éditables et charte complète exclus sauf mention contraire ; polices et images de tiers restent sous leur licence.',
  photo: 'Pour la retouche, la qualité du résultat dépend du fichier d’origine ; livraison en JPEG ou PNG, sans fichiers de travail. Les séances se font dans Dijon Métropole, hors zone sur devis. Droits d’utilisation précisés au devis.',
  seo: 'Aucun résultat garanti : ni classement, ni trafic, ni contacts, ni ventes. Comptes Google au nom du client avec accès délégués. Les rapports ne comprennent aucune correction.',
  statistiques: 'La mesure dépend du consentement aux cookies. Les comptes Google restent au nom du client. Un abonnement démarre à la prise en charge effective, confirmée par écrit.',
  newsletters: 'Aucun envoi sans bon à tirer écrit. Le client garantit l’origine licite de ses contacts. Brevo et les frais de plateforme sont au nom du client.',
  developpement: 'Ne jamais chiffrer un développement sur une description orale : cadrage d’abord, premier outil (MVP) puis évolutions. Pour une maintenance applicative, chaque renouvellement annuel demande l’accord exprès du client.',
  mariage: 'Aucune donnée sensible dans le RSVP. Le domaine standard est au nom des mariés et compris pendant la période incluse. Renouvellement à 59 € par an avec information légale du client.',
};

const GLOBAL_RULES = [
  'Ne jamais présenter AtoumWeb comme assuré : la responsabilité civile professionnelle n’est pas souscrite.',
  'Aucune promesse de résultat (classement, trafic, ventes) ni de délai garanti.',
  'Le temps de référence est un repère interne, jamais un délai promis au client.',
  'Ne jamais facturer deux fois ce qui est déjà inclus : relire les inclusions avant d’ajouter une option.',
  'Tout travail hors périmètre est chiffré et accepté par écrit avant d’être réalisé.',
  'Un client particulier : la convention d’adhésion au médiateur (CM2C) doit être conclue avant tout devis.',
  'Le silence du client ne vaut jamais acceptation : devis, maquette, bon à tirer et livraison se valident par écrit.',
];

// ---------- utilitaires de texte
const lines = s => String(s ?? '').split(/\n+/).map(x => x.trim()).filter(Boolean);
const dash = s => String(s).replace(/ [—–] /g, ', ');
const clean = s => dash(String(s).replace(/\s+/g, ' ').trim());
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const bullets = a => a.map(x => '• ' + x).join('\n');
const numbered = a => a.map((x, i) => `${i + 1}. ${x}`).join('\n');
function objections(s) {
  const t = String(s ?? '').replace(/\s*\/\/\s*/g, '\n').replace(/\n+/g, '\n');
  return t.split(/\n|(?<=[.!?)]) (?=« )/).map(x => clean(x)).filter(Boolean);
}
function cautions(s) {
  return lines(s).map(clean).filter(x => !/^Hors périmètre/i.test(x) && !ASSURE.test(x) && x.length > 3);
}

// ---------- éléments par offre
const items = new Map();
for (const f of families) for (const o of f.offres) {
  const a = o.aide || {};
  items.set(o.code, {
    o, fam: f,
    need: clean(a.clientNeed || ''),
    pitch: clean(a.salesPitch || ''),
    situations: clean(a.relevantSituations || ''),
    benefits: lines(a.benefits).map(x => clean(x.replace(/^[•\-]\s*/, ''))),
    questions: lines(a.qualificationQuestions).map(clean),
    objs: objections(a.objections),
    cautions: cautions(a.commercialCautions),
    devis: clean(a.quoteRequiredWhen || ''),
    advice: clean(String(o.conseil || '').replace(ASSURE, '')),
    steps: stepsFor(o),
  });
}

// lignes présentes dans au moins 3 offres d'une famille : montées au niveau de la famille
function common(f, pick) {
  const count = new Map();
  for (const o of f.offres) for (const x of new Set(pick(items.get(o.code)))) count.set(x, (count.get(x) || 0) + 1);
  return new Set([...count].filter(([, n]) => n >= 3).map(([x]) => x));
}

const blocks = [];
const sansEtapes = [];
const sheetFor = (it, big, compact) => {
  const {o} = it, fam = it.fam;
  const rows = [];
  if (it.need) rows.push(['Besoin du client', it.need]);
  if (big && it.situations) rows.push(['Situations', it.situations]);
  if (it.pitch) rows.push(['À dire', it.pitch]);
  if (big && it.benefits.length) rows.push(['Ce que le client obtient', bullets(it.benefits)]);
  if (big) {
    rows.push(['Compris', bullets(cleanList(o.inclusions))]);
    if (cleanList(o.exclusions).length) rows.push(['Non compris', bullets(cleanList(o.exclusions))]);
  }
  const qs = it.questions.filter(x => !fam.cq.has(x)), ob = it.objs.filter(x => !fam.co.has(x)), ca = it.cautions.filter(x => !fam.cc.has(x));
  if (qs.length) rows.push(['Questions à poser', bullets(big ? qs : qs.slice(0, 3))]);
  if (ob.length) rows.push(['Objections', bullets(big ? ob : ob.slice(0, 2))]);
  if (ca.length) rows.push(['Vigilance', bullets(big ? ca : ca.slice(0, 3))]);
  if (it.devis && it.devis !== GENERIC_DEVIS) rows.push(['Devis si', it.devis]);
  if (big && it.advice) rows.push(['Conseil interne', it.advice]);
  // étapes
  const st = it.steps;
  if (big || !st.shared) {
    rows.push(['Étapes à faire', numbered(st.steps)]);
    rows.push(['', st.source, 'note']);
  } else {
    rows.push(['Étapes à faire', `Voir les étapes types « ${st.label} » en début de famille.`, 'note']);
  }
  if (big && o.clauses.length) rows.push(['Clauses liées', o.clauses.map(c => clean(c.title)).join(' · ')]);
  return {t: 'sheet', name: cleanName(o.name), right: `${fmtPrice(o)}${NB}·${NB}${fmtTime(o)}${NB}·${NB}${o.code}`, rows, big, keep: !big};
};

for (const f of families) {
  f.cq = common(f, i => i.questions); f.co = common(f, i => i.objs); f.cc = common(f, i => i.cautions);
  // ensembles d'étapes partagés (même contenu pour au moins 2 offres de la famille)
  const bySet = new Map();
  for (const o of f.offres) { const st = items.get(o.code).steps; const k = st.steps.join('|'); (bySet.get(k) ?? bySet.set(k, []).get(k)).push(o.code); }
  for (const o of f.offres) {
    const st = items.get(o.code).steps; const users = bySet.get(st.steps.join('|'));
    st.shared = users.length >= 2 && !VEDETTES.includes(o.code) ? true : false;
    st.label = st.label || '';
  }
}

// étiquettes des ensembles partagés : nom de la première offre qui l'utilise
const LABELS = [
  [/^AW-WEB-|^V39-WEB-|^AW-ECOM-|^V39-ECOM-/, 'Option ajoutée à un site'], [/^AW-LP-/, 'Landing page'], [/^AW-TECH-PACK/, 'Pack d’heures'], [/^AW-TECH-/, 'Intervention technique'],
  [/^AW-CONT-/, 'Rédaction et contenu'], [/^(AW-BRAND-|V39-BRAND-)/, 'Identité visuelle'], [/^AW-PHOTO-SHOOT/, 'Séance photo'], [/^AW-PHOTO-/, 'Retouche photo'],
  [/^(AW-SEO-(ESSENTIEL|AVANCE|PREMIUM|AUDIT))/, 'Audit et packs SEO'], [/^(V39-GBP-ESS-|AW-SEO-GBP-)/, 'Abonnement Google Business Profile'], [/^AW-SEO-/, 'Prestation SEO'],
  [/^V39-STAT-|^AW-DATA-SUIVI-/, 'Suivi statistiques en abonnement'], [/^AW-DATA-/, 'Mesure d’audience'], [/^V39-NL-/, 'Newsletter'], [/^(AW-DEVWP-|AW-APP-)/, 'Développement'], [/^AW-MARIAGE-/, 'Site de mariage'],
];
const labelOf = code => (LABELS.find(([re]) => re.test(code)) || [null, 'Prestation'])[1];

// ---------- page d'introduction
blocks.push({t: 'cover', tagline: 'Création de sites web à Dijon', title: 'Référentiel interne V1', subtitle: 'Lot 2 : fiches de vente et étapes à faire', date: '11 novembre 2026',
  stats: [{n: data.offres.length, label: 'fiches de vente'}, {n: VEDETTES.length, label: 'fiches détaillées'}, {n: families.length, label: 'familles métier'}],
  note: 'Une fiche par offre : à dire au client, questions à poser, objections, points de vigilance et étapes à faire. Les dix offres les plus vendues ont une page entière.'});
blocks.push({t: 'toc', title: 'Sommaire'});
blocks.push({t: 'h1', text: 'Comment utiliser une fiche'});
blocks.push({t: 'bullets', items: [
  '« À dire » : l’argument à reprendre pour présenter l’offre, avec le prix.',
  '« Questions à poser », « Objections » et « Vigilance » : ce qui est propre à l’offre. Ce qui revient dans plusieurs offres d’une même famille est regroupé au début de la famille.',
  '« Étapes à faire » : la marche à suivre, de la commande au suivi. Sous chaque liste figure sa provenance : « Source » quand elle vient du Manuel métier et du référentiel V1.5, « Proposé, à valider » quand aucune procédure n’existait.',
  'L’en-tête de chaque fiche rappelle le prix, le temps de référence (repère interne) et le code du Catalogue.',
  'Les clauses complètes de chaque offre sont dans le lot 3 ; les fiches détaillées en rappellent les titres.']});
blocks.push({t: 'h2', text: 'Rappels valables pour toutes les fiches'});
blocks.push({t: 'cards', items: [{title: 'À ne jamais oublier', text: GLOBAL_RULES.map(x => '• ' + x).join('\n')}]});

// ---------- familles
for (const f of families) {
  if (f !== families[0]) blocks.push({t: 'pagebreak'});
  blocks.push({t: 'h1', text: f.name});
  blocks.push({t: 'lead', text: `${f.offres.length} fiche${f.offres.length > 1 ? 's' : ''}. ${NOTES[f.id]}`});
  const cards = [];
  if (f.cq.size) cards.push({title: 'Questions à poser pour toute offre de la famille', text: bullets([...f.cq])});
  if (f.co.size) cards.push({title: 'Objections fréquentes', text: bullets([...f.co])});
  if (f.cc.size) cards.push({title: 'Points de vigilance communs', text: bullets([...f.cc])});
  // étapes types partagées
  const shown = new Set();
  for (const o of f.offres) {
    const st = items.get(o.code).steps;
    if (!st.shared || shown.has(st.steps.join('|'))) continue;
    shown.add(st.steps.join('|'));
    const users = f.offres.filter(x => items.get(x.code).steps.steps.join('|') === st.steps.join('|'));
    const label = users.every(u => /^AW-TECH-PACK/.test(u.code)) ? 'Pack d’heures' : labelOf(o.code);
    for (const u of users) items.get(u.code).steps.label = label;
    cards.push({title: `Étapes types : ${label}`, text: numbered(st.steps) + '\n' + st.source});
  }
  if (cards.length) blocks.push({t: 'cards', items: cards});
  for (const o of f.offres) {
    const it = items.get(o.code);
    const big = VEDETTES.includes(o.code);
    if (big) blocks.push({t: 'pagebreak'});
    blocks.push(sheetFor(it, big));
    if (it.steps.source.startsWith('Proposé')) sansEtapes.push({fam: f.name, code: o.code, name: cleanName(o.name), prix: fmtPrice(o)});
    else if (it.steps.source.startsWith('Base')) sansEtapes.push({fam: f.name, code: o.code, name: cleanName(o.name), prix: fmtPrice(o), partiel: true});
  }
}

const model = {header: 'AtoumWeb  ·  Référentiel interne V1  ·  Fiches de vente', footer: 'Document interne : ne pas diffuser', blocks};
fs.writeFileSync(arg('--out'), JSON.stringify(model, null, 1));

if (arg('--sans-etapes')) {
  const tot = sansEtapes.filter(x => !x.partiel), part = sansEtapes.filter(x => x.partiel);
  const byFam = l => [...new Set(l.map(x => x.fam))].map(fam => `### ${fam}\n` + l.filter(x => x.fam === fam).map(x => `- ${x.name} (${x.code}, ${x.prix})`).join('\n')).join('\n\n');
  fs.writeFileSync(arg('--sans-etapes'), `# Offres sans étapes dans le référentiel\n\nGénéré le ${new Date().toISOString().slice(0, 10)}.\n\n## 1. Aucune procédure dans le Manuel ni le référentiel V1.5 : étapes entièrement proposées (${tot.length} offres)\n\n${byFam(tot)}\n\n## 2. Procédure partielle : étapes de réalisation proposées (${part.length} offres)\n\n${byFam(part)}\n`);
}
console.log(JSON.stringify({blocs: blocks.length, vedettes: VEDETTES.length, procedureAbsente: sansEtapes.filter(x => !x.partiel).length, procedurePartielle: sansEtapes.filter(x => x.partiel).length}));
