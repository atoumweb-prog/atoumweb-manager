# Lot 01A — Design tokens, typographie, thèmes et densités

**Statut : spécification préparatoire, PAS un ordre de coder.**  
**Référence HEAD inspectée : `main@eb252d5cbd0e95137eafa2b4759fcbcfd7263eda` (09/10/2026).**  
**Prérequis :** consulter le [Lot 01 complet](LOT-01-FONDATIONS.md), la [matrice existant→V2](LOT-01-MATRICE-EXISTANT-CIBLE.md) et le registre [Décisions](DECISIONS.md).

## A. Objectif mesurable
Disposer d'un catalogue de tokens visuels commun aux composants V2 et rétrocompatible avec les vues non migrées. Préserver **AtoumWeb / Noir / Blanc**, **Compact / Confort / Confort+**, le fonctionnement des notifications et formulaires, sans casser la navigation ou réduire la lisibilité.

Le sous-lot 01A **n'implémente pas** navigation compacte, menus favoris, fiche rapide, tableaux, garde de sortie ou logo ; leur esthétique et API seront traitées après l'inventaire.

## B. Inventaire d'implémentation constaté
| Fichier | Rôle observé | Travail autorisé après accord de développement |
|---|---|---|
| `src/shared/contracts.ts` | Types et validation `THEME_NAMES`, `DISPLAY_DENSITIES` | **Conserver strictement** noms/valeurs ; enrichir uniquement par compatibilité |
| `src/renderer/App.tsx` | Thème et densité stockés, `applyTheme/applyDensity`, réglages et `NAV_ITEMS` | Ne pas refactorer la navigation métier pendant 01A |
| `src/renderer/styles.css` | Couleurs/tokens : `--sidebar`, `--sidebar-text`, `--canvas`, `--surface`, `--surface-soft`, `--text`, `--muted`, `--border`, `--accent`, `--accent-strong`, `--accent-soft`, `--success`, `--shadow` | Cartographier et documenter leurs rôles avant de changer des valeurs |
| `src/renderer/display-density.css` | `--ui-font-base`, `--ui-font-secondary`, `--ui-font-small`, `--ui-control-height`, paddings, espacement et panel padding | Préserver trois modes et leur lisibilité |
| `src/renderer/ui-typography-consistency.css` | Régularisations de typographie | Trouver les déclarations contradictoires |
| `src/renderer/ui-consistency-v2.css` | Couche globale tardive, champs, boutons, focus, panneaux | Réduire conflits sans supprimer protections |
| `src/renderer/main.tsx` | Ordre de chargement de CSS du renderer | Évaluer priorité/cascade avant migration ; ne pas réordonner massivement |
| CSS par module, notamment `crm.css`, `commercial.css`, `projects.css`, `operations.css` | Styles spécialisés | Inspecter usages/overrides des tokens avant toute suppression |

Les couleurs de **marque/métier** `#D62828`, `#F2B705`, `#1565C0`, `#198754` sont une palette validée dans le cadre du projet ; **ne pas les confondre** avec l'accent UI actif (or en thème AtoumWeb) ni avec les états disponibles (`--success`, alertes, catégories).

## C. Densités : valeurs de référence code réel
| Token | Compact | Confort | Confort+ |
|---|---:|---:|---:|
| Base texte **(code existant, non encore modifié)** | 15px | 16px | 18px |
| Secondaire | 14px | 15px | 16px |
| Texte de petite taille | 14px | 14px | 14px |
| Hauteur contrôles | 36px | 42px | 48px |
| `--ui-panel-pad` | 16px | 22px | 26px |
| `--ui-gap` | 8px | 12px | 16px |

**E01 — décision AtoumWeb du 09/10/2026 :** la table ci-dessus décrit **l'existant**. Pour la V2, le texte principal du mode **Compact cible 14 px au lieu des 15 px actuels**. Confort **16 px** et Confort+ **18 px** sont conservés. Le texte secondaire/petit ne descend pas sous 14 px ; hauteurs de contrôles **36/42/48 px** conservées pour l'instant. **Aucune modification CSS encore effectuée** : tester la lisibilité de 14 px et les différences entre thèmes avant exécution, y compris éventuelles règles historiques contradictoires.

## D. Contrat des tokens V2 (à stabiliser après inventaire)
Les composants utilisent des **rôles** plutôt que des couleurs codées en dur : surface, surface secondaire, texte principal/secondaire, bordure, focus, accent interactif, erreur, succès, avertissement, sélection, survol, désactivation, espacement et densité.

- Ne pas introduire de palette couleur qui altère la sémantique Prospect/Client (température ≠ sentiment relationnel).
- Ne pas colorer toutes les cartes pipeline ; distinction colorée discrète et étiquette accessible.
- L'icône/texte d'actions sensibles reste visible même si la couleur n'est pas perceptible.
- Accepter l'existence de `!important` historiques ; supprimer un override seulement après test de ses consommateurs.
- Prévoir des variables sémantiques pour les nouveaux composants, avec alias rétrocompatibles vers les anciens tokens.
- Ne pas introduire de dépendance externe ou police distante obligatoire ; vérifier les polices déjà disponibles, chargement local et licence avant toute évolution.

## E. Séquence d'exécution pour Codex (après feu vert humain)
1. **Relever le HEAD** courant et noter les PR #80/#81/#83 fusionnées ou non.
2. **Inventorier** les déclarations CSS : token → valeur par thème/densité → sélecteurs consommateurs → fichier → origine.
3. **Capturer la référence visuelle** de l'atelier isolé et, par échantillonnage, Accueil, Prospection, Devis, Projet, Réglages, sur les 3 thèmes × 3 densités.
4. **Proposer** la matrice des noms/aliases conservés, les tokens manquants et les doublons/règles conflictuelles, sans perdre les valeurs.
5. Appliquer **une modification ciblée** dans un incrément réversible, éviter la réécriture en masse des 52 feuilles CSS recensées à l'audit.
6. Tester les exemples communs, les vues anciennes potentiellement touchées et le clavier/focus.
7. Documenter **avant/après** et écarts restant, puis demander validation avant le lot 01B.

## F. Livrables attendus
- Table exhaustive des tokens actuels et mapping ancien → rôle sémantique V2 ; fichiers et consommateurs impactés.
- Echelle typographique réelle par densité, justifiée.
- Palette et contraste par thème avec captures comparatives.
- Variables CSS compatibles, ou **rapport d'absence de changement** si une consolidation casserait l'existant.
- Tests réutilisables de valeurs structurantes et recette visuelle trois thèmes × trois densités.
- Journal de migration avec stratégie de rollback, aucune suppression de fonctionnalité.

## G. Recette détaillée (conditions de passage 01A → 01B)
| ID | Scénario | Attendu |
|---|---|---|
| R01A-01 | Démarrer dans chaque thème | Aucun texte noir sur noir ou bordure illisible ; identité visuelle appropriée |
| R01A-02 | Changer la densité puis relancer | Cible de texte principal **14/16/18 px** selon Compact/Confort/Confort+ ; préférence restaurée ; aucune règle ancienne ne masque ou dégrade les champs |
| R01A-03 | Naviguer 17 entrées après modification CSS | Navigation et boutons disponibles ; focus visible |
| R01A-04 | Ouvrir Prospect, Devis, Projet, Intervention | Champs, panneaux, boutons sans débordements ou masquage d'action |
| R01A-05 | Réduire fenêtre, vérifier zoom et scroll | Pas de zone de travail inaccessible sans alternative |
| R01A-06 | Rejouer les tests existants non UI et UI pertinents | Aucun échec nouveau ; écarts documentés au lieu de les cacher |
| R01A-07 | Contraster success/warning/error/focus | Coloris et libellés lisibles dans les trois thèmes |
| R01A-08 | Vérifier chrono, icônes et aide `?` | Styles globaux ne masquent ni commandes ni messages |

La preuve d'une recette est son résultat réel avec date, environnement et SHA, **pas cette liste d'intentions**.

## H. Ce que 01A ne doit surtout pas faire
- Modifier les règles de devis/contrats, états CRM, services IPC/SQLite, migrations, Bridge, chrono.
- Remplacer la navigation actuelle par de nouveaux menus pendant 01A.
- Réduire tous les textes au nom de la compacité.
- Présenter un logo « triangles imbriqués » comme approuvé alors que le fichier final ne l'est pas.
- Utiliser le workspace Validation-MSI comme environnement de recette.
- Fusionner une PR automatiquement ou présenter #83 comme intégrée tant que son merge n'est pas vérifié.

**E01 tranché : Compact 14 px cible, Confort 16 px, Confort+ 18 px ; implémentation et validation visuelle restant à exécuter.**
