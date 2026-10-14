# UX/UI V2 — Lot 05 : écart entre la cible #82 et les preuves actuelles

Date de révision : 14/10/2026. Source des critères : PR #82, `docs/ux-v2/LOT-05A-...` à `LOT-05F-RECETTE-CONTRACTUELLE.md`, non présents sur la branche d'intégration ; ne pas confondre une spécification et le code livré.

## Matrice de clôture (ne vaut pas validation juridique)

| Sous-lot | Déjà démontré par le candidat #121 | Encore à livrer / démontrer | Verdict |
| --- | --- | --- | --- |
| 05A Audit | Cartographie vue/API/service, états et risques dans `LOT-05A-AUDIT-MAIN-2026-10-14.md` | Réactualisation après autres lots intégrés | Audit réalisé, vivant |
| 05B Bibliothèque | Gardes UX-01, filtre audience/famille, édition, navigations, 3 thèmes × 3 densités, Electron TEMP | Revue visuelle humaine et clavier fenêtre visible | Développement testé avec réserves |
| 05C Rubriques | Huit sections, règles pures de tri/applicabilité/conflits, migration SQLite 67 sans backfill, revue par version en base, IPC, preload, interface proposition/approbation, recette Electron TEMP | **Encore à raccorder au compilateur des futurs devis** : ordre canonique des textes réellement approuvés, moteur de conditions/conflits dans le parcours du devis, validation humaine des classifications des clauses réelles | **PARTIEL — stockage et interface réalisés** |
| 05D Builder | Devis intégré, brouillons isolés, garde des réponses tardives, snapshots draft/frozen/historical_missing et tests | Comparateur d'impact complet, sommaire/rubriques 3 zones et alertes navigables prévus dans #82 ; dépendance 05C | **PARTIEL** |
| 05E Lecture/preuves | ContractReadPanel, copies Abby depuis données sauvées, présentation figée, archive et pièces Abby existantes | DOCX export/import avec diff, fidélité document, PDF de travail identifié et parcours preuves exhaustif, recette R05E : non démontrés | **PARTIEL** |
| 05F Recette | CI Windows #1498 et contrôles Vitest/Electron, UX-01, restauration, intégrité et dépendances | Matrice 25 scénarios non entièrement exécutée, recette visuelle/clavier visible et validation juridique ; couverture 05C/05E manquante | **PARTIEL** |

## Preuves exactes, limitées à ce qu'elles démontrent

- PR #106 développement : `87a942da10aa884efd60a1723ef4290ce8bfbde8`.
- PR #121 : CI #1498 SUCCESS sur `80b2824e6935f85b4bfb07fb58f5d1adaa1b0005` : typecheck OK, **1081/1081** Vitest (114 fichiers), **223** assertions Electron Contrats (dont proposition et approbation humaine sur fixture), UX-01 **183**, restauration **12**, UX02E **67**, CRM03B **77**, 03D **127**, 03E **203**. Toute modification ultérieure du HEAD, y compris documentation, impose nouvelle CI.
- Tests exécutés dans des environnements TEMP ; aucune lecture de Validation-MSI ou preuve de conformité des CGV revendiquée.
- `main` n'a pas été modifié ; PR #121 reste draft. Toute nouvelle modification impose une CI sur le nouveau HEAD.

## Garde de conception 05C

Ne **jamais** déduire la rubrique juridique du code Catalogue/famille de produit, ni migrer automatiquement 112 textes réels en sections. Proposer une structure de classement éditorial versionné, avec valeur `à classer` et confirmation humaine explicite. Ne jamais modifier les snapshots historiques.

## Garde de conception 05E

Copies/exports de travail != acceptation Abby. Un PDF accepté doit rester une pièce distincte portant son identité/provenance/empreinte. Un import DOCX ne doit pas écrire directement dans une version publiée ou un Devis figé.

## Décisions et limites

E128–E133 sont arbitrés dans cette matrice ; leur mise en œuvre dans l'assemblage futur et la revue humaine des textes ne sont pas closes. E140–E143 (stratégie DOCX/PDF et preuves) et E146–E150 restent à instruire selon la cible #82. Une implémentation progressive et additive sur fixtures reste possible, mais les décisions juridiques ne doivent pas être inventées par l'agent. **Clôture globale 05A–05F non certifiée. Aucune fusion automatique.**

## Arbitrages métier validés par AtoumWeb — 14/10/2026 (05C)

Ces décisions remplacent les options ouvertes de la conception #82 sans valider juridiquement le contenu des textes :

1. **Rubriques** : retenir les huit rubriques dans l'ordre `object`, `scope`, `execution`, `delivery`, `finance`, `rights`, `recurring`, `end`. Chaque **version** de clause aura sa rubrique (`sectionKey`) et son rang (`rankInSection`). Une version non examinée reste explicitement « À classer ».
2. **Revue des textes** : GPT peut préparer des propositions de classement et leurs motifs ; **publication du classement seulement après validation humaine**. Aucune migration automatique des textes réels, aucune déduction à partir de la famille Catalogue.
3. **Applicabilité** : public, prestations réellement retenues, options achetées, formule, quantité et récurrence selon paramètres explicites. Tout contexte manquant = état à résoudre, non inférence métier.
4. **Conflits** : montrer versions, références et provenance. Avertir dans tous les cas ; **bloquer uniquement les conflits explicitement définis comme bloquants**. Ne pas choisir la dernière version ou supprimer des clauses silencieusement.
5. **Assemblage** : ordre canonique des rubriques, rang dans la rubrique, clé stable ; numérotation recalculée uniquement pour les brouillons futurs. Les snapshots gelés et les historiques absents demeurent inchangés.

**Séquence de mise en œuvre sûre :** (a) types et règles pures/testées ; (b) migration additive avec valeur non classée et provenance ; (c) écran de propositions/revue, aucune application implicite aux 112 clauses ; (d) conditions et conflits explicites ; (e) moteur d'assemblage des brouillons ; (f) recette Electron/SQLite et matrice 05F. Le présent arbitrage n'est **pas** la revue juridique requise pour publier les textes.

## Implémentation effective 05C — état du candidat au 14/10/2026

- **Migration 67** : table `contract_clause_section_reviews` avec clé étrangère vers `contract_clause_versions`, états `unclassified/proposed/approved`, rubrique/rang/motif/valideur/date. Aucune ligne historique créée automatiquement, aucun texte CGV ni snapshot modifié.
- **Moteur de règles pur** : `contractSectionPolicy.ts` fournit l'ordre des 8 rubriques, la séparation proposition/approbation, le résultat d'applicabilité `eligible/ineligible/unresolved` et les conflits explicitement approuvés comme bloquants. Ces règles **ne sont pas encore utilisées dans le générateur des devis**.
- **Persistance et UI** : `ContractSectionReviewService`, service dans `DatabaseService`, handlers IPC, contrat preload et panneau de revue dans `ContractLibraryPage`. Une approbation porte sur une version exacte et ne vaut pas approbation juridique du texte. Le verrou SQLite interdit de remplacer silencieusement un classement approuvé.
- **Preuves de recette** : CI #1498 réussie sur le code antérieur au dernier verrou SQL. Le test Electron valide le cycle « À classer → proposition → approbation nommée » sur fixture TEMP, texte de la version inchangé. Le dernier verrou SQL doit être validé sur son propre commit.
- **Reste non réalisé** : propagation des classements approuvés au Builder, tri et numérotation V2 des futurs devis, conditions détaillées et conflits bloquants raccordés à la finalisation, propositions de classement exhaustives des clauses réelles et validation humaine. Les documents figés restent protégés.
