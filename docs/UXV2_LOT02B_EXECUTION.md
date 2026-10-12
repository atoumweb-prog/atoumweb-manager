# 02B.1–02B.2 — Audit et atelier isolé de l’en-tête

12/10/2026. Branche codex/ux-v2-lot02b-header-v1, **PR #93 draft**, base #92@893b40b. Départ propre ; revue ChatGPT de #92 et référentiel #82 lus. [Inventaire des composants, commandes, événements, CSS et clavier](UXV2_LOT02B_INVENTAIRE.md).

## Présentation et responsabilités

WorkspaceHeader reçoit un **slot chrono unique**, conservé au même emplacement dans l’arbre lors du repli. Recherche, chrono et rail restent atteignables ; heure et aide sont secondaires, disponibles via Options en compact/étroit. La préférence atoumweb:navigation:header:v1 contient seulement version1 et compact:boolean via01F, jamais session, recherche, note ou fiche.

Les boutons de rail partagent la logique02A par son contrôle exposé, sans second état durable. Le bandeau Bibliothèque est distinct du header et du rail. Le contexte module/fiche fictive correspond à la présence de son composant ; retour au module gardé avant démontage.

L’atelier simule explicitement le chrono, pause/refus/récupération et attente de réponseTEST. Le motif est protégé parUX-01 ; repli conserve dialogue, saisie et focus. Input/textarea/contenteditable de la fiche sont suivis ensemble par le même useUnsavedDraft. Notification réutilise AppNotice avec actionTEST, sans ouvrir de vrai fichier. Recherche = champ/dialogue de présentation, sans données clientes ni routage02C.

**Aucun nouveau raccourci global attribué dans02B.1–02B.2.** Boutons et couches utilisent clavier/Escape explicites ; Ctrl et composition sont laissés aux champs. L’inventaire ne présume pas qu’une combinaison est libre dansOS/IME. Le menu du banc est relevé dans menu.json (vide lors de cette exécution), ce n’est pas le menu d’un Manager installé.

**App.tsx, GlobalTimer, GlobalSearch, GlobalClock privé, IPC et services métier restent inchangés.** Aucun déplacement ni second chrono métier ; prototype non monté dans la navigation de production. Les observations GlobalSearch sont réservées au diagnostic02C, sans correction anticipée.

## Preuves Windows au code final

| Contrôle | Résultat |
|---|---|
| SHA code/banc | **f7099aaa24f75eae63607b7b027e4e04c9da28df** |
| Typecheck | OK |
| Ciblés | **25/25** : header7, rail10, adapter8 |
| Vitest complet | **884/884 dans96fichiers,117,82s**, sortie0 sansRPC, restaurations35/35 |
| Banc02B | **78+8=86/86**, deux processus, persistance du mode sans contenu métier |
| Captures | **18**, développé etcompact sur3thèmes×3densités, témoin de frame, manifeste SHA / dirty:false |
| Régression02A | **125/125**, au mêmeSHA, E42/favoris/gardes/contexteProjet conservés |
| UX-01 natif | **183/183**, fixturesTEMP, fenêtres/workspace/annulations/versions périmées |
| Renderer hérité | **300/300**, 17destinations, sixécrans dansneufvariantes, étroit/zoom/clavier |

Scénarios : compaction avec condition booléenne explicite de gain de hauteur ; même instance chrono pendant repli, décision et changement de module ; input/textarea/contenteditable sans interception, frappe native ; rechercheEscape et retourfocus ; motifRester puisannulation ciblée, refusTEST sans mutation ; récupérationTEST visible encompact ; bandeau indépendant ; action/close notification ; refus de magasin visible sans fausse persistance ; fenêtres1000et620px, zoom100/125/150, commandes rail/recherche/chrono/mode bornées.

Deuxième processus : headercompact etraildéveloppé restaurés, ni note/query ni session restaurée par le magasin visuel. Toutes tables horssettings comparées avant/après, intégritéSQLiteOK/FKvides et migrations1–66 surTEMP ; aucune API business/time/search exposée, cleanup confirmé. Pas de données Validation-MSI.

Revue visuelle directe AtoumWeb/Confort etNoir/Compact ; contrôlesautomatiques dansneufvariantes, aucune validationhumaineglobale ouWCAG revendiquée. Captures locales sous outputs/ux-v2-lot02b-reference, horsGit ; valeurs de dimensions/breakpoints provisoires.

## Critères R02B — périmètre de préparation

| Critère | État / limite |
|---|---|
| 01 | PASS atelier ; démarrageManager réel uniquement régression300, aucune migration de son header |
| 02 | PASS : gain de hauteur etcommandes accessibles |
| 03 | PASS : contrôles du rail02A partagés, préférence identique |
| 04 | PASS pilote : bandeauBibliothèque indépendant |
| 05 | PASS simulation : même session/composantTEST ; chrono métier non recetté ici |
| 06 | PARTIEL : pause/refus/décisionsTEST exercés ; règles etAPI interventions inchangées, àrecetter auport |
| 07 | PARTIEL : récupérationTEST persistante visuellement ; pas de récupérationTimeService réelle |
| 08 | PASS atelier :1000/620px etzoom100–150, fonts14/16/18, commandes bornées |
| 09 | PASS pilote : clavier/focus etEscape de couche ; pas delecteurd’écran réel |
| 10 | PASS au code introduit : aucun accelerator global nouveau, Ctrl/composition nonannulés, frappe native ; OS/menuinstallé àauditer avantattribution future |
| 11 | PASS : présentation non destructrice etUX-01 avanttransition ; régression183 |
| 12 | PARTIEL : action/closeAppNoticeTEST ; Explorateur réel intact etnonappelé |
| 13 | HÉRITÉ/ÀPORTER : FieldHelp réutilisé, réglage01F existant ; aucune migration d’aide du vraiheader |
| 14 | PARTIEL : préférenceheader restaurée ; sessiontemps persistée/récupération métier horsatelier |
| 15 | PARTIEL : contexteficheTEST reflète composant ; recherche/Accueil ciblés et02C nonimplémentés |
| 16 | PASS technique pilote :25ciblés/884complet/86natif/18captures, pascertification d’intégration réelle |

## Suite et restrictions

02B.1 audit et02B.2 compositions proposés àrevue. Aucun02B.5 port surGlobalTimer, aucuneattribution globale02B.4, aucun02C/03 commencé. Raccord du vrai chrono, notificationsExplorateur etroutage restent horscet atelier. Recettehumaineglobale différée, PR93 draft/base92, parents conservés.

Lanceur interactif : scripts/launch-ux-v2-lot02b-workshop.cmd. Profil/baseTEMP nettoyés àfermeture ; aucuneCIhébergée tantquequota nonconfirmé, aucunmerge/main/Validation-MSI.
