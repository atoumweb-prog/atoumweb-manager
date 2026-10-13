# UX/UI V2 — 03A.1 Matrice CRM vérifiée sur main

Date : 13/10/2026. Base : `main@278ff2da022ba5e58ae333de11e74bc4d12a2995`, issue du merge #97. Source cible : `docs/ux-v2/LOT-03A-MATRICE-CRM-EXISTANT-CIBLE.md` (branche `docs/ux-v2-reference-v1`). Revue statique ciblée **uniquement** ; aucune exécution ni test revendiqué.

## Chaîne contrôle → handler → IPC → service → état → test

| Contrôle/usage | Handler renderer actuel | IPC appelé | Service réel | État/cible | Preuve / manque |
|---|---|---|---|---|---|
| Nouveau Prospect | `ProspectsPageV2.submitProspect` (vers ligne 305) | `crm.prospects.create` | CRM | Création `stage='new'` | Appel source vérifié ; scénario R03A-01 non exécuté |
| Démarrer la prospection | `startProspecting` (362) → `changeStage` (335) | `crm.prospects.changeStage` | `CrmService.changeProspectStage` (590) | `new → qualifying`, timestamp `prospectingStartedAt` | Chaîne source vérifiée ; vérifier la réaction UI en cas de refus |
| Glisser / changer de colonne | `handleGroupDrop` → `changeStage` | `crm.prospects.changeStage` | Transitions manuelles encadrées en service | Aucune mise à jour de stage front directe | Contrôle visible en 599–605, appels retrouvés ; essais DnD à mener |
| Qualification incomplète | `changeStage` (335–359) | `changeStage(id,stage,null,true)` après confirmation | Qualification côté `CrmService` (602+) | Dérogation explicite uniquement qualifying→need_identified | Handler et validation service vérifiés ; UX-01 et avis utilisateur à tester |
| Température | `updateTemperature` (vers 330) | `crm.prospects.update` | CRM | Température distincte du stage | Appel trouvé ; test de non-mutation du stage à faire |
| Prospect perdu | `markLost` (402) | `updateQualification`, puis `changeStage('lost',reason)` | CRM (raison obligatoire) | `lost`, historique distinct Conversion | Chemin source vérifié ; test refus sans raison et atomicité à prévoir |
| Archive Prospect | `archive` (400) | `workflow.archiveProspect` | Workflow | Archivage, non conversion | UX-01 invoqué ; vérifier fenêtre/pending et refus |
| Devis prêt à envoyer | `ProspectQuotePanel` (140) | `quotes.finalize` | Service Devis | Finalisation **du devis pour envoi**, pas accord de principe commercial | Appel présent ; ne pas l'utiliser pour la colonne Finalisation |
| Devis accepté | `ProspectQuotePanel` (206) | `quotes.accept` | Devis / conversion à tracer | Client réellement acquis | Appel vérifié ; chaîne transactionnelle à qualifier avant déclaration end-to-end |
| Conversion idempotente | Chemin métier déclenché en aval du devis accepté (à vérifier) | Pas de nouvel IPC requis ici | `CrmService.convertProspectToClient` (941–995) | Si `clientAccountId`, réutilise Client ; sinon cherche organisation/contact puis crée, lie et historise | Implémentation service vérifiée ; appel exact depuis `quotes.accept` et test complet à confirmer |
| Onglets fiche Client | `ClientsPage` (45, 616–621) | Listes devis/projets/maintenance/interventions en IPC existants | Services existants | Six onglets actuels ; huit cibles | Source vérifiée ; pas de modification UI ici |

## Écarts au référentiel

1. Le pipeline actuel expose **5 groupes** (`PIPELINE_GROUPS` vers 94–100), contre **6 colonnes actives** et **Conversion historique en septième** souhaitées dans 03B. `new` est déjà exclu des actifs par `pipelineActive` (233), conformément à E72. **Finalisation** n'a pas d'état SQL ; E73 marqueur volontaire reste à résoudre et ne doit pas être improvisé.
2. `MANUAL_PROSPECT_STAGE_TRANSITIONS` (51–63) refuse notamment les passages directs depuis `need_identified` vers les étapes devis par transition manuelle, et `won` n'est pas cible manuelle. Une sixième colonne visuelle ne doit pas contourner ces gardes.
3. `startProspecting` appelle `changeStage`, qui absorbe les erreurs dans le handler, puis ouvre la fiche `setDeskModeId` sans vérifier explicitement une transition confirmée. **Risque à reproduire** : présentation de la fiche après échec avec stage `new`; ce n'est pas une conversion fictive prouvée. Ne pas corriger avant test ciblé.
4. `CrmService.convertProspectToClient` possède une transaction et une sortie idempotente pour un Prospect déjà lié, mais il faut tracer la route `quotes.accept` et les cas de révision/organisation/contact avant de déclarer la chaîne intégrale validée.
5. La fiche Client a encore **6 onglets** ; la cible normative en prévoit **8**, en réutilisant les mêmes sources plutôt qu'en ajoutant des copies. 03D dépend du raccord de navigation 02C (qui modifie localement ClientsPage).
6. Ne pas confondre `stage='won'` seul avec conversion achevée : la vue Conversion devra exiger un `clientAccountId` réel, à confirmer par recette.

## Plan de l'incrément 03A.2 / 03B (sans changement métier implicite)

- Compléter la preuve du chemin `quotes.accept → convertProspectToClient`, états/provenance et tests existants.
- Tester sur fixtures TEMP le refus de transition, la qualification incomplète et `new` hors pipeline, sans manipuler Validation-MSI.
- Qualifier le modèle **Finalisation / accord de principe** E73 (événement ou marqueur daté, auteur, devis/révision), sans changer stage SQL.
- Préparer 03B sur une branche indépendante, hors `App.tsx`, `GlobalSearch` et `ClientsPage` tant que 02C n'est pas stabilisé ; ne pas initier le code métier de E73 sans décision explicite.
- Reprendre 03C–03E dans l'ordre normatif après 03B, conserver demandes/devis/projets/conversion actuels.

## Invariants et preuves

- Aucune suppression, migration, retarget, fusion ou lancement CI.
- Aucun changement des données réelles.
- Aucun test Windows, Vitest, Electron, SQL ou CI n'a été exécuté dans ce checkpoint : **constats de code uniquement**.
- Les tests R03A-01…18 du document normatif restent à exécuter sur le futur code.
