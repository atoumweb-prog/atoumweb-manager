# Clôture de l’audit UX/UI V2 et préparation de convergence

Date : 16/10/2026. Branche locale `codex/ux-v2-closure-convergence-audit`. Aucun push, CI hébergée, merge, installation ou accès à des données réelles. **Clôture de l’investigation demandée, pas certification exhaustive de l’application ni autorisation de convergence.**

## Sources et priorité des décisions

67 références du registre original `captures/conformite-globale-20261016/donnees.json`, audit historique au SHA `03693f861c86ad77780d6f400b744cf7761cec15` ; 47 partielles, dix non vérifiées et dix conformes. Référentiel #82 à `0bb0860ee7618af92a53d8711b4a06edbbadc4d6`, revérifié sur GitHub, inchangé. 161 captures historiques de l’audit conservées comme preuves de leur SHA, sans les présenter comme captures nouvelles.

Décisions récentes prioritaires : Prospect A validée, Client B retenue/implémentée, EC03 arbitré puis développé. Variantes abandonnées et suggestions anciennes ne sont pas de nouveaux critères à implémenter. Exemple : une catégorie principale par prestation dans LOT-04B ; associations multiples ≠ catégories multiples. Le numéro historique 07P est rapproché de 07C sans perdre l’identifiant du schéma.

## Résultat des 67 références

**50 conformes dans le scénario borné, 16 preuves insuffisantes, 1 décision métier nécessaire ; aucune anomalie applicative nouvelle confirmée par cette campagne.** Sur les 57 points demandés : 40 conformes, 16 preuves insuffisantes et 1 décision métier. Les dix anciennement conformes ont leur décision conservée et leurs preuves rapprochées du code actuel.

« Conforme » porte sur le scénario nommé, le code et les fixtures effectivement testés. Ce n’est pas une validation juridique, une certification de chaque combinaison de données, une recette humaine globale ou une preuve d’installation chez l’utilisateur. La table de 58 sous-lots a une portée plus large : un diagramme conforme ne suffit pas à clôturer tous les critères d’un sous-lot.

Livrables : [67 références avec sources et limites](MATRICE-67-CLOTURE-2026-10-16.csv), [58 sous-lots](MATRICE-SOUS-LOTS-CLOTURE-2026-10-16.csv), [preuves machine et commandes](CLOTURE-PREUVES-2026-10-16.json), [architecture de sauvegarde](SAUVEGARDE-WORKSPACE-ARCHITECTURE-2026-10-16.md), [ordre Git et CI](CONVERGENCE-VISUELLE-EC03-2026-10-16.md).

## Anomalie technique reproduite et corrigée

À `b77a3ce5`, 19/25 commandes complémentaires réussissent. Six commandes échouent sur **deux attentes de recette obsolètes**, encore figées à 70 migrations : le seam partagé recherche/Accueil/parcours/Statistiques/EC01 et la recette Composition 07A. Les logs précédant l’échec montrent les scénarios terminés (dont EC01 270 états, zéro débordement). Il ne s’agit pas d’un échec du schéma ou des fonctions métier. Les échecs et logs restent sous `outputs/closure-uxv2-20261016/`.

Correctif local `768b32b7f179a659b9631c6989948270a0d55053` : deux remplacements stricts 1–70 → 1–71 dans `scripts/check-ux-v2-lot01a-real-ui.cjs` et `scripts/fixtures/07a-composition-scenarios.cjs`. Même assertion de séquence complète, aucun timeout/test retiré, aucune modification de `src/`, de workflow ou de migration. Le registre des noms et la migration 71 restent contrôlés par les tests de migrations. Les six commandes sont rejouées et réussies sur le correctif.

## Bancs Windows masqués : seconde anomalie de recette corrigée

Trois échecs complémentaires ont été reproduits au SHA 768b32b7 : ateliers 01C et 01D bloqués 120 s, puis test du lien Prochaine action Prospect échoué. Instrumentation TEMP : avant la première capture, BrowserWindow.isVisible() vaut false et document.visibilityState vaut hidden malgré show:true, sous le lanceur windowsHide. L’attente requestAnimationFrame reste suspendue ; une capture de diagnostic réactive le compositor. Le test Prospect passait auparavant avec captures, mais pas sans elles, à cause de ce même préalable caché. Aucune mutation ni perte de brouillon observée.

Contre-épreuve sans changer l’application : win.show() après loadFile, vérification de visibilité avant les tests. Ateliers originaux 66/66 et 126/126, parcours Prospect 96/96 réussis sans retirer d’assertion. Correctif permanent ead8a16a : les fenêtres volontairement visibles sont affichées explicitement, puis leur visibilité est contrôlée ; une assertion supplémentaire est ajoutée. Aucun appel à capturePage ne doit servir accidentellement à débloquer une interaction clavier. Les quatre fichiers de recette modifiés depuis b77a3ce5 sont seuls concernés ; aucun code de production, moteur UX-01, délai ou workflow modifié. Campagne complète de clôture rejouée sur ce second commit.

## Contrôles réellement exécutés

Campagne finale au **SHA `ead8a16a684c89f2dbb9ec26763574adec3fb3fe`**, arbre `995d5ad06b67158dc34769b3dca8f5807054cfe2`, working tree propre pendant les recettes. Un commit documentaire ultérieur ne change pas le code testé ; ne pas prétendre qu’il a fait l’objet d’une nouvelle CI.

| Commande / recette | Résultat | Secondes | Portée |
|---|---:|---:|---|
| typecheck | OK | 30.795 | TypeScript |
| vitest | 1 532/1 532 — 167 fichiers | 231.496 | Vitest complet |
| catalogue-native | OK — 7 contrôles | 1.997 | Electron/React + preload/IPC et services réels, SQLite TEMP |
| catalogue-editor | OK — 109 contrôles | 28.895 | Electron/React réel ; API/IPC métier simulé, aucune base métier réelle dans ce banc |
| catalogue-guidance | OK — 10 contrôles | 0.861 | Electron/React réel ; API/IPC métier simulé, aucune base métier réelle dans ce banc |
| catalogue-associations | OK — 16 contrôles | 1.614 | Electron/React réel ; API/IPC métier simulé, aucune base métier réelle dans ce banc |
| prospect-recommendations | OK — 9 contrôles | 1.000 | Electron/React réel ; API/IPC métier simulé, aucune base métier réelle dans ce banc |
| quote-recommendations | OK — 10 contrôles | 1.161 | Electron/React réel ; API/IPC métier simulé, aucune base métier réelle dans ce banc |
| reuse | OK — 63 contrôles | 11.971 | Electron/React + preload/IPC et services réels, SQLite TEMP |
| composition | OK — 65 contrôles | 9.972 | Electron/React + preload/IPC et services réels, SQLite TEMP |
| provisional | OK — 60 contrôles | 5.419 | Electron/React réel ; API/IPC métier simulé, aucune base métier réelle dans ce banc |
| project-operational | OK — 69 contrôles | 8.325 | Electron/React réel ; API/IPC métier simulé, aucune base métier réelle dans ce banc |
| blueprints | OK — 24 contrôles | 1.500 | Electron/React réel ; API/IPC métier simulé, aucune base métier réelle dans ce banc |
| operations | OK — 108 contrôles | 6.126 | Electron/React + preload/IPC et services réels, SQLite TEMP |
| billing | OK — 85 contrôles | 5.022 | Electron/React + preload/IPC et services réels, SQLite TEMP |
| expenses | OK — 67 contrôles | 4.435 | Electron/React + preload/IPC et services réels, SQLite TEMP |
| documents | OK — 73 contrôles | 4.175 | Electron/React + preload/IPC et services réels, SQLite TEMP |
| word | OK — 70 contrôles | 4.907 | Electron/React + preload/IPC et services réels, SQLite TEMP ; ouverture Word/shell contrôlée, pas de recette Microsoft Word manuel |
| statistics | OK — 59 contrôles | 5.511 | Electron/React + preload/IPC et services réels, SQLite TEMP |
| coverage | OK | 0.096 | Validation structurelle du registre, pas 102 tests fonctionnels |
| preferences | OK — 137 contrôles | 17.175 | Atelier isolé ; IPC préférences/UX-01 réels et SQLite TEMP, pas de mutation métier |
| rail | OK — 125 contrôles | 18.062 | Atelier isolé ; IPC préférences/UX-01 réels et SQLite TEMP, pas de mutation métier |
| header | OK — 167 contrôles | 17.202 | Atelier isolé ; IPC préférences/UX-01 réels et SQLite TEMP, pas de mutation métier |
| shell | OK — 825 contrôles | 42.463 | Electron/React + preload/IPC et services réels, SQLite TEMP |
| search | OK — 93 contrôles | 21.566 | Electron/React + preload/IPC et services réels, SQLite TEMP |
| home | OK — 56 contrôles | 5.937 | Electron/React + preload/IPC et services réels, SQLite TEMP |
| journeys | OK — 68 contrôles | 11.253 | Electron/React + preload/IPC et services réels, SQLite TEMP |
| crm | OK — 76 contrôles | 9.686 | Electron/React + preload/IPC et services réels, SQLite TEMP |
| ux01 | OK — 192 contrôles | 28.559 | Electron/React + preload/IPC et services réels, SQLite TEMP |
| restore-roundtrip | OK — 12 contrôles | 4.119 | Electron/React + preload/IPC et services réels, SQLite TEMP |
| ec03 | OK — 194 contrôles | 32.916 | Electron/React + preload/IPC et services réels, SQLite TEMP |
| tables | OK — 709 contrôles | 46.224 | Electron/React + preload/IPC et services réels, SQLite TEMP |
| panels | OK — 67 contrôles | 7.136 | Atelier Electron/React ; IPC UX-01 réel, données fictives sans SQLite |
| table-pilot | OK — 127 contrôles | 11.513 | Atelier Electron/React ; IPC UX-01 réel, données fictives sans SQLite |
| real-help | OK — 80 contrôles | 11.796 | Electron/React + preload/IPC et services réels, SQLite TEMP |
| client-b | OK — 366 contrôles | 13.816 | Electron/React + preload/IPC et services réels, SQLite TEMP |
| prospect-a | OK — 97 contrôles | 5.635 | Electron/React + preload/IPC et services réels, SQLite TEMP |
| project-navigation | OK — 27 contrôles | 2.930 | Electron/React + preload/IPC et services réels, SQLite TEMP |
| operational-preview | OK — 484 contrôles | 68.075 | Electron et cinq IPC réels ; SQLite TEMP, staging isolé et matérialisation refusée |
| controls | OK — 40 contrôles | 1.123 | Composant Electron/React isolé ; aucune opération de service métier |
| icons | OK — 42 contrôles | 1.449 | Composant Electron/React isolé ; aucune opération de service métier |
| notices | OK — 30 contrôles | 0.695 | Composant Electron/React isolé ; aucune opération de service métier |
| help | OK — 109 contrôles | 30.561 | Composant Electron/React isolé ; aucune opération de service métier |

Durées finales : process Vitest 231.496 s ; durée interne 229.84 s ; fichier des 35 restaurations 11.536 s.

Vitest final : **35/35 restaurations**, **6/6 équivalences binaires**, **28 scénarios EC03**, migrations, rollbacks et absence de doubles mouvements dans les suites métier, **aucun timeout RPC signalé**. Schéma mémoire séparé : **1–71 / 132 tables / intégrité ok / FK vide** ; aucun fichier de base utilisateur ouvert. Leurs durées exactes sont reprises dans les preuves machine et les journaux vérifiés, sans réutiliser les chiffres des campagnes précédentes. Ne pas interpréter une variation de durée locale comme un défaut ni augmenter les délais pour la masquer.

Environnement réellement relevé : Windows local, Node système 24.21.0 ; Vitest 3.2.7 lancé par Electron 44.3.0 / Node embarqué 24.20.0. Le chemin node_modules partagé entre worktrees ne change pas le cwd : les logs identifient bien manager-convergence-final-checks.

Les recettes n’ont pas toutes le même niveau : certaines utilisent la vraie application, preload/IPC et SQLite TEMP ; les ateliers et vues prévisionnelles signalent leur IPC simulé. Le contrôle du registre 10E valide 102 lignes de traçabilité (42 automatisables / 43 partielles / 17 humaines-intégration), **pas 102 scénarios exécutés**. Les erreurs IPC injectées volontairement sont attendues et contrôlées ; elles ne sont pas des réussites silencieuses.

Preuves antérieures distinctes, réutilisées sans les attribuer à la nouvelle exécution : EC03 à b77a3ce5 (1 532 Vitest, 705 contrôles Electron dont bibliothèque/Builder/préparation/Abby), Client B à f85fd498 (384 contrôles B, 400 CRM, 192 UX-01, 824 shell, 109 Prospect, 51 chrono, 79 aides). Les nouvelles recettes ci-dessus actualisent une partie de ces preuves. Pas de nouvelle capture avant/après de conception requise : aucune composition graphique n’a changé pendant cette mission. Les captures anciennes restent liées à leurs SHA.

## État par lot et sous-lot

Les socles des lots 01–10 sont dans main. Les raffinements graphiques et EC03 restent sur la chaîne candidate : ne pas marquer ces changements intégrés ni les promouvoir sur une base réelle.

| Sous-lot | Classement technique de clôture | Reste / réserve |
|---|---|---|
| 01A | preuve insuffisante | Trois thèmes et densités exercés ; pas de certification exhaustive des contrastes, du lecteur d’écran ou des états de chaque écran. |
| 01B | preuve insuffisante | Contrôles composants et aides présents ; l’exhaustivité de tous les états disabled/error/focus dans les 17 modules n’est pas démontrée. Icônes partagées, tailles et actions contrôlées ; revue humaine exhaustive de chaque pictogramme dans chaque fenêtre non effectuée. |
| 01C | conforme | Trois régions CRM et éditeurs montés préservés. Prospect A et Client B validés individuellement, sans généralisation automatique. Modes de panneau et redimensionnement partagés ; préférences visuelles seulement, saisies et identité montées conservées. |
| 01D | preuve insuffisante | 13 tableaux réels × 9 configurations rejoués sur le candidat ; vues/colonnes et identité sélectionnée protégées. Ne certifie pas les très grandes bases réelles. Vues personnelles et données synthétiques testées ; volumétrie extrême et performance des toutes grandes bases réelles non mesurées. |
| 01E | conforme | États des formulaires, pending, conflits et brouillons contrôlés par UX-01 et atelier 01F. Pas d’enregistrement implicite. Rester/Quitter et pending protégés ; Enregistrer et quitter n’est pas une fonction autorisée par cette seule proposition historique. |
| 01F | conforme | Frontières renderer/preload/IPC/services inspectées ; ateliers sans API métier et fixtures réelles distinctes. La capture d’architecture ne constitue pas une nouvelle fonction. Préférences par workspace et états rail/en-tête/bibliothèque indépendants ; redémarrage et propagation aux fenêtres testés. |
| 02A | conforme | Rail réduit/déployé, groupes, favoris, clavier et préférence persistante contrôlés sur TEMP. Option A retenue ; B historique non requise. |
| 02B | conforme | EC01 : 270 états rail/fenêtre/zoom sans débordement ; en-tête et chrono unique conservés. |
| 02C | conforme | 92 contrôles recherche réelle : cibles, réponses périmées, focus et brouillons. |
| 02D | conforme | Accueil indépendant, rail et absence de débordement EC01 contrôlés ; les widgets ne déclenchent pas de mutation métier. |
| 02E | conforme | Recherche et parcours intermodules testés avec identifiants réels de fixtures ; focus/brouillons conservés et retours périmés refusés. |
| 03A | conforme | Matrice CRM et services existants ; ne pas confondre ce constat avec une nouvelle implémentation. |
| 03B | preuve insuffisante | Pipeline 6+1, conversion explicite et preuves contractuelles préservés ; aucune conversion par simple déplacement de carte. Pipeline 6+1 et préférences existantes testés ; tous les raffinements de carte et préférences évoqués historiquement ne sont pas certifiés. Ordre de pipeline et conversion séparés ; conversion explicite avec provenance, aucun doublon par déplacement. |
| 03C | conforme | Prospect A validé graphiquement ; synthèse compacte et trois groupes fermés mais montés conservés sans nouveau dessin. Même décision Prospect A, prioritaire sur les propositions historiques ; doublon supprimé et prochaine action conservée. Fiche rapide/agrandie conserve identité, onglet, brouillon et garde de sortie ; ne pas reconstruire le dossier sélectionné. |
| 03D | preuve insuffisante | Résumé Client B et onglets associés préservés ; toutes les combinaisons de dossiers réels riches ne sont pas recettées ici. Import/remplacement/retrait du logo et persistance de l’association testés ; sauvegarde complète hors SQLite reste EC04 distincte, non résolue. Échéances immédiatement accessibles dans Client B ; données issues des services existants, pas de statuts inventés. Client B espace central élargi retenu par décision récente ; priorité/actions/activité conservées. Client A abandonnée. Boutons/navigation et coordonnées présents ; lancement effectif de tous les logiciels mail/téléphone externes Windows non recetté. Relation Client et température Prospect distinctes, identités communes conservées sans conversion implicite. Huit onglets Client conservés sur une ligne, focus et éditeurs montés ; contrôles 125/150 % disponibles dans Client B. |
| 03E | décision métier nécessaire | Réserve explicite : archivage des identités Annuaire non exposé. Contacts et identités communs préservés ; décider maintien de la réserve ou lot distinct. |
| 04A | conforme | Inventaire existant et 112 références canoniques vérifiés par les tests, aucune nouvelle reprise de données. |
| 04B | conforme | Administration du Catalogue et catégories existantes réutilisées ; édition concurrente et annulation vérifiées. Même Catalogue pour administration, besoins et lignes Devis ; trois parcours de recommandation recettés séparément. Proposition historique multi-catégorie remplacée par LOT-04B : une catégorie principale, plusieurs associations d’offres. Aucun moteur multi-catégorie à créer. Offres principales et classement français inspectés ; administration et références canoniques conservées sans renommer les identifiants. 112 codes et reprise idempotente vérifiés par CatalogImportService.test.ts sur fixture ; aucune nouvelle importation utilisateur. |
| 04C | conforme | Brouillons, versions, publication volontaire et archivage contrôlés ; snapshots vendus inchangés, aucune suppression historique par cette clôture. Liens Catalogue–CGV et sélection explicite conservés ; l’ouverture n’adopte plus implicitement les nouvelles clauses. |
| 04D | conforme | Associations versionnées et ajout volontaire contrôlés ; absence d’ajout/devis automatique et refus des réponses tardives. |
| 04E | conforme | Aides commerciales consultatives distinctes du code technique ; contenu rédigé affiché sans acte d’achat. Conseils Catalogue consultatifs et aide contextuelle recettés, distincts de clauses juridiques publiées. |
| 04F | preuve insuffisante | Publication logicielle testée ; validation juridique des contenus et publication distante non effectuées dans cette mission. |
| 05A | conforme | Audit/versionnement contractuel repris, EC03 documente la compatibilité legacy. |
| 05B | conforme | Bibliothèque contractuelle/version/édition et protections testées ; publication logicielle distincte de la validation juridique humaine. |
| 05C | preuve insuffisante | Sections/types revus et comparaisons explicites testés ; exhaustivité de toutes les combinaisons non certifiée. |
| 05D | preuve insuffisante | Builder, types, sections et EC03 testés ; toutes les combinaisons possibles et la validité juridique des textes ne sont pas certifiées. |
| 05E | conforme | Snapshots et preuves exacts testés ; aucune génération PDF ne doit réactualiser les clauses. |
| 05F | conforme | Cycle EC03 borné testé sur neuf configurations ; textes juridiques et données réelles inchangés. |
| 06A | conforme | États distincts brouillon/préparation/transfert/envoi attesté/acceptation documentés et testés. |
| 06B | conforme | Édition multi-sections, annulation et navigation protégées par le registre UX-01 existant. |
| 06C | conforme | Catalogue et recommandations volontaires, refus des versions brouillon pour les lignes et conservation des snapshots. |
| 06D | conforme | Copie Abby refusée pendant dirty/pending du devis concerné ; reprise après sauvegarde et erreur presse-papiers contrôlées, autre devis non bloqué. EC03 remplace la synchronisation implicite par comparaison/adoption explicites ; ouverture, consultation et PDF sans mutation contractuelle. Aperçu et document transmis liés au snapshot exact et au destinataire figé ; transfert Abby, envoi attesté et acceptation distincts. |
| 06E | conforme | Envoi attesté, révision et acceptation testés ; aucun appel réel à Abby. |
| 06F | conforme | 28 scénarios permanents EC03, 194 assertions Electron dédiées et non-régression UX-01 ; pas de déploiement réel. |
| 07A | conforme | Sources et capacités déjà développées inventoriées ; les limites 07B–07G restent détaillées séparément. |
| 07B | preuve insuffisante | Fiche Projet, opérations et origines testées ; pas de recette exhaustive de tous les croisements des six sections avec ressources anciennes sur ce candidat. Tableau Projet configurable et protections de sélection déjà présents ; aucune action métier au tri. |
| 07C | preuve insuffisante | Services réels testés et vues prévisionnelles à IPC simulé ; compléter la preuve native de bout en bout avant/après signature avec ressources. |
| 07D | preuve insuffisante | Composition native et protections de code local testées ; publication distante, tous les exports et rendu WordPress complet non certifiés. |
| 07E | conforme | Versions techniques, provenance et copie indépendante contrôlées ; aucune modification du Projet source lors de la réutilisation. Réutilisation guidée native : version stable/choisie, copie indépendante, adaptation humaine et absence de mutation de la source testées. Parcours Projet → paquet de travail → bibliothèque technique recetté avec provenance et confirmations UX-01. |
| 07F | preuve insuffisante | Code Bridge, paquets et tests isolés inspectés ; pas de recette sur WordPress/Workbench ou serveur réel. Une publication distante réelle n’est pas autorisée par cet audit. |
| 07G | preuve insuffisante | Ne pas certifier tous les parcours Bridge/publication à partir des seules recettes locales de composition/réutilisation. |
| 08A | conforme | Règles existantes maintenues ; scénarios d’erreur et d’idempotence repris sans nouveau mécanisme de facturation. |
| 08B | conforme | Clôture, projection du débit, erreur/rollback et rejeu contrôlés ; statuts, temps, pack et facturation restent atomiques. Liste, filtres et fiche Intervention testés avec UX-01 ; identifiants et saisies conservés. États et filtres Interventions testés ; tri et sélection ne constituent pas des opérations métier. |
| 08C | conforme | Périodes de date à date et idempotence testées ; découpage des souscriptions historiques conservé. Routine, quota mineur et dépassement distingués dans les services et recettes ; pas de changement de règle de facturation. Scénarios permanents de bornes historiques, checklist figée et non-réécriture réussis sur fixture ; pas de lecture de bases actives. |
| 08D | décision métier nécessaire | Débits idempotents, insuffisances et décisions explicites testés. Toute activation supplémentaire de réouverture/contrepassation nécessite un arbitrage métier distinct. |
| 08E | preuve insuffisante | Instance unique du vrai GlobalTimer préservée ; aucun second chrono métier introduit. Sessions, pauses, corrections et recovery testés sur TEMP. La présence fonctionnelle des 226 temps historiques dans une base quotidienne réelle reste hors de cette mission sans accès aux données réelles. Rattachements Projet des temps et catégories figées testés ; aucune réaffectation historique. Rattachements Intervention et clôture/débit/facturation testés sur TEMP, sans double mouvement. |
| 08F | preuve insuffisante | Intégrité/transactions et clôture actuelles testées ; nouvelles règles de réouverture/contrepassation exclues sans arbitrage. |
| 09A | conforme | Inventaire finance/documents et liens de conservation présents ; aucune écriture réelle. |
| 09B | conforme | Facturation manuelle et preuves testées ; aucune émission réelle Abby n’est revendiquée ni déclenchée. |
| 09C | conforme | Dépenses, justificatifs, versions et protection des saisies testés ; fichiers persistants hors SQLite inventoriés séparément. |
| 09D | conforme | Documents, Contrats, bibliothèque technique et preuves conservent des rôles distincts ; archivage et protections de pièces liés testés. |
| 09E | preuve insuffisante | 70 contrôles natifs DOCX/PDF ont réussi avec frontière shell contrôlée ; aucune ouverture manuelle réelle dans Microsoft Word ni compatibilité de tous les logiciels certifiée. |
| 09F | preuve insuffisante | Recettes 09B/C/D/E réussies sur TEMP ; Microsoft Word et services externes réels restent non certifiés. |
| 10A | conforme | Projections/périodes testées ; le registre 10E conserve explicitement ses couvertures partielles. |
| 10B | preuve insuffisante | Statistiques, périodes, filtres et navigation couverts ; matrice 10E : 42 traces automatisables, 43 couvertures partielles, 17 validations humaines/intégration. Ce ne sont pas 102 cas certifiés. |
| 10C | décision métier nécessaire | SQLite seul sauvegardé aujourd’hui. Logos/documents/ressources et secrets nécessitent le moteur complet proposé, pas implémenté sans accord. |
| 10D | preuve insuffisante | Réglages/recherche/préférences recettés techniquement. Le classement visuel global et la place des données de démonstration restent en recette humaine différée. |
| 10E | preuve insuffisante | 102 lignes de suivi : 42 traces automatisables, 43 partielles et 17 humaines/intégration ; pas 102 recettes exécutées. |

## Registre actuel priorisé

| Priorité | Nature / constat | État et action avant convergence |
|---|---|---|
| P1 | EC04 : sauvegarde SQLite seule exclut logos/documents/ressources | Limite confirmée, moteur inchangé. Architecture livrée ; accord séparé avant développement. Ne pas promettre une sauvegarde complète. |
| P1 | Migration réelle 71 non autorisée | Migrations historiques intactes ; revue du déploiement, copie de sécurité et autorisation avant tout démarrage sur une base réelle. Aucun backfill historique. |
| P2 | Deux assertions natives 1–70 obsolètes après EC03 | Corrigées localement et recettes vertes à 768b32b7 ; publier uniquement après accord. |
| P2 | Fenêtres de recette masquées par le lanceur Windows | Corrigées en test uniquement : affichage/visibilité explicités, assertions de capture et de focus conservées. Aucun changement de la fiche Prospect. |
| P2 | Protocole CI natif ancien ne liste pas tous les nouveaux contrôles EC01/Client B/EC03 | Préparer extension de recette avant publication autorisée ; le workflow commun exécute déjà beaucoup de natifs sur une branche codex/convergence-. Aucun workflow modifié ici. |
| P2 | Archivage des identités Annuaire non exposé | Réserve distincte maintenue ; pas d’ajout implicite de règle ni de suppression d’identité. |
| P2 | Réouverture / contrepassation de pack | Comportement historique/idempotence testé, aucune nouvelle activation ; décision métier distincte si souhaitée. |
| P2 | Épreuves restantes non certifiées | Contrastes/accès exhaustifs, Projet complet avant/après signature, Word réel, WordPress/Bridge distant, volumes extrêmes et temps historiques dans le workspace quotidien : preuves insuffisantes, pas anomalies déduites. Voir chaque référence. |
| Clos localement | EC01 / EC02 / EC03 | Shell sans débordement, Client B et contrat figé à l’envoi : preuves présentes ; pas encore fusionnés dans main. |

## Seules décisions humaines encore utiles

1. Autoriser la publication du candidat groupé et une CI candidate ; ultérieurement autoriser la fusion et sa CI post-fusion. Aucun de ces actes n’est exécuté ici.
2. Fixer les conditions de déploiement/migration réelle 71 ; aucun changement des anciens devis ni du workspace quotidien sans cette étape.
3. Accepter les réserves de périmètre pour la convergence, notamment archivage Annuaire non exposé, absence de sauvegarde workspace complète et preuves externes non certifiées, ou autoriser un lot ciblé correspondant. La recette visuelle globale reste différée comme décidé.
4. Pour les nouveaux chantiers seulement : autoriser le moteur de sauvegarde complet, destination/rétention/chiffrement et portabilité des secrets ; arbitrer toute nouvelle règle de réouverture/contrepassation. Exports Word/Excel généralisés et synchronisation Wi-Fi restent ultérieurs.

Aucune nouvelle décision de conception Prospect A/Client B n’est demandée. Le référentiel et les rapports historiques restent conservés. **Préparation de convergence livrée, avec réserves explicites ; aucune intégration automatique.**
