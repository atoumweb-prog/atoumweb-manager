'use strict';
// Lot 1 du référentiel interne : couverture, sommaire, règles clés, glossaire et grille tarifaire (125 offres).
//   node scripts/referentiel/model-lot1.cjs --data <dataset.json> --out <modele-lot1.json>
const fs = require('node:fs');
const {cleanName, groupByFamily, fmtPrice, fmtTime, joinList, cleanList} = require('./common.cjs');
const arg = k => { const i = process.argv.indexOf(k); return i < 0 ? null : process.argv[i + 1]; };
const data = JSON.parse(fs.readFileSync(arg('--data'), 'utf8'));
const families = groupByFamily(data.offres);
const total = families.reduce((n, f) => n + f.offres.length, 0);
if (total !== data.offres.length) throw Error('Familles incomplètes');

// ---------- règles clés : décisions de Carlos (08/11 et 11/11/2026) et référentiel V1.5
const regles = [
  {title: 'Paiement d’une création', text: 'Site vitrine : 40 % à la commande, 60 % avant la mise en ligne. Boutique WooCommerce : 30 % à la commande, 40 % à la validation du design, 30 % avant la mise en ligne. Une prestation ponctuelle de 300 € ou moins se paie en totalité à la commande. Dans un devis qui mêle création et abonnement, l’échéancier ne porte que sur la création : chaque abonnement a sa propre échéance.'},
  {title: 'Abonnements', text: 'Un abonnement annuel est payable d’avance, au début de chaque période. L’annuel équivaut à 11 mois payés pour 12. Un abonnement mensuel est échu le 5 ou le 15 du mois, au choix du client. Renouvellement : la maintenance, le domaine et le forfait Site vitrine 5 pages ne se renouvellent que sur accord exprès, sans reconduction tacite. Le suivi statistique, les newsletters annuelles, l’hébergement isolé et les sites de mariage peuvent se reconduire automatiquement, avec information du client et possibilité de s’y opposer avant l’échéance : le devis le précise.'},
  {title: 'Livraison, garantie et maintenance', text: 'La livraison officielle est constatée par écrit (signature ou e-mail explicite) et sa date est conservée. Elle déclenche la garantie corrective de 30 jours, qui est aussi la période de test. La maintenance commence à l’issue de ces 30 jours et ne se confond pas avec la garantie.'},
  {title: 'Ne pas facturer deux fois', text: 'Vérifier les inclusions avant d’ajouter une option. Vitrine Business comprend 3 pages rédigées : cinq pages de rédaction en supplément font 8 pages au total. La newsletter standard est incluse dans WooCommerce Business et Visibilité. L’intégration WordPress et les trois images peuvent compter comme l’une des petites interventions mensuelles de la maintenance, jamais en plus.'},
  {title: 'Maintenance', text: 'WordPress : 2 interventions mineures de 30 minutes par mois ; WooCommerce : 4. Elles ne se cumulent pas et ne se reportent pas. Sauvegardes hebdomadaires (WordPress) ou quotidiennes (WooCommerce), conservées 30 jours. Priorité aux incidents en semaine de 9 h à 17 h, sans délai garanti, sans astreinte.'},
  {title: 'Hébergement et domaine', text: 'La première année d’hébergement est comprise dans une création de site. Ensuite : la maintenance (qui comprend l’hébergement) ou l’hébergement isolé avec Lune dédiée à 149 € par an, sans maintenance. Le domaine reste distinct : 29 € par an de gestion, plus les frais du bureau d’enregistrement, renouvelé seulement sur accord exprès. Ne jamais facturer deux fois la même période.'},
  {title: 'Réclamations', text: 'Première réponse visée sous 2 jours ouvrés, sans garantie de délai. Ce n’est ni un délai de résolution ni une astreinte.'},
  {title: 'Médiation et assurance', text: 'Le médiateur choisi est le CM2C, mais la convention d’adhésion doit être conclue avant tout devis à un particulier. La responsabilité civile professionnelle n’est pas souscrite : ne jamais présenter AtoumWeb comme assuré.'},
  {title: 'Temps de référence', text: 'Ce sont des repères de travail internes, pas des délais promis au client. Ils servent à comparer le temps réellement passé (chronomètre du Manager) au temps prévu, pour ajuster les offres. Pour un abonnement, le temps se rapporte à sa période. Le taux horaire d’une offre se calcule en divisant son prix par ce temps, avant charges et frais.'},
  {title: 'Données personnelles', text: 'L’accord de protection des données est distinct du devis, propre à chaque site et signé avant la première opération sur des données personnelles. Le modèle peut être remis en lecture avec le devis. Les accès restent sous le contrôle du client et sont retirés à la fin du service.'},
];

// ---------- glossaire (BASE-DEFINITIONS + termes internes)
const defs = (data.clauses.find(c => c.code === 'BASE-DEFINITIONS')?.body ?? '').split(/\n\s*\n/)
  .map(p => p.trim()).filter(p => /^[^:]{2,40} : /.test(p)).map(p => { const i = p.indexOf(' : '); const d = p.slice(i + 3).replace(/\s+/g, ' '); return [p.slice(0, i), d.charAt(0).toUpperCase() + d.slice(1)]; });
const internes = [
  ['Offre', 'Formule vendue avec un prix et un périmètre (par exemple Vitrine Business).'],
  ['Service ou option', 'Prestation vendue seule ou ajoutée à une offre (par exemple une page supplémentaire).'],
  ['Temps de référence', 'Temps de travail estimé pour réaliser l’offre. Pour un abonnement, temps par mois ou par an. Repère interne uniquement.'],
  ['Sur devis', 'Offre sans prix fixe : le prix est chiffré après un échange sur le besoin.'],
  ['Dès', 'Prix de départ : le prix final dépend du périmètre confirmé au devis.'],
  ['Période annuelle', 'Douze mois de service payés d’avance, au début de la période.'],
  ['Pack d’heures', 'Volume d’heures décompté par quarts d’heure, valable 24 mois plus 3 mois de prolongation automatique.'],
];

// ---------- grille
const grille = families.flatMap(f => [
  {t: 'h2', text: f.name},
  {t: 'small', text: `${f.offres.length} offre${f.offres.length > 1 ? 's' : ''}`},
  {t: 'table',
    cols: [{h: 'Offre', w: 24}, {h: 'Prix', w: 11, align: 'right', bold: true}, {h: 'Temps de référence', w: 11}, {h: 'Compris', w: 34}, {h: 'Non compris', w: 20}],
    rows: f.offres.map(o => {
      const quote = o.priceMode === 'quote_only';
      const comp = quote && /défini au devis|selon/i.test(joinList(o.inclusions)) ? 'Défini au devis' : joinList(o.inclusions);
      return [cleanName(o.name) + '\n' + o.code, fmtPrice(o), fmtTime(o), comp || 'À préciser au devis', joinList(o.exclusions) || ' '];
    })},
]);

const model = {
  header: 'AtoumWeb  ·  Référentiel interne V1',
  footer: 'Document interne : ne pas diffuser',
  blocks: [
    {t: 'cover', tagline: 'Création de sites web à Dijon', title: 'Référentiel interne V1', subtitle: 'Lot 1 : grille tarifaire et règles de vente', date: '11 novembre 2026',
      stats: [{n: data.offres.length, label: 'offres et services'}, {n: families.length, label: 'familles métier'}, {n: data.clauses.length, label: 'clauses contractuelles'}],
      note: 'Ce document réunit les prix validés, les règles de vente et les temps de référence. Les fiches de vente, les contrats et la méthode suivent dans les lots 2 à 4.'},
    {t: 'toc', title: 'Sommaire'},
    {t: 'h1', text: 'Comment lire cette grille'},
    {t: 'bullets', items: [
      'Les prix sont ceux des versions publiées dans le Manager : ils font foi.',
      'Les offres sont classées par famille métier, formules principales en tête, puis options du moins cher au plus cher.',
      'La colonne « Compris » résume le périmètre vendu ; « Non compris » liste ce qu’il faut chiffrer à part.',
      'Le temps de référence est un repère interne de travail, jamais un délai promis. « Sur devis » : aucun temps ni prix fixe.',
      'Le code sous le nom de l’offre est celui du Catalogue : il permet de la retrouver dans le Manager.']},
    {t: 'h1', text: 'Règles clés'},
    {t: 'lead', text: 'Les règles qui reviennent dans presque tous les devis.'},
    {t: 'cards', items: regles},
    {t: 'h1', text: 'Glossaire'},
    {t: 'table', cols: [{h: 'Terme', w: 26, bold: true}, {h: 'Sens', w: 74}], rows: [...defs, ...internes]},
    {t: 'landscape'},
    {t: 'h1', text: 'Grille tarifaire'},
    {t: 'lead', text: 'Les 125 offres et services du Catalogue, par famille métier.'},
    ...grille,
  ],
};
fs.writeFileSync(arg('--out'), JSON.stringify(model, null, 1));
console.log(JSON.stringify({familles: families.map(f => [f.name, f.offres.length]), regles: regles.length, glossaire: defs.length + internes.length}));
