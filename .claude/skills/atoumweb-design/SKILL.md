---
name: atoumweb-design
description: "Use when working on the visual design, UX, layout, typography, color, motion, UX copy or accessibility of AtoumWeb Manager screens: shaping, critiquing, auditing, polishing or refining an interface. Works by reading code and screenshots; runs no external program."
metadata:
  version: 1.0.0
  derived_from: "Impeccable 4.9.0 by Paul Bakaus (Apache-2.0), modified locally; see NOTICE.md"
---

# AtoumWeb Design

Savoir de conception d'interface (hiérarchie, mise en page, typographie, couleur, mouvement, accessibilité, textes) appliqué à AtoumWeb Manager. Dérivé d'Impeccable de Paul Bakaus (licence Apache-2.0, voir `LICENSE` et `NOTICE.md`), sans binaire, sans script, sans hook.

## Règles du projet (prioritaires)

1. **Respecter `AGENTS.md`** et ses sources de vérité (`PROJECT_STATUS.md`, cahier des charges fonctionnel, `README.md`). Si une idée de design contredit le cahier des charges, ne l'improvise pas : signale-la et demande une décision.
2. **Jamais de refonte complète d'un écran sans validation** de l'utilisateur. Propose d'abord (direction, périmètre, coût), attends l'accord, puis exécute.
3. **Rester dans le périmètre du lot en cours.** Ne touche pas aux écrans, modules ou données hors lot. Ce qui est hors lot est noté comme suggestion, pas fait.
4. **Aucun programme externe.** N'exécute ni `npx impeccable`, ni binaire téléchargé, ni script de ce dossier, et n'installe aucun hook. Audit, critique et polish se font en lisant le code et les captures d'écran. Les vérifications habituelles du projet (typecheck, tests ciblés) restent permises quand la tâche les demande ; rapporte leurs résultats réels.
5. **Aucune donnée métier dupliquée** pour faciliter un écran. Les trois thèmes doivent rester cohérents ; vérifie aussi la recherche globale et le journal d'activité quand c'est pertinent (voir la section Qualité d'`AGENTS.md`).
6. **Pas de commit, de push ni de fusion** sans accord explicite de l'utilisateur.

## Document de référence de la refonte

Un seul fichier : `docs/refonte/DESIGN.md` (charte, principes, décisions d'interface). Il remplace `PRODUCT.md`, `DESIGN.md` à la racine et le dossier `.impeccable/` : **ne crée aucun de ces trois.**

- S'il existe, lis-le avant toute tâche de conception et suis-le.
- S'il n'existe pas, ne l'invente pas : dis-le et propose un contenu.
- **Ne le crée ni ne le modifie jamais sans avoir montré le contenu à l'utilisateur et obtenu son accord.** Il doit aussi être inscrit dans `PROJECT_STATUS.md` comme document de référence de la refonte ; cette inscription demande le même accord.
- Tu peux proposer des ajouts (décisions prises pendant un lot, tokens validés), sous forme de texte à relire.

## Comment concevoir

- **Le brief gagne.** Respecte les choix déjà validés (charte, polices, palettes, thèmes). Ne redirige pas un brief clair vers tes goûts.
- **Affiner conserve, refondre remplace.** Un affinage garde l'identité, le comportement, les textes et tout ce qui est hors périmètre. Demande avant de remplacer un texte factuel ou d'ajouter une affirmation.
- **Application, pas vitrine.** Manager est un outil de travail (mode Operate) : lisibilité, cohérence, familiarité et états complets passent avant l'expression. La marque vit dans les détails précis. Lis [reference/operate.md](reference/operate.md).
- **Vérifie le résultat en le regardant**, aux tailles réelles et sur les trois thèmes, par captures quand elles sont disponibles. Sans capture, dis que le rendu n'a pas été vu.
- Avant toute modification d'interface, lis [reference/craft-floor.md](reference/craft-floor.md) : socle de qualité, interdits et réflexes à contrôler.

## Commandes

Chaque commande charge sa référence et suit ses étapes. Demande une fois si deux commandes conviennent.

| Commande | Rôle | Référence |
|---|---|---|
| `new-work [écran]` | Concevoir un nouvel écran ou une nouvelle surface (options à valider, jamais de refonte seul) | [reference/new-work.md](reference/new-work.md) |
| `shape [écran]` | Cadrer l'UX avant d'écrire du code (brief à valider) | [reference/shape.md](reference/shape.md) |
| `critique [cible]` | Revue de conception avec notation (code + captures) | [reference/critique.md](reference/critique.md), [reference/critique-reference.md](reference/critique-reference.md) |
| `audit [cible]` | Contrôle technique : accessibilité, performance, thèmes, responsive | [reference/audit.md](reference/audit.md) |
| `polish [cible]` | Passe de finition avant livraison | [reference/polish.md](reference/polish.md) |
| `extract [cible]` | Extraire tokens et composants réutilisables | [reference/extract.md](reference/extract.md) |
| `bolder` / `quieter` | Renforcer ou calmer une interface | [reference/bolder.md](reference/bolder.md), [reference/quieter.md](reference/quieter.md) |
| `distill` | Retirer la complexité | [reference/distill.md](reference/distill.md) |
| `harden` | États d'erreur, cas limites, i18n | [reference/harden.md](reference/harden.md) |
| `clarify` | Clarifier les textes d'interface | [reference/clarify.md](reference/clarify.md) |
| `onboard` | Premiers pas, états vides | [reference/onboard.md](reference/onboard.md) |
| `adapt` | Responsive et contextes d'usage | [reference/adapt.md](reference/adapt.md) |
| `layout` | Mise en page, espacement, rythme | [reference/layout.md](reference/layout.md) |
| `typeset` | Typographie | [reference/typeset.md](reference/typeset.md) |
| `colorize` | Couleur stratégique | [reference/colorize.md](reference/colorize.md) |
| `animate` | Mouvement utile | [reference/animate.md](reference/animate.md) |
| `delight` | Détails qui rendent l'usage agréable | [reference/delight.md](reference/delight.md) |
| `optimize` | Performance d'interface | [reference/optimize.md](reference/optimize.md) |
| `overdrive` | Ambition maximale ; uniquement sur demande explicite de l'utilisateur | [reference/overdrive.md](reference/overdrive.md) |

Sans commande explicite, traite la demande comme un travail de design général : lis le code concerné, `docs/refonte/DESIGN.md` s'il existe, applique les règles ci-dessus, et propose avant de refondre.

## Audit, critique et polish : méthode sans programme

1. **Lire** le code de la cible (composants, CSS, tokens des trois thèmes) et les captures disponibles.
2. **Prouver** chaque constat par un fichier et un sélecteur, ou une capture. Pas de constat sans preuve.
3. **Distinguer** ce qui a été vu (code, captures) de ce qui n'a pas pu l'être (rendu réel, interactions, états rares), et le dire dans le rapport.
4. Pour voir le rendu réel, tu peux lancer l'application en mode développement après mon accord, une fois par session. Pas de port de débogage ouvert sans accord.
5. **Livrer** le rapport dans le chat. Il n'est écrit dans un fichier que si l'utilisateur le demande, après relecture.
6. **Proposer** les corrections, par ordre de priorité, puis attendre l'accord avant de modifier.

## Avant de terminer

- Périmètre du lot respecté, rien modifié hors cible.
- Trois thèmes cohérents, états vides / erreur / chargement traités.
- Aucune donnée métier dupliquée, fichiers liés toujours référencés depuis un emplacement maître.
- Vérifications du projet lancées quand c'était prévu, résultats rapportés tels quels (échecs compris).
- `PROJECT_STATUS.md` mis à jour seulement avec l'accord de l'utilisateur sur le contenu.
