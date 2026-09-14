# AtoumWeb Manager — Suivi du projet

> Source de vérité partagée entre AtoumWeb, ChatGPT et Codex. À mettre à jour après chaque étape significative.

## État général

- **Version cible** : V1
- **Dépôt** : `atoumweb-prog/atoumweb-manager`
- **Branche stable** : `main`
- **Fondation** : `foundation/electron-react-sqlite` — PR #3
- **Phase 1** : `feature/phase-1-crm` — PR #58 (brouillon)
- **Phase 2** : `feature/phase-2-commercial` — PR #59 (brouillon)
- **Phase 3** : `feature/phase-3-projects` — PR #60 (brouillon, base Phase 2)
- **Phase 4** : `feature/phase-4-operations` — PR #61 (brouillon) — développement V1 terminé, validation Windows requise
- **Phase 5** : différée volontairement ; les contrats ne sont pas encore suffisamment finalisés
- **Phase 6 active** : `feature/phase-6-referentials` — PR #62 (brouillon, base Phase 4)
- **Head Phase 4 à valider** : `186f95d5e5dc6223834c27e64d8dd5bc6f55721d`
- **Migrations sur la branche Phase 6** : 20
- **Principe directeur** : une donnée métier possède une source unique ; les autres écrans la référencent sans duplication.

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
- [x] schéma déjà extensible à `scope=atoumweb` pour la Phase 6 sans modifier les projets clients
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

## Phase 4 — Interventions, Maintenance & Packs

Branche : `feature/phase-4-operations`  
PR : #61 (brouillon)  
Head gelé pour validation Windows : `186f95d5e5dc6223834c27e64d8dd5bc6f55721d`

### État

- [x] développement V1 terminé
- [x] Demandes → Interventions
- [x] rattachement Intervention → Projet → Module/Page/Tâche
- [x] rattachement modifiable ou retirable après création
- [x] Timer reprend automatiquement le contexte actuel de l’Intervention
- [x] maintenance / packs d’heures / dépassements / rapports intégrés au socle Phase 4
- [ ] validation Windows complète
- [ ] `npm run typecheck` local sur le head final
- [ ] `npm test` local sur le head final

**Règle actuelle : ne plus ajouter de fonction Phase 4 avant la validation Windows.**

## Phase 5 — Administration & Finance

**Différée volontairement au 14/09/2026.**

Motif : les contrats AtoumWeb ne sont pas encore suffisamment finalisés ; seul le contrat Site vitrine est actuellement prêt. La Phase 5 reste dans la V1 mais ne bloque pas le développement de la Phase 6.

Les liens Phase 6 → Dépenses / Abonnements seront ajoutés ultérieurement lors de la reprise de la Phase 5.

## Phase 6 — Référentiels & Continuité

Branche : `feature/phase-6-referentials`  
PR : #62 (brouillon, base `feature/phase-4-operations`)  
Parent : #40

### Phase 6A — Bibliothèque AtoumWeb (#41)

- [x] branche Phase 6 isolée du head Phase 4 à valider
- [x] réutilisation de `technical_items` / `technical_item_versions` sans créer une seconde source de vérité
- [x] migration 18 : statut de réutilisation + origine Bibliothèque projet facultative
- [x] migration 19 : catégories dédiées Bibliothèque AtoumWeb
- [x] migration 20 : captures / aperçus / sources / fichiers globaux liés à une version
- [x] scope `atoumweb`
- [x] statuts `ready` / `adapt` / `reference`
- [x] catégories Headers / Footers / Heroes / Pages / Sections / Formulaires / Galeries / Carrousels / Navigation / CSS / JS / PHP / WooCommerce / ACF / Divi / App / Notes
- [x] tags / description / origine projet facultative
- [x] versions immuables + version courante
- [x] version stable indépendante de la version courante
- [x] archivage / réactivation
- [x] journal d’activité
- [x] filtres recherche / catégorie / statut / archives
- [x] service backend dédié `AtoumWebTechnicalLibraryService`
- [x] service assets dédié `AtoumWebTechnicalAssetService`
- [x] stockage physique global `bibliotheque-atoumweb/` indépendant des dossiers clients
- [x] checksum anti-doublon + détection de fichier manquant
- [x] API IPC / preload / renderer dédiée
- [x] écran `Bibliothèque AtoumWeb` branché dans la navigation
- [x] création de composant et de nouvelles versions depuis l’interface
- [x] édition complète des métadonnées depuis l’interface
- [x] gestion des captures / aperçus / sources / fichiers par version
- [x] recherche globale nom / description / tags / notes / contenu technique
- [x] ouverture directe de la fiche Bibliothèque depuis la recherche globale
- [x] reconstruction CRM limitée aux documents CRM afin de préserver les index des autres modules
- [x] tests écrits sur versioning, stable, filtres, indépendance Projet ↔ AtoumWeb, recherche et assets
- [ ] validation locale TypeScript / tests / Windows

### Phase 6B — Préparer pour réutilisation (#42)

- [x] socle Phase 3 existant : action `Préparer pour réutilisation`, choix version stable/courante, manifeste JSON, journal d’activité
- [ ] transformer ce manifeste en vrai paquet de travail indépendant
- [ ] copier code / JSON et fichiers sources réels dans le paquet
- [ ] ajouter notes d’adaptation explicites
- [ ] création volontaire d’un composant AtoumWeb depuis le paquet, jamais automatique
- [ ] cas de référence Cazor Galerie véhicules → Galerie dynamique ACF
- [ ] tests indépendance / origine du workflow complet

### Règles Phase 6 confirmées

1. Un composant AtoumWeb ne modifie jamais automatiquement un composant ou un projet client existant.
2. L’origine Projet est une traçabilité, jamais un lien de mise à jour automatique.
3. Les catégories globales sont mappées vers le socle technique existant sans modifier le `CHECK` historique des éléments Projet.
4. Aucun code de bibliothèque n’est exécuté automatiquement.
5. Les assets globaux sont copiés dans `bibliotheque-atoumweb/` et ne dépendent jamais physiquement d’un `file_asset` client.
6. La reconstruction d’un index spécialisé ne doit pas effacer les index des autres modules.

### Ordre de développement restant

1. validation locale #41 en même temps que la prochaine passe Windows ;
2. #42 : Préparer pour réutilisation / import-export assisté ;
3. #43 : Monaco / JSON / previews ;
4. #44 : sauvegardes métier / emplacements / vérification ;
5. #45 : rappels / versions stables / lien Interventions ;
6. #46 : Annuaire interne ;
7. #47 : validation complète Phase 6.

## CI GitHub

Le workflow couvre les branches jusqu’à Phase 4 et les pull requests ciblant ces branches. La PR Phase 6 #62, basée sur Phase 4, déclenche donc la CI.

Les runs observés restent **non exploitables** : GitHub crée le job `windows-latest` mais lui attribue `runner_id: 0` et n’exécute aucune étape (`steps: []`). Il n’y a donc ni checkout, ni installation, ni typecheck, ni tests. Le statut rouge ne constitue pas un échec du code.

La validation réelle continue donc d’être effectuée localement sur Windows.

## Phases V1 préparées

- **Phase 1 — Socle CRM** : issues #4–#9
- **Phase 2 — Commercial** : #10–#15
- **Phase 3 — Projets & Production** : #16–#23
- **Phase 4 — Interventions, Maintenance & Packs** : #24–#31
- **Phase 5 — Administration & Finance** : #32–#39 — différée
- **Phase 6 — Référentiels & Continuité** : #40–#47 — active
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
16. La Phase 5 peut être différée sans bloquer la Bibliothèque et les Sauvegardes Phase 6 ; seuls ses liens financiers restent différés.

## Travail en cours

**Phase 6B — Préparer pour réutilisation (#42).**

La Phase 4 reste gelée sur `186f95d…` en attente de validation Windows. La Phase 6A est fonctionnellement développée mais reste ouverte jusqu’aux vrais tests TypeScript/Windows. Les nouveaux développements continuent exclusivement sur PR #62.