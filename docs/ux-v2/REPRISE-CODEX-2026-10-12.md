# Reprise de Codex — UX/UI V2 AtoumWeb Manager — 12 octobre 2026

**Document de passage de relais, sans autorisation de fusion ou de modification de données.** Lire en premier le référentiel de la PR #82 puis inspecter les branches réellement disponibles ; l'ancienne sortie de la session Codex n'a pas été jointe à ce pointage, ne pas imaginer son dernier commit.

## Statut GitHub confirmé au 12/10/2026

| PR | Objet / branche | État vérifié | Règle de reprise |
|---|---|---|---|
| **#81** | Intégrité SQLite / restauration et arrêt | **Fusionnée dans main** | Ne pas recommencer cette intégration ni tenter une seconde PR de restauration |
| **#83** | UX-01 protections de saisie et cycle Electron | **Fermée sans fusion le 10/10/2026** (`state=closed`, `merged=false`), toujours marquée draft dans ses métadonnées historiques | Ne pas rouvrir, fusionner, ni confondre la PR fermée avec la branche UX-01 indépendante ; examiner le code et ses preuves de tests dans la branche de travail actuelle avant toute intégration |
| **#82** | Référentiel UX/UI V2, `docs/ux-v2-reference-v1` | **Draft vers main** | Source de conception, notamment `LOT-01B-COMPOSANTS-ELEMENTAIRES.md` ; la spécification comporte un addendum d'état 12/10 |
| **#86** | 01A typographie/tokens, `feature/ux-v2-lot01a-typography-v1` | **Draft vers main** | Dépendance logicielle directe de 01B |
| **#87** | 01B composants pilotes, `feature/ux-v2-lot01b-components-v1` | **Draft sur la branche #86** | Branche de travail cible du correctif Abby ; ne pas rebaser/fusionner sans demande |

**La V2 complète de l'interface n'est PAS réalisée** : 01A change le socle visuel, 01B ajoute des pilotes de composants et modifie l'aide, mais pas les fiches des 17 modules en V2. N'ouvrir **01C** (fiches/panneaux) qu'après arbitrage explicite de l'étape suivante.

## Dernière réponse de Codex avant interruption : clôture de la PR #81

Le dernier compte rendu Codex transmis par AtoumWeb porte **uniquement sur #81**, et confirme :
- fusion **par merge commit normal**, sans squash/rebase ; commit GitHub **`68bfd952e394169ade65e3f0697422d8c00c2cc7`** (les métadonnées GitHub confirment `#81 merged=true` et ce SHA de merge) ;
- **CI post-fusion #652** : [run #37999319663](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/37999319663), **conclusion `success`** sur exactement le merge `68bfd95` ; selon le rapport Codex fourni, **750/750 tests, dont 35/35 restaurations, typecheck OK, zéro erreur RPC**, job **6 min 37 s** ;
- la vérification pré-fusion mentionnait la **CI #651 verte**, code identique au HEAD validé ; working tree propre, #82/#83 et Validation-MSI non modifiés à cette étape. Ces détails de console pré-fusion viennent du rapport Codex transmis, pas d'une nouvelle campagne au 12/10.

**Chronologie importante :** `68bfd95` était le HEAD de `main` **immédiatement après la fusion #81**. Ce n'est plus son HEAD actuel : dernier pointage via GitHub au **12/10/2026 : `main@07dde9c85dab337ee0ed3a5a92034a139d7ebad2`**. Ne pas revenir à `68bfd95`, ni faire d'update forcée. Le groupe `801/801` obtenu plus tard sur la branche UX V2 est un **autre périmètre et un autre SHA** que le `750/750` du post-merge #81.

**Nouvelle information GitHub vérifiée au 12/10** : **#83 a été fermée sans fusion le 10/10/2026**, malgré l'indicateur `draft=true` encore renvoyé pour ses métadonnées. Il peut exister des tests et branches UX-01 associés, mais **la PR #83 n'est plus une PR ouverte en attente de merge**. Ne pas la rouvrir ni déduire que les protections sont absentes sur la branche active.

## Preuves locales Windows disponibles avant le dernier correctif Abby

| Vérification réelle | Résultat communiqué | SHA |
|---|---|---|
| Aide contextuelle `FieldHelp` | **37/37**, 9 thèmes×densités, typecheck OK | `2ef6e74` |
| Boutons/champs `AppButton/AppTextField` | **32/32**, gestion double action et rejet | `36ef9e8` |
| Icônes `OperationIcon` | **42/42**, 36 symboles, Enter Electron sur bouton HTML et React | `18040b2` |
| Notifications `AppNotice` | **30/30**, quatre niveaux, typecheck | `4da508d` |
| Atelier intégré React/Electron | **51/51**, 9/9 captures PNG vérifiées, typecheck | `d80409a` |
| Interface historique complète | **300/300**, 17 destinations, 86 visites, aucun message console/overflow candidat | `36ef9e8` |
| Suite Vitest et typage | **87/87 fichiers, 801/801 tests**, typecheck OK | `36ef9e8` |

Les **801 tests Vitest** ne doivent pas être confondus avec les **1 069 scénarios du référentiel documentaire**. L'atelier et les CSS sont déjà documentés dans `docs/UXV2_LOT01B_EXECUTION.md`, `docs/UXV2_LOT01B_VISUAL_REVIEW.md`, `docs/UXV2_LOT01B_GATES.md` sur #87.

## Décision utilisateur confirmée : « Copier le bloc commercial pour Abby »

**R01B-10, 12/10/2026 : si le devis courant présente des modifications non enregistrées ou un enregistrement pending, INTERDIRE la copie pour Abby.** Un autre devis en édition ne doit pas bloquer. Réutiliser `UnsavedRegistry` et les groupes `quote:<id>`; le bouton explique son indisponibilité ; revalidation au moment du clic ; après sauvegarde/abandon accepté, copie à nouveau autorisée ; aucune fausse annonce de succès.

**Du code existe déjà dans #87.** Sur l'état du 12/10 :
- `src/renderer/commercial/QuoteAbbyPanel.tsx` a été modifié (commit `a36529b9`), abonné via `useSyncExternalStore` à `unsavedRegistry.active('quote:'+quote.id)`, avec désactivation du bouton et seconde vérification au clic.
- `scripts/check-ux-v2-lot01b-abby-guard.cjs` a été ajouté (commit `579ca472`) : vraie UI React/Electron en fixture TEMP, vrais hooks brouillon, copie mockée, cas `dirty/pending`, autre devis, course de rendu et rejet du faux presse-papiers.
- `docs/UXV2_LOT01B_GATES.md` répercute la validation de la règle et indique **test Windows/typecheck non encore exécutés**.

**Ne pas coder une deuxième solution.** D'abord auditer l'implémentation existante, exécuter les tests isolés et réparer uniquement les défauts démontrés, dans #87. Aucun nouveau module de contrat, aucun envoi automatique à Abby, aucune altération du devis ni du texte CGV.

## Plan de travail recommandé à Codex (exécution contrôlée)

1. **Inventaire initial sans mutations :** `git status`, `git branch --show-current`, `git log -1 --oneline`, `git diff`, HEAD des PR #82/#83/#86/#87. Ne pas écraser de travail local, rester dans le dépôt/branche appropriés et éviter le main.
2. **Code Abby R01B-10 :** vérifier tous les sous-formulaires du devis pour la couverture réelle `dirty/pending` et le groupe exact `quote:<id>`. Confirmer que les champs en cours ne peuvent pas contourner le blocage ; pas de suppression de brouillon via la copie. Auditer `QuoteAbbyPanel.tsx`, le test et le cycle `useSyncExternalStore`, corriger toute régression démontrable.
3. **Tests ciblés sur profil isolé**, d'abord `node --check scripts/check-ux-v2-lot01b-abby-guard.cjs`, puis `node scripts/check-ux-v2-lot01b-abby-guard.cjs`, `npm run typecheck`. Ne pas réutiliser la base SQLite réelle. Noter SHA exact, nombre de checks, `Fixture cleaned`, messages d'erreur.
4. **Non-régression :** `node scripts/check-ux-v2-lot01b-controls.cjs`, `node scripts/check-ux-v2-lot01a-real-ui.cjs` (17 écrans, SQLite TEMP), `npm test -- --maxWorkers=2`. Ne pas attribuer automatiquement les anciens 801/801 au HEAD révisé ; publier le total réellement observé.
5. **Gates restants** : prendre `docs/UXV2_LOT01B_GATES.md` comme tableau d'état ; vérifier prioritairement **R01B-09** (annuler sans mutation), compléter Tab/Espace et aides longues/zoom (R01B-02/05/11), rejet service et conservation de saisie (R01B-08). Réutiliser la protection UX-01 déjà présente ; ne pas reconstruire une architecture de confirmations ni changer les transitions métier. Si le scénario nécessite des données véritables, préparer une fixture TEMP ou le signaler comme non certifié.
6. **Documentation et livraison :** consigner le vrai résultat avec date/SHA/logs ; mettre à jour la matrice R01B et ajouter un commentaire synthétique à la PR #87. Proposer la suite **01C** et les dépendances **uniquement en plan**, aucune implémentation automatique.

## Limites et consentements

Aucun `git merge`, aucune modification de `main`, aucune mise en public du dépôt, aucune nouvelle dépense GitHub Actions, aucune migration sur base réelle, aucune écriture sur données client/contrats/CGV, aucun déploiement WordPress/Bridge, aucune fusion de #82/#83/#86/#87 sans accord. Les commits nécessaires sur la branche **01B dédiée**, et les documents sur la branche **#82**, sont permis seulement lorsqu'ils s'inscrivent dans le périmètre de la reprise et sont décrits avec leur SHA.

**Attendu de Codex :** rapport concis « HEAD / modifications exactes / tests PASS et FAIL / preuves / risques / gates restant ouverts / état de la PR », plus consignes Windows copiables si Codex n'a pas de fenêtre Electron Windows. Un blocage ne doit jamais être déclaré `PASS` sans preuve.
