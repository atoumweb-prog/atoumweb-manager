# Contrats — Lot 4 : bibliothèque V1, préparation et dry-run

03/10/2026. **Lot 4 appliqué à Validation-MSI après feu vert explicite et fermeture technique : migration 55, 118 versions BROUILLON, 409 liens, aucune publication.** Aucun commit Lot 4, push/merge ou Lot 5. Voir la section finale d'application réelle qui fait foi ; la préparation/dry-run ci-dessous restent historiques. Manager non démarré. Recette manuelle AtoumWeb restant à faire.

## Base et source

Lot 3 committé seul, localement : `1ed1152cc55ada1e8731d09b9f1a6c9832ba4934`, sur `feature/project-page-compositions-v1`. Le message maintient la réserve de recette manuelle avant validation fonctionnelle finale. Working tree propre constaté entre Lots 3 et 4 ; aucune modification Lot 4 dans le commit.

Validation-MSI reste au checkpoint réel Lot 3 : migrations 1–54, SHA-256 `81395f7ea2cd6a5c821100b3e1dc952a238a25523b73c1f32eb7af90fb111f5b`, 112 références AW et versions catalogue V1 brouillon. Aucune activation commerciale supplémentaire.

Source contractuelle : `AtoumWeb_Bibliotheque_Contractuelle_V1_APRES_AUDIT_JURIDIQUE_BROUILLON.xlsx`, synchronisée du 03/10, SHA-256 `6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8`. Extraction déterministe, lecture seule avec openpyxl ; aucun texte nettoyé, normalisé ou reformulé. Empreinte d'extraction : `4b8224816ae527b181d3cc795b5f4efebfef358dd600b7a36f2abc1cb9dd5068`. Les huit documents de `outputs/juridique-v1` sont également contrôlés par empreinte ; leurs dates de recherche restent celles documentées, sans nouvelle vérification juridique implicite.

## Architecture

- Le moteur `ContractTermsService` existant crée les versions initiales BROUILLON, sans pointeur courant publié. Sa création devient composable dans la transaction d'import via savepoint ; publication inchangée et séparée.
- `ContractLibraryImportService` traite exclusivement les codes explicites `AW-* → code clause`. Pas de déduction depuis nom, ordre, contenu, aliases, dépendances documentaires ou références BASE.
- Migration additive **55**, numéro contrôlé après état actuel 54 : colonne nullable JSON de revue/provenance sur les versions existantes et deux tables de journal d'import. Aucun seed, changement de migration 1–54 ou table pour les 44 actions hors clause. Appliquée uniquement en mémoire/copie ; **55 reste pendante dans Validation-MSI**.
- Sources officielles, dates documentées, réserves, paramètres/dependencies documentaires, état rédactionnel, décisions métier et références de cellules sont conservés avec les empreintes du XLSX, extraction/manifeste/payload et documents.
- Revue juridique documentaire distincte du statut `draft/published/retired`, sans nouvelle obligation automatique de visa juriste. Une version au texte modifié ne réutilise pas automatiquement une revue précédente.
- Le Builder affiche les brouillons, sources, réserves et provenance dans la bibliothèque. Il ne les consomme pas dans les devis, même si un pointeur courant est corrompu vers un brouillon. Aucun import déclenché à l'initialisation de l'application ; aucune commande d'application réelle exposée par le simulateur.

## Cible exacte, vérifiée sur copie

| Élément | Résultat |
| --- | ---: |
| Clauses uniques / textes exacts | 118 |
| Versions initiales BROUILLON | 118 |
| Liens explicites AW → clause | 409 |
| Scope base / catalog | 19 / 99 |
| Audience all / professional / consumer | 105 / 3 / 10 |
| Publication / liens catalogue BASE / anomalies | 0 / 0 / 0 |
| Rejeu : créations / versions / nouveaux liens | 0 / 0 / 0 |

`LANDING-GESTION` est seule clause catalogue dormante ; `CONS-RETRACTATION-EN-LIGNE` demeure un contrôle applicatif hors bibliothèque. Les 27 archives et autres aliases ne sont pas importés/migrés.

Suivi éditorial conservé : 42 modifier, 52 inchangé, 22 compléter hors clause, 2 qualifications préalables. Niveaux de revue : 22 vérifiés sur sources officielles, 81 vérifiés avec réserve, 7 incertitudes résiduelles, 7 validations externes recommandées mais non prévues, 1 fonctionnalité à ne pas activer sans nouvelle vérification. Aucun des 16 arbitrages métier n'est rouvert.

## Import contrôlé

Extraction/manifeste JSON dans `data/contracts`. Avant répétition, le simulateur vérifie le XLSX et les huit documents sur disque, puis ouvre la base source avec `readOnly: true` et crée une sauvegarde SQLite coordonnée temporaire. Seule cette copie reçoit la migration 55 et l'import sous `BEGIN IMMEDIATE`.

Le jeton de plan inclut source/manifeste et état catalogue/clauses/journal ; il est recalculé avant écriture. Référence manquante, doublon, conflit de provenance, changement de texte ou rattachement humain, source changée, mauvaise audience ou lien BASE provoquent un refus. Aucun rapprochement/écrasement silencieux d'une clause manuelle préexistante.

Journal sur copie : un passage / 118 entrées, textes et 409 relations exacts. Rejeu strictement sans changement, activité et journal compris. Échec volontaire à la dernière entrée testé : rollback complet des clauses, versions, liens et activités.

Les tables catalogue, anciennes versions, Projets et trois devis `DEV-2026-001/002/003` restent identiques. États accepted/sent/accepted et `historical_missing` conservés. `integrity_check=ok`, aucune violation FK. Empreintes base/WAL/XLSX/documents avant/après identiques. Copie temporaire supprimée après génération des rapports.

## Vérifications et preuves

- Tests ciblés : **59/59**, dont **19 nouveaux tests** d'import ; services contractuel et catalogue, migrations et identité catalogue associés.
- `npm run typecheck` : sortie 0.
- Chromium isolé / IPC simulé : **21/21**, dont chargement de 118 brouillons, cinq niveaux, provenance, 409 relations/dormance et aucune publication indirecte. Ce contrôle n'est pas une recette fonctionnelle sur Validation-MSI.
- Extraction répétée identique au niveau des octets ; aucune modification du classeur.
- Dry-run exhaustif MD/CSV/JSON : `C:\Users\AtoumWeb\Documents\ChatGPT\manager atoumweb+ bridge\outputs\contract-library-lot4\simulation-bibliotheque-v1.*` ; lignes 118 et diagnostics détaillés, références/documents SHA, répétition et conservation table par table.

## Limites / prochaine action

**Attendre le feu vert explicite avant toute application réelle de la migration 55 et de l'import. Ne pas démarrer Manager contre Validation-MSI avant cette autorisation**, car son initialisation pourrait appliquer la migration pendante. Le simulateur n'expose aucune option d'application réelle.

Pas de publication des clauses ou catalogue V1, Lot 5, options vendues, blueprints composés, objets opérationnels, Abby, Bridge ou 8C. Aucun commit Lot 4 ni push/merge. Les réserves juridiques demeurent documentaires ; l'import ne déclare aucune conformité juridique. Une publication ultérieure sera une opération distincte à autoriser et vérifier.

## Fichiers du Lot 4

Nouveaux fichiers :

- `data/contracts/atoumweb-contract-library-v1.json`
- `data/contracts/atoumweb-contract-library-v1-manifest.json`
- `scripts/extract-contract-library-v1.py`
- `scripts/simulate-contract-library-v1-import.cjs`
- `scripts/simulate-contract-library-v1-import.ts`
- `src/main/commercial/ContractLibraryImportService.ts`
- `src/main/commercial/ContractLibraryImportService.test.ts`
- `src/main/database/contractLibraryImportV1Migration.ts`
- `docs/CONTRACTUAL_LOT4_LIBRARY_IMPORT.md`

Fichiers existants adaptés :

- `src/main/commercial/ContractTermsService.ts` : métadonnées et création sous savepoint ; publication inchangée.
- `src/shared/contractTerms.ts` : type des cinq niveaux/documentation de version.
- `src/main/database/migrations.ts` : déclaration additive 55 uniquement.
- `src/main/database/migrations.test.ts` et `src/main/database/catalogIdentityV1Migration.test.ts` : attentes de la dernière migration.
- `src/renderer/commercial/ContractTermsBuilder.tsx` : consultation revue/provenance et compteur des relations.
- `scripts/check-contract-terms-builder-ui.cjs` : bibliothèque V1 en fixture isolée.
- `tsconfig.json` : contrôle du nouveau simulateur.
- `PROJECT_STATUS.md`, `docs/HANDOFF_CODEX_MSI.md`, `docs/MANAGER_BRIDGE_ROADMAP.md`, `docs/CONTRACTUAL_LOT3_CATALOG_IMPORT.md` : état courant et traçabilité de la clôture Lot 3/préparation Lot 4.

Working tree : 21 fichiers Lot 4 prévus, aucun staged ; HEAD inchangé depuis le commit local Lot 3. Les rapports/preuves sont hors dépôt dans `outputs/contract-library-lot4`.

## Application réelle autorisée — 03/10/2026

AtoumWeb valide le dry-run et autorise le Lot 4 réel après suite complète/typecheck verts, sauvegarde physique, contrôle WAL/SHM et empreintes/plan identiques. Cette autorisation remplace l'arrêt avant écriture décrit dans la préparation ci-dessus ; elle n'autorise pas publication, Lot 5 ou commit.

Fermeture : **58 fichiers / 409 tests / 0 échec**, typecheck sortie 0, 21 fichiers Lot 4 attendus, index vide, HEAD local Lot 3 inchangé. Aucun code fonctionnel modifié après ces tests. Helper conservé hors dépôt et répété avec succès sur copie avant utilisation réelle.

Sauvegarde physique immédiate sous verrou exclusif et writer concurrent bloqué : `C:\DEV\02_DONNEES\AtoumWeb\Validation-MSI\backups\before-lot4-2026-10-03T12-37-38-123Z.sqlite`, SHA `81395f7ea2cd6a5c821100b3e1dc952a238a25523b73c1f32eb7af90fb111f5b`. WAL vide, SHM présent, pas de journal actif ; backup intègre. Manager non démarré.

Migration **55 uniquement** et import sous transaction englobante ; ancien SQL/données 1–54 intacts. Empreintes et code revérifiés immédiatement avant import ; jeton recalculé `8f5b0c9b3ba4a08eab134fed6061de13cd32881f295c5ed6ade66c22d1323bff`, identique au dry-run validé, rollback complet prévu au moindre écart.

Résultat enregistré : **118 templates / 118 versions initiales BROUILLON / 409 liens explicites**, scopes 19/99, audiences 105/3/10, **0 published / 0 lien BASE**. LANDING-GESTION seule dormante ; contrôle et anciens aliases exclus. Sources/textes/revues/réserves/provenance exacts, décisions closes. Journal 1 passage / 118 entrées.

Les 112 AW, 112 versions catalogue V1 brouillon et 44 anciennes publiées restent inchangés. Devis DEV-2026-001/002/003, Projets et autres données historiques strictement préservés ; aucune instance contractuelle historique ajoutée, absence historique de snapshot conservée. Builder : 0 clause éligible via publication ; les 118 brouillons ne sont pas utilisés comme clauses publiées.

Après COMMIT, rejeu réel : **zéro modification**, 118 clauses/409 liens conservés, activité/journal inchangés. Intégrité SQLite OK, FK vide, checkpoint WAL TRUNCATE sans blocage. Contre-vérification Python SQLite indépendante sur deux fichiers ouverts mode=ro : **96 tables historiques** vérifiées, textes/métadonnées/liens exacts.

Base avant/backup SHA `81395f7ea2cd6a5c821100b3e1dc952a238a25523b73c1f32eb7af90fb111f5b` ; après checkpoint/fermeture SHA `afaf9b8a7fa196a54dfd29e0fff881b099ad4b1d8bcc2e2da4dd8adc47bf31b8`. XLSX toujours `6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8` ; huit documents juridiques inchangés.

Preuves : `outputs/contract-library-lot4/application-lot4-validation-msi.md/json`, `contre-verification-lecture-seule.json`, logs et attestation dans `fermeture-reelle`. Le dry-run validé est conservé tel quel. **Lot 4 appliqué, non committé ; attendre validation AtoumWeb du bilan réel avant commit local dédié.** Aucun push/merge, publication, activation catalogue, Lot 5, Bridge ou 8C. Recette manuelle AtoumWeb restant à faire avant validation fonctionnelle finale.

### Clôture locale validée — 03/10/2026

AtoumWeb valide le résultat réel et autorise uniquement le commit local dédié **Lot 4 — import bibliothèque contractuelle V1**, sans push/merge. Le commit contenant cette entrée est le checkpoint local du Lot 4 ; son empreinte est fournie dans le bilan de clôture hors dépôt et par `git log -1 --format=%H`.

Les 118 clauses restent BROUILLON, aucune publication contractuelle effectuée ; les 112 versions catalogue V1 restent également BROUILLON. Recette manuelle AtoumWeb à faire avant validation fonctionnelle finale. Lot 5 non commencé ; aucune autorisation pour le commencer.

Contrôle avant clôture : 21 fichiers attendus uniquement, aucun changement fonctionnel après les 409/409 tests et le typecheck validés ; Validation-MSI conserve exactement le SHA `afaf9b8a7fa196a54dfd29e0fff881b099ad4b1d8bcc2e2da4dd8adc47bf31b8` de l'application validée. Aucune réapplication/migration ou ouverture Manager nécessaire pour cette clôture Git.
