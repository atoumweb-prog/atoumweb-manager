# R5b Projets : fiche de refonte (Résumé, Commercial, Interventions, Prérequis)

Statut : **proposition, à valider par Carlos avant tout code** (règle J). Aucun code écrit. Suite de `2026-11-14-r5-projets-design.md` (section D) et de R5a (commit `1d2ebf84`).
Skills : `atoumweb-design` (critique, shape), `superpowers:brainstorming`. Thème Noir, densité Confort (règle E). Règle A : la disposition des écrans est à valider ici ; données, règles métier, légal et ordre du parcours restent ta décision (règle B).

## D'où viennent les constats

- Captures `C:\DEV\Livrables\Cadrage-parcours\captures-r5\apres\` (état **après R5a**, c'est le point de départ de R5b, donc le futur « avant ») : les six onglets des trois clients fictifs, fenêtre 1510 x 1030, Noir / Confort. Relues cette fois : Sites et pages, Prérequis, Commercial de la boutique et de la landing page, plus les quatre onglets de la vitrine.
- Code lu : `ProjectsPage.tsx` (`ProjectSummaryTab`, `ProjectCommercialTab`, bloc Prérequis lignes 906 à 912), `ProjectOperationsTab.tsx` et son CSS, `projects.css` lignes 47 à 109, `shared/projectOverview.ts`, `shared/projectTypeLabel.ts`.
- **Limite importante : les trois projets fictifs n'ont aucun prérequis, aucune demande, aucune intervention, aucune maintenance, aucun pack.** Prérequis et Interventions ne sont donc vus qu'à l'état vide. Je n'ai jamais vu un tableau de prérequis rempli, ni une ligne d'intervention (voir question 1).

## Ce que les captures et le code montrent (critique)

**Texte sous le plancher de 14 px, malgré la couche finale**
- Interventions : titres de section et messages vides très petits (`ProjectOperationsTab.css` : 7, 8, 9 px), vus à environ 10 px sur la capture. Les quatre sections vides sont illisibles.
- Commercial : nom de la prestation (« Site vitrine 5 pages ») et prix (« 699 € ») minuscules, alors que « Version catalogue figée » est plus grand : hiérarchie inversée (`projects.css` : 10 et 8 px).
- Résumé : les valeurs à droite (« vitrine », « Normal », « 14/12/2026 ») sont minuscules face aux libellés en capitales (`.project-summary-list strong` : 11 px).

**Jargon et valeurs brutes**
- Résumé : « TYPE : vitrine » et « ecommerce » (la fonction `projectTypeLabel` de R5a n'est pas utilisée ici) ; « MODE COMMERCIAL : Normal ».
- Interventions : les lignes affichent les valeurs internes telles quelles (`request.status`, `priority`, `intervention.type`, `coverageMode`, `subscription.status`). Les libellés français existent dans `OperationsPage.tsx` mais **y sont locaux** : les recopier créerait un doublon, il faut les partager.

**Écrans qui se contredisent ou se répètent**
- Interventions : quatre compteurs à 0, puis quatre sections qui répètent « Aucun… » : huit lignes pour dire une seule chose.
- Résumé : « Prérequis à traiter » compte avec `item.required` strict, alors que la ligne « En ce moment » (R5a) compte avec `required !== false` : **deux définitions du même mot « manquant »**. Même source à utiliser : `projectNowSummary`.
- Résumé : la tuile « Progression 0 % » répète l'en-tête.

**Informations invisibles**
- Prérequis : un prérequis non obligatoire (`required = false`) n'est pas distingué des autres, alors qu'il ne compte pas dans « manquants ». Aucun total.
- Commercial : « Écart / valeur offerte : 0 € » sur chaque projet normal ; message vide « Aucune prestation commerciale rattachée. » sans dire pourquoi (projet interne : pas de devis).

**Mise en page** : le cadre de chaque onglet s'étire jusqu'au bas de la fenêtre et laisse 300 à 500 px vides sous un contenu de 100 à 200 px (Prérequis, Commercial, Résumé).

**À conserver** : l'ordre des onglets et leur contenu ; les trois valeurs de Commercial ; « Prestations figées depuis le devis » ; le sélecteur de statut du prérequis (c'est l'action) ; le bouton Actualiser ; les chiffres exacts du Résumé (28 h 30, 12 tâches).

## Intention

Chaque onglet répond à **une question** en moins de deux secondes, en français, sans texte minuscule, et dit **pourquoi** quand il est vide. R5b reste sur la surface : aucune règle métier, aucune donnée, aucun statut ne change. Aucun onglet ni fonction retiré.

## Hors périmètre

- « Prochaine étape » du projet, étapes de l'offre, acompte (lot dédié, jamais touché ici), préparation Abby, garantie de 30 jours.
- **Sites et pages** (voir question 2) et Production, déjà traitée en R5a.
- Les libellés de la liste ou du formulaire de création (`COMMERCIAL_MODE_LABELS` reste tel quel là où il sert à choisir).

## Approches envisagées

- **A (recommandée) : refonte sur place, onglet par onglet.** Chaque onglet garde sa place et sa fonction ; on corrige tailles, libellés, états vides et mise en page, on partage les libellés. Risque faible, comparable à R3, R4, R5a.
- **B : fusionner Résumé et Commercial en une page « Vue d'ensemble ».** Moins d'onglets, mais retire un onglet visible, contre le principe validé (« aucun écran, onglet ni fonction supprimé ») et deux questions différentes se mélangent. Écartée.
- **C : ne toucher qu'au CSS (tailles, étirement).** Corrige le plancher de 14 px mais laisse jargon, doublons et messages vides muets. Insuffisant.

## Proposition (approche A)

### 1. Cadre commun aux quatre onglets
- Le cadre prend la hauteur de son contenu (fin des 300 à 500 px vides). Une règle de hauteur corrigée à la cause, sans nouveau `!important`.
- Plancher de 14 px partout, libellés en casse normale (fin des capitales espacées), jetons `--aw-*`, un seul style de « chiffre clé » partagé par Résumé, Commercial et Interventions (aujourd'hui trois blocs CSS différents).

### 2. Résumé : « Où en est ce projet ? »
```
Avancement                                     (4 chiffres sur une rangée)
  Temps estimé 23 h 30   Tâches restantes 11   Prérequis manquants 0 ▸   Date cible 14/12/2026

Informations
  Type              Site vitrine          (projectTypeLabel)
  Tarif             Tarif normal
  Créé le           14/11/2026
  Origine           Devis accepté
  Notes             (seulement s'il y en a)
```
- La tuile « Progression » disparaît (déjà dans l'en-tête) ; si tu préfères la garder, dis-le.
- « Prérequis manquants » utilise `projectNowSummary` (une seule définition) et ouvre l'onglet Prérequis au clic.
- Tarif : Normal devient « Tarif normal », Remisé « Tarif remisé », Offert, Partenariat et Interne AtoumWeb inchangés. Libellé d'affichage seulement.
- Cas particulier : si « Temps estimé » est incomplet, on garde la mention « incomplet » existante.

### 3. Commercial : « Combien et pour quoi ? »
```
Valeur commerciale 699 €   Montant contractuel 699 €      (+ « Valeur offerte » seulement si > 0)

Prestations figées depuis le devis
  Site vitrine 5 pages                                   699 €
  Version du catalogue figée
```
- Nom et prix lisibles (14 px minimum), même hiérarchie que le reste de l'application.
- « Écart / valeur offerte » devient « Valeur offerte » et **n'apparaît que s'il est supérieur à 0** (aujourd'hui 0 € partout). Calcul inchangé.
- Message vide qui dit pourquoi : projet interne ou sans devis : « Projet interne : pas de devis, donc pas de valeur commerciale. » ; sinon : « Aucune prestation rattachée à ce projet. »

### 4. Interventions : « Y a-t-il quelque chose à traiter ? »
- **Rien du tout** : un seul message : « Aucune demande ni intervention sur ce projet pour l'instant. » à la place des quatre compteurs et des quatre sections.
- **Au moins un élément** : on n'affiche que les sections non vides (« Demandes · 2 ouvertes », « Interventions · 1 en cours », « Maintenance », « Packs d'heures »), avec libellés français partagés (statut en `StatusPill`, type, couverture, priorité « Haute »). Les quatre compteurs séparés disparaissent : le comptage passe dans le titre de chaque section (fin du doublon).
- Libellés : extraits d'`OperationsPage.tsx` vers un module partagé (`shared/operationLabels.ts`), utilisés par les deux écrans. Aucune valeur de donnée modifiée.
- Actualiser reste, en bouton secondaire discret.
- Limites actuelles conservées (6 demandes, 8 interventions) avec « Voir tout » si la limite est dépassée, à confirmer au plan (aujourd'hui les autres sont coupées sans le dire).

### 5. Prérequis : « Qu'est-ce qui manque encore ? »
```
Prérequis        1 validé sur 4 · 2 manquants        [ ] Seulement ce qui manque
Ajouter un prérequis…                                          [Ajouter]

Prérequis                                         Statut
Logo et charte graphique                          [ Validé        ▾]
Accès à l'hébergement  · facultatif               [ À demander    ▾]
```
- Tableau compact : libellé (et description dessous) à gauche, statut à droite, sur une même ligne.
- Compteur « N validés sur M » : M exclut « non applicable » ; « manquants » vient de `projectNowSummary` (même chiffre que la ligne « En ce moment » et le Résumé).
- Les prérequis non obligatoires portent la mention « facultatif » (aujourd'hui invisible).
- Filtre « Seulement ce qui manque » (local à l'écran, aucune donnée écrite) ; désactivé par défaut. Si tout est validé : « Tous les prérequis sont validés. »
- État vide qui dit à quoi ça sert : « Aucun prérequis. Ajoute ce que le client doit fournir ou valider avant de démarrer. » (formulation à valider, c'est une affirmation sur le sens métier : question 3).
- Statuts en français inchangés (À demander, Demandé, Reçu, Incomplet, Validé, Non applicable).

## Décisions de Carlos (14/11/2026) et suites

1. **Données de test : oui, enrichir.** Fait : `scripts/fixtures/projets-cas-de-figure.json` (les cas) et `scripts/seed-projets-cas-de-figure.cjs` (idempotent, simulation par défaut, `--apply` avec sauvegarde `Sauvegardes-lots\avant-cas-de-figure-projets-*.sqlite`). Appliqué à la préproduction de test (40 éléments, relance sans effet), repère `Workspace\DONNEES-FICTIVES-CAS-DE-FIGURE.json`. Cas : **vitrine** = tout est prêt (prérequis validés ou sans objet, maintenance, pack d'heures, aucune demande) ; **boutique** = il manque des choses (un prérequis de chaque statut dont un facultatif, 3 demandes, 2 interventions) ; **landing** = trop d'éléments et textes longs (6 prérequis, 8 demandes, 9 interventions, libellés très longs). L'état vide complet reste visible sur les captures `captures-r5\apres\` et sera couvert par les tests.
2. **Sites et pages : finition F18**, hors R5b.
3. **État vide des Prérequis : oui, avec la possibilité de dire « reçu ».** Le statut « Reçu » existe déjà dans la liste ; en plus, une ligne « À demander » ou « Demandé » reçoit un bouton **« Marquer reçu »** (un clic, même enregistrement du statut, aucune règle nouvelle).
4. **Tuile « Progression » retirée, « Valeur offerte » masquée à 0 : OK.**
5. **Libellés d'opérations partagés** : question mal posée, reformulée ci-dessous.

## Points tranchés (historique de la fiche d'origine)

1. **Données de test.** Les trois clients n'ont ni prérequis ni intervention, donc je ne peux pas juger les états remplis. Je recommande **d'enrichir les trois clients fictifs** via `seed-clients-fictifs.cjs` (idempotent, sauvegarde automatique avant écriture) : Boutique avec 4 prérequis (1 validé, 1 reçu, 2 à demander dont 1 facultatif), Landing avec 1 demande et 1 intervention, Vitrine avec une maintenance et un pack. L'alternative (jeu de données seulement sur la copie jetable des captures) ne te laisse rien à voir dans la préproduction. OK pour enrichir la préproduction de test ?
2. **Sites et pages** (vide sur les trois projets : « 0 Site · 0 Page », volet de droite « Sélectionne un Site ou une Page » sans rien à sélectionner, bouton `←` sans libellé) : hors R5b par défaut, inscrit comme finition F18. Ou veux-tu un message vide utile dans R5b ?
3. **Texte de l'état vide des Prérequis** et sens de « facultatif » : OK ?
4. **Tuile « Progression » retirée du Résumé** (doublon de l'en-tête) et « Valeur offerte » masquée à 0 : OK ?
5. **Libellés d'opérations partagés** (nouveau module `shared/operationLabels.ts`, `OperationsPage.tsx` modifié pour l'utiliser) : OK, sachant que ce fichier relève de R7 (Gestion) et qu'on n'y touche que pour retirer les définitions locales ?

## Ce que je n'ai pas pu voir

États remplis (prérequis, demandes, interventions, maintenance, packs), noms très longs, fenêtre étroite, clavier, états d'erreur, thèmes AtoumWeb et Blanc, densités Compact et Confort +, un projet réellement avancé.

## Preuves prévues si tu valides

Tests d'abord (libellés d'opérations et de tarif, compteur « N sur M » et filtre, message vide Commercial selon le cas, message unique d'Interventions, cohérence des deux définitions de « manquant »), câblage par lecture du source, typecheck, suite complète, les quatre scripts natifs, galerie sur les trois clients enrichis, captures avant (`captures-r5\apres\`) et après (`captures-r5b\`), budget des petits textes qui doit baisser (fichiers `projects.css` et `ProjectOperationsTab.css`), plan `docs/refonte/plans/2026-11-14-r5b-projets.md`, mise à jour de `docs/refonte/FINITIONS.md` avant le commit, un seul commit local après tes captures.
