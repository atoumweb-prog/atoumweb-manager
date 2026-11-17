# Passation de la refonte du Manager (15/11/2026, après P5d1)

À lire en premier dans la nouvelle conversation. Ce fichier **remplace comme point d’entrée** `PASSATION-2026-11-15-apres-P5c.md`, dont les pièges et ceux des passations antérieures restent valables.

## 1. Où on en est

- Dépôt `C:\DEV\01_PROJETS\AtoumWeb\claude-review-pr166`, branche `claude/refonte-manager`, **rien de poussé**. Derniers commits : P5d1 (voir `git log`), P5c `be664219`, P5b `62c30f61`.
- Passe de finitions : il reste **P5d2** (tuiles de l’Accueil, `home/HomeDashboard.tsx`, `.home-kpi-card` : icône, couleur d’état, libellé, valeur, chevron, cliquables) à passer par `KeyFigures` (décisions déjà prises dans la fiche `2026-11-15-p5d-chiffres-cles-design.md`).
- Puis **fin de refonte** : thèmes AtoumWeb et Blanc (F76 : Carlos voit de nombreux textes tronqués en Blanc, attendu) et densités Compact et Confort + ; lot dédié de l’acompte par défaut et des tests du moteur des devis (F71) ; F69 (vue Parcours commercial) en lot à part.

## 2. Ce qu’on a appris pendant P5d1

- **La couche typographique finale (`ui-typography-consistency.css`) vise des `span` génériques** (ex. `.project-production-page span` à 14 px) : un composant posé dans ces pages doit viser ses éléments par leur propre classe (`.aw-keyfigure > .aw-keyfigure-value`).
- **`css-prune.cjs` et les commentaires** : un sélecteur précédé d’un commentaire qui contient une virgule est découpé au milieu du commentaire (ligne bancale laissée) ; une règle précédée d’un commentaire n’est pas reconnue par un motif ancré `^` ; relire le `git diff` et équilibrer les `/*` `*/`.
- **Une grille d’écran gardée comme classe** (`hour-pack-kpi-grid`) traîne ses anciennes règles d’enfants (`… strong`, `… span`) qui toucheraient le nouveau composant : les retirer.
- **Tests figés sur l’ancien balisage** (R5b `<strong>1</strong>`) : les adapter au repère durable, sans changer ce qu’ils vérifient.
