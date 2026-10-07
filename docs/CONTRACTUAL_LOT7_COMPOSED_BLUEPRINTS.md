# Contrats Lot 7 — Blueprints composés et quantités

## Clôture locale validée — 03/10/2026

AtoumWeb valide le Lot 7 techniquement et autorise le commit local dédié des 27 fichiers, sans push/merge. Code inchangé depuis 479/479 tests, typecheck OK et UI 24/24 ; recette manuelle restant à faire. Validation-MSI demeure au SHA ca5ab5a58af53197662000e0fb9edf27762b0c93cd606e2b49ca9391dde09db5. Les états précédents ci-dessous sont historiques. Le Projet prévisionnel et les révisions relèvent du Lot 7B autorisé séparément, non inclus dans ce commit.

## État actuel — 03/10/2026 — Application réelle terminée

- Feu vert AtoumWeb : **application réelle du Lot 7 uniquement / migration 58**, sans backfill, reconstruction historique, politique/destination commerciale inventée, publication ou objet opérationnel. **Application terminée ; aucun commit autorisé avant validation du bilan réel.**
- Branche `feature/project-page-compositions-v1`, HEAD Lot 6 **5cf67f796941690449fc8661fe956c0ffd3e50d1** inchangé. **27 fichiers Lot 7 attendus**, index vide ; aucun push/merge.
- Empreintes vérifiées : 27 fichiers exacts, 336 sources applicatives et preuves validées **479/479 tests, typecheck sortie 0, UI 24/24**. Le plan d'application couvre 343 sources/fichiers de configuration ; aucun code fonctionnel changé, aucune répétition inutile de suite.
- Manager non démarré. Base initiale **1–57**, SHA **7a54bb9905b16370f3c98f9d0e5dacd88bb38a65cae5b506525e1ea6e86496d4**, sans WAL/SHM/journal. Verrou exclusif acquis et seconde connexion d'écriture refusée ; WAL vide et SHM de verrou 32 768 octets, aucun journal actif.
- Sauvegarde physique immédiatement avant migration sous verrou : `C:/DEV/02_DONNEES/AtoumWeb/Validation-MSI/backups/before-lot7-2026-10-03T21-01-27-408Z.sqlite`, SHA **7a54bb9905b16370f3c98f9d0e5dacd88bb38a65cae5b506525e1ea6e86496d4**, identique au checkpoint initial. Intégrité/FK vérifiées indépendamment en lecture immutable.
- Jeton du plan **61e9e8156b3b20b28b7332584d9a54959b83f1d97022f69db31bde8177c44f4f** recalculé et empreintes revérifiées immédiatement avant le seul changement durable autorisé.
- Migration **58 seule appliquée** : migrations **1–58** présentes ; colonnes `quantity_mode/site_mode` et tables `project_blueprint_plans`, `project_composed_node_bindings`, `project_composed_site_bindings`, `project_composed_prerequisite_sources`. Les **quatre tables sont vides**.
- Seuls les défauts de schéma `once/create` apparaissent sur les **3 anciens liens blueprint** ; aucun mapping AW, règle de quantité ou destination commerciale renseigné. Les anciennes colonnes/valeurs de ces liens sont intactes.
- **112 AW / 112 versions catalogue V1 BROUILLON / 118 clauses BROUILLON / 409 liens intacts / 0 publication contractuelle** ; 44 publications catalogue historiques inchangées. `quote_option_purchases` reste vide.
- Conservation exhaustive des **100 anciennes tables/colonnes/lignes**, hors ligne de migration 58 et nouvelles colonnes techniques autorisées. **DEV-2026-001/002/003**, leurs 2 lignes chacun, les **2 Projets**, leurs Sites/Pages et documents restent exacts ; aucun plan composé historique ni instance contractuelle ajouté.
- `integrity_check=ok`, `foreign_key_check` vide ; rejeu migrations **[]**, aucune modification logique **ni physique**. Checkpoints WAL TRUNCATE réussis, fermeture puis SHA final **ca5ab5a58af53197662000e0fb9edf27762b0c93cd606e2b49ca9391dde09db5** ; aucun WAL/SHM/journal résiduel. Contre-vérification indépendante Python/SQLite read-only immutable réussie contre la sauvegarde.
- XLSX inchangé, SHA **6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8**. Aucun pack/maintenance/intervention, Abby, Bridge, Lot 8 ou 8C.
- Bilan `docs/CONTRACTUAL_LOT7_COMPOSED_BLUEPRINTS.md` ; preuves `application-lot7-validation-msi.md/json`, `contre-verification-lot7.json` et plan dans `outputs/contract-blueprints-lot7` du dossier documentaire partagé.
- **Lot 7 appliqué, non committé. Attendre validation du résultat avant commit local dédié, sans push/merge. Recette manuelle AtoumWeb toujours à faire.** Le mapping `AW → blueprint → rôle → destination → quantité` reste à décider/configurer explicitement et à versionner dans une étape autorisée séparément.

## Historique de préparation locale et simulation validée

Les sections suivantes décrivent la préparation avant autorisation réelle ; leurs empreintes et limites sont conservées comme historique. Le checkpoint d’application ci-dessus fait foi pour l’état actuel de Validation-MSI.

Date : 03/10/2026. **Préparation locale uniquement, non appliquée, non committée.**
Branche : `feature/project-page-compositions-v1` ; HEAD Lot 6 : `5cf67f796941690449fc8661fe956c0ffd3e50d1`.
Autorisation : code, tests, UI et simulation sur copie ; arrêt avant écriture Validation-MSI.
Recette réelle AtoumWeb à faire. Aucun Lot 8 opérationnel, Abby, Bridge ou Lot 8C.

## Constat et changement

Avant : le premier lien de base était choisi implicitement ; les addons enrichissaient surtout l'arbre métier ; seule la base alimentait Sites/Pages. Les quantités de lignes n'expansaient pas les contributions. Les prérequis des composants obligatoires pouvaient manquer ; la copie automatique des prérequis catalogue dans le texte global du devis pouvait laisser des prérequis fantômes après retrait.

Après : la conversion lit les lignes persistées réellement vendues, leurs snapshots et les liens catalogue/blueprint versionnés. Elle compose base, services additionnels et composants inclus obligatoires, puis les lignes d'options achetées du Lot 6. Disponibilité facultative seule : aucune contribution ni prérequis. Aucun rapprochement par nom.

## Modèle retenu et migration 58

Migration additive `sold_blueprint_compositions_v1`, **58**, enregistrée après contrôle du dépôt en migration 57. Aucun SQL 1–57 modifié ; aucun seed/backfill/publication.
- `catalog_project_blueprints.quantity_mode` : `once` (défaut prudent) ou `per_unit`.
- `catalog_project_blueprints.site_mode` : `create` (défaut conservé) ou `extend_base`.
- `project_blueprint_plans` : plan figé des définitions vendues, devis source, SHA-256 et date. Un trigger interdit sa modification.
- `project_composed_node_bindings` : correspondance projet/contribution/unité/nœud modèle → nœud projet.
- `project_composed_site_bindings` : correspondance projet/contribution/unité/clé Site → Site.
- `project_composed_prerequisite_sources` : prérequis existant → sources vendues, sans recréer un deuxième système de prérequis.

Les relations `project_node_sources` existantes sont conservées. Le plan complète leur provenance : ligne, version catalogue, composant, version blueprint, rôle, quantité, politique, unité et relation d'achat exacte. Les Sites sont traçables par leurs bindings ; les Pages par le nœud généré et sa liaison Site.

La migration est exécutée **uniquement en mémoire et sur copie temporaire**. Les nouvelles tables seraient vides dans Validation-MSI après migration : aucun projet historique n'est recalculé.

## Composition et quantités

1. Une contribution provient d'une ligne réelle ou d'un composant obligatoire de son snapshot. Les composants facultatifs disponibles sont toujours ignorés ; leur achat doit avoir sa propre ligne persistée.
2. `once` conserve la quantité vendue en provenance et applique la contribution une fois. Les fractions commerciales sont acceptées.
3. `per_unit` répète la contribution, ses Pages et descendants pour chaque unité entière. Quantité effective d'un composant inclus = quantité de la ligne × quantité du composant. Quantité fractionnaire répétable refusée, jamais arrondie.
4. Garde-fous : 1 à 500 unités par contribution, 10 000 nœuds au maximum. Aucun volume silencieusement tronqué.
5. `create` déclare des Sites propres ; `extend_base` exige une clé Site déclarée explicitement par la base. Aucun choix depuis le libellé, le domaine, l'ordre ou une ressemblance.
6. Les anchors structurels sémantiques compatibles peuvent être partagés. Les Pages répétées et leurs descendants ont des identités distinctes par contribution/unité/nœud source.
7. Une même base/version provenant d'une seule ligne d'offre et de son service inclus représente une structure avec plusieurs provenances. Des bases issues de lignes indépendantes ou de versions concurrentes bloquent la conversion avant écriture.
8. Le choix manuel existant peut remplacer **une seule** base identifiée, avec traçabilité du choix et des bases remplacées. Il ne peut pas contourner plusieurs bases concurrentes. Un modèle choisi sans déclaration Sites/Pages n'emprunte plus silencieusement la structure d'un type de projet ; le fallback historique explicite de l'ancien parcours reste préservé.
9. Si une base répétée possède plusieurs Sites de destination possibles, un addon `extend_base` est bloqué tant que le modèle ne fournit pas une destination unique. Pas de répartition implicite.
10. Deux Accueils ou chemins incompatibles sur un même Site font échouer la conversion transactionnellement. Compteur de Projet et création de dossier sont annulés également.

## Gel, rejeu et manuel

La conversion acceptée fige la définition complète : nœuds, Sites/Pages, contributions, quantité, origine et prérequis. Les rejeux contrôlent l'empreinte et ne relisent pas le catalogue courant pour reconstituer le Projet.
- Rejeu sans changement : zéro doublon et zéro mutation logique des tables.
- Renommage manuel d'un Site/Page conservé.
- Ajout manuel d'une Page conservé ; aucune provenance de vente inventée.
- Page volontairement détachée ou déplacée conservée dans son état.
- Nouvelle conversion d'un devis déjà converti retourne le Projet existant.
- Les Projets historiques sans plan restent sur le chemin existant ; ni l'ouverture ni la migration ne leur attribuent de plan composé.

Les prérequis sont dédupliqués dans leur table existante tout en gardant chaque source. Le texte indépendant renseigné par l'utilisateur dans le devis est conservé ; les prérequis catalogue restent dans les snapshots de lignes/composants vendus, sans copie automatique dans ce texte global.

## UI

La fiche de nœud présente « Préparé depuis le devis » : libellé vendu, base/complément, option achetée, quantité et unité ou contribution unique. Les identifiants complets restent dans les données de provenance, sans encombrer l'écran.
Les nœuds historiques/manuels sans source composée n'affichent aucune origine inventée.
Pas de nouvel éditeur des politiques de liens catalogue/blueprint dans ce lot.

## Vérifications

- **479/479 tests**, 61 fichiers ; **20 tests de non-régression Lot 7**.
- Typecheck sortie 0.
- UI Chromium/React isolée **24/24**, styles chargés et captures inspectées, thèmes Blanc/Noir/AtoumWeb. Aucun preload/IPC/startup Manager ni accès SQLite par l'UI.
- `git diff --check` sans erreur.
- Migration 58 sur copie : comparaison de **100 anciennes tables/colonnes/lignes**, migrations 1–57 exactes ; rejeu des migrations vide.
- Simulation détaillée JSON : provenance complète pour chaque nœud produit ; empreintes de 17 groupes historiques ; aucune création opérationnelle ; `integrity_check=ok` et `foreign_key_check` vide.
- Les 112 AW, 112 versions V1 brouillon, 118 clauses brouillon et 409 liens réels restent intacts. Seules des fixtures synthétiques sont publiées sur copie. Anciennes publications existantes conservées.

## Simulation avant/après

Avant conversion de chaque devis fictif : aucun Projet/Site/Page associé.

| Cas | Après | Résultat |
| --- | --- | --- |
| Vitrine seule | 1 Site / 5 Pages | Base et service inclus, option absente |
| Vitrine + Page supplémentaire quantité 2 | 1 Site / 7 Pages | Deux Pages/descendants distincts |
| Vitrine + Blog | 1 Site / 6 Pages | Blog, tâche et prérequis ajoutés |
| Option seulement disponible | 1 Site / 5 Pages | Zéro contribution/prérequis optionnel |
| Option explicitement achetée | 1 Site / 6 Pages | Ligne persistée et provenance Lot 6 |
| Page x2 + Blog + SEO x2,5 (`once`) | 1 Site / 8 Pages | SEO une fois, quantité conservée |
| Renommage Site et Accueil puis rejeu | 1 Site / 7 Pages | Noms manuels conservés |
| Ajout manuel puis rejeu | 1 Site / 8 Pages | Page manuelle conservée sans provenance fictive |
| Quantité achetée 1 → 3 avant conversion | 1 Site / 8 Pages | Quantité finale seule utilisée |
| Deux lignes de base concurrentes | Aucun Projet créé | Blocage explicite |

Le rapport JSON comporte **11 observations**, dont le résultat intermédiaire avant/après renommage. Chaque conversion nominale rejoue sans mutation. Test complémentaire : base `per_unit` quantité 2 → 2 Sites / 10 Pages.

## Sources réelles intactes

Validation-MSI : `C:/DEV/02_DONNEES/AtoumWeb/Validation-MSI/data/atoumweb-manager.sqlite`.
SHA-256 avant = après : `7a54bb9905b16370f3c98f9d0e5dacd88bb38a65cae5b506525e1ea6e86496d4`.
Migrations réelles **1–57**, `quote_option_purchases` réelle vide, aucun WAL/SHM/journal actif au contrôle.
Le script ne connecte pas la source SQLite : il en fait une copie binaire dont l'empreinte est contrôlée, et n'ouvre que la copie.

XLSX SHA-256 avant = après : `6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8`.
Aucune modification documentaire juridique du classeur.

## Risques, limites et prochaine étape

- Recette manuelle AtoumWeb requise : ces contrôles sur fixtures ne valent pas validation fonctionnelle des vrais devis.
- Les politiques répétables et destinations doivent être configurées explicitement dans les liens blueprint réellement utilisés avant une recette commerciale V1. Les 112 références/clausiers brouillons n'ont pas été publiés ni reconfigurés ; aucune déduction à partir de descriptions du XLSX.
- Les déclarations de chemins répétés doivent rester cohérentes : pas de génération implicite de slug/domaine depuis un nom.
- Le plan est figé : modifier les quantités d'un Projet déjà converti ne recompose pas automatiquement sa structure. Une évolution ultérieure est un acte séparé.
- Les suppressions définitives des nœuds/Sites liés sont protégées par les relations ; la conservation/archivage et le détachement manuel sont privilégiés.
- Aucun pack, abonnement, intervention ou maintenance opérationnelle créé : Lot 8 distinct.
- Aucune application réelle ni commit/push/merge. **Ne pas démarrer Manager sur Validation-MSI : la migration 58 est pendante.**
- Attendre validation du bilan/dry-run puis autorisation séparée d'application réelle du Lot 7.

## Fichiers et preuves

La liste exhaustive des fichiers et leurs empreintes figure dans `fermeture-technique-lot7.json`, hors dépôt.
Répertoire documentaire de résultats :
`C:/Users/AtoumWeb/Documents/ChatGPT/manager atoumweb+ bridge/outputs/contract-blueprints-lot7`.
Preuves : `simulation-lot7.md/json`, `ui-lot7.json`, captures `ui-origins-blanc/noir/atoumweb.png`, `npm-test-final.log`, `typecheck-final.log`, `bilan-lot7.md`, `fermeture-technique-lot7.json`.
