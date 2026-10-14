# Lot 06 — Candidat de convergence #124

Date : 14 octobre 2026. Branche `integration/ux-v2-06-candidate-20261014` depuis `main`. Aucun merge dans `main`.

## Modifications réunies
- `QuotesPage.tsx` : réconciliation de dix blocs modifiés par 06A sur la base du fichier 06B ; contrôles anti-réponse tardive et prix/acceptation Abby réunis sans bloc non appliqué.
- `quoteWizardPrice.ts` et `quoteWizardPrice.test.ts` : repris depuis 06A.
- `QuoteOfferOptionsPanel.tsx` : verrou synchrone anti-double mutation repris depuis 06C.
- `QuoteService.test.ts` : ajout des sept scénarios 06C (3), 06D (2), 06E (2), sans supprimer les tests présents.
- `check-unsaved-inputs-ui.cjs` : reprise du scénario Electron A → B → A de 06B.
- `.github/workflows/ci.yml` : activation de la recette Electron UX-01 pour PR #124.

## Vérifications et réserves au 14 octobre 2026
- **Fait :** typecheck, 1 051 tests Vitest, Electron UX-01, 3 thèmes et recette transversale Windows sur merge synthétique : CI #1194 verte sur `e4930dba7d2aef15fcb940c4acf9d4df34197c90`.
- **Fait :** traçage A→B→A, rejet asynchrone obsolète, contrôles migration / restauration / SQLite sur fixtures TEMP ; preuves reprises ci-dessous.
- **À faire avant la fusion :** inspection visuelle humaine, revalidation éventuelle après intégration des lots 04/05 et autorisation explicite. Pas de validation sur données réelles.
- **Référentiel central :** [complément vérifié 06A–06F](LOT-06-DELTA-REFERENTIEL-2026-10-14.md) destiné à la PR documentaire #82 ; cette dernière conserve son référentiel historique en attendant la consolidation.

**Attention :** la CI du candidat n'autorise pas sa fusion : la PR #124 reste en brouillon.
## Bilan vérifié sur le code convergé (mise à jour 14/10/2026)

- PR candidate [#124](https://github.com/atoumweb-prog/atoumweb-manager/pull/124), toujours en **draft**. Aucun commit fusionné dans `main`.
- CI [#1158](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38592711806), commit exact `64948147d08e665257728b1de64aba8406b4b751` : **success**, contrôle TypeScript, Vitest complet, UX-01 Electron et recette Electron transversale Windows TEMP, tous **success**.
- Vitest #1158 : **1 051/1 051 tests sur 110 fichiers** ; `src/main/restore.test.ts` **35 tests**, migrations `migrations.test.ts` **10 tests**, `restoreBinaryEquality.test.ts` **6 tests**, `restoreQuitGate.test.ts` **5 tests** et `restoreQuitLifecycle.test.ts` **5 tests** réussis.
- Electron UX-01 #1158 : 192 contrôles sur 3 thèmes (journal `checks:192, failed:[]`), incluant retours asynchrones, clôture/rechargement, brouillons et données de validation TEMP.
- Recette transversale #1158 : intégration 37/37 ; CRM 77 assertions natives ; recherche 92/92 ; accueil 64/64 ; recette finale 527/527 ; parcours 67/67 ; interface 374/374 ; zéro erreur de console signalée ; tous les scénarios aboutissent à `INTEGRATION_COMPLETE`.
- Preuve image automatisée : 135 captures sur 15 scènes × 9 thèmes/densités, plus 63 captures d'interface et 9 du CRM ; captures vérifiées mais inspection humaine des images **non réalisée** (quota de stockage Actions saturé).
- Intégrité/migrations : parcours Electron UX-01 avec migrations exactement 1–66, `integrity_check` OK, aucune FK en défaut ; flux restauration/binaire et migrations couverts par Vitest sur TEMP. Aucun test effectué sur les données réelles ni sur Validation-MSI.
- Protection des réponses obsolètes : `QuotesPage.tsx` corrige aussi le rejet provenant d'un `refresh()` abandonné après navigation A→B ; le scénario `C03 obsolete Quote failure` est passé au sein de l'intégration 37/37.
- Documentation des sous-lots 06A/06B/06C/06D et 06F importée sans supprimer les PR sources. Les constats de CI « non exécutée » dans ces archives restent historiques et sont **remplacés par les preuves ci-dessus** pour le code convergé.
- Comparaison Git au moment de ce bilan : `main` était `cc0bc679400321f5afacdbee3317ea8acc451518`, candidat sans retard (`behind_by:0`). À renouveler immédiatement avant intégration ; autres lots 04/05 peuvent évoluer indépendamment.

### Limites restantes / conditions de clôture

1. **CI du code convergé :** #1194 réussie sur `e4930db`, vérifiée sur le merge synthétique `b644917`. Toute nouvelle documentation sur le candidat déclenche une vérification de son propre HEAD ; une ancienne CI ne doit pas lui être attribuée.
2. **Revue visuelle humaine :** comparer les captures sur vraie fenêtre Windows, notamment prix affichés, panneau contrats/CGV, boutons Abby et neuf combinaisons de thème/densité. Les 135 captures ont été produites/vérifiées automatiquement, pas approuvées visuellement par un humain.
3. **Frontières entre lots :** le Builder CGV du lot 05 et les évolutions Catalogue/migration 67 du lot 04 sont des dépendances externes ; ne pas intégrer leurs modifications à cette PR ni en revendiquer la certification.
4. **Pré-main uniquement :** actualiser sur la dernière base, détecter conflits 04/05, réexécuter tests sur SHA rebasé, contrôler protections GitHub et demander accord explicite. Aucune fusion automatique.

Le candidat est **techniquement convergé avec recette automatisée Windows réussie sur `e4930db`** ; le référentiel central #82 n'est pas encore synchronisé avec les preuves. L'inspection visuelle humaine et les vérifications d'intégration du dernier `main` restent distinctes.

## Passation finale Codex — audit du 14 octobre 2026

### Code candidat et exécution exacte
- **Dernier SHA de code vérifié** : `e405bc63b296f00dc67f32188edc8a70262e2636`. La présente annexe est strictement documentaire et ne modifie ni le code ni les tests ; ne pas attribuer automatiquement la CI de ce SHA à un éventuel HEAD documentaire ultérieur.
- **CI #1645** : [run 38635697170](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38635697170), `completed/success`, job `quality` réussi. Logs examinés : TypeScript réussi, **111 fichiers / 1 063 tests Vitest réussis**.
- **Electron/Windows sur TEMP** : UX-01 **192** contrôles, devis/Abby et parcours anti-double action testés, intégration **37/37**, CRM **77**, recherche **92**, accueil **64**, recette visuelle automatisée **527**, parcours **67**, shell **374**, `INTEGRATION_COMPLETE`. Les journaux attestent **135 captures** sur quinze scènes et neuf présentations, et **63 captures vérifiées** par la recette de shell ; ce n'est pas une revue visuelle humaine.
- **SQLite** : tests de migration, clés étrangères et restauration sur fichiers temporaires et bases en mémoire. Aucun accès ni exécution de `SELECT id,name,applied_at FROM schema_migrations` sur une base Windows persistante. **Aucune migration nouvelle dans le lot 06** ; le registre des migrations est identique à celui de `main` à la comparaison.
- Comparaison `main...integration/ux-v2-06-candidate-20261014` au moment de l'audit : **61 commits d'avance, zéro de retard**, 22 fichiers modifiés. À recalculer avant rebase/convergence.

### Livré par sous-lot
- **06A** : prix proposé et aperçu calculés en centimes ; confirmation externe Abby distincte des états finalisé/envoyé/vu ; test du parcours finaliser → envoyer → voir sans conversion.
- **06B** : navigation par identifiant, brouillons UX-01, erreurs et résultats asynchrones obsolètes, verrou création unique.
- **06C** : lignes catalogue/offres, achat/retrait explicite des options, provenance/version des composants, montant recalculé et préservation des clauses personnalisées lors d'ajout/retrait.
- **06D** : préparation des contrats liée au moteur CGV existant, sans moteur parallèle ; clauses orphelines conservées en historique mais exclues du texte compilé ; blocage ciblé des orphelines activées lorsque la préparation exige leur résolution.
- **06E** : copies indépendantes, révisions, protections de mutations, conservation des CGV personnalisées et absence de conversion sur refus/envoi/consultation ; rollback si cycle Projet non raccordé.
- **06F** : recettes Windows Electron/IPC/SQLite sur TEMP et PR de convergence isolée.

### Réserves qui restent réellement ouvertes
1. **Traçabilité** : matrice des **109 exigences** rédigée antérieurement : **53 preuves partielles et 56 sans rattachement individuel**. Les tests ciblés postérieurs couvrent davantage de cas, mais la matrice n'a pas été requalifiée assertion par assertion. **Ne pas prétendre 109/109 validés.**
2. **Dépendances** : lot 04 Catalogue, suggestions et collisions potentielles sur `QuotesPage.tsx` / scripts UX ; lot 05 CGV, classement juridique et export ; lot 07 cycle Projet, révisions et conflits. Les branches n'ont **pas** été convergées dans le candidat 06.
3. **Validation humaine** : inspection visuelle des neuf modes, adéquation des textes juridiques, preuve d'acceptation réellement constatée dans Abby, utilisation Windows Validation-MSI et données persistantes.
4. **Après convergence** : comparer les fichiers partagés et SHA, résoudre les conflits sans écrasement, vérifier les migrations 67/68/69 attribuées aux autres lots sur les bases **persistantes** avant toute intégration, rejouer la CI et les recettes Electron/SQLite sur l'arbre final.

**Statut transmis : candidat 06 prêt pour revue et convergence Codex sur son périmètre automatisé ; pas de clôture exhaustive du référentiel, pas d'autorisation de merge, aucune base persistante modifiée.**
