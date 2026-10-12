# UX/UI V2 — Lot 01E : matrice de recette (checkpoint pilote)

## Validation Windows — 12/10/2026

SHA testé **d4b38798d583ee57329d8e49c9e5b111b67862c9**. TypecheckOK ; ciblés52/52 (feedback13, draft8, registry10, windows21) ; complet **859/859,93fichiers,100,20s,sansRPC** ; Electron **95/95**, neufcaptures auSHAexact/dirty:false. UX-01 **183/183**, 01D **126/126**, 01C **66/66**, migrations1–66/intégritéOK/FKvide TEMP, nettoyage confirmé. Aucun accès Validation-MSI, aucun service métier modifié.

| R01E | État actuel / preuve et limite |
|---|---|
| 01 | PASS pilote : six états/priorité32combinaisons, rendu/styling etfont dans neuf variantes. |
| 02 | PASS pilote : fermetureA dirty refusée, champsA/B intactes, confirmation native défautRester. |
| 03 | PASS : annulationA refusée/acceptée avecBdirty inchangé ; baselineB rétablie séparément. |
| 04 | PASS pilote : saveA acquitte seulementA et laisseBerror/texte inchangés. |
| 05 | PASS pilote : vrai mergeDraft propre/concurrent, conflit conservé pendant nouvelle saisie. Effacement du conflit explicitement TEST, pas une résolution métier. |
| 06 | PASS : soumission ancienne acquittée sans effacer nouvelle saisie, sortie encore dirty, secondsave requis. |
| 07 | PASS non-régression : repli et retour des sections Prospection/Devis sur fixture UX-01. |
| 08 | PASS non-régression : archive/suppression ligne avant mutation, Rester/abandon ciblé, fixture UX-01. |
| 09 | DIFFÉRÉ : save-and-exit réel non activé, protocole uniquement ; autorisation spécifique/service à qualifier. |
| 10 | DIFFÉRÉ pour save-and-exit ; échec async ordinaire testé, saisie récente conservée, aucun déplacement. |
| 11 | PASS pilote : aucune option save-and-exit sans capacité. Pas de couverture implicite des17modules. |
| 12 | PASS : pending nativeclose refuse, Rester seulement ; aucune BD dans atelier. |
| 13 | PASS : deux vraiesfenêtres dirty, quitannulé agrégé, fermeturesecondaire acceptée conserve primaire. |
| 14 | PASS non-régression : changement workspace/refus/différé/ticket invalidé surfixture UX-01. |
| 15 | PASS : Escape/Enter/Space/Tab/ShiftTab natifs, reloadRester ; extérieur inoffensif, backdrop métier UX-01 testé. |
| 16 | PASS au périmètre diff : seules fixtures/présentation/tests changés ; suite métier859verte. Aucun ordre commercial/publication/signature modifié. |
| 17 | PASS : neufvariantes avecBdraftidentique ; zoom100/125/150 conserve saisi. |
| 18 | LIMITE assumée : pas de recoverycrash ni persistance de texte ; pas de crashTEST revendiqué. |
| 19 | PASS provenance/pilote : #81 déjàfusionnée, #83 fermée sansfusion mais protections présentes sur base89 ; suite859/restaurations35 etnatifUX-01183 verts, pas de merge supplémentaire. |
| 20 | PASS pilote + régression : déduplication AppButton/ref local, refus async, IPC versionpérimée réel dansUX-01 ; aucune mutation/succès surerreur. Pas de panne réseau réelle externe. |

**01E.5/01E.6 stabilisés techniquement au périmètre pilote volontaire.** Recettehumaineglobale différée ; critères09/10 restentciblesfutures exclues de cette clôture, protocolenonactivé. Suiteautorisée01F dansbranche/PRdistinctes, sanslot02/03 niportsgénéraux.

## Historique — avant exécution Windows

**12/10/2026 — PR #90 draft.** Base #89, aucun module métier migré. Cette matrice distingue les preuves **de code** des tests **exécutés**. Elle ne transforme pas les exercices non joués en « PASS ».

| Critère référentiel #82 | Statut à ce checkpoint | Preuve / reste à faire |
|---|---|---|
| R01E-01 — États clean/dirty/pending/error/conflict | **PARTIEL** | `resolveFormFeedback` + `AppNotice` + atelier A/B ; 32/32 combinaisons de logique pure exécutées hors dépôt. Rendu Electron neuf variantes non joué |
| R01E-02 — Changer de fiche avec brouillon | **PARTIEL** | L'atelier appelle `requestUnsavedExit` pour fermer A, test natif rédigé avec refus ; non exécuté sur le code #90 |
| R01E-03 — Annuler un sous-éditeur | **PARTIEL** | Deux groupes A/B ; `Annuler cette note` exige la confirmation UX-01 ; test refus/abandon rédigé, pas joué |
| R01E-04 — Enregistrer A, modifier B | **PARTIEL** | A/B ont états et baselines indépendants ; sauvegarde simulée et assertions dans le banc ; aucune vraie API métier |
| R01E-05 — Donnée distante et conflit | **PARTIEL** | Atelier avec vrai `mergeDraft` partagé : version distante sur note propre mise à jour ; sur note sale, conflit affiché et texte local conservé. Assertions Electron écrites, pas encore exécutées |
| R01E-06 — Réponse ancienne après nouvelle saisie | **PARTIEL** | L'éditeur reste modifiable pendant `pending` ; `mockSave` n'acquitte que le snapshot soumis avec `draft.saved(submittedText)` ; le banc vérifie nouveau texte conservé, fiche toujours dirty, sortie refusée puis second save. Pas de run natif |
| R01E-07 — Replier section Prospect dirty | **HÉRITÉ / À REVALIDER** | Branche source contient UX-01 ; aucune modification du composant métier dans #90 ; rejouer recette de régression |
| R01E-08 — Archiver Prospect / supprimer ligne Devis dirty | **HÉRITÉ / À REVALIDER** | Handlers existants mappés, pas de nouveau contrôle d'exécution sur #90 |
| R01E-09 — Save-and-exit réel | **NON IMPLÉMENTÉ** | Protocole async en conception ; aucune capability de save universelle ni troisième bouton natif |
| R01E-10 — Save-and-exit échoué | **NON IMPLÉMENTÉ** | Le composant montre erreur/conflit ; aucune opération réelle save-and-exit |
| R01E-11 — Éditeur sans capacité | **CONFORME AU PILOTE PAR ABSENCE** | L'atelier ne présente **aucun** bouton save-and-exit ; autres formulaires à vérifier lors de la migration |
| R01E-12 — Pending empêche fermeture | **PARTIEL** | Native `UnsavedWindows` existante ; bench appelle `win.close()` pendant pending ; validation Windows manquante |
| R01E-13 — Deux fenêtres dirty | **OUVERT** | API native conservée ; scénario multifenêtres non joué sur #90 |
| R01E-14 — Changer workspace dirty | **OUVERT** | Aucune route métier ni contexte workspace dans l'atelier ; doit rester protégé par les tests existants |
| R01E-15 — Outside / Escape / reload | **PARTIEL** | Fermeture contrôlée et native testées dans le banc écrit ; clavier Escape/reload à compléter |
| R01E-16 — Sauvegarde ≠ publication/transition | **CONFORME AU DIFF, À REVALIDER** | #90 crée uniquement des fichiers, aucun handler métier, IPC, CGV, devis, Bridge touché |
| R01E-17 — Changer thèmes/densités | **PARTIEL** | CSS scoped, 3×3 et captures prévus dans le banc ; tests natifs non joués |
| R01E-18 — Crash / récupération | **LIMITE ASSUMÉE** | Aucune promesse de récupération automatique, aucune persistance de brouillon fictif |
| R01E-19 — Interopérabilité #81/#83 | **PARTIEL** | Mécanismes UX-01 effectivement présents sur base #89 ; #83 fermée sans merge et #81 fusionnée, typecheck/suites à rejouer sur #90 |
| R01E-20 — Erreurs IPC/save/double clic | **PARTIEL** | Erreur affichée dans atelier et verrou `AppButton` réutilisé ; pas de simulation réelle de refus IPC ou de double clic en cours de sauvegarde |

## Vérifications effectivement obtenues

- Comparaison sur GitHub : la branche 01E se compose **uniquement de fichiers nouveaux**, sans modification d'éditeur métier, du registre UX-01 ou du processus Main.
- Audit statique détaillé des fonctions et services dans `docs/UXV2_LOT01E_EXECUTION.md`.
- Logique pure `resolveFormFeedback` récupérée du dépôt exécutée sur **32 combinaisons de cinq indicateurs**, avec aucun écart dans la priorité d'état ni le message/level ; transcrite en test Vitest `formFeedback.test.ts`.
- Vérification syntaxique JavaScript du banc Electron après correction des cas de conflit, de retour tardif et d'annulation gardée.
- **Aucun test Electron Windows, Vitest complet, compilation TypeScript globale ou CI hébergée lancé** : les compteurs précédents 846/846 appartiennent à **01D** et ne sont **pas** des résultats 01E.

## Prochain gate technique

Sur un checkout Windows isolé de la branche PR #90, relever le SHA exact et travailler sans `Validation-MSI` :

```powershell
npm run typecheck
npm test -- --maxWorkers=2
node scripts/check-ux-v2-lot01e-workshop.cjs
```

Ne pas forcer un PASS si une dépendance, un runner ou un poste manque. Corriger chaque échec sans supprimer les assertions ni ajouter des délais arbitraires pour masquer une non-régression. Le bench natif utilise seulement des fixtures temporaires et produit des captures sous `outputs/ux-v2-lot01e-reference`.

## Règle de passage à 01F

01E doit atteindre une preuve technique suffisante de son **périmètre pilote** ; les critères liés aux services métier, à la synchronisation réelle multifenêtres ou à save-and-exit restent clairement différés aux étapes autorisées. La recette humaine visuelle globale sera organisée à la fin de la refonte, sans abandonner les gardes de perte de données en cours de chantier.
