# ATOUMWEB MANAGER — LOT 07 — Passation finale à Codex

**Date :** 14 octobre 2026  
**Statut :** prêt pour la **convergence inter-lots par Codex**, sous réserves clairement identifiées ; **ne pas fusionner dans `main`**.  
**Responsable source :** agent lot 07 (Projets, Sites/Pages, compositions, réutilisation et Bridge).

> **Ce fichier est la référence de passation la plus récente du lot 07.** Le document `LOT-07-PREINTEGRATION-STATUS-2026-10-14.md` correspond à un état antérieur de la PR #116 ; ne pas prendre les anciens SHA/CI de ce document pour le candidat final.

## 1. Candidat GitHub — chaîne de dépendances

Dépôt : `atoumweb-prog/atoumweb-manager`.

| Niveau | PR | Branche / SHA du code certifié | Objet |
|---|---|---|---|
| Socle lot 07 | [#116](https://github.com/atoumweb-prog/atoumweb-manager/pull/116) | `integration/ux-v2-07a-07b-navigation-validation` / `d05ab7d768a55c51374c467ec684c24f7b515bcb` | Socle du travail 07A–07G, issu de PR #111/#114 |
| Convergence du lot | [#145](https://github.com/atoumweb-prog/atoumweb-manager/pull/145) | `integration/ux-v2-07c-07f-convergence-20261014` / `4c82c0778c9f5c6a3b44ecb661c5b2ae2f6bbb23` | Assemblage des correctifs 07C, 07D, 07E et 07F |
| **Correctif final à ajouter** | [#146](https://github.com/atoumweb-prog/atoumweb-manager/pull/146) | `fix/ux-v2-07c-archived-replacement-guards-20261014` / **`dc9294f32e60a7310b6e251068af7768c9dae886`** | Protection des archives de Projets remplacés et compatibilité du lot 8A |

Les PR de développement [#142 — 07C](https://github.com/atoumweb-prog/atoumweb-manager/pull/142), [#143 — 07D](https://github.com/atoumweb-prog/atoumweb-manager/pull/143), [#144 — 07F](https://github.com/atoumweb-prog/atoumweb-manager/pull/144), et [#139/#141 — 07E](https://github.com/atoumweb-prog/atoumweb-manager/pull/141) ont déjà été **recopiées et conciliées dans #145**. **Ne pas fusionner séparément tous ces correctifs sur le candidat final** : cela risquerait de les rejouer. Préférer la composition `#116 → #145 → #146` sur une branche de convergence dédiée.

État de `main` vérifié lors de la passation : `cc0bc679400321f5afacdbee3317ea8acc451518`. Les lots 01 à 03 y sont présents ; socle connu **66 migrations SQLite**. Ni #145 ni #146 n'a été fusionnée dans `main`. Toutes les PR du lot restent en **draft**, en attente d'une validation humaine explicite.

## 2. Preuves GitHub exactes — ne pas confondre SHA de code et commit documentaire

**Code candidat final certifié : `dc9294f32e60a7310b6e251068af7768c9dae886`**, avant le commit documentaire qui publie la présente passation.

- [CI générale Windows **#1753**](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38642010801) : **SUCCESS**, TypeScript OK, **1 063/1 063 tests Vitest**, **109 fichiers**. Tests `ProjectCommercialService` 29/29 ; `ProjectContributionTargets` 57/57.
- [Recette native Electron Windows **#118**](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38642010576) : **SUCCESS, 5/5 jobs** sur ce **même SHA** : atelier composant/UX-01, navigation Projet↔Devis, blueprint et politique de destinations commerciales, réutilisation guidée, Bridge/exports.
- Candidat intermédiaire #145, SHA `4c82c0778c9f5c6a3b44ecb661c5b2ae2f6bbb23` : [CI **#1702**](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38639805293) **SUCCESS**, 1 063/1 063 ; [Windows **#112**](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38639805452) **SUCCESS**, 5/5.
- PR sources : [#142 CI **#1666**](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38636778067), [#143 CI **#1669**](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38637487080), [#144 CI **#1675**](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38638089814) : toutes **SUCCESS** sur leurs SHA respectifs, avant convergence.

Les tests ont tourné sous GitHub Actions Windows avec **bases/fichiers temporaires** et **Electron** ; pas d'accès ni de validation de la base Windows `Validation-MSI`, d'une base client ou d'un véritable WordPress de démonstration.

**Migrations SQLite introduites par cette suite de correctifs : aucune.** Ne pas créer ou renuméroter des migrations 67/69 au nom du lot 07 ; vérifier transversalement la concordance des migrations avec les autres lots avant toute recette sur une base persistante.

## 3. Fonctionnalités livrées et limites exactes

### 07A/07B — Socle Projets et navigation
- Socle Projet, sélection, dossiers commerciaux, garde UX-01, contextes de navigation et travail Sites/Pages couvert par le candidat #116.
- Contrôles réels Electron et tests de retour Projet↔Devis réussis sur le candidat intégré.
- Réserve : exhaustivité de la fiche Projet, recette humaine globale et compatibilité inter-lots à revalider lors de la fusion générale.

### 07C — « Repartir de zéro » sécurisé après révision du Devis
- Prévisualisation **non mutatrice** des conséquences sur Projet, Devis et données liées, avec **empreinte** de revue à confirmer.
- Transaction SQLite unique pour **archiver sans supprimer** l'ancien Projet, créer un Projet prévisionnel indépendant, réaffecter le dossier commercial et produire une nouvelle provenance.
- **Anciens fichiers, Pages, temps, historiques, secrets et exports Bridge conservés**, racine Ressources différente pour le nouveau Projet ; rollback testé sur panne injectée ; empreinte périmée refusée.
- Correctif #146 : ancien Projet archivé **non réactivable**, non synchronisable, **lecture seule**, appels IPC de résolution de conflits et d'affectation refusés. Le **nouveau** Projet reste synchronisable ; les Projets **acceptés/frozen** gardent leur possibilité de **première affectation opérationnelle** conforme au lot 8A.

### 07D — Atelier Page et historique d'ordre
- Annuler/rétablir les **déplacements** de composants, sans changer leurs IDs, versions, réglages ou sources ; vérification optimiste de l'ordre pour refuser un état périmé.
- Historique en mémoire de la session, limité à 40 déplacements, vidé quand la composition change de structure ou de Page.
- **Limite non livrée : Undo/Redo universel, versionné et persistant** pour ajout/retrait, variantes, modifications complètes HTML/CSS/JS et historique des exports.

### 07E — Réutilisation sécurisée
- Contrôle des chemins réels (`realpath`) empêchant le suivi de liens symboliques/jonctions hors package lors de la promotion depuis un Projet vers la Bibliothèque globale.
- Garde UX-01 sur les adaptations non enregistrées : fermeture, navigation, recherche, sélection et versions, avec dialogue natif ; non-régressions Electron Windows.
- Conservation de la source Projet et des versions historiques. Revue humaine de provenance, droits et médias non remplacée par les tests.

### 07F — Bridge / exports Page
- ZIP Page V2, destination Projet/Site/Page et `exportId`, historique des exports **locaux** en SQLite (table existante `project_page_exports`), contrôle des empreintes et de la date du package dans l'interface.
- Affichage honnête **« Package local préparé »** ≠ **« Workbench importé / publié »**.
- **Non certifiés et non livrés** : import/réimport dans un vrai WordPress Divi 4, retours Visual Builder, collisions d'empreintes côté serveur, mapping des occurrences et retour Workbench WP→Manager. **Divi 5 non certifié**. **Pas de publication directe de production avec Bridge 0.8.1.**

### 07G — Recette
- 1 063 tests Vitest + 5 jobs natifs Windows réussis sur **un même SHA de code final**.
- Les **27 scénarios R07G** ne sont **pas tous certifiés en bout-en-bout manuel**. Distinguer tests unitaires / fixtures / Electron réel / WordPress réel.

## 4. Instructions précises pour Codex

1. Partir du `main` validé le jour de la convergence et vérifier les **migrations existantes**, les lots déjà intégrés et les dépendances croisées. Ne jamais écraser une base persistante.
2. Créer une **branche de convergence séparée**, sans modifier ni fusionner directement `main`.
3. Incorporer **une seule fois** les changements du lot 07 dans l'ordre `#116 → #145 → #146`, en traitant les chevauchements avec les lots 04 à 10 et en conservant le comportement d'affectation des Projets acceptés (lot 8A).
4. Ne pas rejouer #142/#143/#144/#139/#141 si #145 est déjà incorporée. Ne pas annoncer les tests antérieurs comme preuve du **nouveau SHA inter-lots**.
5. Valider sur le SHA résultant : TypeScript, Vitest complet, Electron Windows, UX-01, intégrité/FK SQLite sur **fixtures temporaires**, scénarios de remplacement, réactivation interdite et première affectation frozen permise.
6. Réaliser ensuite la recette humaine de navigation, ergonomie, responsive et accessibilité. Pour un véritable parcours Bridge/Divi 4, utiliser exclusivement un **WordPress de démonstration autorisé**, en contrôlant import, rejeu, conflit de hash et état de retour ; ne rien publier sur un site client.
7. Produire le tableau final **scénario couvert / preuve / réservé**, avec SHAs et CI exactes et les décisions humaines restantes, **avant toute proposition de merge `main`**.

## 5. Restrictions de sécurité et décision de clôture

- **Aucune fusion dans `main` sans accord explicite de l'utilisateur.**
- Pas de modification de `Validation-MSI`, des bases client, de la bibliothèque réelle ou des sites WordPress client pendant la convergence.
- Pas de suppression de données sur snapshot Bridge partiel, pas de promotion automatique ni de publication WordPress.
- Ne pas modifier silencieusement les règles de facturation, le statut d'acceptation d'un Devis ni la création Client/Abby.
- **Statut de clôture : « développements et vérifications accessibles au lot 07 terminés, prêt pour convergence Codex ; réserves humaines et WordPress explicitement ouvertes ».**

Ce document est une **passation**, pas une preuve de fusion ni une certification de production.
