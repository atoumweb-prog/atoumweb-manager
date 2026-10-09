# Lot 01E — Formulaires, brouillons, conflits et confirmations critiques

**Statut : spécification UX/UI V2, NON IMPLÉMENTÉE.** Le socle UX-01 A/B/C **existe déjà** dans la branche corrective PR #83, actuellement distincte de `main` au dernier contrôle. **Ne pas créer de deuxième registre/garde.**
**Code vérifié statiquement : `codex/fix-manager-unsaved-inputs-ux01@5b38cbe1e32e48aaf38154fb7c8e94bb36e2121f` et base `main@eb252d5cbd0e95137eafa2b4759fcbcfd7263eda`.** Bilan livré : `docs/FUNCTIONAL_UNSAVED_INPUTS_UX01_DELIVERY.md` sur branche #83. Les tests cités ci-dessous sont ceux annoncés par Codex, **pas des tests exécutés lors de la rédaction**.
**Décision de lisibilité E01 :** Compact **14 px cible**, Confort 16 px, Confort+ 18 px ; trois thèmes préservés.

## 1. Objectif et frontière
Créer des formulaires et confirmations **cohérents**, sans altérer les sauvegardes ni les règles métiers :
1. **Distinguer immédiatement** lecture, édition en cours, chargement, saisie modifiée, sauvegarde en cours, erreur, conflit et état confirmé enregistré.
2. Protéger toutes les **sorties réellement destructives** avec le mécanisme UX-01 déjà livré (une fois intégré), en respectant le **périmètre d'éditeur**.
3. Étendre progressivement aux écrans encore non raccordés (Clients, Catalogue, Projets, Opérations, Documents, etc.) **dans leurs lots métier**, pas déclarer les 17 modules protégés immédiatement.
4. Faire évoluer le dialogue vers trois intentions **uniquement lorsque le service permet un vrai enregistrement fiable** : **Enregistrer et quitter / Continuer la modification / Quitter sans enregistrer**.
5. Garder **aucun enregistrement implicite** de contenus métiers ou publication ; les préférences de vue 01C/01D sont un autre système.

## 2. Mécanismes existants vérifiés sur PR #83
| Fichier / fonction | Réalité vérifiée | Règle de réutilisation |
|---|---|---|
| `src/renderer/unsaved/unsaved.tsx` — `UnsavedGroup` | Groupe hiérarchique de formulaires, contexte `Group`. | Respecter groupes et identifiants exacts ; groupe de fiche ≠ groupe de ligne/section. |
| `useUnsavedDraft<T>` | `dirty`, `pending`, `ready`, `retainWhenHidden`, `resetKey`, `discard`, `saved`, `initial`, `request`. Empreinte de valeur et baseline ; déclaration dans `UnsavedRegistry`. | Réutiliser pour les nouveaux éditeurs, vérifier leur cycle d'initialisation, remount, réception réseau et validité de la baseline. |
| `requestUnsavedExit(run, group?)` | Demande une confirmation de sortie et exécute le callback seulement après autorisation ; pas de sauvegarde automatique. | Mettre la garde **avant** sélection destructrice, suppression, fermeture, changement de workspace ou transition qui remplace l'éditeur. |
| `src/shared/unsavedRegistry.ts` — `UnsavedRegistry` | Entrées `id/group/label/dirty/pending/discard`; requête qui refuse si pending, dialogue déjà demandé, ou réponse négative ; discard des entrées du périmètre puis exécution. | **Ne pas contourner ni dupliquer** ; l'entrée ne contient **aucun save()**. |
| `src/shared/draftSection.ts` — `DraftSection`, `mergeDraft` | Baseline locale, brouillon, fusion trois voies et liste de conflits ; égalité/empreinte ; conflits tableaux traités comme unité. | Réutiliser pour éditeurs comparables, ne pas « résoudre automatiquement » un conflit de même champ ni un changement juridique. |
| `src/main/unsaved.ts` | Dialogue Electron natif **Rester** (défaut) / **Quitter sans enregistrer** ; pendant pending, **Rester seulement**. Publie/valide états de fenêtres ; nettoie la BD à `will-quit`. | Ne pas faire d'écriture asynchrone dans une confirmation **synchrone** Electron, ni désactiver le garde natif. |
| `src/shared/unsavedWindows.ts` | États `epoch/revision/labels/pending` ; tickets d'autorisation **liés à l'état exact** et invalidés sur changement ; coordination multi-fenêtres. | Une extension async doit réévaluer l'état et éviter les fenêtres ouvertes avec brouillons ou pending apparus entre validation et sortie. |
| `src/renderer/commercial/QuotesPage.tsx`, composants contractuels | Une partie des champs/sections/lignes et conflits est raccordée à UX-01 selon la livraison. | Préserver indépendance des sections contractuelles et snapshots devis gelés ; ne pas effacer un éditeur voisin. |
| `src/renderer/crm/ProspectsPageV2.tsx` et fenêtre Référence Prospect | Sorties, groupes et sections, archivage et réduction protégés dans le périmètre livré. | Ne pas revenir sur les trois corrections de la revue finale #83. |

**Preuves publiées par Codex MSI (branche #83)** : typecheck OK, 734/734 tests complets (2 workers), 177/177 contrôles natifs (3 thèmes), migration 1–66 inchangées. La **CI GitHub `quality` n'était pas au vert**, faute de runner au contrôle. Compatibilité avec PR #81 **simulée** : 87/87 ciblés et 177/177 natifs, mais conflit `src/main/ipc.ts` à résoudre lors du merge. Ces chiffres ne sont ni une certification universelle ni une exécution V2.

## 3. Contrat d'interface partagé pour les éditeurs V2 (cible à discuter avec code réel)
Un formulaire pourrait déclarer conceptuellement :
- **Identité** : module, dossier/id, éditeur/section, révision chargée, clé de cycle de vie et groupe UX-01.
- **État** : `clean` / `dirty` / `pending` / `error` / `conflict` ; l'état `saved` est communiqué **après** retour du service.
- **Capacités** : `canValidate`, `canSave`, `canDiscard`, `canExitAfterSave` (non par défaut) ; pas de bouton « Enregistrer et quitter » si non satisfaites.
- **Actions** : enregistrer les données du seul éditeur, restaurer sa baseline, exposer erreurs et conflits, prévenir les navigations ou effets de bord via le registre.

**Noms de types proposés, pas des API existantes**. Le UI ne reconstitue pas les appels IPC : l'éditeur garde **son service métier et ses validations**. Erreur/refus de version ne doit jamais marquer le formulaire `clean`.

### 3.1 Indicateurs
- Visible et compatible lecteur d'écran : `Modifications non enregistrées`, `Enregistrement…`, `Enregistré` uniquement après confirmation, `Conflit à résoudre`.
- Indiquer à quel formulaire/onglet appartient l'état ; ne pas mettre une « pastille sauvegardée » globale si une section voisine est encore sale.
- Le texte doit faire la différence entre une **préférence de présentation enregistrée automatiquement** et un **document métier non enregistré**.

### 3.2 Annuler / Restaurer
- `Annuler` une ligne, une modal ou une section ne remet à zéro **que son brouillon**, sans affecter celui du dossier ni d'une autre clause.
- Ne pas effacer le brouillon d'une section simplement parce qu'un accordéon se replie ; conserver composant monté ou son état.
- Une sortie annulée rétablit le focus, le contexte de sélection et le formulaire avec saisie intacte.

### 3.3 Sauvegarde et conflit
- Un `save` renvoie l'**état métier validé/confirmé** et, lorsque nécessaire, une nouvelle révision/baseline ; ne pas faire d'optimisme « sauvegardé » sur un simple clic.
- Éditer durant `pending` : ne pas effacer les caractères saisis après le lancement de `save` ; appliquer le retour avec la soumission réellement envoyée comme référence si mécanisme équivalent disponible.
- Si lecture serveur tardive : ne pas remplacer un brouillon plus récent par une ancienne réponse.
- Conflit même champ ou édition concurrente : conserver proposition locale, informer sur changement distant, proposer relecture et réconciliation ; aucune fusion juridique ou commerciale silencieuse.
- Pas de publication d'offre, CGV, devis accepté ou facture via une action « Enregistrer et quitter » si elle a une signification métier plus forte.

## 4. « Enregistrer et quitter » — nouvelle capacité future, **non livrée dans #83**

### 4.1 Comportement souhaité
Si un éditeur **peut réellement sauver** :
1. L'utilisateur demande la fermeture/navigation **destructive**.
2. Le dialogue montre **Continuer la modification** (défaut), **Enregistrer et quitter** (action explicite), **Quitter sans enregistrer** (destructif explicite), avec titres/conséquences clairs.
3. En cas de « Enregistrer et quitter » : valider **le périmètre d'éditeur et les champs requis**, lancer le service, attendre son **succès effectif**, contrôler l'identité/révision et d'éventuels nouveaux brouillons, puis quitter ce périmètre seulement.
4. Si la validation échoue, si le service refuse la version, si l'écriture est interrompue ou si l'utilisateur continue à éditer : rester dans la fiche avec données et erreur/conflict visibles. **Aucune navigation** ni suppression anticipée.
5. Si plusieurs éditeurs sales sont concernés par la sortie (dossier complet / quit app), **ne pas supposer** qu'un « tout enregistrer » transactionnel existe ; masquer/désactiver l'option tant qu'un protocole déterministe de save multi-éditeurs n'est pas établi.

### 4.2 Frontière Electron et concurrence
Le dialogue actuel `confirmUnsavedExit` est **synchrone** (`dialog.showMessageBoxSync`). **On ne peut pas ajouter naïvement un `await save()` à cette fonction ou au `will-prevent-unload`**. Prévoir un protocole renderer **asynchrone et contrôlé** pour l'intention « Enregistrer et quitter », suivi d'une demande de navigation/fermeture explicitement autorisée lorsque tous les éditeurs concernés sont propres et sans `pending`.

Conditions minimales à documenter/valider par Codex avant toute implémentation :
- Prévenir les doubles prompts entre `pointerdown`, `click`, rechargement et `before-quit`.
- Une nouvelle saisie / fenêtre détachée / révision modifiée **invalide** toute autorisation de quitter précédemment obtenue.
- Les fenêtres qui ne peuvent pas sauver gardent le dialogue sûr **deux choix** ou « Rester » en `pending`.
- En cas d'annulation sur une fenêtre, ne pas fermer les autres ni déclencher le cleanup SQLite.
- N'envoyer au processus principal **aucun texte saisi ni secret**, seulement états minimaux nécessaires pour protéger l'application.

### 4.3 Exemples métier pour exclure les faux positifs
| Situation | « Enregistrer et quitter » ? | Raison |
|---|---|---|
| Modifier un champ contact valide, sauvegarde API disponible | **Possible après implémentation et tests** | Sauvegarde ordinaire, retour API vérifiable |
| Rédiger une clause CGV de brouillon | **Conditionnel** | Vérifier validité, version et permission ; ne pas publier |
| Conflit du même champ sur Devis | **Non tant que conflit non résolu** | Refus version périmée et risque contractuel |
| Finaliser / accepter Devis, publier contrat | **Jamais comme simple sauvegarde** | Transitions métier distinctes et preuves officielles |
| Plusieurs formulaires dirty lors de fermeture Electron | **À instruire** | Pas de save-all existant ; transaction/ordre à prouver |
| Sauvegarde async en cours | **Non** | `pending` ; attendre le résultat |
| Formulaire sans service de persistance réel | **Non** | Pas de fausse promesse |

## 5. Confirmations critiques (à standardiser sans remplacer le métier)
| Type d'intention | Comportement ciblé |
|---|---|
| **Abandon de brouillon** | « Continuer » par défaut, destruction limitée à la bonne section ; aucune sortie avant garde |
| **Archivage / suppression** | Vérifier droits et dépendances, confirmer avant mutation, afficher exactement les conséquences |
| **Transition commerciale** | Devis finalisé / envoyé / accepté / refusé : explications métier, contrôles préalables, jamais ambiguïté avec « Enregistrer » |
| **Publications techniques** | Bridge / WordPress, souscriptions, production : confirmation humaine et état réellement prêt ; aucun effet par un simple changement d'onglet |
| **Restaurations / workspace** | Protéger contexte, brouillons et cycle SQLite ; conserver les sécurités #81/#83 |
| **Erreur ou serveur indisponible** | Rester sur l'éditeur et conserver les champs ; jamais de notification de succès sur refus |
| **Annulation de dialog** | Sûre par défaut (Escape/fermeture), aucune mutation ni reset d'un autre brouillon |

La **refonte graphique** des confirmations natives est une autre question : l'expérience peut être rendue cohérente, mais il faut préserver les garde-fous d'Electron même si la présentation varie.

## 6. Ordre de réalisation (après autorisation, sur PR de code distincte)
| Étape | Travail | Livrable |
|---|---|---|
| 01E.1 | Vérifier état réellement fusionné de #81/#83 et résoudre avant toute convergence le conflit `src/main/ipc.ts` avec les deux protections | Provenance SHAs, code de base intégré vérifié, tests natifs |
| 01E.2 | Cartographier pour chaque pilote `composant → brouillon → groupe UX-01 → handler → IPC/service → résultat → conflit` | Matrice de fonctions vérifiable |
| 01E.3 | Harmoniser le rendu d'état/formulaire dans atelier isolé, sans service fictif silencieux | Composants UI démonstration et tests de validation |
| 01E.4 | Concevoir l'API **optionnelle** de sauvegarde contrôlée + sortie, séparée des protections natives synchrones | Protocole async, gestion des erreurs et de fenêtres |
| 01E.5 | Implémenter uniquement un **pilote volontaire non destructif**, puis extension module par module avec les lots métiers | Tests de séparation des brouillons, refus, navigation |
| 01E.6 | Recette complète, matrice des vrais parcours modifiés, captures trois thèmes × trois densités, retour arrière | Bilan daté et validé humainement |

**Important :** si #83 et #81 restent en draft, 01E reste spécifié mais **le développement est en attente de la stabilisation de ces dépendances**.

## 7. Scénarios de recette
| ID | Exercice | Résultat attendu |
|---|---|---|
| R01E-01 | Afficher éditeur clean / dirty / pending / error / conflict | État exact, libellé lisible dans 3 thèmes × 3 densités |
| R01E-02 | Changer de fiche avec brouillon sale | Garde avant sortie ; « Continuer » conserve champ et sélection |
| R01E-03 | Annuler un sous-éditeur avec un autre sale | Seule la sous-section concernée revient à sa baseline |
| R01E-04 | Enregistrer A pendant modification B | B reste sale et intact ; A seulement devient propre après réussite |
| R01E-05 | Actualiser une donnée serveur avec saisie locale | Fusion prudente, conflit affiché, aucun écrasement silencieux |
| R01E-06 | Retour d'un ancien `save` alors que saisie continue | Caractères récents conservés |
| R01E-07 | Réduire/replier une section Prospect avec brouillon | Brouillon conservé, correctif #83 non régressé |
| R01E-08 | Archiver Prospect / supprimer ligne Devis avec brouillon | Confirmation AVANT mutation ; refus conserve l'état, correctif #83 |
| R01E-09 | Enregistrer et quitter avec service valide | Valide + attend succès + quitte seulement si état désormais propre (cible future) |
| R01E-10 | Enregistrer et quitter avec erreur / conflit | Reste dans éditeur, erreur et saisies intactes, pas de faux succès |
| R01E-11 | Tenter save-and-exit sur formulaire non compatible | Option absente ou clairement désactivée ; pas de pseudo-sauvegarde |
| R01E-12 | Pending et tentative de sortie | Garde refuse de quitter, aucun nettoyage BD |
| R01E-13 | Quitter Electron avec 2 fenêtres/plusieurs brouillons | Agrégation et autorisation de sortie sensibles aux révisions ; annulation garde les fenêtres |
| R01E-14 | Changer workspace au milieu d'un formulaire sale | Confirmation et contexte inchangé si annulation |
| R01E-15 | Cliquer dehors / Escape / recharger | Aucun contournement des protections UX-01 raccordées |
| R01E-16 | Finalisation / acceptation / publication distincte de sauvegarde | Les règles métiers, preuves et snapshots restent inchangés |
| R01E-17 | Bascule thème/densité et retour sur fiche | Aucun changement de valeur ou de révision métier |
| R01E-18 | Simulation de fermeture forcée/crash | **Limite reconnue** : aucune récupération automatique présumée, pas de faux scénario réussi |
| R01E-19 | Conflit #81/#83 résolu dans vrai code intégré | Typecheck, tests ciblés restauration/fenêtres, suite complète, natifs réels |
| R01E-20 | Tests sous erreurs de réseau/IPC/save et double clic | Aucun discard/déplacement anticipé ; message corrélé à vraie action |

La validation dépend des **résultats exécutés** (date, SHA, commande, environnement, fixtures), pas des seules intentions.

## 8. Questions techniques ouvertes et non-arbitrages
- **E17 — Extension save-and-exit** : proposer le protocole asynchronous renderer/main qui respecte `UnsavedWindows`, avec un seul mécanisme de garde.
- **E18 — Capacités par éditeur** : quels formulaires peuvent enregistrer sans publier ni changer de statut ? Identifier les handlers réels, y compris multi-sections.
- **E19 — Présentation du dialogue** : native ou unifiée web selon le déclencheur, sans affaiblir Electron ; exigence de comportement avant le choix de composant.
- **E20 — Sauvegardes concurrentes** : version/empreinte, baselines de réponse, rollback local, ordre si plusieurs éditeurs ; validation du service.
- **E21 — Couverture de modules** : inventaire des éditeurs non encore raccordés et ordre d'adoption dans leurs lots métier.
- **E22 — Récupération crash** : hors UX-01 et 01E tant qu'aucune politique séparée de persistance temporaire sécurisée n'est décidée.

## 9. Définition de « terminé »
- Le **mécanisme unique** UX-01 est réutilisé, et l'intégration avec #81 conserve ses fonctionnalités de restauration.
- Les statuts de formulaires sont exacts et chaque action garde son service/permission.
- La sortie avec sauvegarde est disponible **seulement** quand elle est sûre et testée ; sinon garder le dialogue actuel à deux choix.
- Tests ciblés et suite complète sur fixtures isolées, contrôles natifs, trois thèmes et trois densités, validation humaine ; CI verte effectivement constatée si exigée avant fusion.
- **Aucune** modification de document contractuel accepté, ni de session temps, projet, pack, facture, ni de Validation-MSI en dehors des actions explicitement demandées.
- PR de code indépendante de la PR documentaire, pas de merge automatique.

**Ce texte formalise la cible V2 ; ni les trois choix « Enregistrer et quitter », ni une garde universelle des 17 modules ne sont encore livrés par ce document.**
