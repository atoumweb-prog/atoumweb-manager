# 01F — Matrice de recette transversale

12/10/2026. Périmètre : atelier autonome, composants partagés et régressions surfixtures TEMP. Les compteurs appartiennent aux SHAs du rapport01F, jamais à une CIhébergée ni à une validation humaine globale.

| Critère | Preuve réelle et limite |
|---|---|
| R01F-01 | PASS pilote : neuf thèmes×densités via vrai IPC settings, captures synchronisées. |
| R01F-02 | PASS : fonts14/16/18, contrôleB et rendu hérité surfixture. Aucun auditWCAG global. |
| R01F-03 | PASS : deuxième processus Electron restitue apparence depuis SQLiteTEMP. |
| R01F-04 | PASS : aide automatique désactivée, clic explicite fonctionnel ; recetteBclavier/délai séparée. |
| R01F-05 | PASS : largeur55 restituée pour son module après relance ; reset ciblé01C et resetglobaldispositions indépendants des données. |
| R01F-06 | PASS : filtres etcolonnes réouverts depuisSQLite ; tri/ordre/vues validés parD126 ettests de whitelist. |
| R01F-07 | PASS : Agrandir/Réduire et onglets cachés conservent instance etbrouillons. |
| R01F-08 | PASS : notesdirty conservées aux sorties refusées, changement de dossier/module testé viaD/UX-01. |
| R01F-09 | PASS pilote : E95 teste pending, erreurs etconflits, nouveau texte pendant requête conservé. |
| R01F-10 | PASS par absence de capacité : pas d'option save-and-exit danspilote ; activationmétier différée. |
| R01F-11 | PASS pilote : étroit950×800, zoom100/125/150, repli01C et brouillonconservé ; D/renderer hérités contrôlent accèsauxactions. |
| R01F-12 | PASS technique : Tab/ShiftTab/Enter/Space/Escape dansE, séparateur dansC, vrai clavier avantreloadF. Pas certification lecteurd'écran. |
| R01F-13 | PASS : préférence confirmée aprèsIPC ; erreursinjetées visibles, resetrefusé sansmutation ; annulationsE/UX-01. |
| R01F-14 | PASS pilote : deux vraiesfenêtres, préférences partagées etreset sansremount ; quitrefusé etticketsUX-01. Dernier enregistrement confirmé pour une mêmeclévisuelle. |
| R01F-15 | PASS : écrituresapparence/disposition/reset refusées, SQLite confirmée inchangée et notesintactes. |
| R01F-16 | PASS : preload sansAPIbusiness/workflow, deuxbasesTEMP, toutes tables horssettings identiques. |
| R01F-17 | PASS technique :31ed71e, typecheckOK, ciblés49/49, complet867/867(94fichiers,100,46s,sansRPC), natif76/deuxprocessus/neufcaptures/dirt y:false (`dirty:false` dansmanifeste). |
| R01F-18 | PASS non-régression : 300contrôles vrairendererTEMP,17destinations, aucune route/CSSglobale modifiée. Pas migration17modules. |
| R01F-19 | PASS : UX-01183 rejoué, archiveProspect/suppressionligne/repli protégés. #83 restefermée, pas ressuscitée. |
| R01F-20 | DIFFÉRÉ : aucuneCIhébergée autorisée tant quequota/protections nonconfirmés. Local≠CI. |
| R01F-21 | PASS : deuxworkspaces propres au banc, aucuneentréeSQLite réelle/Validation-MSI/restore exposée ; intégrité/FK/migrations1–66. |
| R01F-22 | DIFFÉRÉ humain : neufcaptures disponibles, revuevisuelleCodex limitée aux3variants cités ; recettehumaineglobale àla finV2. |

Les limites20/22 ne sont pas converties enPASS. 01F est une livraison technique àreview, pas une autorisation de fusion ni de lancement deslotsmétier. Le magasin est injecté dans l'atelier ; raccord aux services/workspaces réels des modules àqualifier lorsdesports.
