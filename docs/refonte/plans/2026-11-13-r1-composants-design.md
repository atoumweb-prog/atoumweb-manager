# R1 Composants partagés : design

Statut : décidé sur instruction de Carlos le 13/11/2026 (« enchaîne directement sur R1, sans attendre »). Références : `docs/refonte/DESIGN.md`, `C:\DEV\Livrables\Cadrage-parcours\CADRAGE.md` (sections 4, 10 et 13).

## Intention

Fournir, avant les lots d'écrans R2+, les composants partagés dont le fil **« Prochaine étape »** a besoin, alignés sur les tokens de R0, et remettre en état les trois scripts de recette natifs cassés avant R0.

## Principe qui prime

Le parcours « Prochaine étape » est une **surcouche** : aucun écran, onglet ni fonction n'est supprimé ; chaque étape réutilise les outils existants. R1 **ne branche aucun composant dans un écran existant** : cela relève des lots R2+, un écran par lot, sur accord.

## Buts, non-buts, anti-buts

- Buts : trois composants partagés (bloc d'action, bouton « Plus », en-tête de dossier) et un `StatusPill` à tokens ; bloc de contrôles partagés (`aw-ui-*`) aligné sur les tokens ; `!important` réduits dans les fichiers touchés ; trois scripts de recette réparés ; tests.
- Non-buts : aucune règle métier (relances, échéanciers, CM2C, création du projet) ; aucun branchement dans les écrans ; aucune suppression d'écran ; aucune migration.
- Anti-but : une régression visible hors des composants nouveaux et des couleurs d'erreur alignées sur les tokens.

## Approches considérées

- **A. Composants autonomes, sans branchement, testés en rendu statique et par un banc natif** (retenu) : surface minimale, aucun risque pour les écrans, cohérent avec « un écran par lot ».
- B. Brancher d'emblée le bloc « Prochaine étape » sur la fiche prospect : plus visible, mais fait un lot d'écran sans validation et mêle logique métier et composant.
- C. Réécrire tous les boutons et pastilles historiques (`.primary-button`, `.status-pill`) sur les tokens : 494 et 40 usages, risque de régression large ; reporté aux lots d'écrans.

## Design retenu

**Composants** (dans `src/renderer/ui/`, sans logique métier, sans `!important`) :
- `StatusPill` : pastille d'état, tons `success`, `warning`, `danger`, `info`, `accent`, `neutral`, couleurs `--aw-*-soft-bg` et `--aw-*-soft-fg` (contraste vérifié par R0).
- `NextStepCard` : bloc d'action. Entrées : titre, raison, ton, action principale, actions secondaires, alertes. Libellé fixe « Prochaine étape ». Réutilise `AppButton`.
- `MoreMenu` : bouton « Plus » avec menu (`aria-haspopup`, `aria-expanded`, Échap qui referme et rend le focus, flèches et Début / Fin, fermeture au clic extérieur). La logique est une fonction pure testée sans navigateur.
- `RecordHeader` : en-tête de dossier. Entrées : titre, sous-titre, pastille d'état, actions, éléments du menu « Plus », emplacement pour le bloc « Prochaine étape ».

**Tokens et styles** : `ui/next-step.css` n'utilise que les variables `--aw-*`, `--surface`, `--border`, `--text`, `--muted` et les variables de densité ; aucune valeur de couleur écrite en dur.

**Contrôles partagés** : le bloc « 01B.2 aw-ui-* » (boutons, champs, notices) sort de `ui-consistency-v2.css` vers `ui/shared-controls.css`, importé juste après (même ordre dans la cascade), avec les couleurs d'erreur et de danger sur `--aw-danger-*`. Seul changement visible voulu : la teinte des bordures et fonds d'erreur suit désormais les tokens.

**`!important`** : zéro dans tout fichier nouveau (garde-fou par test). Dans `ui-consistency-v2.css`, les cinq `!important` de « Supplanter les tailles historiques » sont retirés après vérification que la règle d'origine (`commercial.css`) a la même spécificité et vient avant ; la taille calculée est mesurée dans l'application avant et après.

**Scripts de recette** : `check-contract-library-ui.cjs` (alias du worker PDF), `check-unsaved-inputs-ui.cjs` (le champ « contexte » est une liste déroulante depuis le lot 6), `check-ux-v2-lot01a-real-ui.cjs` (le contrôle `#header-mode` n'existe plus). Chacun est relancé ; s'il échoue plus loin pour une autre cause, la cause est notée sans masquer l'échec.

## Contraintes

Aucune dépendance npm ajoutée. Pas de commit sans test vert. Captures Noir / Confort. `atoumweb-design` obligatoire pour toute modification d'interface.

## Laissé à l'exécutant

Noms internes des classes, structure des fixtures de test, mise en forme du banc de capture.
