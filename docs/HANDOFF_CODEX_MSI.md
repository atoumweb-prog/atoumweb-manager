> ## ⚠️ ÉTAT ACTUEL — 29/09/2026 — À LIRE AVANT TOUT
>
> Ce bloc **remplace les anciennes consignes de branche/PR mentionnées plus bas** pour la reprise actuelle. L'historique est conservé volontairement.
>
> **État courant : Lot 6B clos — Sites & pages / composition de Page.**
>
> - Branche de stabilisation : `wip/codex-6b-ui-fix`
> - Dernier HEAD canonique validé après intégration : `3df2168d7a3e662d98f68525550309ea71be0d67`
> - Merge commit de la PR : `3df2168d7a3e662d98f68525550309ea71be0d67`
> - Branche canonique cible : `feature/project-page-compositions-v1`
> - PR de réintégration **#75** : **MERGED** le 29/09/2026 ; branche WIP conservée.
> - **Ne pas fusionner vers `main`**.
>
> **Validation acquise du Lot 6B :**
>
> - recette visuelle réelle validée ;
> - `npm run typecheck` : vert ;
> - harness UI Electron : **65/65** ;
> - suite complète : **53 fichiers / 339 tests, 339/339 réussis** ;
> - `npm run package` : réussi, package **win32 x64** ;
> - après intégration : `npm run typecheck` réussi, harness **65/65**, tests ciblés **35/35** ;
> - migration courante : **49**, aucune nouvelle migration introduite par la stabilisation UX ;
> - aucun changement Bridge pendant la stabilisation 6B.
>
> **Trois corrections transverses intégrées après la première suite complète :**
>
> 1. test legacy des migrations rendu dynamique jusqu'à l'état courant au lieu d'être figé à 38 ;
> 2. test Workflow aligné avec le Builder CGV structuré : `specialTerms` du devis n'est plus supposé contenir automatiquement les conditions catalogue ;
> 3. `DemoService` suit désormais `quote_contract_clauses` pour permettre une purge correcte des scénarios de démonstration.
>
> **Ce que Codex ne doit pas refaire :**
>
> - ne pas reprendre la recette UX 6B depuis zéro ;
> - ne pas modifier les replis, l'atelier Réglages / Code ou le grand écran 75/25 sauf régression démontrée ;
> - ne pas ajouter de migration ;
> - ne pas toucher au dépôt Bridge pour clôturer le 6B ;
> - ne pas repartir de `main`, de la PR #73 ou d'une ancienne branche historique.
>
> **Clôture effectuée :**
>
> - checkout canonique synchronisé au merge commit `3df2168d7a3e662d98f68525550309ea71be0d67` ;
> - typecheck, harness, tests ciblés, suite complète et packaging verts ;
> - Lot 6B consigné comme clos dans `PROJECT_STATUS.md` et `docs/MANAGER_BRIDGE_ROADMAP.md`.
>
> **Après clôture seulement :** reprendre la feuille de route Manager ↔ Bridge avec le Lot 7 (Site / préparation Bridge), puis Lot 8 (retour d'occurrences), puis Lot 9 (assemblage multi-pages / livraison), uniquement après autorisation explicite.
>
# Handoff Codex MSI — AtoumWeb Manager

## Chantier actif — Lot 8A Export Page Manager

- Branche locale empilée : `codex/lot8a-page-export`, basée sur `codex/lot7-blueprint-sites@bfda981bb4243d8138ed862a4e1f9395e7827e6f` ; PR #76 reste ouverte et non fusionnée.
- Nouveau contrat additionnel explicite : `atoumweb_bridge_project_package` schemaVersion 2, `scope=page`, `exportId`, destination Projet/Site/Page.
- Le package projet générique V1 et les contrats Component/Fields/Identity V1 restent inchangés.
- Migration 52 : historique des exports Page avec empreinte et provenance de destination.
- Le package transporte les adaptations locales enregistrées dans l'atelier Page, sans modifier les sources Bibliothèque.
- Validation locale : typecheck réussi ; **14/14 tests ciblés**.
- Aucun commit/push sur le Lot 8A. L'import idempotent et le marqueur Divi nécessitent le dépôt Bridge local confirmé.
- Dépôt Bridge désormais confirmé et synchronisé : `C:\DEV\01_PROJETS\AtoumWeb\atoumweb-bridge`, base 0.8.0 `36d1076`. L'incrément idempotent Page V2 est préparé localement sur `codex/lot8a-idempotent-page-import` en version 0.8.1, sans commit/push.

## Chantier actif — Lot 7 Squelette blueprint Sites / Pages

- Branche locale : `codex/lot7-blueprint-sites`, base canonique `cf747c5855eec90df725861d22375d65f78f12db`.
- Objectif limité : générer les Sites et Pages déclarés par un blueprint avec des clés explicites et une provenance durable.
- Premier incrément local validé par typecheck et **33/33 tests ciblés** après correction du cas historique réel `PRO-2026-001`.
- Configuration des Sites/Pages disponible sur les versions brouillon, recopiée lors d'une nouvelle version ; commande visible de réapplication pour les Projets historiques.
- Migration additive 50 pour les déclarations et liaisons ; migration 51 séparée pour appliquer la compatibilité `web` / `website` aux bases où 50 a déjà été exécutée.
- Un ancien Projet lié à un blueprint sans Site/Page reçoit le blueprint Site/Page canonique selon son type, sans changer son `template_version_id` et sans déduire quoi que ce soit de son nom.
- Cette association par type est uniquement un filet de compatibilité legacy. La cible fonctionnelle est la composition pilotée par les lignes du devis : offre principale comme base, options/prestations comme contributions additives, puis matérialisation du blueprint final du Projet.
- Aucun changement des contrats Manager ↔ Bridge, aucun export Page, aucun Lot 8.
- Ne pas reprendre l'UX 6B. Ne pas fusionner vers `main`.
- Recette réelle validée : 1 Site + 5 Pages, réapplication sans doublon, renommages conservés, ajout manuel conservé ; résultat final 1 Site / 6 Pages.
- Les modifications sont prêtes pour commit, push et PR vers `feature/project-page-compositions-v1`.
- Dernier essai du harness 6B interrompu avant contrôles par Chromium/GPU Windows ; aucune régression renderer rapportée.


## Checkpoint supplémentaire — CGV Builder intégré le 27/09/2026

Le chantier parallèle `feature/quote-cgv-builder-v1` / PR #74 a été réconcilié avec Projet V2 avant de poursuivre les lots Bridge.

À retenir :
- logique CGV / clauses / snapshot contractuel intégrée ;
- UI Builder CGV intégrée ;
- PDF Abby accepté + onglet Contrats Client intégrés ;
- textes brouillons des modules de prestations intégrés ;
- migrations CGV renumérotées **44 / 45 / 46** lors de la convergence ;
- migrations 40 à 43 restent celles du chantier Bridge / Familles / Correspondances / Composition ;
- aucune validation juridique de production n’est implicite ;
- validation locale MSI encore requise après synchronisation.

Avant de lancer l’application sur un workspace déjà utilisé historiquement avec la branche CGV, vérifier la table `schema_migrations` afin d’écarter toute collision d’anciens IDs 40/41/42.

Le prochain chantier d’architecture prévu est :
`Devis accepté → Projet → Site → Page → Composition → occurrences de composants`.


> État partagé au 24/09/2026. À lire avec `AGENTS.md`, `PROJECT_STATUS.md` et le document de phase concerné.

## Branche de travail à utiliser

- Dépôt : `atoumweb-prog/atoumweb-manager`
- Branche de travail active : `feature/project-blueprints-v1`
- PR : **#73 — Projet V2 — Blueprints de production et atelier AtoumWeb**
- Base de la PR : `fix/pre-phase5-commercial-ux`
- Ne pas travailler directement sur `main`.
- Ne pas fusionner la PR #73 tant que la recette du dernier lot n'est pas terminée.

Synchronisation MSI :

```powershell
cd C:\DEV\01_PROJETS\AtoumWeb\atoumweb-manager
git fetch --all --prune
git switch feature/project-blueprints-v1
git pull --ff-only
```

Pour détecter un travail local non poussé avant toute modification :

```powershell
git status -sb
git branch -vv
git log --oneline --decorate --branches --not --remotes
```

Si la dernière commande ne retourne rien, aucun commit local n'attend d'être poussé. Ne pas pousser une ancienne branche uniquement parce qu'elle existe localement.

Contrôle local recommandé :

```powershell
npm run typecheck
npm test
npm run package
C:\DEV\Lanceurs\AtoumWeb-Validation-MSI.cmd
```

Le workspace de validation reste :

`C:\DEV\02_DONNEES\AtoumWeb\Validation-MSI`

Ne jamais utiliser la base Production pour une recette.

## État fonctionnel actuel

Le socle utilisé par l'application contient les phases CRM, Commercial, Projets, Opérations, Référentiels et les correctifs UX validés avant Phase 5. La Phase 5 Administration/Finance reste volontairement différée.

Le chantier actif est **Projet V2 / atelier de production** :

- Devis accepté → Projet avec blueprint de production ;
- snapshot du projet indépendant des futurs changements de modèle ;
- phases / étapes numérotées ;
- phases repliées par défaut ;
- glisser-déposer des étapes ;
- séparation Plan / Fiche redimensionnable ;
- barre latérale globale escamotable et masquée automatiquement en Production ;
- timer rattaché à l'étape ;
- notes et mini-actions par étape ;
- Ressources / Technique / Temps en fenêtre au-dessus de Production ;
- pages renommables directement dans l'arbre ;
- validation d'une phase avec avertissement sur les champs manquants ;
- clôture d'une phase = toutes ses étapes passent en Terminé ;
- undo / redo du travail courant ;
- aide contextuelle désactivable dans Réglages ;
- coffre d'accès projet/étape chiffré par Electron `safeStorage` ;
- couche UI transverse appliquée aux écrans historiques : champs, boutons, onglets, focus, débordements et lisibilité.

## Migrations

La branche Projet V2 porte désormais **36 migrations SQLite**.

La dernière validation complète connue sur MSI avant la passe Catalogue était à **36 fichiers / 177 tests réussis** avec **30 migrations**.

La migration 30 ajoute `project_node_secrets` pour les métadonnées et le ciphertext des accès sécurisés.

La migration 31 ajoute `catalog_versions.nature` pour distinguer la nature courte d’une prestation de sa description détaillée.

La migration 32 rattache un élément de facturation à son PDF client (`invoice_document_id`, référence et date de facture). Le PDF est stocké via le système Documents client dans `03 Factures` ; aucune API Abby n’est utilisée.

La migration 33 ajoute le suivi des dépenses : frais AtoumWeb, rattachement facultatif client/projet, catégorie, fournisseur, montant, TVA, statut, dates, récurrence et justificatif.

La migration 34 ajoute les identités visuelles CRM (`crm_identity_assets`) : logo et favicon d’entreprise, photo/avatar de contact, stockés localement dans le workspace.

La migration 35 ajoute les motifs de pause du timer sur `time_session_pauses` : besoin d’informations, manque de temps, autre urgence ou autre raison, avec note facultative.

La migration 36 ajoute le stockage AtoumWeb Bridge Snapshot V1 : sites, snapshots, pages, occurrences de nœuds, sources, assets, dépendances, relations et registre d’objets SHA-256.

Les mots de passe / clés ne doivent jamais être stockés en clair dans SQLite, les logs ou les documents de suivi.

## Validation

La recette locale précédente a confirmé typecheck/tests verts avant le dernier lot « aide / actions / coffre sécurisé / cohérence UI globale ».

Le **HEAD actuel doit donc être revalidé** sur MSI avec :

- `npm run typecheck`
- `npm test`
- `npm run package`
- lancement du profil Validation-MSI
- vérification des migrations 30, 31, 32, 33, 34, 35 et 36
- test du coffre avec une fausse clé, jamais une vraie
- vérification rapide des anciens écrans après la nouvelle couche UI globale.

## AtoumWeb Bridge Snapshot V1

Le contrat `atoumweb-bridge-snapshot` **1.0.0** est gelé. Le premier snapshot réel d’AtoumWeb.fr a été produit par **AtoumWeb Bridge 0.4.2** et vérifié avant l’implémentation Manager.

Le Manager possède désormais une page **Sites** dédiée et un import V1 séparé de la Bibliothèque AtoumWeb :

- inspection du ZIP avant import ;
- validation du contrat / version / fingerprint profile ;
- vérification des checksums et du `package_fingerprint` ;
- contrôle des objets SHA-256, références, arbres, parents et compteurs ;
- import idempotent par `snapshot_id + package_fingerprint` ;
- conservation des warnings Bridge, notamment `FRONTEND_AUDIT_NOT_ATTACHED` ;
- stockage des payloads dans `workspace/bridge/objects/sha256` et métadonnées en SQLite ;
- copie du ZIP original dans `workspace/bridge/packages` ;
- navigation Site → Snapshot → Page → Structure / Sources / Assets / Dépendances ;
- aperçu texte des payloads en lecture seule : aucun HTML / CSS / JS importé n’est exécuté.

Le premier snapshot réel observé contient **82 pages, 1 507 nœuds, 1 114 sources, 169 assets, 16 dépendances, 3 147 relations et 1 892 objets**. Son statut est `complete_with_warnings`. Les contenus Divi 5 observés restent best-effort tant que Bridge n’annonce pas la capability Divi 5.

Le diff Snapshot A / B et l’attribution historique des `logical_node_id` restent pour le lot suivant, après réception d’un deuxième snapshot réel.

## Phase 7

La branche `feature/phase-7-analytics-v1` / PR #71 existe toujours comme chantier historique d’analytique avancée.

Une première page **Statistiques V1** est désormais intégrée directement dans `feature/project-blueprints-v1` afin de rester cohérente avec le vrai socle Projet V2. Elle dérive ses chiffres des données métier existantes et n’ajoute aucune migration : Vue d’ensemble, Commercial, Projets & temps et Clients, avec filtres mois / trimestre / année / toutes données et comparaison à la période précédente.

La branche Phase 7 historique ne doit pas être fusionnée telle quelle. Elle reste utile pour reprendre plus tard les fonctions non encore intégrées : encaissements/paiements, rentabilité avancée, statistiques par prestation, exports et pilotage approfondi.

## Branches historiques

De nombreuses branches `feature/phase-*`, `feature/atoum-v02-*` et anciennes branches de recette sont encore présentes sur GitHub. Elles servent d'historique mais ne doivent pas être choisies comme nouvelle base de travail.

Avant toute nouvelle branche, partir de la branche fonctionnelle explicitement indiquée dans `PROJECT_STATUS.md`.

## Règles UI désormais transverses

- aucun texte fonctionnel sous 14 px ;
- contrôles lisibles avec fond cohérent avec le thème ;
- pas de champ noir natif en thème clair ;
- champs et boutons dimensionnés selon la densité globale ;
- panneaux et onglets doivent gérer leur propre défilement sans casser toute la page ;
- contenu secondaire accessible à la demande plutôt qu'affiché en permanence ;
- aide contextuelle utile au survol, désactivable ;
- panneau latéral global escamotable ;
- fermeture des fenêtres secondaires par × / clic extérieur / Échap quand le composant le permet ;
- couleur utilisée pour l'état et la progression, pas pour surcharger l'écran.

## Règle de coordination ChatGPT / Codex

ChatGPT pilote actuellement la conception et les modifications de la branche Projet V2. Codex MSI peut auditer, tester, diagnostiquer ou appliquer un lot explicitement demandé, mais ne doit pas lancer une refonte parallèle ni repartir d'une branche historique sans instruction.
## Recette visuelle continue

> Je vais continuer à t’envoyer des captures page par page. Prends-les comme une recette visuelle continue et garde les corrections cohérentes avec les précédentes.

## Facturation sans API Abby

- Abby reste l’outil qui produit la facture réglementaire.
- AtoumWeb Manager ne dépend d’aucune API Abby payante.
- Le Manager prépare les éléments à facturer et conserve le suivi interne.
- Une facture devient **Facturée** dans le Manager lorsque son PDF est importé et rattaché.
- Le PDF est classé dans les Documents du client, catégorie Factures (`03 Factures`), et reste ouvrable depuis Facturation.
- Les packs d’heures payants alimentent automatiquement la file des éléments à facturer.

## Dépenses et frais engagés

- page Dépenses dédiée, sans logiciel comptable externe ;
- dépenses ponctuelles ou récurrentes ;
- rattachement facultatif à un client et/ou un projet ;
- statuts : Prévu / Engagé / Payé / Annulé ;
- catégories métier : hébergement, domaine, logiciel, licence, sous-traitance, publicité, déplacement, matériel, banque, taxe, bureau, autre ;
- montant TTC et TVA facultative ;
- date de dépense, échéance, date de paiement, prochaine échéance ;
- justificatif PDF/image importable et ouvrable depuis la fiche ;
- justificatif client classé sous `Documents/09 Depenses`, avec sous-dossier projet si disponible ;
- dashboard : engagé ce mois, à payer, payé ce mois, récurrent mensuel équivalent.

## Identité visuelle CRM & thème Noir

- le thème Noir doit conserver les codes couleur métier sans utiliser de fonds pastel clairs ;
- Prospection et Clients utilisent des teintes sémantiques recalculées sur les surfaces sombres ;
- une entreprise peut recevoir un **logo** et une **favicon** ;
- un contact peut recevoir une **photo/avatar** ;
- ordre d’affichage : logo entreprise → favicon → avatar du contact → initiales ;
- les images sont copiées dans le workspace sous `crm-identites/` et les aperçus passent par l’API locale du Manager ;
- conversion Prospect → Client : l’identité visuelle est conservée automatiquement car elle appartient à l’entreprise/contact, pas au statut commercial ;
- URL CRM : saisir `atoumweb.fr` suffit ; le backend stocke `https://atoumweb.fr`. Un `http://` saisi explicitement est conservé.

## Ergonomie transverse — ateliers liste / fiche

- Facturation et Dépenses utilisent les pictos SVG communs, une liste compacte lorsqu’une fiche est ouverte, un splitter redimensionnable, un mode fiche agrandie et un comportement responsive.
- Bibliothèque AtoumWeb et Sauvegardes utilisent désormais la même logique : liste à gauche, barre centrale redimensionnable, fiche à droite, agrandissement `⛶`, réduction, fermeture explicite et empilement responsive sur petite largeur.
- Sur Bibliothèque et Sauvegardes, appliquer la règle typographique commune : titre / libellé / champ en gras, valeur ou contenu saisi en poids normal, commentaire discret, statut et bouton semi-gras.
- Annuaire suit la même logique liste / fiche : Organisations et Contacts, splitter redimensionnable, agrandissement, responsive, identité visuelle et accès direct aux fiches Client / Prospect liées.
- Statistiques reste une page de lecture compacte : pictos, KPI, graphiques CSS simples et onglets courts ; les chiffres restent dérivés des sources métier et ne deviennent jamais une nouvelle source de vérité.

## Derniers correctifs de recette — 23/09/2026

- une protection renderer globale a été ajoutée : si React rencontre une erreur non interceptée, le Manager affiche maintenant l’erreur exacte au lieu d’une fenêtre noire vide ;
- la page Clients possède une barrière d’erreur dédiée, calquée sur la protection déjà validée de la fenêtre Référence Prospect ;
- le thème Noir conserve désormais des teintes métier CRM plus contrastées ;
- la page **Gestion des temps** a planté pendant la recette avec `ReferenceError: OperationIcon is not defined` dans `TimePage.tsx` après le remplacement des anciens symboles par les nouveaux pictos SVG ;
- correctif appliqué au commit `b8c5af96` : import explicite de `OperationIcon` dans `TimePage.tsx` ;
- l’utilisateur a confirmé juste après relance que **Gestion des temps fonctionne de nouveau** ;
- ce retour est une validation visuelle ciblée, pas une validation complète `typecheck / tests / package`.

## Timer Intervention / Incident

- une session démarrée depuis une Intervention conserve réellement `interventionId` ;
- démarrer/reprendre le timer place l’Intervention en **En cours** ;
- arrêter le timer d’une Intervention ouvre un choix **travail résolu / mettre en pause** ;
- une pause demande un motif métier et l’enregistre dans l’historique du temps ;
- besoin d’informations → Intervention en **En attente client** ; autres interruptions → **Bloquée** ;
- reprise du timer → retour **En cours** ;
- incident résolu → timer arrêté, date de résolution renseignée, statut **À valider**, puis ouverture de **Conclusion & rapport de fin** ;
- la conclusion réutilise Cause / Diagnostic / Solution / Suivi ; la Solution est obligatoire pour clôturer l’incident ;
- les données de conclusion servent de base au futur document/PDF de fin dans Documents & Contrats.
