# Handoff Codex MSI — AtoumWeb Manager

> État partagé au 22/09/2026. À lire avec `AGENTS.md`, `PROJECT_STATUS.md` et le document de phase concerné.

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

La branche Projet V2 porte désormais **35 migrations SQLite**.

La dernière validation complète connue sur MSI avant la passe Catalogue était à **36 fichiers / 177 tests réussis** avec **30 migrations**.

La migration 30 ajoute `project_node_secrets` pour les métadonnées et le ciphertext des accès sécurisés.

La migration 31 ajoute `catalog_versions.nature` pour distinguer la nature courte d’une prestation de sa description détaillée.

La migration 32 rattache un élément de facturation à son PDF client (`invoice_document_id`, référence et date de facture). Le PDF est stocké via le système Documents client dans `03 Factures` ; aucune API Abby n’est utilisée.

La migration 33 ajoute le suivi des dépenses : frais AtoumWeb, rattachement facultatif client/projet, catégorie, fournisseur, montant, TVA, statut, dates, récurrence et justificatif.

La migration 34 ajoute les identités visuelles CRM (`crm_identity_assets`) : logo et favicon d’entreprise, photo/avatar de contact, stockés localement dans le workspace.

La migration 35 ajoute les motifs de pause du timer sur `time_session_pauses` : besoin d’informations, manque de temps, autre urgence ou autre raison, avec note facultative.

Les mots de passe / clés ne doivent jamais être stockés en clair dans SQLite, les logs ou les documents de suivi.

## Validation

La recette locale précédente a confirmé typecheck/tests verts avant le dernier lot « aide / actions / coffre sécurisé / cohérence UI globale ».

Le **HEAD actuel doit donc être revalidé** sur MSI avec :

- `npm run typecheck`
- `npm test`
- `npm run package`
- lancement du profil Validation-MSI
- vérification des migrations 30, 31, 32, 33, 34 et 35
- test du coffre avec une fausse clé, jamais une vraie
- vérification rapide des anciens écrans après la nouvelle couche UI globale.

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
