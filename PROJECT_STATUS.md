# AtoumWeb Manager — Suivi du projet

> Source de vérité partagée entre AtoumWeb, ChatGPT et Codex. À mettre à jour à chaque étape significative.

## État général

- **Version cible** : V1
- **Dépôt** : `atoumweb-prog/atoumweb-manager`
- **Branche stable** : `main`
- **Branche actuelle** : `foundation/electron-react-sqlite`
- **PR actuelle** : #3 — Fondation V1 (brouillon)
- **Statut** : fondation implémentée mais validation Windows requise ; Phases 1 à 5 préparées en détail.
- **Principe directeur** : une donnée métier possède une source unique ; les autres écrans la référencent sans duplication.

## Références

- `docs/CAHIER_DES_CHARGES_FONCTIONNEL_V1.md`
- `docs/ARCHITECTURE.md`
- `docs/DATA_MODEL_V1.md`
- `docs/ROADMAP_V1.md`
- `docs/DEVELOPMENT.md`
- `docs/PHASE_1_CRM.md`
- `docs/PHASE_1_CRM_ISSUES.md`
- `docs/PHASE_2_COMMERCIAL.md`
- `docs/PHASE_3_PROJECTS.md`
- `docs/PHASE_4_OPERATIONS.md`
- `docs/PHASE_5_ADMIN_FINANCE.md`

## Phase 0 — Fondation

Réalisé : Electron/React/TypeScript, séparation sécurisée main/preload/renderer/shared, SQLite derrière `DatabaseAdapter`, migrations, workspace, sauvegarde/restauration CRM, shell V1, trois thèmes, premiers tests, CI et PR #3 brouillon.

À valider : `package-lock.json`, `npm install`, typecheck, tests, `npm start`, sauvegarde/restauration réelle, trois thèmes, packaging Windows et fusion PR #3.

**Point ouvert** : les runs GitHub Actions observés n’ont obtenu aucun runner (`runner_id=0`, `steps=[]`).

## Phase 1 — Socle CRM — préparation terminée

Référence : `docs/PHASE_1_CRM.md` — Issues #4 à #9.

Identité commune organisations/contacts, Prospect et Client sans copie, conversion idempotente, archivage réversible, recherche dérivée reconstruisible, journal centralisé.

## Phase 2 — Commercial — préparation terminée

Référence : `docs/PHASE_2_COMMERCIAL.md` — Issues #10 à #15.

Services/Offres versionnés, snapshots de devis, valeur catalogue distincte de la valeur contractuelle, devis accepté figé, conversion Prospect → Client sans doublon, handoff Projet sans projet provisoire.

## Phase 3 — Projets & Production — préparation terminée

Référence : `docs/PHASE_3_PROJECTS.md` — Issues #16 à #23.

Un devis accepté = un projet, modèle versionné, arbre Lot → Module/Page → Tâche → Checklist, ressources physiques sur disque, Bibliothèque projet fidèle au réel, timer unique et `time_sessions` source du temps.

## Phase 4 — Interventions, Maintenance & Packs d’heures — préparation terminée

Référence : `docs/PHASE_4_OPERATIONS.md` — Issues #24 à #31.

Demande distincte de l’Intervention, transformation idempotente, Maintenance par périodes et non projets mensuels, dépassement non bloquant et tracé, incidents spécialisés, packs calculés par mouvements, handoff facturation unique par source.

## Phase 5 — Administration & Finance — préparation terminée

Référence : `docs/PHASE_5_ADMIN_FINANCE.md`

Issues : #32 à #39.

Décisions clés :

- document finalisé immuable ;
- modèles/clauses versionnés et historiques ;
- PDF final stocké une seule fois via `file_assets` ;
- document visible depuis Client/Projet par référence, sans duplication ;
- contrat Partenariat/Gratuité distingue valeur commerciale, offert et futur facturable ;
- `billing_items` = ce qui doit être facturé, jamais la facture réglementaire elle-même ;
- Abby reste l’outil réglementaire de facturation en V1 ;
- prévu vs facturé comparables sans écrasement ;
- paiements partiels possibles ; encaissé calculé uniquement depuis `payments` ;
- reste dû et retard calculés ;
- dépenses ponctuelles séparées des revenus ;
- justificatifs référencés comme fichiers physiques ;
- abonnements / renouvellements / dates limites de résiliation suivis ;
- financements en plusieurs fois historisés ;
- coût total et cash réellement sorti distinguables ;
- totaux Client/Projet calculés depuis leurs sources et jamais saisis en doublon.

## Règles à ne jamais casser

1. Une donnée métier possède une source unique.
2. Prospect et Client partagent organisations/contacts ; conversion sans copie.
3. Les versions publiées du catalogue restent historiques.
4. Les devis gardent leurs snapshots et deviennent immuables une fois acceptés.
5. Un devis accepté ne crée qu’un seul projet.
6. Les modèles projet sont versionnés ; les anciens projets ne changent jamais rétroactivement.
7. Le temps réel provient uniquement des `time_sessions`.
8. Un seul timer actif dans toute l’application.
9. Valeur commerciale, montant facturé et montant encaissé sont distincts.
10. Abby reste l’outil réglementaire de facturation en V1.
11. Archivage réversible préféré à la suppression destructive.
12. Ressources projet et documents client restent distincts.
13. Les fichiers maîtres sont référencés, pas dupliqués.
14. Les fichiers lourds restent hors SQLite.
15. Bibliothèque projet = réel client ; Bibliothèque AtoumWeb = version indépendante réutilisable.
16. Le code stocké n’est jamais exécuté automatiquement.
17. Une sauvegarde serveur n’est pas une sauvegarde locale.
18. Une maintenance périodique ne crée pas un nouveau projet chaque mois.
19. Une Demande et une Intervention restent deux concepts distincts.
20. Le dépassement d’un forfait ne bloque jamais le travail et sa décision est tracée.
21. Le solde d’un pack d’heures est dérivé de mouvements historisés, jamais écrasé.
22. Un événement facturable ne peut produire qu’un seul `billing_item` par source.
23. Un document finalisé est immuable ; toute évolution passe par version/avenant/nouveau document.
24. Le montant encaissé est dérivé exclusivement des `payments`.
25. Dépenses et facturation restent des flux distincts.
26. Recherche globale et journal d’activité sont transverses.
27. Trois thèmes : AtoumWeb par défaut, Noir, Blanc.

## Travail en cours

**Validation exécutable de la fondation. La préparation fonctionnelle/technique est avancée jusqu’à la Phase 5 incluse.**

## Prochain ordre de développement

1. Valider/fusionner PR #3.
2. Phase 1 : #5 → #6/#7/#8 → #9.
3. Phase 2 : #11 → #12 → #13/#14 → #15.
4. Phase 3 : #17 → #18 → #19/#20 → #21/#22 → #23.
5. Phase 4 : #25 → #26/#27 → #28/#29 → #30 → #31.
6. Phase 5 : #33 → #34/#35 → #36/#37/#38 → #39.
7. Préparer Phase 6 : Bibliothèque AtoumWeb, Sauvegardes métier et Annuaire interne.
