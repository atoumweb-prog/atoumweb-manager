# Lot 09D — Documents, archives, preuves et navigation

Branche indépendante `feature/ux-v2-lot09d-documents-20261014` basée sur la 09A/PR #113. Aucun merge dans main. Référentiel `LOT-09D-DOCUMENTS-ARCHIVES-PREUVES.md` depuis `0bb0860`.

## État confirmé
- `DocumentsPage`, `ClientDocumentsPanel` et `ClientDocumentService` existent ; la bibliothèque contractuelle est déjà ouverte via la vraie `ContractLibraryPage`, pas une copie.
- 09A protège la suppression des PDF Abby actuellement rattachés et les preuves Devis, intègre SHA-256 ; 09B/#119 protège de plus les factures Abby remplacées via leur historique. **La convergence des protections 09B devra être testée lors de l'intégration**, car cette branche 09D ne dépend pas de #119.
- `DocumentsPage` possède formulaires import et métadonnées, recherche, archives, mais aucune protection `useUnsavedDraft` observée.
- Aucune bibliothèque générique transversale hors Client n'existe de façon prouvée. Ne pas présenter « Autres documents » comme système de stockage déjà opérationnel.

## Travail à réaliser
1. Protéger avec UX-01 les saisies de création et les métadonnées éditées lors du changement de document, fermeture, rafraîchissement, passage à la bibliothèque et navigation.
2. Revoir clairement les quatre portes : Bibliothèque contractuelle réelle, éditeur de brouillons contractuels réel, documents clients réels, documents généraux **non encore disponibles** sans API et espace dédiés.
3. Vérifier fichiers manquants, intégrité SHA-256, preuves sans empreinte, archives/restauration et refus définitif des pièces protégées au **service**, même si les boutons sont disponibles.
4. Recette R09D-01 à R09D-18 via TypeScript, Vitest, SQLite/FK TEMP, parcours Electron réel et neuf combinaisons visuelles.
5. Conserver PR draft indépendante et reporter intégration 09A + 09B + 09D, validation humaine et main sans fusion anticipée.

Ne pas inventer des obligations légales de rétention, un classement générique hors Client, des copies de contrats publiés ou un connecteur Abby.
## Exécution du 14/10 — 09D en développement
- PR #132 draft, isolée de 09B : quatre entrées visuelles sans duplicata métier ; les deux portes contractuelles réutilisent `ContractLibraryPage`, « Documents clients » utilise `DocumentsPage`, et « Autres documents » affiche honnêtement l'absence d'un dépôt transversal.
- Garde UX-01 dans `DocumentsPage` : brouillons de nouveaux documents et métadonnées (titre, catégorie, conservation, notes) conservés / demandent confirmation lors du choix d'une autre pièce, fermeture, rafraîchissement, nouvelle création et navigation vers la bibliothèque.
- Vérification SHA-256 rendue explicite : une pièce historique sans empreinte ne reçoit pas de certification implicite. Un fichier absent ou modifié déclenche une erreur visible dans Documents et dans la fiche Client.
- `ClientDocumentService.update/archive` devient transactionnel avec le journal, idempotent pour un archivage identique. Test de retour arrière forcé et conservation de l'empreinte et des octets.
- Recette Electron native `--lot09d` : deux clients homonymes, chemins distincts, vraie navigation Bibliothèque et Documents, garde de saisie, conservation à vérifier, altération SHA, archivage/restauration, édition des métadonnées et neuf combinaisons visuelles.
- Le contrôle des anciennes factures Abby *remplacées* demeure dans 09B/#119 (non dupliqué sur cette branche). Vérifier la convergence 09A+09B+09D avant le merge.

## Matrice R09D (état provisoire)
| Cas | Moyen de vérification |
| --- | --- |
| 01–02 | Vraie Bibliothèque et éditeur contractuel via portes réelles (même composant) |
| 03–05 | Filtrage client/catégorie et import même nom sur deux clients, pièces distinctes |
| 06–08 | Fichier manquant, SHA altéré, SHA absent non certifié |
| 09 | Archive/restauration idempotente avec conservation physique et contrôle FK |
| 10–12 | Tests de refus des preuves Devis/Facture du service existants en 09A ; facture Abby remplacée dans 09B |
| 13 | Suppression d'une pièce générique non liée vérifiée dans TEMP |
| 14 | Conservation atteinte : « à vérifier », aucune suppression automatique |
| 15–16 | Transaction métadonnées, fichier inchangé, confirmation native UX-01 |
| 17 | Navigation Client/Bibliothèque/Documents avec IDs réels ; approfondir la navigation intermodules |
| 18 | CI Windows native, 3 thèmes × 3 densités, FK/chemins TEMP, restauration ; dernière exécution à confirmer |

**Clôture non prononcée** : attendre CI et recette native 09D entièrement vertes, puis examiner les éventuels écarts au référentiel.

### Dernière vérification avant clôture
- Recette Windows réelle corrigée pour l'intitulé de navigation effectivement affiché « Documents & Contrats ». Contrôles supplémentaires : absence physique d'un fichier et refus d'ouverture, conservation des métadonnées, séparation des pièces par Client, neuf modes visuels et actions accessibles.
- Indicateur Factures limité aux documents actifs, sans assimiler facture à paiement.
- Exécuter TypeScript, suite complète Vitest, recette Electron Documents, UX générale et restauration sur ce dernier code ; aucune clôture ni merge anticipés.
