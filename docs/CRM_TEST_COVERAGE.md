# AtoumWeb Manager — Matrice de couverture des tests

> Référence code : `fix/recette-commerciale-prospects` @ `be9d086bd4b284269eabeb7b0199b275cbda59a7`.
>
> Dernière validation connue **avant cette passe documentaire** : 28 fichiers / 118 tests annoncés réussis sur le lot de stabilisation. Cette documentation n’assimile pas ce résultat à une validation du commit en cours : Codex exécute en parallèle `typecheck`, tests et lancement Windows sur la branche fonctionnelle.

## Légende

- **Fort** : service + SQLite + cas d’erreur/idempotence couverts.
- **Moyen** : scénario principal couvert, bords ou intégration UI manquants.
- **Faible** : présence de tests, mais règle métier cible non démontrée.
- **Visuel** : nécessite recette Windows/React.

## CRM / commercial

| Règle / transition | Test existant repéré | Niveau | Manque identifié |
|---|---|---:|---|
| Création organisation/contact/prospect | `src/main/crm/CrmService.test.ts` | Moyen | formulaire V2 complet non testé React |
| Conversion Prospect → Client sans doublon | `CrmService.test.ts`, tests workflow | Fort côté service | recette répétée depuis UI |
| Unicité Client organisation/contact | migration + `CrmService.test.ts` | Fort | test migration sur base historique à maintenir |
| Actions/relances | `src/main/crm/actions.test.ts` | Moyen/Fort | choix UI structurés, rendu historique |
| Contacts Client / contact principal | `src/main/crm/client-contacts.test.ts` | Moyen | multiples `contact_methods` sur Client UI |
| Besoin vide non persisté | `src/main/workflow/WorkflowService.test.ts`, migration19 tests | Moyen/Fort | test React du sélecteur temporaire |
| Besoin obligatoire après qualification | `CrmService` / Workflow tests | Moyen | **test explicite UI : qualification complète sans besoin** |
| Qualification structurée | migration19 + tests service partiels | Faible | budget/date conditionnels + auto-stage + checklist manquants en test automatisé |
| Température `neutral` | migration19 | Moyen | carte entière colorée = visuel |
| Devis créé depuis besoins | Quote/Workflow tests historiques | Moyen | test `ProspectsPageV2.createQuote` avec lignes catalogues + autre |
| Devis finalisé → `quote_to_send` | QuoteService tests / migration19 | Moyen | idempotence finalize manquante |
| Envoi → `sent` + Prospect `quote_sent` | QuoteService tests | Moyen/Fort | canal/destinataire tracés via action à tester en intégration |
| Devis envoyé figé | QuoteService tests | Fort service | vérifier boutons UI réellement masqués |
| Négociation par duplication | QuoteService tests partiels | Moyen | test stage negotiation + duplicate + ancien devis intact |
| Acceptation + snapshot + Client | QuoteService / Workflow tests | Fort service | recette UI directe depuis fiche Prospect |
| Perdu avec raison | CRM tests partiels | Moyen | choix normalisés + code raison non exploité |
| Attente avec motif/reprise | migration19 / peu de tests | Faible | test complet motif + action date reprise |

## Projets

| Règle | Test existant | Niveau | Manque |
|---|---|---:|---|
| Création depuis devis accepté | `src/main/projects/ProjectService.test.ts` | Fort | recette visuelle volontairement différée |
| Idempotence devis → projet | `ProjectService.test.ts` | Fort | conserver test lors refonte Projet |
| Copie snapshot services | `ProjectService.test.ts` | Fort | vérifier affichage UI |
| Modèles versionnés / version publiée figée | `ProjectService.test.ts` | Moyen/Fort | matrice complète des versions |
| Structure lot/module/tâche/checklist | `ProjectService.test.ts`, `ProjectNodeArrangementService.test.ts` | Fort structure | workflow métier des statuts non protégé |
| Réorganisation sans cycle | `ProjectNodeArrangementService.test.ts` | Fort | — |
| Ressources physiques | `ProjectResourceService.test.ts` | Fort | permissions/erreur ouverture Windows = recette |
| Bibliothèque technique versionnée | `ProjectTechnicalLibraryService.test.ts` | Fort | UX chantier suivant |
| Préparation réutilisation | `ProjectReuseExportService.test.ts` | Fort | — |
| Revue de fin de projet | `ProjectCompletionService.test.ts` | Moyen/Fort | `changeProjectStatus` contourne potentiellement cette revue |
| Recherche Projet | `ProjectSearchService.test.ts` | Fort | routage UI |
| Matrice transitions Projet | aucun garde central strict | **Faible** | tests refusant les sauts incohérents après décision métier |

## Demandes / Interventions

| Règle | Test existant | Niveau | Manque |
|---|---|---:|---|
| Création / mise à jour demande | `src/main/operations/OperationsService.test.ts` | Fort | — |
| Demande transformée une seule fois | `OperationsService.test.ts` | Fort | UI répétition double clic |
| Demande converted protégée | `OperationsService.test.ts` | Moyen/Fort | — |
| Rattachement Projet/Nœud cohérent | `OperationsService.test.ts`, `OperationsTime.test.ts` | Fort | recette modification postérieure |
| Intervention completion | `InterventionCompletionService.test.ts` | Fort | transitions libres avant/après completion |
| Incidents | Operations tests | Moyen | tous champs/criticité et UX |
| Matrice statut Intervention | aucun garde d’adjacence | **Faible** | tests à créer après validation métier |

## Timer / temps

| Règle | Test existant | Niveau | Manque |
|---|---|---:|---|
| Une seule session active | `src/main/time/TimeService.test.ts` + index SQLite | Fort | — |
| Pause/reprise | `TimeService.test.ts` | Fort | recette horloge UI |
| Stop idempotent | `TimeService.test.ts` | Fort | — |
| Reprise après interruption | `TimeService.test.ts` | Fort | recette redémarrage Electron réel |
| Switch de session | `TimeSwitchService.test.ts` | Fort | affichage contexte après switch |
| Correction session | `TimeCorrectionService.test.ts` | Fort | recette UI |
| Temps d’intervention | `src/main/operations/OperationsTime.test.ts` | Fort | — |
| Timer utilise rattachement sauvegardé | services Time + Operations | Moyen/Fort | recette : modifier intervention après démarrage et vérifier session |

## Maintenance

| Règle | Test existant | Niveau | Manque |
|---|---|---:|---|
| Plan / souscription snapshot | `src/main/operations/MaintenanceService.test.ts` | Fort | — |
| Période `ensure` idempotente | `MaintenanceService.test.ts` | Fort | — |
| Checklist période | `MaintenanceService.test.ts` | Fort | recette UI |
| Dépassement maintenance | `MaintenanceOverageService.test.ts` | Fort | intégration Dashboard/alertes |
| Rapport brouillon | `MaintenanceReportService.test.ts` | Fort | rendu/export futur |
| Matrice de statuts souscription/période | service accepte toute valeur valide | Faible | tests de transitions interdites inexistants |

## Packs d’heures

| Règle | Test existant | Niveau | Manque |
|---|---|---:|---|
| Crédit initial | `HourPackService.test.ts` | Fort | — |
| Solde calculé par mouvements | `HourPackService.test.ts` | Fort | — |
| Débit intervention idempotent | `HourPackService.test.ts` | Fort | — |
| Reverse idempotent | `HourPackService.test.ts` | Fort | — |
| exhausted/expired calculés | `HourPackService.test.ts` | Fort | date limite en UI |
| Décision insuffisance | `HourPackShortfallService.test.ts` | Fort | UX |

## Documents client

| Règle | Couverture actuelle | Niveau | Manque |
|---|---|---:|---|
| Fichier hors SQLite | service + migration | Moyen | test dédié `ClientDocumentService` non repéré dans le dossier CRM |
| Import + chemin relatif | service | Faible/Moyen | test fichier temporaire réel |
| Archive/restauration non destructive | service | Faible/Moyen | test automatisé fichier toujours présent |
| Suppression définitive | service + confirmation IPC | Faible | test confirmation + unlink + metadata |
| Rétention | dashboard + champs | Faible | échéance, prolongation, décision, aucun auto-delete |
| Catégories documentaires | migration/service | Faible | taxonomie métier validée non encore implémentée |

## Migrations

- `src/main/database/StabilisationPhase19.test.ts` vérifie migration 19 et conservation de données.
- Le test de nombre de migrations utilise désormais la liste `MIGRATIONS` plutôt qu’une constante 18.
- À conserver impérativement : ordre, unicité des IDs, non-réapplication, `foreign_key_check` après la reconstruction de `prospects`.

### Tests de migration encore recommandés

1. legacy email/phone → `contact_methods` sans doublon lorsque migration relancée sur données déjà partiellement migrées ;
2. prospect `quote_to_send` conservé après redémarrage ;
3. données `crm_needs` toujours liées après conversion puis migration ;
4. client/document avec `ON DELETE RESTRICT` ;
5. migration sur base contenant toutes les étapes historiques Prospect.

## Tests visuels Windows obligatoires

- couleurs complètes des cartes dans AtoumWeb / Noir / Blanc ;
- lisibilité des champs et sélecteurs ;
- petite fenêtre + scroll fiche Prospect/Client ;
- création fiche vierge ;
- coordonnées multiples repliables ;
- qualification conditionnelle ;
- catalogue par catégories ;
- parcours devis depuis Prospect sans basculer inutilement dans Devis ;
- fichier client réel PDF/image ;
- redémarrage/persistance ;
- Timer actif puis redémarrage/récupération.

# Tests manquants prioritaires avant stabilisation finale

1. **Qualification complète sans besoin** : l’UI affiche 4/4 mais le service doit refuser `need_identified`; transformer ce cas en comportement cohérent et testable.
2. **Double clic Finaliser devis** : vérifier une seule date/un seul événement ou retour idempotent.
3. **Transitions Prospect illégales** : une fois la matrice métier validée, tester au niveau service et pas seulement UI.
4. **Transitions Projet / Intervention illégales** : même principe.
5. **ClientSummary + `contact_methods`** : garantir que les coordonnées visibles ne deviennent pas obsolètes par rapport à la source multiple.
6. **Document client archive/restaure/supprime** avec fichier physique réel.
7. **Traçabilité envoi devis** : canal/destinataire/note retrouvables après redémarrage depuis l’action liée.
8. **Duplication négociation** : ancien devis immuable, nouveau devis draft, Prospect en préparation.
9. **Dashboard commercial** : chaque groupe ouvre la bonne cible et ne produit pas de doublons trompeurs.

# Décision recette

Tant que Codex n’a pas terminé le `typecheck` et les tests locaux du commit fonctionnel courant, le statut est **OUI AVEC RÉSERVES** pour reprendre la recette Boulangerie Martin : le socle est suffisamment structuré, mais les points de qualification/besoins, idempotence de finalisation et cohérence des coordonnées doivent être surveillés explicitement pendant la recette.
