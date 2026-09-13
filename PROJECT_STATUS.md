# AtoumWeb Manager — Suivi du projet

> Source de vérité partagée entre AtoumWeb, ChatGPT et Codex. À mettre à jour à chaque étape significative.

## État général

- **Version cible** : V1
- **Dépôt** : `atoumweb-prog/atoumweb-manager`
- **Branche stable** : `main`
- **Branche actuelle** : `foundation/electron-react-sqlite`
- **PR actuelle** : #3 — Fondation V1 (brouillon)
- **Statut** : fondation implémentée mais validation Windows requise ; Phases 1, 2, 3 et 4 préparées en détail.
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

## Phase 0 — Fondation

### Réalisé

- [x] Electron + React + TypeScript
- [x] séparation sécurisée `main / preload / renderer / shared`
- [x] SQLite via `node:sqlite` derrière `DatabaseAdapter`
- [x] migrations SQLite
- [x] workspace configurable
- [x] sauvegarde quotidienne / manuelle / pré-migration
- [x] restauration sécurisée avec sauvegarde `pre-restore`
- [x] shell V1 et menu dans l’ordre validé
- [x] thèmes AtoumWeb / Noir / Blanc
- [x] Réglages minimum
- [x] premiers tests et workflow CI
- [x] PR #3 ouverte en brouillon

### À valider

- [ ] générer/versionner `package-lock.json`
- [ ] `npm install`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm start`
- [ ] sauvegarde/restauration réelle
- [ ] trois thèmes
- [ ] `npm run package`
- [ ] fusion PR #3

**Point ouvert** : les runs GitHub Actions observés n’ont obtenu aucun runner (`runner_id=0`, `steps=[]`). Ils n’ont donc exécuté aucune commande du projet.

## Phase 1 — Socle CRM — préparation terminée

Référence : `docs/PHASE_1_CRM.md`

Issues : #4 à #9.

Décisions clés :

- organisations/contacts = identité commune ;
- Prospect et Client ne recopient jamais les coordonnées ;
- conversion Prospect → Client transactionnelle et idempotente ;
- statuts Client : Actif / Inactif / Archivé ;
- archivage réversible ;
- recherche globale basée sur un index dérivé reconstruisible ;
- journal d’activité centralisé.

## Phase 2 — Commercial — préparation terminée

Référence : `docs/PHASE_2_COMMERCIAL.md`

Issues : #10 à #15.

Décisions clés :

- Service = prestation atomique ; Offre = composition de services ;
- modifier un élément publié crée une nouvelle version ;
- devis indépendant du catalogue futur grâce aux snapshots ;
- valeur catalogue, remise et valeur contractuelle distinctes ;
- devis accepté figé ;
- acceptation Prospect → Client sans doublon ;
- Phase 2 ne crée pas de projet provisoire ; elle marque le devis prêt pour Phase 3.

## Phase 3 — Projets & Production — préparation terminée

Référence : `docs/PHASE_3_PROJECTS.md`

Issues : #16 à #23.

Décisions clés :

- un devis accepté ne peut produire qu’un seul projet ;
- transformation Devis → Projet transactionnelle et idempotente ;
- modèle projet versionné et figé au moment de la création ;
- arbre `Lot → Module/Page → Tâche → Checklist` ;
- progression calculée depuis les tâches obligatoires ;
- temps réel issu uniquement de `time_sessions` ;
- arborescence Ressources physique créée automatiquement sur disque ;
- SQLite référence les fichiers sans les dupliquer ;
- Bibliothèque projet = réel technique utilisé chez le client ;
- aucune généralisation automatique vers Bibliothèque AtoumWeb ;
- timer unique global raccordé au contexte Client / Projet / Module / Tâche ;
- pause/reprise persistées ;
- Cazor Auto Passion sert de cas de validation de référence.

## Phase 4 — Interventions, Maintenance & Packs d’heures — préparation terminée

Référence : `docs/PHASE_4_OPERATIONS.md`

Issues :

- #24 parent — Interventions, Maintenance & Packs d’heures
- #25 Demandes / Interventions : données et services métier
- #26 UI Demandes / Interventions + Timer
- #27 Maintenance : plans / souscriptions / périodes / checklists
- #28 Dépassements de maintenance et incidents
- #29 Packs d’heures / mouvements / alertes
- #30 Handoff facturation / dashboard / rapports
- #31 Validation complète Phase 4

Décisions clés :

- une Demande n’est pas encore une Intervention ;
- transformation Demande → Intervention transactionnelle et idempotente ;
- types d’intervention : Correction / Modification / Ajout / Maintenance / Incident / Support / Formation / Autre ;
- modes de prise en charge : maintenance / pack / hors forfait / geste commercial / inclus projet / interne AtoumWeb ;
- valeur théorique, montant facturable et temps réel restent distincts ;
- le temps réel vient uniquement de `time_sessions` ;
- les offres Maintenance 49 €/mois = 2 interventions et 99 €/mois = 4 interventions sont des références initiales modifiables, jamais des règles codées en dur ;
- une souscription garde ses conditions historiques indépendamment du catalogue futur ;
- une période mensuelle de maintenance ne crée jamais un nouveau projet ;
- chaque période conserve un snapshot de sa checklist ;
- un dépassement ne bloque jamais le travail : facturation, geste, inclusion exceptionnelle, report autorisé ou autre décision ;
- toute décision de dépassement est journalisée ;
- Incident = Intervention spécialisée avec criticité, cause, diagnostic, résolution, indisponibilité et sauvegarde éventuelle liée ;
- un pack d’heures est un crédit calculé depuis `hour_pack_movements`, jamais un simple champ “heures restantes” ;
- un débit de pack est idempotent et lié à l’Intervention / aux sessions de temps ;
- corriger un temps déjà débité produit un mouvement correctif explicite ;
- pack insuffisant ne bloque pas le travail : complément facturé / négatif exceptionnel / autre pack / geste commercial ;
- les opérations facturables préparent des `billing_items` uniques par source ; Abby reste l’outil réglementaire de facturation ;
- Dashboard opérationnel : demandes à traiter, interventions en cours, maintenances à faire, packs faibles, incidents critiques, travaux à facturer ;
- structure de rapport maintenance prévue avec séparation stricte des notes internes.

## Avancement par module

| Module | Conception | Développement | Statut |
|---|---|---|---|
| Accueil / Dashboard | ✅ | 🟡 | Socle présent ; enrichissement Phase 4 #30 |
| Recherche globale | ✅ | 🟡 | Phase 1 #8, extension phases suivantes |
| Prospects | ✅ | ⬜ | Phase 1 #6 |
| Clients | ✅ | ⬜ | Phase 1 #7 |
| Offres & Tarifs | ✅ | ⬜ | Phase 2 #11 |
| Devis | ✅ | ⬜ | Phase 2 #12–#15 |
| Projets | ✅ | ⬜ | Phase 3 #17–#19 |
| Fichiers & Ressources | ✅ | ⬜ | Phase 3 #20 |
| Bibliothèque projet | ✅ | ⬜ | Phase 3 #21 |
| Timer global | ✅ | 🟡 shell | Phase 3 #22 puis Phase 4 #26 |
| Gestion des temps | ✅ | ⬜ | Première version Phase 3 #22 |
| Demandes / Interventions | ✅ | ⬜ | Phase 4 #25–#26 |
| Maintenance | ✅ | ⬜ | Phase 4 #27–#28 |
| Packs d’heures | ✅ | ⬜ | Phase 4 #29 |
| Facturation / Abby | ✅ | ⬜ | Handoff Phase 4 #30, gestion complète à venir |
| Dépenses | ✅ | ⬜ | À venir |
| Documents & Contrats | ✅ | ⬜ | PDF devis amorcé Phase 2 ; rapports préparés Phase 4 |
| Bibliothèque AtoumWeb | ✅ | ⬜ | À venir après Bibliothèque projet |
| Sauvegardes | ✅ | 🟡 | Base CRM implémentée ; sauvegardes métier utilisées en incidents |
| Annuaire | ✅ | ⬜ | À venir |
| Statistiques | ✅ | ⬜ | À venir |
| Journal d’activité | ✅ | 🟡 | Normalisation Phase 1, enrichi jusqu’à Phase 4 |
| Réglages | ✅ | 🟡 | Socle présent |
| Thèmes | ✅ | ✅ socle | Validation réelle requise |

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
23. Recherche globale et journal d’activité sont transverses.
24. Trois thèmes : AtoumWeb par défaut, Noir, Blanc.

## Architecture technique

- Electron 44.x
- React 19.3
- TypeScript 5.9 strict
- Electron Forge 7.11.2 + Vite 5.4.19
- SQLite locale via `node:sqlite`
- SQL + migrations versionnées
- IPC typé et renderer isolé
- workspace local configurable
- Monaco Editor prévu pour le code
- PDF via HTML + `webContents.printToPDF()`

## Parcours métier cible

`Prospect → Devis → Client → Projet → Production → Livraison → Facturation → Maintenance → Statistiques`

## Travail en cours

**Validation exécutable de la fondation. La préparation fonctionnelle/technique est déjà avancée jusqu’à la Phase 4 incluse.**

## Prochain ordre de développement

1. Valider et fusionner la fondation PR #3.
2. Phase 1 : #5 → #6/#7/#8 → #9.
3. Phase 2 : #11 → #12 → #13/#14 → #15.
4. Phase 3 : #17 → #18 → #19/#20 → #21/#22 → #23.
5. Phase 4 : #25 → #26/#27 → #28/#29 → #30 → #31.
6. Préparer la phase suivante : Documents & Contrats, Facturation Abby, Dépenses et administration financière.
