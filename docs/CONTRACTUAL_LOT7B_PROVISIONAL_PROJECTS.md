# Lot 7B — Projet prévisionnel et révisions commerciales

## Checkpoint courant — 04/10/2026 — Clôture locale dédiée Lot 7B

- AtoumWeb valide l'application réelle et autorise le **commit local dédié Lot 7B — projet prévisionnel et révisions commerciales**, sans push ni merge. Le commit contenant ce bloc clôture localement le 7B ; son SHA est consigné hors dépôt dans `outputs/contract-project-provisional-lot7b/cloture-git-lot7b.json`.
- **33 fichiers Lot 7B attendus uniquement**, contrôlés avant commit. Aucun artefact SQLite, sauvegarde, classeur, JSON de simulation ni sortie générée inclus. Aucun changement fonctionnel depuis **503/503 tests, typecheck OK, UI 54/54** ; migration 59 telle qu'appliquée. Seuls les trois documents de suivi ont été actualisés pour cette clôture.
- Validation-MSI reste en migrations **1–59**, SHA **c0bda21b97924758f211d463382001d24bb5872e20e2a61c5831802a942cd1fc**. Aucune écriture base pendant la clôture ; données historiques, 112 AW/112 catalogue V1 BROUILLON/118 clauses BROUILLON/409 liens et achats d'options vides conservés. Huit tables 7B vides ; aucun Projet historique requalifié.
- **RECETTE MANUELLE ATOUMWEB TOUJOURS À FAIRE avant validation fonctionnelle finale. Lot 8 non commencé.** Aucun push/merge, publication, Abby, Bridge ou 8C. Attendre une instruction séparée pour la suite.

## Historique — 04/10/2026 — Lot 7B appliqué, avant commit

- AtoumWeb valide la préparation et autorise **migration 59 seule**. Application réelle terminée, aucun commit autorisé ; attendre validation du bilan réel. Branche `feature/project-page-compositions-v1`, HEAD `c1cc00c9934ce78909f6ccf4b9b37952657e3c50` inchangé.
- Avant écriture : les **33 fichiers exacts**, **350 sources** et preuves validées **503/503 tests, typecheck OK, UI 54/54** ont été revérifiés ; aucun changement fonctionnel ni répétition inutile de suite. Index vide, Manager non démarré.
- Sauvegarde physique sous verrou : `C:\DEV\02_DONNEES\AtoumWeb\Validation-MSI\backups\before-lot7b-2026-10-04T07-51-43-253Z.sqlite`, SHA **ca5ab5a58af53197662000e0fb9edf27762b0c93cd606e2b49ca9391dde09db5**, égal à la source. Seconde écriture concurrente refusée, aucun WAL/SHM/journal actif. Jeton `8fa7d0de1b7650f425d3571197846293d4452b80ba6df488d8504340eabdef2c` recalculé avant écriture.
- **Migrations 1–59** ; schéma 7B présent, huit nouvelles tables **vides**, zéro backfill. Reconstruction projects : les **2 Projets / 19 anciennes colonnes / toutes les cellules** et les **21 tables qui les référencent** restent exacts. Indexes et trigger runtime `demo_track_projects` restaurés à SQL identique dans la transaction. Anciens Projets `legacy`, nouvelles relations Prospect/dossier/devis accepté/gel null.
- **104 tables métier + sqlite_sequence** préservées. 3 anciens devis / 6 lignes, 2 Projets, 36 nœuds, 3 Sites / 11 liens Pages, documents et provenance historiques exacts ; aucun Client/Projet/plan/Site/Page/objet Lot 8 créé.
- **112 AW / 112 catalogue V1 BROUILLON / 118 clauses BROUILLON / 409 liens / quote_option_purchases vide** intacts. Aucune publication ni injection rétroactive.
- Intégrité **ok**, FK **vide** ; rejeu aucune mutation logique **ni physique** ; checkpoints et fermeture réussis, aucun auxiliaire résiduel. SHA final **c0bda21b97924758f211d463382001d24bb5872e20e2a61c5831802a942cd1fc**. Contre-vérification Python/SQLite indépendante en lecture immutable depuis la sauvegarde réussie.
- XLSX inchangé, SHA **6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8**. Bilan/proofs dans `outputs/contract-project-provisional-lot7b/application-lot7b-validation-msi.md/json` et `contre-verification-lot7b.json`.
- **Lot 7B appliqué, non committé ; attendre validation du bilan réel. Recette manuelle AtoumWeb toujours à faire.** Aucun Lot 8, Abby, Bridge, 8C, publication, push/merge.

## Préparation historique conservée

Préparation locale au **04/10/2026**, non appliquée à Validation-MSI et non committée. Recette manuelle AtoumWeb à faire. Aucun Lot 8 opérationnel, Abby, Bridge, 8C, publication, push ou merge.

## Base et autorisation

Le Lot 7 est clôturé par le commit local `c1cc00c9934ce78909f6ccf4b9b37952657e3c50`, branche `feature/project-page-compositions-v1`, 27 fichiers validés uniquement. Working tree propre immédiatement après ce commit. Les changements ci-dessous sont séparés et restent non committés.

La décision AtoumWeb validée adapte le parcours antérieur qui réservait la création du Projet à l'acceptation : un périmètre exploitable peut préparer **un seul Projet avant acceptation**, sans Client artificiel. Elle ne déclenche aucun objet opérationnel.

## Modèle et cycle commercial

`Prospect → devis exploitable → action Préparer le Projet → Projet prévisionnel → révisions explicites/synchronisations → acceptation → même Projet rattaché au Client et périmètre figé`

- `commercial_project_dossiers` porte l'identité stable du dossier, sa révision courante et l'unique Projet. Les relations sont explicites ; aucun rapprochement par nom.
- `commercial_quote_revisions` associe les devis au dossier, avec numéro, parent et date. Une duplication indépendante reste un nouveau dossier ; **Créer une révision du même dossier** conserve le Projet.
- `commercial_quote_line_origins` conserve une origine stable de ligne lors d'une révision explicite. La ligne de la révision courante conserve les quantités et la provenance d'achat Lot 6.
- `projects.commercial_state` distingue `legacy`, `provisional`, `frozen`. `frozen` signifie accepté et figé dans la même transaction ; il n'existe aucun état accepté intermédiaire durable.
- Les statuts de travail restent distincts. À l'acceptation, le Projet reste **À préparer** ; aucun passage automatique En cours ni activation de maintenance/facturation.
- Avant acceptation, le Projet peut référencer un Prospect sans Client ; après acceptation, il référence le Client fourni par le workflow CRM existant, sans changer son identité.
- L'emplacement maître de Ressources utilise l'identité du dossier sous `projets-previsionnels/<dossier>/Ressources`. Il ne change pas lors de Prospect → Client ; aucun déplacement ni copie implicite de fichiers.

## Migration 59 préparée

`src/main/database/projectProvisionalMigration.ts`, enregistrée après 58. **SQL des migrations 1–58 inchangés. Aucun backfill.**

La migration ajoute huit tables : dossier, révisions commerciales, origines de lignes, snapshots de périmètre, bindings préparés des nœuds et Sites, suivi des entités et conflits. Elle ajoute l'archivage des nœuds/prérequis et le cycle commercial/Prospect/devis accepté au Projet.

**La modification de la contrainte Client de `projects` exige une reconstruction SQLite de cette table**, avec copie exacte de ses 19 anciennes colonnes, conservation des identifiants, rétablissement des deux indexes existants et vérification des clés étrangères dans la transaction. Ce n'est pas un simple `ALTER ADD COLUMN`. Le runner existant coupe/rétablit les FK pour cette migration ; le contrôle final provoque un rollback si une FK est invalide. Les Projets existants restent `legacy`, sans dossier ni plan rétroactif.

Des triggers empêchent les rattachements opérationnels aux Projets prévisionnels : abonnements maintenance, packs, demandes d'intervention, interventions et éléments de facturation. Aucun de ces objets n'est créé par 7B.

Sur la copie de Validation-MSI : **104 tables antérieures**, toutes leurs anciennes colonnes/lignes conservées à la migration ; intégrité OK et FK vide ; second passage de migration vide. Une application réelle devra faire l'objet d'une nouvelle autorisation et d'une sauvegarde coordonnée sous verrou.

## Révisions et synchronisation différentielle

Le moteur **Lot 7 existant** reste la source unique des contributions `base/addon`, destinations et politiques `once/per_unit`. Les bases concurrentes et destinations ambiguës restent bloquées ; aucun mapping réel AW n'est inventé.

1. Résoudre uniquement les lignes réellement vendues : composants obligatoires inclus, lignes additionnelles et achats optionnels persistés. Une option disponible ne produit aucune contribution ni prérequis.
2. Identifier une contribution par origine stable de ligne, composant, versions et lien/politique blueprint. Le nom affiché ne sert jamais d'identité commerciale.
3. Appliquer les ajouts via le moteur existant ; préserver les unités déjà liées. Ajouter seulement les unités manquantes.
4. Identifier les unités/lignes retirées ; traiter les descendants avant leurs parents. Conserver les conteneurs encore partagés.
5. Comparer chaque entité gérée à son état initial, et rechercher ses références externes (temps, ressources, liens, descendants…). Un élément réellement vierge peut être retiré ; son historique reste dans les snapshots.
6. Conserver tout élément modifié ou référencé et émettre **Hors périmètre commercial — décision requise**.
7. Synchroniser les prérequis gérés issus des seules ventes, sans adopter un prérequis manuel par son libellé.
8. Enregistrer une révision immuable : devis source, numéro commercial, séquence de synchronisation, lignes exactes, quantités/provenance, plan complet, date et SHA-256. Un rejeu du même périmètre n'ajoute ni revision ni activité.

Les ajouts manuels, renommages, déplacements, rattachements Pages, statuts, temps et ressources restent conservés. Un choix de blueprint manuel explicite est conservé dans le dossier jusqu'au gel.

## Conflits manuels

- **Conserver** : maintenir le travail hors périmètre, avec décision tracée.
- **Archiver** : conserver les lignes historiques, masquer l'entité active ; les descendants actifs doivent être résolus avant leur parent.
- **Détacher de la provenance** : conserver le travail, retirer son binding actif ; une vente ultérieure génère une entité distincte.
- **Supprimer si vierge** : refus si modifié ou encore référencé. Aucune suppression du travail avec cette action.

Chaque décision est journalisée. Une unité à nouveau vendue avant résolution peut revenir au périmètre sans perdre son identité ; cette fermeture du conflit est également tracée. Les conflits ouverts empêchent l'acceptation.

## Acceptation exacte et atomique

Le workflow QuoteService effectue sous savepoint commun : contrôles contractuels existants, conversion Prospect → Client, dernière synchronisation, vérification des conflits, fixation du plan 58 et des bindings acceptés, rattachement du même Projet au Client, devis exact accepté et date de gel.

Une ancienne révision ne peut pas activer le dossier courant. Un échec pendant le gel annule aussi la conversion Client et l'acceptation du devis. `transformQuote()` retourne le Projet déjà figé et n'en crée jamais un second. Après gel, synchronisation commerciale et nouvelle révision du dossier sont refusées. Le rejeu Sites/Pages utilise le plan accepté, pas la bibliothèque courante.

Les devis/Projets historiques suivent leur ancien parcours et ne sont pas requalifiés automatiquement.

## Interface proposée et vérifiée sur fixtures

- Devis exploitable : **Préparer le Projet**, choix automatique du plan ou override explicite, date prévisionnelle.
- Devis : **Créer une révision du même dossier**, distinct de **Dupliquer en nouveau devis** (indépendant).
- Devis/Projet : état prévisionnel, **Synchroniser le périmètre commercial**, historique des révisions et décisions de conflits lisibles.
- Après acceptation : **Périmètre accepté et figé**, sans commande de synchronisation.
- Projets : badge/groupe prévisionnel et interventions désactivées. Le backend et les triggers restent la protection effective.

Contrôles Chromium/React isolés : **54/54**, Blanc/Noir/AtoumWeb, composants réels avec API simulée, sans démarrer Manager ni charger sa base. Captures vérifiées visuellement. Ces contrôles ne remplacent pas la recette manuelle dans le Manager réel.

## Tests et simulation

- **24 nouveaux tests 7B** dans `ProjectCommercialService.test.ts` : Prospect sans Client, base Vitrine 1/5, Page ×2/augmentation/diminution, Blog vierge/travaillé, travail descendant et temps, ajouts/renommages manuels, options achetées seules, révision explicite/indépendante, acceptation et rollback, ancien Projet, snapshots immuables, migration sans backfill, conflits keep/detach/archive et réintégration au périmètre, override explicite et provenance finale exacte.
- **Suite complète : 503/503**, 62 fichiers, 0 échec, runtime Electron 44.3.0 / Node 24.20.0.
- **Typecheck : sortie 0.** `git diff --check` sans erreur.
- Simulation **11 observations** sur copie physique temporaire ; un Projet, 1 Site/5 Pages puis 7, puis 6 ; Blog ajouté/retiré ; Blog travaillé conservé avec conflit ; Page manuelle et renommage conservés ; option SEO achetée sans Page inventée ; révision et acceptation conservent les identités. État final 1 Site/8 Pages ; seconde acceptation/conversion/rejeu sans mutation.
- Les 3 devis, 6 lignes, 2 Projets, 36 nœuds, 3 Sites et 11 liens Pages historiques demeurent identiques sur la copie. 112 AW, 112 versions catalogue V1 BROUILLON, 118 clauses BROUILLON et 409 liens préservés ; aucune publication V1. Les publications de test concernent exclusivement des fixtures synthétiques sur copie.

## Sources réelles préservées

Aucune connexion SQLite ni écriture sur Validation-MSI ; lecture binaire pour empreinte/copie uniquement. Manager non démarré. **La base reste en migrations 1–58, migration 59 pendante.**

SHA-256 Validation-MSI avant = après :
`ca5ab5a58af53197662000e0fb9edf27762b0c93cd606e2b49ca9391dde09db5`.

SHA-256 XLSX avant = après :
`6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8`.

## Limites et recette restant à faire

- Recette manuelle AtoumWeb requise après autorisation d'application 59. **Ne pas démarrer Manager sur Validation-MSI avant cette autorisation** : son initialisation appliquerait 59.
- Les 112 références et 118 clauses restent en brouillon. Les vraies règles `AW → blueprint → rôle → destination → quantité` doivent être validées/configurées séparément avant une recette commerciale V1. Les tests ne les inventent pas.
- Les synchronisations sont explicites dans cette version ; les changements du devis ne modifient pas le Projet en arrière-plan. L'acceptation effectue toutefois obligatoirement une dernière synchronisation.
- Un échec de création des dossiers de Ressources après la transaction peut laisser le Projet préparé en base ; réessayer **Préparer le Projet** conserve la même identité et répare les dossiers. Les fichiers externes ne participent pas à la transaction SQLite.
- Les conflits doivent être synchronisés et résolus avant acceptation ; un échec à l'acceptation annule intégralement les changements de sa transaction.
- Les choix d'archivage/détachement sont tracés et conservent les données ; aucun assistant général de restauration des nœuds archivés n'est ajouté dans ce lot.
- Aucune édition commerciale d'un Projet figé, aucun avenant automatisé, maintenance, pack, abonnement ou intervention opérationnelle. Aucun Lot 8/Abby/Bridge/8C.

## Fichiers et preuves

Liste exhaustive et SHA de chaque fichier : `outputs/contract-project-provisional-lot7b/fermeture-technique-lot7b.json`, hors dépôt.

Preuves dans `C:/Users/AtoumWeb/Documents/ChatGPT/manager atoumweb+ bridge/outputs/contract-project-provisional-lot7b/` :
`simulation-lot7b.md/json`, `ui-lot7b.json`, captures `ui-provisional-blanc/noir/atoumweb.png`, `npm-test-final-summary.log`, `typecheck-final.log`, `bilan-lot7b.md`, `fermeture-technique-lot7b.json`.

**Arrêt avant toute application réelle. Lot 7B non committé. Attendre validation AtoumWeb.**
