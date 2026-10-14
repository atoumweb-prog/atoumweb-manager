# Lot 06A — Reprise de l'audit Devis (14 octobre 2026)

**Statut : audit statique partiel, aucune modification applicative.** Branche isolée `audit/ux-v2-06a-devis-20261014` créée depuis `main`. Ne pas considérer les scénarios comme exécutés.

## Périmètre et sources
- Référentiel historique dans PR #82 : `docs/ux-v2/LOT-06A-MATRICE-DEVIS-ET-ETATS.md` (audit initial établi sur `main@eb252d5c` le 09/10).
- Sources de `main` relues via GitHub : `src/shared/commercial.ts` (blob `d5daf0e38005193598307608509626846e953365`) et `src/renderer/commercial/QuotesPage.tsx` (blob `984adbd664cd899538bd43bc8287ad8f70c6ac10`).
- Service réel retrouvé : `src/main/commercial/QuoteService.ts` (blob `59ad029cc295cb93197250d2586fca550bfcf043`). Son test associé `src/main/commercial/QuoteService.test.ts` (blob `7f4fecf7c86e05cc5b522dcbe14b49a67a2cb2a3`).

## Écarts encore observables dans le code actuel
| Code | Constat statique | Source | Attendu / suite |
|---|---|---|---|
| E151 | À l'étape 6, rendu via `item.currentVersion?.priceCents` ; à l'enregistrement le prix choisi provient de `eurosToCents(catalogPrice) ?? item.currentVersion?.priceCents`. | `QuotesPage.tsx` lignes 196 et 304 | Unifier le calcul de montant de l'aperçu et de la ligne persistée ; tests prix « sur devis », gratuit, centimes, absence de prix, quantités. |
| E152 | Actions `Valider` visibles dans liste et détail ; les handlers exécutent `window.atoumweb.quotes.accept`. | `QuotesPage.tsx` lignes 238–240, 261–281, 334, 351 | Renommer « Confirmer accepté dans Abby » et expliciter bon devis/révision, preuve et conséquences ; ne pas prétendre à un envoi automatique. |
| E153 | **Corrigé dans le code actuel** : `QuoteService.create` n'actualise le stade vers `quote_to_prepare` que si `stage NOT IN ('new','won','lost')`. La méthode `createWithLines` appelle `create`. | `QuoteService.ts` ; `QuoteService.test.ts` (tests E72 avant et après démarrage volontaire) | Préserver cette règle et rejouer les tests lors d'une future convergence 03/06. Les tests ont été lus, **pas exécutés** dans cette reprise. |
| Protection | `useUnsavedDraft` est déjà présent pour l'assistant et les ajouts catalogue. | `QuotesPage.tsx` lignes 83–86 | Rejouer toutes les fermetures, changements de sélection, rejets d'écriture et retours tardifs ; pas de garde concurrente inventée. |

## Invariants de coordination
- Ne pas modifier `main`, le code, les migrations SQL, ni les branches des lots 03, 04 ou 05 dans cet audit.
- Le lot 04 modifie le Catalogue, notamment catégories administrées et migration 67 sur une branche en draft : conserver la lecture des catégories historiques et la non-rétroactivité des snapshots devis.
- Le lot 05 est propriétaire du Builder CGV ; ne pas dupliquer son schéma ni sa logique dans le lot 06.
- Contrôler l'intégration 03D/03E avant tout changement sur les identités Prospect/Client ou les transitions CRM.
- `finalize` (préparer pour envoi) et `accept` (attester l'acceptation externe dans Abby et produire des effets métier) sont des commandes distinctes.
- Les documents Manager ne prouvent pas une acceptation Abby ; « envoyé/vu » reste déclaratif.
- Aucun accès à Validation-MSI ; utiliser uniquement des fixtures SQLite temporaires pour les futurs tests.

## Prochaines vérifications techniques
1. Relever le commit complet de la tête de `main` et les handlers IPC ; le chemin réel de `QuoteService` et ses tests sont maintenant identifiés.
2. Conserver la correction E153 déjà présente dans le service (`new` exclu de l'UPDATE) ; tester sa non-régression après intégration de 03D/03E.
3. Tracer les calculs monétaires entre assistant, lignes, snapshots, aperçu, export et PDF (E151).
4. Recenser les autres appels à `quotes.accept` et les impacts Client/Projet/opérations (E152).
5. Préparer des tests de non-régression, exécuter typecheck/Vitest/SQLite/Electron sur une copie de travail compatible avant toute PR de code.
6. Garder la PR éventuelle en **draft**, sans fusion, et documenter précisément le SHA effectivement testé.

**Tests exécutés pendant cette reprise : aucun.** Les constats ci-dessus proviennent uniquement de la lecture des sources GitHub et du référentiel 06A existant.

## Complément de vérification — 14/10/2026

- **E153 résolu au niveau des sources actuellement visibles sur `main`** : clause SQL `AND stage NOT IN ('new','won','lost')` dans `QuoteService.create`, héritée par `createWithLines`.
- Tests existants E72 : « créer un devis ne démarre pas la prospection d’un nouveau contact » (création simple et avec lignes), « après démarrage volontaire, le workflow devis existant reste actif » (passage `qualifying` vers `quote_to_prepare`). Ces tests sont présents, mais leur succès n'a pas été mesuré ici.
- Contrat de `QuoteService` : `finalize` distinct de `accept`, snapshots Catalogue et lignes versionnées ; tests historiques sur non-rétroactivité du snapshot, idempotence de finalisation et de l'acceptation, pièce Abby après acceptation.
- Statuts : sept valeurs officielles `draft/sent/viewed/accepted/refused/expired/cancelled` dans `src/shared/commercial.ts` ; `finalizedAt` séparé.
- **Priorités actualisées** : E151 et E152 à corriger ; E153 à préserver/tester (ne pas réintroduire l'ancien défaut).

## Premier incrément correctif — interface Devis

Commit applicatif : `3983b1ca0f11f4db6feb809f3050fafa76c5470d` sur la seule branche 06A.

- E151 : l'offre de départ de l'aperçu à l'étape 6 lit désormais le prix proposé `eurosToCents(catalogPrice) ?? currentVersion.priceCents`, exactement comme l'assemblage de cette ligne lors de `createWithLines`. Si aucun prix n'est défini, l'aperçu indique « Prix à renseigner » ; le service continue de valider les valeurs réellement enregistrées.
- E152 : boutons d'acceptation sur liste et détail renommés « Confirmer accepté dans Abby » ; confirmation enrichie sur le bon devis/révision, l'acceptation extérieure et ses conséquences contractuelles/opérationnelles. Messages de succès et d'erreur clarifiés. Aucun changement au service `quotes.accept`.
- E153 : aucun changement, correction du service métier conservée.
- **Réserves : aucun typecheck, Vitest, contrôle Electron ou CI n'a été exécuté dans cette session.** Le comportement d'ensemble et les protections UX-01 doivent être validés sur le SHA exact avant PR/fusion. Notamment tester prix nul, zéro, arrondis, prix négatifs, saisie invalide, sortie avec brouillon et acceptation par liste/détail sur fixtures isolées.
- Ne pas fusionner cet incrément avant validation. `main` et les chantiers 03/04/05 sont inchangés.
