# AtoumWeb Manager — Couverture de tests CRM consolidée

> Branche : `fix/recette-commerciale-coherence`.
>
> Les tests ciblés ont été renforcés pendant la correction. Une validation GitHub Actions Windows a été lancée sur le commit `1105b0d3d2a83405a88b9be0ba91c275606c32fd`, mais le job n’a obtenu aucun runner : aucun step n’a commencé. Ce résultat est donc un **blocage d’infrastructure**, pas un échec de typecheck ou de tests.

## Niveaux

- **Fort** : règle métier protégée côté service/SQLite avec tests positifs et négatifs.
- **Moyen** : parcours principal couvert, mais intégration ou cas limites encore à recetter.
- **Visuel** : dépend du rendu Electron/React Windows.
- **Différé** : volontairement réservé à la passe Projet/Opérations.

## CRM / Prospect

| Règle | Couverture actuelle | Niveau |
|---|---|---:|
| Création organisation/contact/prospect | `CrmService.test.ts` | Moyen/Fort |
| Conversion Prospect → Client idempotente | `CrmService.test.ts`, workflow | Fort |
| Deux prospects même organisation → même Client | `CrmService.test.ts` | Fort |
| Création directe d’un doublon Client | test de refus ajouté | Fort |
| Besoin obligatoire après qualification | service + tests CRM | Fort |
| Matrice de transitions manuelles Prospect | tests autorisé/interdit ajoutés | Fort |
| Perdu exige une raison | `CrmService.test.ts` | Fort |
| Réactivation depuis Perdu | matrice service | Moyen/Fort |
| Température neutre/froid/tiède/chaud | type/migration + UI | Visuel |
| Coordonnées multiples | service + recherche | Moyen/Fort |
| Coordonnée principale visible Client | tests ajoutés | Fort service |
| Recherche Client par `contact_methods` | tests ajoutés | Fort service |

## Qualification

| Règle | Couverture | Niveau |
|---|---|---:|
| Budget connu / fourchette / non communiqué | logique React + validation service des montants | Moyen |
| Min <= max | service + UI | Fort service |
| Date connue / note / non communiqué | UI + stockage | Moyen |
| Décideur non → détail obligatoire pour readiness | UI + règle recette | Moyen |
| Besoin compte dans la readiness 5/5 | UI corrigée + service bloque l’absence | Fort logique, recette UI requise |
| Auto-passage vers Besoin identifié | UI + service | Moyen/Fort |

## Actions / relances

| Règle | Couverture | Niveau |
|---|---|---:|
| Action simple sans changement de pipeline précoce | `actions.test.ts` renforcé | Fort |
| Relance après devis → `follow_up` | `actions.test.ts` | Fort |
| Relance exige une date | service | Fort |
| Complétion idempotente | service/tests | Fort |
| Récurrence crée une occurrence suivante | `actions.test.ts` | Fort |
| Canal / résultat / compte rendu persistés | tests actions | Fort service |
| Formulaire structuré React | recette Windows | Visuel |

## Devis

| Règle | Couverture | Niveau |
|---|---|---:|
| Création transactionnelle avec lignes | Quote/Workflow tests | Fort |
| Création depuis besoins Prospect | workflow + recette UI | Moyen/Fort |
| Finalisation exige une ligne | QuoteService | Fort |
| Finalisation idempotente | test ajouté | Fort |
| Envoi interdit avant finalisation | test ajouté | Fort |
| Finalisation → Prospect `quote_to_send` | QuoteService | Fort |
| Envoi → Prospect `quote_sent` | QuoteService | Fort |
| Devis envoyé figé | QuoteService | Fort |
| Duplication de négociation | QuoteService + matrice | Moyen/Fort |
| Acceptation idempotente | QuoteService | Fort |
| Acceptation → Client sans doublon | Quote + CRM | Fort |
| Snapshot catalogue conservé | Workflow/Quote/Project tests | Fort |
| Trace d’envoi via action liée | service actions + lecture panneau | Moyen/Fort, recette reload requise |

## Scénarios DEMO

Les scénarios de démonstration doivent respecter le même workflow que les dossiers normaux. Ils finalisent désormais le devis avant `markSent`.

La purge DEMO conserve le catalogue, les prix, les modèles et les vrais dossiers. Les tests existants vérifient aussi l’échec sûr lorsqu’une donnée réelle référence une donnée de démonstration.

## Documents Client

| Règle | Couverture | Niveau |
|---|---|---:|
| Fichiers hors SQLite | architecture/service | Moyen/Fort |
| Archivage logique | service | Moyen |
| Restauration | service | Moyen |
| Suppression confirmée | IPC/service | Moyen |
| Conservation / RGPD sans auto-delete | dashboard + modèle | Moyen |
| Nouvelle taxonomie métier | non implémentée dans cette passe | Différé |

La migration de catégories documentaires doit recevoir ses propres tests de migration avant modification des données existantes.

## Projet / Intervention / Maintenance

Les tests existants de ces modules restent utiles et doivent rester verts, mais la matrice de transitions métier complète n’est pas traitée dans la correction commerciale. Les sauts illégaux Projet/Intervention/Maintenance seront testés lors de la passe suivante après enforcement côté services.

## Recette Windows à conserver même si CI est verte

1. création d’un Prospect vierge puis coordonnées visibles sans ressaisie ;
2. couleurs des cartes dans les trois thèmes ;
3. qualification complète et incomplète ;
4. budget/date conditionnels ;
5. sélection catégorie → prestation ;
6. devis créé en préparation, jamais directement à envoyer ;
7. finalisation puis envoi avec canal/destinataire ;
8. rechargement : trace d’envoi et relances encore visibles ;
9. négociation par duplication, ancien devis intact ;
10. acceptation → Client unique ;
11. fenêtre réduite et scroll des panneaux latéraux ;
12. redémarrage de l’application et persistance.

## Validation automatisée de la branche

Tentative GitHub Actions Windows :

- run : `34961007123`
- commit : `1105b0d3d2a83405a88b9be0ba91c275606c32fd`
- job : `quality` / `windows-latest`
- résultat GitHub : `failure`
- runner : **aucun alloué** (`runner_id=0`, nom vide)
- steps exécutés : **0**
- logs : indisponibles, car le job n’a pas démarré

Par conséquent :

- `npm run typecheck` : **NON EXÉCUTÉ — RUNNER INDISPONIBLE**
- `npm test` : **NON EXÉCUTÉ — RUNNER INDISPONIBLE**
- nombre de fichiers de tests exécutés : **0**
- nombre de tests exécutés : **0**

La dernière validation automatisée connue du socle précédent était verte avant les corrections de cette branche, mais elle ne remplace pas une validation du delta courant. Le workflow est maintenant configuré pour cette branche ; dès qu’un runner Windows est de nouveau disponible, un nouveau push ou un lancement manuel exécutera directement `npm install`, `npm run typecheck` et `npm test`.

### Nouvelle tentative

Le runner Windows étant annoncé de nouveau disponible le 15/09/2026, cette mise à jour déclenche une nouvelle exécution complète de la CI sur la branche courante.

Une branche n’est pas déclarée prête pour reprise de recette tant que ces deux commandes ne sont pas vertes sur le commit courant.