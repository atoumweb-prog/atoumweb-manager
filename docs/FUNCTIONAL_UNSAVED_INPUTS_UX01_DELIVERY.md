# UX-01 — Protection des saisies : livraison A / B / C

Date : 09/10/2026. Branche : `codex/fix-manager-unsaved-inputs-ux01`, depuis `main@eb252d5cbd0e95137eafa2b4759fcbcfd7263eda`.

Les trois lots autorisés sont implémentés et vérifiés, avec commits distincts. Aucun accès à Validation-MSI, aucune refonte UX/UI V2, migration nouvelle, réparation historique ou fusion automatique. Les corrections UX-16/UX-03 de #81 restent séparées ; cette branche ne reprend pas leur code. Le diagnostic de #80 et la PR #81 ne sont pas modifiés.

## Revue finale de #83 — 09/10/2026

Trois anomalies UX-01 supplémentaires ont été reproduites par le harness avant correction : suppression d’une ligne Devis avant la confirmation de sortie, archivage Prospect sans prise en compte du groupe de brouillons (séparateur `:` au lieu de `/`), réduction d’une section Prospect qui démontait ses éditeurs.

Corrections limitées : garde de suppression avant mutation et groupe de paramètres propre à la ligne, sans fermer un éditeur voisin ; groupes Prospect hiérarchiques cohérents pour panneau/fiche/archivage et garde avant classement Perdu ; sections déjà ouvertes conservées montées lorsqu’elles sont réduites, masquées sans changer le graphisme ni sauvegarder. Les nouveaux tests vérifient Rester, abandon explicite, aucune mutation préalable et conservation du brouillon contractuel voisin.

- Typecheck OK ; suite complète **734/734**, 82 fichiers (`npm test -- --maxWorkers=2`). Un test permanent de hiérarchie Prospect ajouté ; huit contrôles natifs supplémentaires par thème, soit **177/177** avec `--lot-b --lot-c --review`. Fixtures supprimées, intégrité/FK/1–66 corrects.
- Compatibilité #81 (`593a4611`) : simulation `git merge-tree` puis tree combiné en copie temporaire, sans merge de branche. Conflit fonctionnel dans `src/main/ipc.ts` : conserver `scheduleDatabaseRestore(sourcePath, workspace)` et le détail de destination de #81, ainsi que les gardes de sortie et `app.quit()` de #83. `main.ts` combine automatiquement l’erreur de restauration #81 et le cleanup will-quit #83. **Typecheck combiné OK, 87/87 tests ciblés restauration/packs/terminaison/registre/fenêtres et 177/177 natifs combinés** ; aucune modification des sources de #81 dans la branche #83. Ce résultat valide cette résolution proposée, pas une fusion déjà faite.
- #80 : conflits uniquement dans PROJECT_STATUS et la roadmap, à résoudre en conservant les deux historiques et un état courant exact. Aucun conflit fonctionnel. #82 (`d52a2897`) : merge-tree sans conflit, uniquement documentaire ; Lot 01 prévoit bien la réutilisation de la garde UX-01. **Enregistrer et quitter reste une extension V2 et n’est pas ajouté ici.**
- CI `quality` : run du HEAD livré en file d’attente, non exécuté ; API runners : zéro runner enregistré. Workflow configuré pour self-hosted Windows X64, typecheck et npm test. Main non protégée au contrôle ; API protection/rulesets indisponible (403), aucune configuration GitHub modifiée. **Ne pas présenter la CI comme verte ni recommander une fusion sans son résultat.**
- Recommandation : PR #83 prête pour revue humaine après les corrections, fusion à attendre jusqu’au succès de quality ; lors de l’intégration avec #81/#80, appliquer les résolutions décrites et revérifier le tree intégré. Validation-MSI reste fermée/intacte. La copie combinée et sa jonction node_modules sont supprimées après vérification.

Les résultats des sections suivantes sont les checkpoints de livraison A/B/C antérieurs à cette revue.

## 1. Avant / après

Le [diagnostic initial](FUNCTIONAL_UNSAVED_INPUTS_UX01_DIAGNOSIS.md) a reproduit neuf pertes sur treize scénarios, confirmé trois protections locales et identifié le risque du changement différé de workspace.

| Lot | Avant | Correction et comportement vérifié |
| --- | --- | --- |
| A — sections contractuelles | Enregistrer l’administration effaçait la préparation non enregistrée du devis ; perte inverse à l’enregistrement de la préparation. Le refresh démontait aussi le détail. | Deux baselines/brouillons indépendants. Fusion trois voies des lectures, conservation des changements locaux et conflits visibles. Contrôle de baseline avant écriture : une version périmée est refusée sans mutation. Refresh sans démontage du détail. |
| B — sorties | Navigation, changement de fiche, fermeture de panneau, Escape/clic extérieur abandonnaient les drafts. Certains sous-formulaires et refresh écrasaient les saisies voisines. | Registre par éditeur et groupe ; une confirmation explicite avec **Rester** par défaut. Abandon limité aux éditeurs quittés. Sous-formulaires Prospection/Devis raccordés ; réponses de lecture Devis tardives invalidées. Protections locales conservées. |
| C — Electron/workspace | Fermeture/reload natifs sans garde ; `before-quit` fermait SQLite même si la fermeture devait être annulée. Choix workspace accepté sans prise en compte des drafts. | Publication des métadonnées de saisie au processus principal, garde beforeunload et coordination des fenêtres ; cleanup DB seulement à will-quit. Choix workspace protégé avant le sélecteur et recontrôlé après. Fenêtre Référence Prospect détachée incluse. |

### A — isolation des sections

`DraftSection` conserve baseline, valeur locale et conflits. Les champs propres localement suivent les lectures serveur ; les champs localement modifiés sont conservés ; une modification concurrente du même champ devient un conflit visible. Les tableaux sont traités comme une valeur indivisible. Une réponse de save utilise le brouillon soumis pour ne pas effacer une saisie plus récente.

Les paramètres du devis et l’administration ont des gardes optimistes distinctes dans `QuoteContractPreparationService`. L’API accepte une baseline optionnelle pour conserver la compatibilité des appels existants ; les éditeurs concernés la transmettent. La finalisation, les snapshots acceptés et les règles contractuelles restent inchangés.

Commit A : `df1b6f3`. Il a été vérifié séparément : typecheck, 47 tests ciblés et 33 contrôles natifs trois thèmes. Deux sens d’écrasement, absence de save implicite, refus d’une écriture concurrente et reprise explicite du conflit sont couverts.

### B — périmètre raccordé

- App : sidebar, recherche globale et événements métier avant remplacement de page/cible, y compris réouverture de la même cible.
- Prospection : création, changement d’entreprise/vue/onglet, fermeture des panneaux, identité/décisionnaire, coordonnées, contacts liés, recherche, qualification, besoin/offres, décision, actions et préparation de devis.
- Devis : wizard, lignes Catalogue/personnalisées, éditeur et paramètres de ligne, conditions, deux sections contractuelles, Builder (clauses, clause particulière, template et version), détail et transitions vers les autres fiches.
- Les groupes isolent les annulations : Annuler une ligne conserve un brouillon contractuel voisin ; réduire puis rouvrir une création conserve sa saisie ; une lecture tardive ne remplace pas la fiche ouverte ensuite.

Le registre connaît dirty et pending, sans enregistrement implicite. Une opération en cours empêche le départ, même si un choix positif est injecté. Un enregistrement raté ne marque pas le brouillon propre et ne vide pas les champs de création du Builder. Les confirmations ne se doublent pas entre pointerdown, clic de navigation et fermeture du fond.

Commit B : `80300a4`. À la reprise, les fichiers partagés B/C ont été séparés dans l’index sans reset du working tree. Une copie temporaire du tree B a passé typecheck et 81 contrôles natifs trois thèmes, sans dépendance au lot C. La copie et sa jonction node_modules ont été supprimées proprement ; les changements C ont été conservés.

### C — cycle de vie et bascule différée

Les seules métadonnées transmises à main sont les libellés d’éditeurs, l’état pending, un numéro de révision et une identité de chargement du renderer. Aucun contenu saisi ni secret ne circule dans ce signal. La nouvelle identité rend les états valides après reload ; les signaux plus anciens d’un même chargement sont ignorés.

Quitter agrège les fenêtres en une confirmation ; l’autorisation porte sur l’état exact. Une nouvelle saisie, une sauvegarde en cours ou un nouveau chargement invalide l’autorisation. Fermeture/rechargement passent par beforeunload puis will-prevent-unload ; les chemins clavier qui déclenchent ces mêmes événements héritent de la garde. Les tests exécutent les API natives close/reload/quit, sans prétendre rejouer séparément chaque raccourci du système.

Le changement de workspace reste différé : la DB active reste A jusqu’au redémarrage. **Rester** empêche l’ouverture du sélecteur ; annuler le sélecteur ne change ni le bootstrap ni le brouillon. Choisir B après confirmation conserve la saisie dans A et mémorise uniquement l’autorisation de quitter pour cet état précis ; cela ne marque pas le draft enregistré. Toute saisie ultérieure réclame une nouvelle confirmation. L’état est revérifié après le sélecteur pour prendre en compte les autres fenêtres.

La programmation d’une restauration utilise aussi cette garde de sortie et appelle quit plutôt que exit pour le redémarrage packagé. La sécurisation de la restauration elle-même appartient à UX-16/#81 ; aucune restauration réelle n’est effectuée dans cette recette.

## 2. Tests permanents et recette native

| Contrôle | Résultat |
| --- | --- |
| `npm run typecheck` | OK |
| `npm test -- src/shared/draftSection.test.ts src/shared/unsavedRegistry.test.ts src/shared/unsavedWindows.test.ts src/main/commercial/QuoteContractPreparationService.test.ts` | **75/75** : 8 sections + 9 registre + 19 fenêtres + 39 service |
| `npm test -- --maxWorkers=2` | **733/733**, 82 fichiers |
| `node scripts/check-unsaved-inputs-ui.cjs --lot-b --lot-c` | **153/153**, thèmes atoumweb/noir/blanc |
| B seul, tree de l’index en copie temporaire | Typecheck OK et **81/81** contrôles natifs |
| Migrations et relations | Registre **1–66** inchangé ; bases temporaires : integrity_check `ok`, foreign_key_check vide |

Le premier run complet à concurrence par défaut a eu un timeout de fixture de `OperationalRecipeService.test.ts` à 5 s et un timeout RPC worker sous charge : 732 succès, aucun échec d’assertion métier. Ce fichier repassé seul est vert **21/21** ; la suite complète avec deux workers est verte. Aucun délai de test ni règle métier n’a été modifié pour contourner l’échec.

Les tests ajoutés sont permanents : deux tests serveur de save périmé, huit de sections, neuf de registre et dix-neuf de coordination de fenêtres. Le harness exerce les composants App/React, preload, vrais IPC/services et SQLite dans un app.userData isolé. Les réponses des dialogues sont pilotées ; seul le sélecteur OS est dirigé vers une destination temporaire. Les latences de lecture/save sont injectées pour tester les courses, avec les services réels. Les refus de save périmé affichés dans le log sont attendus.

| Famille native | Scénarios vérifiés sur les trois thèmes |
| --- | --- |
| Sections | Enregistrer l’une conserve l’autre ; service ne sauve pas implicitement la voisine ; stale save refusé, draft conservé, refresh/conflit puis reprise explicite. |
| Navigation | Rester conserve champ et fiche ; abandon confirmé ouvre la destination ; un seul dialogue pour navigation/clic extérieur/backdrop ; brouillon voisin conservé à Annuler une ligne. |
| Prospection | Création réduite/rouverte conservée ; navigation protégée ; zéro save implicite ; création vierge sans faux avertissement. |
| Asynchronisme | Lecture lente de A ne remplace pas B ni sa nouvelle saisie ; save en cours bloque la fermeture ; état propre après confirmation seulement. |
| Natif | Quitter annulé conserve DB utilisable ; close annulé garde fenêtre/champ ; reload annulé garde le draft ; reload explicitement accepté abandonne la mémoire. |
| Workspace | Refus avant picker ; picker annulé garde bootstrap/draft ; B programmé et draft encore dans A ; nouvelle saisie révoque l’autorisation passée. |
| Détaché | Dirty signalé, quit global annulé protège les deux fenêtres, fermeture refusée puis volontaire, aucune fermeture SQLite involontaire. |
| Données | Intégrité/FK/1–66 ; fermeture des fenêtres/base et suppression de la fixture après les contrôles. |

La suite inclut les tests existants de replay/migrations, clauses/liens Catalogue et invariants de snapshots, modèles opérationnels et blueprints. Le code de migrations et les styles ne sont pas modifiés. Aucun SQLite, backup, capture ou output de recette n’est ajouté à Git. Aucune ouverture de Validation-MSI ; pas de nouveau dossier TEST ni de tentative de restauration sur cet environnement.

## 3. Limites explicites

- Registre commun réutilisable, **raccordement pilote Prospection/Devis/Référence Prospect seulement**. Les autres modules inventoriés dans le diagnostic nécessitent des lots ultérieurs ; cette livraison ne protège pas magiquement tous les formulaires du Manager.
- Aucun autosave, stockage durable de brouillon, récupération après crash, arrêt forcé ou coupure de courant. Un abandon confirmé détruit la saisie en mémoire concernée.
- Les conflits entre les deux sections contractuelles sont détectés ; aucun nouveau verrou global multiutilisateur n’est ajouté aux autres services métier.
- Les tests natifs sont automatisés sur fenêtres et données temporaires ; ce ne sont pas une recette globale utilisateur sur Validation-MSI ni une refonte visuelle.
- UX-16 et UX-03 restent dans #81. Aucun dossier historique n’est réparé automatiquement.

## 4. Fichiers affectés

Liste complète depuis `eb252d5c` (39 fichiers, dont cette livraison) :

| Groupe | Fichiers |
| --- | --- |
| Suivi | `PROJECT_STATUS.md`, `docs/MANAGER_BRIDGE_ROADMAP.md`, `docs/FUNCTIONAL_UNSAVED_INPUTS_UX01_DIAGNOSIS.md`, `docs/FUNCTIONAL_UNSAVED_INPUTS_UX01_DELIVERY.md` |
| Recette permanente | `scripts/check-unsaved-inputs-ui.cjs` |
| Service/IPC/lifecycle | `src/main/commercial/QuoteContractPreparationService.ts`, `src/main/commercial/QuoteContractPreparationService.test.ts`, `src/main/ipc.ts`, `src/main/main.ts`, `src/main/unsaved.ts`, `src/preload/preload.ts` |
| API et modèles partagés | `src/shared/contracts.ts`, `src/shared/quoteContractPreparation.ts`, `src/shared/draftSection.ts`, `src/shared/draftSection.test.ts`, `src/shared/unsavedRegistry.ts`, `src/shared/unsavedRegistry.test.ts`, `src/shared/unsavedWindows.ts`, `src/shared/unsavedWindows.test.ts` |
| Application et hooks | `src/renderer/App.tsx`, `src/renderer/unsaved/unsaved.tsx`, `src/renderer/unsaved/useDraftSection.ts`, `src/renderer/workflow/QuoteWorkflow.tsx` |
| Devis | `src/renderer/commercial/ContractTermsBuilder.tsx`, `src/renderer/commercial/QuoteContractPreparationPanel.tsx`, `src/renderer/commercial/QuoteLineEditor.tsx`, `src/renderer/commercial/QuoteLineParametersPanel.tsx`, `src/renderer/commercial/QuotesPage.tsx` |
| Prospection | `src/renderer/crm/ContactMethodsPanel.tsx`, `src/renderer/crm/ProspectActionsPanel.tsx`, `src/renderer/crm/ProspectDecisionEditor.tsx`, `src/renderer/crm/ProspectIdentityPanel.tsx`, `src/renderer/crm/ProspectLinkedContactsPanel.tsx`, `src/renderer/crm/ProspectNeedsPanel.tsx`, `src/renderer/crm/ProspectQualificationPanelV2.tsx`, `src/renderer/crm/ProspectQuotePanel.tsx`, `src/renderer/crm/ProspectReferenceWindow.tsx`, `src/renderer/crm/ProspectResearchPanel.tsx`, `src/renderer/crm/ProspectsPageV2.tsx` |

## 5. Livraison Git

Trois commits indépendants, sans rebase/reset des modifications reprises. PR corrective dédiée en draft vers main ; publication autorisée par la consigne A/B/C, aucune fusion automatique. AtoumWeb doit valider la CI et la fusion. Les SHAs complets et l’URL de PR sont fournis dans le retour de livraison ; ce document décrit le contenu du commit C sans référence circulaire à son propre hash.
