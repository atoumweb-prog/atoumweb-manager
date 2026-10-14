# Lot 06B — Reprise indépendante de l'interface Devis

Date : 14/10/2026. **Statut : préparation documentaire, aucun changement applicatif, aucun test exécuté.**

## Base et frontière
- Branche créée depuis `main` pour ne pas dépendre des modifications non validées de la PR #110 (06A).
- Référentiel source de la PR #82 : `docs/ux-v2/LOT-06B-ASSISTANT-LISTE-EDITION.md`.
- Code de référence : `src/renderer/commercial/QuotesPage.tsx` déjà doté de la liste, du panneau de détail, de l'assistant six étapes et des hooks de brouillon UX-01.
- Ne pas modifier les services CRM/Devis, la base SQLite, le Catalogue (lot 04), les CGV (lot 05), ni les données réelles. Ne pas fusionner avant validation.

## Périmètre de la reprise 06B
1. **Navigation par ID** : sélection fiable du devis depuis liste filtrée, recherche, fiches CRM, même avec homonymes.
2. **Liste** : filtres, numéro, état officiel, projet et révision ; préserver le contexte, ne pas inventer des statuts.
3. **Fiche** : largeur/agrandissement réversibles, onglet et scroll stables, actions selon le statut réel.
4. **Assistant six étapes** : ne pas réécrire les six écrans existants ; préserver le propriétaire, besoin, offre, lignes, conditions, prix et prévisualisation.
5. **Brouillons UX-01** : fermer (bouton, Escape, backdrop), changer de devis, quitter le module, erreurs et retours asynchrones sans perte silencieuse.
6. **Frontière 06A** : ne pas répliquer ici E151/E152, déjà candidats dans la PR #110 ; coordonner leur intégration avant les tests combinés.

## Matrice initiale de vérification
| Scénario | Critère de sortie |
|---|---|
| R06B-01/02 | Sélectionner le bon ID et propriétaire dans les listes/recherches |
| R06B-03 | Agrandir/réduire sans perdre brouillon, ID ni contexte |
| R06B-04/07 | Devis libre et prix proposé cohérent (dépend de 06A) |
| R06B-05/06 | Retour d'étapes, champs conditions et validations conservés |
| R06B-08/11 | Confirmation UX-01 sur toutes les sorties et bascules |
| R06B-12 | Échec de sauvegarde préserve les saisies |
| R06B-13 | Action Abby explicite (dépend de 06A) |
| R06B-14/15 | Projet provisoire distinct du Client/Devis accepté |
| R06B-16/17 | Clavier, neuf variantes UI, tests TS/Vitest/IPC/Electron sur fixtures TEMP |

## Prochaine implémentation
Commencer par relever précisément `closeQuoteDetail`, `openQuote`, les événements clavier, `refresh`, `requestUnsavedExit` et le changement d'étapes. Corriger ensuite uniquement les défauts reproduits, tests au même SHA, PR draft distincte. Pas d'affirmation de réussite avant exécution réelle.

## Premier correctif — garde assistant

Commit `62a9b2823734dbe5440d1fb76558b2c49986a39b` : le bouton Fermer de l'assistant utilise maintenant `requestUnsavedExit` pour le groupe `quote:create` au lieu de masquer immédiatement l'assistant en remettant l'étape à 1. Ouverture sans réinitialisation forcée de l'étape. La garde native UX-01 conserve le choix de rester, et l'abandon confirmé utilise les entrées `discard` du registre.

**Vérifications à exécuter :** fermeture avec/sans brouillon, confirmation refusée, saisie sur six étapes, clôture pendant enregistrement, nouveau devis après abandon, `npm run typecheck`, tests Vitest, Electron neuf variantes. Ces tests n'ont pas encore été exécutés sur ce commit ; aucune fusion permise. Le comportement de changement de devis et des réponses tardives reste à auditer avant toute autre correction.

## Reprise navigation asynchrone — 14/10/2026

Commits applicatifs `f2584a4` et `5d46a15` : séquence `detailRequest` et référence `selectedRef` synchronisées lors du changement et de la fermeture. Une réponse de `quotes.get(id)` périmée ne doit pas écraser le devis devenu actif. En cas d'échec du chargement courant seulement, remise à zéro de la sélection ; les erreurs obsolètes ne doivent pas effacer une sélection récente. Le contrôle UX-01 existant demeure avant tout changement.

Scénarios restant à exécuter : A→B avec A résolu après B, A en échec après B réussi, fermeture pendant chargement, refus de quitter un brouillon, ouverture par navigation externe, typecheck et Vitest, vraie fenêtre Electron, thèmes/densités, vérification des effets de `refresh`. **Tests non exécutés ; ne pas déclarer ce lot validé ni fusionner.**

## Renforcement changement de fiche

Commit `77476dd` : lorsque l'ID change, vider le détail précédent avant de lancer le nouvel appel `quotes.get`, et éviter de redemander le même ID lorsqu'il est déjà sélectionné ou en cours de chargement. Les protections contre les réponses tardives et les brouillons restent en place. À tester particulièrement : A→B, B ouvert lentement, B introuvable, B demandé deux fois, A modifié non enregistré et refus de sortie. Tests TypeScript, Vitest et Electron toujours non vérifiés sur ce commit.
