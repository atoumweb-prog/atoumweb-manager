# 09 — Pistes d’amélioration et préparation UX V2

**PROPOSITIONS / SUJETS DE RÉFLEXION UNIQUEMENT.** Aucun développement, refactoring, changement de comportement, nouvelle identité graphique ou correction n’est validé par cette publication.

Base de comparaison AtoumWeb : **eb252d5cbd0e95137eafa2b4759fcbcfd7263eda**. Les comportements de HubSpot ne sont pas documentés comme faits dans cet audit : leur étude et leur actualité nécessitent une mission comparative ultérieure.

## Objectif de réflexion

Rendre le Manager plus agréable et efficace au quotidien, en préservant la richesse métier et les règles du [document 07](07-REGLES-METIER-A-PRESERVER.md). Une inspiration externe ne doit pas remplacer snapshots, versions vendues, même Projet, cycles, quotas, provenance ou gardes métier.

| Axe proposé par AtoumWeb | Question à examiner | Limite / invariant |
|---|---|---|
| Navigation compacte par icônes et menus contextuels | Quels accès restent visibles, lisibles au clavier et explicites ? | Icône seule ne doit pas masquer une conséquence métier |
| Favoris et raccourcis | Dossiers, vues ou commandes favorites ; qui les possède ? | Pas raccourci contournant publication/acceptation/ready |
| En-têtes plus légers | Que garder globalement, notamment chrono/contexte ? | Un chrono actif ne disparaît pas par navigation |
| Fiches homogènes et redimensionnables | Panneau rapide, fiche large, fenêtre détachée : mêmes domaines de données ? | Une seule source, sauvegarde et actualisation clairement définies |
| Colonnes personnalisables | Quelles colonnes, quels groupes, quelle persistance ? | Statuts/montants/provenances essentiels ne deviennent pas trompeurs |
| Vues et filtres enregistrés | Préférence locale, workspace, utilisateur ou partage ? | Ne pas dupliquer les données métier dans une vue |
| Formulaires contextuels | Montrer champs pertinents selon prestation/étape sans cacher un blocage | Bilan complet et gardes serveur préservés |
| Informations redondantes | Détail repliable et source unique | Texte commercial et contrat ont des rôles distincts |
| Actions rapides | Action locale, sauvegarde, transition et action irréversible clairement séparées | Finaliser/accepter/publier ne sont pas synonymes |
| Personnalisation transversale | Qui configure layout/densité et quelles valeurs par défaut ? | Aucun reset ne supprime dossier/référentiel |
| Persistance des préférences | Quoi conserver entre sessions/machines ? | Distinguer préférence, sélection et brouillon métier |
| Identité graphique nouvelle | Typographie, couleurs, navigation et accessibilité cohérentes | Palette ne doit pas remplacer badges et règles d’état |

## Priorités proposées à discuter

1. Clarifier les risques et domaines de sauvegarde avant une refonte cosmétique : UX-01, 03, 16, puis critères de finalisation et brouillons Catalogue.
2. Arbitrer doctrine manuelle des cycles, exception de qualification et statuts/reprises.
3. Tracer toutes les commandes critiques avant de les déplacer dans menus/actions rapides.
4. Comparer les patterns HubSpot seulement après identification des besoins Manager, sans promettre un clone ou un périmètre de produit équivalent.
5. Définir des composants/conventions réutilisables là où une duplication/variation est prouvée, pas remplacer toute l’interface par principe.

## Proposition de futur référentiel central

Le dossier présent reste un audit figé et sourcé. Proposition pour un futur référentiel vivant, après validation :

```text
docs/ux/
  README.md
  SCREENS.md
  INTERACTIONS.md
  PARCOURS.md
  CONVENTIONS.md
  ECARTS.md
```

Réutiliser les documents CRM, les bilans contractuels/Projet et les journaux par liens et statut historique ; ne pas créer une deuxième source de règles métier. Les documents validés devront distinguer règle normative, implémentation actuelle et proposition future.

### Identifiants proposés

- SCR-DEVIS-PREPARATION : écran/panneau.
- INT-DEVIS-FINALISER : interaction stable, indépendante du libellé actuel.
- FLOW-PROJET-PREVISIONNEL : parcours.
- RULE-CONTRAT-SNAPSHOT : invariant.
- UX-ECART-003 : écart/arbitrage, conservant historique.

Ces IDs sont des propositions documentaires, pas des attributs déjà ajoutés au code. Un libellé peut changer sans changer l’identité de son effet métier ; un changement de conséquence doit être tracé explicitement.

### Fiche d’interaction proposée

ID, module/écran, contrôle/gestes, préconditions UI et serveur, handler/IPC/service, données/transaction, état métier avant/après, navigation/rafraîchissement, message/erreur, annulation/reprise, règle validée et date, tests/recette, preuve/limite, version source, statut d’écart.

## Mise à jour lors d’un développement futur

Proposition de protocole :

1. Identifier les interactions/invariants touchés avant développement.
2. Vérifier source et décision datée ; ouvrir arbitrage si contradiction.
3. Mettre à jour fiche, schéma et preuve avec le changement.
4. Tester erreurs, double soumission, perte de saisie et non-régression pertinente.
5. Recetter UI sur dimensions/thèmes pertinents, sans copier la base de développement comme oracle.
6. Lier PR, décision, contrôle et écart fermé ; ne déclarer conforme que le périmètre réellement vérifié.

## Contrôles possibles, non développés ici

- Vérifier existence des fichiers/fonctions/IPC référencés dans le référentiel.
- Repérer écrans/handlers nouveaux sans fiche de traçabilité.
- Vérifier que les changements de services gardant états/snapshots/quotas ont des tests adaptés.
- Séparer tests historiques de migrations et cohérence du registre courant ; corriger un vieux banc par conception de fixture, pas par remplacement d’un SHA/comptage Validation-MSI.
- Ajouter recettes d’erreur composite et de contexte/focus ; conservation de saisie et retour des modales.
- Donner statut « à vérifier » quand une preuve expire, quand un banc n’est plus compatible ou quand la recette humaine manque.

## Découpage proposé pour la suite

| Lot de réflexion | Résultat souhaité | Pas une autorisation de |
|---|---|---|
| Inventaire détaillé | Interactions individuelles et états, puis priorités | Corriger en passant ou déclarer 100 % couvert |
| Arbitrages | Décisions sur les écarts prioritaires et règles ambiguës | Réécrire historique/données sans accord |
| Comparaison HubSpot | Patterns, avantages/risques et différences métier sourcés | Développer menus/favoris/personalisation immédiatement |
| Cahier des charges UX V2 | Périmètre validé, critères et séquence de recette | Lancer refonte sans validation humaine |

La prochaine étape est l’analyse de ces documents avec ChatGPT et AtoumWeb, puis un cahier des charges UX V2 avant intervention sur l’application.
