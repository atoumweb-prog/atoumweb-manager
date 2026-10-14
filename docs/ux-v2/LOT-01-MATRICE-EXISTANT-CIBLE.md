# Lot 01 — Matrice de correspondance existant → UX/UI V2

**Version : V1 — constat documentaire du 09/10/2026.**  
**Nature : vérification statique ciblée du dépôt GitHub, non recette exécutée.**  
**Référence code réel inspecté : `main@eb252d5cbd0e95137eafa2b4759fcbcfd7263eda`.**  
**Complément distinct non fusionné : PR #83, `codex/fix-manager-unsaved-inputs-ux01@5b38cbe`**, revue corrective postérieure aux commits A/B/C. Code de base `main@eb252d5c` inchangé lors de cet inventaire.  
**Ne jamais extrapoler ces observations à toutes les vues.**

## 1. Sources réellement examinées
- `src/renderer/App.tsx` — `NAV_ITEMS`, thème/densité, préférences d'aide, layout, messages, bascule des modules et recherche.
- `src/renderer/main.tsx` — import et ordre de couches CSS, montage de l'application.
- `src/shared/contracts.ts` — types des thèmes/densités, API `settings`, `BootstrapState`.
- `src/renderer/styles.css` — tokens et surfaces des thèmes, barre latérale, chrono, styles globaux.
- `src/renderer/display-density.css` — valeurs des trois densités.
- `src/renderer/ui-typography-consistency.css` et `src/renderer/ui-consistency-v2.css` — régularisations de typographie et de focus.
- `src/renderer/ui/FieldHelp.tsx` — aide courte.
- `src/renderer/operations/OperationIcon.tsx` — icônes typées.
- `src/renderer/crm/GlobalSearch.tsx` — recherche, navigation clavier, recherche asynchrone.
- `src/renderer/crm/ProspectsPageV2.tsx` — vue cible Prospection et segmentation pipeline.
- Sur la branche **UX-01 #83** : `src/renderer/unsaved/unsaved.tsx`, `src/shared/unsavedRegistry.ts`, `src/main/unsaved.ts`. Lire aussi leur bilan `docs/FUNCTIONAL_UNSAVED_INPUTS_UX01_DELIVERY.md` avant intégration.

**Audit de référence complémentaire** : `docs/ux-audit/06-COMPOSANTS-UX-EXISTANTS.md` et `02-CARTOGRAPHIE-ECRANS.md` sur la branche `docs/ux-audit-manager-v1`. L'audit lui-même est documentaire, pas l'état actuel garanti.

## 2. Matrice traçable par sous-lot
| ID | Élément | Constat code/audit (niveau de preuve) | Cible V2 | Stratégie / risque | Critère testable |
|---|---|---|---|---|---|
| L01A-01 | Thèmes | **Vérifié source** : `THEME_NAMES = atoumweb/noir/blanc` ; `App.applyTheme` écrit `documentElement.dataset.theme`. `styles.css` définit palettes. | Conserver trois thèmes et rendre composants communs compatibles. | Réutiliser les variables, pas remplacer la charte existante en masse. | Tester composants de démonstration dans chaque thème et le répertoire des 17 vues non modifiées. |
| L01A-02 | Densités | **Vérifié source** : `compact/comfort/comfort_plus`, via dataset et `display-density.css` ; code actuel base 15/16/18 px. | **Décision E01 : Compact cible 14 px, Confort 16 px, Confort+ 18 px** ; trois modes conservés. | Tester la modification CSS Compact uniquement, contrastes et anciens overrides ; aucune taille fonctionnelle sous 14 px. | Tester neuf combinaisons, champs, actions, petits écrans. |
| L01A-03 | Palette et tokens | **Vérifié source** : `--sidebar`, `--surface`, `--text`, `--accent`, `--border` et `--ui-*` ; accent actuel or `#b9965c` en thème AtoumWeb. | Palette de marque et couleurs métier maîtrisées, variantes accessibles. | **Ne pas forcer** automatiquement la palette rouge/jaune/bleu/vert comme couleurs d'interface ou renommer tous les tokens. | Tableau ancien→nouveau rôle sémantique et contraste mesuré. |
| L01A-04 | Police/échelle | **Vérifié source** : pile Inter/system et variables de densité. | Typographie lisible sur tous les modules. | `ui-typography-consistency.css` et styles historiques peuvent se contredire ; pas de certificat visuel. | Inventaire des priorités/surcharges par capture sans changer la police avant arbitrage. |
| L01A-05 | CSS global | **Vérifié source** : `main.tsx` importe de nombreuses feuilles, `ui-consistency-v2.css` est chargée en dernier parmi CSS globales de l'entrée. | Système de tokens progressif. | Priorité et `!important` à mesurer ; éviter explosion de `overrides`. | Tableau fichiers→tokens→effets, diffs visuels par zone. |
| L01B-01 | Aide courte | **Vérifié source** : `FieldHelp({text})` = `span` focalisable `role=note`, `title`, `aria-label`. | `?` court puis détail au clic/clavier et survol prolongé paramétrable. | Étendre le composant sans empêcher lecture au clavier/lecteur d'écran ; autres aides locales à inventorier. | Focus/tab/clic/hover et option aide désactivée. |
| L01B-02 | Icônes | **Vérifié source** : `OperationIcon` contient type et dessin SVG pour de nombreuses actions ; App affiche encore des caractères de contrôle textuels. | Système cohérent de noms/tailles/contrastes d'icônes. | Reprendre `OperationIcon` et conventions existantes, pas ajouter une bibliothèque concurrente sans étude. | Vérifier libellé accessible et icône + texte pour action grave. |
| L01B-03 | Boutons | **Vérifié source** : classes `primary-button`, `secondary-button` et styles globaux ; de nombreux JSX locaux dans audit. | États nommés, tailles/espacements uniformes, confirmations spécifiques. | Identifier actions natives avant wrapper ; risque de toucher aux classes historiques et aux règles métier. | Bouton normal, occupé, erreur, disabled, focus, clavier. |
| L01B-04 | Notifications | **Vérifié source** : App a `message` et `messageAction`, une notice globale avec action possible ; erreurs locales restent séparées (audit). | Succès/erreur/avertissement cohérents et non trompeurs. | Ne pas convertir tous les messages en succès ; conserver actions existantes. | Échec réel n'affiche pas succès ; close conserve état métier. |
| L01C-01 | Navigation vers fiche | **Vérifié source** : App utilise `activePage` + cibles (`crmTarget`, `quoteTarget`...), montage conditionnel. | Fiche rapide puis Agrandir, état de contexte restauré. | Infrastructure commune/pilote isolé d'abord ; adoption métier dans Lots 03+. Risque de remount/brouillon à coordonner avec UX-01. | Cible et onglet conservés entre fiche rapide/complète, sans perte de draft. |
| L01C-02 | Barre latérale | **Vérifié source** : App affiche `NAV_ITEMS` (17), bouton `sidebarCollapsed`, rail actuel textuel. | Rail d'icônes + menus/favoris. | **Implémentation métier = Lot 02** ; Lot 01 livre tokens/composants et atelier, ne supprime aucune navigation. | Pilotage/maquette assure accès aux 17 modules. |
| L01C-03 | Panneaux | **CONSTAT AUDITÉ** : beaucoup de panneaux/agrandissements locaux et redimensionneurs hétérogènes. | `QuickDetailPane` et `ResizableSplitView` adaptables. | API et préférence à définir avant migrations ; éviter changements globaux de flex/scroll. | Resize, petit viewport, restauration, panneau masqué, flux clavier. |
| L01D-01 | Tableaux | **CONSTAT AUDITÉ** : tables/filtres/largeurs souvent implémentés par module. | Composants/vues personnalisées par écran. | Ne pas imposer le même layout au builder CGV/Page ni changer un calcul métier. | Tri/filtre/order/width conservés, réinitialisation et comportement quand colonne supprimée. |
| L01D-02 | Persistance vues | **Vérifié source** : `settings.setTheme/setDisplayDensity/setShowHoverHelp` sont déjà persistées par IPC ; **aucune persistance transverse de toutes les colonnes établie**. | Sauvegarde automatique des préférences de disposition seulement. | Portée (utilisateur/poste/workspace) à confirmer ; migration/réconciliation de clés de vues. | Redémarrage, nouvelle version UI, reset, aucune mutation SQL métier. |
| L01E-01 | Brouillons | **Vérifié sur branche #83** : `UnsavedGroup`, `useUnsavedDraft`, `requestUnsavedExit`, `unsavedRegistry`. | Étendre à autres éditeurs et indicateur non enregistré. | **PR #83 non fusionnée** ; ne pas ajouter deuxième registre ; bien distinguer dirty/pending. | En cas de refus, valeurs et contexte restent ; pending interdit la fermeture. |
| L01E-02 | Cycle natif | **Vérifié sur branche #83** : garde renderer `beforeunload`, état publié à Electron, fenêtre détachée et quit coordonnés. | Protéger navigations, reload, fermeture, workspace. | Respecter le lifecycle livré, capacités par fenêtre et limitation crash. | Fermeture annulée conserve BD et champ ; chaque fenêtre participe. |
| L01E-03 | Sortie sauvegardée | **Vérifié sur branche #83** : `UnsavedRegistry.request` ne connaît pas de callback de sauvegarde ; confirme sortie et invoque discard. | Trois choix V2 : Enregistrer et quitter / Continuer / Quitter sans enregistrer. | **Nouvelle extension, non livrée** ; service save par éditeur + confirmation d'enregistrement ; fallback deux choix si non sécurisé. | Save réussi puis navigation ; échec/conflit laisse l'éditeur ouvert. |
| L01F-01 | Ateliers démo | **Vérifié source** : `DemoPanel` dans `workflow`, rendu sur Réglages ; utilité réelle à inventorier. | Atelier UX isolé de test avec données fictives. | Ne pas détourner un workspace métier ; éviter API réelles. | Aucun appel qui modifie CRM/Devis/Projet, aucun fichier en Validation-MSI. |
| L01F-02 | Accessibilité | **Vérifié source** : styles `:focus-visible`, labels recherche, navigation fléchée/Entrée/Échap dans `GlobalSearch`. | Généraliser comportements accessibles, focus, annonces. | Preuves locales ≠ couverture complète ; ne pas élargir les garanties sans campagne. | Tests tab/focus/lecteur d'écran de base, contrastes, fenêtres modales. |

## 3. Précisions sur les valeurs existantes (à préserver tant qu'aucun arbitrage contraire n'est acté)

**Densités courantes observées dans `display-density.css` :**

| Réglage | Base | Secondaire | Petite taille | Hauteur contrôle | Espacement/panneau |
|---|---:|---:|---:|---:|---|
| Compact | 15px | 14px | 14px | 36px | 8px / 16px |
| Confort (valeurs racine) | 16px | 15px | 14px | 42px | 12px / 22px |
| Confort+ | 18px | 16px | 14px | 48px | 16px / 26px |

Source CSS commentée : « aucun texte fonctionnel ne descend sous 14 px » ; **cela ne garantit pas le rendu de 100 % des anciens CSS**.

### E01 — Décision validée le 09/10/2026, mise en œuvre non commencée
La V1.3 proposait une taille courante 14–15 px. AtoumWeb a tranché pour une **cible Compact 14 px** (code actuel 15 px), tout en **conservant Confort 16 px et Confort+ 18 px**. Les hauteurs actuelles des contrôles restent 36/42/48 px. La table des valeurs ci-dessus décrit **l'existant**, pas la cible. Contrôle nécessaire : lisibilité de 14 px dans les trois thèmes, ancien CSS, zoom et petits écrans, sans descendre sous 14 px pour les textes fonctionnels.

### E02 — Logo et palette
Direction « triangles imbriqués » retenue mais **asset et positions exactes encore non approuvés**. Le thème par défaut utilise un accent or `#b9965c` ; la palette métier `#D62828 / #F2B705 / #1565C0 / #198754` ne justifie pas le remplacement automatique de `--accent`. Valider séparément un logo et sa déclinaison ; éviter de changer les sémantiques d'état.

### E03 — Périmètre de persistance des vues
Décision UX : auto-enregistrer les dispositions. **À déterminer avant 01D** : préférence liée à l'installation, au workspace ou à l'identité utilisateur ; mode de récupération et remise par défaut, migrateur de clés, conflit de fenêtres.

### E04 — « Enregistrer et quitter »
Décision UX déjà actée, mais **non développée** dans la PR #83. Avant 01E : définir contrat `save` par éditeur, contrôle de validation/versions/conflits, scénario async et pending ; aucun save implicite ni publication. L'existant doit rester la base.

## 4. Matrice d'actions UX-01 pilote (référentiel de test, pas couverture de tous les modules)
| Déclencheur | État | Règle V2 | Preuve actuelle |
|---|---|---|---|
| Déplacement de panneau | Vue modifiée, saisie intacte | Persister uniquement la disposition, pas le formulaire | Cible, future 01C/D |
| Saisie puis changement de fiche | dirty | Avertir ; conserver saisie si « Continuer » | Pilote #83 Prospection/Devis |
| Fermeture modal/panneau | dirty | Protéger domaine en cours uniquement ; **section réduite ne démonte pas ses éditeurs et conserve brouillon** | #83 revue `5b38cbe` |
| Enregistrer A pendant édition B | dirty dans deux sections | Sauver A, préserver B, conflit explicite si même champ | #83A |
| Refresh serveur pendant brouillon | valeur locale divergente | Pas d'écrasement silencieux ; conflit visible | #83A/B |
| Quitter pendant sauvegarde | pending | Bloquer jusqu'à fin confirmée | #83B/C |
| Quitter/recharger Electron | dirty dans 1+ fenêtres | Avertir une fois, autorisation liée à révision exacte | #83C |
| Changer workspace | dirty | Garder workspace A et brouillon jusqu'au redémarrage contrôlé | #83C |
| « Enregistrer et quitter » | dirty et éditeur validable | Valider/sauver, quitter seulement après succès | **Non livré, cible UX2-DATA-002** |
| Archivage/classement Prospect | dirty | Garder le groupe de brouillons et avertir avant mutation destructive | #83 revue `5b38cbe` |
| Suppression ligne Devis | dirty voisin / concerné | Avertir **avant** suppression et protéger le brouillon contractuel voisin | #83 revue `5b38cbe` |
| Composition avec UX-16/UX-03 #81 | fusion de branches | Conserver garde UX-01 **et** protocole de restauration #81 ; conflit `src/main/ipc.ts` à résoudre explicitement | Copie de simulation 87/87 ciblés + 177/177 natifs, **pas fusion** |
| Arrêt forcé/crash | dirty | Aucun mécanisme de récupération présumé ; hors lot | Limite #83 |

## 5. Définition de « prêt pour 01A »
1. Le code de travail est identifié par SHA ; aucun diff concurrent UX-01 non fusionné n'est écrasé.
2. Une table de tokens existants et des CSS prioritaires est documentée.
3. **E01 est tranché** : implémentation future Compact 14 px, Confort 16 px, Confort+ 18 px ; organiser la validation visuelle avant livraison.
4. Maquette de l'atelier isolé prévue, sans écriture dans des dossiers métier.
5. Captures/rendus référentiels des trois thèmes × trois densités et fenêtres compactes planifiés avant modification.
6. Déploiement par petits composants avec possibilité de rollback et une recette comparative.

**Ce document ne fournit pas encore la cartographie intégrale de 1 921 déclarations de contrôles recensées par l'audit. La cartographie contrôle→handler→IPC→service→test sera effectuée écran par écran avant chaque lot métier.**

## 6. Détail technique vérifié pour 01C (extension à la matrice)
Voir [LOT-01C-FICHES-PANNEAUX.md](LOT-01C-FICHES-PANNEAUX.md) ; observations **statiques** sur `main@eb252d5c`, aucune recette réalisée.

| Repère | Fichier | État observé | Préservation / cible |
|---|---|---|---|
| L01C-PROS | `src/renderer/crm/ProspectsPageV2.tsx` | `selectedId`, `deskModeId`, séparateur 66% avec pointeur, clavier, reset double-clic | Même objet/onglet après agrandir/réduire ; UX-01 #83 protège les brouillons et les sections repliées |
| L01C-CLI | `src/renderer/crm/ClientsPage.tsx` | `largeView`, `activeTab`, séparateur 68% clavier, reset | Corréler vue rapide et grande, ne pas vider l'éditeur en changeant de sélection ; UX-01 à raccorder ultérieurement |
| L01C-CAT | `src/renderer/commercial/CatalogPage.tsx` | `detailExpanded`, `detailSplitPercent=40`, resize au pointeur | Harmoniser la commande clavier, les bornes, l'option reset et la persistance ; versions commerciales intactes |
| L01C-QUO | `src/renderer/commercial/QuotesPage.tsx` | Panneau latéral avec backdrop, `detailExpanded`, preview séparée | Ne pas forcer un séparateur non attesté ; conserver les gardes UX-01 et les sous-formulaires |
| L01C-PRO | `src/renderer/projects/ProjectsPage.tsx` | `detailTab`, `productionSplitPercent=40` et atelier technique | Respecter les mises en page spécialisées et les brouillons du Projet, non couverts par #83 |
| L01C-OPS | `src/renderer/operations/OperationsPage.tsx` | Séparateurs Demandes=38%, Interventions=34%, vues agrandies | Préférences distinctes, remise à défaut par vue ; ne pas affecter cycles/packs/chrono |
| L01C-CSS | `prospect-detail.css`, `client-detail.css`, `commercial.css`, `projects.css`, CSS opérationnels | Breakpoints, panels sticky, scroll et CSS overrides par module | Tester petites fenêtres / zoom / scroll avant unification |

**Règle :** les pourcentages ci-dessus sont **des défauts actuels locaux**, pas une valeur UX V2 unique. Préserver la possibilité de travailler en écran réduit et le réglage auto mémorisé sans saisir de contenu métier dans les préférences.
