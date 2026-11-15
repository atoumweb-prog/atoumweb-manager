# P3b Projets : fiche courte (finitions d'écran du plan et de l'onglet Interventions)

Statut : **proposition, à valider par Carlos avant tout plan et tout code** (règle J). Aucun code modifié. Constats tirés des **captures de R5a et R5b** (`C:\DEV\Livrables\Cadrage-parcours\captures-r5\apres\`, `captures-r5b\apres\`, écrans non modifiés depuis) et du code relu le 15/11/2026.
Skills : `atoumweb-design` (critique, polish), `superpowers:brainstorming`. Thème Noir, densité Confort (règle E). Parent : `2026-11-14-passe-finitions-design.md` (décisions 4 et 7 de Carlos).

## Intention

Que le plan de production **se lise sans effort** (noms de tâche entiers, pas de trait parasite, pas de bloc inutile en tête), que l'onglet **Sites et pages** d'un projet vide **dise quoi faire**, et que « + N autres non affichées » **mène à la liste complète**. Aucune donnée, règle métier ni parcours ne change.

## Ce que les captures et le code montrent

| N° | Constat | Preuve |
|---|---|---|
| **F13** | Sur un projet dont le plan vient d'un modèle choisi à la main (la « Landing page »), une boîte de 75 px dit « Plan issu du modèle d'origine : ce plan garde la structure du modèle utilisé à la création du projet. » Elle n'apprend rien et pousse le plan vers le bas. Elle n'apparaît **pas** sur le projet « Site vitrine » (le registre disait « sur les trois projets ») | capture `214-projet-landing-page-production` ; `ProjectsPage.tsx:808` (`!detailUsesBlueprint`), `projects.css:716` |
| **F14** | Le plan de production démarre à ≈ 429 px du haut (objectif 420). L'en-tête du projet compte cinq lignes : référence, titre, « Client / contact », « Devis source associé [Ouvrir le devis] », « Rien ne bloque ce projet. » | capture `202-projet-site-vitrine-a-699-production` |
| **F15** | De **petits traits dépassent à droite** de certaines lignes de phase repliées (« Conception et réalisation », « Mise en ligne »), après le menu « … ». Élément fautif non identifié | capture `214-projet-landing-page-production` ; `projects.css` (`.project-phase-*`, `.project-phase-progress`) |
| **F16** | La ligne « En ce moment » n'a été vue que sans avancement (« Rien ne bloque ce projet. ») et avec « 4 prérequis manquants ». Les états « tâches bloquées » et « en attente du client » n'ont **jamais été vus** : aucun projet de test n'a de tâche dans ces statuts | capture `219-projet-landing-page-resume` ; `ProjectNowLine.tsx`, `shared/projectOverview.ts` |
| **F17** | Les noms de tâche sont **coupés par des points de suspension** (« Recevoir le logo et les te… », « Valider l'arborescence du… », « Rédiger les pages princip… ») | capture `202` ; `projects.css:1314` (`.project-step-content strong { white-space: nowrap; text-overflow: ellipsis }`) |
| **F18** | Sur un projet sans Site ni Page : « 0 Site · 0 Page », « Aucun Site ni Page pour le moment » à gauche, et à droite un grand volet « Sélectionne un Site ou une Page » alors qu'il n'y a rien à sélectionner ; deux boutons « ← » pour replier. Les boutons d'action existent déjà dans la barre (« Compléter depuis le modèle », « + Site », « + Page ») | capture `203-projet-site-vitrine-a-699-sites-pages` ; `ProjectSitesTab.tsx:651` et `:677` |
| **F20** | Au-delà de 6 demandes ou 8 interventions, l'onglet dit « + 2 autres demandes non affichées » **sans lien**. Demandes et interventions portent déjà un `projectId`, mais la page Interventions n'a **aucun filtre par projet** | capture `217-projet-landing-page-interventions` ; `ProjectOperationsTab.tsx:36`, `OperationsPage.tsx`, `shared/operations.ts` |

## Hors périmètre

- La fiche prospect, l'assistant de devis (P3a, fait), l'Accueil (F43, P4), les recettes de parcours (F47, P6), le plan de production lui-même (données, ordre des phases, statuts).
- L'acompte par défaut, toute règle métier, tout changement de parcours, les thèmes AtoumWeb et Blanc, les densités autres que Confort.

## Proposition

### F13 : la note disparaît, l'information reste en une ligne (autonome pour la mise en forme, à valider pour l'idée)
Retirer la boîte. Garder l'information **dans la ligne du plan** : « 3 phases · plan issu du modèle d'origine » (texte atténué, 14 px). Aucun bloc, aucun clic en plus.

```
avant :  PLAN DE PRODUCTION
         3 phases
         [ Plan issu du modèle d'origine : ce plan garde la structure ... ]      (75 px)
après :  PLAN DE PRODUCTION
         3 phases · plan issu du modèle d'origine
```

### F14 : une ligne de moins dans l'en-tête du projet (disposition, à valider)
Mettre « Devis source associé [Ouvrir le devis] » **sur la ligne du client**, à droite de « Client / contact : … ». Gain ≈ 30 px ; le plan démarre sous les 420 px.

```
avant :  Client / contact : TEST — Boulangerie Lefèvre
         Devis source associé  [Ouvrir le devis]
         Rien ne bloque ce projet.
après :  Client / contact : TEST — Boulangerie Lefèvre · Devis source associé  [Ouvrir le devis]
         Rien ne bloque ce projet.
```

### F15 : mesurer, puis retirer le trait fautif
Une sonde liste les éléments de la ligne de phase dont le bord droit dépasse la ligne. Correction minimale (probablement la piste de la barre d'avancement qui sort de sa colonne). Le plan reste identique ailleurs.

### F16 : regarder, puis corriger ce que les captures montrent
Je fabrique **dans la copie jetable** de l'outil de capture (jamais dans la préproduction) des tâches « bloquée », « en attente du client » et « à valider » et je regarde la ligne « En ce moment » avec chacun des états et avec les trois ensemble (retours à la ligne, ordre, lisibilité à 14 px). Je ne corrige que ce qui est visiblement faux.

### F17 : un nom de tâche sur deux lignes au maximum
Les noms passent sur **deux lignes** (au lieu de couper à la première) ; au-delà, points de suspension. La ligne de tâche grandit de ≈ 20 px quand le nom est long.

### F18 : un vrai état vide (décision 7 de Carlos : garder l'onglet)
Quand le projet n'a ni Site ni Page, **un seul bloc** remplace les deux volets, et les boutons « ← » disparaissent (rien à replier) :

```
Aucun Site ni Page pour le moment
Ce projet n'a pas encore de Site ni de Page.
« Compléter depuis le modèle » crée ceux que prévoit le modèle du projet.
« + Site » et « + Page » les ajoutent à la main.
```
Les boutons restent dans la barre au-dessus (pas de doublon, une seule action jaune par vue).

### F20 : « Voir toutes les demandes » mène à la page Interventions filtrée (décision 4 de Carlos : oui)
Dans l'onglet Interventions du projet, la ligne « + 2 autres demandes non affichées » devient un lien « Voir toutes (8) ». Il ouvre la page **Interventions & Maintenance** avec un filtre **Projet : TEST — Landing page ✕** (une pastille qu'on retire pour revenir à tout). Le filtre porte sur les **demandes** et les **interventions** ; les vues Maintenance et Packs gardent leur liste complète. L'état du filtre vit dans la page (aucune donnée écrite).

## Approches envisagées

- **A (recommandée) : P3b en un lot** : sept petites finitions de lecture et une petite fonction (F20), une recette sur captures.
- **B : F20 dans son propre lot.** Plus propre (c'est la seule fonction nouvelle : événement de navigation, état de page, test), mais un lot de plus pour un lien.
- **C : sans F20.** Rapide, mais contredit ta décision 4.

## Décisions qui sont à toi

1. **F13** : retirer la boîte et dire l'information en une ligne (« 3 phases · plan issu du modèle d'origine ») : OK ?
2. **F14** : « Devis source associé » sur la ligne du client : OK ?
3. **F18** : un seul bloc d'état vide, boutons « ← » masqués quand il n'y a rien, textes ci-dessus : OK ?
4. **F20** : lien « Voir toutes (N) » et pastille « Projet : … ✕ » sur la page Interventions, filtre sur demandes et interventions : OK ? Et **dans P3b** (approche A) plutôt qu'un lot à part ?
5. **F17** : deux lignes au maximum pour un nom de tâche : OK ?

## Ce que je n'ai pas pu voir

L'élément qui dépasse en F15 ; la ligne « En ce moment » avec tâches bloquées ou en attente (F16) ; un projet à plusieurs dizaines de tâches ; l'effet sur Client et Devis (aucun n'est touché) ; les thèmes AtoumWeb et Blanc.

## Preuves prévues si tu valides

Tests d'abord pour chaque point (lecture du source pour les CSS et le câblage, tests de composant pour la note, la ligne du plan, l'état vide, et le filtre par projet pour les listes de demandes et d'interventions) ; `npm run typecheck` ; `node scripts/run-tests.cjs` (306 fichiers, 2 487 tests aujourd'hui, tout écart justifié) ; quatre scripts natifs sans option (72, 18/18, 25, 857) ; `check-ux-v2-lot10-ui` (59) ; recettes de P1 et P3a toujours vertes ; recette dédiée du filtre par projet ; **captures avant (dernier commit) et après** des trois projets de test (production, Sites et pages, Interventions, Résumé), du projet avec états forcés (F16, copie jetable) et de la page Interventions filtrée ; budget des petits textes (617) et `!important` (≤ 86) ; fins de ligne par `eol-report.cjs` ; mise à jour de `FINITIONS.md` (F13 à F18, F20 « fait dans P3b »), `PROJECT_STATUS.md`, fichier de reprise ; un seul commit local, après tes captures vues. **La revue finale est un autocontrôle, pas un relecteur indépendant.**

## Révisions

**Décisions de Carlos du 15/11/2026 (fiche validée, toutes selon la recommandation)** : 1. F13 une ligne (« 3 phases · plan issu du modèle d'origine ») ; 2. F14 « Devis source associé » sur la ligne du client ; 3. F18 un seul bloc d'état vide, flèches masquées ; 4. F20 dans P3b (lien « Voir toutes (N) », pastille « Projet : … ✕ », filtre sur demandes et interventions) ; 5. F17 deux lignes au maximum. Aucune révision de périmètre.
