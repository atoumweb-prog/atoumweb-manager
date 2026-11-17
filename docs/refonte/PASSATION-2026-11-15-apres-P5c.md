# Passation de la refonte du Manager (15/11/2026, après P5c)

À lire en premier dans la nouvelle conversation. Ce fichier **remplace comme point d’entrée** `PASSATION-2026-11-15-apres-P5b.md`, dont les pièges et ceux des passations antérieures restent valables.

## 1. Où on en est

- Dépôt `C:\DEV\01_PROJETS\AtoumWeb\claude-review-pr166`, branche `claude/refonte-manager`, **rien de poussé**. Derniers commits : P5c (voir `git log`), P5b `62c30f61`, P5a `87b84996`.
- **Plancher de 14 px atteint** : budget des petits textes à **12**, la seule exception décidée par Carlos (document dans l’aperçu du devis côté client, `.quote-document-*`), gardée par `ui/p5cWiring.test.ts`. `!important` : 86.
- Passe de finitions : il reste **P5d** (F27, un seul composant de chiffres clés : `KeyFigures`, cartes de projet `.project-keyfigure`, tuiles de l’Accueil), avec sa fiche courte à faire valider (la disposition de l’Accueil peut bouger).
- Au registre en attente : F55 à F63 (décisions de Carlos du relevé P6b), F64, F65, F66 à F68 (recettes rouges antérieures), F69 (vue Parcours commercial à repenser, lot à part), F71 (moteur des devis et mentions légales, après la refonte), F72, F73 (débordements antérieurs), F74 (titres du rail sans capitales, information).

## 2. Prochaine action concrète

1. **P5d** : fiche courte (skills `superpowers:brainstorming`, `atoumweb-design`) : relever les trois composants et leurs usages, proposer un composant unique, montrer l’effet sur l’Accueil ; validation de Carlos avant tout code.
2. Puis fin de refonte : styles AtoumWeb et Blanc, densités Compact et Confort + ; lot dédié de l’acompte par défaut et des tests du moteur des devis (F71).

## 3. Ce qu’on a appris pendant P5c

- **Relever tout un fichier fait bouger des écrans qu’on ne regarde pas** : la règle commune retire les capitales des petits sur-titres, ce qui a changé les titres du rail sur toutes les pages (F74) ; le dire à Carlos.
- **Une unité collée à un champ** (« min ») peut se couper quand elle passe à 14 px : `white-space: nowrap`.
- **Un aperçu de document n’est pas l’interface** : demander avant d’appliquer une règle d’interface à l’image d’un document envoyé au client.
- **Comparer les débordements avant / après** (valeur maximale par vue) sépare un défaut créé par le lot d’un défaut antérieur.
