# UX/UI V2 — Lot 01E : reprise et premier incrément non destructif

## 12/10/2026 — reprise MSI et bilan technique01E.5/01E.6

Départce8d17670ab43901e6cb7e79d278ca999ce8a31f confirmé parGitHub etcheckoutpropre, branche90 conservée/base89. Aucun travail local à préserver sur89. Référentiel82 relu ; aucune ancienne implémentation recommencée.

Deux défauts démontrés : castTypeScript démarrant aprèsnewline dansformFeedback.test.ts (typecheckTS1434 etsuite nontransformable) ; shelldu banc sanssidebar/content-area, capturecompressée etcontrôles sansstylecontextuel. Correction syntaxique sanschangerassertions ; shellreprend structureManager etassertionsdegéométrie/styling. Premier runce8d : 846tests héritésPASS, 1suite01E nontransformée, natif50PASS maiscapturesvisuellesincorrectes. Ce n'estpasunevalidation complète.

Code8f527479e1ec0c20741e854030adcd4e83c01176 : fauxsaveéchecasync/déduplicationlocalepending, Escape scoped versregistreexistant, sixétatsderéférence etbancannulationsA/B, clavier, reload, deuxfenêtres. Correctionbancfinale **d4b38798d583ee57329d8e49c9e5b111b67862c9**, validéecheckoutpropre : typecheckOK, ciblés52/52, complet **859/859 dans93fichiers,100,20s,sansRPC**, restaurations35/35. Electron **95/95**, neufcaptures synchronisées/manifesteSHA/dirt y:false (`dirty:false` dansJSON). UX-01183/183, atelierD126/126, C66/66 ; intégrité/FK/migrations1–66 TEMP, nettoyagesconfirmés. Revuevisuelle directe AtoumWeb/Confort avantcheckpoint finalbancdeproductionidentique.

Lesajouts n'appellentaucunserviceclient : snapshot soumis seul acquitté, saisiependantpending conservée, erreur/refus/conflict restentvisibles ; annulation limitedgroup viaUX-01, quitagrège deuxfenêtres réelles. Aucune modificationdu registre/Main/preload métier, migrations, montants/CGV/signature ; aucuneactivationEnregistrer etquitter. Lesanciensdocumentsdeprotocolerestentconception ; [20critères etlimites](UXV2_LOT01E_GATES.md).

Clôturetechniqueproposée du pilote01E.5/6, recettehumaineglobale différée. R09/R10(nonactivationmétier) etR18(crash) restentexplicitement horsfonctionnalitéslivrées. Suiteautoriséepartuser : préparation/développement01F dansbranche/PRdistinctes ; pas01F présenté commeachevéici. AucuneCIhébergée/merge/Validation-MSI, publicationsskipci.

## Historique du développement ChatGPT

**12/10/2026 — branche dédiée `feature/ux-v2-lot01e-form-feedback-v1`**, créée depuis **PR #89 @ `366395ad402169c985f83fd46e808d89cc2f0b19`**. Base de PR prévue : `codex/ux-v2-lot01d-inventory-v1`. Les PR #86/#87/#88/#89 ne sont pas modifiées ; aucune fusion vers `main`.

## 01E.1 — Audit réel des protections : constat, pas simulation de merge

| Élément sur la base #89 | Contrat lu et rôle à conserver | Limite |
| --- | --- | --- |
| `src/renderer/unsaved/unsaved.tsx` | `UnsavedGroup`, `useUnsavedDraft`, `requestUnsavedExit`, publication du lifecycle | La baseline, le `resetKey`, les révisions et les groupes restent la responsabilité de l'éditeur |
| `src/shared/unsavedRegistry.ts` | Entrées scoped `dirty/pending`, agrégation, refus de sortie, confirmation avant `discard` | Pas de `save()` et pas de mécanisme de sauvegarde globale |
| `src/shared/draftSection.ts` | `mergeDraft`, `DraftSection`, conflits conservés en cas de modification concurrente | Fusion de tableaux comme unité ; pas de résolution juridique automatique |
| `src/shared/unsavedWindows.ts` | Tickets par fenêtre / epoch / revision, invalidation sur modification | Ne pas créer de deuxième registre ou d'autorisation de sortie indépendante |
| `src/main/unsaved.ts` | Dialogue natif synchrone `Rester` / `Quitter sans enregistrer`, `Rester` seul si pending ; veto de fermeture | Impossible de lui ajouter directement un `await save()` dans le dialogue synchrone |
| `src/renderer/ui/AppButton.tsx` | Action explicite, verrou async, erreur générique si rejet | Un clic n'est **jamais** une preuve de sauvegarde |
| `src/renderer/ui/AppNotice.tsx` | Affichage accessible de succès, erreur, information ou alerte | L'éditeur fournit le niveau **après** le résultat de son propre service |
| `src/renderer/crm/ProspectsPageV2.tsx`, `src/renderer/commercial/QuoteOfferOptionsPanel.tsx` | Premiers raccords métier UX-01 / pending de devis, protégés dans leurs domaines | Ne pas présumer la protection des autres modules, de tous les éditeurs ou d'une sauvegarde universelle |
| `docs/ux-v2/LOT-01E-FORMULAIRES-CONFIRMATIONS.md` (#82) | Scénarios R01E-01 à 20 et sous-étapes 01E.1 à 01E.6 | Référentiel normatif ; sa rédaction n'est pas une recette effectuée |

**Provenance historique :** #81 (restauration SQLite) est fusionnée dans `main`. La PR corrective #83 a été **fermée sans fusion**, donc ne pas confondre statut de #83 et présence de son code dans les branches UX V2. Les mécanismes listés ci-dessus ont été **lus dans la branche issue de #89**. Aucun nouveau merge `#81/#83`, ni modification de `ipc.ts`, `main.ts`, du lifecycle ou des migrations n'a été effectué ici.

## 01E.2 — Matrice initiale des responsabilités

| Action / domaine | Périmètre éditeur ou confirmation | Service / état réel | Règle 01E |
| --- | --- | --- | --- |
| Changer un Prospect / une fiche Devis avec brouillon | `requestUnsavedExit` sur le bon groupe | Aucun appel d'enregistrement implicite par la navigation | `Rester` conserve éditeur et saisies ; pending interdit la sortie |
| Modifier une section Prospect | `useUnsavedDraft` au niveau section | Service CRM propriétaire de la persistance | Ne pas écraser une section voisine en annulant |
| Modifier options du Devis | `QuoteOfferOptionsPanel` : pending + groupe `quote:<id>/options` | `quotes.updateLine` / `quotes.selectOfferOption`, retour du service avant `onSave` | Sauvegarde / succès spécifiques au devis, pas au document entier ; conserver garde Abby |
| Restauration et quit Electron | `UnsavedWindows` + `restoreQuitGate` | Cleanup SQLite/marker seulement au bon lifecycle | Jamais de fermeture native prématurée, ni nouveau dialogue maison |
| Publication CGV/contrat, devis accepté, archive | Handlers métiers existants (à auditer par écran) | Transitions réelles hors de cet incrément | Ne jamais interpréter une sauvegarde visuelle comme validation/publication |

**Inventaire complet handler → IPC/service/DB par écran** à poursuivre sur des pilotes identifiés, avant toute modification d'une fiche réelle. Les écrans Clients/Catalogue/Projets/Opérations/Documents ne deviennent pas automatiquement protégés par la création d'un composant commun.

## Premier incrément livré sur cette branche : feedback form local

- `src/shared/formFeedback.ts` : fonction **pure** transformant des faits fournis par un éditeur en six états `clean / dirty / pending / error / conflict / saved`.
- `src/renderer/ui/FormFeedbackIndicator.tsx` : présentation via le composant `AppNotice` déjà livré par 01B, libellé explicite de l'éditeur concerné.
- `src/shared/formFeedback.test.ts` : scénarios unitaires d'ordre de priorité et d'absence de faux succès.

**Invariant fondamental :** `saved` n'est présenté que si `serviceConfirmed === true` **et** aucun état `dirty`, `pending`, `error` ou `conflict` n'existe. Le caller **doit** ne fournir `serviceConfirmed` qu'après une réponse réussie de son vrai service pour la révision de cet éditeur. Ce composant ne peut pas déduire seul la vérité du backend, ne déclenche pas de service, ne persiste rien et ne s'inscrit pas dans le registre.

Ce premier incrément **ne prétend pas** satisfaire à lui seul R01E-01 (encore à vérifier en réel sur neuf configurations), ni les autres R01E-02…20. Il constitue une base de présentation isolée ; aucune donnée, formulaire métier, CGV ou offre existante n'est modifiée.

## Suite conforme au plan

1. **01E.2** : compléter la matrice des sous-éditeurs pilotes avec révision/source, service de sauvegarde et garde existante.
2. **01E.3** : ajouter un atelier Electron **strictement isolé** démontrant deux sections indépendantes `dirty/pending/error/conflict`, sans API business, puis trois thèmes × trois densités, clavier, petit écran et tests `Rester`.
3. **01E.4** : documenter **sans activer automatiquement** le protocole optionnel `Enregistrer et quitter`, qui doit être async côté renderer, réévaluer la garde et n'apparaître que sur éditeur avec service réel fiable ; la confirmation Electron native reste intacte.
4. **01E.5–01E.6** : pilote non destructif et recette technique des critères ; extension aux modules métiers dans leurs lots prévus, recette humaine générale différée.

**Contrôles en attente de preuve Windows** : `npm run typecheck`, `npm test -- --maxWorkers=2` et nouveaux tests ciblés. Aucun résultat PASS ni HEAD de CI n'est revendiqué sans exécution. La CI Windows #86 demeure différée jusqu'à vérification du quota GitHub Actions et de `Stop usage` ; son autorisation budgétaire antérieure ne vaut pas lancement en présence de cette incertitude. Aucune fusion n'est autorisée.

**Interdictions :** ne pas utiliser Validation-MSI ; ne pas modifier `main`, le processus principal, les restaurations, les abonnements ou les règles contractuelles ; ne pas créer un registre UX-01 concurrent ni annoncer « Enregistré » après simple clic.

## 01E.3 — Atelier UI isolé ajouté, recette native en attente

Les nouveaux fichiers `src/renderer/ui/FormFeedbackWorkshop.tsx`, `scripts/check-ux-v2-lot01e-workshop.cjs` et `scripts/launch-ux-v2-lot01e-workshop.cmd` permettent de vérifier un premier scénario réaliste **sans base de données** :

- deux formulaires fictifs A/B avec `useUnsavedDraft` et groupes distincts `uxv2:form-workshop/a`, `.../b` ;
- saisie A laissant B propre, puis deux brouillons distincts ;
- tentative de fermeture A avec `Rester` par défaut : aucun brouillon ni formulaire supprimé ;
- simulation explicitement identifiée comme telle d'un retour positif/erreur/conflit, sans sauvegarde IPC ;
- refus de fermeture native Electron en `pending`, puis fermeture d'A propre sans toucher B sale ;
- contrôles de présentation trois thèmes × trois densités et neuf captures synchronisées, zoom et conservation de B ;
- `contextBridge` expose **seulement l'API native `unsaved`** à l'atelier ; aucun accès aux services commerciaux, projets, CGV, SQLite ni à Validation-MSI ;
- profil `%TEMP%` identifié et nettoyé en fin d'exécution ; captures sous `outputs/ux-v2-lot01e-reference/` hors Git.

Commandes de validation prévues **dans le vrai checkout Windows** :

```powershell
npm run typecheck
npm test -- --maxWorkers=2
node scripts/check-ux-v2-lot01e-workshop.cjs
```

Lancement interactif volontaire, avec données fictives : `scripts/launch-ux-v2-lot01e-workshop.cmd`.

**Preuves exécutées lors de cette reprise ChatGPT :**
- audit statique des APIs et des limites à partir des fichiers sur le HEAD #89 ;
- parsing syntaxique JavaScript du banc : **OK**, sans lancement Electron ;
- transpilation TypeScript isolée des versions contrôlées de `formFeedback.ts` et `FormFeedbackIndicator.tsx` : **OK syntaxiquement**, sans résolution des types du projet ;
- exécution Node isolée de **18 vérifications de logique pure** (priorités des états et libellés) sur le même contenu de `formFeedback.ts` ; hash de blob Git du helper local **identique** au fichier GitHub `3fe3fccd40b88f0aa3eb6d378a5c1978885c6802`.

**Ne pas assimiler ces vérifications locales partielles à Vitest, à un typecheck de l'application, à des tests Electron Windows ou à la recette R01E entière.** L'atelier n'est pas branché sur `App.tsx` ni sur un éditeur métier : la PR #90 reste un **pilote en cours**, aucun résultat R01E-01…20 n'est déclaré définitivement PASS.

**Étape suivante** : vraie exécution Windows des commandes ci-dessus ; après corrections éventuelles, préparer les scénarios R01E-03 à 06 (sous-éditeur indépendant, réponse de sauvegarde tardive, conflit et absence de faux succès), puis le protocole de `Enregistrer et quitter` **uniquement en conception** tant que les capacités et l'autorisation métier ne sont pas validées.

## Revue corrective des actions de l'atelier

Sur la version du pilote publiée après son premier squelette, deux protections supplémentaires ont été codées **avant recette Windows** :

1. **Conflit non effacé par la saisie** : écrire dans un champ laisse le conflit apparent ; la simulation exige un effacement explicite du conflit fictif avant de pouvoir montrer un retour positif. Ce n'est **pas** une résolution métier réelle.
2. **Annuler une note passe par `requestUnsavedExit` sur son groupe**, avec `Rester` par défaut. Le banc comporte les deux assertions : annulation refusée = texte intact ; abandon expressément accepté = restauration de la baseline de ce formulaire uniquement.

Ces changements restent limités au composant `FormFeedbackWorkshop` et à son banc ; ni `unsavedRegistry`, ni les services, ni l'éditeur de Devis/Prospect existant ne sont modifiés.

Dernier HEAD consulté dans cette reprise : `feature/ux-v2-lot01e-form-feedback-v1@63f7686ba591d3273883c638e241f2640ffde9a7`. **Tests Electron, 3×3 et suite complète encore à exécuter sur ce HEAD** ; ne pas donner de score fictif.

## 01E.2 — Complément de cartographie statique : sous-éditeurs Prospect / Devis

Les points ci-dessous ont été relevés sur les fichiers publiés dans la base **#89 @ `366395ad`**, et ne sont **pas** une vérification d'exécution dans les 17 modules. Chaque sous-formulaire reste maître de ses services.

| Sous-formulaire / route | Groupe ou entrée UX-01 vérifié | Handler → service réel | Condition de confirmation / vigilance |
| --- | --- | --- | --- |
| Création Prospect (`ProspectsPageV2`) | `prospect:create`, draft + pending `saving` | Création organisation/contact/méthodes, puis `crm.prospects.create`, recherche et action initiale éventuellement | Parcours multi-écritures : **pas de save-and-exit générique** ni atomicité supposée ; erreurs conservées selon handler existant |
| Fiche Prospect / entreprise et interlocuteurs (`ProspectIdentityPanel`) | `useUnsavedDraft` hérite du panneau actif, `ready: !!identity`, `pending: busy` | `crm.organizations.update`, `crm.contacts.update/create`, `crm.prospects.update`, `crm.prospects.updateQualification`, contacts/méthodes | `guard.saved()` après les appels attendus ; plusieurs écritures possibles, contrôle de cohérence indispensable avant toute capacité « enregistrer et quitter » |
| Besoins Prospect (`ProspectNeedsPanel`) | Deux entrées distinctes : `Prestation envisagée` et `Identification du besoin`, `pending:busy` | `workflow.saveNeed/removeNeed` ; `crm.prospects.updateQualification` et `crm.prospects.update` | Le second enregistrement appelle `infoGuard.saved()` après **deux** mises à jour ; ne pas prétendre qu'une opération composite est atomique |
| Nouveau Devis (`QuotesPage`) | `quote:create` avec wizard, lignes et termes | `quotes.createWithLines`, dépend du vrai propriétaire et des données | Création du dossier commercial, pas une sauvegarde d'un simple champ ; reste hors save-and-exit |
| Détail Devis + lignes (`QuotesPage`) | `quote:<id>` ; sous-groupe `quote:<id>/line:<id>/editor` lors de l'édition | `quotes.updateLine/removeLine` puis rafraîchissement ; `QuoteLineEditor.onSave` async | Garde avant changement d'éditeur via `setEditingLineId`, suppression via `requestUnsavedExit`. Le `onCancel` direct de l'éditeur est à **examiner sur fixture** pour confirmer le contrat d'abandon ciblé |
| Options du Devis (`QuoteOfferOptionsPanel`) | `quote:<id>/options`, pending busy ; `QuoteLineEditor` imbriqué | `quotes.updateLine/selectOfferOption/deselectOfferOption` | Confirmation du service avant `onSave`, pas avant ; sélectionner/retirer une option constitue une opération commerciale, **pas** une préférence visuelle |
| Référence/document Abby (`QuoteContractDocumentPanel`) | `quote:<id>/abby`, `dirty` selon référence, pending busy | `quotes.updateAbbyReference`, `quotes.importContractDocument`, `quotes.openContractDocument` | Référence = modification de champ ; import du PDF accepté = **action probante distincte** et ne doit jamais se déclencher par simple save-and-exit |
| Destination opérationnelle (`QuoteOperationalSalesPanel`) | `useUnsavedDraft` sur projet/site/contexte/auteur, pending saving | `quotes.assignOperationalTarget` puis rafraîchissement ; `guard.saved()` après réponse | Affectation de destination implique le cycle Projet / opération : pas de capacité save-and-exit implicite |
| Transitions du Devis (`QuotesPage`) | Garde `quote:<id>` avant `transition` | `quotes.finalize/markSent/markViewed/accept/refuse/expire/duplicate` ; `contractTerms.quotes.sync` | **Actions métiers distinctes** (preuve, conversion, signature, validité, révision), jamais déclenchées par « Enregistrer » |

**Conclusion E18 :** aucun de ces éditeurs n'est automatiquement déclaré éligible à `Enregistrer et quitter` du fait de la présence d'un `save()` ou de `guard.saved()`. Une compatibilité réelle suppose validation des services, de leurs versions, de la nature de la commande et du périmètre de données ; l'atelier 01E doit rester non destructif avant cette instruction.

**Risques de revue à enregistrer, pas de correctif métier improvisé :** sauvegardes composites partiellement appliquées avant une erreur, interactions entre rechargement serveur et brouillon encore dirty, signal de succès propre à un sous-éditeur alors que le groupe global reste dirty. Aucune de ces observations ne constitue à elle seule une preuve d'anomalie reproductible : prévoir fixtures ciblées avant tout changement métier.

**Suite de 01E.2 :** inventorier les domaines Clients/Catalogue/Projets/Opérations lors des ports propres aux lots métier. Ne pas simuler une protection universelle par la seule existence du registre partagé.

## 01E.5 — Premier pilote non destructif enrichi

L'atelier fictif A/B réalise maintenant deux scénarios supplémentaires du référentiel, sans API métier :

- **Réponse de sauvegarde tardive** : au lancement de `mockSave`, seul `submittedText` est capturé. Le champ reste modifiable en `pending`. À la réponse simulée, `draft.saved(submittedText)` met la baseline sur le snapshot réellement soumis, **jamais** sur le texte actuellement saisi. Une modification intervenue pendant l'attente demeure `dirty`, le bouton Fermer reste protégé ; une deuxième réponse positive sur le texte actuel est nécessaire pour afficher `saved`.
- **Réception d'une version distante** : le bouton TEST appelle directement `mergeDraft` du module partagé `draftSection` en utilisant la dernière baseline confirmée. Si le formulaire est propre, la version distante devient la nouvelle baseline. Si la note locale et la version distante ont toutes deux changé, la note locale est conservée et le conflit demeure visible jusqu'à une action explicite ; aucune fusion de champ conflictuel n'est effectuée.

La protection `UX-01` reste propriétaire des sorties et abandons, sans patch du registre. Le pilote dispose de règles CSS exclusivement dans `form-feedback-workshop.css` et n'est pas monté dans `App.tsx`. Il n'écrit pas de texte métier en stockage.

Le banc `scripts/check-ux-v2-lot01e-workshop.cjs` contient les assertions dédiées : conflit réel issu du merge, saisie locale conservée, mise à jour distante d'un formulaire propre, sauvegarde tardive laissant `dirty`, confirmation native `Rester`, second save confirmé, abandon scoped refusé puis accepté, capture 3 thèmes × 3 densités et zoom.

**Statut de preuve :** cas **codés / tests rédigés**, **non exécutés** sous Electron Windows. Une exécution automatique dans une CI hébergée n'a pas été lancée. Le test Vitest du résolveur contient désormais les 32 combinaisons de ses cinq indicateurs, plus les deux cas `mergeDraft` propre/concurrent ; son succès dans Vitest reste à confirmer sur un checkout Windows.

L'ensemble du diff de #90 doit rester limité aux **nouveaux fichiers 01E** ; aucune modification des vrais écrans CRM, Devis, IPC, SQL ou `main` n'est prévue avant recette et décisions métier.
