# Lot 07E — Bibliothèque technique Projet, variantes et réutilisation AtoumWeb

**Statut : spécification UX V2, confrontée au code Manager `main` le 09/10/2026 ; aucune brique créée/testée par ce dossier.**
Références : [07A audit](LOT-07A-INVENTAIRE-PROJETS-CAPACITES.md), [07D composition](LOT-07D-SITES-PAGES-COMPOSITION.md), [07F Bridge](LOT-07F-BRIDGE-WORKBENCH-PUBLICATION.md), [01E protection des éditeurs](LOT-01E-FORMULAIRES-CONFIRMATIONS.md).

## 1. Deux bibliothèques distinctes — même parcours humain
**Bibliothèque technique du Projet** : contenus, sources, fichiers, extraits et notes propres au dossier ; aide à capitaliser sur un travail réalisé.  
**Bibliothèque AtoumWeb globale** : composants réutilisables, catégories/familles/versions, prêts à être insérés dans plusieurs compositions Pages.  
**Bridge / Snapshot** : données d'observation WordPress et code externe à analyser **avant** de l'ériger en ressource réutilisable.

L'utilisateur peut **référencer → copier indépendamment → adapter → valider humainement → créer volontairement une brique globale**, puis ajouter cette brique dans un Projet/une Page. **Aucune mutation rétroactive du Projet source**, ni publication de code WordPress implicite.

## 2. État du code vérifié
| Source | Présent | À préserver / étendre |
|---|---|---|
| `ProjectTechnicalLibraryService.ts` | Éléments par Projet, catégories, `code/json/text/reference`, versions, marquage `stable`, liens Ressources, archivage. | « Stable » est un **état technique** de version, non garantie qu'un composant Bridge/Divi soit validé pour réemploi. |
| `ProjectTechnicalLibraryTab.tsx` | Liste, recherche, création, version suivante, liaison de ressources, bouton « Préparer pour réutilisation ». | UX de provenance et garde de brouillon ; ouvrir bonne version/Projet source. |
| `ProjectReusePreparationPanel.tsx` | Sélection version, **copie de travail indépendante**, analyse des pièces manquantes, adaptation du nom/catégorie/tags/contenu, case **revu**, création volontaire globale et ouverture. | Empêcher double clic, ne pas afficher « créée » avant retour service, ne pas confondre copie de travail avec brique globale. |
| `ReusePreparationService.ts` | Package source et dépendances, fichiers copiés et manifest versionné ; création `createGlobal` après validation de la préparation/version. | Historiser origine exacte et fichiers absents, sans accès accidentel à des Ressources d'un autre Projet. |
| `ProjectReuseExportService.ts` | Paquet JSON de réutilisation locale avec ressources, écrit dans dossier technique du Projet et référence en Ressources. | Export technique ≠ import autonome dans la Bibliothèque globale ; plusieurs formats/packages doivent être distingués. |
| `AtoumWebCompositionService.ts` et `ProjectPageCompositionPanel.tsx` | Ajout de bibliothèque globale en Page, variantes, source Version ID et modifications locales. | Une adaptation **locale à la Page** ne modifie pas automatiquement le modèle source ; action dédiée « Envoyer variante à la Bibliothèque » si donnée réellement prête. |
| `BridgeSitesPage.tsx` | Observation de module/ressource/divi à partir de snapshots et pistes de réutilisation. | Tout composant observé/partial/dépendant doit rester **à vérifier ou adapter** jusqu'à validation humaine des médias, scripts, styles et droits. |

## 3. Interface cible
- **Zone gauche** : Bibliothèque du Projet, filtres `catégorie / stabilité / recherche / version / avec Ressources`, actions « Ouvrir source », « Préparer pour réutilisation ».
- **Zone centrale** : contenu source versionné, langage, code et pièces, historique de modifications, dépendances et statut de réutilisation ; édition **dans le Projet courant** uniquement.
- **Panneau droit ou assistant guidé** : paquet de travail indépendant, adaptations possibles, prévisualisation, tests/dépendances manquantes, formulaire « Créer la brique globale » avec **case de validation humaine**.
- **Retour global** : la brique créée est ouverte dans la Bibliothèque AtoumWeb avec provenance Projet/version, possibilité de créer une **déclinaison de famille** plutôt qu'une copie anonyme.
- **Depuis Site/Page** : rechercher par catégorie métier/nom/famille, état prêt/à adapter, ajouter une **occurrence** de version ; plusieurs occurrences sont possibles sans écraser la source.

## 4. Chemin de valorisation en six décisions
1. **Choisir** version Projet source exacte : nom/Projet/client si droit d'accès, langue, catégorie, fichiers et état stable.
2. **Préparer une copie indépendante** et vérifier son manifest et tous les chemins ; signaler médias/assets manquants et code potentiellement dépendant de Divi.
3. **Adapter** HTML/CSS/JS/contenu/sélecteurs/dépendances ; ne jamais présenter comme « propre » un simple copier-coller non testé.
4. **Valider humainement** : code, lisibilité responsive, droits sur médias, dépendances et absence de liens/identifiants propres au client source. La case « revu » atteste un geste d'AtoumWeb, pas une certification automatique.
5. **Créer volontairement** le composant global, récupérer son ID/version, ouvrir sa fiche ; **ne pas créer avant confirmation**.
6. **Ajouter en Page** depuis version autorisée, conserver la provenance et les ajustements locaux. Toute future mise à jour globale ne modifie pas silencieusement les Pages anciennes.

## 5. Risques de fuite et d'identité
- Ne jamais promouvoir un **secret, mot de passe, clé API, données Client, photos non autorisées ou chemin local personnel** depuis un Projet vers une brique partagée.
- Les médias et photos de tiers doivent garder origine/droits connus ; avertissement et blocage selon politique de validation humaine avant réemploi public.
- **Projet source** et **package de travail** ne sont pas des composants WordPress publiés ; un Workbench importé ultérieurement reste brouillon.
- Une même famille (ex. modèle de cartes fleuriste) peut proposer plusieurs variantes, sans recopie divergente de la même version canonique.
- Si la brique source change après la préparation, demander un nouvel aperçu/provenance plutôt que d'écrire dans la version sélectionnée en silence.
- Les actions « Archiver » et « Rattacher une ressource » ont conséquences à confirmer, sans supprimer le fichier sur disque si encore référencé.

## 6. Recette prévue (17 tests, non exécutés)
| ID | Scénario | Résultat |
|---|---|---|
| R07E-01 | Créer élément technique Projet | Source et Projet corrects |
| R07E-02 | Créer nouvelle version | Ancienne version et Ressources intactes |
| R07E-03 | Marquer stable | État technique, aucune publication WP |
| R07E-04 | Préparer copie de travail | Fichiers/manifest indépendants |
| R07E-05 | Source manquante | Pièces absentes signalées, pas de promotion trompeuse |
| R07E-06 | Adapter texte/CSS/JS de la copie | Source inchangée |
| R07E-07 | Créer globale sans case revue | Bouton indisponible |
| R07E-08 | Créer globale après revue | Un seul item global, provenance Projet et version |
| R07E-09 | Double clic création globale | Pas de brique double |
| R07E-10 | Ouvrir brique depuis retour | Bon ID/version |
| R07E-11 | Ajouter brique à deux Pages | Deux occurrences locales, même source |
| R07E-12 | Modifier occurrence d'une Page | Deuxième Page et Bibliothèque inchangées |
| R07E-13 | Créer variante fleuriste d'un modèle | Famille et provenance conservées |
| R07E-14 | Suggérer asset média sans droit | Revue/alerte, aucun usage public automatique |
| R07E-15 | Détecter secret ou chemin interne dans source | Pas de promotion non contrôlée |
| R07E-16 | Fermer assistant avec adaptation sale | Garde UX-01 et saisie préservée |
| R07E-17 | Recette 3×3, SQLite/fichiers temporaires | Aucun Projet réel/Validation-MSI modifié |

## 7. Points techniques
**E203** matrice de promotion Projet→global et catégories, **E204** validations dépendances/licences/médias, **E205** révision de la source après copie, **E206** compatibilité du format d'export technique avec Bridge, **E207** garde UX-01 de l'assistant, **E208** gestion de familles/variantes et absence de double item.

**« Prêt à réutiliser » dépend de la validation et des contraintes réelles du composant ; un tag seul ne saurait certifier des dépendances externes.**
