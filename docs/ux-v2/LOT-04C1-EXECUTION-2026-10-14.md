# Lot 04C.1 — Brouillons éditables sans duplication (E99/E102)

**Date :** 14 octobre 2026. **Branche :** `feature/ux-v2-lot04c-editor-drafts-v1`, **PR :** #108, **base :** PR #104 / 04B. Ce document est un relevé technique du premier incrément 04C, **pas** une clôture du lot 04C complet.

## Contrat métier réellement livré

- `CatalogService.create` crée un nouvel item et son **premier brouillon**.
- `CatalogService.createVersion` crée explicitement une **nouvelle version brouillon** sans publier.
- `CatalogService.saveDraftVersion(versionId, expected, input)` modifie **exclusivement la même version draft** : même ID, numéro, date de création, pas de publication, pas de copie de nouveaux composants/clauses, historique préexistant conservé.
- Le service compare, sous `BEGIN IMMEDIATE`, l'état attendu issu de la dernière lecture aux champs versionnés actuellement en SQLite (prix, identité commerciale, provenance, périmètre, aides, conditions, mots-clés E96). Toute différence renvoie un **conflit** sans écriture, sans créer une vN+1 et sans effacer la saisie locale.
- Les versions `published` et `retired` sont **interdites en modification en place**, même si un snapshot `draft` périmé est fourni.
- Le retour de l'enregistrement conserve le même `versionId`. Une interruption IPC pendant la création d'une **nouvelle version** reste un cas distinct, à sécuriser dans l'incrément E102 complet.
- Pas de nouvelle migration : `catalog_versions` et les champs existants sont réutilisés. Pas de changement à `schema_migrations`, `QuoteService`, CGV, contrats, inventaires Client/Prospect ou production.

## Raccordement interface / UX-01

La fiche `CatalogPage` présente **Reprendre le brouillon** lorsqu'une version `draft` existe, au lieu de proposer automatiquement la création d'une version supplémentaire. Sinon, l'action **Modifier via une nouvelle version** préremplit le formulaire depuis la version courante, et le formulaire annonce qu'il créera une vN+1.

La validation `Enregistrer le brouillon` utilise la nouvelle commande IPC atomique. Un échec CAS laisse le panneau et ses champs visibles, avec un message d'erreur dans le formulaire. La sortie de l'éditeur continue de passer par le garde UX-01 existant. Les anciennes versions de vente restent intactes.

## Preuves techniques

- Tests ciblés `CatalogDraftEditing04C.test.ts` : sauvegarde au même ID/numéro et sans publication, concurrence entre deux snapshots, refus publié/retiré, maintien des composants associés d'une Offre malgré une saisie invalide, préservation du prix d'une version publiée.
- Recette Electron fonctionnelle `scripts/check-catalog-identity-ui.cjs` : clic réel dans l'éditeur, sauvegarde d'un brouillon existant, vérification de non-duplication et conservation de l'éditeur après conflit simulé.
- Workflow CI : PR empilée #108 autorisée sur la base 04B ; étape Electron fonctionnelle spéciale #108. Bases et profils temporaires, aucune donnée MSI.
- **Recette visuelle humaine : explicitement exclue de ce chantier à la demande de l'utilisateur**. Les assertions Electron automatiques déjà présentes dans le script ne valent pas approbation humaine.

## Dépendances et suite du lot 04C

- #104 (04B / registre de catégories migration 67) doit être intégré ou réconcilié avant la PR empilée #108.
- Les PR #105/#107 CRM ont été fusionnées pendant la préparation de #108 : un **test de convergence** du nouveau `main` + #104 + #108 est indispensable avant toute fusion.
- Restent en 04C : éditeur complet en huit onglets adaptatifs, publication/validation métier par type, comparateur publié–brouillon, contrôles CGV/blueprint réels, traitement de réponse IPC perdue à la **création d'une nouvelle version** sans doublon, navigation version historique, tests Projet/Devis après publication.
- Lot 05 sur PR #106 est **indépendant** et ne doit pas être écrasé pour réaliser 04C.

**Aucune fusion autorisée** et aucune intervention sur Validation-MSI.
