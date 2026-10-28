# Prospection — réalisation des six lots

Autorisation utilisateur du 22/10 : tous les lots séquentiels, sans validation intermédiaire. Disposition confirmée : identité en haut, Identité/logo et Associations à la demande, deux onglets pleine largeur. Cette décision remplace les trois colonnes permanentes du cahier joint. Branche codex/prospection-ux-six-lots ; référence avant : galerie69 captures, baseline50b749b0. Aucun changement de modèle, migration ou donnée réelle autorisé par ce chantier.

## UX-PRO-01 — Annuaire

Vue initiale compacte Entreprise/Action/Échéance/Situation/Ouvrir pour nouvelles préférences ; vues personnelles existantes conservées. Tableau adaptatif, volet superposé en fenêtre étroite, scroll accessible en faible hauteur. Personnalisation en panneau superposé, KPI compacts et définitions, compteur de filtres ; fermeture rend le focus à la ligne. Typecheck réussi ;20 contrôles Electron TEMP, six combinaisons de fenêtre/zoom (1920,1440,1366 ;100/125/150 %), sélection après tri et filtrage. Captures outputs/prospection-ux-lots/lot-01. Aucune règle de compteur modifiée.


## UX-PRO-02 — Creation et contacts

Creation en dialogue natif focalise, champs facultatifs regroupes, annulation protegee ; editeur entreprise ou contact/decideur a la fois, saisies montees. Recherche de contacts existants et association d'un contact sans entreprise via l'API existante avec comparaison de version ; refus de doublon nom/email, aucune reaffectation d'une autre entreprise. Le modele actuel Contact.organizationId est simple : multi-entreprises et role par relation non simules, pas de migration. Typecheck et10 controles Electron TEMP dont garde Rester sur creation, captures1920/1366.

## UX-PRO-03 — Fiche, qualification, besoins et devis

En-tete conserve identite/statut/interet/prochaine action ; deux onglets pleine largeur. Bureau en dialogue natif (focus/Escape), synthese sans controles dupliques ; groupe pertinent initialement ouvert, replis memorises, editeurs toujours montes. Qualification accompagnee de la liste reelle des manques ; prestations retenues et catalogue repliable, chiffrage conserve ; brouillon avec Modifier comme action principale et validation pour envoi distincte. Typecheck et12 controles Electron TEMP dont absence de creation implicite de devis, captures1920/1366. Statuts devis complets a couvrir dans la regression transversale.

## UX-PRO-04 — Actions et historique

Planification et compte rendu/suite dans dialogues natifs dedies avec actions de saisie proches ; Escape garde les brouillons. Annuler la saisie distinct d'annuler l'action programmee ; erreurs presentes dans l'editeur actif. Confirmations Perdu/Archive alignees sur les tokens lisibles ; journal complet a la demande (limite20 retiree), historique filtre par issue/date et tri. Typecheck et10 controles Electron TEMP, dialogue imbrique et archivage annule sans mutation ; captures1920/1366.

## UX-PRO-05 — Reference prospect

Sept groupes de controles conserves, depliables avec comptes des etats reels, grille compacte en lecture et edition, memes six rubriques et source/date/version. Saisies montees au repli ; boutons Enregistrer/Annuler existants accessibles ; chargement avec generation et erreur explicite. Une version externe observee bloque l'enregistrement stale et conserve la saisie ; liste relue avant sauvegarde. La sauvegarde est append-only : pas d'ecrasement des anciennes versions. Limite : l'API publique ne fournit pas de compare-and-swap atomique entre deux saves exactement simultanes ; aucun contrat IPC modifie dans ce chantier. Le theme detache suit deja le parametrage persiste : les premieres captures claires venaient de la fixture ne persistant pas le choix Noir, pas d'une fonction de theme manquante. Typecheck et11 controles Electron TEMP : version unique, repli conservant notes, conflit detecte, theme persiste identique ; captures1920/1366.

## UX-PRO-06 — Parcours commercial

Six colonnes a hauteur selon contenu, cartes compactes, conversion distincte. Ouverture clavier, transitions clavier limitees aux memes options manuelles que le drag, aucune conversion/parcours metier simule. Rappels demain/+7j/date avec heure locale9h, meme API d'actions et liens devis ; date personnalisee dans dialogue avec garde. Definitions de filtres non additifs. Typecheck et13 controles Electron TEMP dont creation unique du rappel, absence de won/lost dans transitions et ouverture clavier ; captures1920/1366.

## Résultat final et régression

Code local : `e40dd1298616b8a635873d7b328d32f4e2f6473c`, branche `codex/prospection-ux-six-lots`. Les six lots sont implémentés successivement ; la validation ergonomique par l'utilisateur reste attendue. Le portable `42b12a93` n'a pas été reconstruit. Aucun main, push, CI hébergée, installateur ou workspace réel modifié.

- Suite complète : **1 666/1 666 tests, 195 fichiers**, puis **85/85 tests ciblés** après les raccordements finaux (préférences, protection des brouillons, CRM et identités).
- TypeScript et build Vite de production vérifiés. Les avertissements Vite sur l'API CJS, le dossier de sortie et la taille du chunk sont conservés ; aucun échec de compilation.
- **118 contrôles Electron** retenus sur les passages réussis : lots 01 à 06 (26, 10, 12, 10, 11, 13), parcours final (23), états de devis (13). Chaque passage inclut les gardes du banc, intégrité/FK et registre 1–71 ; uniquement des bases TEMP. Aucune erreur console dans les passages réussis.
- Annuaire : neuf combinaisons 1920×1080, 1440×900, 1366×768 × zoom 100/125/150 %. Tableau standard contenu, volet contenu, sélection après tri, filtres et vues personnelles persistantes. La présentation personnalisée peut volontairement dépasser la largeur ; aucune préférence utilisateur écrasée pour imposer le nouveau défaut.
- Parcours réel : création restant Nouveau contact ; planification d'action, compte rendu et suite sauvegardés ; association du même Contact existant, sans nouvelle personne ; fermeture conservant la sélection ; restauration des cinq colonnes standard et conservation d'une vue nommée après navigation.
- Clavier natif : Tab/Maj+Tab restent dans le dialogue actif ; Échap avec « Rester » conserve le formulaire sale et ne ferme plus le bureau de fond. Défaut découvert puis corrigé dans `ProspectDialog`.
- Contraste : paragraphes de confirmation mesurés à au moins 4,5:1 dans les trois thèmes. Il ne s'agit pas d'une certification exhaustive WCAG/RGAA.
- Devis avec lignes : brouillon, préparation distincte de l'envoi, envoi attesté, accord de principe distinct de signature, refus gardant le dossier actif, historique converti avec vrai lien Client. Préparation contractuelle via les helpers de fixture existants, sans contournement des gardes des services.
- Référence : saisie conservée lors du repli, sauvegarde d'une seule version, détection d'une version externe avant enregistrement et thème persistant dans la fenêtre détachée.

### Couverture des demandes et adaptations explicites

| Points du cahier | Réalisation / adaptation |
|---|---|
| PRO-01.1–01.2 | Cinq colonnes par défaut pour nouvelles préférences, tableau adaptatif, volet à droite ou superposé, défilements contenus, libellés complets accessibles ; largeur du séparateur mémorisée. Colonne Ouvrir fixée à 76 px selon la demande antérieure ; les colonnes de données restent redimensionnables. |
| PRO-01.3 | KPI compacts, définitions non additives, compteur de filtres actifs et remise à zéro. Les trois filtres existants restent directement accessibles et passent à la ligne quand nécessaire ; pas de filtre métier supprimé ni de nouvel état calculé. |
| PRO-01.4 | Réglages superposés, nom de vue active, contrôles existants et enregistrement automatique expliqués. « Dupliquer » constitue l'enregistrement sous un autre nom ; pas de faux bouton de sauvegarde différée ajouté au système déjà automatique. |
| PRO-01.5 | Action prioritaire reliée directement au groupe d'actions réel ; contact principal avec rôle et coordonnées depuis la source, activité récente, références et associations à la demande. |
| PRO-02.1 | Création focalisée dans un dialogue natif, données complémentaires repliables, tous les champs et validations conservés, annulation protégée. |
| PRO-02.2 / 02.4 | Un éditeur d'identité existant, découpé Entreprise ou Contact/décideur ; coordonnées et contacts séparés. API atomique/concurrente existante inchangée. Aucun champ stocké supprimé. |
| PRO-02.3 | Recherche de Contact existant, association d'une personne sans entreprise avec contrôle de version et blocage des doublons nom/email. Pas de réaffectation automatique depuis une autre entreprise. Le modèle actuel a un seul `Contact.organizationId` et un rôle global : relations multi-entreprises, rôle par relation et détachement contextuel demanderaient un chantier métier ; ils ne sont pas simulés. |
| PRO-03.1 / 03.5 | Identité et synthèse commerciale en haut, panneaux à la demande et deux onglets pleine largeur, conformément au dernier choix utilisateur remplaçant les trois colonnes permanentes. Groupe pertinent ouvert au premier accès et repli mémorisé ; éditeurs montés. |
| PRO-03.2 | Progression de qualification accompagnée de la liste réelle des éléments manquants, mêmes règles de passage et dérogation explicite existante. |
| PRO-03.3 | Résumé des prestations retenues, catalogue repliable, précisions et contrôle avant devis distincts. Sélectionner/enregistrer ne crée ni devis ni Projet. |
| PRO-03.4 | Modification du brouillon prioritaire, validation/envoi/retour distincts et garde contractuelle conservée. Préparation prévisionnelle de Projet conservée dans un groupe replié à la demande, sans nouveau démarrage automatique. Voir la limite métier acceptation/conversion ci-dessous. |
| PRO-04.1–04.2 | Confirmations lisibles ; éditeurs Planifier / Compte rendu / Suite dans un même composant dédié, actions proches et vocabulaire d'annulation distinct. Aucun canal, destinataire, résultat, note ou récurrence retiré. |
| PRO-04.3–04.4 | Journal unique et complet à la demande, historique avec issue/date/tri, lien Client réel ; perte motivée et archivage indépendants. |
| PRO-05.1–05.4 | Six rubriques, lecture/édition/versionnement conservés, sept groupes de contrôles repliables et comptes calculés sur les critères réels. Protection des réponses tardives et conflits observés ; fermeture gardée. Même thème utilisateur enregistré dans les deux accès. |
| PRO-06.1–06.3 | Six étapes, hauteurs selon contenu, rappels rapides et date locale, transitions clavier soumises aux mêmes possibilités manuelles que le drag, conversion hors colonnes. Historiques gagnés/perdus/convertis/archivés conservés sans fusion. |
| UX-COM | Logo, palette et shell conservés ; contraste et focus, boutons explicites, absence de création métier parallèle. Aucun service, IPC public ou migration modifié. |

### Limites métier conservées, à arbitrer séparément

1. **Acceptation et conversion** : contrairement à la formulation du cahier, le service préexistant `QuoteService.accept` convertit/rattache réellement le Prospect au Client lors de l'acceptation. La confirmation l'annonce déjà explicitement. Ce couplage a été conservé et vérifié en fixture, plutôt que modifié silencieusement dans une refonte UX. Rendre ces deux opérations indépendantes demande une décision métier.
2. **Référence concurrente** : les snapshots sont immuables et append-only. Le client vérifie la version avant sauvegarde et bloque les conflits observés ; l'API n'offre pas de compare-and-swap atomique contre deux sauvegardes exactement simultanées. Ajouter ce contrat public sort du périmètre autorisé.
3. **Validation humaine** : tests et captures ne valent pas approbation ergonomique. La matrice complète des thèmes/densités/zooms croisés, le zoom 200 % et la revue exhaustive par lecteur d'écran n'ont pas été exécutés. Les thèmes supplémentaires ont été vérifiés sur les confirmations ; la recette principale reste Noir/Confort.

### Captures et revue

- Avant : `outputs/prospection-galerie-20261022` (69 captures de référence).
- Après : `outputs/prospection-ux-lots/lot-01` à `lot-06`, `lot-final`, `lot-states` (49 PNG).
- Galerie comparative : `C:/Users/AtoumWeb/Downloads/Prospection-refonte-six-lots-20261022/index.html` ; 11 vues avant et les 49 captures après, avec manifeste.
- Commits des lots : `54e9e7f7`, `b3fbc959`, `3d5499ac`, `0eb3fcf3`, `999c9cb4`, `a5a6db9a` ; raccordements et régression `c51aaebe`, préparation prévisionnelle à la demande et captures de devis cadrées `e40dd129`. Baseline locale préservée dans `50b749b0`.
- PR préparée localement dans `PROSPECTION-PR-PREPAREE.md`, pas publiée. La branche hérite aussi du pilote Accueil/shell et Prospection déjà livré, encore absent de `origin/main` : une PR directe vers main inclurait ces travaux antérieurs. La base et l'autorisation de publication/CI doivent donc être décidées explicitement.

## Fichiers touches depuis la baseline

- `PROJECT_STATUS.md`
- `docs/ux-v2/CONSIGNES-ET-REPRISE.md`
- `docs/ux-v2/PROSPECTION-CAHIER-UX-2026-10-22.md`
- `docs/ux-v2/PROSPECTION-SIX-LOTS-2026-10-22.md`
- `scripts/check-shell-home-simplification.cjs`
- `scripts/fixtures/prospection-ux-lots.cjs`
- `src/renderer/crm/ContactMethodsPanel.tsx`
- `src/renderer/crm/ProspectActionsPanel.tsx`
- `src/renderer/crm/ProspectDialog.tsx`
- `src/renderer/crm/ProspectIdentityPanel.tsx`
- `src/renderer/crm/ProspectLinkedContactsPanel.tsx`
- `src/renderer/crm/ProspectNeedsPanel.tsx`
- `src/renderer/crm/ProspectQualificationPanelV2.tsx`
- `src/renderer/crm/ProspectQuotePanel.tsx`
- `src/renderer/crm/ProspectReferenceWindow.tsx`
- `src/renderer/crm/ProspectResearchPanel.tsx`
- `src/renderer/crm/ProspectsPageV2.tsx`
- `src/renderer/crm/prospection-ux.css`
- `src/renderer/ui/ConfiguredDataTable.tsx`
