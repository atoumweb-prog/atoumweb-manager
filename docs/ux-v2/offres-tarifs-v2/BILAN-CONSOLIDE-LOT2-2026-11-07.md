# Lot 2 Offres & Tarifs V2 — bilan consolidé pour revue finale

> Suite à la revue du 08/11/2026 : conception graphique validée et réalisations acceptées sur TEMP. Voir le [complément de compatibilité et activation](COMPATIBILITE-ACTIVATION-LOT2-2026-11-08.md). Le bilan ci-dessous conserve l’état de livraison soumis à cette revue ; aucune clôture Git ni activation réelle autorisée.

Consolidation et reprise du **8 novembre 2026** ; références de développement et captures du **7 novembre 2026**. Le suffixe du nom de fichier conserve la référence du dossier lot 2.

**État : développement et recette TEMP terminés pour le périmètre décrit ; validation globale et clôture du lot 2 encore attendues.** Carlos a validé l'incrément 2 pour son périmètre TEMP et jugé satisfaisantes les trois captures de finalisation. Cela ne vaut ni validation définitive du lot 2, ni autorisation de publication Git, ni migration de base utilisateur.

## Reprise préservée

Avant toute nouvelle modification : branche `codex/ux-v2-offres-tarifs-20261106`, HEAD et suivi distant vérifiés à `57ad50fd41c2de038015b346edae0751c7f8b785`. Inventaire des 39 fichiers locaux déjà modifiés/non suivis et empreintes SHA-256 conservés dans `outputs/Offres-Tarifs-Lot2-Revue-Consolidee-2026-11-07/REPRISE-AVANT.json`. Aucun reset, clean, stash, changement de branche, effacement ou reprise du développement.

La vérification laissée en cours s'était effectivement achevée avec succès : 74 tests ciblés et la recette de persistance à 18 contrôles. Les 24 contrôles de finalisation et leurs trois captures étaient également disponibles. Ces résultats sont réutilisés. La reprise ajoute seulement une option de vérification sans capture au banc de test, une fixture ciblée, le présent suivi et le dossier de revue. Aucun fichier applicatif `src/` préexistant n'est modifié pendant cette reprise ; les empreintes sont comparées en fin de travail.

## Fonctionnalités réellement développées

| Parcours | Réalisation et frontière |
|---|---|
| Fiche et création | Charte Noir/Confort, en-tête, identité, contexte et sélecteur principal de version ; huit onglets conservés. Création guidée sur les champs existants, sans inventer prix, clauses ou fonctions des maquettes. |
| Premier brouillon | Nom et type seuls suffisent sur TEMP migré : article et v1 durables, mode/prix/catégorie/acompte absents si non renseignés. Code canonique facultatif, distinct de l'ID ; les contraintes existantes d'attribution sont conservées. |
| Sauvegarde/reprise | Enregistrement manuel de la même version, `last_saved_at` réel, révision, reprise exacte après fermeture/réouverture de SQLite et du renderer. Aucune sauvegarde ni publication au simple changement d'étape/version. |
| Mes brouillons | Recherche nom/code/catégorie, filtres Offre/Service et première/nouvelle version, vues opérationnels/abandonnés, reprise exacte, suggestions de proximité de nom et de type sans fusion ni interdiction de création. |
| Abandon/restauration | Marqueur réversible, versions conservées en historique. Un seul brouillon opérationnel par article ; restauration refusée s'il en existe un autre. Les compteurs OT-04 excluent les abandonnés. |
| Duplication | Version source explicitement consultée/choisie ; nouvel article et v1 brouillon, IDs indépendants, sans code canonique, historique, utilisation ni publication copiés. Montants et contenus issus de la source choisie, sans recalcul. Catégorie et références recopiées seulement sur choix explicite. |
| Références de duplication | Compositions, recommandations, types de contrat, blueprints et règles commerciales peuvent être recopiés comme références/données existantes, sans cloner les bibliothèques. Leur modification depuis la prévisualisation déclenche un conflit. Les références opérationnelles gouvernant l'activation et les politiques ne sont **pas** clonées : l'interface les indique à reconfigurer avec leurs services existants. Aucun modèle n'est activé. |
| Idempotence/transactions | Reçus durables pour création et duplication ; même intention/même UUID retrouve les mêmes IDs après réponse perdue, intention différente refusée. Transaction commune article/version/références/activité/reçu ; erreur d'insertion = rollback de la copie. |
| Conflits | Comparaison locale/distante et choix explicite par champ. Listes et blocs structurés choisis en entier, sans fusion textuelle automatique. Appliquer les choix modifie la saisie, pas la base ; nouvelle sauvegarde manuelle sous révision. Une nouvelle modification distante provoque un nouveau conflit et conserve la saisie. Les combinaisons invalides restent refusées par les validations métier. |
| Sortie | Enregistrer et poursuivre / poursuivre l'édition / abandonner les modifications. Une sauvegarde échouée bloque la navigation. Les commandes des sous-domaines restent distinctes ; elles sont exécutées avant une sauvegarde parente pouvant remonter leurs composants. Une section déjà sauvegardée n'est pas rejouée si une autre échoue. L'abandon de saisie n'abandonne pas le brouillon persistant. |
| Gardes natives | Fermeture de fenêtre et demande de quitter du Catalogue focalisé passent par le choix explicite quand une sauvegarde est disponible. Le retour IPC n'autorise la sortie qu'après un état propre récent et depuis la frame principale. Enregistrement pending toujours bloquant ; mécanismes existants conservés pour les autres scopes. |
| Catégorie | Libellés clarifiés : « Catégorie du référentiel (facultatif) » établit le lien stable ; « Libellé de catégorie » conserve la saisie historique libre. Modifier ce libellé retire le rattachement local, sans renommer une catégorie du référentiel. Aucun nouveau classement commercial. |

## Vérifications terminées et résultats réutilisés

| Campagne ciblée | Résultat | Réutilisation / complément |
|---|---|---|
| TypeScript | Réussi lors de la dernière vérification achevée | Code applicatif inchangé à la reprise ; pas de relance générale. |
| 8 fichiers unitaires ciblés | **74/74** | Duplication 7, persistance/migration 14, suggestions 2, sortie sauvegardable 9, registre des saisies 12, fenêtres 21, cycle de restauration/quitter 5, handshake natif 4. Résultat final de la cellule interrompue récupéré. |
| Persistance Electron | **18/18** | Création minimale, réponse IPC perdue puis rejeu, recherche/résultat vide, conflit, reprise après réouverture de la base et du renderer, abandon/restauration et intégrité. |
| Finalisation Electron | **24/24** | Source v1 copiée plutôt que v2, indépendance, choix local/distant, aucun enregistrement par application des choix, trois sorties, sauvegarde refusée conservant la saisie, fermeture native, reprise/suggestions sans création ni fusion, source inchangée. Trois captures existantes réutilisées. |
| Complément de reprise Electron | **25/25** | Nouveau changement distant après comparaison : nouvelle révision refusée, saisie conservée, nouveaux choix obligatoires puis enregistrement sous révision à jour. Huit onglets parcourus. Sauvegarde réelle contrat puis version, recommandation puis identité ; liens existants conservés et lignes historiques de devis/projets inchangées. **Zéro capture produite.** |

Le test de duplication à références non vides vérifie les compositions et quantités, recommandations, types de contrat, blueprints et règles ; les IDs de bibliothèques restent les mêmes, les IDs de nouveaux liens diffèrent et la source reste inchangée. Les tests d'échec vérifient l'absence d'article partiel et de reçu de duplication après rollback. Les tests de révision couvrent également le retour aux mêmes valeurs (ABA).

Commandes des vérifications récupérées :

```text
npm run typecheck
node scripts/run-tests.cjs src/main/commercial/CatalogDuplication.test.ts src/shared/unsavedSavePrompt.test.ts src/shared/catalogDraftSuggestions.test.ts src/shared/unsavedRegistry.test.ts src/shared/unsavedWindows.test.ts src/main/restoreQuitLifecycle.test.ts src/main/unsavedSaveExit.test.ts src/main/commercial/CatalogPersistentDrafts.test.ts
node scripts/check-offres-tarifs-persistent-drafts.cjs
```

Complément seul exécuté pendant la reprise :

```text
node scripts/check-offres-tarifs-lot2-final.cjs --review-only
```

Les erreurs IPC de conflit, de réponse perdue et de sauvegarde refusée sont **injectées volontairement** et attendues dans stderr ; les interfaces les traitent et conservent les saisies. Zéro erreur renderer dans les recettes terminées. Le contrôle de syntaxe du banc assemblé est réussi : son fragment de fixture n’est pas un programme autonome (un contrôle isolé de ce fragment ne s’applique pas). Les confirmations sont automatisées/interceptées : pas de revendication d'une recette humaine exhaustive des dialogues Windows ni d'une validation métier générale du CRM. Les nombres de contrôles des campagnes ne sont pas additionnés comme s'il s'agissait de cas tous distincts.

## Migration et intégrité TEMP

Migration expérimentale 81 toujours exclue de la liste automatique au démarrage. Seule sa reconnaissance est ajoutée au registre pour rouvrir les bases TEMP explicitement migrées. Contrôle de chemin mémoire/TEMP, reconstruction transactionnelle, FK/index/triggers conservés, modes NULL limités aux brouillons sans prix, métadonnées de sauvegarde et reçus durables. Publication et utilisation dans un Devis d'une version incomplète refusées. Aucun SQL de migration sur base utilisateur ou Validation-MSI.

Preuves réutilisées de `MIGRATION_TEMP.json` : **44 versions historiques** avec leurs champs conservés, lignes de **140 tables protégées** inchangées, **567 objets existants** index/triggers préservés ; dates historiques inconnues restant NULL. `foreign_key_check` vide et `integrity_check = ok`. Rollback de reconstruction, restauration du réglage FK et rollback lors d'échec du reçu/références testés. Ces comptages décrivent cette fixture TEMP uniquement.

Le complément de reprise aboutit de nouveau à `foreign_key_check` vide et `integrity_check = ok`. Les dossiers de base/profil TEMP sont nettoyés par le banc. Aucune base de recette n'est incluse dans le ZIP.

[L'analyse préalable des brouillons historiques multiples](ANALYSE-INCOMPATIBILITE-BROUILLONS-MULTIPLES-2026-11-07.md) précise les conséquences avant tout traitement : le numéro ou la date d'une version ne prouve pas un abandon. Le blocage est maintenu, sans reclassement, scission, fusion ni abandon automatique. La compatibilité d'une base réelle n'est pas affirmée.

## Registre et limites de validation

Les **39 lignes OT sont conservées**. OT-01/03/12/31/32/33/34/35 portent les réalisations du lot 2, avec les limites de leur périmètre TEMP ; OT-34 conserve les commandes/gardes propres des sous-domaines et ne prétend pas reconstruire leurs assistants métier. OT-04 intègre l'exclusion des abandonnés. Les fonctions des autres lots restent partielles/reportées selon le registre : contrats/associations/production enrichis, promotions, utilisations, catégories à deux niveaux, import/export, actions groupées, reporting, comparaison/PDF et WordPress ne sont pas lancés.

Les suggestions ne sont pas un détecteur exhaustif de doublons ; elles ne bloquent pas une variante commerciale légitime. Les références sensibles recopiées restent à revoir manuellement ; aucun avis juridique ni activation opérationnelle n'est généré. La résolution traite les champs versionnés, pas une fusion automatique des contrats/associations entre services. L'interface Mes brouillons concerne le Catalogue local, sans système de comptes inventé.

Incrément 2 accepté pour développement/recette TEMP, présentation des trois captures de finalisation jugée satisfaisante. **Revue globale du lot 2 encore attendue : aucune validation définitive ni clôture déclarée.** Application réelle, sauvegarde préalable/restauration et toute publication Git exigent une nouvelle autorisation.

## État Git et dossier de revue

HEAD et suivi distant restent à `57ad50fd41c2de038015b346edae0751c7f8b785` sur `codex/ux-v2-offres-tarifs-20261106`. Tous les travaux du lot 2 restent locaux non committés. Aucun commit, push, PR, fusion, action sur un autre worktree ou commencement du lot 3.

L'inventaire exact est fourni dans `FICHIERS-MODIFIES.md` et l'état brut dans `GIT-FINAL.json` du dossier de revue. Les fichiers applicatifs sont regroupés en services Catalogue/Devis, migration expérimentale/registre, IPC/preload/types, fiche/création/brouillons/duplication/conflits, composants de sous-domaines, et mécanismes de saisie/fenêtres. Les scripts/fixtures sont des **sources de tests reproductibles**, pas des bases temporaires.

ZIP de revue : cinq captures existantes (deux persistance + trois finalisation), index HTML, présent bilan, suivi OT, spécification et analyse de compatibilité, résultats JSON et inventaire Git. Chaque capture est indexée avec sa provenance et son empreinte ; Noir/Confort, 1920×1080, zoom 100 %. Aucun profil, secret, base SQLite, cache ou nouvelle galerie.
