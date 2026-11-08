# Lot 2 — incrément 2 : brouillons persistants

> Rapport historique de l’incrément 2, accepté pour développement/recette TEMP. Pour la finalisation (duplication, conflits par champs, sortie à trois choix, suggestions), consulter le [bilan consolidé](BILAN-CONSOLIDE-LOT2-2026-11-07.md). Les réserves décrivant des fonctions alors non réalisées sont datées de cet incrément.

Livraison locale du 07/11/2026, en attente de revue utilisateur. Direction graphique de l'incrément 1 et direction technique validées par Carlos ; migration autorisée **uniquement sur TEMP**. Aucun commit/push/PR/fusion de ce lot.

## Réalisations

- Première sauvegarde nom/type seuls : article et version brouillon créés atomiquement, code/catégorie facultatifs, mode/prix/acompte absents si non renseignés. Aucun faux tarif ni Sur devis par défaut. La saisie reste locale avant l'action manuelle ; aucune publication implicite.
- Sauvegarde de la même version brouillon, date de dernière sauvegarde réelle et révision ; réouverture exacte après fermeture et réouverture de la base et du renderer. Les dates anciennes inconnues restent NULL, sans événement historique fabriqué.
- Vue Mes brouillons : recherche nom/code/catégorie, liste opérationnelle et liste abandonnée, reprise exacte par identifiants article/version, abandon et restauration confirmés. Un seul brouillon opérationnel par article. Les abandonnés restent dans l'historique ; les compteurs Avec brouillon et la référence commerciale les excluent.
- Reçus durables d'idempotence pour la création : même commande/intention = mêmes IDs, intention différente = conflit. Transaction commune article/version/activité/reçu. Le rejeu reste possible après abandon du résultat. La création de version conserve également son mécanisme de rejeu existant.
- Conflit de révision : saisie conservée, comparaison des valeurs locales/distantes, adoption explicite de la révision distante comme nouvelle base puis enregistrement manuel séparé. Nouvelle concurrence = nouveau refus, aucun forçage ni fusion automatique. Après une réponse de création incertaine, une commande permet de retrouver l'enregistrement envoyé sans effacer la saisie en cas d'échec ; son ouverture demande confirmation si elle remplace la saisie locale.
- Les huit onglets et sauvegardes spécifiques restent distincts. Les contextes locaux ne privilégient plus un brouillon abandonné ; la migration ajoute des gardes empêchant les écritures de sous-domaines sur ces versions. Pas de développement des assistants commerciaux/contractuels/production des autres lots.

## Fichiers concernés

| Ensemble | Fichiers et rôle |
|---|---|
| Persistance | `src/main/database/catalogDraftPersistenceMigration.ts` : expérience TEMP 81, reconstruction contrôlée et gardes ; `migrations.ts` : reconnaissance de cette entrée à la réouverture, **sans ajout aux migrations automatiques**. |
| Métier | `src/main/commercial/CatalogService.ts` : création idempotente, liste des brouillons, sauvegarde/CAS, abandon/restauration, projections et publication ; `QuoteService.ts` : refus explicite d'une source sans mode tarifaire. |
| Frontière | `src/shared/commercial.ts`, `src/shared/catalogVersionReview.ts`, `src/main/ipc.ts`, `src/preload/preload.ts` : types nullable explicites, API et gardes. |
| Interface | `CatalogPage.tsx`, nouveau `CatalogDrafts.tsx`, styles `catalog-editor-v2.css` ; garde de consultation/édition dans `CatalogContractPanel.tsx`, `CatalogRecommendationsPanel.tsx`, `CatalogProductionPanel.tsx` ; affichage nullable dans `ProspectNeedsPanel.tsx`. Les styles de l'incrément 1 restent locaux et non publiés. |
| Vérification | `src/main/commercial/CatalogPersistentDrafts.test.ts` (14 tests), `scripts/check-offres-tarifs-persistent-drafts.cjs` et `scripts/fixtures/offres-tarifs-persistent-drafts.cjs` (banc Electron reproductible, source uniquement). Aucun fichier SQLite/profil/capture dans les sources à publier. |
| Suivi | `PROJECT_STATUS.md`, registre OT-01 à OT-39, spécification de persistance, note de compatibilité et présent rapport. |

## Résultats ciblés

Commande unitaire exécutée :

```text
node scripts/run-tests.cjs src/main/commercial/CatalogPersistentDrafts.test.ts src/main/commercial/CatalogDraftEditing04C.test.ts src/main/commercial/CatalogService.test.ts src/shared/catalogVersionReview.test.ts src/renderer/commercial/catalogWorkspaceModel.test.ts
```

**44 tests réussis sur cinq fichiers**, dont 14 nouveaux tests TEMP. Couverture : création minimale sans défaut commercial, rejeu et intention différente, reprise après fermeture physique de SQLite, CAS avec retour aux mêmes valeurs (ABA), sauvegarde en place, abandon/restauration et collision de restauration, publication/Devis refusés, préservation de snapshots de Devis, sources de composition non abandonnées, rollback de reconstruction et rollback article/version/activité si le reçu échoue, protection des liens d'une version abandonnée et refus d'un chemin non TEMP.

`npm run typecheck` et `git diff --check` réussis.

```text
node scripts/check-offres-tarifs-persistent-drafts.cjs
```

**18 contrôles Electron réussis**, vrais renderer/preload/IPC/services. Création par le formulaire, sauvegarde réelle, conflit concurrent injecté, comparaison et nouvel essai manuel, reprise des mêmes IDs après fermeture de la fenêtre et réouverture de SQLite, recherche et reprise dans Mes brouillons, abandon/restauration, compteurs et intégrité. Zéro erreur renderer. Les erreurs IPC « Conflit » et « réponse perdue après sauvegarde » sont volontairement injectées et attendues dans stderr ; elles sont gérées par l'interface, avec reprise sans doublon et recherche vide également vérifiées. Les confirmations sont interceptées dans le banc : aucune validation humaine exhaustive des dialogues Windows n'est revendiquée.

Deux PNG réels, Noir/Confort, 1920×1080, zoom 100 %, dans `outputs/Offres-Tarifs-Lot2-Increment2-2026-11-07/` : `01-creation-minimale.png`, `02-mes-brouillons.png`. Données TEST isolées, aucune donnée tirée d'une base utilisateur.

## Rapport de migration TEMP

La fonction `applyCatalogDraftPersistenceTemp` n'est appelée que par les tests et le banc explicitement autorisés. Elle contrôle les chemins réels de toutes les bases attachées : mémoire ou fichiers sous le vrai dossier temporaire système, jamais Validation-MSI. Le démarrage normal n'applique pas 81 et ne crée pas automatiquement ses tables. Une base non migrée expose honnêtement l'indisponibilité du parcours minimal.

Reconstruction transactionnelle de `catalog_versions`, en conservant ses colonnes actuelles et contraintes ; mode nullable avec CHECK limité au brouillon sans prix ; `last_saved_at`, `save_revision`, `abandoned_at` ; reçus durables ; index unique du brouillon opérationnel. Dépendances : les triggers référant à la table, y compris ceux d'autres tables, sont collectés, déposés et recréés dans la même transaction ; index d'origine conservés, triggers coût tiers adaptés au NULL. Gardes supplémentaires de sous-domaines sur les versions abandonnées. Le réglage des FK est rétabli dans tous les cas ; contrôle FK et intégrité **avant COMMIT**.

Preuve JSON locale : `outputs/Offres-Tarifs-Lot2-Increment2-2026-11-07/MIGRATION_TEMP.json`. Sur cette fixture seulement :

| Contrôle | Résultat |
|---|---|
| Versions historiques avant migration | 44 ; tous les champs historiques conservés |
| Dates de sauvegarde historiques | NULL conservé, pas de date inventée |
| Tables de données protégées | 140 ; lignes inchangées avant/après migration |
| Clés étrangères existantes | Définitions préservées |
| Objets index/triggers existants | 567 noms préservés ; seules les adaptations coût tiers prévues modifient leur SQL |
| `PRAGMA foreign_key_check` | Aucun résultat |
| `PRAGMA integrity_check` | `ok` |
| Panne pendant reconstruction | Rollback vérifié : schéma initial et réglage FK restaurés |
| Rejeu et redémarrage | Pas de seconde migration, entrée expérimentale reconnue |

Ces comptages décrivent la fixture construite par le registre, pas une propriété d'une base utilisateur ni un oracle Validation-MSI. Les dossiers TEMP du banc sont supprimés après vérification ; les résultats JSON et captures restent hors suivi Git.

## Réserves et suite

- [Incompatibilité historique documentée avant contrainte](COMPATIBILITE-BROUILLON-UNIQUE.md) : si une base contient plusieurs brouillons d'un article, la migration s'arrête sans les reclasser ni les abandonner. Une décision manuelle est nécessaire avant une future application hors TEMP. Aucune base réelle n'a été inspectée pour prétendre qu'elle est compatible.
- Pas d'application ni d'activation sur base utilisateur/Validation-MSI. La livraison ne fournit pas un lanceur qui migrerait ces bases. Toute extension de ce périmètre exige une nouvelle autorisation, une sauvegarde locale cohérente et une restauration testée ; aucun downgrade destructeur n'est prévu.
- Duplication d'articles non réalisée : le nom d'opération réservé dans les reçus n'est pas une commande livrée. Suggestions de brouillons similaires et enrichissements des autres onglets restent reportés. La recherche Mes brouillons porte sur le Catalogue local ; aucun système de propriétaire ou de comptes n'est inventé.
- Le mécanisme commun de garde de navigation reste conservé : enregistrement manuel accessible, poursuite après refus de sortie, abandon de saisie confirmé. Ce lot ne remplace pas tous les dialogues globaux par un nouveau dialogue à trois boutons.
- Revue graphique et fonctionnelle humaine de l'incrément 2 en attente ; les 39 décisions ne sont pas déclarées closes.

Git : branche `codex/ux-v2-offres-tarifs-20261106`, HEAD et suivi distant restés à `57ad50fd41c2de038015b346edae0751c7f8b785`. Les incréments 1 et 2 sont des modifications locales non committées. Aucun commit/push/PR/fusion, aucun autre worktree modifié.
