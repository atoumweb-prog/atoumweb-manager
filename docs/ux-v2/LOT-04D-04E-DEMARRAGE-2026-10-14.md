# Lot 04D / 04E — état technique et validation (14/10/2026)

## Branches, périmètre et sécurité

- Branche de travail : `feature/ux-v2-lot04d-04e-catalogue-v1`, PR [#118](https://github.com/atoumweb-prog/atoumweb-manager/pull/118) en **draft**.
- Dépend de 04C / PR #108, elle-même dépendante de 04B / PR #104. Aucune fusion dans `main` sans accord utilisateur explicite.
- Aucune écriture dans les devis déjà acceptés, dans les CGV, ni dans les données utilisateur ou Validation-MSI.
- Migrations dans des bases SQLite de test et fixtures Windows TEMP uniquement.

## 04D — recommandations versionnées

Implémenté sur la branche :

- Migration additive 68 `catalog_version_recommendations`, associations N:N entre versions catalogue et index / contraintes FK.
- `CatalogRecommendationsService` : lecture avec métadonnées historiques de cible, sauvegarde atomique, CAS sur le snapshot des cibles, sélection de versions publiées et actives, refus des doublons / auto-référence / services inclus dans la composition.
- `CatalogService` : copie de recommandations vers un nouveau brouillon vN+1 sans mutation de la version historique ; refus de la composition d'un service déjà recommandé ; sauvegarde identique idempotente, UUID inchangés.
- IPC, preload et contrat `CatalogApi` typés et raccordés à `DatabaseService`.
- `CatalogRecommendationsPanel` dans l'onglet Associations, disponible sur Services et Offres ; sélection, suppression, sauvegarde explicite, garde UX-01, conservation en cas d'erreur, double-clic et réponse IPC tardive protégés.
- Scénarios SQLite pour FK, conflits CAS, archivage/désactivation, versionnement, copie, non-duplication avec composition et idempotence.
- `scripts/check-catalog-recommendations-ui.cjs` : Electron Chromium + vrai panneau React et **IPC simulé** ; 14 contrôles passés dans CI #1171.
- `scripts/check-catalog-recommendations-native.cjs` : fixture indépendante avec vrai Electron + vrai IPC + vrai service et base SQLite sous TEMP, contrôles ajoutés à la CI de #118. Cela ne remplace pas la recette de l'application complète (IPC/Preload de production).

## 04E — aide à la vente

- Réutilise `CatalogCommercialParameters` et `CatalogVersion.internalAdvice`, champs déjà versionnés ; pas de modèle CGV concurrent.
- Besoins client, bénéfices, objections/réponses, conseils internes et mots-clés éditables dans la fiche.
- `catalogSalesGuidance.ts` projette ces champs, signale le non-configuré et ne génère aucun texte contractuel.
- Tests unitaires de projection et tests SQLite d'historique, héritage vN+1 et refus de sauvegarde obsolète.

## Résultats vérifiés et limites

- CI #1171 verte : 122 fichiers Vitest, **1 111 tests réussis**, typecheck et recette 04D 14/14.
- CI #1192 verte sur commit `6f3c6bbd` : contrôles Catalogue, Electron, UX-01 et Vitest configurés sur PR #118.
- Ces CI valident leurs SHA respectifs, **pas automatiquement les commits suivants**.
- La CI du nouvel incrément natif et les tests de migration sur son HEAD doivent être vérifiés.
- Recette encore requise : intégration avec le **preload réel de production**, vérification des chemins de restauration et de la convergence des migrations si une autre branche crée une migration 68.
- Revue humaine de la présentation visuelle et des cas limites, puis convergence distincte 04B → 04C → 04D/04E ; mise à jour et test sur dernier `main` avant proposition de fusion.

## Politique de clôture

La réalisation technique du sous-lot n'est déclarée complète que sur HEAD vert, avec les réserves compatibles documentées. La PR reste en draft. Ne pas confondre CI de branche, validation d'intégration native et fusion dans `main`.
