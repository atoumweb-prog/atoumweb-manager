# Lot réel rail + 02B.5 / 02B.6 — bilan technique local

13/10/2026. Le rail et l'en-tête V2 sont raccordés au véritable Manager, au-delà des ateliers. Le lot est validé techniquement sur des fixtures Windows isolées. Aucun push ni PR ni CI hébergée pour ce nouveau lot ; aucune intégration de ce code dans main sans accord.

## 1. Consolidation #96 terminée

Références vérifiées avant fusion : HEAD `8ef551cf0f1499ca95ecea3c354134dbb5f97362`, base `a01c60d9b92c249ce3f8495a634e924eb71fed9c`, #662 SUCCESS, PR ouverte/fusionnable/sans conflit. Ready for review puis merge commit normal, sans suppression :

- main / merge : `61960d5551eaa649326ddde46d3e2a9cb592b5ec`.
- Arbre : `1f3d6f6e724e62d775e06f58c409960c3abd43e3`, identique au candidat #662.
- Unique CI post-fusion [#663](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38355370526) : SUCCESS, tentative1, checkout61960d5 ; installation/typecheckOK ; 893/893,97fichiers,197,95s ; restaurations35/35 etbinaires6/6 ; DELETE0,992s/WAL0,570s ; aucunRPC/timeout. Run4min39s.
- #90–93 et leurs HEAD/bases/branches restent inchangés et ouverts en draft. Aucun retarget, fermeture, rebase, squash ou force-push.

## 2. Références et périmètre du nouveau lot

Branche locale `codex/ux-v2-real-shell-02b`, créée depuis main61960d5 après SUCCESS663. Candidat code réellement testé : `8105de4d41a5583a164a361f96505232db0b5fc2`, arbre `b3e28743bba62fd331d247351b952b022651944d`. Le commit documentaire final pourra ajouter uniquement ce bilan et le suivi ; les preuves ci-dessous portent sur les SHA indiqués, pas sur un HEAD documentaire prétendument rejoué.

- App utilise NavigationRail et WorkspaceHeader ; les 17 clés NAV_ITEMS, ouvertures ciblées et événements existants sont conservés. Rail E42 réduit visible : Accueil/favoris/cinq groupes ; développé : toutes les destinations. Navigation volontaire protégée avant démontage par requestUnsavedExit.
- GlobalTimer véritable reste un unique composant monté dans un slot stable de l'en-tête, sans copie de session ni nouveau moteur. Ses services, heartbeat, calculs, opérations pause/reprise/arrêt/changement/récupération et décisions d'intervention sont inchangés. Le repli est visuel ; aucun appel TimeService par préférence ou favori.
- GlobalSearch et GlobalClock existants réutilisés. Recherche de données/routage non réécrits ; seules la consommation d'Échap, l'invalidation d'une réponse après fermeture et le retour au déclencheur sont corrigés dans le périmètre de couche 02B.
- Apparence du rail/header persistée par le propriétaire settings du workspace et l'adaptateur 01F existant. Ajout d'un IPC de présentation exclusivement pour les deux clés connues, cadre principal vérifié, données normalisées, erreur visible, notification multi-fenêtres après écriture confirmée. Les IPC métier existants ne sont pas remplacés. Pas de migration.
- Bandeau Bibliothèque local indépendant. Favoris : références de modules, reset natif Annuler par défaut. Aucun identifiant de dossier, note, recherche ou session sauvegardé dans ces préférences.
- Les notifications et leurs actions Explorateur restent celles d'App ; aucune commande métier nouvelle. Logo/pictogrammes non approuvés gardent leurs emplacements provisoires ; version affichée depuis bootstrap.

## 3. Corrections et reproductions ciblées

| Cause / risque | Correction | Preuve permanente |
|---|---|---|
| pointerdown sur repli traité comme fermeture extérieure du chrono | Gestes de présentation exclus de l'annulation ; focus conservé ; clic extérieur incident avec dirty/pending ne jette pas la saisie et ne précède pas l'action d'une seconde confirmation | Vrais lancement/pause/switch/arrêt/récupération, texte/session/instance, compte exact de confirmations |
| Escape dans recherche remontait jusqu'au module ; réponse en vol pouvait rouvrir les résultats | Consommation locale et incrément de l'époque de requête à la fermeture ; retour focus propre au second Escape | Listener témoin window, vraie Bibliothèque avec métadonnées dirty et résultats vides/non vides |
| Enregistrement chrono désactivait un champ et laissait le focus tomber hors dialogue | Champs verrouillés pendant busy ; focus dans le dialogue, rôle/tabIndex, retour au déclencheur à fermeture | Pause async réelle retardée dans TEMP, Rester seul pendant pending, motif conservé |
| Escape/fermeture/changement de module effaçaient les métadonnées Bibliothèque sans garde | Même registre UX-01 pour cet éditeur ; baseline par dossier, rafraîchissement conservant les modifications ; confirmation avant fermeture/annulation/changement de fiche | Rester/Quitter et serveur inchangé lors de discard ; late edit pendant save, identité DOM et texte conservés, seul snapshot soumis persisté |
| Demande timer-context pouvait remplacer une saisie en cours | Passage par la garde du dialogue existante avant application du contexte | Rester conserve exactement le formulaire courant |
| Styles AppButton limités à content-area, donc contrôles du vrai header non conformes aux tokens | Même règle partagée étendue par :is à aw-workspace-header ; sans copie d'une bibliothèque de styles | Hauteur des contrôles dans neuf configurations, nouvelles captures synchronisées |

Aucune deuxième architecture UX-01. Les nouvelles protections utilisent useUnsavedDraft/requestUnsavedExit et la confirmation native existante. Les règles des services et de la facturation ne changent pas. Les annulations n'enregistrent rien implicitement ; pending ne peut pas être considéré enregistré.

Deux défauts du banc ont aussi été corrigés, sans diminuer ses assertions : capture de l'identité DOM avant montage (valeur tardive déjà conservée, référence null) et attente de l'ancienne classe sidebar. Les anciennes preuves/fichiers de logs d'échec sont conservés. Aucun timeout augmenté, aucun test désactivé, aucun retry automatique.

## 4. Vérifications réellement exécutées

| Contrôle | SHA / résultat |
|---|---|
| Typecheck final | 8105de4, OK |
| Suite complète finale, deux workers | 8105de4, **907/907,99fichiers,96,13s**, sortie0, sansRPC |
| Restaurations/binaire dans cette suite | **35/35**, fichier6,113s, DELETE0,378s ; **6/6**,119ms ; WAL/A→B réussis mais durées individuelles non émises par ce reporter |
| Ciblés schémas/header/rail/adapter/IPC | **42/42**, cinqfichiers,1,14s au checkpoint développement ; les mêmes14 nouveaux tests sont dans la suite finale907 |
| Renderer réel avec captures | 8105de4, **374/374**,17routes,86visites,63/63captures synchronisées ; consoleErrors:[], overflowCandidates:[] |
| UX-01 natif complet | 8105de4, **183/183**, troisthèmes, failed:[] ; intégrité/FK/migrations1–66 TEMP et cleanup confirmés |
| Régression atelier02A | fc98e9a, **117+8=125/125**, deuxprocessus, ninecaptures, dirty:false |
| Régression atelier02B | fc98e9a, **158+9=167/167**, deuxprocessus,18captures, dirty:false |
| Fondation01F / Échap | fc98e9a, **123+14=137/137**,61régressionsÉchappermanentes, comptes exacts/textes/identités ; deuxprocessus/migrations/FK/intégrité/tableshorssettingsinchangées |

Les trois derniers bancs précèdent uniquement la portée CSS étendue aux boutons d'en-tête et la garde du clic extérieur du vrai GlobalTimer. Leurs composants pilotes n'utilisent pas le GlobalTimer réel ; la règle :is reste équivalente dans content-area. Ils ne sont pas revendiqués comme de nouvelles exécutions sur8105de4. Les deux changements ont été contrôlés dans le renderer réel final et la suite complète finale. Les résultats Electron ne sont pas additionnés à Vitest.

Un premier batch sur bad23c6 avait validé907/907 avant de s'arrêter au premier problème de synchronisation du banc natif. Le batch native-only suivant conserve explicitement ses contrôles non exécutés et son arrêt sur le sélecteur historique UX-01 ; ces manifests ne sont pas présentés comme des validations complètes. Après correction des fixtures, les contrôles concernés ont été rejoués. Le dernier changement fonctionnel pointerdown a justifié le typecheck/suite finale et la recette réelle au mêmeSHA8105de4.

Le banc réel exécute le vrai App.tsx, le preload de production et les véritables services/handlers sur une nouvelle base TEMP. Il utilise des dossiers/session/intervention/composant fictifs locaux, détruits au cleanup. Les contrôles de présentation comparent les tables métier avant/après ; les mutations explicitement demandées par les scénarios métier TEMP restent distinctes de ces comparaisons. Ce n'est ni le MSI installé ni une certification d'un package Forge.

Trois thèmes × trois densités :54captures de sixécrans et9captures du véritable dialogue de lancement en headercompact. Clavier natif, focus,100/125/150% dezoom et fenêtresétroites ; même DOM de timer entre replis/destinations, session id stable ; save async/pending, récupération réelle et annulations assertées. Revue visuelle directe de quatrecaptures dont les deux finales AtoumWeb/Confort-Devis et Blanc/Confort+-dialogue ; pas de nouvelle recette humaine globale ou WCAG revendiquée.

## 5. Preuves locales et automatisation

- scripts/check-ux-v2-real-shell.cjs : ordonnanceur local, HEAD/arbre/dirty figés, logs et durées, arrêt immédiat au premier échec ; aucune opération GitHub/retry. --native-only identifie clairement typecheck/Vitest comme non exécutés, pour les replays ciblés, sans modifier ces tests.
- outputs/real-shell-typecheck-final.log, real-shell-vitest-final.log, real-shell-renderer-delivery.log, real-shell-ux01-delivery.log.
- captures finales : outputs/real-shell-delivery-captures (63images, marqueur de frame vérifié).
- Régressions : outputs/real-shell-02a-final.log, real-shell-02b-final.log, real-shell-01f-final.log.
- Manifests de batch et échecs intermédiaires conservés sous outputs/real-shell-bad23c65-* et outputs/real-shell-100094a4-* ; aucun de ces artefacts ignorés dans Git.

## 6. Fichiers du lot

Production : App.tsx ; WorkspaceHeader.tsx ; NavigationRail.tsx ; GlobalTimer.tsx ; GlobalSearch.tsx ; AtoumWebLibraryPage.tsx ; manager-shell.css ; ui-consistency-v2.css ; preload/preload.ts ; main/ipc.ts (enregistrement additionnel) ; main/shellVisualPreferencesIpc.ts ; shared/contracts.ts ; shared/shellVisualPreferences.ts.

Tests/bancs : main/shellVisualPreferencesIpc.test.ts ; shared/shellVisualPreferences.test.ts ; scripts/check-ux-v2-real-shell.cjs ; scripts/fixtures/real-shell-scenarios.cjs ; scripts/check-ux-v2-lot01a-real-ui.cjs ; scripts/check-unsaved-inputs-ui.cjs. Documentation : PROJECT_STATUS.md et ce bilan.

Contrôle diff : restore.ts,35testsrestore,sixbinaires,migrations,servicesmain/time, registreUX-01, protectionsSQLite/RPC,workflow/lockfile inchangés. Aucun service commercial/contrat/CGV ni donnée réelle modifié. Seul l'IPC visuel est ajouté ; il ne permet aucune lecture/écriture de clé métier arbitraire.

## 7. État de livraison et limites

**02B.5 : raccordement réel réalisé localement. 02B.6 : recette technique Windows du périmètre réalisé, verte.** Publication/PR/CI du nouveau lot non effectuées conformément à la restriction ; main reste61960d5. Aucun Validation-MSI, budget, branchehistorique90–93 ou règle métier touché. Les commits restent locaux.

La recette humaine globale reste différée. Les visuels finaux/logo et raccourcisOS/lecteurd'écran restent à valider ; aucune combinaison globale nouvelle. Les collisions internes éventuelles des sous-éditeurs Projets/Bridge restent des points de l'audit, pas une refonte de ces modules ni une prétention de certification exhaustive de tous leurs overlays. Les couches globales raccordées sont qualifiées contre la propagation vers un listener de module et les vrais éditeurs Bibliothèque/Prospection/Devis.

02C n'est pas développé : aucun nouveau service/requêtage/routage de recherche, seulement réemploi et correction de fermeture de la couche existante. Aucun déploiement Bridge/WordPress, installation MSI ou activation de données client.

Prochaine décision : autoriser publication du candidat local et une PR draft/CI candidate unique. Geler le HEAD, comparer ses sources au code8105de4 et prendre en compte l'ajout documentaire final ; une fusion éventuelle et sa post-CI resteront sous accord distinct. Ne pas commencer02C automatiquement.
