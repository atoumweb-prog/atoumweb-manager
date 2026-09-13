# AtoumWeb Manager — Suivi du projet

> Source de vérité partagée entre AtoumWeb, ChatGPT et Codex. À mettre à jour après chaque étape significative.

## État général

- **Version cible** : V1
- **Dépôt** : `atoumweb-prog/atoumweb-manager`
- **Branche stable** : `main`
- **Branche actuelle** : `foundation/electron-react-sqlite`
- **PR actuelle** : #3 — Fondation V1 (brouillon)
- **Statut** : Gate 0 automatique Windows validé ; application lancée et validée visuellement ; sauvegarde manuelle SQLite validée ; restauration réelle à retester après correction du redémarrage en mode développement.
- **Principe directeur** : une donnée métier possède une source unique ; les autres écrans la référencent sans duplication.

## Références

- `docs/CAHIER_DES_CHARGES_FONCTIONNEL_V1.md`
- `docs/ARCHITECTURE.md`
- `docs/DATA_MODEL_V1.md`
- `docs/ROADMAP_V1.md`
- `docs/DEVELOPMENT.md`
- `docs/PHASE_1_CRM.md`
- `docs/PHASE_2_COMMERCIAL.md`
- `docs/PHASE_3_PROJECTS.md`
- `docs/PHASE_4_OPERATIONS.md`
- `docs/PHASE_5_ADMIN_FINANCE.md`
- `docs/PHASE_6_REFERENTIALS_CONTINUITY.md`
- `docs/PHASE_7_ANALYTICS_RELEASE.md`
- `docs/CODEX_EXECUTION_PLAN.md`

## Phase 0 — Fondation

Implémenté sur `foundation/electron-react-sqlite` : Electron + React + TypeScript, sécurité main/preload/renderer, SQLite/migrations, workspace, sauvegarde/restauration CRM, shell/menu V1, thèmes AtoumWeb/Noir/Blanc, premiers tests et CI.

### Gate 0 automatique Windows

Validé le 13/09/2026 sur Windows :

- [x] Node/npm/Git détectés
- [x] `npm install`
- [x] `npm run typecheck`
- [x] `npm test`
- [x] test SQLite exécuté avec le runtime Node intégré à Electron
- [x] `npm run package`
- [x] packaging x64 Win32 réussi
- [x] `package-lock.json` généré localement

### Validation réelle de l’application Windows

- [x] `npm start`
- [x] démarrage visuel de l’application
- [x] navigation principale
- [x] thèmes AtoumWeb / Noir / Blanc
- [x] Réglages et workspace réel affichés
- [x] sauvegarde manuelle SQLite réelle
- [ ] restauration test avec sauvegarde `pre-restore` après correction dev-mode
- [ ] versionner/pousser `package-lock.json`
- [ ] fusion PR #3

Sauvegarde manuelle validée le 13/09/2026 dans :

`C:\Users\carlo\Documents\AtoumWeb Manager\backups\manual\atoumweb-manager-2026-09-13T10-22-49-861Z.sqlite`

### Incident restauration en mode développement

Premier test réel : la restauration a bien déclenché un relaunch Electron, mais la fenêtre redémarrée est restée vide sous `npm start`.

Cause identifiée : en développement, `app.relaunch()` sort du contexte normal Electron Forge/Vite et la nouvelle fenêtre ne retrouve pas correctement le renderer de développement.

Correction appliquée :

- en version packagée/installée, redémarrage automatique conservé ;
- en mode développement, la restauration est seulement programmée ;
- l’interface demande de fermer AtoumWeb Manager puis de relancer `npm start` manuellement ;
- au démarrage suivant, la restauration est appliquée avant l’ouverture de SQLite et une sauvegarde `pre-restore` est créée.

Le fichier local `gate0-output.txt` est ignoré par Git et ne doit pas être versionné.

## Phases V1 préparées

- **Phase 1 — Socle CRM** : issues #4–#9
- **Phase 2 — Commercial** : #10–#15
- **Phase 3 — Projets & Production** : #16–#23
- **Phase 4 — Interventions, Maintenance & Packs** : #24–#31
- **Phase 5 — Administration & Finance** : #32–#39
- **Phase 6 — Référentiels & Continuité** : #40–#47
- **Phase 7 — Statistiques & Stabilisation V1** : #48–#57

## Décisions clés consolidées

1. Prospect et Client partagent les mêmes organisations/contacts ; aucune recopie d’identité.
2. Catalogue, devis, modèles projet, documents et composants techniques sont versionnés/historisés.
3. Un devis accepté ne produit qu’un seul projet ; transformations critiques idempotentes et transactionnelles.
4. Le temps réel vient uniquement de `time_sessions` et un seul timer peut être actif.
5. Valeur commerciale, valeur contractuelle, facturé, encaissé et dépenses restent distincts.
6. Abby reste l’outil réglementaire de facturation en V1 ; AtoumWeb Manager prépare et suit.
7. Les fichiers maîtres restent sur disque et sont référencés ; fichiers lourds hors SQLite.
8. Bibliothèque projet = réel client ; Bibliothèque AtoumWeb = version générique indépendante.
9. La généralisation client → composant générique n’est jamais automatique.
10. Le code conservé dans la bibliothèque n’est jamais exécuté automatiquement.
11. Sauvegarde serveur, locale et externe sont des emplacements distincts ; serveur ≠ local.
12. Maintenance mensuelle = période d’un même service, jamais nouveau projet.
13. Dépassement de forfait non bloquant mais toujours tracé.
14. Packs d’heures calculés depuis des mouvements historisés.
15. Documents finalisés immuables ; paiements réels dérivés de `payments`.
16. Annuaire et CRM partagent organisations/contacts.
17. Statistiques et recherche sont dérivées/reconstruisibles, jamais sources de vérité.
18. Tous les exports Client excluent coûts, marge, prix conseillés et notes internes.
19. Toutes les données doivent pouvoir être exportées/restaurées sans verrouillage propriétaire.
20. Trois thèmes : AtoumWeb par défaut, Noir, Blanc.

## Ordre de développement

1. **Gate 0** : retester restauration + lockfile puis fusion PR #3 / issue #2.
2. Phase 1 : #5 → #6/#7/#8 → #9.
3. Phase 2 : #11 → #12 → #13/#14 → #15.
4. Phase 3 : #17 → #18 → #19/#20 → #21/#22 → #23.
5. Phase 4 : #25 → #26/#27 → #28/#29 → #30 → #31.
6. Phase 5 : #33 → #34/#35 → #36/#37/#38 → #39.
7. Phase 6 : #41 → #42/#43 → #44/#45/#46 → #47.
8. Phase 7 : #49 → #50/#51/#52 → #53/#54 → #55 → #56 → #57.

## Travail en cours

**Priorité immédiate : repartir proprement après l’écran vide, récupérer le correctif, relancer l’application et retester la restauration en mode développement.**

## Prochaine action concrète

1. fermer la fenêtre Electron vide ;
2. arrêter `npm start` avec `Ctrl+C` dans PowerShell ;
3. `git pull origin foundation/electron-react-sqlite` ;
4. `npm start` ;
5. vérifier que l’application s’ouvre normalement ;
6. refaire `Restaurer une sauvegarde` ;
7. en mode développement, fermer l’application lorsque le message l’indique puis relancer `npm start` ;
8. vérifier que SQLite reste opérationnel et qu’un fichier existe dans `backups/pre-restore/`.

Une fois validé, pousser `package-lock.json`, finaliser la PR #3 et passer à la Phase 1.
