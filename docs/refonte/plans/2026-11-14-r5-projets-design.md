# R5 Projets : fiche de refonte (version en profondeur, sur des projets réels)

Statut : **proposition, à valider par Carlos avant tout code** (règle J). Cette version remplace les deux précédentes : elle repose sur **trois vrais projets créés par le parcours moderne** (devis accepté, projet figé), capturés à la taille de fenêtre normale. Elle change le périmètre : sa validation vaut accord au sens de la règle I.
Skills : `atoumweb-design` (critique), `superpowers:brainstorming`. Thème Noir, densité Confort (règle E). Règle A : la disposition des écrans est à valider ici ; données, règles métier, légal et ordre du parcours restent ta décision (règle B).

## D'où viennent les constats

- **Trois clients fictifs gardés en base** de la préproduction de test (`C:\DEV\03_LIVRAISONS\AtoumWeb\Manager-Claude-Codex-20261110\Workspace`), créés par `scripts/seed-clients-fictifs.cjs` avec le parcours du Manager (préparation du projet prévisionnel, envoi, acceptation, projet figé) : **TEST — Boulangerie Lefèvre** (Site vitrine 5 pages à **699 €**, DEV-2026-005, PRO-2026-004, 15 éléments), **TEST — Atelier des Saveurs** (Boutique WooCommerce, 1 490 €, DEV-2026-006, PRO-2026-005, 16 éléments), **TEST — Studio Horizon** (Landing Page, 499 €, DEV-2026-007, PRO-2026-006, 10 éléments). Repère des identifiants : `Workspace\DONNEES-FICTIVES-CLIENTS.json`. Sauvegarde avant écriture : `Sauvegardes-lots\avant-clients-fictifs-*.sqlite`.
- **Captures** : `C:\DEV\Livrables\Cadrage-parcours\captures-r5\avant\` (liste, puis les six onglets des trois projets, fenêtre de 1510 x 1030 px, Noir / Confort), avec `outils-audit\audit-projets.cjs` (copie jetable, source vérifiée inchangée, aucun port de débogage).
- **Correction de ma version précédente** : le grand bloc vide de 1 000 px vu en Production venait de ma fenêtre de capture trop haute (1 500 px), pas d'un défaut. Les vrais défauts sont ci-dessous.
- **Limites** : projets sans avancement (0 %, aucune tâche commencée) ; les captures du projet interne en cours de la version précédente restent utiles pour juger un plan avancé ; je n'ai pas encore relu toutes les captures (Sites et pages, Prérequis, Commercial de la boutique et de la landing page).

## Ce que les vrais projets montrent (critique)

**Le contenu arrive trop tard.** Sur un écran de 1 030 px, avant le plan de production on traverse : l'en-tête (≈ 150 px), le bloc « Périmètre accepté et figé » (≈ 120 px), puis une barre d'onglets (≈ 80 à 145 px) ; le plan démarre à y ≈ 570 px et ses quatre phases touchent le bas de l'écran. **Plus de la moitié de l'écran est du cadre avant le moindre travail.**

**La barre d'onglets est cassée.** Les six onglets sont de grands blocs verticaux dont la hauteur change d'un onglet à l'autre (≈ 145 px en Production, ≈ 97 px en Interventions, ≈ 78 px en Résumé, jusqu'à ≈ 295 px en Commercial) : ils s'étirent pour remplir la hauteur disponible au lieu de rester une rangée de 40 px.

**Jargon et libellés techniques**
- « Périmètre accepté et figé / Historique du périmètre (1) / Affectation des prestations, 0 destination(s) à choisir » : le sens métier est inconnu de l'utilisateur et aucune action n'est suggérée.
- « Ce projet utilise un ancien plan. Il conserve le modèle utilisé lors de sa création. » sur un projet tout neuf : se lit comme une alerte.
- Résumé : « TYPE : ecommerce » (anglais brut) ; « MODE COMMERCIAL : Normal ».
- Liste : valeur brute du type sous le nom ; « Historique » dans la colonne « État commercial » des projets internes.
- Interventions : quatre compteurs à 0, puis quatre sections vides en **texte minuscule (10 px)**.

**Troncatures** : « 1. Cadrage et cat… », « 4. Recette et mis… » dans les phases ; « PHASE 1 · 1. Cadrage » (numéro écrit deux fois) ; « 0/3 · 0 h » ambigu.

**Rien ne dit où en est le projet ni quoi faire** : 0 %, « À préparer », et c'est tout. Aucune ligne « ce qui bloque », aucun prérequis visible depuis l'en-tête.

**À conserver** : l'en-tête « PRO-2026-005 · PROJET CONFIRMÉ · DEVIS ACCEPTÉ » et le lien « Ouvrir le devis » sont clairs ; l'onglet Commercial montre bien 699 € et la prestation figée avec sa version de catalogue ; le Résumé donne les bons chiffres (28 h 30, 12 tâches restantes).

## Intention

Qu'en ouvrant un projet, on voie **le travail** (le plan) dès le premier écran, qu'on sache **où il en est et ce qui bloque** en une ligne, et que rien ne ressemble à un message d'erreur ou à du jargon. R5 reste sur la **surface** : aucune règle métier.

## Hors périmètre (règles métier, validation à part)

- « Prochaine étape » du projet, étapes de l'offre posées à la création, acompte à encaisser, préparation Abby (acompte, solde), garantie de 30 jours.
- Aucune donnée, statut, calcul ou ordre du parcours ne change. Les deux chemins « projet depuis un devis » (module Projets et fiche du devis) restent.
- Le rail de navigation réduit dans la fiche : traité avec le shell, pas ici.

## Proposition

### A. Rendre le travail visible : un cadre plus fin

- **Barre d'onglets** : une rangée horizontale de 40 px de haut, hauteur fixe, jamais étirée. C'est un défaut de mise en page, corrigé à la cause (règle de hauteur de la barre), sans nouvelle règle `!important`.
- **En-tête** : `RecordHeader` en deux lignes (retour, numéro, état commercial, nom, client, lien « Ouvrir le devis » ; statut, progression, annuler et rétablir nommés, « Réduire l'en-tête »).
- **« Périmètre accepté et figé »** : une seule ligne repliée « Périmètre figé du devis DEV-2026-005 · 1 version · 0 prestation à affecter », qui se déplie sur les deux listes actuelles. Aucun contenu retiré, seulement rangé. Intitulés en clair : « Historique du périmètre » devient « Versions du périmètre » et « Affectation des prestations » devient « Prestations à placer dans le plan ».
- Résultat attendu : le plan de production commence vers y ≈ 330 px au lieu de 570.

### B. Production : le plan d'abord, lisible

- Le message « ancien plan » devient une ligne discrète et neutre (« Plan issu du modèle d'origine ») affichée seulement quand c'est utile, jamais en alerte.
- Phases : « Phase 1 : Cadrage et catalogue » (un seul numéro, nom entier sur deux lignes si besoin), avancement « 0 sur 3 tâches », « Temps estimé : 0 h » ; pastille de statut commune pour bloqué, en attente client, à valider.
- Le volet de droite ouvre par défaut la première tâche à faire (ou en cours) ; il n'est vide que si le plan l'est.
- Un filtre « Ce qui demande une action » (bloqué, en attente client, à valider).

### C. Une ligne « En ce moment » dans l'en-tête

Calculée **uniquement avec des données existantes** (aucune règle nouvelle) : tâches bloquées, en attente du client, à valider ; prérequis non validés ; date cible. Chaque compteur ouvre la bonne liste ; rien à signaler = « Rien ne bloque ce projet. »

### D. Résumé, Commercial, Interventions, Prérequis

- **Résumé** : une carte compacte, types en français (« Boutique en ligne », « Tarif normal »), zone vide supprimée.
- **Interventions** : texte à 14 px minimum ; un seul message vide utile (« Aucune demande ni intervention sur ce projet pour l'instant. ») au lieu de quatre compteurs à 0 et quatre sections vides ; « Packs » devient « Packs d'heures ».
- **Prérequis** : tableau compact libellé et statut côte à côte, compteur « 1 validé sur 4 », filtre « Seulement ce qui manque ».
- **Commercial** : message vide qui dit pourquoi (projet interne : pas de devis).

### E. Liste

Nom entier sur une ou deux lignes, type en français, statut en `StatusPill`, colonnes par défaut Numéro, Client, Projet, Statut, Progression, Cible, Ouvrir (« État commercial » et « Temps estimé » restent dans « Colonnes et vues »), message vide qui dit quoi faire ; « + Depuis un devis » reste l'unique action principale.

### F. Onglet d'ouverture

Un projet en cours s'ouvre sur **Production**, un projet « À préparer » avec prérequis manquants sur **Prérequis**, un projet terminé ou archivé sur **Résumé**. Les six onglets restent visibles.

## Découpage proposé (ta décision)

- **R5a** : barre d'onglets et cadre (A), Production (B), ligne « En ce moment » (C), liste (E), onglet d'ouverture (F).
- **R5b** : Résumé, Commercial, Interventions, Prérequis (D), après relecture complète des captures et sur un projet avancé.

## Points à trancher par toi

1. **Découper en R5a puis R5b**, ou un seul lot ?
2. **Ligne « En ce moment »** (compteurs sur données existantes) : OK ?
3. **« Périmètre figé » replié sur une ligne**, intitulés clarifiés : OK ?
4. **Volet de droite** qui ouvre la première tâche à faire : OK ?
5. **Onglet d'ouverture** selon l'état du projet : OK ?
6. **Colonnes par défaut** réduites : OK ?

## Ce que je n'ai pas pu voir

Sites et pages, Prérequis et Commercial de la boutique et de la landing page ; un projet réellement avancé issu du parcours moderne (tâches faites, prérequis reçus, temps saisi) ; les états d'erreur, les noms très longs, la fenêtre étroite, le clavier.

## Preuves prévues si tu valides

Tests d'abord (règles pures : compteurs « En ce moment », tâche ouverte par défaut, onglet d'ouverture, ton du statut projet, libellé du type), câblage par lecture du source comme R3 et R4, typecheck, suite complète, les quatre scripts natifs, galerie de recette Projets sur les trois clients fictifs gardés en base, captures avant / après dans `captures-r5\`, plan dans `docs/refonte/plans/2026-11-14-r5a-projets.md`, un seul commit local par lot après tes captures, mise à jour de `docs/refonte/FINITIONS.md` avant le commit.
