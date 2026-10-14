# Lot 06A — Reprise de l'audit Devis (14 octobre 2026)

**Statut : audit statique partiel, aucune modification applicative.** Branche isolée `audit/ux-v2-06a-devis-20261014` créée depuis `main`. Ne pas considérer les scénarios comme exécutés.

## Périmètre et sources
- Référentiel historique dans PR #82 : `docs/ux-v2/LOT-06A-MATRICE-DEVIS-ET-ETATS.md` (audit initial établi sur `main@eb252d5c` le 09/10).
- Sources de `main` relues via GitHub : `src/shared/commercial.ts` (blob `d5daf0e38005193598307608509626846e953365`) et `src/renderer/commercial/QuotesPage.tsx` (blob `984adbd664cd899538bd43bc8287ad8f70c6ac10`).
- Le chemin supposé `src/main/services/QuoteService.ts` n'existe pas sur `main`; retrouver le service réel avant de conclure sur le comportement serveur E153.

## Écarts encore observables dans le code actuel
| Code | Constat statique | Source | Attendu / suite |
|---|---|---|---|
| E151 | À l'étape 6, rendu via `item.currentVersion?.priceCents` ; à l'enregistrement le prix choisi provient de `eurosToCents(catalogPrice) ?? item.currentVersion?.priceCents`. | `QuotesPage.tsx` lignes 196 et 304 | Unifier le calcul de montant de l'aperçu et de la ligne persistée ; tests prix « sur devis », gratuit, centimes, absence de prix, quantités. |
| E152 | Actions `Valider` visibles dans liste et détail ; les handlers exécutent `window.atoumweb.quotes.accept`. | `QuotesPage.tsx` lignes 238–240, 261–281, 334, 351 | Renommer « Confirmer accepté dans Abby » et expliciter bon devis/révision, preuve et conséquences ; ne pas prétendre à un envoi automatique. |
| E153 | L'audit de PR #82 constate un déplacement involontaire de `new` au moment de créer un devis. | Référentiel 06A ancien | **À revalider** sur le service métier actuel et les évolutions CRM 03A–03E avant correction. Un `new` doit rester dans l'Annuaire sans clic « Démarrer la prospection ». |
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
1. Relever le commit complet de la tête de `main`, le chemin réel de `QuoteService`, les handlers IPC et les tests du domaine.
2. Confronter E153 aux dernières règles de CRM 03A–03E et vérifier les chemins `create` et `createWithLines`.
3. Tracer les calculs monétaires entre assistant, lignes, snapshots, aperçu, export et PDF (E151).
4. Recenser les autres appels à `quotes.accept` et les impacts Client/Projet/opérations (E152).
5. Préparer des tests de non-régression, exécuter typecheck/Vitest/SQLite/Electron sur une copie de travail compatible avant toute PR de code.
6. Garder la PR éventuelle en **draft**, sans fusion, et documenter précisément le SHA effectivement testé.

**Tests exécutés pendant cette reprise : aucun.** Les constats ci-dessus proviennent uniquement de la lecture des sources GitHub et du référentiel 06A existant.
