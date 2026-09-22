# AtoumWeb Manager — Suivi du projet

## État canonique — 22/09/2026

> Cette section prime sur les entrées historiques plus bas. Source de vérité partagée ChatGPT / Codex MSI.

### Socle courant

- Branche de base fonctionnelle : `fix/pre-phase5-commercial-ux` au commit `3494a76`.
- Phase 6 intégrée dans ce socle.
- Phase 5 Administration / Finance : **différée, pas supprimée**.
- Branche active : `feature/project-blueprints-v1`.
- PR active : **#73 — Projet V2 — Blueprints de production et atelier AtoumWeb**.
- Branche Phase 7 existante en parallèle : `feature/phase-7-analytics-v1` / PR #71 ; ne pas la poursuivre sans la réaligner sur Projet V2.
- Migrations sur Projet V2 : **30**.
- `main` reste historique et très en retard par rapport au socle de travail ; ne pas l'utiliser comme base de développement courant.

### Projet V2 — réalisé

- [x] devis accepté → projet généré depuis les blueprints Catalogue ;
- [x] snapshot projet indépendant du modèle après création ;
- [x] phases repliées + étapes numérotées ;
- [x] glisser-déposer des étapes ;
- [x] plan / fiche redimensionnables ;
- [x] barre latérale escamotable et masquée automatiquement en Production ;
- [x] timer directement rattaché à une étape ;
- [x] notes et actions libres dans chaque étape ;
- [x] ressources / technique / temps ouverts en fenêtre sans quitter Production ;
- [x] pages renommables directement ;
- [x] validation avant clôture d'une phase et passage groupé de toutes les étapes en Terminé ;
- [x] undo / redo du travail de production ;
- [x] aide contextuelle des champs désactivable dans Réglages ;
- [x] coffre d'accès projet / étape chiffré avec Electron `safeStorage` ;
- [x] couche de cohérence UI transverse pour rapprocher les anciens écrans des pages récemment recettées.

### Validation

- [x] recette Projet V2 antérieure : typecheck/tests signalés verts sur MSI.
- [ ] revalider le HEAD actuel après le dernier lot : aide / actions / coffre sécurisé / migration 30 / cohérence UI globale.
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run package`
- [ ] recette visuelle Validation-MSI : Projet + anciens écrans principaux + trois thèmes.

### Prochaine action

Sur MSI :

```powershell
cd C:\DEV\01_PROJETS\AtoumWeb\atoumweb-manager
git fetch --all --prune
git switch feature/project-blueprints-v1
git pull --ff-only
npm run typecheck
npm test
npm run package
C:\DEV\Lanceurs\AtoumWeb-Validation-MSI.cmd
```

Voir aussi : `docs/HANDOFF_CODEX_MSI.md`.


## Lot UX commercial avant Phase 5 — 19/09/2026

Branche `fix/pre-phase5-commercial-ux`, créée depuis `fix/prospect-recipe-ux-v2` à `3bc0f19`. Phase 5 en pause ; Phase 6 non intégrée. Aucune migration modifiée.

- [x] Fiches Prospect et Client : mode compact et vue agrandie avec défilement interne et hauteur disponible corrigée.
- [x] Couleurs métier des fiches, cartes et champs blancs ; température retirée du texte des cartes Prospect sans changer la donnée.
- [x] Qualification Prospect : accès direct aux champs manquants ; raccourcis vers besoin et relance.
- [x] Fiche Client : coordonnées prioritaires, éléments liés réellement présents, échéances conditionnelles et accès secondaires repliés.
- [x] Relation Client : cinq états distincts de la température Prospect, changement rapide, couleur de la fiche et des lignes, historique de transition.
- [x] `npm run typecheck` et `npm test` : 30 fichiers / 135 tests réussis.
- [ ] Recette visuelle Windows finale sur le profil de validation, plusieurs résolutions et trois thèmes.

Prochaine action : terminer la recette visuelle du lot avant toute validation finale ou fusion. Aucune migration ajoutée.

> Source de vérité partagée entre AtoumWeb, ChatGPT et Codex. À mettre à jour après chaque étape significative.

## État général

- **Version cible** : V1
- **Dépôt** : `atoumweb-prog/atoumweb-manager`
- **Branche Git historique** : `main` (non utilisée comme base courante tant que le socle n'est pas consolidé)
- **Socle fonctionnel courant** : `fix/pre-phase5-commercial-ux`
- **Chantier actif** : `feature/project-blueprints-v1` — PR #73
- **Statistiques en attente d'intégration** : `feature/phase-7-analytics-v1` — PR #71
- **Migrations courantes sur Projet V2** : 30
- **Principe directeur** : une donnée métier possède une source unique ; les autres écrans la référencent sans duplication.

### Stabilisation transverse — 15/09/2026

- [x] migration SQLite 19 : pipeline enrichi, température neutre, qualification, coordonnées multiples, actions structurées et documents client
- [x] ancien libellé « Dossier partagé » retiré de l’interface ; l’identité, les besoins, les devis et les projets restent des données liées
- [x] parcours devis « en préparation → à envoyer → envoyé » sans modifier le statut technique `draft` avant envoi
- [x] fichiers client stockés hors SQLite sous `clients/<client-id>/Documents`, métadonnées en base
- [x] correction du paquet Windows vide : renderer désormais inclus dans `app.asar`
- [x] validations automatisées : 28 fichiers, 118 tests, TypeScript et packaging
- [ ] recette fonctionnelle et visuelle Windows du scénario Boulangerie Martin

### Prospect Workflow V2 — 15/09/2026

Branche : `feature/prospect-workflow-v2`  
Base fonctionnelle : `fix/recette-commerciale-coherence` au commit `b30d2a89e0515f4193e4958097be838fbd0eba44`.  
Aucune fusion dans `main`.

- [x] migration 20 : origine commerciale, démarrage de prospection, qualification V2 et référence `decision_maker_contact_id`
- [x] parcours clarifié : `Nouveau contact → À qualifier → Besoin à identifier → Devis à préparer`
- [x] bouton explicite `Démarrer la prospection` et ouverture de la fiche de travail bureau
- [x] qualification conditionnelle selon l’origine du contact ; le besoin détaillé n’est plus demandé à cette étape
- [x] `Projet & solution AtoumWeb` raccordé au catalogue existant avec ajout de prestation en une seule action
- [x] contrôle avant devis intégré à l’étape `Besoin à identifier` ; ancien placeholder séparé supprimé
- [x] validation téléphone/email centralisée via `contactValidation`
- [x] décisionnaire rattaché à un vrai `contacts.id` ; coordonnées via `contact_methods`, anciennes colonnes conservées seulement pour compatibilité de migration
- [x] `Compact / Confort / Confort +` disponible dans les Réglages
- [x] température commerciale visible sur la carte, le panneau rapide et la fiche bureau
- [x] rappels rapides `demain / +7 jours / date précise` raccordés à `crm_actions`
- [x] suivi devis recentré sur `Devis à préparer → Devis à envoyer → En attente de retour`
- [x] après envoi : devis, montant, validité, délai restant et prochaine relance mis en évidence dans la fiche et la vignette pipeline
- [x] issues distinctes après envoi : `Accepté / signé`, `À modifier / Négociation`, `Refusé`; refus du devis distinct du statut Prospect `Perdu`
- [x] alerte de validité du devis dans les 7 derniers jours
- [x] ancien composant de qualification V1 supprimé
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] recette visuelle Windows sur le workspace de test propre

La CI de cette branche a été branchée sur le workflow GitHub. Les runners disponibles dans l’environnement GitHub actuel n’exécutent cependant aucune étape (`runner_id` nul/0), y compris avec `windows-latest`; un statut rouge sans étape n’est donc pas un résultat de compilation ou de test. La validation TypeScript/tests doit être exécutée localement tant qu’un runner utilisable n’est pas disponible.

Périmètre volontairement différé : refonte profonde de l’éditeur de devis et système d’import des packs d’offres `.atoum`. Les offres/contrats seront d’abord préparés comme configuration métier, puis le Manager évoluera selon le contrat technique commun validé.

### Correctifs de recette UX Prospect — 16/09/2026

Branche : `fix/prospect-recipe-ux-v2`  
PR : #67, conservée en brouillon.  
Base : `feature/prospect-workflow-v2` au commit validé `8284e1fc64c53bb4e5976a58c1fdb52715c5c671`.  
Aucune fusion dans `feature/prospect-workflow-v2` ni dans `main` avant validation technique et recette visuelle.

- [x] taille de texte fonctionnelle minimale portée à 14 px, y compris en densité Compact
- [x] fiche de travail Prospect élargie et agrandie sans plein écran forcé ; densité verticale réduite
- [x] teinte commerciale conservée sur la fiche avec champs neutres et contours liés à la température
- [x] interlocuteur principal ajoutable ou modifiable après création du prospect
- [x] décisionnaire sélectionnable parmi les Contacts liés, créable comme nouveau Contact ou conservé inconnu
- [x] autres Contacts d’entreprise avec fonction libre (`Gérant`, `Patron`, `Banquier`, `Comptable`…) sans détourner le libellé d’une coordonnée
- [x] bloc Coordonnées pleine largeur : propriétaire distinct de l’usage, plusieurs téléphones/emails par Contact
- [x] Actions / Relances enrichies avec cible Contact, motif, date, heure, contexte et récurrence avancée
- [x] compte rendu d’action en pleine largeur avec suites proposées selon le résultat
- [x] refus catégorique : classement Prospect `Perdu` sans recréation automatique d’une récurrence
- [x] informations nécessaires au devis transformées en checklist conservant les réponses et les points à obtenir plus tard
- [x] historique du dossier replié par défaut avec aperçu des 10 événements les plus récents
- [x] suivi devis du panneau latéral rendu lisible en disposition verticale
- [x] migration 21 limitée au contexte structuré des actions (`target_contact_id`, `reason_code`, `reason_text`)
- [x] tests ajoutés pour le contexte des actions, l’arrêt explicite d’une récurrence et les Contacts liés du workflow
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run package`
- [ ] recette visuelle Windows de la fiche Prospect corrigée

Le workflow CI de la PR #67 est actuellement créé mais reste en file d’attente sur le runner Windows ; aucun résultat de compilation ou de test ne doit être déduit tant qu’aucune étape n’a réellement démarré.

## Phase 0 — Fondation

Validations réelles effectuées sous Windows le 13/09/2026 :

- [x] `npm install`
- [x] `npm run typecheck`
- [x] `npm test`
- [x] `npm run package`
- [x] démarrage réel Electron
- [x] navigation principale
- [x] thèmes AtoumWeb / Noir / Blanc
- [x] workspace local
- [x] sauvegarde manuelle SQLite
- [x] restauration SQLite
- [x] sauvegarde automatique `pre-restore` avant restauration
- [x] correction du redémarrage de restauration en mode développement
- [x] `package-lock.json` versionné
- [ ] fusion finale de la fondation dans `main`

Workspace Windows validé :

- `C:\Users\carlo\Documents\AtoumWeb Manager`
- base : `data\atoumweb-manager.sqlite`
- sauvegardes : `backups\automatic`, `manual`, `pre-migration`, `pre-restore`

## Phase 1 — CRM

Branche : `feature/phase-1-crm`  
PR : #58 (brouillon)

### Fonctionnel

- [x] Organisations / Contacts maîtres
- [x] Prospects et pipeline
- [x] Clients
- [x] contacts multiples + rôles
- [x] conversion Prospect → Client transactionnelle et idempotente
- [x] archivage/réactivation
- [x] recherche globale CRM
- [x] journal d’activité
- [x] Actions / Relances multiples
- [x] prochaine échéance dérivée des actions ouvertes
- [x] Relance → étape `À relancer`
- [x] vue Prospects Pipeline / Historique
- [x] panneaux Prospect/Client à droite avec retour pleine largeur quand fermés
- [ ] deep-links précis Client/Prospect depuis tous les résultats de recherche
- [ ] enrichissement Client avec Projets/Facturation/Temps au fil des phases suivantes

### Validation réelle Windows

- [x] SQLite à 4 migrations
- [x] `npm run typecheck`
- [x] `npm test` — **5 fichiers / 17 tests réussis**
- [x] pipeline / drag-and-drop / piles de cartes
- [x] comportement panneaux latéraux validé visuellement
- [ ] dernier test visuel Actions / Relances multiples + Historique dédié

## Phase 2 — Commercial

Branche : `feature/phase-2-commercial`  
PR : #59 (brouillon)

### Développé

- [x] migration 5 — Catalogue Services / Offres
- [x] migration 6 — Devis
- [x] Services et Offres versionnés
- [x] composition d’une Offre à partir de versions de Services
- [x] inclus / optionnels / quantités
- [x] prix, prix conseillé, modes tarifaires, prérequis, inclusions/exclusions
- [x] version publiée immuable
- [x] création de nouvelle version sans modifier l’historique
- [x] numérotation `DEV-YYYY-001`
- [x] lignes Catalogue et lignes libres
- [x] snapshots autonomes du catalogue et des compositions d’Offres
- [x] remises % / montant / prix imposé / gratuité
- [x] valeur catalogue distincte de la valeur contractuelle
- [x] acompte / solde
- [x] statuts Devis
- [x] acceptation Prospect → Client
- [x] prévisualisation client sans données internes
- [x] génération PDF sous `exports\devis`
- [x] recherche globale Offres / Services / Devis

### Validation restante

- [ ] migration réelle 4 → 6 sous Windows avec sauvegarde `pre-migration`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] parcours visuel complet Catalogue / Devis / PDF
- [ ] trois thèmes

## Phase 3 — Projets & Production

Branche : `feature/phase-3-projects`  
PR : #60 (brouillon, empilée au-dessus de Phase 2)

### Migration 7 — Projets

- [x] modèles de projets
- [x] versions de modèles
- [x] arbre modèle Lot → Module/Page → Tâche → Checklist
- [x] versions publiées figées
- [x] `projects`, `project_nodes`, `project_services`, `project_prerequisites`
- [x] lien unique Devis ↔ Projet
- [x] numérotation `PRO-YYYY-001`
- [x] transformation Devis accepté → Projet idempotente
- [x] copie du snapshot commercial dans le projet
- [x] prérequis issus du devis/catalogue
- [x] projet interne AtoumWeb sans client externe
- [x] progression calculée depuis les tâches obligatoires
- [x] prévention des boucles parent/enfant
- [x] déplacement/réordonnancement transactionnel des nœuds Projet
- [x] arborescence physique Ressources créée automatiquement
- [x] checklist d’avertissement non bloquante avant passage `Terminé`

### Interface Projets

- [x] liste + filtres
- [x] fiche latérale Projet
- [x] création depuis devis accepté
- [x] création Projet interne
- [x] gestion des Modèles de projets
- [x] publication / nouvelle version de modèle
- [x] Résumé
- [x] Plan / Tâches
- [x] déplacement de parent + ordre ↑/↓ dans le plan
- [x] Prérequis
- [x] Ressources
- [x] Bibliothèque technique projet
- [x] Temps
- [x] Commercial
- [x] recherche globale Projet / tâches / Ressources / Bibliothèque
- [x] Dashboard alimenté par les projets actifs

### Migration 8 — Ressources projet

- [x] `file_assets`
- [x] `file_asset_links`
- [x] fichiers physiques conservés hors SQLite
- [x] dossiers `01 Identité` à `07 Archives`
- [x] import de fichiers dans le workspace
- [x] checksum SHA-256
- [x] prévention des doublons par checksum dans un projet
- [x] statut Reçu / À traiter / En cours / Validé / Obsolète
- [x] rôle Client / Réécriture AtoumWeb / Final / Autre
- [x] même fichier lié à plusieurs tâches sans duplication physique
- [x] détection fichier manquant
- [x] relocalisation/restauration d’une ressource
- [x] ouverture fichier / dossier depuis Electron
- [x] interface Ressources raccordée à la fiche Projet
- [x] indexation dans la recherche globale
- [x] tests Ressources écrits
- [ ] galerie miniature images/médias

### Migration 9 — Bibliothèque technique projet

- [x] `technical_items`
- [x] `technical_item_versions`
- [x] `technical_item_assets`
- [x] catégories Header / Footer / Hero / Page / Section / CSS / JS / PHP / ACF / Divi / Woo / Plugin / Config / Note
- [x] contenu Code / JSON / Texte / Référence
- [x] version actuelle
- [x] version stable distincte de la version actuelle
- [x] historique immuable
- [x] liaison aux vraies Ressources du projet
- [x] archivage
- [x] aucun code exécuté automatiquement
- [x] interface Bibliothèque dans la fiche Projet
- [x] `Préparer pour réutilisation` génère un paquet projet sans généralisation automatique
- [x] recherche globale des éléments techniques
- [x] tests versioning / stable / ressources / réutilisation écrits
- [x] schéma déjà extensible à `scope=atoumweb` pour la future Phase 6 sans modifier les projets clients
- [ ] coloration syntaxique avancée / Monaco plus tard
- [ ] captures/aperçus avancés plus tard

### Migration 10 — Timer & sessions de temps

- [x] `time_sessions`
- [x] `time_session_pauses`
- [x] une seule session active globalement garantie par SQLite
- [x] contexte Client / Projet / Tâche
- [x] catégories de temps
- [x] facturable / non facturable
- [x] source Timer / Manuel / Import
- [x] démarrer / pause / reprendre / arrêter
- [x] durée réelle calculée depuis timestamps et pauses
- [x] session active conservée après navigation et fermeture de l’application
- [x] heartbeat du chrono pour mémoriser le dernier point connu
- [x] détection d’une session oubliée après fermeture/redémarrage
- [x] reprise sans compter l’interruption
- [x] arrêt au dernier point connu
- [x] saisie manuelle
- [x] correction d’une session historique terminée
- [x] protection des pauses existantes pendant une correction
- [x] changement d’activité transactionnel : terminer l’ancienne + démarrer la nouvelle au même instant
- [x] synthèse temps total / facturable / non facturable
- [x] filtres Aujourd’hui / Semaine / Mois / Client / Projet / Catégorie / Facturable
- [x] vrai timer global dans le header
- [x] page `Gestion des temps`
- [x] onglet Temps dans la fiche Projet
- [x] temps estimé vs réel + écart dans Projet
- [x] raccourcis Projet/Tâche → timer global prérempli
- [x] Dashboard : temps du mois dérivé des sessions
- [x] tests Timer/pause/reprise/redémarrage/correction/changement d’activité écrits
- [x] doublon d’enregistrement IPC Timer supprimé

### Reste Phase 3 avant validation finale

- [ ] réorganisation/duplication plus complète des nœuds dans les **modèles** de projets
- [ ] galerie miniature images/médias
- [ ] ergonomie avancée Bibliothèque (copie/agrandissement/coloration)
- [ ] validation du cas de référence Cazor
- [ ] validation locale Windows migrations 6 → 10
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] test visuel complet trois thèmes
- [ ] mise à jour finale documentation Phase 3 après validation

## CI GitHub

Le workflow couvre maintenant les branches Fondation / Phase 1 / Phase 2 / Phase 3.

Les runs Phase 3 observés restent **non exploitables** : GitHub crée le job `windows-latest` mais lui attribue `runner_id: 0` et n’exécute aucune étape. Il n’y a donc ni checkout, ni installation, ni typecheck, ni tests. Le statut rouge ne constitue pas un échec du code.

La validation réelle continue donc d’être effectuée localement sur Windows.

## Phases V1 préparées

- **Phase 1 — Socle CRM** : issues #4–#9
- **Phase 2 — Commercial** : #10–#15
- **Phase 3 — Projets & Production** : #16–#23
- **Phase 4 — Interventions, Maintenance & Packs** : #24–#31
- **Phase 5 — Administration & Finance** : #32–#39
- **Phase 6 — Référentiels & Continuité** : #40–#47
- **Phase 7 — Statistiques & Stabilisation V1** : #48–#57

## Règles à ne pas casser

1. Prospect et Client partagent les mêmes Organisations/Contacts ; aucune recopie d’identité.
2. Archivage plutôt que suppression destructive.
3. Conversion Prospect → Client idempotente.
4. Valeur commerciale, valeur contractuelle, facturé, encaissé et dépenses restent distincts.
5. Fichiers lourds hors SQLite ; la base stocke les références et métadonnées.
6. Abby reste la source des factures réglementaires en V1.
7. Bibliothèque projet et Bibliothèque AtoumWeb restent indépendantes.
8. Aucun code de bibliothèque n’est exécuté automatiquement.
9. Une sauvegarde serveur n’est jamais considérée comme une sauvegarde locale.
10. Statistiques et recherche sont dérivées/reconstruisibles.
11. Tous les éléments historiques importants sont journalisés.
12. Une Relance et une Action sont deux objets distincts ; plusieurs peuvent coexister sur un même dossier.
13. Les panneaux latéraux Prospect/Client/Projet restent à droite et les listes reprennent la largeur disponible lorsqu’ils sont fermés.
14. Le temps réel a une seule source : `time_sessions`. Aucun module ne maintient un compteur indépendant.
15. Une version de modèle, de catalogue ou de composant déjà utilisée ne modifie jamais rétroactivement un dossier existant.

## Travail en cours

**Phase 3 — fermeture des derniers écarts fonctionnels avant validation Windows.**

Prochaine validation Windows après stabilisation de la branche : migration vers 10 migrations, `npm run typecheck`, `npm test`, puis parcours Projet / Ressources / Bibliothèque / Timer / Gestion des temps.

## Phase 4 — Validation automatisée du 14/09/2026

Cette entrée actualise le travail en cours décrit plus haut : Phase 4 en gel fonctionnel, validation visuelle Windows restante.
Branche : feature/phase-4-operations — PR #61 conservée en brouillon.
Point de départ distant vérifié : 6d09156.

- [x] Node local 20.19.3 / npm 10.8.2 vérifiés.
- [x] npm run typecheck : aucune erreur.
- [x] npm test : **26 fichiers / 102 tests réussis**, aucun échec ni test désactivé.
- [x] Tests exécutés par le script du dépôt sous Electron 44.3.0 / Node embarqué 24.20.0.
- [x] Correction du tri SQLite des alertes : alias explicite created_at dans le UNION ALL.
- [x] Temps Intervention calculé par TimeService : suppression de la troncature SQL imprécise, mêmes pauses et même arrêt au dernier point connu que le Timer.
- [x] Tests de non-régression des pauses avec millisecondes et de la récupération d'une session oubliée.
- [x] Migrations 1 à 17 : base vierge, ordre, application unique, mises à niveau depuis 4 / 6 / 10, préservation des données sentinelles et d'une session Phase 3, index composite, intégrité SQLite.
- [x] Revue du périmètre : services Opérations, tests et suivi documentaire uniquement ; aucune migration modifiée ou renumérotée.
- [ ] Validation visuelle Windows et migration sur données existantes avec sauvegarde pré-migration.
- [ ] Parcours Intervention / Demande → Intervention / modification et retrait du rattachement / Timer au contexte sauvegardé / persistance après redémarrage.
- [ ] Régressions Opérations / Maintenance / Packs / Incidents / recherche / fiches Client et Projet / trois thèmes.

Aucune donnée du dossier utilisateur Documents\AtoumWeb Manager touchée. Les tests utilisent uniquement des bases en mémoire et des espaces temporaires de test.
Le nouveau test d'index a été corrigé après constat : l'index existant comprend intervention_id puis started_at DESC ; l'assertion contrôle ces deux colonnes et leur ordre.
Gel fonctionnel Phase 4 maintenu. Phase 5 différée, aucun apport de la branche Phase 6, aucune fusion.
Point d'attention manuel : vérifier aussi la fluidité des listes d'interventions avec un historique de temps volumineux, le total utilisant désormais le service de temps commun.

Prochaine action : lancement normal du Manager et parcours du plan docs/PHASE_4_VALIDATION_WINDOWS.md avec les données existantes et sauvegarde pré-migration. Conserver la PR #61 en brouillon ; aucune fusion avant validation Phase 4.


## Stabilisation transverse — issue #65

Branche feature/stabilisation-parcours-metier créée depuis 4f1323a (Phases 1 à 4 validées). Périmètre étendu explicitement par la demande utilisateur : catalogue AtoumWeb, besoins CRM référencés, continuité devis/projet/dashboard, données demo et responsive. Phase 6 non intégrée, Phase 5 non démarrée, aucune fusion.

- [x] Socle propre vérifié : 26 fichiers / 102 tests, typecheck vert.
- [x] Migration 18 ajoutée sans renuméroter 1 à 17 : catalogue AtoumWeb, conditions commerciales, besoins CRM et marquage des lots demo.
- [x] Parcours raccordé : fiche Prospect/Client, devis et conditions, acceptation vers Projet, dashboard et liens profonds.
- [x] Saisies de démonstration identifiables, trois parcours cohérents, sauvegarde obligatoire et purge transactionnelle sélective.
- [x] Responsive, défilement des panneaux et taille des textes harmonisés.
- [x] `npm run typecheck` : aucune erreur.
- [x] `npm test` : **27 fichiers / 113 tests réussis**, aucun échec ni test désactivé.
- [x] `npm run package` : package Electron Windows x64 généré avec succès pendant la stabilisation.
- [ ] Validation visuelle Windows sur un workspace temporaire, puis parcours métier sur données utilisateur uniquement après sauvegarde explicite.

Les tests couvrent les migrations vierges et mises à niveau, les prix confirmés / Sur devis, les besoins multiples, la conversion idempotente, les données vivantes, les snapshots, les lignes de devis atomiques, la création Projet, le dashboard et la purge demo sans suppression des références ni des dossiers réels.

Prochaine action : validation visuelle du parcours complet et des trois thèmes sous Windows. Aucune ouverture du workspace utilisateur sans sauvegarde explicite.
