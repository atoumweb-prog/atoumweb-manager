# Lot 07C — Blueprints, contributions vendues/prévues, destinations et régénération sûre

**Statut : conception V2 documentaire, aucune suppression/régénération de Projet réalisée.**
**Source : Manager `main` audité le 09/10/2026.** Références : [07P règles validées](LOT-07-PROJET-PRE-SIGNATURE.md), [07A audit](LOT-07A-INVENTAIRE-PROJETS-CAPACITES.md), [06E révisions du Devis](LOT-06E-ABBY-REVISIONS-PROJET.md), [07D Sites/Pages](LOT-07D-SITES-PAGES-COMPOSITION.md).

## 1. Décision métier déjà approuvée
**Un Devis non signé peut préparer volontairement un Projet interne**, avec ses tâches/sites/pages/ressources déjà exploitables. Une révision importante du Devis doit proposer **Adapter le Projet actuel** ou **Repartir de zéro et régénérer depuis le Devis courant**, sans perte de travail non consentie. Après acceptation réelle Abby, seul le **Projet courant** est confirmé ; aucune création Client/facture/maintenance/production WP avant cette acceptation.

**Le projet préparatoire peut exister AVANT l'accord de principe** ; la colonne Finalisation du pipeline commercial n'est pas le statut technique `finalized_at` du Devis.

## 2. Existant constaté et frontière technique
| Source | Réel en code | Non livré / garde |
|---|---|---|
| `QuoteProjectPanel` dans `QuoteWorkflow.tsx` | Aperçu `previewQuote` puis `prepareQuote` sur Devis `draft/sent/viewed`, affichage du Projet relié. | Rendre accessible le même geste depuis Projets et CRM par navigation vers Devis exact, sans créer de deuxième service. |
| `ProjectCommercialService.prepare` | `ensureDossier`, une liaison Projet commercial, validation de **`previewSHA256`**, `current_quote_id` et `commercial_state=provisional`. | Le plan périmé doit être refusé et rechargé ; aucun clonage concurrent d'un Projet actif. |
| `ProjectCommercialService.linkRevision` | Nouvelle révision du même dossier, correspondance origine ligne, dossier conservé. | Ne pas utiliser `duplicate` comme si c'était une révision ; maintien de la provenance lors des changements. |
| `ProjectCommercialService.sync` | Contribution depuis plans de blueprint, conflit si élément travaillé sort du périmètre, règles `keep/archive/detach/delete` et test `isVirgin`. | **« Supprimer si vierge » supprime un élément géré**, PAS un Projet entier. |
| `ProjectCommercialService.accept` | Refuse ancienne révision/conflit/destination manquante puis **fige le Projet courant** `provisional → frozen`. | Ne pas changer projet par simple clic Finaliser le Devis ; bonne révision acceptée vérifiée. |
| `ProjectBlueprintCompositionService` | Multiples contributions selon lignes/options réellement présentes, origine et destination explicites, staging non matérialisant. | Ne pas préaffecter addon/site/page sans compatibilité. |
| `ProjectSiteService.applyBlueprint` | Génération structurée et idempotence par origines Site/Page lorsque applicable. | Ex. **1 Site / 5 Pages** sur un blueprint vitrine de référence seulement ; pas défaut universel de tous les devis. |
| `ProjectsApi` dans `src/shared/projects.ts` | Contrôles de statut, `prepareQuote`, `previewQuote`, `syncCommercial`, conflits et affectations. | **Pas d'API publique `deleteProject` identifiée** : « Repartir de zéro » projet entier nécessite un service transactionnel à concevoir. |

## 3. Deux scénarios distincts au changement du Devis
### A — Adapter le Projet existant (priorité, sans nouvelle identité)
1. Identifier **le bon Devis courant du dossier** et la révision à comparer à la dernière source utilisée par Projet.
2. Présenter **ajouts, retraits, quantités, versions, destinations, tâches, pages, ressources et provenance**, avant tout appel mutateur.
3. Confirmer `syncCommercial` avec contrôle de révision/périmètre ; ne supprimer que les **entités générées et encore vierges** que le service juge réellement retirables.
4. Pour entités travaillées : statut **Hors périmètre** et choix humains `Conserver / Archiver / Détacher / Supprimer si vierge`, avec droits/cohérence.
5. Conserver **le même `projectId`**, travail manuel, temps, ressources, secrets, compositions, exports, provenance et liens Site/Pages.
6. Laisser Devis/Projet préparatoires sans activation jusqu'à acceptation Abby.

### B — Repartir de zéro (nouveau Projet courant, ancien préservé ou retiré sans risque)
1. Montrer une **prévisualisation destructive non mutatrice** listant par catégorie : opérations de préparation, Sites, Pages, compos, fichiers, temps, ressources, historiques, secrets, exports Bridge, Workbenches, liens externes.
2. **Interdire la suppression physique** si dépendances, travail, fichiers ou liens externes existent. Proposer **archivage et remplacement** ; une suppression physique ne peut être étudiée que sur Projet vraiment vierge et garanties FK/preuves.
3. L'utilisateur confirme séparément qu'il souhaite **créer un nouveau Projet depuis la révision courante**, et que l'ancien Projet perd la place de **Projet courant du dossier**.
4. **Transaction unique** : mise hors circuit Projet source, création du Projet remplaçant, affectation `commercial_project_dossiers.project_id`, `current_quote_id`, `quotes.project_id` et autres tables réelles selon audit, reprise d'origines cohérentes, journal de provenance et idempotence. Ne pas faire plusieurs opérations indépendantes susceptibles de laisser deux Projets actifs pour la même révision.
5. **Revalidation** du blueprint et destinations, nouveau preview hash, mêmes lignes de Devis courantes et versions exactes.
6. Sur tout échec ou annulation : rollback de la transaction et maintien de l'ancien Projet actif, des fichiers/temps, de l'historique et du Devis ; **une archive insuffisante ne doit jamais masquer un mauvais lien**.
7. La future acceptation doit utiliser le **nouveau Projet courant** et refuser les anciens devis/révisions.

**Ne pas promettre que ce parcours B est déjà fonctionnel.** La décision métier est validée ; le mécanisme technique et ses tests restent à construire. Éviter « Supprimer tout » dans l'UI sans bilan d'impact et sauvegarde.

## 4. Sélection des blueprints et destinations
- **Source** : les prestations et options **réellement figurant dans les lignes du Devis courant** ; inclusions applicables de leur snapshot, pas les suggestions Catalogue 04D.
- **Provenance** : `quoteLineId`, `catalogVersionId`, composant, contribution, choix de template et `previewSHA256`, lien dossier/Projet/versions.
- **Plusieurs blueprints possibles** selon compositions commerciales vendues/proposées ; ne pas écraser une structure d'offre de base avec un addon de complément.
- **Multi-sites** : Site principal, site externe, site d'extension, page cible et destination exacte affichés avant création. Il n'existe pas une destination universelle.
- Les blocages de capacité `A/B/C/D` et limites de structure du plan s'appliquent **au service existant**, non via un texte UI qui autoriserait une écriture refusée.
- Les actions **« Initialiser les Sites/Pages »** et **« Préparer le Projet »** sont distinctes ; rejouer une initialisation n'ajoute ni doublon ni suppression manuelle.
- Les **pages déjà travaillées** ne sont pas remises à zéro sous prétexte qu'un blueprint ou une offre change de version.

## 5. Recette à programmer (20 scénarios, non exécutés)
| ID | Scénario | Attendu |
|---|---|---|
| R07C-01 | Préparer depuis Devis draft | Projet `provisional/to_prepare`, aucun Client |
| R07C-02 | Préparer depuis Devis sent/viewed | Même limite, sans accepter devis |
| R07C-03 | Rejouer `prepareQuote` | **Un seul Projet** associé au dossier |
| R07C-04 | Preview puis changement du devis | Hash invalide et préparation refusée |
| R07C-05 | Projet vitrine applicable | 1 Site/5 Pages selon blueprint réellement retenu |
| R07C-06 | Deuxième initialisation | Sites/Pages/nœuds sans doublon |
| R07C-07 | Offre+addon sur 2 Sites | Destinations compatibles exigées |
| R07C-08 | Ajouter option achetée au Devis révisé | Contribution ajoutée après synchronisation explicite |
| R07C-09 | Retirer prestation sans travail | Seuls éléments générés vierges retirables |
| R07C-10 | Retirer prestation sur Page travaillée | Conflit, aucune perte silencieuse |
| R07C-11 | Résoudre conflit « Conserver » | Élément préservé, provenance cohérente |
| R07C-12 | Résoudre conflit « Détacher » | Travail conservé comme élément manuel |
| R07C-13 | Adapter depuis nouvelle révision | Même Projet ID, source de révision courante |
| R07C-14 | Repartir de zéro avec Projet vierge | Nouvelle identité correcte, ancienne détachée/traitée transactionnellement |
| R07C-15 | Repartir de zéro avec temps/fichiers/Workbench | Archivage plutôt que suppression physique, aucune perte |
| R07C-16 | Annuler après aperçu du remplacement | Aucun changement SQL/fichier |
| R07C-17 | Erreur transaction de remplacement | Rollback total et aucun double Projet courant |
| R07C-18 | Accepter ancienne révision | Refus ; ne confirme pas Projet courant |
| R07C-19 | Accepter révision actuelle sans conflit | Projet courant figé, Client relié une seule fois |
| R07C-20 | Tests SQLite FK, 3 thèmes/densités et historique | Données de fixture seulement, bilan SHA |

## 6. Questions techniques ouvertes
**E190** schéma exact du remplacement atomique dossier↔Projet, **E191** distinction des ressources détachables vs archivables, **E192** gestion du fichier/secret/Bridge dans le remplacement, **E193** compatibilité des blueprints multi-contributions/versionnements, **E194** conservation du temps interne en prévisionnel, **E195** navigation Projet/Devis à la bonne révision.

**La décision de pouvoir repartir de zéro est acquise ; les règles d'intégrité sont des prérequis et non des restrictions facultatives.**
