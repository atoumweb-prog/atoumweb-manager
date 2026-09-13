# AtoumWeb Manager — Suivi du projet

> Source de vérité partagée entre AtoumWeb, ChatGPT et Codex. À mettre à jour à chaque étape significative.

## État général

- **Version cible** : V1
- **Dépôt** : `atoumweb-prog/atoumweb-manager`
- **Branche stable** : `main`
- **Branche actuelle** : `foundation/electron-react-sqlite`
- **PR actuelle** : #3 — Fondation V1 (brouillon)
- **Statut** : fondation implémentée mais validation Windows requise ; Phases 1, 2 et 3 préparées en détail.
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

Issues :

- #4 parent — Socle CRM
- #5 Migration CRM / repositories / journal
- #6 Prospects / Kanban / prochaines actions
- #7 Clients / conversion Prospect → Client
- #8 Recherche globale réelle
- #9 Validation Phase 1

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

Issues :

- #10 parent — Commercial
- #11 Catalogue Services / Offres versionné
- #12 Moteur de devis / snapshots / calculs
- #13 Devis guidé / prévisualisation / PDF
- #14 Acceptation / conversion client / handoff Projet
- #15 Validation Phase 2

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

Issues :

- #16 parent — Projets & Production
- #17 Modèles de projets versionnés
- #18 Transformation Devis → Projet
- #19 Fiche Projet / arbre / prérequis
- #20 Fichiers & Ressources projet
- #21 Bibliothèque technique projet
- #22 Timer global / sessions de temps
- #23 Validation Phase 3

Décisions clés :

- un devis accepté ne peut produire qu’un seul projet ;
- transformation Devis → Projet transactionnelle et idempotente ;
- modèle projet versionné et figé au moment de la création ;
- arbre `Lot → Module/Page → Tâche → Checklist` ;
- progression calculée depuis les tâches obligatoires ;
- temps réel issu uniquement de `time_sessions` ;
- arborescence Ressources physique créée automatiquement sur disque ;
- SQLite référence les fichiers sans les dupliquer ;
- fichiers déplacés détectables et relocalisables ;
- Bibliothèque projet = réel technique utilisé chez le client ;
- aucune généralisation automatique vers Bibliothèque AtoumWeb ;
- timer unique global raccordé à Client > Projet > Module > Tâche ;
- pause/reprise persistées ;
- session restée ouverte au redémarrage gérée explicitement ;
- projet interne AtoumWeb autorisé sans client externe ;
- fin de projet avec checklist d’avertissements non bloquants ;
- Cazor Auto Passion sert de cas de validation de référence.

## Avancement par module

| Module | Conception | Développement | Statut |
|---|---|---|---|
| Accueil / Dashboard | ✅ | 🟡 | Socle présent |
| Recherche globale | ✅ | 🟡 | Phase 1 #8 |
| Prospects | ✅ | ⬜ | Phase 1 #6 |
| Clients | ✅ | ⬜ | Phase 1 #7 |
| Offres & Tarifs | ✅ | ⬜ | Phase 2 #11 |
| Devis | ✅ | ⬜ | Phase 2 #12–#15 |
| Projets | ✅ | ⬜ | Phase 3 #17–#19 |
| Fichiers & Ressources | ✅ | ⬜ | Phase 3 #20 |
| Bibliothèque projet | ✅ | ⬜ | Phase 3 #21 |
| Timer global | ✅ | 🟡 shell | Phase 3 #22 |
| Gestion des temps | ✅ | ⬜ | Première version Phase 3 #22 |
| Interventions & Maintenance | ✅ | ⬜ | Prochaine phase |
| Packs d’heures | ✅ | ⬜ | Prochaine phase |
| Facturation / Abby | ✅ | ⬜ | À venir |
| Dépenses | ✅ | ⬜ | À venir |
| Documents & Contrats | ✅ | ⬜ | PDF devis amorcé Phase 2 |
| Bibliothèque AtoumWeb | ✅ | ⬜ | À venir après Bibliothèque projet |
| Sauvegardes | ✅ | 🟡 | Base CRM implémentée ; sauvegardes métier à venir |
| Annuaire | ✅ | ⬜ | À venir |
| Statistiques | ✅ | ⬜ | À venir |
| Journal d’activité | ✅ | 🟡 | Normalisation Phase 1 #5 |
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
19. Recherche globale et journal d’activité sont transverses.
20. Trois thèmes : AtoumWeb par défaut, Noir, Blanc.

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

**Validation exécutable de la fondation. La préparation fonctionnelle/technique est déjà avancée jusqu’à la Phase 3 incluse.**

## Prochain ordre de développement

1. Valider et fusionner la fondation PR #3.
2. Phase 1 : #5 → #6/#7/#8 → #9.
3. Phase 2 : #11 → #12 → #13/#14 → #15.
4. Phase 3 : #17 → #18 → #19/#20 → #21/#22 → #23.
5. Préparer puis développer Phase 4 : Interventions, Maintenance et Packs d’heures.
