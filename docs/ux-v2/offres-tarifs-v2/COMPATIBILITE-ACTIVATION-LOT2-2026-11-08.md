# Lot 2 — compatibilité et activation future — 08/11/2026

Carlos valide la conception graphique et accepte les fonctionnalités dans leur périmètre de recette TEMP. Aucune clôture Git ni mise en service n'est autorisée. Cette note complète les preuves précédentes sans les remplacer.

## Verdict ciblé

Compatible avec le schéma historique dans le périmètre contrôlé : `node scripts/check-offres-tarifs-lot2-legacy.cjs`, **19/19 contrôles Electron**, aucune erreur renderer, aucune capture. Initialisation réelle `DatabaseService.initialize()`, fermeture/réouverture puis même initialisation normale, renderer React/preload/IPC réels sur workspace SQLite TEMP neuf. La migration expérimentale n'est jamais appelée. Ce banc vérifie le chemin normal de base et le bootstrap du renderer, pas l'installateur ou tous les parcours du produit.

Lecture/liste/tableau d'administration, création historique avec mode tarifaire réel explicitement fourni, publication explicite de la fixture, composition non vide et références, nouvelles versions, sauvegarde manuelle et rejet d'un snapshot périmé fonctionnent sans les colonnes de migration 81. Versions publiées inchangées ; sauvegarde et identifiants conservés après redémarrage. Deux brouillons historiques du même article restent présents sans reclassement. Colonnes `last_saved_at`, `save_revision`, `abandoned_at` et table des reçus absentes après utilisation. `foreign_key_check` vide, `integrity_check = ok`. Profil/base TEMP nettoyés par le banc.

Preuve : `outputs/Offres-Tarifs-Lot2-Compatibilite-2026-11-08/VERIFICATION.json`. Premier essai du nouveau banc arrêté sur une faute de nom de méthode (`get` au lieu de `getItem`), corrigée dans la fixture uniquement ; deuxième exécution complète réussie. Aucun correctif applicatif requis. Les résultats antérieurs 74 tests unitaires et 18/24/25 contrôles Electron restent réutilisés, sans campagne générale ni nouvelle capture.

## Sans migration 81

| Fonction | État sur schéma historique |
|---|---|
| Habillage fiche/création, huit onglets, contextes locaux et services des sous-domaines | Conservés ; preuves précédentes réutilisées |
| Création et sauvegarde historiques | Disponibles avec mode tarifaire explicitement choisi ; aucun faux tarif injecté |
| Création nom et type seuls, mode tarifaire NULL | Indisponible et annoncée ; impossible au schéma ancien |
| Mes brouillons et suggestions associées, reprise dédiée exacte | Interface masquée ; lecture des versions et brouillons historiques toujours possible |
| Abandon/restauration et unicité du brouillon opérationnel | Indisponibles ; aucun ancien brouillon reclassé |
| Duplication indépendante avec reçus durables | Masquée/refusée par le service tant que le schéma n'est pas activé |
| Dates réelles de dernière sauvegarde et contrôle de révision monotone | Indisponibles ; aucune date historique inventée. Garde historique par comparaison de snapshot conservée, sans garantie ABA de la révision |
| Idempotence durable des créations/duplications du lot 2 | Indisponible ; ne pas attribuer cette garantie à la commande historique |
| Choix manuels de conflit et gardes enregistrer/poursuivre/abandonner | Composants indépendants du schéma ; la sauvegarde reste soumise aux capacités historiques, sans publication automatique |

## Procédure future — non exécutée, autorisations séparées requises

1. Faire autoriser un inventaire de compatibilité en lecture seule sur la base visée et sur une copie cohérente. Aucun accès de ce type réalisé ici. Identifier schéma, intégrité/FK, versions et références, articles ayant plusieurs versions `draft`. Les dates/numéros ne permettent pas de choisir automatiquement le brouillon à conserver.
2. Si plusieurs brouillons historiques existent : **arrêt de la préparation d'activation**. Fournir inventaire et conséquences à l'utilisateur selon l'analyse des brouillons multiples. Conserver tous les identifiants, contenus et références. Aucune fusion, sélection, scission, reclassification ou mise à l'abandon implicite. Une décision manuelle explicite et son plan de traitement devront être approuvés séparément ; tant que le précontrôle échoue, la migration reste bloquée. Ne pas contourner l'index ou le précontrôle.
3. Après décisions et autorisation appropriées : figer les écritures et fermer les autres processus utilisant la base. Réaliser une **sauvegarde locale cohérente SQLite** via le service/API de sauvegarde existant, WAL inclus dans la vue cohérente ; jamais copier seulement le fichier SQLite ouvert en ignorant son WAL. Conserver version applicative, profil et manifeste/empreintes. Vérifier intégrité/FK de la sauvegarde et tester sa restauration sur une copie isolée avant toute activation. Une sauvegarde distante seule ne suffit pas.
4. Répéter sur une copie TEMP isolée : précontrôle des brouillons, reconstruction transactionnelle, préservation IDs/FK/index/triggers/historiques/snapshots, mode NULL réservé au brouillon incomplet, contraintes commerciales/publication, reçus et révisions. Comparer données et objets, contrôler `foreign_key_check` et `integrity_check`, tester réouverture et restauration. Réutiliser les preuves déjà obtenues, compléter seulement les particularités de la copie autorisée.
5. Préparer et faire approuver **le mécanisme d'activation de production** et son plan d'exploitation : il n'existe pas encore. Le helper actuel refuse les chemins hors TEMP et la migration 81 est exclue de la liste automatique ; ne pas retirer ces protections ni l'ajouter silencieusement au démarrage. Définir arrêt, journal réel, contrôle des capacités et conditions de blocage ; nouvelle autorisation explicite avant toute application réelle.
6. Après autorisation distincte et sauvegarde vérifiée : activation contrôlée, contrôles d'intégrité et de non-altération historiques, redémarrage et smoke-test ciblé. Aucune publication commerciale automatique. Les lots suivants et leurs migrations restent indépendants.

## Retour arrière conservé

Pendant migration : transaction annulée, aucun enregistrement de succès, réglage FK restauré. Les tests TEMP antérieurs de panne et rollback restent valides. Après succès : pas de downgrade destructif des colonnes NULL, reçus ou brouillons. Restaurer ensemble sauvegarde cohérente et code compatible uniquement après décision explicite ; sauvegarder et traiter séparément les écritures postérieures pour éviter leur perte, ou prévoir une correction en avant. Un retour au seul ancien binaire sur nouveau schéma n'est pas un retour arrière fiable.

## Limites et protections

Compatibilité d'une base réelle non affirmée sans inventaire autorisé. Aucun accès utilisateur/Validation-MSI, migration réelle, modification commerciale, commit/push/PR/fusion, travail sur un autre worktree ou lot 3. Registre des 39 décisions maintenu : acceptation graphique/TEMP du lot 2 seulement, extensions des lots suivants toujours partielles/reportées. ZIP du 8 novembre déjà examiné conservé sans remplacement ; cette note et sa preuve sont un complément.
