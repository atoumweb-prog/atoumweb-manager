# AtoumWeb Manager — Suivi du projet

> Source de vérité partagée entre AtoumWeb, ChatGPT et Codex. À mettre à jour après chaque étape significative.

## État général

- **Version cible** : V1
- **Dépôt** : `atoumweb-prog/atoumweb-manager`
- **Branche stable** : `main`
- **Branche actuelle** : `foundation/electron-react-sqlite`
- **PR actuelle** : #3 — Fondation V1 (brouillon)
- **Statut** : architecture et feuille de route V1 complètes ; Gate 0 automatique Windows validé ; validation visuelle de l’application encore requise.
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

### Reste à valider avant fusion PR #3

- [ ] versionner/pousser `package-lock.json`
- [ ] `npm start`
- [ ] vérifier visuellement le démarrage de l’application
- [ ] vérifier navigation principale
- [ ] vérifier thèmes AtoumWeb / Noir / Blanc
- [ ] vérifier Réglages et workspace réel
- [ ] vérifier sauvegarde manuelle réelle
- [ ] vérifier restauration test avec sauvegarde `pre-restore`
- [ ] fusion PR #3

Le fichier local `gate0-output.txt` est maintenant ignoré par Git et ne doit pas être versionné.

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

1. **Gate 0** : validation visuelle puis fusion PR #3 / issue #2.
2. Phase 1 : #5 → #6/#7/#8 → #9.
3. Phase 2 : #11 → #12 → #13/#14 → #15.
4. Phase 3 : #17 → #18 → #19/#20 → #21/#22 → #23.
5. Phase 4 : #25 → #26/#27 → #28/#29 → #30 → #31.
6. Phase 5 : #33 → #34/#35 → #36/#37/#38 → #39.
7. Phase 6 : #41 → #42/#43 → #44/#45/#46 → #47.
8. Phase 7 : #49 → #50/#51/#52 → #53/#54 → #55 → #56 → #57.

## Travail en cours

**Priorité immédiate : lancer `npm start` et valider l’application visuellement sur Windows.**

## Prochaine action concrète

```powershell
npm start
```

Puis vérifier l’ouverture d’AtoumWeb Manager, la navigation, les trois thèmes, les Réglages, le workspace et les sauvegardes/restaurations de test. Une fois validé, pousser `package-lock.json`, finaliser la PR #3 et passer à la Phase 1.
