# 02B.1 — Inventaire de l’en-tête, du clavier et des états

12/10/2026. Départ #92@893b40bca5714c2cf595ec8643558b479d40fdbb propre ; revue ChatGPT de #92 et référentiel `LOT-02B-ENTETE-RACCOURCIS.md` de #82 lus. Branche séparée, aucune migration d’App dans cet inventaire.

| Contrôle existant | Handler / effet réel | Contrainte pour l’atelier puis le port |
|---|---|---|
| Rail dans topbar | App.sidebarCollapsed, bouton local et événement sidebar-collapse ; 02A distingue demande Projet temporaire et préférence durable | Réutiliser le rail02A ; pas de deuxième état durable de rail |
| GlobalSearch | Champ, debounce180ms à partir de2caractères, crm.search.global, flèches/Enter/Escape ; onOpen → App.openSearchResult avec UX-01 | Ne pas réécrire le routage ici ; recherche fictive sans entités en02B.2 |
| Bandeau Bibliothèque | libraryHeaderCollapsed local, bouton conditionnel, prop de bibliothèque etclasseCSS spécifique | Indépendant du header global etdu rail |
| GlobalTimer | Un seul composant monté dans App.topbar-right, session active/recovery/pendingSwitch/busy | Garder son emplacement/montage etpropriétaire, pas de session temps danslespréférences |
| Initialisation chrono | projects.list + time.active, contexte de session ; erreursonMessage | Pas de lecture d’un service client dansl’atelier |
| Chronométrage | Tick1s ; heartbeat30s uniquement si actif/nonpaused/nonrecovery ; événements time-changed/timer-context | Lesgroupes/modules/replis ne déclenchent aucune decesmutations |
| Commandes chrono | Start/switch/pause/resume/stop/recovery/stopAtLastKnown via API time ; interventions changent de statut selon gardes métier | Aucun raccourci direct vers cesmutations ; pas de reproduction du domaine métier |
| Dialogues chrono | Récupération, arrêt intervention, motif pause, changement activité, lancement ; closeOnOutside surdocument.pointerdown | Le repli futur du header ne doit pas être assimilé àuneannulation externe ; risque àqualifier auport, aucunecorrection métier improvisée |
| GlobalClock | Fonction privée d’App, horloge locale/date/salutation, tick30s, icône jour/nuit | Heure absolue différente de durée ; affichage secondaire en étroit, aucune modification de sesrègles |
| Message global | App.message/messageAction ; notice danscontent ; closeMessage ; action Explorateur uniquementsi associéeaumessage | Conserver actionettexte, pasdesuccèsavantretoureffectif |
| Notifications01B | AppNotice avecaction/onClose explicites ; aucunservice/queue ni succèsinféré | Réemploi dansatelier ; actionTESTsans shellréel |

## CSS, contraintes et breakpoints

`styles.css` : main-area grid68px/1fr, topbar flex/gap24/padding12×26 ; timer-widget min330px, horloge etrightflex ; sous1220px gap14/padding18 etminima timer250/horloge220. `time.css` : adaptations1180 et760 ; popovers/décisions/motifs etcontrastes. Densité/typographie/consistency apportent14/16/18 etcontrôles36/42/48. Le workspaceBibliothèque a sonbandeau etadaptation900px ; règle760px desréglages, autresbreakpoints900 ne constituentpasun repli globalduheader. Aucun repli globaldurable établi dansApp.

Atelier : CSS préfixé, headerdéveloppé/compact, recherche sousforme decommandedialogue enétroit, chrono toujoursmonté, horloge/aide enoptions secondaires. Le rail gardeE42 ; géométrie de sonflyout avecnouveauheader àtester, sansfigerdespixels finaux.

## Inventaire clavier et limites

- GlobalSearch : ArrowUp/Down etEnter quandrésultats ouverts, Escapefermer ; pasdeCtrl/Meta attribué danscecomposant/App.
- GlobalTimer : aucun gestionnaire globalkeydown niaccelerator trouvé ; commandesparboutons, dialoguesetpointerdown.
- ProjectsPage : Escape ferme le niveau actif via gardes etannuleédition locale de nom ; flèches séparateurs ; Enter auxchampsdecréation. Bibliothèque/Bridge/Devis possèdentleurspropresEscapeetéditeurs.
- Éditeurs techniques : champs/textarea/visualisation sandbox etlocalEditor ; pasdenouveau raccourci global Ctrl/Meta trouvé danslecodeinspecté. Cela **ne prouvepas** qu’unecombinaison estlibre dansOS, IME ouuneextension.
- `main.ts` ne construitaucunmenupersonnalisé/accelerator. Lesraccourcis du menuElectron par défaut ne doiventpasêtreécrasés ; lebanc relève lemenu de sonexécution. Aucune attribution globale nouvelle dans02B.1–02B.2. Ctrl/Meta/Alt dansleschamps etcontenteditable sont laissésaucontexte ; seulEscape d’un dialogue duprototypeesttraitépar cettecouche.

Observation àreprendre en02C : GlobalSearch n’incrémente pasrequestId quandquery devientcourte etnecatch pas laPromiserecherche ; une réponseancienne/erreur mérite tests dédiés. Aucun correctif derecherche anticipéici. Lescritiques desdialogues/mutationschrono nécessitent fixtures etautorisationdansleurpérimètre ; pasdechangementdeTimeService.

## Frontière autorisée

02B.1 audit et02B.2 atelier seulement. Headerprésentation reçoit un slotchrono unique, conserve celui-ci danslemême sous-arbre lorsdurepli. Préférenceheader distinctede celledu rail01F etbandeauBibliothèque. Chrono, recherche, contextefiche etnotification duprototypesontexplicitementTEST. UX-01 protègelesbrouillons etsorties ; aucunsecondregistre. Les16critères seront distingués entrepilotetesté etintégrationmétierfuture ; aucun02C/03 niApp/GlobalTimer/GlobalSearch deproduction modifié.

## Actualisation 02B.3 / 02B.4 — 12/10/2026

L'indépendance des états et la restitution du focus ont été renforcées dans le pilote, sans port du header de production. [Exécution et preuves finales](UXV2_LOT02B_EXECUTION.md) ; [audit clavier détaillé, priorités et risques avant port](UXV2_LOT02B_RACCOURCIS.md). Aucun accelerator global attribué. Les constats ci-dessus restent l'inventaire initial ; la frontière autorisée est désormais 02B.3 pilote et audit 02B.4, sans 02B.5/02C.
