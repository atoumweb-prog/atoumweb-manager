# Lot 5 — Paramètres contractuels du devis et preuves

## Clôture locale validée — 03/10/2026

AtoumWeb valide le résultat réel et autorise un commit local dédié « Lot 5 — paramètres contractuels et preuves », sans push/merge.
38 fichiers attendus, sans sortie générée de simulation, base, sauvegarde ou journal ; les scripts de contrôle/simulation prévus sont inclus.
Le code fonctionnel reste celui des 443/443 tests et du typecheck validés.
Migration 56 appliquée, aucun backfill historique, aucune publication catalogue/contractuelle ni donnée administrative fictive.
Validation-MSI reste à 877192a41131737424fb03e808885c22faa3e876b798f54b7929a672e8459e71.
Recette manuelle AtoumWeb toujours à faire avant validation fonctionnelle finale. Lot 6 non commencé.
SHA et liste exhaustive du commit dans outputs/contract-parameters-lot5/cloture-git-lot5.md/json, hors dépôt.


Date : 03/10/2026. Migration terminée le 03/10 à 18:56 UTC (20:56 Europe/Paris).
Statut : APPLIQUÉ / NON COMMITTÉ / RECETTE MANUELLE ATOUMWEB À FAIRE.

## Fermeture et sauvegarde

- Working tree contrôlé : 38 fichiers prévus Lot 5, aucun fichier staged.
- Branche feature/project-page-compositions-v1, HEAD Lot 4 31e9df44b36f6ca0ad20fd594c904eac7b9aa8fc conservé.
- Aucun code changé depuis les derniers 443/443 tests, typecheck sortie 0 et UI isolée 20/20.
  Aucun changement fonctionnel et aucune nouvelle suite complète inutile.
- Empreintes de 332 fichiers applicatifs et des fichiers du lot contrôlées immédiatement avant application.
- Helper préparé hors dépôt, répété d’abord sur copie jetable avec migration seule. Aucun devis de simulation dans cette répétition ni dans l’application réelle.
- Manager non démarré ; BEGIN EXCLUSIVE, tentative de writer concurrent refusée.
- WAL vide, SHM 32 768 octets (verrous, pas de données durables), aucun rollback journal actif.
- Sauvegarde physique sous verrou, avant migration ; hash identique à la base avant application ;
  backup SQLite intègre et sans violation FK.
- Plan et empreintes base/XLSX/code recalculés avant écriture ; refus automatique au moindre écart.
  Jeton : 7e2ab1e6f4688dca9856a55857b50eadadb50c609f71330116f92c5dc9c9a865.

Sauvegarde :
C:\DEV\02_DONNEES\AtoumWeb\Validation-MSI\backups\before-lot5-2026-10-03T18-56-43-167Z.sqlite

| Fichier | SHA-256 |
| --- | --- |
| Base avant | afaf9b8a7fa196a54dfd29e0fff881b099ad4b1d8bcc2e2da4dd8adc47bf31b8 |
| Sauvegarde physique | afaf9b8a7fa196a54dfd29e0fff881b099ad4b1d8bcc2e2da4dd8adc47bf31b8 |
| Base après commit, rejeu et checkpoint WAL | 877192a41131737424fb03e808885c22faa3e876b798f54b7929a672e8459e71 |
| XLSX avant/après | 6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8 |

## Application et vérifications

Uniquement migration 56 quote_contract_parameters_and_evidence_v1.
Aucune modification des migrations précédentes, aucun import/seed/activation.
Migration et contrôles d’historique sous transaction englobante, rollback si écart avant commit.

| Contrôle | Résultat |
| --- | --- |
| Migrations enregistrées | 1 à 56, sans trou |
| Codes canoniques AW | 112 |
| Versions catalogue V1 | 112 BROUILLON |
| Versions catalogue anciennes publiées | 44, inchangées |
| Templates / versions de clauses | 118 / 118 |
| Clauses BROUILLON / published | 118 / 0 |
| Liens catalogue → clause | 409 exacts, inchangés |
| Liens catalogue → BASE | 0 |
| Instances de clauses historiques | 0 |
| Clause catalogue dormante | LANDING-GESTION uniquement |
| CONS-RETRACTATION-EN-LIGNE | Absente de la bibliothèque textuelle |
| Paramètres structurés réels renseignés | 0 |
| Nouveaux SHA/source sur documents historiques | 0 |
| Relations de preuves / annexes | 0 |
| Administration fictive/configuration ajoutée | 0 |
| DEV-2026-004 créé | 0 |
| integrity_check | ok |
| foreign_key_check | Vide |
| Rejeu migration | Aucune migration, aucune modification des tables ou du fichier physique |

Les 98 tables historiques ont été comparées intégralement, anciennes colonnes et anciennes lignes :
tout est conservé, y compris paramètres/catalogue/prix, clauses/versions/revues/provenance,
409 liens, journal, compteurs, paramètres globaux, Projets et documents.
Seuls le schéma additif et le registre de migration 56 changent.
Contre-vérification indépendante Python/SQLite en lecture seule immutable contre le backup : réussie.
Les 2 Projets sont inchangés ; la table des documents Clients était vide et reste vide.

| Devis réel | Statut inchangé | Paramètres structurés | Snapshot contractuel | Clauses rétroactives |
| --- | --- | --- | --- | --- |
| DEV-2026-001 | accepted | NULL | NULL | 0 |
| DEV-2026-002 | sent | NULL | NULL | 0 |
| DEV-2026-003 | accepted | NULL | NULL | 0 |

## Garde-fous conservés

La configuration administrative n’est pas créée ; le service retourne les huit états missing,
avec valeurs vides. Aucun nom, médiateur, régime TVA, contact ou dispositif RGPD fictif.

Le Builder a zéro socle publié éligible et ne consomme pas les 118 brouillons.
Une lecture pure du contrôle de complétude, avec des paramètres incomplets seulement en mémoire,
retrouve PUBLISHED_BASE_MISSING et les obligations administratives manquantes.
Aucun nouveau devis réel n’a été créé/finalisé pour faire ce contrôle.

La qualification garde ses indicateurs multiples, son motif, sa fourniture/livraison/hébergement ;
les anciens dossiers n’en reçoivent aucun. RSVP minimal et sensible désactivé.
Aucune donnée d’invité ni preuve fictive n’a été stockée.
Le contrôle de rétractation en ligne reste applicatif.

Aucun fichier documentaire métier n’a été importé ou recopié pendant la migration :
la source maître existante et ses références ne changent pas. Le modèle de preuves génériques
et son intégrité ont été vérifiés par les tests isolés, pas par des documents inventés en base réelle.

## Preuves conservées

Dans outputs/contract-parameters-lot5 :
- application-lot5-validation-msi.json : application et contrôles complets.
- contre-verification-lot5.json : comparaison indépendante en lecture seule.
- fermeture-reelle/controle-code-exact-lot5.json : état exact des sources et preuves de tests.
- fermeture-reelle/plan-application-lot5.json : plan/jeton validé.
- fermeture-reelle/application-helper-rehearsal.json : répétition sur copie supprimée ensuite.
- npm-test-lot5.log, typecheck-lot5.log, ui-lot5.json : contrôles validés avant application.
- simulation-lot5.md/json et verification-lot5.json : historique du dry-run, conservé sans réécriture.

Les empreintes et le schéma 55 des anciens fichiers de dry-run décrivent l’état AVANT application.
Le présent bilan et application-lot5-validation-msi.json décrivent l’état réel APRÈS migration 56.

## Arrêt

Application Lot 5 terminée, aucune publication, aucun commit/push/merge.
Attendre la validation AtoumWeb du bilan réel avant commit local dédié Lot 5.
Recette manuelle toujours à effectuer avant validation fonctionnelle finale.
Aucun Lot 6, Abby, Bridge ou 8C.


# Préparation et dry-run — historique conservé avant application réelle

Date : 03/10/2026. Statut : implémentation locale et simulation terminées, application réelle non autorisée.
Recette manuelle AtoumWeb à effectuer avant validation fonctionnelle finale.

## Périmètre et checkpoint

Branche : feature/project-page-compositions-v1.
HEAD local conservé : 31e9df44b36f6ca0ad20fd594c904eac7b9aa8fc (Lot 4).
Aucun commit Lot 5, push, merge, publication, travail Abby/Bridge/8C ou début de Lot 6.
Le contrat reste intégré au devis ; aucune entité contrat autonome.

Validation-MSI est restée en migration 55. Manager n’a pas été démarré sur cette base.
Migration 56 exécutée uniquement en mémoire et sur sauvegarde SQLite temporaire.
Les documents juridiques et le classeur contractuel sont inchangés.

## Schéma additif proposé

| Emplacement | Donnée | Historique |
| --- | --- | --- |
| quotes.contract_parameters_json | Paramètres structurés, schemaVersion 1 | NULL pour tous les devis préexistants, sans backfill |
| quotes.contract_snapshot_json existant | Snapshot enrichi schemaVersion 2 à la finalisation d’un nouveau devis | Ancien JSON conservé exactement, y compris snapshot vide figé ou absence historique |
| client_documents.sha256 / imported_from | Empreinte et chemin source de chaque nouvel import | NULL pour les anciens fichiers ; aucune empreinte inventée par migration/ouverture |
| quote_document_links | Relations génériques append-only : rôle, document ou fichier prospect, empreinte, dates/provenance, déclaration d’acceptation, remplacement | Table initialement vide |
| settings existant, clé contract-administration-v1 | Informations administratives et états filled / missing / not_applicable / verify | Aucun seed, valeurs réellement manquantes par défaut |
| activity_log existant | Sauvegardes, attestations, rattachements et remplacements | Événements explicites |

Migration nouvelle 56 : quote_contract_parameters_and_evidence_v1.
Les migrations SQL 1 à 55 ne sont pas modifiées ; le registre ajoute seulement 56.
Aucune clause ni version catalogue n’est créée/publiée par cette migration.

Les preuves disposent d’une seule relation générique, avec rôles accepted_pdf, withdrawal_form,
early_request, early_acknowledgement, acceptance, data_processing, rights, licenses, image_permission, other.
La FK document préserve les documents Clients. Pour un prospect, la copie maître reste dans
Interne/preuves-devis/<quoteId> du workspace existant, avec chemin relatif et SHA ; aucun Client anticipé.
Une attestation opérateur d’acceptation porte sa déclaration, la date réelle et la provenance ; elle ne prétend pas être un PDF signé.

## Avant / après

| Situation | Avant Lot 5 | Implémentation locale Lot 5 |
| --- | --- | --- |
| Nouveau devis | Audience et acompte simple ; informations surtout libres | Préparation structurée incomplète par défaut, acompte par défaut, contrôle de complétude |
| Finalisation | Gel des clauses déjà sécurisé au Lot 1 | Gel transactionnel des clauses et du dossier contractuel complet, refus si incomplet |
| Devis historique | Snapshot existant ou absence explicite | Inchangé : aucune qualification, annexe, garantie ou clause rétroactive |
| Acceptation d’un nouveau devis | Action de statut | Preuve explicite requise et tracée, jamais acceptation par silence |
| PDF accepté | Document Client et pointeur sur le devis | SHA, vérification d’ouverture, chaîne des remplacements conservée, suppression définitive interdite |
| Annexes | Documents Clients | Relations par rôle au devis, fichiers prospect possibles avant création du Client |
| Version catalogue reçue directement par service | L’UI sélectionnait les versions publiées | Le service refuse aussi les versions brouillon/inactives, sans activer les 112 V1 |

Les nouveaux paramètres se saisissent dans Devis > dossier du devis > Conditions >
Préparation contractuelle. L’administration globale est explicitement séparée des paramètres figés.
Un ancien dossier affiche son absence historique. Le formulaire et son bouton d’enregistrement
disparaissent ou deviennent non éditables au gel.

## Paramètres réellement structurés

- Audience professionnel/consommateur ; canal distance/hors établissement/en établissement/autre,
  contexte et finalité. Vérification explicite du parcours hors établissement et de l’éventuelle
  extension au professionnel, sans qualification automatique.
- Acompte/arrhes ; échéance initiale ; échéanciers 100, 30/70, 30/40/30 ou personnalisé ;
  pourcentage, date ou événement objectif de chaque échéance ; montants calculés et figés au centime.
  La dernière échéance absorbe l’arrondi. Les pourcentages personnalisés sont entiers, conformément
  à la colonne d’acompte existante. Pas de second champ d’acompte divergent.
- Conditions B2B distinctes : échéances convenues, délai particulier explicite éventuel,
  doctrine trois fois le taux légal et indemnité 40 euros. Ces champs sont absents des paramètres consumer.
- Jalons d’exécution datés.
- Qualification numérique multidimensionnelle : contenu numérique, service numérique, service classique,
  combinaison/mixte, fourniture ponctuelle/continue, livraison, hébergement, services associés et motif.
- Garantie par ligne : petit ajustement 30, développement WordPress 60, application métier 90 jours,
  ou non applicable explicitement choisi ; événement de départ objectif ; maintien des droits légaux.
- Validation explicite, aucun effet du silence ; preuve reçue au dossier.
- Évaluation explicite des besoins de droits et renouvellement, même lorsqu’ils sont non applicables.
  Usages, durée, territoire, livraison des sources et exclusivité ; période, préavis, résiliation, restitution ;
  mode renouvellement exprès ou mensuel sans engagement.
- B2C : informations remises, qualification de la rétractation et justification,
  formulaire, destinataire, demande et reconnaissances de commencement anticipé documentées,
  médiateur, contrôle de rétractation en ligne vérifié ou non applicable avec justification.
- Annexes requises et sélection de leur pièce par rôle.
- RSVP minimal ; donnée sensible toujours désactivée ; route directe traiteur possible ;
  description des rôles réels sans attribution par défaut.
- Administration : identité, mentions administratives, TVA, réclamations, médiateur,
  destinataire de rétractation, prestataires/hébergeurs et dispositif RGPD ; états explicites, aucune fiction.

La validation IPC refuse les champs inconnus, notamment un payload de données d’invités,
une activation sensible RSVP ou une acceptation par silence.

## Contenu du snapshot et immutabilité

Le snapshot conserve les lignes complètes, codes AW et identité/version réellement sélectionnée,
snapshot catalogue de chaque ligne, quantités, mode tarifaire, prix et ajustements, total, échéancier
avec montants, paramètres, audience/canal/qualification, garanties, adaptations, configuration
administrative, clauses exactes et versions, annexes et preuves disponibles, horodatage commun
de compilation/finalisation.

Les modifications ultérieures du catalogue, des clauses et de la configuration ne recalculent pas
le snapshot. Les paramètres sont verrouillés au gel. Une preuve reçue après finalisation
s’ajoute au dossier avec ses dates, sans réécrire le snapshot initial.

Une duplication ouvre un nouveau devis à préparer : elle ne copie pas les preuves d’acceptation
ni un gel antérieur. Les paramètres sont à confirmer à nouveau.

Le chemin historique NULL reste explicitement compatible avec les anciens dossiers.
Les scénarios DEMO déjà existants restent des exemples distincts : leur préparation est
explicitement absente avant finalisation, sans fausse administration globale ni fausse preuve.
Ce chemin n’est pas proposé aux nouveaux devis réels dans l’interface.

## Preuves et intégrité

Chaque nouvel import calcule son SHA-256 sur la copie conservée. L’ouverture vérifie le fichier
et l’empreinte du document et de son rattachement. Un fichier manquant/modifié est signalé
et refusé à l’ouverture/rattachement. Les annexes requises sont vérifiées avant gel.

Le remplacement du PDF actif nécessite une confirmation explicite et un motif tracé.
Le pointeur actif change atomiquement avec son lien ; l’ancien reste rattaché et protégé,
y compris lorsqu’il est archivé. Réactiver implicitement un ancien PDF déjà remplacé est refusé.
Les IPC de rattachement PDF passent par le même service de mise à jour atomique.

Pour un PDF historique non empreinté, l’ouverture ne calcule aucune preuve historique en base.
Une empreinte peut être constatée lors d’un rattachement/remplacement explicite ; sa provenance
indique qu’elle ne certifie pas l’intégrité passée.

L’archivage conserve fichier et liens ; la suppression définitive d’une pièce utilisée comme
preuve actuelle ou historique est interdite.

## Données qui restent externes et limites

- La complétude technique ne constitue jamais une validation juridique. La qualification du cas
  numérique/B2C/hors établissement, les obligations effectivement applicables et la réalité du
  montage restent à vérifier ; les réserves documentaires existantes sont conservées.
- Identité/TVA/médiateur/contacts/formulaire et dispositifs réels ne sont pas renseignés artificiellement.
  Les contrats Clients/fournisseurs, clauses article 28, sous-traitants, localisation, conservation,
  restitution/suppression et autorisations restent des informations/annexes à fournir.
- CONS-RETRACTATION-EN-LIGNE reste un contrôle applicatif, hors bibliothèque textuelle.
  Le Lot 5 ne développe pas une fonctionnalité publique de rétractation : état non configuré bloquant
  dans les contextes concernés, validation opérateur et justification nécessaires.
- Les garanties conservent l’événement convenu ; le suivi de sa survenue réelle et la gestion des
  demandes ne sont pas un nouveau moteur opérationnel dans ce lot.
- SHA-256 détecte un changement du fichier de référence ; ce n’est pas une signature électronique,
  une vérification de l’identité du signataire, un horodatage qualifié ni un archivage probatoire certifié.
- Les preuves prospect restent dans le dossier maître du devis après conversion ; elles sont
  accessibles depuis le devis lié au Client, sans déplacement automatique ni duplication physique.
- L’import d’une pièce puis son rattachement sont distincts de la validité juridique de son contenu.
  Une erreur de rattachement peut laisser une pièce importée non liée : elle reste identifiée dans
  les documents Client ; aucune suppression silencieuse.
- Aucun parseur automatique du formulaire, de l’accord RGPD ou d’un PDF accepté n’affirme leur conformité.
- Les 112 versions V1 et 118 clauses restent brouillon. L’activation commerciale/contractuelle
  requiert une décision séparée. Aucun Lot 6 implicite.
- Recette visuelle/fonctionnelle réelle AtoumWeb encore à effectuer. Les contrôles UI utilisent
  Electron isolé et IPC simulé, pas Validation-MSI.
- Ne pas lancer Manager sur Validation-MSI avant autorisation séparée : son démarrage appliquerait 56.

## Vérifications finales du code local

| Contrôle | Résultat |
| --- | --- |
| npm test | 59 fichiers, 443 tests, 0 échec |
| Nouveaux cas Lot 5 | 34 tests |
| npm run typecheck | Sortie 0 |
| Interface Electron isolée | 20/20, 0 échec ; champs B2C/B2B, échéancier, RSVP, gel/historique, trois thèmes |
| Simulation migration 56 | Copie temporaire uniquement, rejeu sans modification |
| Historique après migration | 98 anciennes tables / anciennes colonnes et lignes préservées |
| integrity_check sur copie | ok |
| foreign_key_check sur copie | vide |
| Sources réelles | SHA avant/après identiques |

Les fixtures de cycle de vie existantes ont été rendues explicitement complètes, uniquement dans
les tests. Les anciens tests de migrations construisent leur fixture sur le schéma historique,
sans invoquer un service qui nécessite le schéma courant. SQL historique inchangé.
Les publications dans les tests ne concernent que des clauses synthétiques sur SQLite mémoire ;
aucune publication dans Validation-MSI ni sur sa copie de simulation.

## Dry-run et impact exact du nouveau devis

Rapports : outputs/contract-parameters-lot5/simulation-lot5.md et simulation-lot5.json,
dans le dossier documentaire partagé.

La seule base writable est une sauvegarde SQLite sous le répertoire temporaire du système ;
la base source est ouverte read-only. Le script refuse une source dont le hash diffère du
checkpoint Lot 4 ou un WAL source non vide. Il n’expose aucun mode d’application réelle.
La copie est supprimée après fermeture.

Migration 56, sans backfill ; toutes les anciennes lignes/colonnes conservées lors de migration.
Puis création d’une organisation et d’un prospect de test, DEV-2026-004 sur copie, une ligne libre
100,01 euros, échéancier 30/70 (30,00 et 70,01 euros), qualification classique ponctuelle,
conclusion en établissement, jalon test et garantie explicitement non applicable à la fixture.
Aucun Client créé, aucune acceptation, PDF ou annexe inventé.

La finalisation est refusée : quatre informations administratives absentes et socle publié manquant.
Zéro clause éligible : les 118 brouillons ne sont pas consommés. Le gel positif complet est testé
séparément sur fixtures synthétiques en mémoire.

Après création du test sur copie, seules de nouvelles lignes métier sont ajoutées ; le compteur
de devis avance de 1 et le CRM existant rafraîchit 47 anciennes projections de recherche.
Ce sont des données dérivées sur copie, pas une modification des devis/projets historiques.
DEV-2026-001/002/003 conservent statut, lignes, snapshot et paramètres absents.
112 AW, 112 catalogue V1 brouillon, 118 clauses brouillon, 409 liens ; 0 publication.

Empreintes réelles avant/après :
- Validation-MSI : afaf9b8a7fa196a54dfd29e0fff881b099ad4b1d8bcc2e2da4dd8adc47bf31b8.
- XLSX : 6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8.

## Fichiers concernés

Nouveaux :
- src/shared/quoteContractPreparation.ts
- src/main/database/quoteContractPreparationMigration.ts
- src/main/commercial/QuoteContractPreparationService.ts
- src/main/commercial/QuoteContractPreparationService.test.ts
- src/main/testSupport/quotePreparationFixture.ts
- src/renderer/commercial/QuoteContractPreparationPanel.tsx
- src/renderer/commercial/QuoteContractPreparationPanel.css
- scripts/check-quote-contract-preparation-ui.cjs
- scripts/simulate-quote-contract-preparation.cjs
- scripts/simulate-quote-contract-preparation.ts
- docs/CONTRACTUAL_LOT5_PARAMETERS_AND_EVIDENCE.md

Modifiés (application) :
- src/main/commercial/QuoteService.ts
- src/main/commercial/ContractTermsService.ts
- src/main/commercial/quotePdf.ts
- src/main/crm/ClientDocumentService.ts
- src/main/database/DatabaseService.ts
- src/main/database/migrations.ts (registre seulement)
- src/main/ipc.ts
- src/main/workflow/DemoService.ts (scénario de démonstration explicitement distinct)
- src/preload/preload.ts
- src/renderer/workflow/QuoteWorkflow.tsx
- src/renderer/commercial/QuoteClientPreview.tsx
- src/renderer/commercial/QuotesPage.tsx
- src/shared/clientDocuments.ts
- src/shared/commercial.ts
- src/shared/contracts.ts

Modifiés (tests existants) :
- src/main/commercial/QuoteService.test.ts
- src/main/commercial/ContractTermsService.test.ts
- src/main/commercial/ContractLibraryImportService.test.ts
- src/main/crm/ClientDocumentService.test.ts
- src/main/database/StabilisationPhase19.test.ts
- src/main/database/catalogIdentityV1Migration.test.ts
- src/main/database/migrations.test.ts
- src/main/projects/ProjectService.test.ts
- src/main/workflow/WorkflowService.test.ts

Suivi documentaire : PROJECT_STATUS.md, docs/HANDOFF_CODEX_MSI.md,
docs/MANAGER_BRIDGE_ROADMAP.md, présent bilan.
Preuves hors dépôt : simulation-lot5.md/json, npm-test-lot5.log, typecheck-lot5.log, ui-lot5.json,
verification-lot5.json dans outputs/contract-parameters-lot5.

## Arrêt

Lot 5 prêt pour revue du plan et de la simulation, non appliqué à Validation-MSI.
Attendre le feu vert AtoumWeb avant toute écriture réelle ou commit.
Pas de Lot 6, publication, Abby, Bridge, 8C, push ou merge.
