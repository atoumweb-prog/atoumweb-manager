# 03E — Annuaire : exécution et écarts fermés

## Références et portée

Conception [03E](LOT-03E-ANNUAIRE-PARCOURS.md) récupérée dePR82 `0bb0860e` ; pas de nouvelle conception. Branche dédiée `codex/ux-v2-03e-directory` depuis03D `bd406e1c` (#105 draft). Cette validation n'est pas indépendante de03D : le candidat comprend son code. main après102 reste `b2796812` ; seul102 a été fusionné.

## Constat de départ et corrections

| Écart réel | Correction réutilisant l'existant | Preuve permanente |
|---|---|---|
| Éditeurs non inscritsUX-01 | useUnsavedDraft/UnsavedGroup et requestUnsavedExit existants ; sorties/vue/fiche/création protégées, pending bloque, champ désactivé | banc03E : comptes exacts Stay/Discard/pending et identité des nœuds |
| Création identité puis méthodes en plusieursIPC | Commandes Annuaire composant createOrganization/createContact/saveContactMethod dans transaction existante ; jetonUUID et journal anti-rejeu | panne deuxième méthode rollback complet ; réponse perdue après commit→mêmeID au retry |
| Écrasement concurrent | Comparaison des champs d'identité avant écriture sous verrou ; coordonnées existantes rééditées dans leur panneau dédié, pas depuis une copie résolue obsolète | deux écrivains, timestamps identiques, journaux inchangés sur conflit |
| Identité commune modifiable aussi depuis Client/Prospect | saveExisting atomique pour organisation/contact, réutilisé par leurs éditeurs ; checkpoints des créations principales03C conservés | rollback si second owner en conflit, parcours natifs anciens et nouveaux |
| Ajout d'autre contact Prospect multi-appels | Même commande atomique Annuaire et jeton de création, sans conversion | tests service de création/contact/méthodes ; scénarios CRM existants |
| Retour de liste tardif | Génération invalidée au changement de vue/fiche ; identité conservée quand filtre masque sa ligne ; dirty conservé si identité disparue | réponses retardées et erreurs réellement injectées viaIPC |
| Dernière vérification non prouvée | Événement explicite identity_verified dans activity_events ; date/source/fingerprint de l'identité et de tous ses moyens de contact, comparaison avant déclaration | updatedAt inchangé ; coordonnées modifiées signalées sans effacer la date antérieure |
| Vérification avec saisie locale | Refus tant que le registreUX-01 de l'Annuaire contient une saisie/pending ; aucune conversion ou sauvegarde implicite | saisie de téléphone conservée, zéro événement de vérification ajouté |
| Parcours croisés incomplets | Boutons vers IDs réels depuis Client/Prospect ; liens Annuaire→Client/Prospect existants préservés | même Client accepté et même organisation, homonymes sans fusion automatique |
| Largeur non persistée | Storeworkspace01F, clé explicite ; aperçu direct et une écriture en fin de geste, clavier | tests de séparation Client/Annuaire, niID ni brouillon dans préférences |

## Décisions techniques, sans changement de règles métier

E83 : dernière vérification portée par le journal existant, aucune nouvelle colonne. Elle est **déclarée manuellement**, pas calculée depuis updatedAt et pas une certification externe. L'application ne fournit pas une identité d'utilisateur authentifié : la source est « déclaration manuelle dans le Manager », sans auteur nominatif inventé. Le fingerprint contrôle un état, pas une preuve juridique.

E84/E87 : annulations et erreurs conservent texte/IDs. Les créations sont idempotentes via jeton stable ; réutiliser un jeton avec un autre contenu est refusé, sans fusion d'homonymes. E85/E86 : relations et contact principal restent issus des services existants, pas recalculés par un nouveau moteur. Les opérations de conversion restent explicites et inchangées.

Aucune nouvelle commande de suppression/archivage d'organisation n'est inventée. Le schéma possède archived_at, mais l'Annuaire n'exposait pas de commande d'archivage d'identité ; ses règles de disponibilité restent un sujet métier distinct. Archivage Client/Prospect et conservation des références restent disponibles et testés. Ne pas annoncer une fonction d'archivage Annuaire livrée.

## Recette et preuves

Mise au point réelle :199 assertions du banc combiné avant captures supplémentaires (reprend convergence03A–C et125 contrôles Client). dix tests service Annuaire incluant rollback multi-identités, plus unités de préférences. Ce ne sont pas les résultats du HEAD final.

Le banc `check-ux-v2-lot03-validate.cjs` exige un commit propre : typecheck, suiteVitest complète, recettes natives historiques, nouveau parcours03A–E,81 capturesCRM supplémentaires avec vérification du frame composité,216 captures historiques, contrôles SQLite/FK/migrations1–66 et nettoyages. Les injections de panne restent explicitement visibles dansstderr.

À la publication, relever SHA/arbre/manifeste réel etCI : ne pas déclarer un test ignoré réussi. Aucun workflow n'est modifié ; le workflow standard ne remplace pas les recettes Electron locales. Recette humaine finale différée.

## Réserves

Pas de nouvel acteur d'authentification, moteur de détection d'homonymes, fusion d'identités, purge ou synchronisation externe. Aucun nouveau référentiel de catégories, import Catalogue, migration réelle, Bridge ou règle contractuelle. Les futures possibilités de tableaux/vues personnelles ne constituent pas une permission d'enregistrer des données métier dans les préférences.
