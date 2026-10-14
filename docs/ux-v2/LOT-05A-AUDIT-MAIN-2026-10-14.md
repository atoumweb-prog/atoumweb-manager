# UX/UI V2 — Lot 05A : reprise du socle contractuel sur le main intégré

**Date :** 14 octobre 2026  
**Nature :** première passe d'audit statique documentée ; **pas une recette exécutée ni une implémentation 05B**.  
**Base observée :** `main@b2796812ee24c9e9e824f3d66564f2c1a335bffe` (arbre `88834f9068a3f5a4bd3857cd89b2a6c23df348ce`).  
**Référentiel de conception :** PR [#82](https://github.com/atoumweb-prog/atoumweb-manager/pull/82), notamment `LOT-05-CONTRATS-CGV.md`, `LOT-05A-AUDIT-CONTRACTUEL-EXISTANT.md` et `LOT-05B` à `LOT-05F`. Ces spécifications ne sont pas intégrées au `main` audité : les consulter **sur la branche de #82**, sans recréer leur contenu ni les réécrire ici.  
**Dépendances parallèles observées :** PR [#105](https://github.com/atoumweb-prog/atoumweb-manager/pull/105) (03D Client), PR [#104](https://github.com/atoumweb-prog/atoumweb-manager/pull/104) (04B Catalogue). Leur HEAD peut évoluer et doit être revérifié avant tout développement.

## 1. Périmètre et décisions déjà prises

Le lot 05 UX/UI V2 désigne **la bibliothèque contractuelle, les types de contrat, les clauses, leur présentation, leur assemblage dans le Devis et les preuves Abby** ; ne pas le confondre avec le « Lot 5 » des paramètres contractuels/migrations historiques documenté dans `docs/CONTRACTUAL_LOT5_PARAMETERS_AND_EVIDENCE.md`.

Le **contrat fait partie du Devis**. Le socle CGV commun et les seules clauses applicables aux prestations effectivement retenues entrent dans sa préparation ; la signature/acceptation Abby relève d'un processus et de preuves distincts. Une prévisualisation, une publication technique, une préparation de Projet ou un export **ne vaut ni signature ni validation juridique**. Préserver les versions, liens de provenance, documents acceptés et snapshots historiques.

**Objectif de ce chantier : réutiliser l'existant.** Le référentiel #82 décrit six sous-lots 05A–05F ; les dossiers étaient alors documentaires. Cet audit relève la réalité vérifiable sur le nouveau `main`, mais ne les prétend pas implémentés par leur seule rédaction.

## 2. Cartographie statique : écran → API/IPC → service → persistance → tests

| Surface / usage | Écran ou contrat existant | Appels / service observés | Données / garde vérifiables | Tests repérés |
| --- | --- | --- | --- | --- |
| Bibliothèque des types de contrat | `ContractLibraryPage.tsx`, `src/shared/contractTypes.ts` | IPC `contract-types:*` → `ContractTypeService` | `contract_types`, `contract_type_versions`, `contract_type_version_modules`, version `draft/published/retired` | `ContractTypeService.test.ts` |
| Modules / clauses partagés | `ContractLibraryPage.tsx`, `src/shared/contractTerms.ts` | IPC `contract-terms:library:*` → `ContractTermsService` | `contract_clause_templates`, `contract_clause_versions`, audience `all/professional/consumer`, scope `base/catalog` | `ContractTermsService.test.ts` |
| Liens contractuels Catalogue | `CatalogContractPanel.tsx`, `ContractLibraryPage.tsx` | `contractTypes.catalog/setCatalog`, `contractTerms.library.setCatalogLinks` | `catalog_contract_type_links`, `catalog_contract_clause_links` ; références réutilisées | `ContractTypeService.test.ts` et tests Catalogue à inventorier |
| Devis → Builder CGV | `ContractTermsBuilder.tsx` | IPC `contract-terms:quotes:*` → `ContractTermsService` | Instances `quote_contract_clauses`, personnalisation, réordonnancement, synchronisation, snapshot | `ContractTermsService.test.ts` |
| Prévisualisation d'un type | `ContractLibraryPage.tsx`, `ContractReadPanel.tsx` | `contract-terms:preview-reference` → `previewReference` | Calcul lecture seule depuis une référence Catalogue, sans créer de Devis | `ContractTypeService.test.ts` à préciser pour l'UI |
| Lecture d'un Devis | `ContractReadPanel.tsx`, `src/shared/contractPresentation.ts` | `contract-terms:quotes:presentation` → `presentation` | `frozen` conserve la présentation figée ; `historical_missing` reste absent | `ContractTermsService.test.ts` |
| Préparation contractuelle du Devis | `QuoteContractPreparationPanel.tsx` | IPC `quote-preparation:*` → `QuoteContractPreparationService` | Paramètres, administration, checks bloquants/avertissements et données propres au Devis | `QuoteContractPreparationService.test.ts` |
| Pièces et PDF Abby | `QuoteContractDocumentPanel.tsx` et préparation | `quote-preparation:attach/import/record-acceptance`, services documents/Devis | Pièces identifiées, provenance/empreinte, PDF accepté distinct de l'export préparatoire | `QuoteContractPreparationService.test.ts` |
| Archive contractuelle Client / Documents | `ClientContractsPanel.tsx`, `DocumentsPage.tsx` | Sources Devis/Client/documents existantes | Contrats acceptés, navigation et preuves à réexaminer après 03D | Recette 03D/05E à venir |

**Fichiers effectivement consultés :** `ContractTermsService.ts`, `ContractTypeService.ts`, `QuoteContractPreparationService.ts`, `ContractLibraryPage.tsx`, `ContractTermsBuilder.tsx`, `CatalogContractPanel.tsx`, `ContractReadPanel.tsx`, `QuoteContractPreparationPanel.tsx`, `QuoteContractDocumentPanel.tsx`, `src/shared/contractTerms.ts`, `contractTypes.ts`, `contractPresentation.ts`, `src/main/ipc.ts`, fichiers tests et documentation contractuelle existante. La matrice ne prouve pas une exécution end-to-end de chaque parcours.

## 3. Capacités réelles à conserver

1. `ContractTypeService` propose `list/get/create/createVersion/updateDraft/publish/setStatus/catalog/setCatalog/initialize`. Une composition de type n'active pas à elle seule toutes les clauses ; les gardes sur modules doublons et scope `base` restent métier.
2. `ContractTermsService` propose la bibliothèque, le lien prestation–clause, `getQuoteBuild`, `syncQuote`, `previewReference`, `presentation` et `freezeQuote`. Les clauses actives sont compilées selon `sortOrder` : **aucun moteur canonique de rubriques juridiques sémantiques démontré**.
3. Le Builder du Devis emploie déjà **`useUnsavedDraft`** pour plusieurs saisies et se distingue de la bibliothèque.
4. Le service connaît `draft/frozen/historical_missing` : un gel explicitement vide reste vide, un Devis historique sans snapshot ne reçoit pas artificiellement les clauses actuelles, et une ancienne présentation figée est relue depuis le snapshot lorsqu'il la contient.
5. `QuoteContractPreparationService` conserve les paramètres/pièces et refuse notamment des opérations sur un Devis non éditable. La preuve d'acceptation et le PDF Abby restent distincts de la simple finalisation pour envoi.
6. `ContractLibraryImportService` contrôle le manifeste des **112 codes AW** dans son flux d'import. Cette règle **n'atteste pas que 112 clauses sont installées dans une base utilisateur donnée**.

## 4. Écarts / questions 05A à confirmer en recette

| Priorité | Constat sur le code de `main` | Préparation 05B / test attendu |
| --- | --- | --- |
| Haute | `ContractLibraryPage.tsx` contient plusieurs éditeurs locaux (`input`, `body`, nouveau module), mais **aucun appel explicite à `useUnsavedDraft`** dans ce composant. Un changement de type/version réinitialise un formulaire via `useEffect`. | Reproduire en Electron les sorties, changements de sélection, `pending`, erreurs et relances ; brancher la garde **UX-01 existante**, sans second mécanisme ni enregistrement silencieux. Constat statique, pas encore bug reproduit. |
| Haute | `refresh()` charge types, clauses et Catalogue par `Promise.all` ; l'échec d'une source peut masquer les autres. | Séparer erreur totale / source dégradée si compatible ; ne pas annoncer des données chargées si elles manquent. |
| Moyenne | Liste gauche prioritairement dédiée aux **types** ; modules et CGV sont consultés dans le détail et des sections secondaires. | Prototype 05B des trois espaces **socle / types / clauses**, recherche et statuts, sans réécriture du modèle ou suppression des commandes actuelles. |
| Moyenne | `compile` trie via `sortOrder`, `ContractReadPanel` présente l'origine des clauses. | Réserver au 05C/05D le modèle `sectionKey/rank` et les décisions de classement humain ; ne pas coder un tri juridique automatique en 05B. |
| Moyenne | Liens avec Catalogue et fenêtre Client/Devis sont fonctionnels, mais les deux chantiers évoluent sur branches concurrentes. | Vérifier la navigation IDs et les consommateurs sur le nouveau `main` avant les recettes transverses ; différer les changements d'API. |
| Future | Export DOCX éditable et import DOCX comparé non attestés par la consultation ciblée. | 05E : inventaire des sorties existantes avant de promettre une fonctionnalité Word/PDF complète ; aucune pièce de travail ne vaut preuve Abby. |

## 5. Matrice de non-conflit à la date de cet audit

- **03D / PR #105** modifie entre autres `ClientsPage.tsx`, `CrmService.ts`, `src/main/ipc.ts`, `src/preload/preload.ts`, `src/shared/crm.ts`, `PROJECT_STATUS.md`, et des documents UX.
- **04B / PR #104** modifie notamment `CatalogPage.tsx`, `CatalogService.ts`, `ContractTypeService.test.ts`, `src/main/ipc.ts`, `src/preload/preload.ts`, `src/shared/contracts.ts` et les migrations.
- **05A ici** : **un document neuf seulement** (ce fichier) sur branche dédiée, sans modifier les fichiers de ces PR ni le référentiel #82.
- **05B plus tard** : premier pilote cantonné, si possible, à `ContractLibraryPage.tsx`, `contract-library.css` et des tests/fixtures **propres au 05B**. Toute modification à `ipc.ts`, `preload.ts`, `ContractTypeService.test.ts`, `migrations.ts`, `PROJECT_STATUS.md` ou Catalogue/Client exige rebase/contrôle des PR parallèles et une décision explicite.
- **Aucune migration contractuelle simultanée** tant que la migration Catalogue 67 et la branche 03D/03E ne sont pas consolidées. Ne jamais considérer `main@b2796812` comme éternellement actuel.

## 6. Itérations proposées et critères de sortie

### 05A.1 — Audit complémentaire et reproduction
- Cartographier écrans, événements `onClose`/onglets, IPC/services, version exacte, données historiques, erreurs asynchrones et action d'édition ; compléter matrice de tests.
- Tests sur fixtures `TEMP` uniquement : brouillon de type et de module, onglet/version/sélection, retour Documents, `Escape`, mutation concurrente, `busy`, chargements partiels.
- Vérifier les différences de comportement entre bibliothèque et Builder. **Aucun changement de texte juridique**.
- **Gate :** preuve des éventuels défauts UX, captures reproductibles et liste fermée des fichiers à modifier. Ne pas assimiler cet audit statique à une recette native.

### 05B.1 — Pilote isolé de bibliothèque
- Architecture compacte : liste/sections gauche, fiche/éditeur central, usages/provenance repliables ; statuts `draft/published/retired`, `active/inactive/archived`, audience et liens vérifiables.
- Garde UX-01 réelle pour tout éditeur et confirmation avant abandon ; conserver focus, formulaire et état pending ; éviter le démontage sauvage des sous-éditeurs.
- Conserver les services/IPC/types actuels, l'initialisation volontaire et la réutilisation de clauses partagées.
- **Gate :** tests ciblés, typecheck, suite complète, recette Electron sur 3 thèmes × 3 densités, écran étroit, clavier, SQL/FK, zéro régression en Devis/Client/Catalogue ; PR draft, **pas de merge** sans accord.

### 05C–05F — Travail ultérieur à coordonner
- 05C rubriques sémantiques : classement **humain**, modèle canonique à décider.
- 05D Builder / déduplication / alertes : aucune fusion juridique automatique, aucune altération des instances personnalisées.
- 05E lecture, documents, DOCX/PDF et preuves Abby : préserver rôles, empreintes et historique.
- 05F recette transversale : utiliser les 98 scénarios **prévus**, pas présentés comme déjà exécutés.

## 7. Statut de décision

- **05A : première passe d'audit statique réalisée** sur `main@b2796812ee24c9e9e824f3d66564f2c1a335bffe` ; inventaire dynamique des valeurs/bases, assertions Electron et validation humaine restent **à faire**.
- **05B : cadré dans le référentiel #82 ; code UX V2 non développé sur cette branche.**
- **05C–05F : spécifiés dans #82, non réputés implémentés.**
- Aucun fichier de production, migration, base réelle, clause, devis, PDF accepté ou preuve Abby modifié par cette branche.
- Toute décision sur les textes juridiques, l'ordre de rubriques ou leur conformité nécessite une **revue humaine adaptée**, indépendamment des tests logiciels.
