# 01D — ateliers fonctionnels de tableaux et fiches

## 12/10/2026 — checkpoint 01D.3

Code/banc **17499bf1822793e34d0895cde2dfe4c6346438ba**, depuis f458747, PR89 draft/base88 conservées. Numérotation conforme à la demande utilisateur (01D.3 colonnes/vues puis01D.4 async), distincte des étapes indicatives du référentiel.

- Réordre drag/drop et boutons Avancer/Reculer accessibles ; identité/Ouvrir imposés. Largeurs bornées (identité180, action140, autres160, max600px), aperçu immédiat, une écriture à pointerup. Annulation/blur, geste immobile, double release et changement de vue sans écriture tardive ; flèches/Home/End pour resize clavier.
- Création depuis défauts, duplication de la présentation, renommage/suppression de vues personnelles. Standard non supprimable et rétablissable. Changer de vue personnelle ne détruit pas fiche/onglet/brouillon ; changer de module/dossier conserve UX-01.
- Préférencesv2 compatiblesv1 sous clé historique ; ordre dédupliqué, largeurs bornées, inconnus ignorés. Collection personnellev1 par module. Recherche libre/id/note exclus, erreurs stockage visibles sans faux succès, corruption avec défaut sûr/reset. Aucune migration SQLite.
- Portée : profil atelierTEMP par module/vue, stockage injectable. Standard personnalisable localement avec défaut immuable. Synchronisation multi-fenêtres et adaptateur réglages/workspace réel à qualifier au pilote métier ; pas présentés comme livrés.

Windows : typecheckOK ; ciblés **27/27** (3fichiers) ; Vitest **837/837 dans91fichiers,116,53s**, sortie0 sansRPC (production identique au commit, derniers ajouts uniquement banc natif). Atelier **112/112**, neuf captures synchronisées ; C66/66, UX-01183/183 (migrations1–66/intégrité/FK TEMP), contrôlesB40/40 etAbby25/25. Clavier natif, resize/cancel/écriture unique, CRUD et corruption/recovery vérifiés. Revue visuelle directe AtoumWeb/Confort. TEMP nettoyé ; aucune utilisation Validation-MSI.

R01D-02/03/07/08/09/13 PASS atelier ; R01D-12 reste ouvert pour01D.4. Historique01D.2 ci-dessous conservé.

CI86 : six runs autorisés au maximum, merges non autorisés. Actions actif, HEAD7f5dbbf2 vérifié ; quota gratuit non vérifié par l'utilisateur, API facturation inaccessible (scope user absent). **Aucun run déclenché**, attente quota/protections selon dernière consigne.

## Historique 01D.2

## État livré et traçabilité

Branche existante `codex/ux-v2-lot01d-inventory-v1`, **PR #89 draft**, toujours empilée sur #88. Départ documentaire `3edf5e3656f30b2312461ffe2b76739055c153ea`. Référentiel #82, cadrage01D et inventaire01D.1 conservés.

- Code de l'atelier : **fbc029ded0ee8336a1280e249eb5811de3329f3e** (11 fichiers nouveaux).
- Banc natif renforcé : **eda2eae165f373eadd49fd95c7161d2271f3d659** ; seules les assertions du banc changent, code de l'atelier identique.
- Validation Windows locale du 12/10/2026 ; publication avec `[skip ci]`, aucune CI hébergée, aucun merge ou reciblage de86/87/88, aucun accès Validation-MSI. Pas de migration des écrans métier.

## Fonctionnalités réalisées

120 dossiers synthétiques **gelés**, identifiants TEST-001…120 distincts, homonymes/accents, catégories et statuts de démonstration, centimes et dates/nulls. Ils ne proviennent d'aucune base réelle ; ces statuts ne sont pas des enums métier ajoutés au Manager.

`DataTable` reçoit des lignes et définitions de colonnes en lecture seule. `TableFilterBar` expose recherche/statut/catégorie, critères actifs, compteur et reset ; `TableColumnManager` montre/masque les colonnes et restaure les défauts. Identité et Ouvrir sont obligatoires. En-têtes triables accessibles avec aria-sort : ascendant, descendant, retour à **l'ordre source**, comparaisons numériques/françaises et identité secondaire stable. Aucun tri ne modifie un sortOrder métier.

`TableWorkshop` réemploie AppButton/AppTextField/FieldHelp/AppNotice, puis ResizableSplitView/RecordPane de01C. Deux vues fixes indépendantes, préférences de colonnes/tri/filtres autorisés dans le profil TEMP. La recherche libre, l'identité sélectionnée, la note et les dossiers sont exclus du JSON de préférence. En échec d'écriture, erreur visible et interface/brouillon préservés ; aucune fausse annonce de réussite.

**Invariant prioritaire :** `selectedId` est indépendant de la liste filtrée/triée. Le dossier de droite est résolu depuis la **source complète**, jamais depuis les lignes visibles. Son éditeur possède la clé du dossier ; aucun effet ne remet selectedId à null lorsque les filtres changent. Message explicite si la fiche est hors filtre. Même identité, instance d'éditeur, onglet et note après filtre/tri/colonnes/agrandissement. Changer explicitement de dossier, de vue ou fermer passe par le **même registre UX-01** et ses confirmations natives. Aucun second dialogue/registre.

Le banc n'expose au renderer **que l'API unsaved** et n'ouvre aucune SQLite. La source gelée est comparée avant/après toutes les interactions. Tri, recherche, sélection et préférences n'appellent aucun service métier. La note du pilote reste un brouillon en mémoire, sans action de sauvegarde métier.

## Tests réellement exécutés

| Contrôle | Résultat / SHA / portée |
| --- | --- |
| Typecheck | OK sur le code fbc029d ; aucun diagnostic. |
| tablePresentation + tableViewPreference | **16/16**, deux fichiers ; centimes/fr/date/nulls/ordre source, colonne inconnue/obligatoire, clés indépendantes, whitelist excluant query/id/note. |
| Suite complète | **826/826**, 90 fichiers, **109,41 s**, sortie0 sans erreur RPC sur fbc029d ; 810 tests conservés +16 nouveaux. |
| Atelier01D natif | **92/92** sur eda2eae, code fbc029d ; source120 inchangée, neuf captures synchronisées, TEMP nettoyé. |
| Non-régression atelier01C | **66/66**, neuf captures, TEMP nettoyé, code01C inchangé. |
| Non-régression UX-01 | **183/183**, trois thèmes ; migrations1–66/intégritéOK/FKvide sur basesTEMP. Les trois refus de version périmée sont des erreurs IPC attendues avec brouillon conservé. |

Ne pas additionner les compteurs de ces bancs à celui de Vitest. Les ajouts finaux eda2eae concernent seulement les tests natifs ; aucun changement de renderer/shared/Main après le contrôle complet fbc029d.

Scénarios natifs déterminants : recherche TEST-120 masquant TEST-001, zéro résultat, double filtre exact13résultats, reset120 ; tri descendant déplaçant la sélection ; clic Ouvrir refusé avec Rester puis abandon explicite ; même token de montage, note et onglet ; affichage/masquage colonne sans démontage ; erreur de préférence sans changement du JSON stocké ; vue dirty refusée ; vrai Enter ouvrant le bonid et vraie Espace sur l'en-tête ; fermeture native/Échap avec refus ; rechargement sans query/id restauré ; deux clés de vue indépendantes ; zoom100/125/150 avec contrôles essentiels accessibles.

## Captures et démarrage interactif

`node scripts/check-ux-v2-lot01d-workshop.cjs` exécute la recette isolée. Neuf PNG sous `outputs/ux-v2-lot01d-reference/`, **ignorés par Git**, trois thèmes × trois densités ; pixel-témoin vérifié avant chaque écriture. Revue directe de AtoumWeb/Confort, Noir/Confort et Blanc/Confort+. Les autres états ont leurs contrôles automatiques, pas une revue visuelle exhaustive revendiquée.

Incident visuel observé en Confort+ : mots d'en-tête et Ouvrir coupés. Correction limitée à `table-layout.css` : pas de coupure au milieu des mots, valeurs date/montant et boutons sur une ligne ; commande Ouvrir maintenue à droite du défilement. Assertion de rectangle de texte sur les neuf variantes. Aucune CSS globale d'un module existant modifiée.

Manipuler le pilote : **`scripts/launch-ux-v2-lot01d-workshop.cmd`**, ou `node scripts/check-ux-v2-lot01d-workshop.cjs --interactive`. Fenêtre Electron TEST indépendante avec profil TEMP ; préférences réutilisées pendant le retour/reload du pilote, supprimées quand ce profil ferme. Aucune utilisation du lanceur Validation-MSI. Sélectionner un dossier, Notes, saisir ; modifier filtres/tri/colonnes et agrandir/réduire : la fiche reste montée.

## Critères R01D — état de ce premier incrément

| Critère | État / limite |
| --- | --- |
| 01 | PASS pilote neuf thèmes/densités, captures synchronisées et type14/16/18. |
| 02 | PARTIEL : montrer/masquer/reset et identité/Ouvrir non masquables ; réordonnancement ultérieur. |
| 03 | PARTIEL : séparation01C bornée conservée ; largeur de colonnes pas encore configurable. |
| 04 | PASS pilote, tests numériques/dates/FR et stabilité ; aucune mutation de la source. |
| 05/06 | PASS recherche, filtres conjoints, critères actifs, compteur exact, vide et reset. |
| 07/08 | PARTIEL : deux vues fixes et préférences/restauration ; vues personnelles nommées/duplication/reset global à venir. |
| 09 | PASS normalisation unitaire des colonnes inconnues et rétablissement obligatoires ; migration complète de schéma futur à qualifier. |
| 10 | PASS prioritaire : filtre masque la ligne sans démonter identité/fiche/onglet/note. |
| 11 | PASS pilote : Enter ouvre le bonid, agrandir/réduire conserve l'éditeur ; garde lors d'un nouvel objet. |
| 12 | À réaliser : source ici complète et synchrone ; aucune simulation de pagination ou chargement async annoncée. |
| 13 | PARTIEL :120lignes, interface testée, séparation01C sauvegarde en fin de geste ; resize des colonnes pas implémenté. |
| 14/15 | PASS pilote étroit/zoom et indépendance des deux vues fixes. |
| 16 | PASS technique de cet incrément : typecheck,826tests, ateliers/protections et neuf variantes ; pas une certification des17écrans futurs. |

**01D.2 livré au périmètre demandé ; 01D entier n'est pas déclaré clos.** Suite : réordonnancement/largeurs de colonnes et vues personnelles, puis sources async/pagination et erreurs. Les migrations des modules réels restent dans leurs lots dédiés. Pas de règle métier nouvelle, d'autosave de note, de récupération crash ou d'Enregistrer et quitter.

## Consolidation conservée en attente

Le plan `UXV2_CONSOLIDATION_01ABC_PLAN.md` reste prêt, accepté comme base de préparation. Aucune cible/draft de86/87/88 modifiée, aucune fusion ni CI déclenchée pour cette mission. Une note GitHub évoque une autorisation CI ailleurs ; la présente exécution respecte l'instruction directe de cette tâche : continuer01D, sans ces déclenchements. Une autorisation future explicite sera à rapprocher du plan avant exécution, pas déduite de ce rapport.
