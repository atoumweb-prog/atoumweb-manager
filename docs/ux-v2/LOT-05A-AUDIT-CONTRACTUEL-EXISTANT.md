# Lot 05A — Audit du socle contractuel, clauses, types, instances et preuves

**Statut : spécification documentaire — aucune mutation applicative, aucun test effectué pour ce dossier.**
**Code relu : `main@eb252d5cbd0e95137eafa2b4759fcbcfd7263eda`, 09/10/2026.** L'intégration ultérieure des PR #81/#83 et du workflow #84 peut déplacer la base. **Ne pas confondre avec « Lot 5 » des migrations contractuelles documenté dans `docs/CONTRACTUAL_LOT5_PARAMETERS_AND_EVIDENCE.md` : ici « Lot 05 UX V2 » = ergonomie/couverture.**

Références : [Lot 05](LOT-05-CONTRATS-CGV.md), [CATALOGUE-CGV](CATALOGUE-CGV.md), [builder existant](../../docs/CGV_BUILDER_V1.md), [contrats/évidence](../../docs/CONTRACTUAL_LOT5_PARAMETERS_AND_EVIDENCE.md), [Lot 04](LOT-04-CATALOGUE.md), [Lot 06 Devis](LOT-06-DEVIS-ABBY.md), [Projet 07P](LOT-07-PROJET-PRE-SIGNATURE.md).

## 1. Principes déjà validés
Le **contrat est intégré au Devis**, avec **CGV communes** et **clauses applicables aux prestations réellement retenues**. La confirmation de la signature/acceptation du devis par la procédure Abby vaut validation de l'ensemble applicable **dans les conditions contractuelles effectivement vérifiées** : ne pas déduire l'acceptation d'une préparation, d'une vue de CGV ou d'un PDF non signé. Le PDF accepté Abby reste preuve documentaire distincte et protégée. **Aucun contrat parallèle autonome** à signer en doublon.

Un **Projet prévisionnel avant signature** (Lot 07P) peut utiliser les lignes du devis comme base de travail, sans faire accepter les CGV, convertir le Prospect en Client ni ouvrir une maintenance facturable.

## 2. Cartographie de la réalité en code
| Domaine | Source réelle | Capacité constatée et précaution |
|---|---|---|
| Bibliothèque clauses | `src/shared/contractTerms.ts`, `ContractTermsService.ts` | `base/catalog` ; public `all/professional/consumer`, état de clause `active/inactive/archived`, version `draft/published/retired`. `ContractClauseVersion.review` conserve **métadonnées de revue documentaire**, **pas avis juridique légalement certifié**. |
| Bibliothèque types | `src/shared/contractTypes.ts`, `ContractTypeService.ts` | Type, code, versions, `moduleIds` ordonnés et rattachements aux versions du catalogue. **Type = organisation/lecture des modules** ; le résolveur de clauses selon lignes réellement présentes décide l'applicabilité. |
| Édition centrale | `ContractLibraryPage.tsx` | Liste types, création de type/module, brouillon, version, publication, archivage, rattachements catalogue, aperçu sans Devis ni vente. |
| Édition dans devis | `ContractTermsBuilder.tsx`, `ContractTermsService.ts` | Instances de clauses, source `base/catalog/custom`, personnalisation d'instance, réordonnancement, synchronisation, warnings, aperçu. Modifications d'un Devis figé interdites ; dupliquer pour réviser. |
| Assemblage actuellement réalisé | `ContractTermsService.compile`, `ContractTypeService.orderWarnings` | Compilateur actuel **concatène les clauses enabled dans l'ordre `sortOrder`** avec numérotation simple ; les types détectent certaines contradictions d'ordre. **Pas d'ordonnancement sémantique par rubrique canonique attesté**. |
| Lecture client | `src/shared/contractPresentation.ts`, `ContractReadPanel.tsx` | Présentation structurée par **origine** CGV communes / prestation / conditions particulières ; paramètres/infos en sections séparées, copie pour Abby. **Les regroupements actuels ne sont pas le classement sémantique V2**, ni une vérification de cohérence juridique. |
| Préparation liée au Devis | `src/shared/quoteContractPreparation.ts`, `QuoteContractPreparationService.ts`, `QuoteContractPreparationPanel.tsx` | Public contractuel, administration, échéancier/versements, contexte de conclusion, garanties correctives, droits, renouvellement, éventuelles annexes et contrôles `blocking/warning`. Aucun défaut administratif fictif. |
| Pièces/provenance | `QuoteContractPreparationService.attach/importPath/recordAcceptance`, `QuoteContractDocumentPanel.tsx` | Rôles de preuves, empreintes SHA-256, date, provenance, historique de remplacement ; PDF Abby actif et anciens documents conservés. L'acceptation opérateur et PDF demeurent des actes distincts. |
| Documents transversaux | `DocumentsPage.tsx`, `ClientContractsPanel.tsx` | Bibliothèque depuis Documents & Contrats, pièces du client, versions PDF et Devis acceptés reconnus comme référence contractuelle. |
| Snapshot historique | `ContractTermsService.getQuoteBuild/freezeQuote`, `quoteContractText` | État `draft/frozen/historical_missing`. **Gel explicite vide** reste vide ; un Devis historique sans snapshot **ne se reconstruit pas** depuis les clauses actuelles. |

**Attention historique :** les états observés dans les bilans des migrations contractuelles précédentes (ex. bibliothèque de brouillons importés, migrations 55/56) documentent un état **à leur date**. Ce dossier **ne certifie pas** le nombre actuel de clauses publiées dans une base utilisateur, et **n'effectue aucune publication**.

## 3. Parcours existant vs cible V2
| Départ/écran | Service/état existant | Cible et risque |
|---|---|---|
| Documents & Contrats → Bibliothèque | `ContractLibraryPage` | Liste gauche **types, rubriques et clauses** selon navigation cible ; bonne version et provenance visibles ; actions d'édition protégées. |
| Catalogue → Contrat & CGV | `CatalogContractPanel`, `contractTypes.setCatalog` | Visualiser références **canoniques**, usages partagés, avertissement si édition d'une clause utilisée ailleurs. Pas de clone de clause. |
| Devis courant → Builder | `contractTerms.quotes.*` | Sommaire logique, sources, clauses personnalisées et warnings sans écraser un brouillon. Le devis **non signé** reste dans son état ; copie Abby distincte de la signature. |
| Contrat type → Prévisualisation | `contractTerms.previewReference` | Simulation lecture seule avec version/catalogue/public, **ne crée aucun Devis ni Projet**. |
| Devis → Préparation | `quotePreparation.get/save` | Contrôles par rubrique : information requise / manquante / à vérifier / NA ; infos administratives partagées mais jamais imaginées. |
| Finaliser un Devis | `ContractTermsService.freezeQuote` | Sauvegarder snapshot du texte, versions, paramètres et présentation, sans rétroactivité ; refuser les pièces/manques réellement bloquants. **Finaliser pour envoi ≠ accepter/signature**. |
| Acceptation via Abby | Processus Devis distinct | Preuve du PDF/accord, événement opérateur, lien Client/Projet, pas recompiler le snapshot avec bibliothèque récente. |
| Ancien Devis accepté sans snapshot | `historical_missing` | Signal honnête « absence historique », aucun remplissage par CGV actuelles. |
| Projet prévisionnel à partir de Devis | `prepareQuote` côté Projets | N'ajoute ni clause achetée ni acceptation ; sur Devis modifié, nouvelles versions seulement par révision et synchronisation humaines. |

## 4. Frontières de preuve, versionnement et validation juridique
- **Bibliothèque** : une clause publiée techniquement ne signifie pas qu'un juriste a confirmé sa conformité. Les références légales demandent une revue externe, pas la confiance dans un ancien brouillon.
- **Version** : édition d'un brouillon, création d'une nouvelle version pour changement d'un texte publié et conservation des références historiques.
- **Ligne du Devis** : inclut seulement les options volontairement achetées et composants inclus applicables ; une suggestion 04D non sélectionnée **n'active aucun module**.
- **Instance du Devis** : personnalisable **localement** avant gel, sans modifier la clause source ; orphelins conservés/traités selon service.
- **Gel** : `frozen`, y compris vide, n'est jamais remplacé par une nouvelle compilation ; `historical_missing` reste absent.
- **Preuve** : PDF Abby, horodatage, empreinte et événement de consentement distincts, avec remplacement historique traçable.
- **Édition Word/PDF** : n'est **pas attestée comme entièrement implémentée** dans les APIs de ce Lot ; à spécifier en 05E, sans dire « export DOCX opérationnel » par défaut.

## 5. Programme de recensement avant mise en œuvre UX
1. Vérifier le HEAD courant et les migrations contractuelles ; lister les appels `ContractTermsApi`, `ContractTypesApi`, `QuoteContractPreparationApi` et contrôles de pièces, avec gestion erreurs.
2. Produire la matrice `contrôle React → IPC → service → version/snapshot → erreur → test` pour les écrans contractuels.
3. Vérifier la provenance exacte de la clause (scope, audience, liens Catalogue, version, statut, revue) et les contextes Pro/Consommateur **sans inventer de textes**.
4. Mesurer le comportement sur devis préparatoire, ancien accepté, snapshot vide, contrat type et devis multi-prestations.
5. Diagnostiquer les opérations destructrices et brouillons `dirty` en cours (#83), sans implémenter un deuxième registre.
6. Documenter les manques : rubriques sémantiques, classement, collisions, aperçu/exports, import Word et consultation client.

## 6. Recette ciblée à prévoir (12 scénarios, **non exécutés**)
| ID | Scénario | Résultat exigé |
|---|---|---|
| R05A-01 | Lister socle/type/clause et versions | Identité/source publique/contractuelle correcte et états explicites |
| R05A-02 | Clause liée à deux prestations | Une source canonique, plusieurs liens, pas deux copies |
| R05A-03 | Type composé de trois modules | Ordre du type visible ; le type **n'active pas seul** tous les modules |
| R05A-04 | Clause pro et clause consommateur | Seules les clauses applicables au public choisi sont candidates |
| R05A-05 | Prospect sélectionne besoin sans Devis | Aucune clause ajoutée au Devis inexistant |
| R05A-06 | Devis avec deux lignes dont option non achetée | Option non achetée ne déclenche pas sa clause |
| R05A-07 | Générer prévisualisation type | Zéro Devis/Client/Projet nouveau |
| R05A-08 | Ajouter personnalisations au seul Devis | Bibliothèque canonique inchangée |
| R05A-09 | Finaliser Devis avec pièces valides | Snapshot figé et provenance conservés |
| R05A-10 | Gel vide historique | Aucune récupération depuis clauses actuelles |
| R05A-11 | Ancien Devis sans snapshot | État `historical_missing`, zéro reconstruction |
| R05A-12 | Renouveler bibliothèque et revenir sur Devis ancien | Devis figé non modifié, pièces protégées, Validation-MSI intacte |

**Référence : code et règles métier, pas avis de conformité juridique.**
