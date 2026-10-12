# UX/UI V2 — Lot 01E : reprise et premier incrément non destructif

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
