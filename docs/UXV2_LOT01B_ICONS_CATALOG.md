# UX/UI V2 — 01B.3 — Catalogue pilote d'icônes, sans duplication de moteur

**Date : 10/10/2026 — spécification d'implémentation du pilote, pas recette Windows effectuée.**

## Inventaire constaté

Source unique actuelle : `src/renderer/operations/OperationIcon.tsx`, type exporté `OperationIconName`. **36 noms disponibles**, chaque SVG est un pictogramme de présentation avec `aria-hidden="true"`, `focusable="false"`, `stroke="currentColor"` et taille par défaut **20×20 px**. Les icônes **ne définissent jamais une commande** ni une transition métier ; leur parent porte le libellé/action.

| Famille de repérage pilote | Noms réutilisables existants | Rôle |
|---|---|---|
| Navigation / contrôle | `expand`, `collapse`, `chevron-up`, `chevron-down`, `close`, `refresh`, `external-link` | L'élément interactif **porte le nom accessible**, pas le SVG |
| États / priorité | `inbox`, `alert`, `shield-check`, `check-circle`, `hourglass` | Ne jamais substituer le seul pictogramme au texte d'état |
| Production / temps | `wrench`, `clock`, `maintenance`, `bolt`, `repeat` | Aucun déclenchement de timer depuis le dessin |
| Ressources / documents | `receipt`, `file-text`, `folder`, `archive`, `database`, `upload`, `package`, `code`, `image`, `server` | Libellés d'action de téléchargement/archivage exigés |
| Gestion / commerce | `euro`, `piggy-broken`, `gift`, `wallet`, `user`, `chart`, `calendar` | Couleurs et sens métiers préservés ; icône décorative |
| Présentation | `sun`, `moon` | Thèmes seulement, sans implication d'état de données |

**Aucune icône ajoutée, aucun nouveau package, aucun renommage** d'icône existante. Le site ne doit pas confondre les mêmes pictogrammes pour `état` et `action` : l'action doit avoir un libellé explicite.

## API pilote 01B.2 + 01B.3

- **Bouton icône seule** : `<AppButton icon={<OperationIcon name="expand" />} aria-label="Agrandir la fiche" onAction={existingHandler} />`. Son `aria-label` est requis par le type `AppButtonProps` pour cette variante.
- **Bouton texte + icône** : `<AppButton icon={<OperationIcon name="refresh" />} onAction={existingHandler}>Actualiser la vue</AppButton>`. Le texte rend le rôle compréhensible.
- **Icône décorative dans un indicateur** : `<OperationIcon name="clock" />` accompagnée d'un texte de statut accessible.
- **Taille pilote** : 20 px, à ajuster uniquement en contexte (bouton/panneau) et sans changement de sens. Le fond/focus/lisibilité sont portés par `.aw-ui-button`, les trois thèmes et les trois densités déjà existants.

Les exemples ci-dessus sont des **patrons d'API**, pas l'intégration dans une fiche réelle. Un handler de suppression, de paiement, de publication ou de restauration **ne doit pas être migré simplement pour mettre une icône**.

## Recette préparée

`scripts/check-ux-v2-lot01b-icons.cjs` charge le vrai `OperationIcon` et le vrai `AppButton` dans React/Chromium/Electron, tous les 31 CSS directs de `main.tsx`, sur un profil **OS TEMP sans SQLite, utilisateur ni contrat**. La galerie rend les **36 symboles** et deux usages pilote (icône seule avec `aria-label`, texte + icône). Elle vérifie :
- SVG décoratif `aria-hidden=true`, `focusable=false`, 36 SVG rendus ;
- 20×20 px et hauteurs de commande de 36/42/48 px dans **3 thèmes × 3 densités** ;
- nom d'action accessible porté par le bouton, vraie activation clavier par Entrée et déclenchement du bon callback ;
- répertoire temporaire supprimé avec indication `Fixture cleaned: true`.

**État de recette Windows :** premier passage sur `3eca479` : les neuf variantes et les SVG passent, mais **échec réel** `Timeout Keyboard Enter action` ; la recette entière est donc **NON VALIDÉE**. Hypothèse prioritaire : focus Electron de la fenêtre masquée placé après le focus DOM. Le banc a été corrigé pour ouvrir et focaliser la fenêtre avant le bouton, puis prouver la réception native de `Enter` et l'action unique ; **la correction n'a pas encore été relancée sur Windows**. Les commandes métier et les 36 SVG historiques restent inchangés. Détails et suivi dans `UXV2_LOT01B_EXECUTION.md`.

**L'incrément 01B.3 reste pilote :** aucun remplacement d'icônes métier, aucun catalogue commercial modifié, aucune migration, aucun écran de production réécrit. Les tests complets, 01B.5 (notifications/confirmations), 01B.6 (atelier) et la recette des 12 cas du référentiel sont distincts.
