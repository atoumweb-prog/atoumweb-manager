# 02A — Rail E42 : préparation et atelier isolé

## État livré le 12/10/2026

Branche `codex/ux-v2-lot02a-navigation-v1`, **PR #92 draft**, base #91 `codex/ux-v2-lot01f-preferences-v1@765f66dbce2b08d2624e496c7dd8a5555edc8e20`. Revue ChatGPT de #91 et référentiel02A de #82 lus avant le code. Aucun changement local préexistant, reset, rebase ou écrasement de branche.

Inventaire **542e7c9**, composant/atelier **5ba1168**, détail/clavier **75e8622**, bornage responsive **5f8480e88e3648cd924ce0f7eb1aa6a7c30379bd**. [Cartographie17destinations, événements, sources, raccourcis, CSS et gardes](UXV2_LOT02A_INVENTAIRE.md).

E42 reste l'optionA : **rail réduit = Accueil + favoris épinglés + cinq groupes** ; rail déployé =17destinations sous leurs rubriques. Groupe ouvert par clic/Enter/Space, aucun module indéterminé ni changement au survol. Escape ferme le flyout et rend le focus ; flèches/Home/End naviguent ses destinations. État actif textuel/aria-current et repère du groupe parent, pas seulement couleur.

Favoris = références de module ordonnées, sans copie de dossier. Épingler/désépingler, commandes Monter/Descendre accessibles, reset natif avec Annuler par défaut. Le magasin visuel01F reçoit une définition de clé explicite **atoumweb:navigation:rail:v1** : mode durable et arrayordonné desfavoris. Ancienformatv0 normalisé, inconnus/doublons/Accueil ignorés ; aucune recherche, sélectiondedossier, note, chrono ou étatflyout persistant.

`atoumweb:sidebar-collapse` est exercé comme demande contextuelle true, libéréeparfalse, sansécrire lechoix durable. `atoumweb:open-page` valideune des17clés puis utiliseUX-01 avantdémonter. Les autres événements de routageciblé sont inventoriés, **pas remplacés par un nouveau routeur**. Le changement effectif de module passe au registre existant ; mode de rail/groupe/favori ne jetteaucunbrouillon et n'ajoute pasdeconfirmation inutile.

Le composant est indépendant d'App.tsx. Le CSS est préfixé au rail/atelier ; il ne corrige pasencore les règlesglobales qui cachentla sidebar réelle. La fichefictivequick/full utiliseRecordPane, même état pendantagrandir/réduire ; fermeturegardée etréouverture au même module. Chrono**TESTsimulé** montéunefois horsdesdestinations ; aucunpatch deGlobalTimer niAPItemps exposée.

## Visuels et dimensions provisoires

EmplacementAWM explicitement réservéau futur logo triangulaire, **aucuntriangle/logo final généré**. RéemploiOperationIcon existant ; emplacementsAC/CL/DC/BA/AN/RE pour pictosmanquants. Atlas final àvalider séparément avecAtoumWeb. Largeurs86px réduit et290px déployé sontdesvaleurs d'atelier, pasun arbitragegraphique permanent. Flyoutborné parviewport/border-box, scrollvertical ; écranétroit : raildéployé enoverlay avecbouton deréduction disponible etcontenu conservé encolonne2.

L'atelierne contientpasla rechercheglobale ni lescommandes du chrono réel : leurspositions/accessibilité dansl'entête final relèvent de02B/02C. Lescapturesne valentpasvalidation de cetentête futur. Lechronométier/routeur/notes/clientsettings existantsrestent inchangéspar lediff ; tests derégression surle vrai renderer isolé citésci-dessous.

## Exécutions réelles

| Commande / contrôle | Résultat et SHA |
|---|---|
| Typecheck | OK sur5f8480e. |
| navigationRail +workspaceVisualPreferences ciblés | **18/18** ; égalitéexacte des17NAV_ITEMS/labels/groupes, schema/whitelist/ordre/inconnus, magasin01F. |
| AtelierElectron | **117+8=125/125**, deuxprocessus auSHA**5f8480e**, dirty:false. Neufcaptures synchronisées, manifestesousoutputs. |
| Suitecomplète finale | **877/877 dans95fichiers,112,99s**, sortie0 sansRPC auSHA5f8480e. Premiercheckpoint5ba1168 :877/877,118,98s. Restaurations35/35 conservées. |
| Non-régression5ba1168 | F76/76, UX-01183/183, vrai renderer300/300 :17destinations, sixécrans×neufconfigurations, clavier/étroit/zoom. Leschangementsultérieurs sontlimités au nouvelatelier02A etsonCSS/banc, aucuneproduction héritée modifiée. |

Scénarios natifs : chaque clé ouverte depuisrail déployé, puis16modules groupés depuisrailréduit (Accueil accessibleenhaut) ; Rester dirtyavantmodule, abandon explicite, pendingResterseul ; groupes/clavier/focus, ordre/resetfavoris annulation/acceptation ; contexteProjet sansécriture ; refus de magasin sansfaux succès ; réduction/déploiement etagrandissement sanspertenote ; deuxièmeprocessus restaurerfavorisClients→Devis etmode réduit sansdossier/texte ; neufthèmes/densités14/16/18 ; fenêtres850et500px/hauteur620px/zoom100–150, close/toggle/chronosimulé bornés.

TablesSQLitehorssettings comparées intégralementavant/après, intégritéOK/FKvide, migrations66conservées surTEMP ; aucunAPIbusiness exposée, nettoyagesconfirmés. Aucun test ni restauration surValidation-MSI. Les refus IPC/sauvegarde simulés desbancsF/UX-01 sontdeserreurs attenduesavecassertionsdeconservation, pasune anomalie masquée.

## Critères R02A — périmètre de préparation

| Critère | Preuve / limite |
|---|---|
| 01 | PASS pilote :17clésalignées surNAV_ITEMS, bonne destinationfictive ; vraies17destinations300nonrégressées. |
| 02 | PASS pilote :railréduit visible/largeurpositive, scrollvertical. |
| 03 | PASS pilote :5groupes donnent accèsaux16modules horsAccueil ; pasmodèleB17icônes. |
| 04 | PASS technique :clic, Enter/Space/flèches/Escape etfocus ; aucunhandlerhover de navigation. |
| 05 | PARTIEL :noms accessibles/aria-current/focus vérifiés, pasderecette aveclecteurd'écran réel ni auditWCAG. |
| 06 | PASS :favorisreferences, épingler/reset/reorder, aucunemutationdedossier. |
| 07 | PASS TEMP :mode/favoris/ordre confirmés etrestaurés aprèssecondprocessus. Raccordproduction nonactivé. |
| 08 | PASS unitaire :inconnus/doublons ignorés, toutesdestinations restent dansgroupes. |
| 09 | PASS pilote +UX-01 :gardebeforetransition, note/module/instance conservés surRester. |
| 10 | PASS :présentation sansconfirmationinutile, mêmebrouillon. |
| 11 | PARTIEL intégration :open-page testéavecgarde ; autresévénements inventoriés/nonmodifiés, nouveau routeur02C nonfait. |
| 12 | PASS pilote :demande Projettemporaire nonpersistée, choixdurable rétabli àlibération. ÉmetteurréelProjet nonmodifié. |
| 13 | PASS structure/pilote :chronosimuléunique continue ; GlobalTimer réel intact, pasdenouveau contrôledechronoactif métier revendiqué. |
| 14 | PASS technique :neufvariantes/fonts etcaptures auSHAexact ; visuelsfinals nonapprouvés. |
| 15 | PASS pilotepourbornage :500/850×620px, zoom100/125/150, actions/scroll ; entêteréel/recherche/commandeschrono àqualifier en02B. |
| 16 | PASS :refusmagasin visible, settingsnonécrits etnotesconservées. |
| 17 | PASS pilote :agrandir/réduire, fermeturegardée etréouvertureaumêmemodule ; pasnouveléditeur métier. |
| 18 | Preuvesciblées/typecheck/complet/natif ci-dessus ; **pasmigration deApp.tsx oucertificationglobale**. |

## Suite et restrictions conservées

Atelier02A prêtpourrevue indépendantedeChatGPT. **Raccordréel deNavigationRail auxhandlersApp, CSSglobal etpréférencesproduction noncommencé** danscette préparation. Les dimensions, atlas etlogo définitifs restentnonvalidés ; recettehumaineglobale différée. Refaire lesgardes etouverturesciblées àchaque port réel, avec02B/02C quandautorisés.

Lesfondations86–91 restentdraft/nonfusionnées ; tenircompte del'empilementavantplusdeports. AucuneCIhébergée tantquequotanonconfirmé, aucunmerge/main oubudgetchangé. Aucun02B/lot03. Lanceurinteractif **scripts/launch-ux-v2-lot02a-workshop.cmd**, profil/baseTEMPnettoyés àfermeture ; captures sousoutputs/ux-v2-lot02a-reference,horsGit.
