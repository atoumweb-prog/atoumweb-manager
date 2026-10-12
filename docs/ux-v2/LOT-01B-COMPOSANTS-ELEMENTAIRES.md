# Lot 01B — Boutons, champs, icônes, aides, confirmations et notifications

**Statut actualisé le 12/10/2026 : spécification + implémentation pilote du 01B développée dans la PR #87 (draft, base #86), avec non-régression globale validée sur `36ef9e8` ; ce référentiel reste le cahier des charges, pas une attestation d'intégration/fusion.**  
**Code inspecté : `main@eb252d5cbd0e95137eafa2b4759fcbcfd7263eda` ; garde UX-01 spécifique à PR #83 non fusionnée au dernier pointage.**  
**Dépendances :** [Lot 01](LOT-01-FONDATIONS.md), [01A — Tokens visuels](LOT-01A-TOKENS-VISUELS.md), [Matrice existant→V2](LOT-01-MATRICE-EXISTANT-CIBLE.md), [Design system](DESIGN-SYSTEM.md).

## A. Objectif
Rendre les contrôles élémentaires **cohérents, lisibles, accessibles et réutilisables**, en gardant les services/handlers actuels et la logique métier. Le travail est limité à une bibliothèque de présentation et à un atelier isolé ; **ne pas migrer tous les modules dans ce lot**.

**Décision de densité à respecter :** Compact **14 px cible** (15 px dans CSS initial), Confort **16 px**, Confort+ **18 px**. Les petites informations fonctionnelles ne passent pas sous 14 px ; hauteur des contrôles **36/42/48 px** à conserver à ce stade.

## B. Composants et code existants — correspondance vérifiée
| Existant vérifié / documenté | Limite / écart | Comportement cible |
|---|---|---|
| `src/renderer/ui/FieldHelp.tsx` : `span`, `role=note`, `title`, `aria-label`, `tabIndex=0` | Survol/titre natif unique ; pas d'aide détaillée activable par clic constatée sur ce composant | `ContextHelp` ou évolution de `FieldHelp` avec aide courte, détail au clic/clavier, survol prolongé optionnel |
| `src/renderer/ui-consistency-v2.css` : `.app-shell.help-disabled .field-help { display:none !important; }` | **Écart E05** : désactiver le survol retire aussi l'aide clavier/clic, contraire à l'arbitrage V2 | Le réglage désactive seulement l'apparition automatique, **pas l'icône d'aide ni son activation explicite** |
| `src/renderer/operations/OperationIcon.tsx` : SVG/enum `OperationIconName`, `aria-hidden` | Jeu d'icônes existant mais pas l'ensemble des commandes, nom accessible porté par parent | Réutiliser/migrer graduellement, nom d'action dans un bouton, taille via tokens, cohérence visuelle |
| `src/renderer/styles.css` : `.primary-button`, `.secondary-button` ; `ui-consistency-v2.css` harmonise focus/tailles | Styles CSS globaux + variantes par module ; pas de composant universel garanti | API de boutons et conventions d'états partagés **sans supprimer classes existantes** |
| `src/renderer/display-density.css` : hauteur et typographie par densité | Sélecteurs anciens parfois spécifiques, overrides potentiels | Base d'affichage/tailles unifiée, sans changement de comportement métier |
| `src/renderer/App.tsx` : `message`, `messageAction`, `role=status`, `closeMessage` | Notice globalement à un message, type implicite ; `onMessage` texte réutilisé pour succès/erreurs | Notifications `success/info/warning/error` et action liée seulement après effet confirmé ; ne perdre aucune action existante |
| `src/renderer/crm/ProspectsPageV2.tsx` | Exemple d'usage `FieldHelp`, `primary-button`, `form-error role=alert` et `window.confirm` de transition | Utiliser comme cas de revue, sans toucher les transitions Prospect |
| `src/renderer/commercial/QuoteLineEditor.tsx` | Confirmation/états de sauvegarde contextuels ; tests métier à préserver | États `idle/pending/success/error` et invalidation propre sans réinterpréter prix ou droits |
| `src/renderer/commercial/ContractReadPanel.tsx` | `role=status`, erreur copie, action `Copier pour Abby` désactivée sur document non enregistré | Ne jamais annoncer une copie ou un export réussis sans résultat du service ; ne pas prévisualiser un brouillon comme accepté |

**Noms `ContextHelp`, `AppButton`, `AppDialog`, `AppNotice` : propositions d'architecture, pas noms de classes certifiés dans le code.**

## C. Sous-étapes d'exécution de 01B

### 01B.1 — Inventaire de contrôles et conventions
- Classer les composants réellement utilisés par familles : action primaire/secondaire/danger, icône, champ, label, aide, notification, confirmation.
- Relever chaque classe CSS/handler et les styles/densités consommés ; la cartographie exhaustive des **1 921 déclarations JSX audit** n'est **pas exigée dès 01B**, mais les parcours pilotes doivent être listés sans omission.
- Identifier actions serveur, navigation, opérations longues, contrôles d'erreur et confirmations qui ne peuvent être réécrits comme simple affichage.

**Livrable :** tableau `ancien JSX/classe → composant ou variante cible → handler existant → risque métier → test`.

### 01B.2 — Boutons, champs et libellés
- Variantes : primaire, secondaire, discrète, destructive, icône seule (non ambiguë), icône + libellé (action métier importante).
- États : normal, hover, focus clavier visible, désactivé, occupé, erreur métier, succès confirmé.
- Le composant n'implémente pas d'IPC ni de mutation métier ; il reçoit les handlers existants.
- Action async : protéger contre le double-clic quand applicable, préserver la raison du refus et distinguer `désactivé` et `en cours`.
- Champs : lien label/id, aide `?`, description et erreur associées ; ne pas supprimer les validations existantes ni déclencher d'enregistrement implicitement.

**Livrable :** documentation d'API de présentation + atelier démo avec composants réutilisés ou adaptés.

### 01B.3 — Icônes
- Étudier `OperationIcon`, ses noms, SVG, taille et consommateurs avant éventuelle extension.
- Distinguer décor (aria-hidden) et action (nom accessible sur bouton, raccourci indiqué lorsqu'il existe).
- Ne pas substituer arbitrairement les indicateurs métiers par des pictos identiques aux commandes.

**Livrable :** catalogue d'icônes pilote, tailles/rôles/équivalences et tests clavier.

### 01B.4 — Aide contextuelle
**Arbitrage déjà validé par AtoumWeb :** icône `?` toujours activable au **clic et au clavier**, explication courte au survol et détail au clic ; après ~2–3 s de survol, détail automatique **seulement si l'option est activée**.

- Corriger, lors de l'implémentation, **E05** : `.help-disabled` **ne doit pas masquer toute l'icône** ; masquer/désactiver l'aide automatique uniquement.
- Clic : ouverture/fermeture, Escape sécurisé, focus restauré, contenu atteignable par clavier/lecteur d'écran.
- Aide commerciale éditable depuis le Catalogue réutilise la **présentation** mais reste une autre source de données (Lot 04) ; aucun texte juridique/catégorie stocké automatiquement dans `FieldHelp`.
- Pas de popups qui cachent une commande critique, pas de temporisations constantes difficiles à interrompre.

**Livrable :** cas d'essai pour survol court/prolongé, option d'aide, clic, Entrée/Espace, Escape, fermeture et retour de focus.

### 01B.5 — Confirmations et notifications
- **Dialogues UX-01 natifs déjà livrés dans PR #83** : ne pas les remplacer ou contourner par un `AppDialog` V2 avant étude d'Electron et des éditeurs. Les confirmations de suppression, transition, publication, arrêt et abandon sont **des intentions distinctes**.
- Les choix destructifs sont explicites, défaut sûr ; annulation sans mutation métier ; refus/erreur du service réaffiché.
- Un message global ne doit pas cacher une erreur locale ni transformer un échec en succès.
- Préserver une action `Ouvrir dans l'Explorateur` ou équivalente ; afficher un succès **seulement après confirmation réelle**.
- Type/queue/timeout : **proposition**, à décider après inventaire ; ne pas imposer une nouvelle infrastructure sans preuve.

**Livrable :** catalogue de niveaux d'alerte + patrons de confirmation avec conséquences, sans recréer les transactions.

### 01B.6 — Atelier isolé et non-régression
- Créer un exemple technique hors workspace réel, sans données personnelles ou archives clients.
- Montrer le même jeu de contrôles dans les 3 thèmes × 3 densités, avec **Compact 14 px**, focus, contraste et larges/petites fenêtres.
- Conserver les affichages historiques tant qu'un module n'est pas migré ; tests ciblés et suite complète à la livraison.

**Livrable :** recettes et captures datées, avec HEAD et fichiers modifiés.

## D. Recette obligatoire
| Test | Étape | Attendu |
|---|---|---|
| R01B-01 | Afficher tous boutons/champs sous 3 thèmes × 3 densités | Compact texte principal 14 px, Confort 16, Confort+ 18 ; icônes et champs lisibles |
| R01B-02 | Parcourir sans souris | Ordre focus prévisible, Entrée/Espace activent boutons, Escape ferme uniquement affichage sûr |
| R01B-03 | Simuler double clic sur commande async | Une action logique, résultat exact, erreur visible si refus |
| R01B-04 | Désactiver l'aide automatique | L'icône `?` reste **visible et activable au clavier/clic**, pas d'ouverture automatique au survol |
| R01B-05 | Aide activée, survol court / prolongé | Court : aide courte ; prolongé : détail, fermable, non intrusif |
| R01B-06 | Ouvrir l'aide par clavier | Texte accessible, focus restauré à fermeture |
| R01B-07 | Fermer notification informative | Aucune mutation métier, message actionnable conservé tant que pertinent |
| R01B-08 | Déclencher service qui échoue | Aucun faux succès, erreur compréhensible, données saisies intactes |
| R01B-09 | Confirmer puis annuler action destructive pilote | Annulation ne déclenche aucun handler de suppression |
| R01B-10 | Tester `Copier pour Abby` sur contenu non enregistré | Action bloquée si c'est la règle actuelle ; aucun faux document contractuel |
| R01B-11 | Fenêtres étroites/zoom, labels longs et état d'erreur | Pas de bouton essentiel masqué ; aide n'empiète pas durablement sur formulaire |
| R01B-12 | Comparer anciennes classes CSS | Aucun écran non migré n'est dégradé, et styles communs coexistent |

## E. Risques, décisions et limites
- **E05 confirmé par CSS statique** : `help-disabled` masque `FieldHelp` entier ; correction à prévoir en 01B, sans désactiver l'accès volontaire.
- Police principale Compact **14 px cible validée** ; 01A doit d'abord fixer les tokens et vérifier l'effet réel des CSS historiques.
- **E06 à vérifier** : notifications sans typage unifié et réutilisation de `onMessage` ; choisir la stratégie de migration après lecture des appelants.
- **E07 à vérifier** : coexistence `window.confirm`, modales JSX et dialogs Electron ; les scénarios métier ne doivent pas être centralisés avant vérification individuelle.
- La PR #83 reste référence de protection des saisies en cours de revue : aucun bouton « Enregistrer et quitter » n'est livré par 01B ; extension ultérieure 01E.
- Pas de remplacement du Catalogue, des devis, de l'AppShell, des états backend ni des 17 modules dans ce sous-lot.

## F. Sortie du lot 01B
La sortie n'est autorisée que lorsque les composants élémentaires sont testés dans les neuf combinaisons de thèmes/densités, que les cas E05/E06/E07 sont traités, que les handlers métier sont intacts et que le comparatif ancien→nouveau est vérifiable.

**Le présent fichier est le cahier des charges, pas la preuve que 01B a été réalisé.**

## G. Addendum de suivi — 12/10/2026 — transmission vers Codex

**Ne pas modifier rétroactivement les critères R01B-01…12.** La vérité d'implémentation est documentée dans [la PR #87](https://github.com/atoumweb-prog/atoumweb-manager/pull/87) : `docs/UXV2_LOT01B_EXECUTION.md`, `docs/UXV2_LOT01B_GATES.md` et `docs/UXV2_LOT01B_VISUAL_REVIEW.md`. La base de #87 est **la branche 01A de #86**, pas `main`.

### Réellement développé et observé sur Windows
- PR #86, **01A**, draft, 3 thèmes × 3 densités, 14/16/18 px : **300/300** parcours UI Electron, **801/801** tests, typecheck et captures vérifiées sur SHAs documentés. **Pas de nouvelle navigation ni refonte de toutes les fiches**.
- PR #87, **01B**, draft : `FieldHelp` corrigé (37/37), `AppButton/AppTextField` (32/32), 36 icônes avec vraie touche Entrée via Electron (42/42), `AppNotice` (30/30), atelier réuni (51/51, 9/9 captures).
- **Non-régression d'ensemble** de 01B sur `36ef9e8f2af84e2a38922f5f0f67bf569ff81e6a` : les 17 destinations existantes **300/300**, **87/87** fichiers Vitest et **801/801** tests, typecheck **OK** ; zéro erreur console, zéro débordement candidat dans le banc. Ces chiffres sont des résultats sur **ce SHA**, pas une attestation sur tout futur commit.
- **Les composants sont encore pilotes** ; le Manager métier actuel n'a pas été reconstruit en UX/UI V2. Ne pas prétendre « lot 01B clôturé » ni « interface V2 livrée » sans lever les gates restants de la matrice.

### Décision métier R01B-10 — VALIDÉE par AtoumWeb, 12/10/2026

> **« Copier le bloc commercial pour Abby » est interdit tant qu'une modification du devis concerné n'est pas enregistrée ou qu'un enregistrement de ce devis est en cours.**

- Le contrôle doit être **ciblé par `quote.id`**, et ne pas bloquer un devis à cause d'un autre.
- Réutiliser **l'actuel `UnsavedRegistry` / `UnsavedGroup` UX-01** et les signaux `dirty` / `pending`, y compris les éditeurs de lignes et de paramètres imbriqués. Ne pas reconstruire la protection ni demander l'abandon d'un brouillon pour autoriser la copie.
- Présenter un **bouton désactivé avec une explication accessible**, **puis revalider immédiatement à la frontière de l'action** afin de refuser une copie même si React n'a pas encore repeint le bouton.
- Enregistrer/annuler les modifications autorise à nouveau la copie ; l'action sur un devis sans brouillon doit garder son fonctionnement historique.
- **Aucune transmission automatique à Abby**. Le succès n'est annoncé qu'après le succès réel de `contractTerms.copyText`, son rejet doit rester visible. **Ne pas retoucher prix, CGV, clauses, finalisation ou acceptation/signature.**
- Première implémentation sur **#87 HEAD `579ca47276aae9d310011320de92f23771434667`** : `src/renderer/commercial/QuoteAbbyPanel.tsx` emploie `useSyncExternalStore` et `unsavedRegistry.active('quote:'+quote.id)`, désactivation visible, contrôle synchrone au clic ; banc Electron ciblé `scripts/check-ux-v2-lot01b-abby-guard.cjs` ajouté. **Ces changements ne sont PAS encore vérifiés par un typecheck, une recette Electron ou la suite complète Windows. Ne pas annoncer PASS avant preuve.**

### Dépendances / priorités de reprise

1. Codex doit **inspecter les fichiers réels et la PR #87 à son HEAD**, puis auditer l'implémentation Abby et son test (y compris course entre état du registre et activation, modifications d'un autre devis, sauvegarde pending, rejet presse-papiers). Ne pas dupliquer le code déjà en place.
2. Sur un **checkout indépendant et propre**, effectuer `node --check scripts/check-ux-v2-lot01b-abby-guard.cjs`, `node scripts/check-ux-v2-lot01b-abby-guard.cjs`, `npm run typecheck`, `npm test -- --maxWorkers=2` et le contrôle des écrans réels sur base `%TEMP%`. Conserver SHA, logs, nombres de tests et tout échec ; aucune action de CI GitHub nécessaire.
3. Terminer les **gates non prouvés** de `docs/UXV2_LOT01B_GATES.md` : annulation destructrice sans handler, Tab/Espace, erreurs de service, aides en fenêtre étroite. **Ne pas réécrire les garanties UX-01 existantes.**
4. Synchroniser les rapports de #87 avec les résultats, préparer une proposition claire de clôture **sans fusion**. Le lot suivant **01C** (fiches rapides/panneaux) nécessite une instruction distincte.
5. État des dépendances GitHub vérifié au 12/10 : **#81 est fusionnée dans `main`**, **#83 UX-01 reste en draft et indiquée non fusionnable**, **#82, #86, #87 restent draft** ; lire les HEAD réels avant toute opération sur les branches, aucune supposition de merge.

**Prudence :** ne pas confondre le programme documentaire complet des **1 069 scénarios prévus** avec les **801 tests Vitest existants** ; ce sont deux ensembles distincts. Les PR sont des travaux candidats, aucune décision humaine de fusion vers `main` n'est donnée par cet addendum.
