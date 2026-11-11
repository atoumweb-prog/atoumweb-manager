'use strict';
// Assemble les quatre lots du référentiel interne en un seul document : couverture, sommaire, quatre parties.
//   node scripts/referentiel/model-assemble.cjs --dir <dossier des modèles> --out <modele-complet.json>
// Lit modele-lot1.json à modele-lot4.json. Les couvertures et sommaires des lots sont retirés ; les titres descendent d'un niveau
// (les parties deviennent les titres de niveau 1).
const fs = require('node:fs'), path = require('node:path');
const arg = k => { const i = process.argv.indexOf(k); return i < 0 ? null : process.argv[i + 1]; };
const dir = arg('--dir');
const load = n => JSON.parse(fs.readFileSync(path.join(dir, `modele-lot${n}.json`), 'utf8'));
const data = JSON.parse(fs.readFileSync(path.join(dir, 'dataset.json'), 'utf8'));

const PARTS = [
  {n: 1, title: 'Partie 1 : grille tarifaire et règles de vente', lead: 'Les 125 offres, leurs prix, leurs temps de référence, ce qui est compris et ce qui ne l’est pas, avec les règles qui reviennent dans presque tous les devis.', endPortrait: true},
  {n: 2, title: 'Partie 2 : fiches de vente et étapes à faire', lead: 'Une fiche par offre : à dire au client, questions, objections, vigilance et étapes à faire. Les dix offres les plus vendues ont une page entière.'},
  {n: 3, title: 'Partie 3 : contrats et clauses', lead: 'Les 121 clauses en texte intégral, classées par famille, et la matrice qui relie chaque offre à ses clauses.'},
  {n: 4, title: 'Partie 4 : méthode de travail et questions fréquentes', lead: 'Du premier contact à la sortie du client : paiements, livraison, maintenance, données personnelles, particuliers, médiation, assurance, situations réflexes et FAQ.'},
];
const demote = b => b.t === 'h1' ? {...b, t: 'h2'} : b.t === 'h2' ? {...b, t: 'h3'} : b;

const blocks = [];
blocks.push({t: 'cover', tagline: 'Création de sites web à Dijon', title: 'Référentiel interne V1', subtitle: 'Prix, fiches de vente, contrats et méthode', date: '11 novembre 2026',
  stats: [{n: data.offres.length, label: 'offres et services'}, {n: data.clauses.length, label: 'clauses contractuelles'}, {n: PARTS.length, label: 'parties'}],
  note: 'Le référentiel interne d’AtoumWeb réunit en un seul document les prix validés, les fiches de vente, le texte des clauses et la méthode de travail. Document interne : ne pas diffuser aux clients.'});
blocks.push({t: 'toc', title: 'Sommaire'});
for (const p of PARTS) {
  const m = load(p.n);
  blocks.push({t: 'h1', text: p.title, pb: true});
  blocks.push({t: 'lead', text: p.lead});
  for (const b of m.blocks) {
    if (b.t === 'cover' || b.t === 'toc') continue;
    blocks.push(demote(b));
  }
  if (p.endPortrait) blocks.push({t: 'portrait'});
}
const model = {header: 'AtoumWeb  ·  Référentiel interne V1', footer: 'Document interne : ne pas diffuser', blocks};
fs.writeFileSync(arg('--out'), JSON.stringify(model, null, 1));
console.log(JSON.stringify({blocs: blocks.length}));
