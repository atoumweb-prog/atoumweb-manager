# 02B.3 / 02B.4 — Reprise isolée et validation Windows

12/10/2026. Départ propre de `codex/ux-v2-lot02b-header-v1@8b241c4439819ccd30ebaef024ed3c4bb0a81bd9`, PR #93 draft/base #92 inchangée. Main vérifié à `31167754cbb16dcca323c9f5e0e8db3ea27a3004`, CI post-fusion #94 [38273325333](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38273325333) SUCCESS, 846/846, A→B 16,197 s, sans RPC. Aucune nouvelle CI ni fusion déclenchée.

## 02B.3 — Indépendance démontrée

- Huit combinaisons développé/compact × rail développé/réduit × bandeau Bibliothèque visible/replié, dans le pilote existant. Chaque geste n'affecte que son état ; chrono unique, fiche montée et brouillon conservés.
- Header/rail restent dans leurs clés distinctes de l'adaptateur 01F ; mises à jour externes, écritures entre deux instances et refus de stockage couverts. Le bandeau conserve son état local existant, sans nouvelle préférence ni donnée métier persistée. Deuxième processus : header/rail restaurés, aucune note/query/session ni état du bandeau restauré depuis ces préférences.
- Défaut de focus Options **reproduit avant correction** par assertion native : Escape ferme le menu mais laisse le contrôle ciblé devenir caché. Correction ciblée dans WorkspaceHeader : entrée dans Options, retour au déclencheur, priorité du dialogue chrono/recherche sans menus concurrents.
- Repli de header : ne refocalise plus arbitrairement le textarea si un autre contrôle du dialogue chrono porte déjà le focus. Confirmation du chrono TEST rend le focus au déclencheur. Annulation continue d'utiliser le même registre UX-01, sans nouvel enregistrement implicite.
- Revue de capture : titre de contexte Bibliothèque comprimé jusqu'à couper les mots en mode développé. Largeur minimale/basis du contexte ajustée ; assertion par rectangle de chaque mot dans les 18 variantes développé/compact. Breakpoints étroits conservés, aucun changement de CSS ou écran métier.

## 02B.4 — Audit clavier réalisé

[Inventaire détaillé, priorités proposées et risques avant raccordement](UXV2_LOT02B_RACCOURCIS.md). Aucun raccourci Ctrl/Meta/Alt attribué, aucune combinaison OS/menu déclarée libre.

L'aide imbriquée ferme uniquement l'aide au premier Escape, Options au second ; recherche et chrono restaurent leur déclencheur, Escape dans la fiche conserve la saisie. Frappe native, Ctrl, composition, clavier des groupes/commandes, étroit et zoom exercés. L'audit des anciens listeners window révèle des risques de concurrence Escape et d'effacement d'édition Bibliothèque ; le pointerdown extérieur du vrai GlobalTimer devra aussi être qualifié avant raccordement. Constats de code à qualifier, pas des collisions natives globales prétendument reproduites. Aucun correctif métier ni port anticipé.

## Preuves

Code final : `e78f1ee719d0ab58b7b4ad7d16f47a98908426c2` ; premier correctif de focus/préférences `40a40b8a526b945a45600d02c9705c9c2d676bd4`. Toutes les preuves finales ci-dessous distinguent leur SHA ; les essais intermédiaires dirty ne sont pas utilisés comme manifeste final.

## Frontière de livraison

02B.3 validé au périmètre atelier et 02B.4 inventorié, pas clôture de 02B dans le Manager réel. App/GlobalTimer/GlobalSearch/GlobalClock, IPC, services temps, règles commerciales/contrats et architecture UX-01 restent inchangés. Le slot conserve une seule instance TEST ; cela ne certifie pas encore les vrais dialogues TimeService en header compact.

02B.5/02B.6, 02C et raccordement massif ne sont pas commencés. #90/#91 non fusionnées dans main : dépendances préservées et prochaine consolidation nécessaire avant le port réel. Recette humaine globale différée. Pas d'utilisation de Validation-MSI, pas de nouvelle CI hébergée, merge/rebase/squash/force-push, reciblage ou changement de budget.

Les anciens rapports 02B.1–02B.2 ci-dessous restent historiques et ne sont pas réécrits.

### Résultats finaux et traçabilité

| Contrôle | Résultat réel / SHA |
| --- | --- |
| Typecheck | OK sur e78f1ee |
| Ciblés header / rail / adapter | **28/28**, 3 fichiers, 0,821 s sur e78f1ee |
| Vitest complet | **887/887**, 96 fichiers, **140,15 s**, sortie 0 sans RPC sur e78f1ee ; les 884 tests précédents conservés et 3 contrôles d'indépendance ajoutés |
| Restaurations | **35/35**, 88,045 s ; A→B **5,344 s**, sur e78f1ee |
| Atelier 02B | **158 + 9 = 167/167**, deux processus, e78f1ee / dirty:false |
| Captures 02B | **18** frame-synchronisées, développé/compact × 3 thèmes × 3 densités ; manifeste e78f1ee / dirty:false |
| Régression rail 02A | **117 + 8 = 125/125**, deux processus, 40a40b8 / dirty:false |
| UX-01 natif | **183/183**, 40a40b8, trois thèmes, versions/refus/pending/détachées/workspace différé |
| Renderer réel hérité | **300/300**, 40a40b8, 17 destinations, 54 visites échantillonnées, étroit/zoom/clavier, consoleErrors:[] |

Les trois derniers bancs ont été exécutés avant la dernière correction, qui ne touche que workspace-header.css du pilote et son assertion de capture. Les sources du rail, des gardes UX-01 et du renderer de production sont strictement identiques entre ces deux commits ; pas de prétention à une nouvelle exécution de ces bancs au SHA e78f1ee. Les résultats Electron ne sont pas additionnés à Vitest.

Neuf configurations, fenêtres 1000/620 px et zoom 100/125/150 %, contrôle natif du clavier ; éditeur input/textarea/contenteditable conservé. Revue visuelle directe AtoumWeb/Confort compact, Noir/Compact développé et Blanc/Confort+ compact, puis vérification de la correction sur Noir/Compact développé. Les autres variantes ont les contrôles automatiques, pas de recette humaine globale revendiquée.

Tables SQLite hors settings comparées avant/après : aucune mutation. Intégrité OK, FK vide et migrations 1–66 vérifiées sur les bases TEMP ; nettoyage confirmé pour chaque banc. Les refus IPC de versions périmées du banc UX-01 sont attendus et assertés. Aucune base réelle utilisée, aucune migration applicative ajoutée.

### Critères actualisés au périmètre autorisé

| Critère / séquence | État |
| --- | --- |
| 02B.3 / R02B-04 / E49 | PASS pilote : huit états, clés indépendantes, bandeau local non persisté, effets croisés et erreurs de stockage vérifiés |
| R02B-03 / R02B-11 | PASS pilote/régression : rail partagé, même fiche et brouillon ; UX-01 sans nouvelle architecture |
| R02B-09 | PASS pilote : Escape aide → Options, recherche et dialogues TEST ; focus restauré et contrôle actif conservé |
| R02B-08 / R02B-16 | PASS technique pilote : neuf variantes, zoom/clavier, captures, tests finaux ci-dessus |
| 02B.4 / R02B-10 / E48 | Audit réalisé ; aucune attribution globale. Conflits potentiels des anciens modules documentés et à qualifier avant port |
| R02B-05/06/07/14 | Chrono unique et dialogues TEST vérifiés ; récupération/pause/arrêt du vrai GlobalTimer en header V2 restent à recetter lors de 02B.5 |
| Autres R02B | Portée/limites historiques 02B.1–02B.2 conservées ; aucune clôture globale ni raccordement massif anticipé |

Prochaine étape : revue indépendante de ce pilote et de l'audit, puis prochaine consolidation des dépendances avant décision sur 02B.5. Aucun démarrage implicite du port métier, de 02C ou du lot 03.

---

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

