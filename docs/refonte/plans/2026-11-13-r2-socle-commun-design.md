# R2 Socle commun : design

Statut : proposition, à valider par Carlos avant tout code (règle J : fiche avant le code, captures avant / après après le code).
Skills : `atoumweb-design` (shape, critique), `superpowers:writing-plans`. Thème Noir, densité Confort (règles A à J).

## Intention

La critique de l'audit a montré que les défauts les plus visibles ne sont pas dans les écrans mais dans ce qu'ils partagent : le tableau, l'en-tête de page, la pastille d'état, les boutons, les petits textes. R2 corrige ces briques une fois, pour que R3 à R9 refassent chaque écran sur une base saine et n'en recopient plus les défauts.

## Objectifs

1. Un tableau qui ne ment pas quand il est vide et dont les en-têtes ne se coupent plus au milieu d'un mot ni ne changent de casse.
2. Un seul modèle d'en-tête de page, sans la puce « SQLite · N migrations ».
3. Une notice de changement d'affichage qui se ferme seule.
4. Une seule apparence de pastille d'état, tirée des jetons.
5. Une action principale jaune par vue : « Fermer », « Annuler », « Retour », « Actualiser » ne sont jamais primaires.
6. Un budget de petits textes qui ne peut plus que baisser, et la correction de `.quote-line small`.

## Hors périmètre

- Aucune donnée, règle métier, ni ordre du parcours.
- Le branchement de `NextStepCard`, `MoreMenu` et `RecordHeader` : R3 et R4.
- La disposition interne des écrans (R3 à R9) et la migration des 200 usages de `primary-button` : chaque lot migre les siens.
- Les thèmes AtoumWeb et Blanc, les densités Compact et Confort + : fin de refonte.
- Le remplacement du bloc `.notice` d'`App.tsx` par `AppNotice` : des scripts natifs lisent `.notice`, à traiter dans un lot ultérieur.
- Le groupe GESTION du rail qui reste replié : R7.

## Anti-objectifs

- Aucun `!important` ajouté, aucune couleur écrite en dur dans un fichier nouveau.
- Aucune nouvelle règle `:has()` pour cacher un défaut : on supprime la cause.
- Aucune couleur de statut décidée sans ton accord sur le tableau (tâche 6).

## Ce que la lecture du code établit

- `ui/DataTable.tsx:47` affiche toujours « Aucun dossier ne correspond aux filtres » quand il n'y a aucune ligne. 11 écrans l'utilisent.
- `ui/table-layout.css` (ligne 8) met `overflow-wrap:anywhere` sur tous les `th` et `td`, et la règle de la ligne 27 le répète sur le libellé du bouton de tri : un mot d'en-tête se coupe n'importe où quand la colonne est étroite. `convergence-visual-consistency.css:17` corrige seulement le Catalogue.
- Les en-têtes en capitales (DÉCISION, OUVRIR, ACTIONS, ÉTAT, FACTURE) sont les colonnes sans tri : elles n'ont pas le bouton de tri et reçoivent le style de `th` hérité. Hypothèse la plus probable, à confirmer par la tâche 2.
- `App.tsx:417` affiche un en-tête générique pour toutes les pages sauf Accueil et Prospection, puis quatre règles `:has()` le masquent (`catalog-workspace-v2.css:2`, `client-list-quick-v2.css:5`, `prospect-visual-pilot.css:52`, `prospection-directory-pilot.css:42`) et les pages Clients, Offres et Prospection dessinent le leur.
- La puce de migrations n'apparaît que dans cet en-tête générique ; le détail des migrations existe déjà dans Réglages (`App.tsx:647`, rubrique avancé et diagnostic).
- Les notices de thème et de densité (`App.tsx:261`, `268`) passent par `setMessage` : aucune échéance.
- `.quote-line small` : `commercial.css:106` (8 px), `ui-typography-consistency.css:142` (14 px), `ui-consistency-v2.css:1402` (12 px, importé après, il gagne).

## Approches envisagées

| | Idée | Pour | Contre |
|---|---|---|---|
| **A (retenue)** | Corriger au cœur des composants partagés, migrer seulement ce qui est nécessaire, poser des garde-fous par tests | Un seul endroit à corriger, pas de dette ajoutée, mesurable | Touche 11 écrans par le même composant : demande des captures avant / après |
| B | Renforcer par des règles CSS globales plus fortes (`!important`, `:has()`) | Rapide | Ajoute exactement la dette que l'audit a relevée (534 `!important`, 490 règles de thème) |
| C | Migrer tous les boutons et pastilles vers `AppButton` et `StatusPill` d'un coup | Résultat propre | 200 + 501 usages dans 97 fichiers : un lot de plusieurs semaines, impossible à relire |

## Décisions déjà prises qui s'appliquent

Un seul assistant de devis (R4), puce SQLite vers Réglages, outils de test repliés (R9), densité et thème uniques pendant la refonte, 14 px minimum, ordre du parcours figé.

## Reste au constructeur

Les clés exactes des statuts (tâche 6, à lire dans `src/shared/contracts.ts`), la liste des écrans qui passent `filtersActive` (tâche 3), la liste des « Fermer » en primaire (tâche 7, révélée par le test).
