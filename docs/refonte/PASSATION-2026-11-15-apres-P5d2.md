# Passation de la refonte du Manager (15/11/2026, après P5d2) : passe de finitions terminée

À lire en premier dans la nouvelle conversation. Ce fichier **remplace comme point d’entrée** `PASSATION-2026-11-15-apres-P5d1.md`, dont les pièges et ceux des passations antérieures restent valables.

## 1. Où on en est

- Dépôt `C:\DEV\01_PROJETS\AtoumWeb\claude-review-pr166`, branche `claude/refonte-manager`, **rien de poussé**, aucune PR. Derniers commits : P5d2 (voir `git log`), P5d1 `705e42bb`, P5c `be664219`.
- **Refonte R0 à R9 et passe de finitions terminées** en Noir / Confort : plancher de 14 px atteint (budget 12, exception de l’aperçu du document client), un seul composant de chiffres clés (`KeyFigures`), plus aucune recette rouge hors les rouges antérieures connues (F66, F67, F68, F75).
- Carlos peut tester en direct par une **fenêtre jetable** (`electron-forge start` sur une copie de la base de test, voir `PASSATION-2026-11-15-apres-P5b.md`).

## 2. Prochaine action concrète

1. **Fin de refonte** (fiche courte à faire valider, skills `superpowers:brainstorming`, `atoumweb-design`) : thèmes **AtoumWeb et Blanc** (F76 : Carlos voit de nombreux textes tronqués en Blanc) et densités **Compact et Confort +**, alignés sur les rôles de jetons du Noir ; captures de toutes les pages dans chaque thème. Décisions à prendre avec Carlos : découpage (par thème ou par groupe d’écrans), thème par défaut.
2. Lots à part, après : **acompte par défaut et moteur des devis et mentions légales** (F71, tests en profondeur demandés par Carlos) ; **vue Parcours commercial** (F69, fiche à valider) ; décisions F55 à F63 du relevé P6b ; diagnostics F66 à F68, F75 ; F72, F73 (débordements antérieurs).

## 3. Ce qu’on a appris pendant P5d2

- **`css-prune.cjs` découpe aussi les virgules à l’intérieur de `:is(...)`** : une règle générale qui citait la classe retirée a disparu entière. Toujours lire le `git diff` des retraits et rétablir à l’identique ce qui n’aurait pas dû partir.
- **Les tons par jetons sont plus calmes que les anciennes couleurs en dur** (en Noir, `info` ressort presque gris) : le dire à Carlos sur captures ; proposer un renfort (fond teinté, icône pleine) seulement s’il le demande.
- **Tests figés sur l’écriture JSX** (`label="…"`) : les adapter à l’écriture par propriétés d’objet, sans changer ce qu’ils vérifient.
