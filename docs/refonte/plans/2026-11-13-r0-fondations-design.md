# R0 Fondations : design

> **Révision du 13/11/2026 (décision de Carlos)** : Inter embarquée est **abandonnée** (troncatures causées par sa largeur, environ 10 % de plus que Segoe UI ; aucun gain sur un poste unique). R0 devient : tokens sémantiques + correction de `--danger` + **police explicite : `"Segoe UI"` en tête de la pile de `styles.css`**, sans fichier embarqué. Les parties de ce document qui décrivent Inter (fichiers, licence, `fonts.css`, chargeurs `.woff2`, second changement visible) sont **caduques** ; elles sont conservées pour l'historique. Une police de marque pourra être étudiée plus tard avec un audit des largeurs.

Statut : VALIDÉ par Carlos le 13/11/2026 (plan R0). Aucun code écrit. Référence : `docs/refonte/DESIGN.md` (sections 5 et 11).

## Intention

Poser, avant toute refonte d'écran, deux fondations : des **couleurs sémantiques par thème** (succès, alerte, danger, info, accent) et la police **Inter embarquée**. Ainsi R1 (composants) et R2+ (écrans) n'écrivent plus de couleur en dur et le rendu typographique est identique sur tous les postes.

## Buts, non-buts, anti-buts

- Buts : tokens définis pour les trois thèmes ; `--danger` défini ; Inter embarquée (OFL 1.1, sans dépendance npm) ; contrastes vérifiés par un test.
- Non-buts : aucun écran ni composant modifié ; `--accent`, `--success`, `--aw-status-*` et tous les CSS existants restent inchangés ; aucun `!important` supprimé (c'est R1).
- Anti-but : un changement visible d'un écran existant en dehors des deux changements voulus : le rouge de `--danger` aux 7 emplacements (voir plus bas) et le passage à la police Inter embarquée sur les postes qui ne l'avaient pas installée.

## Décisions de Carlos (13/11/2026)

- Accent Noir = **jaune #ffda00**. Cette décision remplace une réponse précédente « or #c6a46c » dans la même conversation ; la dernière fait foi.
- AtoumWeb garde son or (#b9965c), Blanc garde son accent actuel (#92733f).
- Inter : copie des fichiers officiels avec la licence OFL 1.1, sans dépendance.
- Intégrer la correction de `--danger` dans R0.

## Approches considérées

- **A. Fichier de tokens additif** (retenu) : nouveau `tokens.css` chargé en premier ; aucun fichier existant modifié sauf `main.tsx`. Risque faible, migration progressive.
- B. Réécrire les blocs de thèmes existants : propre mais touche tous les écrans, contraire à « un écran par lot ».
- C. Tokens générés depuis TypeScript : outillage disproportionné pour 3 thèmes × 5 rôles.

## Design retenu

**Tokens.** Pour chaque rôle `R` ∈ {success, warning, danger, info, accent} et chaque thème, quatre variables : `--aw-R-solid` (fond plein, icône, bordure), `--aw-R-on-solid` (texte sur fond plein), `--aw-R-soft-bg` (fond teinté), `--aw-R-soft-fg` (texte sur fond teinté). Valeurs en hexadécimal fixe (pas de `color-mix`), pour pouvoir être testées. « Alerte » = `warning`. Définies sur `:root, :root[data-theme='atoumweb']`, `:root[data-theme='noir']`, `:root[data-theme='blanc']`, comme `styles.css`. Indépendantes de la densité.

**Valeurs** (rapport de contraste texte/fond entre parenthèses) :

| Rôle / variable | AtoumWeb | Noir | Blanc |
|---|---|---|---|
| success solid / on-solid | #198754 / #ffffff (4,53) | #55b98b / #0e1115 (7,84) | #198754 / #ffffff (4,53) |
| success soft-bg / soft-fg | #dfeee7 / #0f5132 (7,81) | #28473e / #9ce3c0 (6,87) | #dfeee7 / #0f5132 (7,81) |
| warning solid / on-solid | #f2b705 / #1f2933 (8,12) | #e7b75e / #0e1115 (10,21) | #f2b705 / #1f2933 (8,12) |
| warning soft-bg / soft-fg | #fdf5dc / #6b4e00 (7,10) | #514631 / #f3d99e (6,71) | #fdf5dc / #6b4e00 (7,10) |
| danger solid / on-solid | #d62828 / #ffffff (5,01) | #e77a6f / #0e1115 (6,68) | #d62828 / #ffffff (5,01) |
| danger soft-bg / soft-fg | #f9e1e1 / #8c1d1d (7,31) | #513536 / #f5b2ab (6,19) | #f9e1e1 / #8c1d1d (7,31) |
| info solid / on-solid | #1565c0 / #ffffff (5,75) | #79a9d7 / #0e1115 (7,63) | #1565c0 / #ffffff (5,75) |
| info soft-bg / soft-fg | #dee9f6 / #0d47a1 (7,03) | #324253 / #bad8f2 (6,96) | #dee9f6 / #0d47a1 (7,03) |
| accent solid / on-solid | #b9965c / #18212b (5,87) | #ffda00 / #111111 (13,74) | #92733f / #ffffff (4,42) |
| accent soft-bg / soft-fg | #f5f0e8 / #6b5128 (6,53) | #575017 / #ffe66a (6,54) | #f0ebe4 / #5c4724 (7,43) |

Points d'attention : (1) Blanc accent `on-solid` fait 4,42, sous le seuil de 4,5 : acceptable pour du texte gras ou grand seulement ; exception documentée, à trancher plus tard. (2) Sur fond clair, `warning solid` (1,82) et `accent solid` AtoumWeb (2,77) ne suffisent pas seuls pour une icône ou une bordure : utiliser `soft-fg` ou accompagner d'un texte.

**`--danger`.** Défini dans les trois thèmes comme `var(--aw-danger-solid)`. Il est utilisé 7 fois : 4 avec valeur de secours différente (#b42318 ×2, #c24d4d, #bc3543) et 3 sans (`operations.css` `.required-mark`, `ProjectSitesTab.css` `.project-site-rgpd-gate.blocked` bordure et texte), qui n'ont aujourd'hui **aucune couleur rouge** (variable non définie). Après R0 ces 7 emplacements prennent le rouge du thème : seul changement visible voulu.

**Coexistence des accents.** `--accent` (or dans Noir, 567 usages) n'est pas modifié. `--aw-accent-*` (jaune dans Noir) est la nouvelle référence ; les écrans migrent en R1 et R2+. Tant que la migration n'est pas faite, Noir montre or (anciens écrans) et jaune (écrans déjà jaunes en dur) : c'est l'état actuel, R0 ne l'aggrave pas.

**Inter.** Police variable `InterVariable.woff2` (Inter 4.1, rsms/inter, release `v4.1`), copiée dans `src/renderer/fonts/` avec le texte de licence et un fichier de provenance (URL, version, SHA-256). Déclarée par `@font-face` (poids 100 à 900, style normal, `font-display: swap`) dans `fonts.css`. La variante italique n'est pas copiée (une seule feuille de style l'utilise). Les poids intermédiaires déjà utilisés (650, 750) sont rendus nativement par la police variable. La pile de secours existante (`ui-sans-serif, system-ui, …`) reste en place.

## Contraintes

Aucune dépendance npm ajoutée. Aucun `!important` ajouté. Licence OFL 1.1 : conserver le copyright et le texte de licence avec la police, ne pas vendre la police seule. Téléchargement de la release Inter : source officielle GitHub uniquement.

## Laissé à l'exécutant

Noms de fichiers de test, structure interne du test de contraste, mise en forme du fichier de provenance.

## Décisions de validation (13/11/2026)

1. R0 laisse `--accent` (or) inchangé dans Noir ; seuls les nouveaux `--aw-accent-*` sont jaunes. La bascule des écrans se fait écran par écran en R1 et R2+.
2. Exception de contraste du Blanc (accent, 4,42 au lieu de 4,5) : acceptée pour R0 (texte gras ou grand). **À corriger en R1**, et notée comme telle dans `docs/refonte/DESIGN.md`.
3. Texte de licence Inter : texte OFL 1.1 officiel du dépôt rsms/inter.
4. Exécution en mode natif, relecture finale par un relecteur indépendant.
