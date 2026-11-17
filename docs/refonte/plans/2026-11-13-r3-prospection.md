# R3 Prospection : plan

> **Pour l'exécutant :** exécution en ligne (`superpowers:executing-plans`), une tâche à la fois, tests d'abord (`superpowers:test-driven-development`). **Pas de commit par tâche** : règle C, un seul commit local pour le lot, après tests verts et captures vues par Carlos (tâche 11). Pas de push, PR ni fusion sans accord. Skill de design : `atoumweb-design`, citée à chaque étape.

**Objectif :** refaire la fiche de travail du prospect autour de « Prochaine étape », fusionner les enregistrements et les entrées d'action, ouvrir sur l'onglet de l'étape, rendre les sous-niveaux repliables, passer Prospection et Clients à `PageHeader`, et nettoyer les trois vues de Prospection.

**Architecture :** deux règles pures testées (`prospectNextStep`, `prospectOpeningTab`) décident le contenu ; un petit ajout au registre de brouillons (`saveThenRun`) permet « enregistrer puis continuer » sans second registre ; les composants R1 (`RecordHeader`, `MoreMenu`, `NextStepCard`, `StatusPill`) et R2 (`PageHeader`) sont branchés ; le CSS perd des règles au lieu d'en gagner.

**Stack :** React, TypeScript, vitest (`node scripts/run-tests.cjs [chemin]`), `npm run typecheck`, scripts natifs Electron du dépôt.

**Spec :** `docs/refonte/plans/2026-11-13-r3-prospection-design.md`, validée par Carlos le 13/11/2026 avec les six points de sa fin (recommandations retenues).

## Contraintes globales

- Aucune donnée, règle d'étape, règle de perte ou d'archivage, ni ordre Prospect → Devis → Projet modifiés. Aucune fonction supprimée : ce qui quitte l'écran principal est rangé dans « Plus » ou dans une section repliée.
- Aucun `!important` ajouté, aucune couleur en dur dans un CSS nouveau (jetons `--aw-*`), aucune règle `:has()` nouvelle. Les budgets `importantBudget.test.ts` et `fontFloorBaseline.json` ne montent pas ; ceux des fichiers touchés baissent.
- Plancher de 14 px. Une seule action principale jaune par vue (`buttonHierarchy.test.ts` reste vert).
- `PageHeader` garde `page-heading` et un seul `h1` (des scripts natifs lisent `.page-heading h1`).
- Vérification visuelle : Noir / Confort seulement, captures sur copie jetable, sans port de débogage (règle D). Fins de ligne CRLF des fichiers conservées.
- Le texte de l'interface est en français, sans tiret long, tutoiement dans les messages adressés à l'utilisateur comme aujourd'hui.

## Points de vigilance (Review Focus)

1. Un dossier clos (gagné, perdu, converti, archivé) n'affiche **aucune** action principale ni « Programmer une action ».
2. Cliquer « Préparer le devis » avec un besoin modifié et non enregistré ne perd jamais la saisie : si l'enregistrement échoue, on reste sur place et le message d'erreur est visible.
3. « Enregistrer » ne ferme pas la fiche et ne change pas d'onglet.
4. La fenêtre « Planifier une action » s'ouvre une seule fois par clic, et la fermer avec une saisie en cours passe par la garde existante.
5. Une section repliée contenant un champ invalide ou manquant s'ouvre quand on clique sur « Compléter » (`completeMissing`) : le focus ne tombe jamais dans une section cachée.
6. Le menu « Plus » reste visible dans la fenêtre superposée de la fiche agrandie (`z-index`).
7. Un statut inconnu s'affiche en « neutre » avec son libellé.

## Fichiers

| Fichier | Rôle |
|---|---|
| `src/shared/prospectNextStep.ts` (+ test) | règles pures de la carte et de l'onglet d'ouverture |
| `src/shared/unsavedRegistry.ts` (+ `.test.ts`) | ajout de `saveThenRun` |
| `src/renderer/crm/ProspectsPageV2.tsx` | en-tête de fiche, carte, onglet d'ouverture, vues |
| `src/renderer/crm/ProspectNeedsPanel.tsx` | un seul « Enregistrer », sections repliables, `save` du brouillon |
| `src/renderer/crm/ProspectActionsPanel.tsx` | « Programmer une action », ouverture sur demande |
| `src/renderer/crm/ProspectResearchPanel.tsx` | deux sections repliables (Préparer l'échange) |
| `src/renderer/crm/prospect-record.css` (nouveau) | mise en page de la fiche (jetons seulement) |
| `src/renderer/crm/ClientsPage.tsx`, `src/renderer/App.tsx` | `PageHeader` de Clients |
| `src/renderer/crm/prospect-visual-pilot.css`, `prospection-directory-pilot.css`, `client-list-quick-v2.css` | retrait des règles `:has()` de masquage |
| `scripts/fixtures/prospection-gallery.cjs` | réécriture |
| `src/renderer/crm/prospectR3Wiring.test.ts` (nouveau) | tests de câblage par lecture du source, comme `tableFiltersWiring.test.ts` |

---

### Tâche 1 : règles de la « Prochaine étape » et de l'onglet d'ouverture

**Fichiers :** créer `src/shared/prospectNextStep.ts`, `src/shared/prospectNextStep.test.ts`.

**Interfaces :** produit (le type `ProspectStage` est celui que `ProspectsPageV2.tsx` importe déjà, à relire en tête de ce fichier)
- `type NextStepKind = 'start' | 'validate_qualification' | 'complete_qualification' | 'prepare_quote' | 'continue_quote' | 'closed'`
- `prospectNextStep(input: { stage: ProspectStage; clientAccountId?: string | null; archivedAt?: string | null; qualificationGaps: number }): { kind: NextStepKind; primaryLabel: string | null; closedLabel: string | null }`
- `type DeskTab = 'company' | 'contacts' | 'preparation' | 'needs' | 'actions' | 'quotes' | 'history'`
- `prospectOpeningTab(input: { stage: ProspectStage; clientAccountId?: string | null; archivedAt?: string | null; initialAction?: boolean; initialTab?: 'commercial' | 'reference' }): DeskTab`

- [ ] **Test** `prospectNextStep` (table, une ligne par cas, libellés **exacts** repris du code actuel) :
  `new` → `start`, « Démarrer la prospection » ; `qualifying` avec 0 manque → `validate_qualification`, « Valider la qualification et passer à Besoins » ; `qualifying` avec 2 manques → `complete_qualification`, « Compléter la qualification avant l’étape Besoins » ; `need_identified` → `prepare_quote`, « Préparer le devis » ; chacun de `quote_to_prepare`, `quote_to_send`, `quote_sent`, `follow_up`, `negotiation`, `waiting` → `continue_quote`, « Poursuivre le devis » ; `won`, `lost` → `closed`, `primaryLabel` null ; `clientAccountId` renseigné ou `archivedAt` renseigné (quelle que soit l'étape) → `closed`.
- [ ] **Test** `prospectOpeningTab` : `new` → `company` ; `qualifying` → `preparation` ; `need_identified` → `needs` ; les six étapes de devis → `quotes` ; `won`, `lost`, converti, archivé → `history` ; `initialAction: true` → `actions` ; `initialTab: 'reference'` → `preparation` (l'un et l'autre l'emportent sur l'étape).
- [ ] **Lancer** `node scripts/run-tests.cjs src/shared/prospectNextStep.test.ts`. Attendu : échec (module absent).
- [ ] **Implémenter** les deux fonctions, pures, sans import de React.
- [ ] **Relancer** le même test. Attendu : tout vert.

### Tâche 2 : `saveThenRun` dans le registre de brouillons

**Fichiers :** modifier `src/shared/unsavedRegistry.ts` ; test dans `src/shared/unsavedRegistry.test.ts` (existant, lire son style avant).

**Interfaces :** produit `UnsavedRegistry.saveThenRun(run: () => void, group?: string | string[]): Promise<boolean>`. Comportement : sans brouillon actif, appelle `run()` et renvoie `true` ; si toutes les entrées actives ont un `save` et qu'aucune n'est en cours (`pending`), les enregistre dans l'ordre de `savePriority`, puis appelle `run()` et renvoie `true` seulement si plus aucune entrée n'est active ; si un `save` renvoie `false` ou lève une erreur, **ne lance pas** `run()` et renvoie `false` ; si une entrée n'a pas de `save`, retombe sur `request(run, …)` (fenêtre existante) et renvoie `false`.

- [ ] **Tests** : (a) aucun brouillon → `run` appelé, `true` ; (b) un brouillon avec `save` qui réussit (et appelle `markSaved`) → `save` puis `run`, `true` ; (c) `save` renvoie `false` → `run` jamais appelé, `false`, le brouillon reste actif ; (d) deux entrées, priorités 1 et 0 → ordre 0 puis 1 ; (e) une entrée sans `save` → `run` pas appelé directement et la fenêtre de confirmation (`confirm` fourni au test) est sollicitée.
- [ ] **Lancer** le fichier de test. Attendu : (a) à (e) en échec.
- [ ] **Implémenter** en réutilisant `active()` et la boucle de `save` de `request` (extraire un petit helper privé plutôt que dupliquer).
- [ ] **Relancer**. Attendu : vert, y compris les tests existants du registre.

### Tâche 3 : un seul « Enregistrer » dans Besoins

**Fichiers :** modifier `src/renderer/crm/ProspectNeedsPanel.tsx:205` (props), `:254` (garde), `:547` et `:552` (boutons) ; créer `src/renderer/crm/prospectR3Wiring.test.ts`.

**Interfaces :** `ProspectNeedsPanel` perd les props `onPrepareQuote` et `onContinue` ; l'enregistrement de la garde `infoGuard` reçoit `save: async () => { await saveIdentification(); return lastSaveSucceeded.current; }` pour que la fenêtre de sortie et `saveThenRun` puissent l'appeler.

- [ ] **Test de câblage** (lecture du source) : `ProspectNeedsPanel.tsx` ne contient plus « Enregistrer et continuer », « Enregistrer le besoin », « Enregistrer et faire le devis » ; il contient exactement un bouton dont le libellé est « Enregistrer » ; la garde « Identification du besoin » déclare une option `save`.
- [ ] **Lancer**. Attendu : échec.
- [ ] **Implémenter** : un seul bouton « Enregistrer » (`secondary-button` par défaut, `primary-button` seulement quand `infoGuard.dirty`, voir point 1 validé), « Enregistrement… » pendant l'action, message `savedNotice` et erreur conservés ; retirer le bloc `crm-need-footer`. Mettre à jour les appelants de `ProspectNeedsPanel` (`ProspectsPageV2.tsx:745`).
- [ ] **Relancer** le test de câblage et `node scripts/run-tests.cjs src/renderer/ui/buttonHierarchy.test.ts`. Attendu : verts.

### Tâche 4 : sections repliables de Besoins et de Préparer l'échange

**Fichiers :** modifier `src/renderer/crm/ProspectsPageV2.tsx:744` à `745` (les rangées de sous-onglets) et `ProspectNeedsPanel.tsx` (le masquage `hidden={section!=='…'}`) ; réutiliser `ProspectWorkAccordion` (`ProspectsPageV2.tsx:618`) en l'exportant dans un petit fichier `src/renderer/crm/ProspectWorkAccordion.tsx` si le partage l'exige.

**Interfaces :** `ProspectNeedsPanel` reçoit `openSections: ('qualification'|'brief'|'commercial'|'services')[]` ; les quatre sections se rendent toutes, repliées ou ouvertes ; état mémorisé par la préférence visuelle existante (`window.atoumweb.visualPreferences`, clé `atoumweb:prospection:section:<id>`), jamais en donnée métier.

- [ ] **Test de câblage** : `ProspectsPageV2.tsx` ne contient plus la rangée `aria-label="Informations du besoin"` de sous-onglets ; les quatre libellés « Qualification », « Demande et besoin », « Budget et délais », « Prestations et points à confirmer » existent comme titres de section ; `completeMissing` ouvre la section ciblée avant de donner le focus.
- [ ] **Test** (point de vigilance 5) : un rendu serveur de la section « Qualification » repliée n'a pas de champ focalisable, et l'appel de `completeMissing` la déplie (test sur la fonction qui calcule les sections à ouvrir, à extraire en fonction pure `sectionsToOpen(item)` si nécessaire).
- [ ] **Implémenter** : section de l'étape ouverte par défaut (Qualification tant que le dossier est « À qualifier », sinon « Demande et besoin »), les autres repliées avec un résumé d'une ligne (déjà fourni par `ProspectWorkAccordion`). Même principe pour « Analyse de l’entreprise » et « Objectif et questions » (`ProspectResearchPanel`). Le contenu et les champs ne changent pas.
- [ ] **Lancer** les tests de câblage et `node scripts/run-tests.cjs src/renderer/crm`. Attendu : verts.

### Tâche 5 : « Programmer une action », une fenêtre, deux portes

**Fichiers :** modifier `src/renderer/crm/ProspectActionsPanel.tsx:114` (props), `:298` (bouton) ; `ProspectsPageV2.tsx:698`, `:707`, `:737`.

**Interfaces :** `ProspectActionsPanel` reçoit `openCreateRequest?: number` : à chaque valeur nouvelle strictement supérieure à la précédente, la fenêtre « Planifier une action » s'ouvre (une seule fois, via `setCreateOpen(true)` dans un `useEffect`). `ProspectDetailV2` tient `actionRequest: number` et l'incrémente depuis la carte, depuis `initialAction` et depuis le volet rapide.

- [ ] **Test de câblage** : aucun fichier de `src/renderer/crm` ne contient le texte « + Action », « Planification ouverte » ni un bouton nommé « Prochaine action » ; le libellé « Programmer une action » est le seul verbe de planification ; la fenêtre « Planifier une action » n'est rendue qu'à un seul endroit.
- [ ] **Test** (point de vigilance 4) : une fonction pure `shouldOpenCreate(previous: number, next: number): boolean` renvoie `true` seulement si `next > previous`, `false` sinon (aucune double ouverture au re-rendu).
- [ ] **Implémenter** : bouton de l'onglet « Programmer une action » (secondaire, ouvre la fenêtre) ; la carte et le volet rapide ouvrent la fiche agrandie sur l'onglet Actions **et** la fenêtre. La fermeture avec saisie passe toujours par `actionGuard`. Rien ne change dans la fenêtre « Compte rendu ».
- [ ] **Lancer** les deux tests. Attendu : verts.

### Tâche 6 : en-tête de fiche avec « Prochaine étape » et menu « Plus »

**Fichiers :** modifier `src/renderer/crm/ProspectsPageV2.tsx:733` à `739` ; créer `src/renderer/crm/prospect-record.css` (importé après `prospect-workspace-tabs.css`) ; tests dans `prospectR3Wiring.test.ts`.

**Interfaces :** consomme `prospectNextStep`, `prospectOpeningTab` (tâche 1), `unsavedRegistry.saveThenRun` (tâche 2), `RecordHeader`, `MoreMenu`, `NextStepCard`, `StatusPill`. Éléments du menu « Plus » (`MenuItem` : voir `ui/moreMenuModel.ts`), identifiants : `identity` « Identité et logo », `associations` « Associations », `change_stage` « Changer la situation », `lost` « Classer comme perdu » (`danger: true`), `archive` « Archiver » (`danger: true`).

- [ ] **Test de câblage** : le mode « desk » rend un `RecordHeader` et un `NextStepCard` ; le texte « Poursuivre le devis » n'apparaît qu'une fois dans la fiche ; `prospect-workspace-header`, `prospect-focus-summary` et `prospect-workspace-tools` ne sont plus rendus ; l'état initial de l'onglet utilise `prospectOpeningTab`.
- [ ] **Test** : pour chaque ligne du tableau de la tâche 1, le bouton principal de la carte reçoit le libellé `primaryLabel` et déclenche le gestionnaire qui existe déjà (`onStart`, `validateOrShowQualification`, `goTab('quotes')`).
- [ ] **Implémenter** :
  - en-tête : `RecordHeader` (titre, sous-titre « activité · ville », pastille d'étape via `StatusPill`), logo cliquable conservé, température conservée en en-tête, croix de fermeture conservée ;
  - carte : `NextStepCard` avec `title` = libellé de l'action, `reason` = prochaine action programmée (titre, date, « En retard ») ou « Aucune action programmée. », `primary` = action de l'étape, `secondary` = « Programmer une action » ; dossier clos : pas de `primary`, pas de secondaire, lien « Ouvrir la fiche Client » (même événement `atoumweb:navigate` que `HistoryView`) si converti ;
  - le bouton `prepare_quote` et `continue_quote` appelle `unsavedRegistry.saveThenRun(() => goTab('quotes'))` (point 2 validé), puis affiche l'erreur si le résultat est `false` ;
  - « Plus » : « Associations » ouvre le contenu actuel (`ProspectRelatedRecords`) dans une `ProspectDialog` ; « Changer la situation » ouvre une fenêtre avec la liste `manualStages` actuelle (mêmes transitions, même `onStage`) ; « Perdu » et « Archiver » ouvrent les fenêtres actuelles sans changement ;
  - « Enregistrer » reste le seul jaune quand un brouillon est modifié : la carte passe son bouton principal en secondaire dans ce cas (`NextStepCard` reçoit `primaryDemoted?: boolean`, qui rend `AppButton variant="secondary"` ; ajouter ce paramètre et son test dans `nextStepComponents.test.ts`).
- [ ] **Vérifier** le `z-index` du menu dans la fenêtre superposée : si le menu est masqué, corriger par `prospect-record.css` (jeton de couche, sans `!important`).
- [ ] **Lancer** `node scripts/run-tests.cjs src/renderer/crm src/renderer/ui`. Attendu : verts.

### Tâche 7 : liste Prospection (`PageHeader`, `StatusPill`) et trois vues

**Fichiers :** modifier `ProspectsPageV2.tsx:515` à `519` (en-tête et onglets de vue), `:573` à `580` (statut), `:588` à `606` (parcours commercial) ; retirer `prospect-visual-pilot.css:51` à `54` et `prospection-directory-pilot.css:42` à `44` ; lire `ui/stageStatusColors.test.ts` pour la table étape → ton.

**Interfaces :** `directoryStatus(p)` (`ProspectsPageV2.tsx:153`) fournit déjà `{ label, tone }` ; ajouter `statusTone(stage): StatusTone` dans `src/shared/prospectNextStep.ts` seulement si la table de R2 (`stageStatusColors`) n'a pas déjà cette fonction, sinon l'importer.

- [ ] **Test de câblage** : `ProspectsPageV2.tsx` rend un `PageHeader` pour Prospection ; l'onglet de vue s'appelle « Liste » et plus « Annuaire prospects » (le texte « Annuaire prospects » reste seulement dans la légende `caption` du tableau si elle sert encore, sinon retirée) ; la barre du parcours commercial ne contient plus de bouton « Annuaire prospects » ; aucun `primary-button` n'est utilisé pour « Tous », « À relancer », « En retard » ; la liste n'utilise plus `prospect-directory-status-` mais `StatusPill`.
- [ ] **Test** : les fichiers CSS cités ne contiennent plus de sélecteur `:has(.prospects-v2)` ni `:has(>.prospects-v2)` visant `.page-heading`, et leur nombre de `!important` n'a pas augmenté.
- [ ] **Implémenter** : `PageHeader` (icône `contact`, titre « Prospection », même aide `?`, action « + Prospect » ; devenu secondaire « Fermer la création » quand le formulaire est ouvert) ; pastilles via `StatusPill` avec la palette de six rôles ; filtres du parcours commercial en boutons à bascule (`aria-pressed`, classe neutre) ; « Clients acquis · N » et « Retour au parcours commercial » en liens discrets (`quiet`) ; `HistoryView` : mêmes colonnes, casse et pastille de résultat alignées sur R2.
- [ ] **Lancer** les tests de câblage et `src/renderer/ui`. Attendu : verts.

### Tâche 8 : en-tête de Clients

**Fichiers :** modifier `ClientsPage.tsx:629`, `App.tsx:430`, `client-list-quick-v2.css:5` (retirer la règle).

- [ ] **Test de câblage** : `ClientsPage.tsx` rend `PageHeader` avec le titre « Clients » ; `App.tsx` exclut `Clients` (comme `Accueil` et `Prospects`) de l'en-tête générique ; `client-list-quick-v2.css` ne masque plus `.page-heading`.
- [ ] **Implémenter** : `PageHeader` avec compteur (« N clients ») en `meta`, « + Nouveau client » en action (secondaire « Fermer » quand le formulaire est ouvert) ; la barre d'outils (actualiser, recherche, statut, colonnes) reste sous l'en-tête.
- [ ] **Lancer** `src/renderer/ui/pageHeader.test.tsx` et les tests du dossier `crm`. Attendu : verts.

### Tâche 9 : nettoyage du code et du CSS prouvés inutilisés (règle F)

**Fichiers :** `prospect-workspace-pilot.css`, `prospect-workspace-tabs.css`, `prospection-ux.css`, `prospect-visual-pilot.css`, et les sélecteurs de l'ancien bloc de synthèse (`prospect-workspace-header`, `prospect-focus-summary`, `prospect-workspace-tools`, `crm-need-footer`, `prospect-view-switch` si renommé).

- [ ] **Prouver** : pour chaque sélecteur retiré, `git grep` dans `src` et `scripts` ne trouve plus aucun usage (sauf les scripts natifs, qui sont réécrits à la tâche 10) ; lister les retraits dans le journal du lot.
- [ ] **Retirer** les règles mortes ; recalculer `fontFloorBaseline.json` avec `gen-font-baseline.cjs` (baisse seulement) ; vérifier que le plafond d'`!important` ne monte pas.
- [ ] **Lancer** `node scripts/run-tests.cjs src/renderer/ui`. Attendu : verts.

### Tâche 10 : scripts de recette

**Fichiers :** réécrire `scripts/fixtures/prospection-gallery.cjs` ; ajuster les autres fixtures `prospection-*.cjs` qui cherchent un sélecteur retiré (vérifier avec `git grep` sur chacun avant, règle de la passation : un script cassé n'est pas toujours dû au lot).

- [ ] **Réécrire** la galerie : ouvrir la fiche d'un prospect de chaque étape, vérifier la carte « Prochaine étape », ouvrir « Plus », ouvrir la fenêtre « Programmer une action », déplier Besoins, passer sur les trois vues.
- [ ] **Lancer en arrière-plan, un script à la fois, sans capture en parallèle** : `node scripts/check-ux-v2-lot01a-real-ui.cjs`, `check-ux-v2-lot01a-typography.cjs`, `check-ux-v2-lot01a-states.cjs`, `check-ux-v2-lot01b-abby-guard.cjs`. Attendu : 0 échec chacun. Les scénarios de devis (`check-unsaved-inputs-ui.cjs`, `check-contract-library-ui.cjs`) restent à R4.

### Tâche 11 : vérifications complètes, captures, recette de Carlos, commit

- [ ] **Lancer** `npm run typecheck` puis `node scripts/run-tests.cjs`. Attendu : propres, tout vert (référence avant le lot : 268 fichiers, 2 075 tests, 1 ignoré ; le total augmente, aucun test n'est retiré sans raison écrite).
- [ ] **Captures « après »** avec `C:\DEV\Livrables\Cadrage-parcours\outils-audit\audit-captures.cjs` (copie jetable, sans port de débogage, empreinte de la source contrôlée) dans `C:\DEV\Livrables\Cadrage-parcours\captures-r3\`, à côté des « avant » de `captures-audit\` : liste, fiche à quatre étapes (nouveau, à qualifier, besoin identifié, devis envoyé), Besoins avec sections, fenêtre « Programmer une action », menu « Plus » ouvert, fenêtre « Associations », trois vues, Clients, dossier clos. Recapturer après tout changement de couleur (piège de la cascade, passation § 8).
- [ ] **Montrer** à Carlos le dossier avant / après et le journal des retraits. **Ne rien commiter avant son accord.**
- [ ] **Après son accord** : mettre à jour `PROJECT_STATUS.md` (entrée « R3 EXÉCUTÉ », tâches cochées, décisions, blocages, prochaine action R4) et `docs/MANAGER_BRIDGE_ROADMAP.md` seulement si le lot touche ce chantier (il ne le touche pas) ; proposer à Carlos le texte à ajouter à `docs/refonte/DESIGN.md` (règle G) ; un seul commit local `feat(r3): fiche prospect, Prochaine étape, en-têtes de Prospection et Clients` terminé par la ligne d'attribution de la session ; mettre à jour la passation. Pas de push.

---

## Auto-relecture

- **Couverture de la fiche :** A (tâches 1 et 6), B (3), C (5), D (1 et 6), E (4), F (7), F bis (7), G (8), H (10), points 1 à 6 (1 : tâches 3 et 6 ; 2 : tâches 2, 3 et 6 ; 3 : aucun changement, vérifié par la galerie ; 4 : tâche 6 ; 5 : tâche 1 ; 6 : tâche 7).
- **Révision par rapport à la fiche :** la fiche disait « sur le composant d'onglets commun » pour les trois vues ; il n'en existe pas. Le plan garde les boutons d'onglet actuels (classe `prospect-view-switch`) et ne crée pas de nouveau composant. Même périmètre, même résultat visible.
- **Choix de mise en œuvre pris ici :** point 2 réalisé par `saveThenRun` plutôt que par un enregistrement caché dans la carte ; il réutilise les `save` du registre, avec repli sur la fenêtre existante quand un brouillon ne sait pas s'enregistrer.
- **Non vérifié avant exécution :** l'emplacement exact de `ProspectStage` et de la table `stageStatusColors` (à lire en tête de tâche 1 et 7) ; le comportement du menu « Plus » dans la fenêtre superposée (tâche 6).
