# R4 Devis : fiche de refonte

Statut : **proposition, à valider par Carlos avant tout code** (règle J). Rien n'est modifié dans le Manager tant que cette fiche n'est pas validée.
Skills : `atoumweb-design` (shape, critique), `superpowers:brainstorming`. Thème Noir, densité Confort (règle E). Niveau de décision (règle A) : la disposition des écrans est à valider ici ; données, règles métier, légal et ordre du parcours restent ta décision (règle B).
Méthode : lecture du code de `QuoteWizard.tsx`, `QuotesPage.tsx`, `QuoteJourney.tsx`, `QuoteDocumentActions.tsx`, des captures de l'audit (033 à 041, 121 à 126, 134) et de `CADRAGE.md`. **Aucune capture neuve n'a été prise pour cette fiche.**

## Ce que la lecture du code corrige dans l'audit

- **Il n'y a pas deux assistants de devis, il y en a un.** `QuoteWizard` est le seul composant (`QuotesPage.tsx:322` et `ProspectQuoteWorkspace.tsx:89`). Quand il reçoit un prospect (`presetProspect`), il saute déjà l'étape « Pour qui » (4 étapes au lieu de 5, `QuoteWizard.tsx:61`) et reprend le besoin. La décision « un seul assistant qui saute Pour qui depuis un contact » est donc **déjà vraie dans le code** : l'écart vu à l'audit (4 étapes dans la fiche, 5 dans la page Devis) est ce saut, voulu. R4 n'a rien à fusionner.
- Ce qui reste vrai : **plusieurs portes** vers l'assistant (« Nouveau devis » de la page Devis, onglet Devis de la fiche prospect, « Préparer le devis » et « Poursuivre le devis » de la fiche), un éditeur dont les outils sont tous au même niveau, et une liste Devis avec des boutons jaunes dans chaque ligne.

## Intention

Passer de « je choisis un contact » à « le devis est envoyé » sans se demander quel bouton prendre. R4 reste sur la **surface** (portes, boutons, messages, rangement des outils) et ne touche ni au calcul, ni aux clauses, ni à l'échéancier.

Objectifs :
1. Une porte claire vers l'assistant, avec le contact déjà choisi quand on part d'un contact.
2. Dans l'assistant : pas d'erreur avant d'avoir essayé, « Suivant » qui dit pourquoi il est bloqué, « Fermer » jamais jaune.
3. Dans l'éditeur : « Vérifier et envoyer » est l'action principale ; aperçu paginé, copie des clauses, Word, modèle et réglages sont rangés dans « Plus ».
4. Dans la liste Devis : une seule action visible par ligne, sans jaune répété.
5. Entêtes et pastilles de Devis alignés sur le socle R2 et R3 (`PageHeader`, `StatusPill`, retrait de `.quote-status` maison).

## Hors périmètre et anti-objectifs

- Aucune règle métier, aucun calcul de prix, aucune clause, aucun ordre du parcours. Aucun devis accepté ou envoyé n'est modifié.
- **Échéancier** : voir le point 1 des décisions. Rien n'est appliqué ici sans ton accord séparé.
- Relances J+7 / J+14, acceptation avec preuve, « Accepter et créer le projet » : cible du cadrage, mais ce sont de nouvelles fonctions et des règles : hors R4, à décider à part.
- Projets : R5. Offres et catalogue : R8.
- Aucun `!important` ajouté, aucune couleur en dur, aucune règle `:has()` nouvelle.

## Ce que le code montre (à confirmer sur captures)

- **Assistant** : `StepId = owner | offer | options | terms | preview`. L'erreur « Choisis un prospect ou un client » (audit P1 n°8) vient de `validate(step)` appelé dès l'ouverture ; « Suivant » (`primary-button`) ne dit pas pourquoi il est bloqué ; « Créer un faux dossier TEST » est rendu en mode développement dans l'étape « Pour qui ».
- **Éditeur** : `QuoteJourney` a trois étapes (« Prestations et prix », « Conditions et CGV », « Vérifier et sortir ») et, au-dessus, une barre d'outils (« Afficher l'aperçu paginé », « Reprendre le modèle enregistré », réglages). `QuoteDocumentActions` ajoute copie des clauses, PDF, Word, modèle. `QuoteSendPanel` porte « Envoyer le devis », « Créer le PDF » et « C'est envoyé ». `QuoteQuickReview` porte « Valider mes réponses ».
- **Liste** : la colonne « Décision » met dans chaque ligne un `primary-button` « Confirmer accepté dans Abby » et un secondaire « À négocier ».

## Proposition

### A. Les portes

- **Page Devis** : « Nouveau devis » reste (avec « Pour qui »).
- **Depuis un contact** : un seul bouton « Faire le devis » (carte « Prochaine étape » de R3 et onglet Devis) ouvre **le même assistant**, contact et besoin déjà repris, sans « Pour qui ».
- Les autres libellés (« Préparer le devis », « Poursuivre le devis ») sont des **états de la carte**, pas des portes différentes : « Poursuivre le devis » ouvre le devis existant, « Préparer le devis » ouvre l'assistant.
- Accueil « + Devis » : même assistant, avec « Pour qui ».

### B. L'assistant

- Les messages d'erreur n'apparaissent qu'après un clic sur « Suivant », en phrase complète avec majuscule.
- « Suivant » inactif affiche la raison à côté (« Choisis une offre pour continuer »).
- « Fermer » et « Annuler » en secondaire ; « Suivant » puis « Créer le devis » sont les seules actions principales.
- « Créer un faux dossier TEST » reste réservé au mode développement, rangé sous un repli « Recette ».

### C. L'éditeur

- Étape « Vérifier et sortir » : **« Vérifier et envoyer »** est l'action principale ; il ne montre que les points bloquants, puis le PDF et le brouillon d'e-mail, puis « C'est envoyé » (comportement actuel de `QuoteSendPanel`, regroupé).
- Menu **« Plus »** (`MoreMenu`) : aperçu paginé, copie des clauses, créer le PDF, fichier Word, reprendre le modèle, réglages de l'entreprise. Tout reste à un clic, rien n'est supprimé.
- Garde de sortie et protections Abby inchangées.

### D. La liste Devis

- Colonne « Décision » : une seule action visible par ligne (la plus probable pour le statut), l'autre dans « Plus ». « Confirmer accepté dans Abby » devient secondaire dans la ligne : le jaune est réservé à l'action principale de la vue.
- En-tête `PageHeader` et pastilles `StatusPill` (statuts brouillon, envoyé, vu, accepté, refusé, expiré avec les six rôles de couleur).

## Approches envisagées

| | Idée | Pour | Contre |
|---|---|---|---|
| **A (retenue)** | Garder le composant unique, réduire les portes, ranger les outils dans « Plus », nettoyer erreurs et boutons | Petit risque, réutilise R1 à R3, aucune règle touchée | Beaucoup de fichiers touchés (6 à 8) : captures indispensables |
| B | Réécrire l'éditeur en une seule page « Vérifier et envoyer » | Parcours le plus court | Contredit la décision « les outils existants sont réutilisés » ; trop gros et trop risqué avant la recette de l'envoi réel |
| C | Ne toucher que la liste et l'assistant | Très rapide | Le point lourd, l'éditeur à quatre outils et quatre sorties, reste |

## Points à trancher par toi

1. **Acompte de 30 % par défaut dans l'assistant.** `QuoteWizard.tsx` initialise `payment: 'percent'` et `depositPercent: '30'`. Cela contredit ta décision « jamais de 30 % par défaut, échéancier « à définir » et envoi bloqué ». C'est une règle métier : **je ne la change pas dans R4 sans ton accord.** Veux-tu (a) la traiter dans R4 comme lot séparé validé, (b) la laisser pour un lot dédié après R4 ?
2. **Une seule action visible par ligne dans la liste** : OK pour que « Confirmer accepté dans Abby » passe en secondaire et « À négocier » en « Plus » ?
3. **« Plus » dans l'éditeur** : OK pour ranger l'aperçu paginé, la copie des clauses, le PDF, le Word et le modèle dans « Plus », en gardant « Vérifier et envoyer » seul en jaune ?
4. **Portes** : OK pour « Faire le devis » depuis un contact et « Nouveau devis » depuis la page Devis, sans autre bouton qui ouvre l'assistant ?

## Ce que je n'ai pas pu voir

- Le rendu actuel de l'assistant (étapes 2 à 5) et de l'éditeur sur la version actuelle : captures de l'audit antérieures à R0 à R3 pour une partie.
- Les entrées exactes : `ProspectActionsPanel.tsx:13` contient « Préparer le devis » (libellé ou bouton, non lu), et l'Accueil « + Devis » (non lu).
- `QuoteSendPanel`, `QuoteQuickReview` et `QuoteDocumentActions` lus seulement par leurs libellés.
- Les états d'erreur, les textes longs, la fenêtre étroite, le clavier.

## Preuves prévues si tu valides

Tests d'abord (règles pures de « quel bouton principal selon le statut », câblage par lecture du source, comme R3), typecheck, suite complète, les quatre scripts natifs, captures avant / après dans `C:\DEV\Livrables\Cadrage-parcours\captures-r4\`, plan dans `docs/refonte/plans/2026-11-14-r4-devis.md`, un seul commit local après tes captures. Les scénarios de `check-unsaved-inputs-ui.cjs` (ligne de devis) et `check-contract-library-ui.cjs` (PDF commun) sont réécrits dans ce lot, comme prévu à la passation.
