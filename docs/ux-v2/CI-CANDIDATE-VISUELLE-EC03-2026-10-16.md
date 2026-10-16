# Campagne candidate visuelle / EC03 - 16 octobre 2026

Autorisation utilisateur : reutiliser les validations locales et laisser GitHub executer une unique campagne candidate. Aucune recette locale relancee pour cette publication.

Code local deja teste : `ead8a16a684c89f2dbb9ec26763574adec3fb3fe` (typecheck, 1532 tests, 41 commandes natives/structurelles). Les preuves et leurs limites sont dans CLOTURE-PREUVES-2026-10-16.json. Depuis ce code, seules documentation et orchestration de recette changent ; aucune source applicative, assertion, migration, dependance ou timeout ne change.

Le protocole conserve les controles anterieurs (contrats, devis, projets, paquet temporaire, restauration), ajoute explicitement EC01 / Prospect A / Client B / EC03 et les controles visuels manquants. Les deux appels shell et UX-01 en double sont retires du niveau principal : ils restent executes dans baseline-01-03, qui controle aussi les captures. EC03 utilise le hook de test deja existant ATOUMWEB_EC03_ONLY=1, trace dans le manifeste. Aucun nouveau moteur de test metier.

## Couverture des 41 commandes locales

| Preuve locale | Etape CI (ou sous-etape baseline) |
| --- | --- |
| catalogue-native | catalogue-native |
| catalogue-editor | catalogue-editor |
| catalogue-guidance | catalogue-guidance |
| catalogue-associations | catalogue-recommendations |
| prospect-recommendations | prospect-recommendations |
| quote-recommendations | quote-recommendations |
| reuse | guided-reuse |
| composition | composition-native |
| provisional | project-provisional |
| project-operational | project-operational |
| blueprints | blueprints |
| operations | operations |
| billing | billing |
| expenses | expenses |
| documents | documents |
| word | word-review |
| statistics | statistics-settings-backups |
| coverage | coverage |
| preferences | workspace-preferences-and-escape |
| rail | rail-workshop |
| header | header-workshop |
| shell | ec01-shell |
| search | baseline-01-03 / search |
| home | baseline-01-03 / home |
| journeys | baseline-01-03 / journeys |
| crm | baseline-01-03 / crm |
| ux01 | baseline-01-03 / ux01 |
| restore-roundtrip | restore-roundtrip |
| ec03 | ec03-transmission |
| tables | tables |
| panels | panels |
| table-pilot | table-pilot |
| real-help | real-help |
| client-b | client-b |
| prospect-a | prospect-a |
| project-navigation | project-quote-return |
| operational-preview | operational-preview |
| controls | controls |
| icons | icons |
| notices | notices |
| help | help |

## Declenchement et preuve

Branche `codex/convergence-ux-v2-visual-ec03`, base main. Aucun push de cette branche ne correspond aux filtres push des workflows. Une seule ouverture de PR draft declenche CI/quality (Windows 2022, Node 24, npm ci, typecheck, tests complets a deux workers, protocole natif). Le workflow historique UX07AB recoit aussi l'evenement mais tous ses jobs sont exclus par leurs conditions de branche : aucune seconde execution Windows. Aucun dispatch, rerun ni commit vide.

Checkout PR utilise le merge synthetique GitHub : relever HEAD source, base et SHA/arbre de checkout ; comparer au merge-tree local. Les resultats locaux ne certifient pas la CI. Les recettes sont sequentielles et s'arretent au premier echec. Aucun retry ou timeout releve. Aucun artefact distant ajoute (quota de stockage anterieurement sature) ; logs, resumes et manifestes textuels assurent la preuve technique, captures locales conservees pour revue humaine.

Aucune fusion, installation ou migration reelle autorisee. Prospect A et Client B restent valides graphiquement. Sauvegarde SQLite seule : logos et fichiers externes restent hors sauvegarde complete. Archivage des identites Annuaire non expose ; validations externes et recette humaine globale restent distinctes.
