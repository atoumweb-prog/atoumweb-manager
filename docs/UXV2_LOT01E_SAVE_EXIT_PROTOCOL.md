# UX/UI V2 — 01E.4 : protocole proposé pour « Enregistrer et quitter »

**12/10/2026 — document de conception, pas de code de sauvegarde.** Source normative : `docs/ux-v2/LOT-01E-FORMULAIRES-CONFIRMATIONS.md` (PR #82). Source de vérité du fonctionnement actuellement disponible : `UnsavedGroup/useUnsavedDraft`, `UnsavedRegistry`, `UnsavedWindows` et `src/main/unsaved.ts` sur la branche PR #90.

## 1. Pourquoi ce n'est pas un bouton supplémentaire dans le dialogue Electron actuel

Le dialogue `confirmUnsavedExit` côté Main utilise `dialog.showMessageBoxSync` et ne contient que :
- **Rester** (action sûre par défaut) / **Quitter sans enregistrer** si une modification non sauvée existe ;
- **Rester seulement** lorsqu'un enregistrement est en cours.

`UnsavedRegistry` stocke `dirty`, `pending`, `discard` et le groupe ; **aucune fonction `save()`** n'existe dans une entrée. Une sauvegarde asynchrone ne peut donc pas être appelée de façon fiable dans ce dialogue synchrone. Ajouter un troisième bouton natif sans protocole serait dangereux et trompeur.

## 2. API conceptuelle **optionnelle** par éditeur

Les noms suivants sont **conceptuels** et ne désignent pas des exports existants :

| Élément | Fonction |
| --- | --- |
| `editorKey` | Identité stable : module + dossier + section de saisie ; jamais l'index visuel d'une ligne |
| `workspaceKey` | Empêcher de terminer une sauvegarde sur un autre workspace |
| `submittedRevision` / `submittedFingerprint` | Identifier les données réellement soumises, pas celles saisies plus tard |
| `canSaveWithoutTransition` | Vrai seulement si la sauvegarde ordinaire ne valide/publie/convertit rien |
| `validateLocal()` | Valider les champs de **ce** sous-éditeur avant requête |
| `saveSnapshot(snapshot, revision)` | Utiliser **le service métier existant**, avec gestion de version et permissions |
| `onSaveSuccess(serverValue, revision)` | Mettre à jour seulement la baseline confirmée ; ne pas effacer des modifications plus récentes |
| `onSaveFailure(error)` | Conserver brouillon + conflit + erreurs, rester sur l'éditeur |

L'option ne doit **pas** être affichée si l'éditeur ne dispose pas de ces capacités vérifiées. La seule présence d'un bouton « Enregistrer » ne suffit pas (devis accepté, publication de contrats, version de catalogue, publication WP et autres transitions sont des actions métiers différentes).

## 3. Séquence envisagée pour **un seul éditeur compatible**

1. L'utilisateur demande une sortie depuis une commande contrôlée côté renderer (pas depuis le `will-quit` synchrone).
2. La commande identifie la fiche/section et vérifie `canSaveWithoutTransition`, permission, absence de `pending`, de conflit et d'autres éditeurs non pris en charge dans le périmètre de sortie.
3. Si l'utilisateur choisit explicitement **Enregistrer et quitter**, figer le snapshot et la révision soumis. Les garder dans l'état de l'éditeur, **pas** dans les préférences d'affichage.
4. Enregistrer via le vrai service de cet éditeur. Pendant cette opération, `pending` reste déclaré à UX-01 ; tout quit natif reste bloqué.
5. En cas d'erreur, timeout, rejet de version, conflit ou annulation : ne pas naviguer, ne pas `discard`, ne pas notifier « enregistré ».
6. En cas de réponse positive, comparer l'identité du dossier, la révision et le brouillon actuel à la soumission. Si la saisie a continué pendant la requête, conserver les caractères supplémentaires, laisser `dirty` vrai et **ne pas quitter**.
7. Vérifier de nouveau que la sortie ne détruira aucune autre saisie : état UX-01 effectif, `pending=false`, identité et workspace encore identiques. Si une autre fenêtre ou un autre éditeur a changé, ne pas réutiliser une autorisation périmée.
8. Effectuer la navigation seulement sur un périmètre devenu réellement propre ; pour un quit de l'application, laisser les mécanismes natifs `UnsavedWindows` / `before-quit` revérifier tous les états.
9. Un double clic ou une seconde demande ne doit pas provoquer un deuxième `save` ni deux changements de dossier.

Cette séquence n'autorise ni sauvegarde implicite ni traitement universel multi-éditeurs.

## 4. Cas qui doivent rester bloqués / montrer seulement les deux choix sûrs

- Plusieurs brouillons indépendants sur des sections ayant des services différents ;
- ligne Devis/option/CGV déjà finalisée, verrouillée ou à révision conflictuelle ;
- sauvegarde en cours ; modification apparue après le snapshot soumis ;
- manque de permission ou service indisponible ;
- fenêtre secondaire dont l'état courant a divergé du ticket `UnsavedWindows` ;
- fermeture OS/quit natif qui n'est pas précédé d'une commande renderer capable de gérer l'async ;
- restauration SQLite ou changement de workspace en cours.

**Ne jamais émettre `saved=true` simplement à l'appui du bouton.**

## 5. Matrice de tests à écrire avant d'activer l'option

| Scénario | Résultat attendu |
| --- | --- |
| Save réussi d'A, brouillon B dirty | A propre après réponse serveur ; B intact, aucune sortie destructrice commune |
| Save A rejeté/version périmée | A reste ouvert, sale, erreur/conflit visible |
| Nouvelle saisie dans A pendant son save | Ancien retour ne perd aucun caractère, sortie refusée |
| Double clic Enregistrer et quitter | Un seul appel service, une seule éventuelle navigation |
| Refus de confirmation / Escape | Zéro mutation et focus restauré |
| Pending puis quit Electron | Garde native `Rester` uniquement, aucune fermeture DB |
| Deux fenêtres et ticket invalidé | Pas de quit avec état changé, nouvelle vérification requise |
| Service sans capability `saveWithoutTransition` | Option absente, aucun comportement d'enregistrement inventé |
| Devis finalisé / publication/CGV | Aucun déclenchement de transition commerciale ni publication |
| Erreur IPC entre save et navigation | Brouillons/éditeur gardés, aucun faux message succès global |

Tester sur deux éditeurs indépendants, puis une vraie section métier choisie et sécurisée lors de son lot ; utiliser des fixtures TEMP, comparer la base et les snapshots avant/après. Compléter les tests UX-01 déjà présents plutôt que les remplacer.

## 6. Arbitrages restant nécessaires **avant le code**

1. Quel éditeur métier dispose réellement d'une **sauvegarde ordinaire** non destructrice avec gestion de version fiable ?
2. Quelle API expose une capability explicite et l'empreinte / révision soumise ? La conception ne doit pas simplement greffer un `save` dans `UnsavedRegistry`.
3. Le dialogue de choix renderer est-il activé seulement pour une sortie contrôlée depuis une fiche, tandis qu'Electron conserve son dialogue natif pour l'arrêt OS/app ?
4. Comment gérer un périmètre multi-sections si une seule section n'a pas de service de sauvegarde ?

**Décision actuelle :** ce protocole est un **cadrage technique**, pas une fonctionnalité livrée. Aucune écriture sur `src/main/unsaved.ts`, `UnsavedWindows`, IPC, contrats ou vraie fiche. Ne pas déclarer R01E-09/10 comme PASS avant une implémentation complète testée et autorisée.
